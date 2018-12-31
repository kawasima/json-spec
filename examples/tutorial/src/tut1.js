const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const sp = require('@json-spec/spec-profiles');
const sb = require('@json-spec/spec-basic');

/*
 Specification of a person object.
 */
const person = s.object({
  required: {
    firstName: sp.firstName({ size: 10, locale:"ja"}),
    lastName:  sp.lastName({ size: 10, locale: "ja" }),
    languages: s.array([
      "C", "C++", "Java"
    ], { distinct: true, maxCount: 3 })
  },
  optional: {
    birthDay:  sp.birthDay,
    postalCd:  sp.postalCode_JP
  }
});

console.log(s.isValid(person, {
  firstName: "kawasimakawasima"
}));
const ret = s.explain(person, {
  firstName: "kawasimakawasima"
});
console.log(ret);

const person2 = s.object({
  required: {
    addresses: s.array(
      s.object({
        required: {
          prefecture_cd: sb.int
        }
      })
    )
  }
});
const ret2 = s.explain(person2, {
  addresses: [
    {
      prefecture_cd: 13
    },
    {
      prefecture_cd: "20"
    }
  ]
})

//console.log(gen.sample(s.gen(person)));
