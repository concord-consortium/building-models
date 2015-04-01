var argv = require('yargs').argv,
    production = !!argv.production,
    buildInfo = argv.buildInfo || 'development build (' + (new Date()) + ')',
    src = './src',
    dest  = production ? './dist' : './dev'

module.exports = {
  production: production,
  buildInfo: buildInfo,
  css: {
    watch: src + '/stylus/**/*.styl',
    src: src + '/stylus/**/*.styl',
    dest: dest + '/css/'
  },
  browserify: {
    app: {
      watch: [src + '/javascripts/**/*.*', '!' + src + '/javascripts/globals.coffee'],
      src: src + '/javascripts/app-view.jsx',
      dest: dest + '/js/'
    },
    globals: {
      watch: [src + '/javascripts/globals.coffee'],
      src: src + '/javascripts/globals.coffee',
      dest: dest + '/js/'
    }
  },
  assets: {
    watch: src + '/assets/**/*.*',
    src: src + '/assets/**/*.*',
    dest: dest
  },
  vendor: {
    watch: src + '/vendor/**/*.*',
    src: src + '/vendor/**/*.*',
    dest: dest + '/js/'
  }
};