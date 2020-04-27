const { toMatchSpec } = require('..');
const s = require('@json-spec/core');
const sb = require('@json-spec/spec-basic');

expect.extend({ toMatchSpec });
describe('index', () => {
  test('length', () => {
    expect(() => expect("abcd").toMatchSpec(s.spec(s => s.length < 3)))
      .toThrowError();
  });
  test('not.toMatchSpec', () => {
    expect(() => expect("2").not.toMatchSpec(sb.string))
      .toThrowError();
  });

  test('object', () => {
    expect(() => {
      return expect([
        {}
      ]).toMatchSpec(s.array(
        s.object({
          required: {
            name: sb.string
          }
        })
      ));
    }).toThrowError();
  });

});
