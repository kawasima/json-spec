const g = require('./gen');

class Invalid {
  toString() {
    return "INVALID";
  }
}

const INVALID = new Invalid();

/**
 * Generate values
 *
 * @param {function} specOrFunc
 * @param {function} overrides
 * @param {Array}    path
 * @param {Object}   rmap
 * @param {Object}   form
 */
function gensub(specOrFunc, overrides, path, rmap, form) {
  const spec = specize(specOrFunc);
  const generator = spec.gen(overrides, path, rmap);
  if (generator) {
    return g.suchThat(x => isValid(spec, x), generator, 100);
  } else {
    throw(`Unable to construct gen at ${path}`);
  }
}

/**
 * Class representing a spec.
 */
class Spec {
  constructor(gfn) {
    this.gfn = gfn;
    this.name = null;
  }

  /**
   * @param {any} val
   */
  conform(val) {
    throw new Error('Not Implemented');
  }

  /**
   * Generate a value that conforms the spec.
   * @param {any}    overrides
   * @param {Array}  path
   * @param {Object} rmap - recursive counter map
   */
  gen(overrides, path, rmap) {
    throw new Error('Not Implemented');
  }

  /**
   * Explain the violation of the spec.
   * @param {array} path
   * @param {array} via
   * @param {array} in
   * @param {any}   val
   */
  explain(path, via, in_, val) {
    throw new Error('Not Implemented');
  }

  /**
   * Name the spec.
   * @param {string} name - The name of the spec.
   */
  withName(name) {
    this.name = name;
    return this;
  }

  /**
   * Add a generation function.
   * @param {funciton} gfn - The generator function.
   */
  withGen(gfn) {
    this.gfn = gfn;
    return this;
  }
}

function dt(pred, x, form, cpred) {
  if (!pred) return x;

  return conform(pred, x);
}

function explainPredList(forms, preds, path, via, in_, x) {
  let ret = x;
  for (let i = 0; i < preds.length; i++) {
    const nret = dt(preds[i], ret, forms[i]);
    if (nret === INVALID) {
      return specize(preds[i]).explain(path, via, in_, ret);
    }
    ret = nret;
  }
  return null;
}

class ScalarSpec extends Spec {
  constructor(form, pred, gfn, cpred) {
    super(gfn);
    this.form = form;
    if (Array.isArray(pred)) {
      this.pred = (x) => pred.includes(x);
      if (!this.gfn) {
        this.gfn = () => g.elements(pred);
      }
    } else if (pred instanceof RegExp) {
      this.pred = (x) => pred.test(x);
      if (!this.gfn) {
        this.gfn = () => g.regex(pred);
      }
    } else if (typeof(pred) === 'function') {
      this.pred = pred;
    } else {
      this.pred = (x) => pred === x;
      if (!this.gfn) {
        this.gfn = () => (rnd, size) => pred;
      }
    }
    this.cpred = cpred;
  }

  conform(x) {
    const ret = this.pred.call(this, x);
    return this.cpred ? ret : (ret ? x : INVALID);
  }

  explain(path, via, in_, x) {
    if (this.conform(x) === INVALID) {
      return [{
        path: path,
        pred: this.form,
        val:  x,
        via:  via,
        'in': in_
      }];
    }
    return null;
  }

  gen() {
    return this.gfn ? this.gfn() : g.genForPred(this.pred)
  }
}

class AndSpec extends Spec {
  constructor(forms, preds, gfn) {
    super(gfn);
    this.forms = forms;
    this.preds = preds;
    this.specs = preds.map(x => specize(x))
  }

  conform(x) {
    let ret;
    for(let i=0; i < this.specs.length; i++) {
      ret = conform(this.specs[i], x);
      if (ret === INVALID) {
        return INVALID;
      }
    }
    return ret;
  }

  gen(overrides, path, rmap) {
    return this.gfn ? this.gfn() : gensub(this.preds[0], overrides, path, rmap, this.forms[0]);
  }

  explain(path, via, in_, x) {
    return explainPredList(this.forms, this.preds, path, via, in_, x);
  }
}

class OrSpec extends Spec {
  constructor(forms, preds, gfn) {
    super(gfn);
    this.forms = forms;
    this.preds = preds;
    this.specs = preds.map(x => specize(x))
  }

  conform(x) {
    let ret;
    for(let i=0; i < this.specs.length; i++) {
      ret = conform(this.specs[i], x);
      if (ret !== INVALID) {
        return ret;
      }
    }
    return INVALID;
  }

  gen(overrides, path, rmap) {
    if (this.gfn && typeof(this.gfn) === 'function') return this.gfn();

    const forms = this.forms;
    const gs = this.preds.map((pred, i) => [pred, forms[i]]);
    return g.oneOf(gs.map(([pred, form]) => gensub(pred, overrides, /*TODO*/path, rmap, form)));
  }

  explain(path, via, in_, x) {
    if (this.conform(x) === INVALID) {
      const ret = [];
      for (let i = 0; i < this.specs.length; i++) {
        if (this.specs[i].conform(x) === INVALID) {
          ret.push(this.specs[i].explain(path, via, in_, x));
        }
      }
      return explainPredList(this.forms, this.preds, path, via, in_, x);
    }
    return null;
  }
}

class ArraySpec extends Spec {
  constructor(form, pred, {count, maxCount, minCount, distinct = false, genMax = 20}, gfn) {
    super(gfn);
    this.form = form;
    this.pred = pred;
    this.spec = specize(pred);
    this.count = count;
    this.distinct = distinct;
    this.maxCount = maxCount;
    this.minCount = minCount;
    this.genMax = genMax;
  }

  conform(x) {
    if (!Array.isArray(x)) return INVALID;
    if (this.count && this.count !== x.length) return INVALID;
    if ((this.minCount || this.maxCount) &&
        (((this.minCount || 0) > x.length)
         ||
         ((this.maxCount || Number.MAX_VALUE) < x.length))) return INVALID;
    if (this.distinct & x.length > 0 && (new Set(x)).size !== x.length) return INVALID;

    for (let i=0; i<x.length; i++) {
      const cv = this.spec.conform(x[i]);
      if (cv === INVALID) {
        return INVALID;
      }
    }
    return x;
  }

  gen(overrides, path, rmap) {
    if (this.gfn) return this.gfn();
    const pgen = gensub(this.pred, overrides, path, rmap, this.form);
    if (this.distinct) {
      return this.count ?
        g.vectorDistinct(pgen, {numElement: this.count, maxTries: 100})
      :
      g.vectorDistinct(pgen, {
        minElements: this.minCount || 0,
        maxElements: this.maxCount || Math.max(this.genMax, 2* (this.minCount || 0)),
        maxTries: 100
      });
    } else if (this.count) {
      return g.vector(pgen, this.count);
    } else if (this.minCount || this.maxCount) {
      return g.vector(pgen, (this.minCount || 0), (this.maxCount || Math.max(this.genMax, 2 * (this.minCount || 0))));
    } else {
      return g.vector(pgen, 0, this.genMax);
    }
  }

  explain(path, via, in_, x) {
    if (!Array.isArray(x)) {
      return [{path, via, pred: Array.isArray, val: x, in: in_}];
    }

    if (this.count && this.count !== x.length) {
      const count = this.count;
      return [{path, via, val:x, pred: (v) => count === v.length, in: in_}];
    }

    if ((this.minCount || this.maxCount) &&
        (((this.minCount || 0) > x.length)
         ||
         ((this.maxCount || Number.MAX_VALUE) < x.length))
       ) {
      const [ minCount, maxCount] = [ this.minCount || 0, this.maxCount || Number.MAX_VALUE];
      return [{path, via, val:x,
               pred: (v) => minCount < v.length && v.length < maxCount,
               'in': in_}];
    }

    if (this.distinct & x.length > 0 && (new Set(x)).size !== x.length) {
      return [{path, via, val: x,
               pred: v => (new Set(v)).size === v.length,
               'in': in_}];
    }

    const explains = [];
    for (let i = 0; i < x.length; i++) {
      const ret = this.spec.explain(
        path,
        via,
        [...in_, i],
        x[i]
      );
      if (ret) {
        Array.prototype.push.apply(explains, ret);
      }
    }
    return explains;
  }
}

class ObjectSpec extends Spec {
  constructor({
    required, optional,
    keysPred,
    gfn
  } = {}) {
    super(gfn);
    this.required = required || {};
    this.optional = optional || {};
    this.keysPred = keysPred;
  }

  conform(obj) {
    if (!this.keysPred(obj)) {
      return INVALID;
    }

    for(let k in obj) {
      const pred = this.optional[k] || this.required[k];
      if (pred) {
        const cv = conform(pred, obj[k]);
        if (cv === INVALID) return INVALID;
      }
    }
    return obj;
  }

  gen(overrides, path, rmap) {
    if (this.gfn) return this.gfn();
    const requiredGenerators = {};
    for (const k in this.required) {
      requiredGenerators[k] = gensub(
        this.required[k], overrides, [...path, k], rmap, this.required[k]);
    }

    const optionalGenerators = {};
    for (const k in this.optional) {
      optionalGenerators[k] = gensub(
        this.optional[k], overrides, [...path, k], rmap, this.optional[k]);
    }
    return g.genObject(requiredGenerators, optionalGenerators);
  }

  explain(path, via, in_, x) {
    if (typeof x !== 'object') {
      return [{path, via, pred: (x) => x === 'object', val: x, in: in_}];
    }
    const explains = [];
    for (const k in this.required) {
      if (!Object.keys(x).includes(k)) {
        explains.push({
          path: [...path, k],
          via,
          pred: (x) => x !== undefined,
          reason: `key ${k} required`,
          val: undefined,
            in: [...in_, k]});
        continue;
      }
      const expl = this.required[k]
            .explain([...path, k],
                     via,
                     [...in_, k],
                     x[k]);
      if (expl) {
        Array.prototype.push.apply(explains, expl);
      }
    }

    for (const k in this.optional) {
      if (!Object.keys(x).includes(k)) continue;
      const expl = this.optional[k]
            .explain([...path, k],
                     via,
                     [...in_, k],
                     x[k]);
      if (expl) {
        Array.prototype.push.apply(explains, expl);
      }
    }

    return explains;
  }
}

class TupleSpec extends Spec {
  constructor(forms, preds, gfn) {
    super(gfn);
    this.forms = forms;
    this.preds = preds;
    this.specs = preds.map(v => specize(v));
    this.cnt = preds.length;
  }

  conform(x) {
    if (!x || !Array.isArray(x) || x.length !== this.cnt) return INVALID;

    for(let i = 0; i < this.cnt; i++) {
      if (conform(this.specs[i], x[i]) === INVALID) {
        return INVALID;
      }
    }
    return ret;
  }

  gen(overrides, path, rmap) {
  }

  explain(path, via, in_, x) {
    if (!Array.isArray(x)) {
      return [{ path, pred: Array.isArray, via, in: in_, val: x}];
    }

    if (x.length !== this.cnt) {
      return [{ path,
                pred: (x) => x.length === this.preds.length,
                via, in: in_, val: x
              }];
    }

    const results = [];
    for (let i = 0; i < this.cnt; i++) {
      const ret = this.specs[i].explain(
        [...path, i],
        via,
        [...in_, i],
        x[i]
      );
      if (ret) {
        Array.prototype.push.apply(results, ret);
      }
    }
    return results;
  }
}

class NullableSpec extends Spec {
  constructor(form, pred, gfn) {
    super(gfn);
    this.spec = specize(pred, form);
  }

  conform(x) {
    // null or undefined
    return x == null ? null : this.spec.conform(x);
  }

  gen(overrides, path, rmap) {
    if (this.gfn) {
      return this.gfn();
    } else {
      return g.frequency([
        [1, (rnd, size) => null],
        [9, gensub(this.spec, overrides, path, rmap, this.form)]
      ]);
    }
  }

  explain(path, via, in_, x) {
    if (x != null && this.spec.conform(x) === INVALID) {
      return this.spec.explain(path, via, in_, x);
    }
    return null;
  }
}

/**
 *
 */
function specize(spec, form) {
  if (spec instanceof Spec) {
    return spec;
  } else {
    if (!form) form = spec;
    return new ScalarSpec(form, spec, null, null);
  }
}

/**
 * Create a spec from the given predicate or spec.
 */
function spec(form, opts = {}) {
  if (form) {
    if (form instanceof Spec) {
      if (opts['gen']) {
        form.withGen(opts['gen']);
      }
      return form;
    } else {
      return new ScalarSpec(form, form, opts['gen'], null);
    }
  }
  return null;
}

function and(...preds) {
  return new AndSpec(preds, preds, null);
}

function or(...preds) {
  return new OrSpec(preds, preds, null);
}

function array(pred, opts={}) {
  return new ArraySpec(pred, pred, opts);
}

function object({required, optional, gen} = {}) {
  const keysPred = (x) => typeof x === 'object'
        && Object.keys(required || {}).every(k => x.hasOwnProperty(k));
  return new ObjectSpec({
    required,
    optional,
    keysPred,
    gfn: gen
  });
}

function tuple(...preds) {
  return new TupleSpec(preds, preds);
}

function nullable(pred) {
  return new NullableSpec(pred, pred, null);
}

function conform(spec, x) {
  return specize(spec).conform(x);
}

function isValid(spec, x) {
  const specized = specize(spec);
  return INVALID !== conform(specized, x);
}

function gen(spec, overrides) {
  return gensub(spec, overrides, [], {recursionLimit: 0}, spec);
}

function withGen(specOrFunc, genFn) {
  const spec = specize(specOrFunc);
  spec.withGen(genFn);
  return spec;
}

function isSpec(specOrObj) {
  return specOrObj instanceof Spec;
}

module.exports = {
  conform,
  and,
  or,
  array,
  object,
  tuple,
  nullable,
  isValid,
  isSpec,
  specize,
  gen,
  withGen,
  spec,
  INVALID,
};
