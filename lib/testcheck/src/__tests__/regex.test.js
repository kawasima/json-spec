const regex = require('../regex');
const gen = require('../generators');

describe('regex', () => {
  test('regex multibytes', () => {
    expect(gen.sample(regex('^[あ-う]{10}$')))
      .toEqual(expect.arrayContaining([ expect.stringMatching(/^[あ-う]{10}$/)]));
    expect(gen.sample(regex('^[あ-う]{10}$')))
      .not.toEqual(expect.arrayContaining([ expect.stringMatching(/[^あ-う]/)]));
  });
});
