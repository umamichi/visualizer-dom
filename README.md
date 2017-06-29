# Visualizer

## Install

```
git clone [repogiroty url]
cd [repogitory name]
npm i
```

## Command

|コマンド|説明|サーバ|html5lint|
|---|---|---|---|
|`npm start`|開発用にビルドする|o|x|
|`npm run build`|公開用にビルドする|o|o|
|`npm run build`|公開用にビルドする|x|o|
|`npm run html5lint`|htmlの構文をチェックする|x|o|
|`npm run image`|画像をdistディレクトリに配置する|x|x|
|`npm run sprite`|スプライト画像を作成する|x|x|


## Attention

- サーバは http://localhost:3000/ で立ち上がる
- distはgitで管理しない。直接何かを入れたい場合はsrc/statics以下に置いておく。
- htmllintが入っている。( `npm run build-test` でチェック可能)
- 画像はsrcディレクトリに入れて `npm run image` で配置する。(これによって自動で圧縮する)

## Rule

- distディレクトリは直接編集しない。
- ソースは画像も含めてすべてsrcディレクトリ以下に入れる。
- 画像はなるべくスプライト化して圧縮もする。

## Structure

```
├─ dist        ビルド後のファイルが入る。gitで管理しない
│
├─ gulp
│ ├─ tasks     タスクファイルが入ってる
│ ├─ store.js  タスクで利用するデータ管理
│ └─ utils.js  タスクで利用するユーティリティ
│
├─ src
│ ├─ html
│ ├─ images
│ │ ├─ sprites スプライト化する画像
│ │ └─ statics そのまま使う画像
│ ├─ languages 言語ファイル
│ ├─ scripts
│ ├─ statics   distにコピーしたいファイルをここに置く
│ └─ styles
└─ language.json
```
