var gulp = require('gulp');
var config = require('../config');

gulp.task('watch', function() {
    gulp.watch(config.css.watch,                ['css']);
    gulp.watch(config.coffeelint.watch,         ['coffeelint']);
    gulp.watch(config.browserify.app.watch,     ['browserify-app']);
    gulp.watch(config.browserify.globals.watch, ['browserify-globals']);
    gulp.watch(config.assets.watch,             ['assets']);
    gulp.watch(config.vendor.watch,             ['vendor']);
});

gulp.task('build-all', ['coffeelint', 'browserify-app', 'browserify-globals', 'css', 'assets', 'vendor']);

gulp.task('default', ['build-all', 'watch']);