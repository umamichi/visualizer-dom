import map from 'map-stream';
import gutil from 'gulp-util';

export const each = function each(cb) {
  return map((file, callback) => {
    cb(file);
    return callback(null, file);
  });
};

export const logFilename = function logFilename(prefix, suffix) {
  return map((file, callback) => {
    const filename = file.path.replace(process.cwd(), '');
    gutil.log(gutil.colors.yellow(prefix), gutil.colors.white('\'') + gutil.colors.magenta(filename) + gutil.colors.white('\''), gutil.colors.yellow(suffix));
    return callback(null, file);
  });
};

export const EndAll = (function() {
  function EndAll(callback) {
    this.registered = 0;
    this.doneCount = 0;
    this.callback = callback;

    this.register = register.bind(this);
    this.done = done.bind(this);

    return this.register;
  }

  function register() {
    this.registered++;

    return this.done;
  }

  function done() {
    ++this.doneCount >= this.registered && this.callback();
  }

  return EndAll;
})();
