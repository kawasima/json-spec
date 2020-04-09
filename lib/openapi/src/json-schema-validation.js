const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');

function parseIntegerSchema(schema) {
  const specs =[]
  let upper = Math.pow(2,53) -1;
  let lower = -upper;

  const generaotor = rnd => rnd.randDouble();
  if (schema.maximum) {
    if (schema.exclusiveMaximum) {
      specs.push(s.spec(x => x < schema.maximum));
    } else {
      specs.push(s.spec(x => x <= schema.maximum));
    }
    upper = schema.maximum
  }
  if (schema.minimum) {
    if (schema.exclusiveMinimum) {
      specs.push(s.spec(x => x > schema.minimum));
    } else {
      specs.push(s.spec(x => x >= schema.minimum));
    }
    lower = schema.minimum
  }

  return s.withGen(s.and.apply(null, specs), () =>
                   (rnd, size) => {
                     const factor = rnd.randDouble();
                     let ret = lower + factor * (upper + 1.0 - lower);
                     if (schema.type === 'integer') {
                       ret = Math.floor(ret);
                     }
                     return ret;
                   });
}

function parseStringSchema(schema) {
  const specs =[];

  if (schema.pattern) {
    specs.push(
      s.spec(x => String(x).match(schema.pattern), {
        gen: () => gen.regex(schema.pattern)
      })
    );
  }

  if (schema.maxLength && schema.minLength) {
    specs.push(s.spec(x => schema.minLength <= String(x).length && String(x).length <= schema.maxLength));
  } else if (schema.maxLength) {
    specs.push(String(x).length <= schema.maxLength);
  } else if (schema.minLength) {
    specs.push(schema.minLength <= String(x).length);
  }

  if (specs.length === 0) {
    return null;
  } else if (specs.length === 1) {
    return specs[0];
  } else {
    return s.and.apply(null, specs);
  }
}

function parseJsonSchema(schema) {
  if (schema.type === 'number' || schema.type === 'integer') {
    return parseIntegerSchema(schema);
  } else if (schema.type === 'string') {
    return parseStringSchema(schema);
  }
  return null;
}

module.exports = {
  parseJsonSchema
};
