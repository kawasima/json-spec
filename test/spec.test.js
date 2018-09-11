const s = require('spec');
const gen = require('spec/gen');
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

describe('entity maps', () => {
  test('person', () => {
    const emailMatch = x => new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/).test(x);
    const emailType = s.and(_.isString, emailMatch);

    const person = s.object({
      first_name: _.isString,
      last_name:  _.isString,
      email: emailType
    });
    expect(s.isValid(person, {
      first_name: 'Yoshitaka',
      last_name:  'Kawashima',
      email: 'kawasima@example.com'
    })).toBe(true);
  })
});

describe('generation', () => {
  test('stirng', () => {
    const res = gen.sample(s.gen(_.isString));
    console.log(res);
  })

  test('and', () => {
    const res = gen.sample(s.gen(s.and(_.isString, x => x.length > 10)));
    console.log(res);
  })

  test('object', () => {
    const emailMatch = x => new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/).test(x);
    const emailType = s.and(_.isString, emailMatch);
    const person = s.object({
      first_name: _.isString,
      last_name:  _.isString,
      email: s.array(s.withGen(s.and(_.isString, emailMatch),
                               x => gen.fmap(([s1, s2, s3]) => `${s1}@${s2}.${s3}`,
                                             gen.tuple(gen.generators.stringAlphanumeric,
                                                       gen.generators.stringAlphanumeric,
                                                       gen.generators.stringAlphanumeric))))
    });
    const res = gen.sample(s.gen(person));
    console.log(res);
  });
});
