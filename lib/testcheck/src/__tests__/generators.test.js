const { sample, frequency, choose, generators,genObject, generate }  = require('../generators');

describe('generator functions', () => {
  test('frequency', () => {
    const gfn = frequency([[3, generators.char], [8, generators.int]])
    sample(gfn, 1000).forEach(v => {
      expect(v).toEqual({
        asymmetricMatch: actual => typeof(actual) === 'string' || typeof(actual) === 'number'
      });
    });
  })
});

describe('generators', () => {
  test('sample-choose', () => {
    sample(choose(200, 800)).forEach(num => {
      expect(num).toBeGreaterThanOrEqual(200);
      expect(num).toBeLessThanOrEqual(800)
    });
  })

  test('sample-char', () => {
    expect(sample(generators.char))
      .toEqual(expect.arrayContaining(
        [expect.stringMatching(/./)]));
  })

  test('sample-char-alphanumeric', () => {
    expect(sample(generators.charAlphanumeric))
      .toEqual(expect.arrayContaining(
        [expect.stringMatching(/^[a-zA-Z0-9]$/)]));
  })

  test('sample-string', () => {
    expect(sample(generators.stringAscii))
      .toEqual(expect.arrayContaining(
        [expect.stringMatching(/^\w*$/)]
      ));
  })

  test('sample-largeInteger', () => {
    expect(sample(generators.largeInteger))
      .toEqual(expect.arrayContaining(
        [expect.any(Number)]))
  })

  test('sample-boolean', () => {
    expect(sample(generators.boolean))
      .toEqual(expect.arrayContaining(
        [expect.any(Boolean)]))
  })

  test('sample-date', () => {
    expect(sample(generators.date))
      .toEqual(expect.arrayContaining(
        [expect.any(Date)]))
  })

  test('sample-object', () => {
   sample(genObject({
      a: generators.stringAlphanumeric,
      b: genObject({
        c: generators.boolean
      })
    }));
  })
})
