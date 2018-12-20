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
      .argv;

const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const sb = require('@json-spec/spec-basic');
const SwaggerParser = require('swagger-parser');

const axios = require('axios');
const { parseApiSpec, readSpec } = require('../src/core');
const jsonSpecs = argv.jsonspec ? require(argv.jsonspec) : {};

const parser = new SwaggerParser();

callClients = []
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

  axios({
    method,
    baseURL: argv.baseUrl || 'http://localhost:3000',
    url,
    headers,
    params,
    data: requestSpec ? gen.generate(s.gen(requestSpec)) : null
  }).then(res => {
    console.log(res)
  }).catch(error => {
    console.log(error.request.method + ' ' + error.request.path + ":" + error.response.status);
  });
}

(async () => {
  const api = await parseApiSpec(argv.openapi);
  await readSpec(api, jsonSpecs, callback);
})();
