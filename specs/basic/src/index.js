const { spec } = require('@json-spec/core');
const { generators } = require('@json-spec/core/gen');

const int_ = spec(x => typeof x === 'number' && isFinite(x) && Math.floor(x) === x,
                  { gen: () => generators.int });

const string_ = spec(x => typeof x === 'string',
                     { gen: () => generators.stringAlphanumeric });

const date_ = spec(x => x instanceof Date,
                   { gen: () => generators.date });

const boolean_ = spec(x => typeof x === 'boolean',
                      {gen: () => generators.boolean });

module.exports = {
  int: int_,
  string: string_,
  boolean: boolean_,
  date: date_,
}
