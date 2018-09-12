const { postalCode_JP } = require('../');
const { gen } = require('@json-spec/core');
const { sample } = require('@json-spec/core/gen');

describe('profiles', () => {
  test('postalCode', () => {
    const res = sample(gen(postalCode_JP));
    console.log(res);
  })
})
