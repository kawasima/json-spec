const s = require('../');
const gen = require('../gen');
const _ = require('lodash');
const { I64 } = require('n64');

describe('conforms', () => {
  test('conform', () => {
    expect(s.conform(x => x%2 === 0, 1000)).toBe(1000);
  })

  test('conform invalid', () => {
    expect(s.conform(x => x%2 === 0, 1001)).toBe(s.INVALID);
  })

  test('and', () => {
    const spec = s.and(x => !isNaN(Number(x)), x => x > 1000)
    expect(s.conform(spec, 1001)).toBe(1001);
  })
});

describe('composing predicates', () => {
  test('big-even', () => {
    const bigEven = s.and(x => !isNaN(Number(x)), x => x%2 === 0, x => x > 1000);
    expect(s.isValid(bigEven, "foo")).toBe(false);
    expect(s.isValid(bigEven, 10   )).toBe(false);
    expect(s.isValid(bigEven, 10000)).toBe(true);
  })
});

describe('explains', () => {
  test('explain scalar', () => {
    const bigEven = s.and(x => !isNaN(Number(x)), x => x%2 === 0, x => x > 1000);
    const res = s.explain(bigEven, "foo")
  });
})
