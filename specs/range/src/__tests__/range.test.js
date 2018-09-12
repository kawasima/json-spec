const { dateIn } = require('../');
const { gen } = require('@json-spec/core');
const { sample } = require('@json-spec/core/gen');

describe('range', () => {
  test('dateIn', () => {
    const theAughts = dateIn(new Date(2000, 0), new Date(2010, 0));
    const res = sample(gen(theAughts));
    console.log(res);
  })

  test('intIn', () => {

  })
})
