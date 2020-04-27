const { spec } = require('@json-spec/core');
const { generators, elements } = require('@json-spec/core/gen');

const int_ = spec(x => typeof x === 'number' && isFinite(x) && Math.floor(x) === x,
                  { gen: () => generators.int })
      .withName('int');

const number_ = spec(x => typeof x === 'number' && isFinite(x),
                     { gen: () => generators.double })
      .withName('number');

const string_ = spec(x => typeof x === 'string',
                     { gen: () => generators.stringAlphanumeric })
      .withName('string');

const date_ = spec(x => x instanceof Date,
                   { gen: () => generators.date })
      .withName('date');

const boolean_ = spec(x => typeof x === 'boolean',
                      {gen: () => generators.boolean })
      .withName('boolean');

const posInt = spec(x => typeof x === 'number' && isFinite(x) && Math.floor(x) === x && x >= 0,
                    { gen: () => generators.posInt })
      .withName('posInt');

const enum_ = (coll) => spec(x => coll.includes(x), { gen: () => elements(coll) });

module.exports = {
  int: int_,
  string: string_,
  boolean: boolean_,
  date: date_,
  number: number_,
  posInt,
  enum: enum_
}
