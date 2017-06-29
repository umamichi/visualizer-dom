import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import map from 'map-stream';
import glob from 'glob';
import del from 'del';
import fs from 'fs';
import browserSync from 'browser-sync';
import store from '../store.js';
import language from '../../language.json';
import { logFilename, each } from '../utils.js';
import { EndAll } from '../utils.js';

const $ = gulpLoadPlugins();

const watchSrc = ['src/html/**/*.ejs', 'src/languages/**/*.json'];
const src = 'src/html/**/[^_]*.ejs';
const dist = 'dist';
const srcHtml = 'src/html';
const srcLanguage = 'src/languages';

// include先のファイルを変更したときに、
// そのファイルを使っているファイルのみを再ビルドしたいが、
// includeを解決するプラグインが見つからないのでとりあえず差分ビルドは考えない

gulp.task('html', (reportTaskEnd) => {
  prerebundle(false, reportTaskEnd);

  if (store.isWatching()) {
    $.watch(watchSrc, prerebundle);
  }
});

const LintLog = (function() {
  function LintLog() {
    this.error = null;
  }
  LintLog.prototype.check = function(error) {
    this.error = error;
  };

  return LintLog;
})();

gulp.task('html:lint', (reportTaskEnd) => {
  const endAll = new EndAll(() => {
    reportTaskEnd();
  });

  glob(`${dist}/**/*.html`, {}, (err, file) => {
    file.forEach(function(fileName) {
      const done = endAll();
      const lintLog = new LintLog();
      gulp
        .src(fileName)
        .pipe($.plumber(lintLog.check.bind(lintLog)))
        .pipe($.html5Lint())
        .on('unpipe', () => {
          if (lintLog.error) {
            $.util.log($.util.colors.red('×'), $.util.colors.yellow('html5lint'), $.util.colors.magenta(fileName));
            $.util.log(lintLog.error.message);
          } else {
            $.util.log($.util.colors.green('✔'), $.util.colors.yellow('html5lint'), $.util.colors.magenta(fileName));
          }
          done();
        });
    });
  });
});

function prerebundle(_firedByWatch, reportTaskEnd) {
  // ファイル監視に反応したかどうかと、_から始まるファイル名が変更されたのかどうかをチェックしてrebundleに渡す

  const firedByWatch = typeof _firedByWatch === 'boolean' ? _firedByWatch : true;

  if (typeof _firedByWatch === 'object') {
    glob(src, {}, (err, files) => {
      rebundle(_firedByWatch, !files.filter(filepath => {
        return new RegExp(filepath + '$').test(_firedByWatch.path);
      }).length, /\.json$/.test(_firedByWatch.path) ? _firedByWatch.path.match(/[a-zA-Z0-9-_\.]+$/)[0] : false, reportTaskEnd);
    });

    return;
  }

  rebundle(_firedByWatch, true, false, reportTaskEnd);
}

function rebundle(firedByWatch, compileEverything, compileSpecificLanguage, reportTaskEnd) {
  // この関数でしていること
  // - ejs -> htmlにコンパイルする
  // - プロダクションモードならhtml5lintチェックする
  // - プロダクションモードなら圧縮する
  // - サーバ立ち上げてればリロードする

  // コンパイルするファイル(差分ビルド用)
  let files = [];

  // コンパイルする言語
  let compileLanguage = language;

  // 全言語分コンパイルするかどうかによって処理を変える
  if (compileSpecificLanguage) {
    const _language = {};
    Object.keys(language).forEach(destPath => {
      language[destPath] === compileSpecificLanguage && (_language[destPath] = compileSpecificLanguage);
    });
    compileLanguage = _language;
  }

  gulp
    .src(src)
    // 初回はキャッシュしたいので!firedByWatchを入れる
    .pipe((!firedByWatch || !compileEverything) ? $.cached() : $.util.noop())
    // 変更されたファイルがあるかどうかを保持しておく
    .pipe(map((file, callback) => {
      files.push(file.path);

      return callback(null, file)
    }))
    .pipe($.flatmap((stream, file) => {
      const lintLog = new LintLog();
      // 言語分コンパイルする
      Object.keys(compileLanguage).forEach(destPath => {
        const buffer = fs.readFileSync(`${srcLanguage}/${compileLanguage[destPath]}`);
        const json = JSON.parse(buffer.toString());
        const addParams = {};
        addParams.fileName = file.path.match(/[a-zA-Z0-9-_\.]+$/)[0];

        let filePath = (destPath + '/' + file.path.replace(process.cwd(), '')).replace(/\\/g, '/').replace(new RegExp(srcHtml), '');
        while (/\/\//.test(filePath)) {
          filePath = filePath.replace(/\/\//g, '/');
        }
        filePath = filePath.replace(/^\//, '').replace(/\/$/, '');

        // ルートからのファイル名を入れる
        addParams.filePath = filePath.replace(/\.ejs$/, '.html');
        // ルートまでの相対パスを入れる
        // /distと/src/htmlで1階層差があるので1引く
        let rootCount = /\//.test(filePath) ? filePath.match(/\//g).length : 0;
        let rootPath = '';
        while (rootCount-- > 0) {
          rootPath += '../';
        }
        rootPath || (rootPath = './');
        addParams.rootPath = rootPath;

        // タスクで追加した変数をejsに渡す
        Object.keys(addParams).forEach(addParam => {
          json[addParam] = addParams[addParam];
        });

        stream
          // このファイルを複数言語分コンパイルする必要があるため、cloneして他のファイルに影響が出ないようにする
          .pipe($.clone())
          .pipe(logFilename($.util.colors.green(`[${destPath}] `) + 'ejs -> html', '...'))
          // .pipe(firedByWatch ? each(() => {
          //   $.util.log($.util.colors.gray.underline('language'), json.language || '');
          //   $.util.log($.util.colors.gray.underline('destPath'), json.destPath || '');
          //   Object.keys(addParams).forEach(addParam => {
          //     // watchによって変更された場合は追加したパラメータを出力する
          //     $.util.log($.util.colors.gray.underline(addParam), addParams[addParam]);
          //   });
          // }) : $.util.noop())
          .pipe($.plumber())
          .pipe($.ejs(json, {
            ext: '.html'
          }))
          /*.pipe(store.isProduction() ? logFilename($.util.colors.green(`[${destPath}] `) + 'html5lint', '...') : $.util.noop())
          .pipe(store.isProduction() ? $.plumber.stop() : $.util.noop())
          .pipe(store.isProduction() ? $.plumber(lintLog.check.bind(lintLog)) : $.util.noop())
          .pipe(store.isProduction() ? $.html5Lint() : $.util.noop())*/
          .pipe(store.isProduction() ? $.htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true
          }) : $.util.noop())
          .pipe(gulp.dest(dist + destPath))
          .on('unpipe', () => {
            if (store.isProduction()) {
              const fileName = file.path.replace(process.cwd(), '');
              if (lintLog.error) {
                $.util.log($.util.colors.red('×'), $.util.colors.yellow('html5lint'), $.util.colors.magenta(fileName));
                $.util.log(lintLog.error.message);
              } else {
                $.util.log($.util.colors.green('✔'), $.util.colors.yellow('html5lint'), $.util.colors.magenta(fileName));
              }
            }
          });
      });

      return stream;
    }))
    // via. http://stackoverflow.com/questions/38855522/gulp-foreach-not-looping-over-all-files
    .on('data', data => {})
    .on('end', () => {
      del.sync(`${dist}/**/*.ejs`);
      typeof reportTaskEnd === 'function' && reportTaskEnd();
      store.isWatching() && files.length && firedByWatch && browserSync.reload();
    });
}
