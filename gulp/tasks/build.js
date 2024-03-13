'use strict';

const gulp = require('gulp');

const config = require('../config');

function build (done) {
  return gulp.series(
    'clean',
    'sass',
    'nunjucks',
    'js',
    'comp',
    'assets',
    'vendor',
    'ajax'
  )(done);
}

gulp.task('build', function (done) {
  config.setEnv('production');
  config.logEnv();
  build(done);
});

gulp.task('build:dev', function (done) {
  config.setEnv('development');
  config.logEnv();
  build(done);
});
