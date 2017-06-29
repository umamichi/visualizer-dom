import gulp from 'gulp';
import spritesmith from 'gulp.spritesmith';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import optipng from 'imagemin-optipng';
import pngcrush from 'imagemin-pngcrush';
import jpegoptim from 'imagemin-jpegoptim';
import jpegtran from 'imagemin-jpegtran';
import { EndAll } from '../utils.js';

const $ = gulpLoadPlugins();

gulp.task('image:reset', (reportTaskEnd) => {
  del('dist/assets/images/**/*').then(() => {
    reportTaskEnd();
  });
});

gulp.task('image:sprite', (reportTaskEnd) => {
  const spriteData = gulp
    .src('src/images/sprites/**/*')
    .pipe(spritesmith({
      imgName: 'sprite.png',
      cssName: '_sprite.scss',
      imgPath: '../images/sprite.png',
      padding: 2
    }));

  const endAll = new EndAll(() => {
    gulp
      .src('dist/assets/sprite.png')
      .pipe($.imagemin({
        verbose: true
      }))
      .pipe(gulp.dest('dist/assets/sprite.png'))
      .on('end', () => {
        // ログの順番制御したいのでここでサイズを出す
        gulp
          .src('dist/assets/images/sprite.png')
          .pipe($.size({
            title: 'image:sprite'
          }))
          .on('end', () => {
            reportTaskEnd()
          });
      });
  });

  spriteData.css
    .pipe(gulp.dest('src/styles'))
    .on('end', endAll());
  spriteData.img
    .pipe(gulp.dest('dist/assets/images'))
    .on('end', endAll());
});

gulp.task('image:static', (reportTaskEnd) => {
  gulp
    .src('src/images/statics/**/*', {
      base: 'src/images/statics'
    })
    .pipe($.imagemin([
      // optipng(),
      // pngcrush(),
      // jpegtran({
      //   progressive: true
      // }),
      // jpegoptim({
      //   progressive: true,
      //   max: 80
      // })
    ], {
      verbose: true
    }))
    .pipe(gulp.dest('dist/assets/images'))
    .on('end', () => {
      gulp
        .src([
          'dist/assets/images/**/*',
          '!dist/assets/images/sprite.png'
        ])
        .pipe($.size({
          title: 'image:static'
        }))
        .on('end', reportTaskEnd);
    });
});