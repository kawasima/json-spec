const { sample, choose,generators }  = require('generators');

describe('generators', () => {
  test('sample-choose', () => {
    const v = sample(choose(200, 800));
    console.log(v);
  })

  test('sample-char', () => {
    const v = sample(generators['char']);
    console.log(v);
  })

  test('sample-char-alphanumeric', () => {
    const v = sample(generators['char-alphanumeric']);
    console.log(v);
  })

  test('sample-string', () => {
    const v = sample(generators['string']);
    console.log(v);
  })
})
