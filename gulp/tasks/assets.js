var gulp        = require('gulp');
var production  = require('../config').production;
var buildInfo   = require('../config').buildInfo;
var environment = require('../config').environment;
var config      = require('../config').assets;
var gulpif      = require('gulp-if');
var replace     = require('gulp-replace');

var isHTML = function (file) {
  return /\.html$/.test(file.path);
};

// Copy files directly simple
gulp.task('assets', function() {
  return gulp.src(config.src)
    .pipe(gulpif(isHTML, replace(/__BUILD_INFO__/g,  buildInfo)))
    .pipe(gulpif(isHTML, replace(/__ENVIRONMENT__/g, environment)))
    .pipe(gulp.dest(config.dest));
});
