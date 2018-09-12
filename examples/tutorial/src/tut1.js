const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const sp = require('@json-spec/spec-profiles');
const sb = require('@json-spec/spec-basic');

/*
 Specification of a person object.
 */
const person = s.object({
  firstName: sp.name({ size: 100 }),
  lastName:  sp.name({ size: 100 }),
  birthDay:  sp.birthDay,
  postalCd:  sp.postalCode_JP,
  languages: s.array([
    "C", "C++", "Java"
  ], { distinct: true, maxCount: 3 })
});

console.log(gen.sample(s.gen(person)));
