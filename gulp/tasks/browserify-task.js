var gulp        = require('gulp');
var browserify  = require('browserify');
var source      = require("vinyl-source-stream");
var babelify    = require('babelify');
var production  = require('../config').production;
var config      = require('../config').browserify;
var beep        = require('beepbeep');

var errorHandler = function (error) {
  console.log(error.toString());
  beep();
  this.emit('end');
};

gulp.task('browserify-app', function(){
  var b = browserify({
    debug: !production,
    extensions: ['.js']
  });
  b.transform(babelify);
  b.add(config.app.src);
  return b.bundle()
    .on('error', errorHandler)
    .pipe(source('app.js'))
    .pipe(gulp.dest(config.app.dest));
});

gulp.task('browserify-globals', function(){
  var b = browserify({
    debug: !production
  });
  b.transform(babelify);
  b.add(config.globals.src);
  return b.bundle()
    .on('error', errorHandler)
    .pipe(source('globals.js'))
    .pipe(gulp.dest(config.globals.dest));
});

gulp.task('browserify', ['browserify-app', 'browserify-globals']);
