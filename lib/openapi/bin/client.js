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
      .option('verbose', {
        type: 'string',
        describe: 'verbose mode'
      })
      .demandOption(['openapi'])
      .help()
      .argv;
if (argv.verbose === '') {
  argv.verbose = true;
}

const { parseApiSpec, readSpec } = require('../src/core');
const jsonSpecs = argv.jsonspec ?
      require(require.resolve(path.resolve(argv.jsonspec)))
      :
      {};

const {
  makeRequest,
  requestPromise,
  reporter,
  isSuccess
} = require('../src/client');

function processResult(results, result, path){
  if (!results[`${result.request.method} ${path}`]) {
    results[`${result.request.method} ${path}`] = {
      pass: {},
      fail: {}
    };
  }
  const success = isSuccess(result);
  if (!results[`${result.request.method} ${path}`][success?'pass':'fail'][result.response.status]) {
    results[`${result.request.method} ${path}`][success?'pass':'fail'][result.response.status] = 0;
  }
  results[`${result.request.method} ${path}`][success?'pass':'fail'][result.response.status] += 1;
}

(async () => {
  const api = await parseApiSpec(argv.openapi);
  if (argv.daemon) {
    const rs = {};
    process.on('SIGINT', () => {
      console.log(JSON.stringify(rs, null, 2));
      process.exit();
    });
    while (true) {
      const requests = readSpec(api, jsonSpecs, ({ method, path, specs }) => {
        return makeRequest({ method, path, specs, options : { baseUrl: argv.baseUrl }});
      });
      const { results, options } = await requestPromise(requests, { verbose: argv.verbose });
      results.map((result, i) => {
        processResult(rs, result, requests[i].originalPath);
      });
    }
  } else {
    const requests = readSpec(api, jsonSpecs, ({ method, path, specs }) => {
      return makeRequest({ method, path, specs, options : { baseUrl: argv.baseUrl }});
    });
    const result = await requestPromise(requests, { verbose: argv.verbose });
    reporter(result);
  }
})();
