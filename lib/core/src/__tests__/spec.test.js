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

describe('ArraySpec', () => {
  test('with count', () => {
    const spec = s.array(x => x % 2 === 0, { count: 3 });
    expect(s.conform(spec, [2, 4, 6])).toEqual([2,4,6]);
    expect(s.conform(spec, [2, 4, 9])).toBe(s.INVALID);
    expect(s.conform(spec, [2, 4])).toBe(s.INVALID);
    expect(s.conform(spec, [2, 4, 6, 8])).toBe(s.INVALID);
  })

  test('with maxCount', () => {
    const spec = s.array(x => x % 2 === 0, { maxCount: 3 });
    expect(s.conform(spec, [2, 4, 6])).toEqual([2,4,6]);
    expect(s.conform(spec, [2, 4])).toEqual([2,4]);
    expect(s.conform(spec, [2, 4, 9])).toBe(s.INVALID);
    expect(s.conform(spec, [2, 4, 6, 8])).toBe(s.INVALID);
  });

  test('with minCount', () => {
    const spec = s.array(x => x % 2 === 0, { minCount: 3 });
    expect(s.conform(spec, [2, 4, 6])).toEqual([2,4,6]);
    expect(s.conform(spec, [2, 4, 9])).toEqual(s.INVALID);
    expect(s.conform(spec, [2, 4, 6, 8])).toEqual([2,4,6,8]);
    expect(s.conform(spec, [2, 4])).toEqual(s.INVALID);
  });

  test('with minCount and maxCount', () => {
    const spec = s.array(x => x % 2 === 0, { minCount: 3, maxCount: 4 });
    expect(s.conform(spec, [2, 4])).toEqual(s.INVALID);
    expect(s.conform(spec, [2, 4, 6])).toEqual([2,4,6]);
    expect(s.conform(spec, [2, 4, 6, 8])).toEqual([2,4,6,8]);
    expect(s.conform(spec, [2, 4, 6, 8, 10])).toEqual(s.INVALID);
  });

  test('with distinct', () => {
    const spec = s.array(x => x % 2 === 0, { distinct: true });
    expect(s.conform(spec, [2, 2])).toEqual(s.INVALID);
    expect(s.conform(spec, [2, 4])).toEqual([2, 4]);
  })
});

describe('Nullable spec', () => {
  test('null', () => {
    const nullOrStr = s.nullable(s.spec(x => typeof(x) === 'string', {
      gen: () => (rnd, size) => 'hoge'
    }));
    expect(s.conform(nullOrStr, null)).toEqual(null);
    expect(s.conform(nullOrStr, undefined)).toEqual(null);
    expect(s.conform(nullOrStr, 3)).toEqual(s.INVALID);
    expect(s.conform(nullOrStr, 'abc')).toEqual('abc');
    expect(gen.sample(s.gen(nullOrStr), 10000).filter(v => v == null).length).toBeGreaterThanOrEqual(1);
  });
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
          pred: "x => !isNaN(Number(x))"
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

  test('object oneOf', () => {
    const oneOf = s.or(
      s.object({
        required: {
          name:  s.spec(x => typeof(x) === 'string'),
          age: s.spec(x => typeof(x) === 'number'),
        }
      }),
      s.object({
        required: {
          address:  s.spec(x => typeof(x) === 'string'),
          score: s.spec(x => typeof(x) === 'number'),
        }
      }),
    );

    expect(s.isValid(oneOf, {
      name: "Kenny Rogers",
      age: 10,
    })).toBe(true);

    expect(s.isValid(oneOf, {
      name: "Kenny Rogers",
      score: 100,
    })).toBe(false);

    expect(s.isValid(oneOf, {
      address: "Tokyo City",
      score: 10,
    })).toBe(true);

  })

  test('object anyOf', () => {
    const anyOf = s.or(
      s.object({
        required: {
          age: s.spec(x => typeof(x) === 'number')
        },
        optional: {
          nickname:  s.spec(x => typeof(x) === 'string')
        }
      }),
      s.object({
        required: {
          pet_type: ["Cat", "Dog"]
        },
        optional: {
          hunts:  s.spec(x => typeof(x) === 'boolean')
        }
      }),
    );

    expect(s.isValid(anyOf, {
      age: 1
    })).toBe(true);

    expect(s.isValid(anyOf, {
      pet_type: "Cat",
      hunts: true
    })).toBe(true);

    expect(s.isValid(anyOf, {
      nickname: "Fido",
      pet_type: "Dog",
      age: 4
    })).toBe(true);
  })
})

describe('multiSpec', () => {
  test('multiSpec', () => {
    const spec = s.multi(o => o.nyuharai_kbn, {
      1: s.object({
        required: {
          nyuharai_kbn: 1,
          irainin_or_contract_no: s.spec(/\w+/)
        }
      }),
      2: s.object({
        required: {
          nyuharai_kbn: 2,
          irainin_or_contract_no: s.spec(/\d{20}[ ]{28}/)
        }
      })
    });
    const value = {
      nyuharai_kbn: 2,
      irainin_or_contract_no: '01'
    };
    console.log(gen.sample(s.gen(spec), 10));
    expect(s.conform(spec, value)).toBe(s.INVALID);
  })
})
