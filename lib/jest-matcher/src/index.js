const { matcherHint, printReceived, printExpected } = require('jest-matcher-utils');
const s = require('@json-spec/core');

function toMatchSpec(received, spec) {
  const pass = s.isValid(spec, received);
  const message = pass
        ? () => {
          return `${matcherHint('.not.toMatchSpec')}\n\nExpected value not to match spec\n\n`;
        }
        : () => {
          let messageToPrint = '';
          const explain = s.explainData(spec, received);
          explain.problems.forEach(problem => {
            messageToPrint += `\nSpec violation`;
            if (problem.in && Array.isArray(problem.in)) {
              messageToPrint += `: received[${problem.in.join('][')}]`;
            }
            messageToPrint += `\n    Expected Spec: ${printExpected(problem.pred)}`;
            messageToPrint += `\n    Received: ${printReceived(problem.val)}`
          });
          return `${matcherHint('.toMatchSpec', undefined, 'spec')}\n\n${messageToPrint}`
        }

  return {
    actural: received,
    message,
    name: 'toMatchSpec',
    pass
  };
}
module.exports = {
  toMatchSpec
}
