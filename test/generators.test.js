const { sample, choose,generators,genObject }  = require('generators');

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

  test('sample-largeInteger', () => {
    const v = sample(generators.largeInteger);
    console.log(v);
  })

  test('sample-boolean', () => {
    const v = sample(generators.boolean);
    console.log(v);
  })

  test('sample-date', () => {
    const v = sample(generators.date);
    console.log(v);
  })

  test('sample-object', () => {
    const v = sample(genObject({
      a: generators.stringAlphanumeric,
      b: genObject({
        c: generators.boolean
      })
    }));
    console.log(v);
  })

})
