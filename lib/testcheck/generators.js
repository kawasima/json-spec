const generators = require('./src/generators');
module.exports = {
  ...generators,
  regex: require('./src/regex')
}
