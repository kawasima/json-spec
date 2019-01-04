const {
  sample, generate, choose, generators, elements, suchThat,
  vector, vectorDistinct, genObject, tuple, fmap, frequency
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
  frequency,
  suchThat,
  sample,
  generate,
  vector,
  vectorDistinct,
  elements,
  genObject,
  generators,
  tuple,
  choose,
  fmap
}
