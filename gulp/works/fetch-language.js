// シートの名前と出力先は実行時の引数から取得する
// 今回はpackage.jsonの中に書いてしまう
var SHEET_NAME = process.argv[2];
var OUTPUT_PATH = process.argv[3];

var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

var doc = new GoogleSpreadsheet(SHEET_NAME);
var sheet = null;

// async通信する際に持ち越したい変数はここに入れていく
var scope = {
};

async.series([
  /**
   * 認証する。詳細はnpmのgoogle-spreadsheetのページを見ると書いてある
   */
  function setAuth(step) {
    console.log('Trying to useServiceAccountAuth ...');
    doc.useServiceAccountAuth(require('./google-generated-creds.json'), step);
  },
  /**
   * スプレッドシートを取得する
   */
  function getSpreadsheet(step) {
    console.log('Done.');
    console.log('Trying to get contents of', SHEET_NAME, '...');
    doc.getInfo(function(err, info) {
      console.log('Done.');
      console.log();
      console.log('--------------------');
      console.log('Sheet name:', info.title);
      console.log('Updated:', info.updated);
      console.log('--------------------');
      console.log();
      sheet = info.worksheets[0];
      step();
    });
  },
  /**
   * 設定する言語数と、出力先のパスを取得する
   */
  function getLanguageAmount(step) {
    // 2行目に書かれている想定の出力先のパスを取得する
    // ちなみに1行目は説明とか注意事項とかのコメント用に使う
    sheet.getCells({
      'min-row': 2,
      'max-row': 2,
      'return-empty': true
    }, function(err, cells) {
      var result = [];
      // 一番左の二つはコメント用なので無視する
      while (cells[result.length + 2].value) {
        result.push(cells[result.length + 2].value);
      }

      scope.languages = result.map(function (r) {
        return {
          destPath: r
        };
      });

      step();
    });
  },
  /**
   * 言語名を取得する
   */
  function getLanguageNames(step) {
    // 3行目に書かれている想定の出力先のパスを取得する
    sheet.getCells({
      'min-row': 3,
      'max-row': 3,
      'return-empty': true
    }, function(err, cells) {
      // 一番左の二つはコメント用なので無視する
      scope.languages.forEach(function (data, idx) {
        data.language = cells[idx + 2].value;
      });

      step();
    });
  },
  /**
   * 取得する言語をログに出しておく
   */
  function logLanguageAmount(step) {
    var longestDestPathLength = 0;
    scope.languages.forEach(function (data) {
      if (data.destPath.length > longestDestPathLength) {
        longestDestPathLength = data.destPath.length;
      }
    });

    console.log('Languages:');
    scope.languages.forEach(function (data) {
      var offsetSpaces = getSpaces(longestDestPathLength - data.destPath.length + 4);
      console.log(data.destPath + offsetSpaces + data.language);
    });
    console.log();

    step();
  },
  /**
   * データを読み取っていく
   */
  function getData(step) {
    // 4行目から変数の情報が始まるのでそのオフセット
    var offset = 4;
    // 20行ずつチェックする
    var interval = 20;
    // 最後に見た行の変数名を保持しておく
    var lastVariableName = 'dummy';
    // interval行ずつ変数名が切れるまで再帰処理でチェックしていく
    // 変数名が2行以上連続で切れた場合はそこで止める
    function getRow(count, callback) {
      var currentRow = offset + interval * count;
      console.log('Fetching row', currentRow, '-', currentRow + interval );
      sheet.getCells({
        'min-row': currentRow,
        'max-row': currentRow + interval,
        'return-empty': true
      }, function (err, cells) {
        // interval行チェックする
        var row;
        for (row = 0; row < interval; row++) {
          // 最大行数を超えた場合はそこで止める
          if (currentRow + row > sheet.rowCount) {
            callback();
            return;
          }

          // 行ごとの一番左のセルの番号
          var startCellIdx = row * sheet.colCount;
          // 変数名
          var variableName = (cells[startCellIdx + 1].value + '').toUpperCase();

          // 2行以上空の行が続いたらそこで止める
          if (!variableName && !lastVariableName) {
            callback();
            return;
          }
          lastVariableName = variableName;

          // 変数名
          if (variableName) {
            scope.languages.forEach(function (data, idx) {
              data[variableName] = cells[startCellIdx + 2 + idx].value.replace(/\n\r|\r\n|\n|\r/g, '<br>');
            });
          }

          console.log('>', variableName);
        }

        // 終わりが見えない場合は再帰処理で次のinterval行をチェックする
        getRow(count + 1, callback);
      });
    }

    getRow(0, function() {
      console.log('Done.');
      console.log();

      var fs = require('fs');
      scope.languages.forEach(function (language) {
        var jsonName = language.language + '.json';

        console.log('Writing', jsonName, '...');
        fs.writeFile(OUTPUT_PATH + jsonName, JSON.stringify(language) + '\n' , function (err) {
          if (err) {
            console.log('Unexpected error has occured while writing', jsonName);
            return;
          }

          console.log('Successed to write', jsonName, '!')
        });
      });

      step();
    });

  }
]);

/**
 * 指定した個数のスペースの文字列を取得する
 * @param amount
 */
function getSpaces(amount) {
  var result = [];
  while (0 < amount--) {
    result.push(' ');
  }
  return result.join('');
}
