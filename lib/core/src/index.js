const base = require('./base');
module.exports = {
  ...base
}
function explainData_(spec, path, via, in_, x) {
  const problems = specize(spec).explain(path, via, in_, x);
  return {
    problems: problems,
    spec: spec,
    value: x
  };
}

function explainData(spec, x) {
  explainData_();
}

function explainPrinter(ed) {
}

function explain(spec, x) {
  explainPrinter(explainData(spec, x));
}
