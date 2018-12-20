/**
 * JSON Spec core APIs
 */
const SwaggerParser = require('swagger-parser');
const parser = new SwaggerParser();
const sb = require('@json-spec/spec-basic');
const s = require('@json-spec/core');

function schemaToSpec(schema) {
  switch (schema.type) {
  case 'object':
    return s.object(Object.entries(schema.properties)
                    .map(([k, v]) => [v.required, k, schemaToSpec(v)])
                    .reduce((result, [required, k, spec]) => {
                      if (true) {
                        result['required'][k] = spec;
                      } else {
                        result['optional'][k] = spec;
                      }
                      return result;
                    }, {required: {}, optional: {}}));
  case 'array':
    return s.array(schemaToSpec(schema.items));
  case 'string':
    return sb.string;
  case 'number':
    return sb.number;
  case 'integer':
    return sb.int;
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
        return [mediaType, schemaToSpec(schema)];
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
    .map(parameter => {
      let spec = parameter.schema
          && parameter.schema['x-json-spec']
          && jsonSpecs[parameter.schema['x-json-spec']];
      if (!spec) {
        spec = schemaToSpec(parameter.schema || {})
      }
      return { ...parameter, spec}
    })
    .reduce((result, item) => {
      result[item.in][item.name] = item.spec;
      return result;
    }, {path: {}, query: {}, cookie: {}, header: {}});
}

async function readSpec(api, jsonSpecs, callback) {
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
          const requestSpecs = parseContent(operation.requestBody && operation.requestBody.content, jsonSpecs);

          const responseSpecs = Object.keys(operation.responses || {})
                .map(statusCode => [
                  statusCode,
                  parseContent(operation.responses[statusCode].content || {}, jsonSpecs)
                ])
                .reduce((result, [statusCode, item]) => {
                  result[statusCode] = item;
                  return result;
                }, {});
          callback.call(null, { method, path,
                                specs: {
                                  request:  requestSpecs,
                                  response: responseSpecs,
                                  parameter: parameterSpecs
                                }
                              });
        });
    });
}

module.exports = {
  parseApiSpec,
  readSpec
}
