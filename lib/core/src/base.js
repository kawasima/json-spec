const g = require('./gen');

class Invalid {
  toString() {
    return "INVALID";
  }
}

const INVALID = new Invalid();

function gensub(specOrFunc, overrides, path, rmap, form) {
  const spec = specize(specOrFunc);
  const generator = spec.gen(overrides, path, rmap);
  if (generator) {
    return g.suchThat(x => isValid(spec, x), generator, 100);
  } else {
    throw(`Unable to construct gen at ${path}`);
  }
}

class Spec {
  constructor(gfn) {
    this.gfn = gfn;
    this.name = null;
  }

  withName(name) {
    this.name = name;
    return this;
  }
  withGen(gfn) {
    this.gfn = gfn;
    return this;
  }
}

class ScalarSpec extends Spec {
  constructor(form, pred, gfn, cpred) {
    super(gfn);
    this.form = form;
    this.pred = pred;
    this.cpred = cpred;
  }

  conform(x) {
    let ret;
    if (this.pred instanceof Array) {
      ret = this.pred.includes(x);
    } else {
      ret = this.pred.call(this, x);
    }
    return this.cpred ? ret : ret ? x : INVALID;
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
    const generators = {};
    for (const k in this.predObj) {
      generators[k] = gensub(this.predObj[k], overrides, [...path, k], rmap, this.predObj[k]);
    }
    return g.genObject(generators);
  }

  explain(path, via, in_, x) {
    if (typeof x !== 'object') {
      return [{path, via, pred: (x) => x === 'object', val: x, in: in_}];
    }
    return null;
  }
}


function specize(spec) {
  if (spec instanceof Spec) {
    return spec;
  } else {
    return new ScalarSpec(spec, spec, null, null);
  }
}

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

module.exports = {
  conform,
  and,
  array,
  object,
  isValid,
  specize,
  gen,
  withGen,
  spec,
  INVALID,
};
