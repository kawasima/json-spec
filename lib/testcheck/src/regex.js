const ret    = require('ret');
const DRange = require('drange');
const types  = ret.types;
const { fmap, tuple, oneOf, choose, elements, repeat } = require('./generators');

function regex(reg) {
  if (Object.prototype.toString.call(reg) === '[object RegExp]') {
    reg = reg.source;
  }
  const tokens = ret(reg);
  return _gen(tokens, []);
}

function _gen(token, groups) {
  let stack, str, n, i, l, code, expandedSet;

  switch (token.type) {
  case types.ROOT:
  case types.GROUP:
    if (token.followedBy || token.notFollowedBy) {
      return null;
    }

    if (token.remember && token.groupNumber === undefined) {
      token.groupNumber = groups.push(null) - 1;
    }
    stack = token.options ? elements(token.options) : (rnd, size) => token.stack;
    const groupGen = (rnd, size) => {
      const arr = stack.call(null, rnd, size);
      return arr.map(x => _gen(x, groups))
        .filter(x => x != null)
        .map(g => g.call(null, rnd, size))
        .join('');
    };
    if (token.remember) {
      groups[token.groupNumber] = groupGen;
    }
    return groupGen;
  case types.POSITION:
    return null;
  case types.SET:
    const drange = expand(token);
    if (drange.ranges.length === 1) {
      const range = drange.ranges[0];
      return fmap(String.fromCharCode, choose(range.low, range.high));
    } else {
      const ranges = drange.ranges.map(r => choose(r.low, r.high));
      return fmap(String.fromCharCode, oneOf.apply(null, drange.ranges.map(r => choose(r.low, r.high))));
    }
  case types.REPETITION:
    const g = _gen(token.value, groups);
    return (rnd, size) => {
      const n = choose(token.min, token.max === Infinity ? token.min + size : token.max).call(null, rnd, size);
      return repeat(n, g).map(gen => gen(rnd, size)).join('');
    };
  case types.REFERENCE:
    return groups[token.value - 1] || null;
  case types.CHAR:
    return fmap(String.fromCharCode, (rnd, size) => token.value);
  }
}

function expand(token, options) {
  if (token.type === types.CHAR) {
    return new DRange(token.value);
  } else if (token.type === types.RANGE) {
    return new DRange(token.from, token.to);
  } else {
    const drange = new DRange();
    for (let i = 0; i < token.set.length; i++) {
      let subrange = expand(token.set[i]);
      drange.add(subrange);
    }
    const highest = drange.subranges().reduce((a, { high }) => Math.max(high, a), 0);
    const upper = (highest < 127) ? 126 : 0xfffd;
    const defaultRange = options && options.defaultRange ? options.defaultRange : new DRange(32, upper);
    if (token.not) {
      return defaultRange.clone().subtract(drange);
    } else {
      return defaultRange.clone().intersect(drange);
    }
  }
}


module.exports = regex;
