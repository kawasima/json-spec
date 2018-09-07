const INVALID = (function() {
  function toString() {
    return "INVALID";
  }
})();

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

function conform(spec, x) {
  return specize(spec).conform(x);
}

module.exports = { conform };
