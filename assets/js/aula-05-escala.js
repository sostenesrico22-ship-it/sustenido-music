/* Sustenido Music — Aula 5: Escala de Dó maior
   Partitura (VexFlow, local), teclado animado, dedilhado e som sincronizados. */
(function () {
  'use strict';
  var P = window.SustenidoPiano;

  /* ---- Dados da escala (16 notas: sobe 8, desce 8) ---- */
  var RH_MIDI = [60, 62, 64, 65, 67, 69, 71, 72, 72, 71, 69, 67, 65, 64, 62, 60];
  var RH_FING = [1, 2, 3, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 3, 2, 1];
  var LH_FING = [5, 4, 3, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 3, 4, 5];
  var KEYNAME = { 0: 'c', 2: 'd', 4: 'e', 5: 'f', 7: 'g', 9: 'a', 11: 'b' };
  function vfKey(m) { return KEYNAME[m % 12] + '/' + (Math.floor(m / 12) - 1); }
  var EVENTS = RH_MIDI.map(function (m, i) {
    return {
      rh: { midi: m, key: vfKey(m), finger: RH_FING[i] },
      lh: { midi: m - 12, key: vfKey(m - 12), finger: LH_FING[i] },
      dir: i < 8 ? 'up' : 'down'
    };
  });
  // dicas de passagem de polegar / cruzamento
  var HINTS = {
    rh: { 3: 'polegar passa por baixo', 13: 'dedo 3 cruza por cima' },
    lh: { 5: 'dedo 3 cruza por cima', 11: 'polegar passa por baixo' }
  };
  var TEMPOS = [{ name: 'Lento', bpm: 60 }, { name: 'Médio', bpm: 90 }, { name: 'Rápido', bpm: 120 }];

  var state = { mode: 'rh', tempo: 1, loop: false, playing: false, current: -1 };
  window.__aula = { state: state, EVENTS: EVENTS }; // usado nos testes automáticos

  /* ---- Partitura (pauta dupla) ---- */
  var score = { notes: [], rect: null, sysOf: [], sysY: [] };
  var lastScoreWidth = 0;

  function renderScore() {
    var VF = Vex.Flow;
    var host = document.getElementById('score');
    var cw = host.clientWidth || 360;
    lastScoreWidth = cw;
    host.innerHTML = '';
    var perSys = cw < 620 ? 2 : 4;            // celular: 2 sistemas (subindo / descendo)
    var W = perSys === 2 ? 500 : 940;
    var SYS_H = perSys === 2 ? 236 : 250, TOP = 2;
    var nSys = 4 / perSys;
    var H = TOP + SYS_H * nSys;
    var renderer = new VF.Renderer(host, VF.Renderer.Backends.SVG);
    renderer.resize(W, H);
    var ctx = renderer.getContext();
    var svg = host.querySelector('svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', '100%');
    svg.removeAttribute('height');
    svg.style.width = '100%'; svg.style.height = 'auto';
    // retângulo de destaque (atrás das notas)
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('rx', 6); rect.setAttribute('fill', '#C9A227'); rect.setAttribute('fill-opacity', '0.16');
    rect.setAttribute('visibility', 'hidden');
    svg.insertBefore(rect, svg.firstChild);
    score.rect = rect; score.notes = []; score.sysOf = []; score.sysY = [];

    for (var s = 0; s < nSys; s++) {
      var y0 = TOP + s * SYS_H + 14;
      score.sysY.push([y0 + 18, y0 + 222]);
      var x = 22, avail = W - x - 6;
      var extra = s === 0 ? 62 : 36;
      var mw = (avail - extra) / perSys;
      for (var j = 0; j < perSys; j++) {
        var mi = s * perSys + j;
        var w = mw + (j === 0 ? extra : 0);
        var tr = new VF.Stave(x, y0, w), bs = new VF.Stave(x, y0 + 112, w);
        if (j === 0) {
          tr.addClef('treble'); bs.addClef('bass');
          if (s === 0) { tr.addTimeSignature('4/4'); bs.addTimeSignature('4/4'); }
        }
        var last = mi === 3;
        if (last) { tr.setEndBarType(VF.Barline.type.END); bs.setEndBarType(VF.Barline.type.END); }
        var sx = Math.max(tr.getNoteStartX(), bs.getNoteStartX());
        tr.setNoteStartX(sx); bs.setNoteStartX(sx);
        tr.setContext(ctx).draw(); bs.setContext(ctx).draw();
        if (j === 0) {
          new VF.StaveConnector(tr, bs).setType(VF.StaveConnector.type.BRACE).setContext(ctx).draw();
          new VF.StaveConnector(tr, bs).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();
        }
        new VF.StaveConnector(tr, bs).setType(last ? VF.StaveConnector.type.BOLD_DOUBLE_RIGHT : VF.StaveConnector.type.SINGLE_RIGHT).setContext(ctx).draw();

        var tn = [], bn = [];
        for (var k = 0; k < 4; k++) {
          var ev = EVENTS[mi * 4 + k];
          var a = new VF.StaveNote({ clef: 'treble', keys: [ev.rh.key], duration: 'q', auto_stem: true });
          a.addModifier(new VF.Annotation(String(ev.rh.finger)).setFont('Arial', 13, 'bold')
            .setVerticalJustification(VF.Annotation.VerticalJustify.TOP), 0);
          var b = new VF.StaveNote({ clef: 'bass', keys: [ev.lh.key], duration: 'q', auto_stem: true });
          b.addModifier(new VF.Annotation(String(ev.lh.finger)).setFont('Arial', 13, 'bold')
            .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM), 0);
          tn.push(a); bn.push(b);
        }
        var tv = new VF.Voice({ num_beats: 4, beat_value: 4 }).addTickables(tn);
        var bv = new VF.Voice({ num_beats: 4, beat_value: 4 }).addTickables(bn);
        new VF.Formatter().joinVoices([tv]).joinVoices([bv]).format([tv, bv], tr.getNoteEndX() - sx - 12);
        tv.draw(ctx, tr); bv.draw(ctx, bs);
        for (var q = 0; q < 4; q++) {
          score.notes.push({ rh: svgOf(tn[q]), lh: svgOf(bn[q]), x: tn[q].getAbsoluteX() });
          score.sysOf.push(s);
        }
        x += w;
      }
    }
    applyDims();
    if (state.current >= 0) highlightScore(state.current, state.curMode || state.mode);
  }
  function svgOf(note) {
    var e = note.getSVGElement ? note.getSVGElement() : null;
    return e || document.getElementById('vf-' + note.getAttribute('id'));
  }
  function applyDims() {
    score.notes.forEach(function (n) {
      if (n.rh) n.rh.classList.toggle('dim', state.mode === 'lh');
      if (n.lh) n.lh.classList.toggle('dim', state.mode === 'rh');
    });
  }
  function clearScore() {
    score.notes.forEach(function (n) {
      if (n.rh) n.rh.classList.remove('hl-rh');
      if (n.lh) n.lh.classList.remove('hl-lh');
    });
    if (score.rect) score.rect.setAttribute('visibility', 'hidden');
  }
  function highlightScore(i, mode) {
    clearScore();
    var n = score.notes[i]; if (!n) return;
    if (mode !== 'lh' && n.rh) n.rh.classList.add('hl-rh');
    if (mode !== 'rh' && n.lh) n.lh.classList.add('hl-lh');
    var ys = score.sysY[score.sysOf[i]];
    var r = score.rect;
    r.setAttribute('x', n.x - 9); r.setAttribute('width', 30);
    r.setAttribute('y', ys[0]); r.setAttribute('height', ys[1] - ys[0]);
    r.setAttribute('fill', mode === 'lh' ? '#2A9D8F' : '#C9A227');
    r.setAttribute('visibility', 'visible');
  }

  /* ---- Teclado e mãos ---- */
  var synth = new P.PianoSynth();
  window.__aula.synth = synth;
  window.__aula.TEMPOS = TEMPOS;
  var kb = new P.Keyboard(document.getElementById('keyboard'), {
    low: 48, high: 72,
    onKey: function (midi) {
      var ctx = synth.ensure();
      if (ctx) synth.note(midi, ctx.currentTime + 0.01, 0.6, 0.8);
      kb.press(midi, kbHandFor(midi));
      setTimeout(function () { if (!state.playing) kb.release(midi); }, 350);
      if (!state.playing) setNow(P.noteName(midi), P.noteLetter(midi));
    }
  });
  function kbHandFor(midi) { return midi < 60 ? 'lh' : 'rh'; }
  var hands = { rh: new P.HandDiagram(document.getElementById('hand-rh'), 'rh'), lh: new P.HandDiagram(document.getElementById('hand-lh'), 'lh') };
  var nowNote = document.getElementById('now-note'), nowDetail = document.getElementById('now-detail');
  function setNow(a, b) { nowNote.textContent = a; nowDetail.innerHTML = b; }
  function uses(mode, hand) { return mode === 'both' || mode === hand; }

  function showStartPosition() {
    state.current = -1;
    clearScore(); kb.releaseAll();
    ['rh', 'lh'].forEach(function (h) {
      var on = uses(state.mode, h);
      hands[h].setEnabled(on);
      hands[h].set(on ? EVENTS[0][h].finger : 0);
      kb.setMarker(h, on ? EVENTS[0][h].midi : null, EVENTS[0][h].finger, true);
    });
    setNow('Dó', 'Posição inicial · ' + (state.mode === 'rh' ? 'polegar (1) no Dó central'
      : state.mode === 'lh' ? 'mindinho (5) no Dó3' : 'MD: 1 no Dó4 · ME: 5 no Dó3'));
  }

  function showEvent(i, mode) {
    var ev = EVENTS[i];
    state.current = i; state.curMode = mode;
    kb.releaseAll();
    highlightScore(i, mode);
    var parts = [];
    ['lh', 'rh'].forEach(function (h) {
      var on = uses(mode, h);
      hands[h].setEnabled(on);
      if (on) {
        kb.press(ev[h].midi, h);
        kb.setMarker(h, ev[h].midi, ev[h].finger, false);
        hands[h].set(ev[h].finger);
        var hint = HINTS[h][i] ? ' — <b>' + HINTS[h][i] + '</b>' : '';
        parts.push((h === 'rh' ? 'MD' : 'ME') + ': dedo ' + ev[h].finger + ' (' + P.noteLetter(ev[h].midi) + ')' + hint);
      } else {
        kb.setMarker(h, null); hands[h].set(0);
      }
    });
    setNow((ev.dir === 'up' ? '↑ ' : '↓ ') + P.noteName(ev.rh.midi), parts.join('<br>'));
  }

  /* ---- Sequenciador (relógio do áudio, com plano B no relógio do navegador) ---- */
  var sched = { timer: null, raf: 0, next: 0, idx: 0, queue: [], clock: null, latency: 0 };
  function now() { return sched.clock(); }

  // no celular, ao tocar, rola para mostrar partitura + teclado juntos
  function revealStage() {
    if (window.innerWidth >= 760) return;
    var sc = document.getElementById('score').closest('.card');
    var kbBox = document.getElementById('keyboard').getBoundingClientRect();
    var scBox = sc.getBoundingClientRect();
    if (scBox.top < 0 || kbBox.bottom > window.innerHeight - 70) {
      window.scrollBy({ top: scBox.top - 6, behavior: 'smooth' });
    }
  }
  function start() {
    revealStage();
    var ctx = synth.ensure();
    var go = function () {
      if (ctx && ctx.state === 'running') {
        sched.clock = function () { return ctx.currentTime; };
        sched.latency = (ctx.outputLatency || ctx.baseLatency || 0);
      } else {
        var t0 = performance.now();
        sched.clock = function () { return (performance.now() - t0) / 1000; };
        sched.latency = 0;
      }
      state.playing = true;
      sched.idx = 0; sched.queue = [];
      sched.next = now() + 0.15;
      kb.setMarker('rh', null); kb.setMarker('lh', null);
      updatePlayBtn();
      tick();
      sched.timer = setInterval(tick, 25);
      sched.raf = requestAnimationFrame(frame);
    };
    if (ctx && ctx.state !== 'running' && ctx.resume) {
      var done = false, fin = function () { if (!done) { done = true; go(); } };
      ctx.resume().then(fin, fin); setTimeout(fin, 400);
    } else go();
  }
  function tick() {
    if (!state.playing) return;
    var horizon = now() + 0.12;
    while (sched.next < horizon) {
      var i = sched.idx, ev = EVENTS[i], beat = 60 / TEMPOS[state.tempo].bpm, mode = state.mode;
      var isLast = i === EVENTS.length - 1;
      var dur = beat * (isLast ? 1.6 : 0.96);
      if (synth.ctx && sched.clock && synth.ctx.state === 'running') {
        if (uses(mode, 'rh')) synth.note(ev.rh.midi, sched.next, dur, 0.8);
        if (uses(mode, 'lh')) synth.note(ev.lh.midi, sched.next, dur, mode === 'both' ? 0.7 : 0.8);
      }
      sched.queue.push({ t: sched.next, i: i, mode: mode });
      sched.queue.push({ t: sched.next + beat * 0.86, release: i });
      sched.next += beat;
      sched.idx++;
      if (sched.idx >= EVENTS.length) {
        if (state.loop) { sched.idx = 0; sched.next += beat; } // um tempo de pausa e recomeça
        else { sched.queue.push({ t: sched.next + beat * 0.6, end: true }); clearInterval(sched.timer); sched.timer = null; break; }
      }
    }
  }
  function frame() {
    if (!state.playing) return;
    var t = now() - sched.latency;
    while (sched.queue.length && sched.queue[0].t <= t) {
      var e = sched.queue.shift();
      if (e.end) { stop(true); return; }
      if (e.release != null) { if (state.current === e.release) kb.releaseAll(); }
      else showEvent(e.i, e.mode);
    }
    sched.raf = requestAnimationFrame(frame);
  }
  function stop(natural) {
    state.playing = false;
    clearInterval(sched.timer); sched.timer = null;
    cancelAnimationFrame(sched.raf);
    sched.queue = [];
    if (!natural) synth.stopAll();
    updatePlayBtn();
    showStartPosition();
  }

  /* ---- Controles ---- */
  var btnPlay = document.getElementById('btn-play'), btnLoop = document.getElementById('btn-loop');
  function updatePlayBtn() {
    btnPlay.textContent = state.playing ? '■ Parar' : '▶ Tocar';
    btnPlay.classList.toggle('playing', state.playing);
  }
  btnPlay.addEventListener('click', function () { if (state.playing) stop(false); else start(); });
  btnLoop.addEventListener('click', function () {
    state.loop = !state.loop;
    btnLoop.setAttribute('aria-pressed', String(state.loop));
    if (state.loop && state.playing && !sched.timer) { // terminou de agendar: retoma em loop
      sched.queue = sched.queue.filter(function (e) { return !e.end; });
      sched.idx = 0; sched.next += 60 / TEMPOS[state.tempo].bpm;
      sched.timer = setInterval(tick, 25);
    }
  });
  Array.prototype.forEach.call(document.querySelectorAll('.seg .btn'), function (b) {
    b.addEventListener('click', function () {
      state.mode = b.getAttribute('data-mode');
      Array.prototype.forEach.call(document.querySelectorAll('.seg .btn'), function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      applyDims();
      if (!state.playing) showStartPosition();
    });
  });
  var tempo = document.getElementById('tempo'), tempoOut = document.getElementById('tempo-out');
  function updTempo() {
    state.tempo = +tempo.value;
    tempoOut.textContent = TEMPOS[state.tempo].name + ' · ' + TEMPOS[state.tempo].bpm + ' bpm';
  }
  tempo.addEventListener('input', updTempo);
  updTempo();

  // ganchos para os testes / gravação do vídeo
  window.__aula.showEvent = showEvent;
  window.__aula.showStartPosition = showStartPosition;
  window.__aula.releaseKeys = function () { kb.releaseAll(); };
  // teclado visível, nada pressionado, sem marcadores (pausas do vídeo)
  window.__aula.showIdle = function () {
    state.current = -1; clearScore(); kb.releaseAll();
    ['rh', 'lh'].forEach(function (h) { hands[h].setEnabled(uses(state.mode, h)); hands[h].set(0); kb.setMarker(h, null); });
    setNow('\u00a0', '\u00a0');
  };

  /* ---- Inicialização ---- */
  renderScore();
  showStartPosition();
  var rT = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () {
      if (Math.abs(document.getElementById('score').clientWidth - lastScoreWidth) > 4) renderScore();
    }, 150);
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && state.playing) stop(false); });
})();
