var gulp        = require('gulp');
var browserify  = require('browserify');
var source      = require("vinyl-source-stream");
var tsify       = require('tsify');
var production  = require('../config').production;
var config      = require('../config').browserify;
var beep        = require('beepbeep');

var errorHandler = function (error) {
  console.log(error.toString());
  beep();
  this.emit('end');
};

gulp.task('browserify-app', function(){
  return browserify({
    basedir: '.',
    debug: !production,
    //entries: [config.app.src],
    cache: {},
    packageCache: {},
  })
  .plugin(tsify)
  .bundle()
  .on('error', errorHandler)
  .pipe(source('app.js'))
  .pipe(gulp.dest(config.app.dest));
});

gulp.task('browserify-globals', function(){
  return browserify({
    basedir: '.',
    debug: !production,
    //entries: [config.globals.src],
    cache: {},
    packageCache: {},
  })
  .plugin(tsify)
  .bundle()
  .on('error', errorHandler)
  .pipe(source('globals.js'))
  .pipe(gulp.dest(config.globals.dest));
});

gulp.task('browserify', ['browserify-app', 'browserify-globals']);
