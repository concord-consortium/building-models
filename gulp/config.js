var argv = require('yargs').argv,
    environment = process.env.ENVIRONMENT || "development",
    production = !!argv.production,
    buildInfo = argv.buildInfo || 'development build (' + (new Date()) + ')',
    src = './src',
    dest  = production ? './dist' : './dev';

module.exports = {
  production: production,
  environment: environment,
  buildInfo: buildInfo,
  css: {
    watch: src + '/stylus/**/*.styl',
    src: src + '/stylus/**/app.styl',
    dest: dest + '/css/'
  },
  browserify: {
    app: {
      watch: [src + '/code/**/*.*', '!' + src + '/code/globals.coffee'],
      src: src + '/code/app.coffee',
      dest: dest + '/js/'
    },
    globals: {
      watch: src + '/code/globals.coffee',
      src: src + '/code/globals.coffee',
      dest: dest + '/js/'
    }
  },
  coffeelint: {
    watch: src + '/code/**/*.coffee',
    src: src + '/code/**/*.coffee',
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
  },
  trim: {
    assets: {
      src: [src + '/assets/**/*.html', src + '/assets/**/*.json'],
      dest: src + '/assets/'
    },
    code: {
      src: src + '/code/**/*.*',
      dest: src + '/code/'
    },
    stylus: {
      src: src + '/stylus/**/*.*',
      dest: src + '/stylus/'
    }
  }
};
