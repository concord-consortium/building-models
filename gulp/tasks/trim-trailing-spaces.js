var gulp = require('gulp');
var es = require('event-stream');
var config = require('../config');

// adapted from: https://github.com/massick/gulp-strip-code/blob/master/index.js
var trimTrailing = function () {
  var doStrip = function (file, callback) {
    var isStream = file.contents && typeof file.contents.on === 'function' && typeof file.contents.pipe === 'function';
    var isBuffer = file.contents instanceof Buffer;

    if (isStream) {
      return callback(new Error('gulp-strip-code: Streaming not supported'), file);
    }

    if (isBuffer) {
      file.contents = new Buffer(String(file.contents).replace(/[ \t]+$/gm, ""));
      return callback(null, file);
    }

    callback(null, file);
  };

  return es.map(doStrip);
};

gulp.task('trim-trailing-spaces', function() {
  ['assets', 'code', 'stylus'].forEach(function (type) {
    gulp.src(config.trim[type].src)
      .pipe(trimTrailing())
      .pipe(gulp.dest(config.trim[type].dest));
  });
});
