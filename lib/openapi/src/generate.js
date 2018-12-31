const openapi = require('./core');
const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');

function guess(v) {
  if (typeof(v) === 'string') {
    return {
      type: 'string',
      example: v
    };
  } else if (typeof(v) === 'number') {
    return {
      type: 'number',
      example: v
    };
  } else if (Array.isArray(v)) {
    return {
      type: 'array',
      items: guess(v[0])
    };
  } else if (typeof(v) === 'object') {
    return {
      type: 'object',
      properties: Object.keys(v)
        .map(k => {
          return [k, guess(v[k])];
        })
        .reduce((res, [key, val]) => {
          res[key] = val;
          return res
        }, {})
    };
  } else {
    throw new Error(`Unknown type ${v}`);
  }
}

function generate(specs) {
  const schemas = {};
  Object.keys(specs).map(k => {
    schemas[k] = guess(gen.generate(s.gen(specs[k])));
  });
  return {
    components: {
      schemas
    }
  }
}

module.exports = {
  generate
}
