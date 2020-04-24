const guesser = require('../guesser');
const url = require('url');

describe('guesser', () => {
  test('parse', () => {
    const spec = {paths: {}};
    const trace = {
      request: {
        headers: [
          {
            key: ':path',
            value: '/api1'
          },
          {
            key: 'content-type',
            value: 'application/json'
          }
        ],
        body: {
          truncated: false,
          as_string: '{"name": "foo"}'
        }
      },
      response: {
        headers: [
        ],
        body: {
        }
      }
    };
    console.log(trace['request']['headers'])
    guesser.parseTrace(spec, trace);
  });
});


describe('various guess', () => {
  test('simple object', () => {
    expect(guesser.guess({A: 1, B:'c'}).toSpec())
      .toEqual(
        expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            A: expect.objectContaining({
              type: 'integer'
            }),
            B: expect.objectContaining({
              type: 'string'
            })
          }),
          required: expect.arrayContaining(['A', 'B'])
        })
      );
  })

  test('complex object', () => {
    let type = guesser.guess({A: 1, B:'c'});
    type = guesser.guess({A: [3,4]}, type);

    expect(guesser.guess({A: 1, B:'c'}).toSpec())
      .toEqual(
        expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            A: expect.objectContaining({
              type: 'integer'
            }),
            B: expect.objectContaining({
              type: 'string'
            })
          })
        })
      );
  })

  test('findPaths', () => {
    const schema = {
      paths: {
        "products": {},
        "product/{id}": {},
        "shops": {},
        "shop/{id}/product/{productId}": {}
      }
    }
    expect(guesser.findPath(schema, url.parse("shop/1/product/3")))
      .toEqual("shop/{id}/product/{productId}");
  });
});
