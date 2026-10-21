/* Sustenido Music — Aula 6: Primeira música (melodia + acordes com inversões, partitura sincronizada) */
(function () {
  'use strict';
  var P = window.SustenidoPiano;
  if (!P || !window.Vex) return;
  var VF = Vex.Flow;
  var KEY = { 79: 'g/5', 76: 'e/5', 77: 'f/5', 74: 'd/5', 59: 'b/3', 60: 'c/4', 62: 'd/4', 64: 'e/4', 65: 'f/4', 67: 'g/4', 69: 'a/4', 71: 'b/4', 72: 'c/5',
    47: 'b/2', 48: 'c/3', 50: 'd/3', 52: 'e/3', 53: 'f/3', 55: 'g/3', 57: 'a/3' };
  var DUR = { 0.5: '8', 1: 'q', 2: 'h', 3: 'hd', 4: 'w' };
  function dot(n, d) { if (d === 3) { if (n.addDotToAll) n.addDotToAll(); else VF.Dot.buildAndAttach([n], { all: true }); } return n; }
  function setup(id, CH, MEASURES, BEATS, LOW, HIGH) {
  var host = document.getElementById('score-' + id); if (!host) return;
  function $(x) { return document.getElementById(id + '-' + x); }
  // linha do tempo
  var EV = [], beat = 0;
  MEASURES.forEach(function (m, mi) {
    var b = beat;
    m[1].forEach(function (n, ni) { EV.push({ t: b, d: n[1], midi: n[0], mi: mi, ni: ni }); b += n[1]; });
    beat += BEATS;
  });
  var TOTAL = beat;

  var kb = new P.Keyboard(document.getElementById('kb-' + id), { low: LOW, high: HIGH });
  var info = $('info');
  var synth = new P.PianoSynth();
  var st = { mode: 'both', bpm: 80, playing: false, startBeat: 0, t0: 0, raf: 0, pos: 0, curEv: -1, curM: -1 };

  /* ---- Partitura ---- */
  var sc = { rh: [], lh: [], mx: [], rect: null, sysY: [], sysOf: [] };
  function svgOf(n) { var e = n.getSVGElement ? n.getSVGElement() : null; return e || document.getElementById('vf-' + n.getAttribute('id')); }
  function render() {
    var cw = host.clientWidth || 360;
    host.innerHTML = '';
    var W = cw < 620 ? 560 : 940, PER = 3, SYS_H = 250, nSys = Math.ceil(MEASURES.length / PER), H = 10 + SYS_H * nSys;
    var r = new VF.Renderer(host, VF.Renderer.Backends.SVG); r.resize(W, H);
    var ctx = r.getContext(), svg = host.querySelector('svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', '100%'); svg.removeAttribute('height');
    svg.style.width = '100%'; svg.style.height = 'auto';
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('rx', 6); rect.setAttribute('fill', '#C9A227'); rect.setAttribute('fill-opacity', '0.14'); rect.setAttribute('visibility', 'hidden');
    svg.insertBefore(rect, svg.firstChild);
    sc = { rh: [], lh: [], mx: [], rect: rect, sysY: [], sysOf: [] };
    for (var s = 0; s < nSys; s++) {
      var y0 = 10 + s * SYS_H + 24, x = 22, extra = s === 0 ? 62 : 36, mw = (W - x - 6 - extra) / PER;
      sc.sysY.push([y0 + 6, y0 + 215]);
      for (var j = 0; j < PER; j++) {
        var mi = s * PER + j; if (mi >= MEASURES.length) break;
        var w = mw + (j === 0 ? extra : 0);
        var tr = new VF.Stave(x, y0, w), bs = new VF.Stave(x, y0 + 112, w);
        if (j === 0) { tr.addClef('treble'); bs.addClef('bass'); if (s === 0) { tr.addTimeSignature(BEATS + '/4'); bs.addTimeSignature(BEATS + '/4'); } }
        var last = mi === MEASURES.length - 1;
        if (last) { tr.setEndBarType(VF.Barline.type.END); bs.setEndBarType(VF.Barline.type.END); }
        var sx = Math.max(tr.getNoteStartX(), bs.getNoteStartX()); tr.setNoteStartX(sx); bs.setNoteStartX(sx);
        tr.setContext(ctx).draw(); bs.setContext(ctx).draw();
        if (j === 0) {
          new VF.StaveConnector(tr, bs).setType(VF.StaveConnector.type.BRACE).setContext(ctx).draw();
          new VF.StaveConnector(tr, bs).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();
        }
        new VF.StaveConnector(tr, bs).setType(last ? VF.StaveConnector.type.BOLD_DOUBLE_RIGHT : VF.StaveConnector.type.SINGLE_RIGHT).setContext(ctx).draw();
        var m = MEASURES[mi];
        var tn = m[1].map(function (n, ni) {
          var sn = dot(new VF.StaveNote({ clef: 'treble', keys: [n[0] ? KEY[n[0]] : 'b/4'], duration: DUR[n[1]] + (n[0] ? '' : 'r'), auto_stem: true }), n[1]);
          if (ni === 0 && m[0]) sn.addModifier(new VF.Annotation(m[0]).setFont('Arial', 17, 'bold').setVerticalJustification(VF.Annotation.VerticalJustify.TOP), 0);
          return sn;
        });
        var bd = BEATS === 4 ? 'w' : 'hd';
        var bn = [dot(m[0] ? new VF.StaveNote({ clef: 'bass', keys: CH[m[0]].notes.map(function (k) { return KEY[k]; }), duration: bd })
          : new VF.StaveNote({ clef: 'bass', keys: ['d/3'], duration: bd + 'r' }), BEATS)];
        var tv = new VF.Voice({ num_beats: BEATS, beat_value: 4 }).addTickables(tn);
        var bv = new VF.Voice({ num_beats: BEATS, beat_value: 4 }).addTickables(bn);
        new VF.Formatter().joinVoices([tv]).joinVoices([bv]).format([tv, bv], tr.getNoteEndX() - sx - 12);
        tv.draw(ctx, tr); bv.draw(ctx, bs);
        sc.rh.push(tn.map(svgOf)); sc.lh.push(svgOf(bn[0])); sc.mx.push([x, w]); sc.sysOf.push(s);
        x += w;
      }
    }
    dims(); paint();
  }
  function dims() {
    sc.rh.forEach(function (a) { a.forEach(function (e) { if (e) e.classList.toggle('dim', st.mode === 'lh'); }); });
    sc.lh.forEach(function (e) { if (e) e.classList.toggle('dim', st.mode === 'rh'); });
  }
  function paint() {
    sc.rh.forEach(function (a) { a.forEach(function (e) { if (e) e.classList.remove('hl-rh'); }); });
    sc.lh.forEach(function (e) { if (e) e.classList.remove('hl-lh'); });
    kb.releaseAll();
    var ev = EV[st.curEv], mi = st.curM;
    if (mi < 0 || !ev) { sc.rect && sc.rect.setAttribute('visibility', 'hidden'); return; }
    var ch = CH[MEASURES[mi][0]] || { notes: [], info: '' };
    if (st.mode !== 'rh' && sc.lh[mi]) { ch.notes.forEach(function (n) { kb.press(n, 'lh'); }); if (sc.lh[mi]) sc.lh[mi].classList.add('hl-lh'); }
    if (st.mode !== 'lh' && ev.midi) { kb.press(ev.midi, 'rh'); var e = sc.rh[mi][ev.ni]; if (e) e.classList.add('hl-rh'); }
    var ys = sc.sysY[sc.sysOf[mi]], mx = sc.mx[mi];
    sc.rect.setAttribute('x', mx[0]); sc.rect.setAttribute('width', mx[1]);
    sc.rect.setAttribute('y', ys[0]); sc.rect.setAttribute('height', ys[1] - ys[0]);
    sc.rect.setAttribute('visibility', 'visible');
    info.innerHTML = '<b>Compasso ' + (mi + 1) + '</b> · ' + ch.info +
      (st.mode !== 'lh' && ev.midi ? ' · Melodia: <b>' + P.noteName(ev.midi) + '</b>' : '');
  }

  /* ---- Reprodução ---- */
  var btn = $('play');
  function spb() { return 60 / st.bpm; }
  function play() {
    var ctx = synth.ensure(); if (!ctx) return;
    if (st.pos >= TOTAL) st.pos = 0;
    var from = Math.floor(st.pos / BEATS) * BEATS; // recomeça no início do compasso
    st.startBeat = from; st.t0 = ctx.currentTime + 0.08; st.playing = true;
    var k = spb();
    EV.forEach(function (e) {
      if (e.t < from) return;
      var t = st.t0 + (e.t - from) * k;
      if (st.mode !== 'lh' && e.midi) synth.note(e.midi, t, e.d * k * 0.95, 0.8);
      if (e.ni === 0 && st.mode !== 'rh' && MEASURES[e.mi][0]) CH[MEASURES[e.mi][0]].notes.forEach(function (n) { synth.note(n, t, BEATS * k * 0.95, 0.5); });
    });
    btn.textContent = '⏸ Pausar'; btn.setAttribute('aria-pressed', 'true');
    tick();
  }
  function stop(reset) {
    st.playing = false; cancelAnimationFrame(st.raf); synth.stopAll();
    btn.textContent = '▶ Tocar'; btn.setAttribute('aria-pressed', 'false');
    if (reset) { st.pos = 0; st.curEv = -1; st.curM = -1; paint(); info.textContent = 'Aperte ▶ Tocar para ouvir e ver as mãos.'; }
  }
  function tick() {
    if (!st.playing) return;
    var b = st.startBeat + (synth.ctx.currentTime - st.t0) / spb();
    st.pos = Math.max(st.startBeat, b);
    if (b >= TOTAL) { stop(true); return; }
    var idx = -1;
    for (var i = 0; i < EV.length; i++) if (EV[i].t <= b) idx = i;
    if (idx >= 0 && idx !== st.curEv) { st.curEv = idx; st.curM = EV[idx].mi; paint(); }
    st.raf = requestAnimationFrame(tick);
  }
  btn.addEventListener('click', function () { st.playing ? stop(false) : play(); });
  $('stop').addEventListener('click', function () { stop(true); });
  var tempo = $('tempo'), tout = $('tempo-out');
  tempo.addEventListener('input', function () {
    st.bpm = +tempo.value; tout.textContent = st.bpm + ' bpm';
    if (st.playing) { stop(false); play(); }
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-mode-of="' + id + '"]'), function (b) {
    b.addEventListener('click', function () {
      st.mode = b.getAttribute('data-m');
      Array.prototype.forEach.call(document.querySelectorAll('[data-mode-of="' + id + '"]'), function (o) { o.setAttribute('aria-pressed', o === b); });
      dims(); if (st.playing) { stop(false); play(); } else paint();
    });
  });
  render();
  var lw = host.clientWidth;
  window.addEventListener('resize', function () { var w = host.clientWidth; if ((w < 620) !== (lw < 620)) { lw = w; render(); } });
  }
  var CMAJ = {
    C: { notes: [48, 52, 55], info: 'C (Dó maior) · estado fundamental: Dó – Mi – Sol' },
    Am: { notes: [48, 52, 57], info: 'Am (Lá menor) · 1ª inversão: Dó – Mi – Lá (só o Sol sobe para Lá)' },
    Dm: { notes: [50, 53, 57], info: 'Dm (Ré menor) · estado fundamental: Ré – Fá – Lá (Dó sobe para Ré, Mi sobe para Fá)' },
    G: { notes: [47, 50, 55], info: 'G (Sol maior) · 1ª inversão: Si – Ré – Sol (a mão desce só um pouquinho)' },
    F: { notes: [48, 53, 57], info: 'F (Fá maior) · 2ª inversão: Dó – Fá – Lá (o Dó fica parado)' }
  };
  // escala de Dó maior subindo e descendo sobre C – Am – Dm – G
  setup('pm', CMAJ, [
    ['C', [[60, 2], [62, 2]]], ['Am', [[64, 2], [65, 2]]], ['Dm', [[67, 2], [69, 2]]], ['G', [[71, 2], [72, 2]]],
    ['C', [[72, 2], [71, 2]]], ['Am', [[69, 2], [67, 2]]], ['Dm', [[65, 2], [64, 2]]], ['G', [[62, 4]]],
    ['C', [[60, 4]]]
  ], 4, 47, 72);
})();
