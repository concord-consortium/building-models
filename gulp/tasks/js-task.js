var gulp        = require('gulp');
var config      = require('../config').js;

// for now just copy.
gulp.task('js', function(){
  gulp.src(config.src)
    .pipe(gulp.dest(config.dest));
});