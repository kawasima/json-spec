const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const sp = require('@json-spec/spec-profiles');
const sb = require('@json-spec/spec-basic');

const PasswordSignInRequest = s.object({
  required: {
    account: sp.name({ size: 20}),
    password: sp.name({ size: 20})
  }
});

const UserCreateRequest = s.object({
  required: {
      account: sp.account({ size: 20}),
      email: sp.email,
      name: sp.name({ size: 20})
  }
});
const User = s.object({
  required: {
    id: sb.posInt,
    account: sp.account({ size: 20}),
    email: sp.email,
    name: sp.name({ size: 20})
  }
});

const Users = s.array(User);

const jwt = Buffer.from(JSON.stringify({alg:"none",typ:"JWT"})).toString('base64')
      + '.'
      + Buffer.from(JSON.stringify({
        sub: "admin",
        uid:"1",
        name: "Admin User",
        "permissions": ['CREATE_ANY_USER']
      })).toString('base64')
      + '.';
const BouncrCredential = s.spec(x => Buffer.from(x, 'base64'), {
  gen: () => gen.elements([jwt])
});
module.exports = {
  PasswordSignInRequest,
  UserCreateRequest,
  User,
  Users,
  BouncrCredential
}
