const http = require('http');
const querystring = require('querystring');
const url = require('url');
const sb = require('@json-spec/spec-basic');
const s = require('@json-spec/core');

const PRIMITIVE_TYPES = [
  { spec: sb.boolean, type: 'boolean' },
  { spec: sb.posInt,  type: 'integer', minimum: 0 },
  { spec: sb.int   ,  type: 'integr' },
  { spec: sb.number,  type: 'number' },
  { spec: sb.number,  type: 'number' },
  { spec: sb.string,  type: 'string' }
];

class OpenAPIType {
  toSpec() {}
  merge(type) {
    return new OneOfType(this, type);
  }
}

class ArrayType extends OpenAPIType {
  constructor(itemType) {
    super();
    this.itemType = itemType;
  }

  toSpec() {
    return {
      type: 'array',
      items: this.itemType.toSpec()
    };
  }
}

class ObjectType extends OpenAPIType {
  constructor(propertyTypes, required) {
    super();
    this.propertyTypes = propertyTypes;
    this.required = required || [];
  }

  toSpec() {
    const t = {
      type: 'object',
      properties: Object.entries(this.propertyTypes)
        .map(([k, v]) => [k, v.toSpec()])
        .reduce((obj, [k, v]) => ({...obj, [k]:v}), {})
    };
    if (this.required.length > 0) {
      t['required'] = this.required;
    }
    return t;
  }
}

class ScalarType extends OpenAPIType {
  constructor(type) {
    super();
    this.type = type;
  }

  toSpec() {
    return {
      type: this.type
    };
  }
}

class OneOfType extends OpenAPIType {
  constructor(...types) {
    super();
    this.types = types || [];
  }

  merge(type) {
    const theType = this.types.find(t => type.constructor === t.constructor)
    if (theType) {
      theType.merge(type);
    } else {
      types.push(type);
    }
  }

  toSpec() {
    return {
      oneOf: this.types.map(t => t.toSpec())
    };
  }
}

function parseType(schemaObject) {
  if (schemaObject == null) return null;
  if (schemaObject.oneOf) {
    return new OneOfType(schemaObject.oneOf.map(s => parseType(s)))
  } else {
    switch(schemaObject.type) {
    case 'array':
      return new ArrayType(parseType(schemaObject.items));
    case 'object':
      return new ObjectType(schemaObject.properties.map(p => parseType(p)), schemaObject.required)
    default:
      return new ScalarType(schemaObject.type);
    }
  }
}
function guess(value, currentType) {
  if (Array.isArray(value)) {
    let itemType = null;
    if (currentType instanceof ArrayType) {
      itemType = value.itemType;
    }
    for (let el of value) {
      itemType = guess(el, itemType);
    }

    if (currentType instanceof OpenAPIType) {
      if (currentType instanceof ArrayType) {
        currentType.itemType = itemType
        return currentType;
      } else {
        return currentType.merge(new ArrayType(itemType));
      }
    } else {
      return new ArrayType(itemType);
    }
  } else if (typeof value === 'object' && value !== null) {
    let propertyTypes = {};
    for (let [k, v] of Object.entries(value)) {
      propertyTypes[k] = guess(v, currentType instanceof ObjectType ? currentType.propertyTypes[k] : null);
    }
    if (currentType instanceof OpenAPIType) {
      if (currentType instanceof ObjectType) {
        Object.assign(currentType.propertyTypes,  propertyTypes);
        currentType.required = currentType.required.filter(k => propertyTypes[k]);
        return currentType;
      } else {
        return currentType.merge(new ObjectType(propertyTypes, Object.keys(propertyTypes)));
      }
    } else {
      return new ObjectType(propertyTypes, Object.keys(propertyTypes));
    }
  } else {
    const spec = PRIMITIVE_TYPES.find(primitiveSpec => s.isValid(primitiveSpec.spec, value))
    if (currentType instanceof OpenAPIType) {
      if (currentType instanceof ScalarType && currentType.type === spec.type) {
        return currentType;
      } else {
        return currentType.merge(new ScalarType(spec.type));
      }
    } else {
      return new ScalarType(spec.type);
    }
  }
  throw Error("Can't guess a type");
}

const opt = {
  method: 'POST',
  hostname: 'localhost',
  port: 9901,
  path: '/tap'
};

function parseRequestHeaders(headers) {
  const ret = {};

  headers.forEach(kv => {
    switch(kv['key']) {
    case ':method':
      ret['method'] = kv['value'];
      break;
    case ':path':
      ret['path'] = url.parse(kv['value'], true);
      break;
    case 'content-type':
      ret['content-type'] = kv['value'].split(';')[0];
      break;
    default:
      headers[kv['key']] = kv['value'];
    }
  })
  return ret;
}

function parseResponseHeaders(headers) {
  const ret = {};

  headers.forEach(kv => {
    switch(kv['key']) {
    case ':status':
      ret['status'] = kv['value'];
      break;
    case 'content-type':
      ret['contentType'] = kv['value'].split(';')[0];
      break;
    default:
      ret[kv['key']] = kv['value'];
    }
  })
  return ret;
}

/**
 * find a path entry from a schema definition.
 */
function findPath(schema, url) {
  if (!url) return null;

  const segments = url.pathname.split('/').filter(segment => segment.length > 0);
  return Object.keys(schema['paths']).find(p => {
    const targetSegments = p.split('/').filter(segment => segment.length > 0);
    if (segments.length !== targetSegments.length) return false;
    return targetSegments
      .every((s, i) => {
        s = s.replace(/\{\w+?\}/, "\\w+?")
        return new RegExp(s).test(segments[i])
      });
  });
}

function emptyPathObject(schema, method) {
  return {
  }
}

function parseTrace(schema, trace) {
  const headers = parseRequestHeaders(trace['request']['headers'] || []);

  const pathObject = schema.paths[findPath(schema, headers.path)] || (function() {
    const method = headers.method;
    schema.paths[headers.path.pathname] = {
      [method]: {
        "description": ""
      }
    };
    return schema.paths[headers.path.pathname];
  })();

  const operation = pathObject[headers['method']];

  if (headers.path.query) {
    const firstRequest = !(operation.parameters);
    if (firstRequest) {
      operation.parameters = [];
    }
    for (const key in headers.path.query) {
      const param = (operation.parameters || []).find(p => p.name === key);
      if (param) {
        param.schema = guess(headers.path.query[key], parseType(param.schema));
      } else {
        operation.parameters.push({
          name: key,
          'in': 'query',
          required: firstRequest,
          schema: guess(headers.path.query[key], null)
        });
      }
    }
    for (const param of operation.parameters) {
      if (!headers.path.query[param.name]) {
        param.required = false;
      }
    }
  }

  if (trace['request']['body'] && trace['request']['body']['truncated'] == false) {
    const body = JSON.parse(trace['request']['body']['as_string']);
  }

  const responseHeaders = parseResponseHeaders(trace['response']['headers'] || []);

  if (trace.response.body && trace.response.body.truncated === false) {
    const body = JSON.parse(trace.response.body.as_string);
    const responseObject = (operation.responses && operation.responses[responseHeaders.status]) || (function() {
      if (!operation.responses) operation.responses = {};
      operation.responses[responseHeaders.status] = {};
      return operation.responses[responseHeaders.status];
    })();

    const responseBodySchema = responseObject.content && responseObject.content[responseHeaders.contentType];
    if (!responseObject.content) responseObject.content = {};
    responseObject.content[responseHeaders.contentType] = {
      schema: guess(body, responseBodySchema ? parseType(responseBodySchema) : null).toSpec()
    };
  }
  console.log(JSON.stringify(schema, null, 2));
}

function parseResponse(spec, resTrace) {
  (resTrace['headers'] || []).forEach(kv => {
  });
}

function emptySchema() {
  return {
    openapi: "3.0.0",
    info: {
      title: "an API schema",
      version: "0.1.0"
    },
    paths: {
    }
  };
}

function connectToEnvoy(schema) {
  if (!schema) {
    schema = emptySchema();
  }

  const request = http.request(opt, res => {
    res.on('data', chunk => {
      const trace = JSON.parse(chunk);
      parseTrace(schema, trace['http_buffered_trace']);
    });
  });

  request.write(JSON.stringify({
    config_id: 'test_config_id',
    tap_config: {
      match_config: {
        any_match: true
      },
      output_config: {
        sinks: [
          {
            format: "JSON_BODY_AS_STRING",
            streaming_admin: {},
          }
        ],
        max_buffered_rx_bytes: 4096,
        max_buffered_tx_bytes: 4096
      }
    }
  }));
  request.end();
}

module.exports = {
  parseTrace,
  findPath,
  guess,
  connectToEnvoy
}
