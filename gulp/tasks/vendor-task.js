var gulp   = require('gulp');
var config = require('../config').vendor;
 
// copy files directly simple
gulp.task('vendor', function() {
  return gulp.src(config.src)
    .pipe(gulp.dest(config.dest));
});