var gulp   = require('gulp');
var beep   = require('beepbeep');
var eslint  = require('gulp-eslint');
var config = require('../config').eslint;

gulp.task('eslint', function(){
  return gulp.src(config.src)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .on('error', function () {
      beep();
    });
});
