import gulp from 'gulp';
import browserSync from 'browser-sync';

gulp.task('server', () => {
  browserSync({
    port: 3000,
    open: true,
    ghostMode: false,
    reloadOnRestart: true,
    notify: false,
    server: {
      baseDir: 'dist',
      directory: false
    }
  });
});
