/*
 * JSON Spec core APIs
 */
const SwaggerParser = require('swagger-parser');
const parser = new SwaggerParser();
const sb = require('@json-spec/spec-basic');
const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const faker = require('faker');
const { parseJsonSchema } = require('./json-schema-validation');

function stringFormatToSpec(format, jsonSpecs) {
  switch(format) {
  case 'date':
    return s.spec(x => typeof(x) === 'string',
                  { gen: () => gen.fmap(d => d.getFullYear()
                                        + '-' + ("0" + (d.getMonth() + 1)).slice(-2)
                                        + '-' + ("0" + d.getDate()).slice(-2),
                                        (rnd, size) => faker.date.past()) });
  case 'date-time':
    return s.spec(x => typeof(x) === 'string',
                  { gen: () => gen.fmap(d => eval(JSON.stringify(d)),
                                        (rnd, size) => faker.date.past()) });
  case 'password':
    return s.spec(x => typeof(x) === 'string',
                  { gen: () => (rnd, size) => faker.internet.password() });
  default:
    return sb.string;
  }
}

function mergeObjectSchema(s1, s2) {
  return {
    type: 'object',
    properties: { ...(s1.properties || []), ...(s2.properties || []) },
    required: [ ...(s1.required || []), ...(s2.required || []) ]
  }
}

function mergeSchema(schemas) {
  return (schemas || []).reduce((mergedSchema, schema) => {
    if (schema.allOf) {
      return mergeObjectSchema(mergedSchema, mergeSchema(schema.allOf));
    } else {
      return mergeObjectSchema(mergedSchema, schema);
    }
  }, {
    type: 'object',
    properties: {},
    required: []
  });
}

function schemaToSpec(schema, jsonSpecs) {
  if (schema['x-json-spec']) {
    const spec = jsonSpecs[schema['x-json-spec']];
    if (!spec) throw new Error(`JSON Spec ${schema['x-json-spec']} not found`)
    return spec;
  }
  if (schema.allOf) {
    schema = mergeSchema(schema.allOf);
  }
  const spec = parseJsonSchema(schema);
  if (spec) return spec;

  switch (schema.type || 'object') {
  case 'object':
    const requiredProps = schema.required || [];
    return s.object(Object.entries(schema.properties || {})
                    .map(([k, v]) => [v.required, k, schemaToSpec(v, jsonSpecs)])
                    .reduce((result, [required, k, spec]) => {
                      if (required || requiredProps.includes(k)) {
                        result['required'][k] = spec;
                      } else {
                        result['optional'][k] = spec;
                      }
                      return result;
                    }, {required: {}, optional: {}}));
  case 'array':
    return s.array(schemaToSpec(schema.items, jsonSpecs));
  case 'string':
    if (schema.enum) {
      return sb.enum(schema.enum);
    } else {
      return stringFormatToSpec(schema.format, jsonSpecs);
    }
  case 'boolean':
    return sb.boolean;
  case 'number':
    return sb.number;
  case 'integer':
    return sb.posInt;
  default:
    throw new Error(`Unknown schema type: ${schema.type}`);
  }
}

function parseContent(content, jsonSpecs) {
  if (!content) return null;
  return Object.keys(content)
    .map(mediaType => {
      const schema = content[mediaType].schema;
      if (!schema) throw new Error(`content has no schema`);

      if (schema['x-json-spec']) {
          const spec = schema['x-json-spec'];
          if (!jsonSpecs[spec]) throw new Error(`Spec ${spec} not found`);
          return [mediaType, jsonSpecs[spec]];
      } else {
        return [mediaType, schemaToSpec(schema, jsonSpecs)];
      }
    })
    .filter(x => x)
    .reduce((result, item) => {
      result[item[0]] = item[1];
      return result;
    }, {});
}

async function parseApiSpec(openapiPath) {
  return await parser.dereference(openapiPath, {
    dereference: { circular: true }
  });
}

function parseParameters(parameters = [], jsonSpecs) {
  return parameters
    .filter(parameter => ['path', 'query', 'cookie', 'header'].includes(parameter['in']))
    .map(parameter => {
      let spec = parameter.schema
          && parameter.schema['x-json-spec']
          && jsonSpecs[parameter.schema['x-json-spec']];
      if (!spec) {
        spec = schemaToSpec(parameter.schema || {}, jsonSpecs)
      }
      return { ...parameter, spec}
    })
    .reduce((result, item) => {
      result[item.in][item.name] = item.spec;
      return result;
    }, {path: {}, query: {}, cookie: {}, header: {}});
}

function parseVersion(api) {
  if (api.swagger && api.swagger.startsWith('2.')) {
    return 2;
  } else if (api.openapi && api.openapi.startsWith('3.')) {
    return 3;
  } else {
    throw new Error('Unknown OpenAPI version')
  }
}

function extractRequestBody(operation, specVersion) {
  switch(specVersion) {
  case 2:
    return (operation.parameters && operation.parameters.filter(p => p['in'] === 'body')
            .map(p => ({"application/json": { schema: p.schema}}))[0]);
  case 3:
    return operation.requestBody && operation.requestBody.content;
  default:
    throw new Error(`Unknown OpenAPI version "${specVersion}"`)
  }
}

function extractContent(response, specVersion) {
  switch(specVersion) {
  case 2:
    if (response.schema) {
      return {"application/json": { schema: response.schema }};
    } else {
      return null;
    }
  case 3:
    return response.content
  default:
    throw new Error(`Unknown OpenAPI version "${specVersion}"`)
  }
}

function readSpec(api, jsonSpecs, callback) {
  const results = [];
  const specVersion = parseVersion(api);

  Object.keys(api.paths)
    .forEach(path => {
      const methods = api.paths[path];
      const baseParameterSpecs = parseParameters(methods.parameters, jsonSpecs);
      Object.entries(methods)
        .filter(([method, operation]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
        .forEach(([method, operation]) => {
          let parameterSpecs = parseParameters(operation.parameters, jsonSpecs);
          parameterSpecs = ['path', 'query', 'cookie', 'header']
            .map(in_ => [in_, Object.assign(baseParameterSpecs[in_], parameterSpecs[in_])])
            .reduce((result, [in_, specs]) => {
              result[in_] = specs;
              return result;
            }, {});
          const requestSpecs = parseContent(extractRequestBody(operation, specVersion),
                                            jsonSpecs);

          const responseSpecs = Object.keys(operation.responses || {})
                .map(statusCode => [
                  statusCode,
                  parseContent(extractContent(operation.responses[statusCode], specVersion), jsonSpecs) ||
                    operation.responses[statusCode].description
                ])
                .reduce((result, [statusCode, item]) => {
                  result[statusCode] = item;
                  return result;
                }, {});
          results.push(
            callback.call(null,{
              method,
              path,
              specs: {
                request:  requestSpecs,
                response: responseSpecs,
                parameter: parameterSpecs
              }
            }));
        });
    });
  return results;
}

module.exports = {
  parseApiSpec,
  readSpec
}
