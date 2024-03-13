'use strict';

const gulp = require('gulp');

function def (done) {
  return gulp.parallel(
    'watch',
    'server'
  )(done);
}

gulp.task('default', function (done) {
  def(done);
});
