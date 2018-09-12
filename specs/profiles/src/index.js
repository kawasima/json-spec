const { spec, and, gen } = require('@json-spec/core');
const { fmap, tuple } = require('@json-spec/core/gen');
const basic = require('@json-spec/spec-basic');
const range = require('@json-spec/spec-range');

const postalCode_JP = spec(x => RegExp(/\d{7}/).test(x),
                           { gen: () => fmap(([parent, branch]) => ("000" +parent).slice(-3) + ("0000" +branch).slice(-4),
                                             tuple(gen(range.intIn(100, 999)),
                                                   gen(range.intIn(0, 9999))))
                           });
const year = range.intIn(1, 100);
const name = ({size=100}) => spec(and(basic.string, x => 0 < x.length && x.length <= size));
const birthDay = spec(and(basic.date, range.dateIn(new Date(1900, 1), new Date())),
                      {gen: () => fmap(
                        x => {
                          x.setHours(0);
                          x.setMinutes(0);
                          x.setSeconds(0);
                          x.setMilliseconds(0);
                          return x;
                        },
                        gen(range.dateIn(new Date(1900, 1), new Date())))});

module.exports = {
  name,
  birthDay,
  postalCode_JP
}
