JSON Spec
===========

JSON Spec is a tool for validation and generation of JSON data. This is a porting of a part of clojure.spec.

## Validate

Spec is defined as follows

```javascript
const s = require('@json-spec/core');
const bigEven = s.and(x => !isNaN(Number(x)), x => x%2 === 0, x => x > 1000);
```

And you can validate using the spec

```javascript
s.isValid(bigEven, 'foo'); // false
s.isValid(bigEven, 10); // false
s.isValid(bigEven, 10000); // true
```

The example of validating a JSON Object is as follows.

```javascript
const isString = x => typeof(x) === 'string';
const emailMatch = x => new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/).test(x);
const emailType = s.and(isString, emailMatch);

const person = s.object({
  first_name: isString,
  last_name:  isString,
  email: emailType
});

s.isValid(person, {
  first_name: 'Yoshitaka',
  last_name:  'Kawashima',
  email: 'kawasima@example.com'
}); // true

```

## Generate

JSON spec can also generate JSON data that satisfies the defined specification.

```javascript
const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const sp = require('@json-spec/spec-profiles');
const sb = require('@json-spec/spec-basic');

const person = s.object({
  required: {
    firstName: sp.name({ size: 100 }),
    lastName:  sp.name({ size: 100 }),
    birthDay:  sp.birthDay,
    postalCd:  sp.postalCode_JP,
    languages: s.array([
      "C", "C++", "Java"
    ])
  }
});

gen.sample(s.gen(person))
```

This code generates JSON data as follows.

```javascript
  { firstName: 'n6lB',
    lastName: 'lvf',
    birthDay: 1960-05-10T15:00:00.000Z,
    postalCd: '4874565',
    languages: [ 'C', 'C', 'C' ] },
  { firstName: '6',
    lastName: 'j',
    birthDay: 2014-11-14T15:00:00.000Z,
    postalCd: '5244670',
    languages: [ 'C', 'Java', 'C', 'C++', 'C++' ] },
  { firstName: '5RV',
    lastName: 'swy',
    birthDay: 1989-07-13T15:00:00.000Z,
    postalCd: '6731807',
    languages: [ 'C++', 'Java' ] },
  { firstName: 'ubiIf',
    lastName: 't5I',
    birthDay: 1998-11-29T15:00:00.000Z,
    postalCd: '2768511',
    languages: [ 'C++', 'C', 'Java', 'C++', 'C', 'C', 'Java' ] },
  { firstName: 'P',
    lastName: '0335Nlbl',
    birthDay: 2005-08-24T15:00:00.000Z,
    postalCd: '6810354',
    languages: [ 'C++', 'C++', 'Java', 'C', 'Java' ] },
  { firstName: '5uYLGk9j',
    lastName: 'N',
    birthDay: 1932-06-06T15:00:00.000Z,
    postalCd: '2292116',
    languages: [ 'Java', 'C++', 'Java', 'C', 'C++' ] }
```
