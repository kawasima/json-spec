const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const sb = require('@json-spec/spec-basic');
const SwaggerParser = require('swagger-parser');
const qs = require('qs');

const path = require('path');
const axios = require('axios');
const colo = require('colo');
const { parseApiSpec, readSpec } = require('../src/core');

const parser = new SwaggerParser();

function makeRequest({ method, path, specs, options }) {
  const requestSpec = (specs.request || {})['application/json'];
  const genHeaders = Object.entries(specs.parameter.header)
        .map(([k, v]) => [k, gen.generate(s.gen(v))])
        .reduce((result, [k, v]) => {
          result[k] = v;
          return result;
        }, {})
  const params = Object.entries(specs.parameter.query)
        .map(([k, v]) => [k, gen.generate(s.gen(v))])
        .reduce((result, [k, v]) => {
          result[k] = v;
          return result;
        }, {});
  const url = Object.entries(specs.parameter.path)
        .map(([k, v]) => [k, gen.generate(s.gen(v))])
        .reduce((result, [k, v]) => {
          return result.replace(new RegExp(`\{${k}\}`), v);
        }, path);
  const headers = Object.assign({
    'Content-Type': 'application/json',
    'Accept':       'application/json'
  }, genHeaders);

  return {
    method,
    baseURL: (options && options.baseUrl) || 'http://localhost:3000',
    url,
    headers,
    params,
    data: requestSpec ? gen.generate(s.gen(requestSpec)) : null,
    originalPath: path,
    expect: specs.response,
  };
}

function requestPromise(requests, options) {
  const _axios = axios.create({
    paramsSerializer: params => qs.stringify(params, { arrayFormat: "repeat" })
  });

  return new Promise((resolve, reject) => {
    const results = [];
    requests.forEach((request, i) => {
      _axios.request(request)
        .then(response => {
          const result = {
            response,
            request,
            expect: request.expect
          };
          results[i] = result;
          if (results.filter(Boolean).length === requests.length) {
            return resolve({
              results,
              options
            });
          }
        })
        .catch(err => {
          err.request = request;
          err.expect = request.expect;
          results[i] = err;
          if (results.filter(Boolean).length === requests.length) {
            return resolve({
              results,
              options
            });
          }
        });
    });
  });
}

function logResult({request, response}) {
  console.log(`${colo.bold.yellow('request:')} ${JSON.stringify(request, null, 2)}`);
  console.log(`${colo.bold.yellow('response:')} ${JSON.stringify(response.data, null, 2)}`);
}

function isSuccess(result) {
  if (!result.response || !result.response.status) return false;
  const { response, expect } = result;

  const representations = expect[String(response.status)] || expect['default'];
  const responseSpec = representations && representations[response.headers['content-type']];
  if (representations) {
    return s.isSpec(responseSpec) ? s.isValid(responseSpec, response.data) : true;
  } else {
    return false
  }
  return !!responseSpec;
}

function reporter({ results, options }) {
  return results.map((result, i) => {
    if (isSuccess(result)) {
      console.log(`${colo.bold.green('✔ pass!')} ${result.request.method} ${result.request.url} - returns ${result.response.status}`);
      if (options.verbose === "pass" || options.verbose === true) {
        logResult(result);
      }
    } else if (result.response && result.response.status) {
      console.log(`${colo.bold.red('✗ fail!')} ${result.request.method} ${result.request.url} - returns ${result.response.status}`);
      if (options.verbose === "fail" || options.verbose === true) {
        logResult(result);
      }
    } else {
      console.log(`${colo.bold.red('✗ fail!')} ${result.request._options.method} ${result.request._options.path} - connection failed`);
    }
  });
}

module.exports = {
  makeRequest,
  requestPromise,
  reporter,
  isSuccess,
}
