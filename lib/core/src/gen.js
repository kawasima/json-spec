const {
  sample, generate, choose, generators, elements, suchThat, oneOf,
  vector, vectorDistinct, genObject, tuple, fmap, frequency, repeat, regex
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
  oneOf,
  repeat,
  choose,
  fmap,
  regex
}
