/* global require, module, console */
const {
  specize,
} = require('./base');

function explainData_(spec, path, via, in_, x) {
  const probs = specize(spec).explain(path, via, in_, x);
  if (probs && probs.length > 0) {
    return {
      problems: probs,
      spec:     spec,
      value:    x
    };
  } else {
    return null;
  }
}

function explainData(spec, x) {
  const name = specize(spec).name;
  return explainData_(spec, [], name === null ? [] : [name], [], x);
}

function explainPrinter(ed) {
  if (!ed) {
    console.log("Success!");
    return;
  }

  let out = "";
  (ed.problems || []).forEach(prob => {
    out += prob.val;
    out += ' - failed: ';
    out += (prob.reason || prob.pred);
    if (prob.in.length > 0) {
      out += " in: " + prob.in;
    }
    if (prob.path.length > 0) {
      out += " at: " + prob.path;
    }
    if (prob.via.length > 0) {
      out += " spec: " + prob.via[prob.via.length - 1];
    }
    out += '\n'
  });
  console.log(out);
}

let _explainOut_ = explainPrinter;

function explainOut(ed) {
  return _explainOut_(ed);
}

function explain(spec, x) {
  const data = explainData(spec, x);
  return explainOut(data);
}

/*
function explainString(spec, x) {
  return withOutString(explain(spec, x));
}
*/

module.exports = {
  explain,
}
