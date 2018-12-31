/* global require, module, console */
const {
  specize,
} = require('./base');
const { StringIO, ConsoleIO } = require('./stringio');

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

function explainPrinter(ed, io) {
  if (!ed) {
    io.println("Success!");
    return;
  }
  let out = "";
  (ed.problems || []).forEach(prob => {
    io.print(prob.val);
    io.print(' - failed: ');
    io.print(prob.reason || prob.pred.toString());
    if (prob.in.length > 0) {
      io.print(" in: " + prob.in);
    }
    if (prob.path.length > 0) {
      io.print(" at: " + prob.path);
    }
    if (prob.via.length > 0) {
      io.print(" spec: " + prob.via[prob.via.length - 1]);
    }
    io.newline();
  });
}

let _explainOut_ = explainPrinter;

function explainOut(ed, io) {
  if (!io) io = new ConsoleIO();
  return _explainOut_(ed, io);
}

function explain(spec, x) {
  const data = explainData(spec, x);
  return explainOut(data);
}

function explainString(spec, x) {
  const data = explainData(spec, x);
  const io = new StringIO();
  explainOut(data, io);
  return io.toString();
}

module.exports = {
  explain,
  explainData,
  explainString
}
