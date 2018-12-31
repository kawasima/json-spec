const s = require('../');
const gen = require('../gen');


describe('scalar spec', () => {
  test('array', () => {
    expect(s.spec(['a', 'b', 'c']).conform('b')).toBe('b');
  })

  test('function', () => {
    expect(s.spec((x) => x === 3).conform(3)).toBe(3);
    expect(s.spec((x) => x === 3).conform(4)).toBe(s.INVALID);
  })

  test('regexp', () => {
    expect(s.spec(/^\d+$/).conform('786418237')).toBe('786418237');
    expect(s.spec(/^\d+$/).conform('7864A213f')).toBe(s.INVALID);
  })

})
describe('conforms', () => {
  test('conform', () => {
    expect(s.conform(x => x%2 === 0, 1000)).toBe(1000);
  })

  test('conform invalid', () => {
    expect(s.conform(x => x%2 === 0, 1001)).toBe(s.INVALID);
  })
})

describe('composing predicates', () => {
  test('big-even', () => {
    const bigEven = s.and(x => !isNaN(Number(x)), x => x%2 === 0, x => x > 1000);
    expect(s.isValid(bigEven, "foo")).toBe(false);
    expect(s.isValid(bigEven, 10   )).toBe(false);
    expect(s.isValid(bigEven, 10000)).toBe(true);
  })
});

describe('Compsite conditions', () => {
  test('and', () => {
    const spec = s.and(x => !isNaN(Number(x)), x => x > 1000)
    expect(s.conform(spec, 1001)).toBe(1001);
  })

  test('or', () => {
    const spec = s.or(x => !isNaN(Number(x)), x => x > 1000)
    expect(s.conform(spec, 1001)).toBe(1001);
    expect(s.conform(spec, 5)).toBe(5);
  })

});

describe('explains', () => {
  test('explain scalar', () => {
    const bigEven = s.and(x => !isNaN(Number(x)), x => x%2 === 0, x => x > 1000);
    expect(s.explainString(bigEven, "foo"))
      .toEqual(expect.stringContaining('failed'));
    expect(s.explainString(bigEven, 3))
      .toEqual(expect.stringContaining('failed'));
  });

  test('explain data', () => {
    const bigEven = s.and(x => !isNaN(Number(x)), x => x%2 === 0, x => x > 1000);

    const data = s.explainData(bigEven, "foo")
    expect(data.problems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          pred: expect.any(Function)
        })
      ])
    );
  });

  test('explain complex spec', () => {
    const game = s.object({
      required: {
        players: s.array(
          s.object({
            required: {
              name:  s.spec(x => typeof(x) === 'string'),
              score: s.spec(x => typeof(x) === 'number'),
              hand:  s.array(
                s.tuple(
                  s.spec(['ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack', 'queen', 'king']),
                  s.spec(['club', 'diamond', 'heart', 'spade']).withName('suit?')
                )
              )
            }
          })
        )
      }
    });

    s.explain(game, {
      players: [{
        name: "Kenny Rogers",
        score: 100,
        hand: [[2, 'banana']]
      }]
    });
  })
})
