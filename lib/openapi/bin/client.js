#!/usr/bin/env node

const argv = require('yargs')
      .option('openapi', {
        describe: 'openapi spec file'
      })
      .option('jsonspec', {
        describe: 'json spec file'
      })
      .option('base-url', {
        describe: 'base url'
      })
      .option('daemon', {
        alias: 'd',
        type: 'boolean',
        describe: 'daemon mode'
      })
      .demandOption(['openapi'])
      .help()
      .argv;

const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const sb = require('@json-spec/spec-basic');
const SwaggerParser = require('swagger-parser');

const path = require('path');
const axios = require('axios');
const colo = require('colo');
const { parseApiSpec, readSpec } = require('../src/core');
const jsonSpecs = argv.jsonspec ?
      require(require.resolve(path.resolve(argv.jsonspec)))
      :
      {};

const parser = new SwaggerParser();

function callback({ method, path, specs}) {
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
    baseURL: argv.baseUrl || 'http://localhost:3000',
    url,
    headers,
    params,
    data: requestSpec ? gen.generate(s.gen(requestSpec)) : null
  };

}

function requestPromise(requests) {
  return new Promise((resolve, reject) => {
    const results = [];
    requests.forEach((request, i) => {
      axios.request(request)
        .then(res => {
          results[i] = res;
          if (results.filter(Boolean).length === requests.length) {
            return resolve(results);
          }
        })
        .catch(err => {
          results[i] = err;
          if (results.filter(Boolean).length === requests.length) {
            return resolve(results);
          }
        });
    });
  });
}

function reporter(results) {
  return results.map((result, i) => {
    if (result.status && result.status >= 200 && result.status < 400) {
      console.log(`${colo.bold.green('✔ pass!')} ${result.request.method} ${result.request.path}`);
    } else if (result.response && result.response.status) {
       console.log(`${colo.bold.red('✗ fail!')} ${result.request.method} ${result.request.path} - returns ${result.response.status}`);
    } else {
    console.log(result);
       console.log(`${colo.bold.red('✗ fail!')} ${result.request._options.method} ${result.request._options.path} - connection failed`);
    }
  });
}

(async () => {
  const api = await parseApiSpec(argv.openapi);
  const requests = readSpec(api, jsonSpecs, callback);
  requestPromise(requests)
    .then(reporter);
})();
