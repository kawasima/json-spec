const s = require('spec');
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
    const isString = x => typeof(x) === 'string';
    const emailMatch = x => new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/).test(x);
    const emailType = s.and(isString, emailMatch);
    const firstName = s.specize(isString);
    const lastName  = s.specize(isString);

    const person = s.object({
      first_name: firstName,
      last_name:  lastName,
      email: emailType
    });
    expect(s.isValid(person, {
      first_name: 'Yoshitaka',
      last_name:  'Kawashima',
      email: 'kawasima@example.com'
    })).toBe(true);
  })
});
