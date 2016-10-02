const gulp = require('gulp');
const del = require('del');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');

gulp.task('clean', () => {
  // Clean dest folder
  del(['dist/**']);
});

gulp.task('copy', [ 'clean' ], () => {
  // Copy all files
  return gulp
    .src('src/**/*')
    .pipe(gulp.dest('dist/'));
});

gulp.task('browserify', [ 'clean', 'copy' ], () => {
  // Convert JS files with Babel
  var babel_bundle = browserify('src/bulwark-client/assets/js/main.js', { debug: true })
    .transform(babelify)
    .bundle()
    .pipe(source('bulwark-client/assets/js/main.js'))
    .pipe(gulp.dest('dist/'));

});

gulp.task('default', [ 'clean', 'copy', 'browserify' ]);
