var src   = './src';
var dest  = './public';

module.exports = {
  css: {
    src: src + '/stylus/**/*.styl',
    dest: dest + '/css/'
  },
  // TODO: Maybe we compile these?
  js: {
    src: src + '/javascripts/**/*.js',
    dest: dest + '/javascripts/'
  },
  coffee: {
    src: src + '/javascripts/**/*.coffee',
    dest: dest + '/javascripts/'
  },
  jsx: {
    src: src + '/javascripts/**/*.jsx',
    dest: dest + '/javascripts/'
  },
  assets: {
    src: src + '/assets/**/*.*',
    dest: dest
  }
};