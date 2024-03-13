const gulp = require('gulp');
const htmlhint = require('gulp-htmlhint');
// const gitStaged = require('gulp-git-staged');

const config = require('../config');

gulp.task('lint:html', function () {
  return gulp.src(config.dest.html + '/*.html')
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.reporter());
});

gulp.task('lint', gulp.series('lint:html'));
