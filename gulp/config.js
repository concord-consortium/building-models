var execSync = require('sync-exec'),
    buildDate = execSync('date +"%Y-%m-%d"').stdout,
    gitTags   = execSync('git describe --tags').stdout,
    gitLog = execSync('git log -1 --date=short --pretty=format:"%cd %h %ce"').stdout;


var argv = require('yargs').argv,
    environment = process.env.ENVIRONMENT || "development",
    production = !!argv.production,
    buildInfo = {
      date: buildDate,
      tag: gitTags.split('-')[0],
      commiter: gitLog.split(" ")[2],
      commit: gitLog.split(" ")[1]
    },
    buildInfoString = (buildInfo.date + " " +
      buildInfo.tag + " " +
      buildInfo.commit + " " +
      buildInfo.commiter).replace(/\n|\r/g,""),
    commitString = buildInfo.commit,

    src = './src';

var dest  = production ? './dist' : './dev';

module.exports = {
  production: production,
  environment: environment,
  buildInfo: buildInfo,
  buildInfoString: buildInfoString,
  commitString: commitString,
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
