const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const basic = require('../');

describe('entity maps', () => {
  test('person', () => {
    const emailMatch = x => new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/).test(x);
    const emailType = s.and(basic.string, emailMatch);

    const person = s.object({
      first_name: basic.string,
      last_name:  basic.string,
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
    const res = gen.sample(s.gen(basic.string));
    console.log(res);
  })

  test('and', () => {
    const res = gen.sample(s.gen(s.and(basic.string, x => x.length > 10)));
    console.log(res);
  })

  test('object', () => {
    const emailMatch = x => new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/).test(x);
    const emailType = s.and(basic.string, emailMatch);
    const person = s.object({
      first_name: basic.string,
      last_name:  basic.string,
      email: s.array(s.withGen(s.and(basic.string, emailMatch),
                               x => gen.fmap(([s1, s2, s3]) => `${s1}@${s2}.${s3}`,
                                             gen.tuple(gen.generators.stringAlphanumeric,
                                                       gen.generators.stringAlphanumeric,
                                                       gen.generators.stringAlphanumeric))))
    });
    const res = gen.sample(s.gen(person));
    console.log(res);
  });
});
