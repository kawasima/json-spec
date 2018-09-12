const {
  sample, choose, generators, elements, suchThat,
  vector, genObject, tuple, fmap
} = require('@json-spec/testcheck/generators');

const genBuiltins = new Map();

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
  elements,
  genObject,
  generators,
  tuple,
  choose,
  fmap
}
