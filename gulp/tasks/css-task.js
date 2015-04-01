var gulp       = require('gulp');
var config     = require('../config').css;
var production = require('../config').production;
var stylus     = require('gulp-stylus');
var concat     = require('gulp-concat');

gulp.task('css', function() {
  gulp.src(config.src)
    .pipe(stylus({ compress: production}))
    .pipe(concat('app.css'))
    .pipe(gulp.dest(config.dest));
});