'use strict';

const gulp = require('gulp');
const del = require('del');
const log = require('fancy-log');
const colors = require('ansi-colors');

const config = require('../config');

gulp.task('clean', function (cb) {
  return del([
    config.dest.root
  ]).then(function (paths) {
    let folders = paths.join('\n');

    log(colors.green(`Deleted: ${folders}`));
  });
});
