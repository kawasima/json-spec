const repl = require('repl').start();

const homeDir = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
repl.setupHistory(`${homeDir}/.node_repl_history`, (err) => {
  if (err) console.error(err);
});

Object.defineProperty(repl.context, 'gen', {
  configurable: false,
  value: require('../src/generators')
});

Object.defineProperty(repl.context, 'regex', {
  configurable: false,
  value: require('../src/regex')
});
