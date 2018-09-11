const _ = require('lodash');
const {
  sample, choose, generators, elements, suchThat,
  vector, genObject, tuple, fmap
} = require('../generators');

const genBuiltins = new Map();
genBuiltins.set(_.isString, generators.stringAlphanumeric);
genBuiltins.set(_.isInteger, generators.largeInteger);
genBuiltins.set(_.isBoolean, generators.boolean);
genBuiltins.set(_.isDate, generators.date);

function genForPred(pred) {
  if (pred instanceof Array) {
    return elements(pred);
  } else {
    return genBuiltins.get(pred);
  }
}

module.exports = {
  genForPred,
  suchThat,
  sample,
  vector,
  genObject,
  generators,
  tuple,
  fmap
}
