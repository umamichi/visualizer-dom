import gulp from 'gulp';
import gutil from 'gulp-util';
import store from '../store.js';
import del from 'del';

gulp.task('default', () => {
  gutil.log(gutil.colors.green('`gulp`'), gutil.colors.magenta('command is not allowed. Use'), gutil.colors.green('`npm start`'), gutil.colors.magenta('instead'));
});

gulp.task('dev', () => {
  declareTask('Running as development mode.');
  store.setDevelopment();
  store.setWatching();

  gulp.start([
    'server',
    'static',
    'html',
    'css',
    'js'
  ]);
});

gulp.task('prod-test', () => {
  declareTask('Running as production-test mode.');
  store.setProduction();
  store.setWatching();

  gulp.start([
    'server',
    'static',
    'html',
    'css',
    'js'
  ]);
});

gulp.task('prod', () => {
  declareTask('Building production files.');
  store.setProduction();

  del('dist').then(() => {
    gulp.start([
      'html',
      'static',
      'css',
      'js',
      'image'
    ]);
  });
});

gulp.task('html5lint', () => {
  declareTask('Testing html5 grammar.');

  gulp.start([
    'html:lint'
  ]);
});

gulp.task('image', () => {
  declareTask('Building image files.');

  gulp.start([
    'image:reset',
    'image:static',
    'image:sprite'
  ]);
});

gulp.task('image-sprite', () => {
  declareTask('Generating sprite image file.');

  gulp.start([
    'image:sprite'
  ]);
});

function declareTask(message) {
  gutil.log(gutil.colors.bgCyan.bold(message));
}
