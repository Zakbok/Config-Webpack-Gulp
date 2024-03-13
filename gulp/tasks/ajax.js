'use strict';

const gulp = require('gulp');

const config = require('../config');

gulp.task('ajax', function () {
  return gulp
    .src(config.src.ajax + '/*.*')
    .pipe(gulp.dest(config.dest.ajax));
});

gulp.task('ajax:watch', function () {
  gulp.watch(config.src.ajax + '/*.*', gulp.series('ajax'));
});
