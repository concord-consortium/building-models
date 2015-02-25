var gulp        = require('gulp');
var config      = require('../config').jsx;

// for now just copy.
gulp.task('jsx', function(){
  gulp.src(config.src)
    .pipe(gulp.dest(config.dest));
});