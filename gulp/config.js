const argv = require('minimist')(process.argv.slice(2));
const log = require('fancy-log');
const colors = require('ansi-colors');
const production = argv.production || argv.prod || false;
const destPath = 'dist';

const config = {
  env: 'development',
  production: production,

  src: {
    root: 'dev',
    templates: 'dev/templates',
    components: 'dev/templates/components',
    sass: 'dev/scss',
    js: 'dev/js',
    images: 'dev/images',
    css: 'dev/css',
    pages: 'dev/pages',
    fonts: 'dev/fonts',
    data: 'dev/templates/data',
    ajax: 'dev/ajax'
  },

  dest: {
    root: destPath,
    html: destPath,
    css: destPath + '/css',
    js: destPath + '/js',
    images: destPath + '/images',
    fonts: destPath + '/fonts',
    lib: destPath + '/lib',
    components: destPath + '/components',
    modules: destPath + '/components/modules',
    ajax: destPath + '/ajax'
  },

  ext: {
    images: ['jpg', 'png', 'svg', 'gif', 'mp4'],
    fonts: ['ttf', 'eot', 'woff', 'woff2']
  },

  settings: {
    autoprefixer: {
      cascade: true
    }
  },

  setEnv: function (env) {
    if (typeof env !== 'string') return;
    this.env = env;
    this.production = env === 'production';
    process.env.NODE_ENV = env;
  },

  logEnv: function () {
    log(colors.black.bgYellow(`Environment: ${process.env.NODE_ENV}`));
  },

  errorHandler: require('./util/handleErrors')
};

config.setEnv(production ? 'production' : 'development');

module.exports = config;
