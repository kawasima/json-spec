#!/usr/bin/env node

const argv = require('yargs')
      .option('openapi', {
        describe: 'openapi spec file'
      })
      .option('jsonspec', {
        describe: 'json spec file'
      })
      .option('port', {
        alias: 'p',
        describe: 'listen port'
      })
      .option('logging', {
        type: 'boolean'
      })
      .demandOption(['openapi'])
      .help()
      .argv;

const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');
const { parseApiSpec, readSpec } = require('../src/core');

const jsonspecPath = path.resolve(argv.jsonspec);
const jsonSpecs = argv.jsonspec ? require(require.resolve(jsonspecPath))
      :
      {};

const app = express();
app.use(bodyParser.json());
if (argv.logging) {
  app.use(morgan('tiny'));
}

function toExpressPath(path) {
  return path.replace(/\{([^\}])+\}/, ':$1');
}

const methodStatusMap = {
  'get': ['200'],
  'post': ['201', '200'],
  'put': ['204', '201', '200'],
  'patch': ['204', '201', '200'],
  'delete': ['204', '200']
};

function callback({ method, path, specs}) {
  return {
    method,
    path,
    fn: (req, res) => {
      let contentType = req.contentType || 'application/json';
      let accept = req.header('Accept') || 'application/json';
      if (accept === '*/*') accept = 'application/json';

      // Request
      const requestSpec = (specs.request || {})[contentType];
      if (requestSpec && !s.isValid(requestSpec, req.body)) {
        res.set('content-type', accept);
        const malformedSpec = (specs.response['400'] || {})[accept];
        res.status(400);
        console.log(s.explain(requestSpec, req.body));

        if (malformedSpec) {
          res.send(gen.generate(s.gen(malformedSpec)));
          return;
        } else {
          res.send();
          return;
        }
      }

      // Response
      const status = (methodStatusMap[method] || [])
            .find(status => specs.response[status])

      if (!status || !specs.response[status]) {
        res.sendStatus(methodStatusMap[method][0]);
      } else {
        const spec = specs.response[status][accept]
              || Object.values(specs.response[status]).find(x => x)

        res.status(status);
        if (typeof(spec) === 'string') {
          res.send();
        } else {
          res.set('Content-Type', accept);
          res.send(gen.generate(s.gen(spec)));
        }
      }
    }
  };
}

(async () => {
  const api = await parseApiSpec(argv.openapi);
  const handlers = await readSpec(api, jsonSpecs, callback);
  handlers.forEach(({method, path, fn}) => app[method].call(app, toExpressPath(path), fn));
  app.listen(argv.port || 3000, () => console.log('started'));
})();
