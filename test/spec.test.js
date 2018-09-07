const { conform, INVALID } = require('spec');
const { I64 } = require('n64');

describe('conforms', () => {
  test('conform', () => {
    expect(conform(x => x%2 === 0, 1000)).toBe(1000);
  })
  test('conform invalid', () => {
    expect(conform(x => x%2 === 0, 1001)).toBe(INVALID);
  })

});
