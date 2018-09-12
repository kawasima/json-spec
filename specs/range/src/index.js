const { spec, and } = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const basic = require('@json-spec/spec-basic');

function isDateInRange(start, end, date) {
  const startMs = start.getTime();
  const endMs   = end.getTime();
  const t       = date.getTime();
  return date instanceof Date
    && startMs <= t && t < endMs;
}

function dateIn(start, end) {
  const st = start.getTime();
  const et = end.getTime();
  return spec(and(x => x instanceof Date, x => isDateInRange(start, end, x)),
              { gen: () => gen.fmap(x => new Date(x), gen.choose(st, et)) });
}

function intInRange(start, end, val) {
  return typeof val === 'number' && isFinite(val) && Math.floor(val) === val
    && start <= val && val < end;
}

function intIn(start, end) {
  return spec(and(basic.int, x => intInRange(start, end, x)),
              { gen: () => gen.choose(start, end - 1) });
}

module.exports = {
  dateIn,
  intIn
}
