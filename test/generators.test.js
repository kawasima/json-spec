const { sample, choose,generators }  = require('generators');

describe('generators', () => {
  test('sample-choose', () => {
    const v = sample(choose(200, 800));
    console.log(v);
  })

  test('sample-char', () => {
    const v = sample(generators.char);
    console.log(v);
  })

  test('sample-char-alphanumeric', () => {
    const v = sample(generators.charAlphanumeric);
    console.log(v);
  })

  test('sample-string', () => {
    const v = sample(generators.stringAscii);
    console.log(v);
  })
})
