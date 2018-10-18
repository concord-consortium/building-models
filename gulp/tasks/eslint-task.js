var gulp        = require('gulp');
var beep        = require('beepbeep');
var coffeelint  = require('gulp-coffeelint');
var config      = require('../config').coffeelint;

gulp.task('coffeelint', function(){
  return gulp.src(config.src)
    .pipe(coffeelint())
    .pipe(coffeelint.reporter())
    .pipe(coffeelint.reporter('fail'))
    .on('error', function () {
      beep();
    });
});
