import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import sassGraph from 'sass-graph';
import map from 'map-stream';
import browserSync from 'browser-sync';
import store from '../store.js';
import { logFilename } from '../utils.js';

const $ = gulpLoadPlugins();

const baseSrc = 'src/styles/';
const watchSrc = baseSrc + '**/*.scss';
const src = baseSrc + '**/[^_]*.scss';
const dist = 'dist/assets/styles/';

const autoprefix = {
  browsers: [
    'ie >= 11',
    'ff >= 40',
    'chrome >= 43',
    'safari >= 8',
    'ios >= 8',
    'android >= 4.1'
  ]
};

gulp.task('css', (reportTaskEnd) => {
  rebundle(false, reportTaskEnd);

  if (store.isWatching()) {
    $.watch(watchSrc, rebundle);
  }
});

function rebundle(_firedByWatch, reportTaskEnd) {
  const firedByWatch = typeof _firedByWatch === 'boolean' ? _firedByWatch : true;

  // この関数でしていること
  // - scss -> cssにコンパイルする
  // - ベンダーprefixを自動でつける
  // - プロダクションモードなら圧縮する
  // - サーバ立ち上げてればリロードする

  // コンパイルするファイル(差分ビルド用)
  let files = [];

  gulp
    .src(watchSrc)
    // 変更のないファイルを弾く
    .pipe($.cached('sass'))
    // _*.scssからimportされている親ファイル郡を取得してくる(親ファイル郡をコンパイルしたい)
    .pipe(map((file, callback) => {
      files = getParentFiles(files, file.path);

      return callback(null, file)
    }))
    .on('end', () => {
      gulp
        .src(src)
        .pipe(map((file, callback) => {
          // 取得してきた親ファイル郡のみをコンパイルする
          // これで差分ビルドが実現できてる
          if (files.indexOf(file.path) >= 0) {
            return callback(null, file);
          }

          return callback();
        }))
        .pipe($.plumber())
        .pipe(logFilename('scss -> css', '...'))
        .pipe(store.isDevelopment() ? $.sourcemaps.init() : $.util.noop())
        .pipe($.sass({
          outputStyle: store.isDevelopment() ? 'expanded' : 'compressed'
        }))
        .pipe($.autoprefixer(autoprefix))
        .pipe(store.isDevelopment() ? $.sourcemaps.write() : $.util.noop())
        .pipe(gulp.dest(dist))
        .pipe(store.isWatching() ? browserSync.stream() : $.util.noop())
        .on('end', () => {
          typeof reportTaskEnd === 'function' && reportTaskEnd();
        });
    });
}

// 指定したファイルをインポートしている親ファイル郡を取得する
function getParentFiles(files, filePath) {
  files.indexOf(filePath) < 0 && files.push(filePath);

  // via. http://qiita.com/joe-re/items/542b3f6fdc577cf50509
  const importedFiles = sassGraph.parseDir(baseSrc).index[filePath].importedBy;
  importedFiles.forEach(importParent => {
    getParentFiles(files, importParent);
  });

  return files;
}
