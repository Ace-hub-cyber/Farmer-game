'use client'

import Script from 'next/script'

export default function GameCanvas() {
  return (
    <>
      <div className="wrap">
        <h1 className="title">LADANG</h1>
        <p className="subtitle">Tanam, pancing, masak, jual — bangun ladangmu hari demi hari.</p>

        <div className="bar">
          <span className="chip day"><b id="day">HARI 1</b></span>
          <span className="chip"><b id="clock">06:00</b></span>
          <span className="chip"><b id="weather">Cerah</b></span>
          <div className="sta-wrap">
            <span className="sta-label">Stamina</span>
            <div className="sta-track">
              <div id="staFill"></div>
            </div>
          </div>
        </div>

        <div className="bar">
          <span className="chip">Gold <b id="gold">50</b></span>
          <span className="chip">Bibit <b id="seed">3</b></span>
          <span className="chip">Panen <b id="score">0</b></span>
          <span className="chip">Ikan <b id="fish">0</b></span>
          <span className="chip">Masakan <b id="cook">0</b></span>
        </div>

        <div className="game-section">
          <div className="game-main">
            <canvas id="map" width={320} height={224}></canvas>
          </div>

          <div className="game-side">
            <p className="msgline" id="msg">Selamat datang! Tanam bibit, siram, dan ikuti papan penunjuk arah.</p>

            <div className="fishbar">
              <div className="fb-zone" style={{ left: '38%', width: '24%' }}></div>
              <div className="fb-core" style={{ left: '47%', width: '6%' }}></div>
              <div id="marker" style={{ left: 0 }}></div>
            </div>

            <div className="controls">
              <div className="dpad">
                <span></span>
                <button id="up" aria-label="atas">▲</button>
                <span></span>
                <button id="left" aria-label="kiri">◀</button>
                <button id="down" aria-label="bawah">▼</button>
                <button id="right" aria-label="kanan">▶</button>
              </div>
              <button id="rod" className="act"></button>
            </div>

            <div className="minibtns">
              <button id="eat">Makan (+40 stamina)</button>
              <button id="reset">Hapus save</button>
            </div>

            <div id="shop" className="shop"></div>
          </div>
        </div>

        <p className="hint">Keyboard: panah = jalan · spasi = aksi sesuai lokasi</p>
        <footer>LADANG v0.1 — farming · fishing · cooking · town. Mining, hutan & ternak menyusul.</footer>
      </div>

      <Script src="/game.js" strategy="afterInteractive" />
    </>
  )
}
