var gulp   = require('gulp');
var beep   = require('beepbeep');
var eslint  = require('gulp-eslint');
var eslintIfFixed = require('gulp-eslint-if-fixed');
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

gulp.task('eslint:fix', function(){
  return gulp.src(config.src)
    .pipe(eslint({
      fix: true
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(eslintIfFixed(config.fix))
    .on('error', function () {
      beep();
    });
});