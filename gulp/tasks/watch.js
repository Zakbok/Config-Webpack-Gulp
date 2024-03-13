'use strict';

const gulp = require('gulp');

function watch (done) {
  return gulp.parallel(
    'nunjucks:watch',
    'sass:watch',
    'assets:watch',
    'js:watch',
    'comp:watch',
    'vendor:watch',
    'ajax:watch'
  )(done);
}

gulp.task('watch', function (done) {
  watch(done);
});
