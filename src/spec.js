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
}

function and(...preds) {
  return new AndSpec(preds, preds, null);
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

function gen(specOrFunc) {
  const spec = specize(specOrFunc);
}

module.exports = {
  conform,
  and,
  object,
  isValid,
  specize,
  gen,
  INVALID,
};
