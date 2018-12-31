const gen = require('../generate');
const s = require('@json-spec/core');
const sb = require('@json-spec/spec-basic');
const YAML = require('yaml');

describe('generate', () => {
  test('generate', () => {
    const specs = {
      Person: s.object({
        required: {
          firstName: sb.string,
          lastName: sb.string
        }
      })
    };
    console.log(YAML.stringify(gen.generate(specs)));
  })
})
