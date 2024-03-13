'use strict';

const gulp = require('gulp');
const plumber = require('gulp-plumber');
// const debug = require('gulp-debug');

const webpack = require('webpack-stream');
const webpackConfig = require('../../webpack.config').createConfig;

const config = require('../config');

gulp.task('js:core', function () {
  const entry = {
    main: `${config.src.js}/main.ts`,
    broadcast: `${config.src.js}/broadcast.ts`
  };
  const output = {
    filename: '[name].bundle.js'
  };

  return gulp
    .src(`${config.src}/index.js`)
    // .pipe(debug())
    .pipe(plumber({
      errorHandler: config.errorHandler
    }))
    .pipe(webpack(webpackConfig(config.env, entry, output)))
    .pipe(gulp.dest(config.dest.js));
});

gulp.task('js:vendor', function () {
  return gulp
    .src([`${config.src.js}/vendor/**/*.*`])
    // .pipe(debug())
    .pipe(plumber({
      errorHandler: config.errorHandler
    }))
    .pipe(gulp.dest(config.dest.js));
});

gulp.task('js:poly', function () {
  return gulp
    .src([config.src.js + '/polyfills/**/*.js'])
    // .pipe(debug())
    .pipe(plumber({
      errorHandler: config.errorHandler
    }))
    .pipe(gulp.dest(config.dest.js));
});

gulp.task('js', gulp.series('js:vendor', 'js:poly', 'js:core'));

gulp.task('js:watch', function () {
  gulp.watch(config.src.js + '/**/*.{js,ts}', gulp.series('js'));
  gulp.watch([config.src.components + '/**/*.{js,ts}', `!${config.src.components}/modules/**/*.js`], gulp.series('js'));
});
