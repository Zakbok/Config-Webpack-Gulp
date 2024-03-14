'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
// const stylelint = require('stylelint');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const csso = require('postcss-csso');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const gulpIf = require('gulp-if');
const concat = require('gulp-concat');
const plumber = require('gulp-plumber');
const sortMediaQueries = require('../util/sortMediaQueries');

const webpack = require('webpack-stream');
const webpackConfig = require('../../webpack.config').createConfig;

const config = require('../config');
const processors = [
  autoprefixer(config.settings.autoprefixer),
  mqpacker({
    sort: sortMediaQueries
  }),
  csso
];

gulp.task('comp:styles', function () {
  // if (!config.production) {
  //   processors.unshift(stylelint);
  // }

  return gulp
    .src([config.src.components + '/**/*.{sass,scss}', `!${config.src.components}/modules/**/*.{sass,scss}`])
    .pipe(gulpIf(!config.production, sourcemaps.init()))
    .pipe(sass({
      outputStyle: config.production ? 'compressed' : 'expanded', // nested, expanded, compressed
      precision: 5
    }))
    .on('error', config.errorHandler)
    .pipe(concat('components.css'))
    .pipe(postcss(processors))
    .pipe(gulpIf(!config.production, sourcemaps.write('./')))
    .pipe(gulp.dest(config.dest.css));
});

gulp.task('comp:styles-isolated', function () {
  // if (!config.production) {
  //   processors.unshift(stylelint);
  // }

  return gulp
    .src(`${config.src.components}/modules/**/*.{sass,scss}`)
    .pipe(gulpIf(!config.production, sourcemaps.init()))
    .pipe(sass({
      outputStyle: config.production ? 'compressed' : 'expanded', // nested, expanded, compact, compressed
      precision: 5
    }))
    .on('error', config.errorHandler)
    .pipe(postcss(processors))
    .pipe(gulpIf(!config.production, sourcemaps.write('./')))
    .pipe(gulp.dest(config.dest.modules));
});

gulp.task('comp:styles:watch', function () {
  gulp.watch(config.src.components + '/**/*.{sass,scss}', gulp.series('comp:styles'));
});

// scripts
gulp.task('comp:js', function () {
  const output = {
    filename: 'components.js'
  };

  return gulp
    .src([config.src.components + '/**/*.{js,ts}', `!${config.src.components}/modules/**/*.js`])
    .pipe(plumber({
      errorHandler: config.errorHandler
    }))
    .pipe(webpack(webpackConfig(config.env, false, output)))
    .pipe(gulp.dest(config.dest.js));
});

gulp.task('comp:js-isolated', function () {
  return gulp
    .src(`${config.src.components}/modules/**/*.js`)
    .pipe(plumber({
      errorHandler: config.errorHandler
    }))
    .pipe(babel())
    .pipe(gulpIf(config.production, uglify()))
    .pipe(gulp.dest(config.dest.modules));
});

// images
gulp.task('comp:images', function () {
  return gulp
    .src(config.src.components + '/**/*.{' + config.ext.images + '}')
    .pipe(plumber({
      errorHandler: config.errorHandler
    }))
    .pipe(gulp.dest(config.dest.components));
});

// fonts
gulp.task('comp:fonts', function () {
  return gulp
    .src(config.src.components + '/**/*.{' + config.ext.fonts + '}')
    .pipe(gulp.dest(config.dest.components));
});

gulp.task('comp', gulp.parallel('comp:styles', 'comp:images', 'comp:fonts', 'comp:styles-isolated', 'comp:js-isolated'));

gulp.task('comp:watch', function () {
  gulp.watch(config.src.components + '/**/*.scss', gulp.series('comp:styles', 'comp:styles-isolated'));
  gulp.watch(config.src.components + '/**/*.{js,ts}', gulp.series('comp:js-isolated'));
  gulp.watch(config.src.components + '/**/*.{' + config.ext.images + '}', gulp.series('comp:images'));
  gulp.watch(config.src.components + '/**/*.{' + config.ext.fonts + '}', gulp.series('comp:fonts'));
});
