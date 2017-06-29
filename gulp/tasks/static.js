import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import store from '../store.js';
import browserSync from 'browser-sync';
import { logFilename } from '../utils.js';

const $ = gulpLoadPlugins();

gulp.task('static', (reportTaskEnd) => {
  rebundle(false, reportTaskEnd);

  if (store.isWatching()) {
    $.watch('src/statics/**/*', rebundle);
  }
});

function rebundle(_firedByWatch, reportTaskEnd) {
  const firedByWatch = typeof _firedByWatch === 'boolean' ? _firedByWatch : true;

  gulp
    .src('src/statics/**/*', {
      baseDir: 'src/statics'
    })
    .pipe($.cached())
    .pipe(firedByWatch ? logFilename('Copying static File', '...') : $.util.noop())
    .pipe(gulp.dest('dist'))
    .on('end', () => {
      typeof reportTaskEnd === 'function' && reportTaskEnd();
      store.isWatching() && firedByWatch && browserSync.reload();
    });
}
