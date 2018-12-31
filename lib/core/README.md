# JSON Spec (Core)

JSON Spec is a tool for validation and generation of JSON data.

## Describe specifications

### Simple spec

If you give the test function to the spec function, the simple spec is created.

```js
s.spec(x => x === 'spec');
```

And you can also give the regexp or an Array.

```js
s.spec(/^\d+/);
s.spec(['a', 'b', 'c']);
```

### Compose specifications

You can compose multiple specs.

`and`

```js
s.and(x => !isNaN(Number(x)), x => x > 1000)
```

`or`

```js
s.or(x => !isNaN(Number(x)), x => typeof(x) === 'string')
```

## Validation

Using `conform` function can check wheather the given value conform the specification.

```js
s.conform(x => );
```
## Explain

An `explain` function outputs detail of specification violations.

```js
s.explain(spec(x => typeof(x) === 'string'), 123);
```
