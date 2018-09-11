const { I64 } = require('n64');

const MAX_INTEGER = Math.pow(2, 53) - 1;
const MIN_INTEGER = -MAX_INTEGER;

function callGen(gen, rnd, size) {
  return gen.call(null, rnd, size);
}

function choose(lower, upper) {
  return (rnd, size) => {
    const value = randRange(rnd, lower, upper);
    return value;
  };
}

function suchThat(pred, gen, maxTries) {
  return (rnd, size) => {
    let s = size;
    for(let i=0; i<maxTries; i++) {
      const value = callGen(gen, rnd, s);
      if (pred(value)) {
        return value;
      }
      s += 1;
    }
    throw "Reach the max tries";
  }
}

function tuple(...generators) {
  return (rnd, size) => generators.map(gen => callGen(gen, rnd, size));
}

function genBind(generator, k) {
  return (rnd, size) => {
    const inner = callGen(generator, rnd, size);
    const result = k.call(null, inner);
    return callGen(result, rnd, size);
  };
}

function fmap(f, generator) {
  return (rnd, size) => f(generator(rnd, size));
}

function repeat(n, el) {
  return Array.apply(null, Array(n)).map(() => el);
}

function vector(generator) {
  return genBind(sized(x => choose(0, x)),
                 numElements => {
                   return (rnd, size) => repeat(numElements, generator).map(gen => gen(rnd, size))
                 });
  //return (rnd, size) => repeat(size, generator).map(gen => gen(rnd, size));
}

function calcLong(factor, lower, upper) {
  return Math.floor(lower + (factor * (upper + 1.0)) - (factor * lower));
}

function randRange(rnd, lower, upper) {
  return calcLong(rnd.randDouble(), lower, upper);
}

function sized(sizedGen) {
  return function(rnd, size) {
    const gen = sizedGen.call(null, size);
    return callGen(gen, rnd, size)
  };
}

function join(coll) {
  return coll.join('');
}

function largeInteger_({min=MIN_INTEGER, max=MAX_INTEGER}) {
  return choose(min, max);
}

const generators = {
  int: sized((size) => choose(-size, size)),
  char: fmap(String.fromCharCode, choose(0, 255)),
  charAscii: fmap(String.fromCharCode, choose(32, 126)),
  charAlphanumeric: fmap(String.fromCharCode, oneOf(
    choose(48, 57),
    choose(65, 90),
    choose(97, 122)
  )),
  charAlpha: fmap(String.fromCharCode, oneOf(
    choose(65, 90),
    choose(97, 122)
  )),
  boolean: elements([false, true]),
  date: fmap(x=> new Date(x), largeInteger_({})),
  get string() { return fmap(join, vector(this.char)) },
  get stringAscii() { return fmap(join, vector(this.charAscii)) },
  get stringAlphanumeric() { return fmap(join, vector(this.charAlphanumeric)) },
  get largeInteger() { return largeInteger_({}) },
}

function genObject(generators) {
  return (rnd, size) => {
    const obj = {};
    for (k in generators) {
      obj[k] = callGen(generators[k], rnd, size);
    }
    return obj;
  };
}

class RandomUnit {
  constructor() {
    let x = 1;
    for (let i = 53; i > 0; i--) {
      x /= 2;
    }
    this.doubleUnit = x;
    this.bigDoubleUnit = this.doubleUnit * 4294967296;
  }

  randDouble() {
    const long = this.randLong();
    const x = long.ushrn(11);
    return (this.doubleUnit * x.lo) + (this.bigDoubleUnit * x.hi);
  }

  randLong() {
    return I64.random();
  }
}

function elements(coll) {
  return (rnd, size) => coll[choose(0, coll.length - 1)(rnd, size)];
}

function oneOf(...generators) {
  return (rnd, size) => generators[choose(0, generators.length - 1)(rnd, size)](rnd,size);
}

function* rangeCyclic(from, to) {
  let i = from;
  while(true) {
    yield i;
    i = i >= to ? from : i + 1;
  }
}

function sample(generator, numSample = 10) {
  const randomUnit = new RandomUnit();
  const range = rangeCyclic(0, numSample);
  const result = new Array(numSample);
  for (let i = 0; i < numSample; i++) {
    result[i] = generator.call(null, randomUnit, range.next().value);
  }
  return result;
}

module.exports = {
  generators,
  fmap,
  sample,
  oneOf,
  choose,
  genObject,
  vector,
  tuple,
  suchThat
}
