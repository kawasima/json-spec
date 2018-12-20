const faker = require('faker');

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
const name = ({size=100, locale='en'}) =>
      spec(and(basic.string, x => 0 < x.length && x.length <= size),
           {gen: () => (rnd, size) => {
             const orig = faker.locale;
             faker.locale = locale;
             const ret = faker.name.findName();
             faker.locale = orig;
             return ret;
           }});

const account = ({size=100}) =>
      spec(and(basic.string, x => 0 < x.length && x.length <= size),
           {gen: () => (rnd, size) => faker.internet.userName()});

const email = spec(x => RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).test(x), {
  gen: () => (rnd, size) => faker.internet.email()
})
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
  account,
  email,
  birthDay,
  postalCode_JP
}
