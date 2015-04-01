var gulp       = require('gulp');
var production = require('../config').production;
var buildInfo  = require('../config').buildInfo;
var config     = require('../config').assets;
var replace    = require('gulp-replace');
 
// Copy files directly simple
gulp.task('assets', function() {
  return gulp.src(config.src)
    .pipe(replace(/__BUILD_INFO__/g, buildInfo))
    .pipe(gulp.dest(config.dest));
});