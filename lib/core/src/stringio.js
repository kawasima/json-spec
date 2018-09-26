/* */

class BaseIO {
  print(str) {}
  newline(str) {}
  println(str) {
    this.print(str);
    this.newline()
  }
}

class StringIO {
  constructor() {
    this.buffer = '';
  }

  print(str) {
    this.buffer += str;
  }

  newline() {
    this.buffer += '\n';
  }

  toString() {
    return this.buffer;
  }
}

class ConsoleIO extends BaseIO {
  print(str) {
    console.log(str);
  }
}

module.exports = {
  ConsoleIO,
  StringIO
}
