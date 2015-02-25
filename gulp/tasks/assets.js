var gulp        = require('gulp');
var config      = require('../config').assets;
var react = require('gulp-react');
 
// Copy files directly simple
gulp.task('assets', function() {
  return gulp.src(config.src)
    .pipe(gulp.dest(config.dest));
});