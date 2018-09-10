const { I64 } = require('n64');

class Generator {
  constructor(gen) {
    this.gen = gen;
  }
}

function makeGen(generatorFunc) {
  return new Generator(generatorFunc);
}

function callGen(gen, rnd, size) {
  return gen.call(null, rnd, size);
}

function choose(lower, upper) {
  return (rnd, size) => {
    const value = randRange(rnd, lower, upper);
    return value;
  };
}

function fmap(f, generator) {
  return (rnd, size) => f(generator(rnd,size));
}

function repeat(n, el) {
  return Array.apply(null, Array(10)).map(() => el);
}

function vector(generator) {
  return (rnd, size) => repeat(size, generator).map(gen => gen(rnd, size));
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
  get string() { return fmap(join, vector(this.char)) },
  get stringAscii() { return fmap(join, vector(this.charAscii)) },
  get stringAlphanumeric() { return fmap(join, vector(this.charAlphanumeric)) },
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
    result[i] = generator.call(null, randomUnit, range.next());
  }
  return result;
}

module.exports = {
  generators,
  fmap,
  sample,
  oneOf,
  choose
}
