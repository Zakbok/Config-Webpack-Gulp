'use strict';

const gulp = require('gulp');
const concat = require('gulp-concat');
// const debug = require('gulp-debug');
const postcss = require('gulp-postcss');
const csso = require('postcss-csso');

const config = require('../config.js');

const processors = [
  csso
];

gulp.task('vendor:css', function () {
  return gulp
    .src(config.src.css + '/**/*.css')
    // .pipe(debug())
    .pipe(concat('vendor.css'))
    .pipe(postcss(processors))
    .pipe(gulp.dest(config.dest.css));
});

gulp.task('vendor', gulp.parallel('vendor:css'));

gulp.task('vendor:watch', function () {
  gulp.watch(config.src.css + '/**/*.css', gulp.series('vendor:css'));
});
