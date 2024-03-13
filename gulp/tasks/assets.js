'use strict';

const gulp = require('gulp');
const changed = require('gulp-changed');
const svgmin = require('gulp-svgmin');
// const debug = require('gulp-debug');
const plumber = require('gulp-plumber');
const svgStore = require('gulp-svgstore');

const config = require('../config');

// шрифты
gulp.task('assets:fonts', function () {
  return gulp
    .src(config.src.fonts + '/*.{' + config.ext.fonts + '}')
    .pipe(changed(config.dest.fonts))
    // .pipe(debug())
    .pipe(gulp.dest(config.dest.fonts));
});

// картинки (кроме svg)
gulp.task('assets:images', function () {
  return gulp
    .src([config.src.images + '/**/*.{' + config.ext.images + '}', '!' + config.src.images + '/svg/*.svg'])
    .pipe(changed(config.dest.images))
    // .pipe(debug())
    .pipe(gulp.dest(config.dest.images));
});

gulp.task('assets:svg', function () {
  return gulp
    .src(config.src.images + '/svg/*.svg')
    .pipe(plumber({
      errorHandler: config.errorHandler
    }))
    .pipe(svgmin({
      multipass: true,
      js2svg: {
        pretty: true
      },
      plugins: [{
        removeDesc: true
      }, {
        removeComments: true
      }, {
        removeViewBox: false
      }]
    }))
    .pipe(svgStore({ inlineSvg: true }))
    .pipe(gulp.dest(config.dest.images));
});

// фавиконки
gulp.task('assets:favicons', function () {
  return gulp
    .src(config.src.root + '/favicons/*.*')
    .pipe(plumber({
      errorHandler: config.errorHandler
    }))
    .pipe(gulp.dest(config.dest.root));
});

gulp.task('assets', gulp.series('assets:fonts', 'assets:images', 'assets:svg', 'assets:favicons'));

gulp.task('assets:watch', function () {
  gulp.watch(config.src.fonts + '/*.{' + config.ext.fonts + '}', gulp.series('assets:fonts'));
  gulp.watch(config.src.images + '/*.{' + config.ext.images + '}', gulp.series('assets:images'));
  gulp.watch(config.src.images + '/svg/*.{' + config.ext.images + '}', gulp.series('assets:svg'));
  gulp.watch(config.src + '/favicons/*.*', gulp.series('assets:favicons'));
});
