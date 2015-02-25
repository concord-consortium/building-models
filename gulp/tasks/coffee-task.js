var gulp        = require('gulp');
var config      = require('../config').coffee;
var coffee = require('gulp-coffee');

// for now just copy.
gulp.task('coffee', function(){
  gulp.src(config.src)
    .pipe(coffee())
    .pipe(gulp.dest(config.dest));
});