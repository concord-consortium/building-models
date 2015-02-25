var gulp = require('gulp');
var config = require('../config');

gulp.task('watch', function() {
    gulp.watch(config.css.src,      ['css']);
    gulp.watch(config.coffee.src,   ['coffee']);
    gulp.watch(config.js.src,       ['js']);
    gulp.watch(config.jsx.src,      ['jsx']);
    gulp.watch(config.assets.src,   ['assets']);
});

gulp.task('build-all', ['coffee', 'jsx', 'js', 'css', 'assets']);

gulp.task('default', ['build-all', 'watch']);