// 'use strict';
// const gulp = require('gulp');
// const inject = require('gulp-inject');
// const debug = require('gulp-debug');

// const config = require('../config');

// gulp.task('inject', function () {
//   const target = gulp.src(config.src.templates + '/layouts/_layout.html');
//   const sources = gulp.src([
//     '/js/devPanel.js',
//     '/js/listFiles.js'
//   ], {
//     read: false
//   });

//   return target
//     .pipe(inject(sources))
//     .pipe(debug())
//     .pipe(gulp.dest(config.src.templates + '/layouts'));
// });
