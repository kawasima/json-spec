const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const sp = require('@json-spec/spec-profiles');
const sb = require('@json-spec/spec-basic');

module.exports = {
  Pet: s.object({
    required: {
      id: sb.posInt,
      name: sp.name({}),
      tag: sb.enum(['dog','cat','lion'])
    }
  })
}
