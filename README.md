JSON Spec
===========

JSON Spec is a tool for validation and generation of JSON data. This is a porting of a part of clojure.spec.

## Validate

Spec is defined as follows

```javascript
const s = require('json-spec');
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
