export default function visualizer() {
  let divNum; // divの数
  let height; // 高さ
  let audioContext;
  let analyser;
  let spectrum;
  
  // div初期化
  divInitialize();
  
  // フーリエ変換の準備
  createAnalyser();

  // マイク入力を取得
  getMicrophone();

  /**
   * div要素の初期化
   */
  function divInitialize() {
    const wrap = document.getElementById('wrap');
    divNum = Math.floor(wrap.clientWidth / 15);	//divの個数を計算 15px=width+margin
    let wrapHtml = '';
    for (let i = 0; i < divNum; i++) {
      wrapHtml += `<div id="${i}"></div>`;
    }
    wrap.innerHTML = wrapHtml;

		//描画エリアの高さ取得
    const area = document.getElementById('area_div');
    height = area.clientHeight;
  }
  
  /**
   * アナライザを生成
   */
  function createAnalyser() {
    // audioContextを生成
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // analyzer（分析する装置）を生成
    analyser = audioContext.createAnalyser();
    //  0-1 の範囲でスペクトラムデータの動きの速さを設定する（0だともっとも速い）
    analyser.smoothingTimeConstant = 0.8;
    // fftSizeは音の分割サイズで、2の累乗の数値のみ設定可
    // デフォルトで2048、しかしデータ量が多すぎてリアルタイム処理が難しくなるので適度に減らす方がいい
    analyser.fftSize = 256;
  }
  
  /**
   * マイクのデータを取得
   */
  function getMicrophone() {
    // 音のソースをマイクにする
    const audioSource = navigator.mediaDevices.getUserMedia({ video: false, audio: true });

    // 音声データを取得したら実行
    audioSource.then((stream) => {
      const source = audioContext.createMediaStreamSource(stream);
      console.log(source);
      // analyser.frequencyBinCount はfftSizeの半分
      spectrum = new Uint8Array(analyser.frequencyBinCount);
      // sourceをanalyserに接続
      source.connect(analyser);

      // ビジュアライザ処理
      requestAnimationFrame(visualize);
    });

    audioSource.catch((e) => {
      console.log(e.name);
    });
  }
  
  /**
   * ビジュアライジング
   */
  function visualize() {
    requestAnimationFrame(visualize);
    analyser.getByteFrequencyData(spectrum); // フーリエ変換、配列で音を取得
  
    const ct = (spectrum.length - 30) / divNum;
  
    // //Hzごとにvalumeをheightで表す
    for (let i = 0; i < divNum; i++) {
      const y = Math.floor((spectrum[Math.floor(i * ct)] / 255) * height);
      const element = document.getElementById(Math.floor(i));
      element.style.height = `${y}px`;
    }
  }
}

