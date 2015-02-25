var gulp = require('gulp');
var config = require('../config');

gulp.task('watch', function() {
    gulp.watch(config.css.src,      ['css']);
    gulp.watch(config.coffee.src,   ['coffee']);
    gulp.watch(config.js.src,       ['js']);
});

gulp.task('build-all', ['coffee', 'js', 'css']);

gulp.task('default', ['build-all', 'watch']);