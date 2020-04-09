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
    throw new Error("Reach the max tries");
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

function frequency(pairs) {
  const total = pairs.map(([v, g]) => v)
        .reduce((prev, current) => prev + current);
  const acPairs = pairs
        .filter(([v, g]) => v > 0)
        .reduce((acc, [v, g]) => {
          const prev = (acc.length > 0) ? acc[acc.length - 1][0] : 0
          acc.push([prev + v, g]);
          return acc;
        }, []);
  return (rnd, size) => {
    return callGen(
      genBind(choose(0, total - 1),
              x => {
                return acPairs.find(([v, g]) => v >= x)[1];
              })
      , rnd, size);
  }
}

function fmap(f, generator) {
  return (rnd, size) => f(generator(rnd, size));
}

function repeat(n, el) {
  return Array.apply(null, Array(n)).map(() => el);
}

function vector(generator, ...args) {
  switch(args.length) {
  case 0:
    return genBind(sized(x => choose(0, x)),
                   numElements => {
                     return (rnd, size) => repeat(numElements, generator)
                       .map(gen => gen(rnd, size))
                   });
  case 1:
    const numElements = args[0];
    return tuple(repeat(numElements, generator));
  default:
    const [minElements, maxElements] = args;
    return genBind(choose(minElements, maxElements),
                   numElements => {
                     return (rnd, size) => repeat(numElements, generator)
                       .map(gen => gen(rnd, size))
                   });
  }
}

function collDistinctBy_(emptyColl, keyFn, shuffleFn, gen, rng, size, numElements, minElements, maxTries, exFn) {
  const res = [];
  let s = size;
  for (let tries = 0; tries <= maxTries && numElements != res.length; tries++) {
    const v = callGen(gen, rng, size);
    if (res.includes(v)) {
      s += 1;
    } else {
      res.push(v);
      s = size;
      tries = 0;
    }
  }
  if (res.length === numElements) {
    return res;
  } else {
    throw exFn({
      gen,
      maxTries,
      numElements
    });
  }
}

function collDistinctBy(emptyColl, keyFn, allowsDupes, ordered, gen,
                        {numElements, minElements, maxElements, maxTries = 10,
                         exFn = (ex) => new Error("Couldn't generate enough distinct elements!") }) {
  const hardMinElements = numElements || minElements || 1;
  if (numElements) {
    return (rng, genSize) => {
      if (allowsDupes) {
      }
    };
  } else {
    return genBind(
      maxElements ? choose(minElements, maxElements) : sized(s => choose(minElements, minElements + s)),
      (numElements) => (rng, genSize) => collDistinctBy_(
        emptyColl, keyFn, (rng, coll) => coll, gen, rng, genSize,
        numElements, hardMinElements, maxTries, exFn
      ));
  }
}

function vectorDistinct(gen, opts = {}) {
  return collDistinctBy([], x => x, true, true, gen, opts);
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
  get posInt() { return fmap(Math.abs, this.int) },
  double: (rnd, size) => rnd.randDouble() * rnd.randLong(),
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
  get stringAlpha() { return fmap(join, vector(this.charAlpha)) },
  get largeInteger() { return largeInteger_({}) },
}

function genObject(requiredGenerators = {}, optionalGenerators = {}) {
  return (rnd, size) => {
    const obj = {};
    for (k in requiredGenerators) {
      obj[k] = callGen(requiredGenerators[k], rnd, size);
    }

    const optKeys = Object.keys(optionalGenerators);
    const ary = Array.from({length: optKeys.length}, (v, k) => k);
    for (let i = ary.length - 1; i >= 0; i--) {
      const j = callGen(choose(0, i), rnd, size);
      const tmp = ary[i]; ary[i] = ary[j]; ary[j] = tmp;
    }
    const cnt = callGen(choose(0, optKeys.length), rnd, size);
    ary.slice(cnt).forEach(i => {
      const k = optKeys[i];
      obj[k] = callGen(optionalGenerators[k], rnd, size);
    });
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

function generate(generator, size = 30) {
  const randomUnit = new RandomUnit();
  return callGen(generator, randomUnit, size);
}

module.exports = {
  generators,
  fmap,
  frequency,
  sample,
  generate,
  oneOf,
  elements,
  choose,
  genObject,
  vector,
  vectorDistinct,
  tuple,
  repeat,
  suchThat
}
