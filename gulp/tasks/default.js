var gulp = require('gulp');
var config = require('../config');

// Note that it would be simpler to just remove the './' from the definitions
// of `src` and `dest` in config.js, but that broke other tasks. Rather than
// figure out how to fix those other tasks, we simply make the change locally.
function gulpWatch(watchConfig, tasks) {
  // eliminate leading './' in paths in favor of cwd option
  function replaceDotSlash(glob) {
    return glob.replace(/^\.\//, '');
  }
  // watchConfig can be glob string or array of glob strings
  function processWatchConfig(watchConfig) {
    return Array.isArray(watchConfig)
            ? watchConfig.map(function(glob) { return replaceDotSlash(glob); })
            : replaceDotSlash(watchConfig);
  }
  // cwd is required for new/deleted files to be detected (http://stackoverflow.com/a/34346524)
  gulp.watch(processWatchConfig(watchConfig), { cwd: './' }, tasks);
}

gulp.task('watch', function() {
  gulpWatch(config.css.watch,                 ['css']);
  gulpWatch(config.eslint.watch,              ['eslint']);
  gulpWatch(config.browserify.app.watch,      ['browserify-app']);
  gulpWatch(config.browserify.globals.watch,  ['browserify-globals']);
  gulpWatch(config.assets.watch,              ['assets']);
  gulpWatch(config.vendor.watch,              ['vendor']);
});

gulp.task('lint', ['eslint']);

gulp.task('build-all', ['eslint', 'browserify-app', 'browserify-globals', 'css', 'assets', 'vendor']);

gulp.task('default', ['build-all', 'watch']);
