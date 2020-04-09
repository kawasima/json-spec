const { parseJsonSchema } = require('../src/json-schema-validation');
const repl = require('repl').start();

const homeDir = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
repl.setupHistory(`${homeDir}/.node_repl_history`, (err) => {
  if (err) console.error(err);
});

Object.defineProperty(repl.context, 'parseJsonSchema', {
  configurable: false,
  value: parseJsonSchema
});

Object.defineProperty(repl.context, 's', {
  configurable: false,
  value: require('@json-spec/core')
});

Object.defineProperty(repl.context, 'gen', {
  configurable: false,
  value: require('@json-spec/core/gen')
});
