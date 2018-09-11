const g = require('./spec/gen');

class Invalid {
  toString() {
    return "INVALID";
  }
}
const INVALID = new Invalid();


function Spec(form, pred, gfn, cpred) {
  this.form = form;
  this.pred = pred;
  this.gfn = gfn;
  this.cpred = cpred;
}

Spec.prototype = {
  conform: function(x) {
    const ret = this.pred.call(this, x);
    return this.cpred ? ret : ret ? x : INVALID;
  },
  explain: function(path, via, in_, x) {
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
  },
  gen: function() {
    return this.gfn ? this.gfn() : g.genForPred(this.pred)
  },
  withGen: function(gfn) {
    this.gfn = gfn;
  }
}


function specImpl(form, pred, gfn, cpred) {
  return new Spec(form, pred, gfn, cpred);
}

function specize(spec) {
  if (spec instanceof Spec) {
    return spec;
  } else {
    return specImpl(spec, spec);
  }
}

function gensub(specOrFunc, overrides, path, rmap, form) {
  const spec = specize(specOrFunc);
  const generator = spec.gen(overrides, path, rmap);
  if (generator) {
    return g.suchThat(x => isValid(spec, x), generator, 100);
  } else {
    throw(`Unable to construct gen at ${path}`);
  }
}

function dt(pred, x, form, cpred) {

}

class AndSpec extends Spec {
  constructor(forms, preds, gfn) {
    super();
    this.forms = forms;
    this.preds = preds;
    this.specs = preds.map(x => specize(x))
    this.gfn = gfn;
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
}

class ArraySpec extends Spec {
  constructor(form, pred, {maxCount, minCount, genMax = 20}, gfn) {
    super();
    this.form = form;
    this.pred = pred;
    this.spec = specize(pred);
    this.maxCount = maxCount;
    this.minCount = minCount;
    this.genMax = genMax;
    this.gfn = gfn;
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
    if (this.count) {
      return g.vector(pgen, this.count);
    } else if (this.minCount || this.maxCount) {
      return g.vector(pgen, (this.minCount || 0), (this.maxCount || Math.max(this.genMax, 2 * (this.minCount || 0))));
    } else {
      return g.vector(pgen, 0, this.genMax);
    }
  }
}

class ObjectSpec extends Spec {
  constructor(predObj) {
    super();
    this.predObj = predObj;
  }

  conform(obj) {
    for(let k in this.predObj) {
      if (!obj.hasOwnProperty(k)) return INVALID;
    }
    if (typeof(obj) !== 'object') return INVALID;
    for(let k in obj) {
      const pred = this.predObj[k];
      const cv = conform(pred, obj[k]);
      if (cv === INVALID) return INVALID;
    }
    return obj;
  }

  gen(overrides, path, rmap) {
    if (this.gfn) return this.gfn();
    const generators = {};
    for (const k in this.predObj) {
      generators[k] = gen(this.predObj[k]);
    }
    return g.genObject(generators);
  }
}

function and(...preds) {
  return new AndSpec(preds, preds, null);
}

function array(pred, opts={}) {
  return new ArraySpec(pred, pred, opts);
}

function object(predObj) {
  return new ObjectSpec(predObj);
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

function explainData_(spec, path, via, in_, x) {
  const problems = specize(spec).explain(path, via, in_, x);
  return {
    problems: problems,
    spec: spec,
    value: x
  };
}

function explainData(spec, x) {
  explainData_();
}

function explainPrinter(ed) {
}

function explain(spec, x) {
  explainPrinter(explainData(spec, x));
}

function withGen(specOrFunc, genFn) {
  const spec = specize(specOrFunc);
  spec.withGen(genFn);
  return spec;
}

module.exports = {
  conform,
  explain,
  and,
  array,
  object,
  isValid,
  specize,
  gen,
  withGen,
  INVALID,
};
