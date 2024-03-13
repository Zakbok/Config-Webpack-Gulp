'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const csso = require('postcss-csso');
const stylelint = require('stylelint');
const gulpIf = require('gulp-if');
const sortMediaQueries = require('../util/sortMediaQueries');

const config = require('../config');

const processors = [
  autoprefixer(config.settings.autoprefixer),
  mqpacker({
    sort: sortMediaQueries
  }),
  csso
];

gulp.task('sass', function () {
  // if (!config.production) {
  //   processors.unshift(stylelint);
  // }

  return gulp
    .src(config.src.sass + '/**/*.{sass,scss}')
    .pipe(gulpIf(!config.production, sourcemaps.init()))
    .pipe(sass({
      outputStyle: config.production ? 'compressed' : 'expanded', // nested, expanded, compressed
      precision: 5
    }))
    .pipe(postcss(processors))
    .on('error', config.errorHandler)
    .pipe(gulpIf(!config.production, sourcemaps.write('./')))
    .pipe(gulp.dest(config.dest.root));
});

gulp.task('sass:watch', function () {
  gulp.watch(config.src.sass + '/**/*.{sass,scss}', gulp.series('sass'));
});
