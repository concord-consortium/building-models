var gulp        = require('gulp');
var beep        = require('beepbeep');
var coffeelint  = require('gulp-coffeelint');
var config      = require('../config').coffeelint;

gulp.task('coffeelint', function(){
  return gulp.src(config.src)
    .pipe(coffeelint({
      max_line_length: {
        level: 'ignore'
      },
      no_empty_functions: {
        level: 'warn'
      },
      no_empty_param_list: {
        level: 'warn'
      },
      prefer_english_operator: {
        level: 'warn'
      }
    }))
    .pipe(coffeelint.reporter())
    .pipe(coffeelint.reporter('fail'))
    .on('error', function () {
      beep();
    });
});
