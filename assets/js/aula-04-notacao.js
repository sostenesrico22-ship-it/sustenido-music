/* Sustenido Music — Aula 4: Notação musical (como ler a partitura) */
(function () {
  'use strict';
  var P = window.SustenidoPiano, L = window.SustenidoLesson, VF = Vex.Flow;
  var NS = 'http://www.w3.org/2000/svg';
  var S = P.SOLFEGE, LET = P.LETTERS;
  var WHITE_PC = [0, 2, 4, 5, 7, 9, 11], KEYL = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
  function oct(m) { return Math.floor(m / 12) - 1; }
  function dia(m) { return oct(m) * 7 + WHITE_PC.indexOf(m % 12); }
  function vfKey(m) { return KEYL[WHITE_PC.indexOf(m % 12)] + '/' + oct(m); }
  function svgEl(name, attrs, parent) { var n = document.createElementNS(NS, name); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
  function txt(parent, x, y, t, a) {
    var e = svgEl('text', Object.assign({ x: x, y: y, 'font-size': 11, 'font-weight': 700, fill: '#1F2A44', 'font-family': 'system-ui, sans-serif', 'text-anchor': 'middle' }, a || {}), parent);
    e.textContent = t; return e;
  }
  /* posição da nota na pauta (linha / espaço) */
  function where(m, clef) {
    var d = dia(m) - dia(clef === 'treble' ? 64 : 43); // E4 / G2 = 1ª linha
    if (d >= 0 && d <= 8) return d % 2 === 0 ? (d / 2 + 1) + 'ª linha' : ((d + 1) / 2) + 'º espaço';
    if (d === -1) return 'logo abaixo da pauta';
    if (d === -2) return 'linha suplementar abaixo';
    if (d === 9) return 'logo acima da pauta';
    if (d === 10) return 'linha suplementar acima';
    return '';
  }
  function sound(m, dur) { var c = L.synth.ensure(); if (c) L.synth.note(m, c.currentTime + 0.01, dur || 0.9, 0.8); }

  /* ---- 1. pauta: 5 linhas e 4 espaços ---- */
  (function () {
    var s = document.getElementById('pauta-art');
    var y = function (k) { return 80 - k * 16; }; // k = 0..4 (linha 1 embaixo)
    for (var k = 0; k < 5; k++) {
      svgEl('line', { x1: 50, x2: 270, y1: y(k), y2: y(k), stroke: '#1F2A44', 'stroke-width': 1.6 }, s);
      svgEl('circle', { cx: 34, cy: y(k), r: 8, fill: '#1F2A44' }, s);
      txt(s, 34, y(k) + 4, String(k + 1), { fill: '#FFFFFF' });
    }
    for (var e = 0; e < 4; e++) {
      svgEl('circle', { cx: 286, cy: y(e) - 8, r: 7, fill: '#C9A227' }, s);
      txt(s, 286, y(e) - 4, String(e + 1), { fill: '#1F2A44', 'font-size': 10 });
    }
    txt(s, 34, 99, 'linhas', { 'font-size': 10, fill: '#5C6680' });
    txt(s, 286, 99, 'espaços', { 'font-size': 10, fill: '#5C6680' });
    // exemplo: uma nota numa linha e outra num espaço
    svgEl('ellipse', { cx: 105, cy: y(1), rx: 7, ry: 5, fill: '#1F2A44', transform: 'rotate(-20 105 ' + y(1) + ')' }, s);
    svgEl('ellipse', { cx: 215, cy: y(2) - 8, rx: 7, ry: 5, fill: '#9E7E14', transform: 'rotate(-20 215 ' + (y(2) - 8) + ')' }, s);
    txt(s, 105, 9, 'nota na linha', { 'font-size': 10 });
    txt(s, 215, 9, 'nota no espaço', { 'font-size': 10, fill: '#9E7E14' });
  })();

  /* ---- 2. claves ---- */
  function clefDemo(id, clef, midi, lineIdx, label, color) {
    var els = L.miniStaff(document.getElementById(id), { width: 260, height: 118, y: 4, clef: clef, belowSize: 13, notes: [{ keys: [vfKey(midi)], d: 'w', below: label.split(' ')[0] }] });
    var st = els.stave, yL = st.getYForLine(lineIdx);
    var band = svgEl('rect', { x: st.getX(), y: yL - 3.5, width: st.getWidth(), height: 7, fill: color, 'fill-opacity': 0.35, rx: 3 });
    els.svg.insertBefore(band, els.svg.firstChild);
    txt(els.svg, st.getX() + st.getWidth() - 40, yL - 6, label, { fill: '#1F2A44', 'font-size': 12, 'paint-order': 'stroke', stroke: '#FFFFFF', 'stroke-width': 4, 'stroke-linejoin': 'round' });
    if (els[0]) els[0].classList.add('hl');
  }
  clefDemo('vf-sol', 'treble', 67, 3, 'Sol · 2ª linha', '#C9A227');
  clefDemo('vf-fa', 'bass', 53, 1, 'Fá · 4ª linha', '#2A9D8F');

  /* ---- 3. notas na partitura (interativo) ---- */
  var TREBLE = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79];   // C4..G5
  var BASS = [41, 43, 45, 47, 48, 50, 52, 53, 55, 57, 59, 60];      // F2..C4
  var kbMini = new P.Keyboard(document.getElementById('kb-mini'), { low: 41, high: 79, onKey: function (m) { select(m, true); } });
  kbMini.setLabels(false);
  var staffs = {};
  function drawNotes() {
    var cw = document.getElementById('vf-notes-sol').clientWidth || 360;
    var W = cw < 600 ? 470 : 900;
    [['treble', 'vf-notes-sol', TREBLE], ['bass', 'vf-notes-fa', BASS]].forEach(function (cfg) {
      var els = L.miniStaff(document.getElementById(cfg[1]), {
        width: W, height: 146, y: 14, clef: cfg[0], belowSize: 13,
        notes: cfg[2].map(function (m) { return { keys: [vfKey(m)], d: 'w', below: S[m % 12] }; })
      });
      var st = els.stave, hits = [];
      var gap = els.notes.length > 1 ? els.notes[1].getAbsoluteX() - els.notes[0].getAbsoluteX() : 30;
      els.notes.forEach(function (n, i) {
        var x = n.getAbsoluteX() + 5 - gap / 2;
        var h = svgEl('rect', { class: 'hit', x: x, y: st.getY() + 10, width: gap, height: 118, rx: 6, stroke: 'none', fill: 'transparent' }, els.svg);
        h.addEventListener('click', function () { select(cfg[2][i], false); });
        hits.push(h);
      });
      staffs[cfg[0]] = { els: els, hits: hits, midis: cfg[2] };
    });
  }
  function select(m, fromKey) {
    sound(m);
    kbMini.releaseAll(); kbMini.press(m, 'rh');
    var parts = [];
    ['treble', 'bass'].forEach(function (c) {
      var s = staffs[c]; if (!s) return;
      s.midis.forEach(function (mm, i) {
        var on = mm === m;
        s.hits[i].classList.toggle('on', on);
        if (s.els[i]) s.els[i].classList.toggle('hl', on);
      });
      if (s.midis.indexOf(m) >= 0) parts.push((c === 'treble' ? 'Clave de Sol: ' : 'Clave de Fá: ') + where(m, c));
    });
    var pc = m % 12;
    if (P.IS_BLACK[pc]) {
      document.getElementById('ni-name').textContent = S[pc] + ' / ' + S[pc + 1] + '♭';
      document.getElementById('ni-sub').textContent = 'tecla preta (precisa de ♯ ou ♭ na partitura)';
      return;
    }
    document.getElementById('ni-name').textContent = S[pc] + (m === 60 ? ' central' : '');
    document.getElementById('ni-sub').textContent = LET[pc] + oct(m) + (parts.length ? ' · ' + parts.join(' · ') : ' · fora das pautas acima');
  }
  drawNotes();

  /* ---- 4. pauta dupla com Dó central ---- */
  (function () {
    var host = document.getElementById('vf-grand'), W = 340, H = 230;
    var r = new VF.Renderer(host, VF.Renderer.Backends.SVG); r.resize(W, H);
    var ctx = r.getContext(), svg = host.querySelector('svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', '100%'); svg.removeAttribute('height');
    svg.style.width = '100%'; svg.style.height = 'auto'; svg.style.maxWidth = '420px'; svg.style.margin = '0 auto'; svg.style.display = 'block';
    var tr = new VF.Stave(26, 0, 180).addClef('treble'), bs = new VF.Stave(26, 110, 180).addClef('bass');
    tr.setEndBarType(VF.Barline.type.END); bs.setEndBarType(VF.Barline.type.END);
    var sx = Math.max(tr.getNoteStartX(), bs.getNoteStartX()); tr.setNoteStartX(sx); bs.setNoteStartX(sx);
    tr.setContext(ctx).draw(); bs.setContext(ctx).draw();
    new VF.StaveConnector(tr, bs).setType(VF.StaveConnector.type.BRACE).setContext(ctx).draw();
    new VF.StaveConnector(tr, bs).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();
    new VF.StaveConnector(tr, bs).setType(VF.StaveConnector.type.BOLD_DOUBLE_RIGHT).setContext(ctx).draw();
    var a = new VF.StaveNote({ clef: 'treble', keys: ['c/4'], duration: 'w' }), b = new VF.StaveNote({ clef: 'bass', keys: ['c/4'], duration: 'w' });
    var tv = new VF.Voice({ num_beats: 4, beat_value: 4 }).addTickables([a]), bv = new VF.Voice({ num_beats: 4, beat_value: 4 }).addTickables([b]);
    new VF.Formatter().joinVoices([tv]).joinVoices([bv]).format([tv, bv], 60);
    tv.draw(ctx, tr); bv.draw(ctx, bs);
    [a, b].forEach(function (n) {
      var e = n.getSVGElement ? n.getSVGElement() : null; if (e) e.classList.add('hl');
      var x = n.getAbsoluteX() + 30, y = n.getYs()[0];
      txt(svg, x, y + 4, '← Dó central', { 'text-anchor': 'start', fill: '#9E7E14', 'font-size': 13 });
    });
    txt(svg, 250, 52, 'mão direita', { 'text-anchor': 'start', fill: '#9E7E14', 'font-size': 11 });
    txt(svg, 250, 168, 'mão esquerda', { 'text-anchor': 'start', fill: '#1E7369', 'font-size': 11 });
    host.classList.add('vf-wide');
  })();

  /* ---- 5. figuras e pausas ---- */
  var FIGS = [
    { n: 'Semibreve', v: '4 tempos', d: 'w', b: 4 }, { n: 'Mínima', v: '2 tempos', d: 'h', b: 2 },
    { n: 'Semínima', v: '1 tempo', d: 'q', b: 1 }, { n: 'Colcheia', v: '½ tempo', d: '8', b: 0.5 }
  ];
  var figWrap = document.getElementById('figs'), BEAT = 0.6, figMap = {};
  FIGS.forEach(function (f, i) {
    var box = document.createElement('div'); box.className = 'mini';
    box.innerHTML = '<div><div class="fig-name">' + f.n + '</div><div class="fig-val">' + f.v + '</div></div><div class="vf" id="fig' + i + '"></div>' +
      '<div class="btn-row"><button class="play" type="button" data-sound="fig' + i + '">Ouvir</button></div>';
    figWrap.appendChild(box);
    L.miniStaff(box.querySelector('.vf'), { width: 170, height: 118, y: 0, clef: 'none',
      notes: [{ keys: ['b/4'], d: f.d, below: 'nota' }, { keys: [f.d === 'w' ? 'd/5' : 'b/4'], d: f.d + 'r', below: 'pausa' }] });
    figMap['fig' + i] = { seq: [{ t: 0, midi: 67, dur: f.b * BEAT * 0.95 }, { t: f.b * BEAT, midi: null, dur: f.b * BEAT }] };
  });

  /* ---- 6. compasso 4/4 ---- */
  var comp = L.miniStaff(document.getElementById('vf-comp'), { width: 360, height: 120, y: 4, time: '4/4', end: true,
    notes: [{ keys: ['c/4'], d: 'q', below: '1' }, { keys: ['d/4'], d: 'q', below: '2' }, { keys: ['e/4'], d: 'q', below: '3' }, { keys: ['f/4'], d: 'q', below: '4' },
      { bar: true }, { keys: ['g/4'], d: 'h', below: '1 2' }, { keys: ['e/4'], d: 'h', below: '3 4' }] });
  var compSeq = [], countEl = document.getElementById('count');
  [[60, 1, 0], [62, 1, 1], [64, 1, 2], [65, 1, 3], [67, 2, 5], [64, 2, 6]].reduce(function (t, n) {
    compSeq.push({ t: t, midi: n[0], dur: n[1] * BEAT * 0.95, el: n[2], beat: 0 });
    if (n[1] === 2) compSeq.push({ t: t + BEAT, midi: null, dur: BEAT * 0.95, el: n[2], beat: 1 });
    return t + n[1] * BEAT;
  }, 0);
  compSeq.forEach(function (n, i) { n.count = (i % 4) + 1; });

  var map = {
    sol: { seq: [{ t: 0, midi: 67, dur: 1 }] },
    fa: { seq: [{ t: 0, midi: 53, dur: 1 }] },
    central: { seq: [{ t: 0, midi: 60, dur: 1.2 }] },
    compasso: {
      seq: compSeq,
      step: function (n) { L.mark(comp, n.el); countEl.textContent = 'Tempo ' + n.count; },
      end: function () { L.mark(comp, -1); countEl.textContent = ''; }
    }
  };
  for (var k in figMap) map[k] = figMap[k];
  L.bindButtons(map);

  /* ---- 7. dedilhado ---- */
  var hl = new P.HandDiagram(document.getElementById('h-lh'), 'lh'), hr = new P.HandDiagram(document.getElementById('h-rh'), 'rh');
  var FN = { 1: 'polegar', 2: 'indicador', 3: 'médio', 4: 'anelar', 5: 'mindinho' };
  Array.prototype.forEach.call(document.querySelectorAll('.ded-btns .opt'), function (b) {
    b.addEventListener('click', function () {
      var f = +b.getAttribute('data-f');
      hl.set(f); hr.set(f);
      Array.prototype.forEach.call(document.querySelectorAll('.ded-btns .opt'), function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      document.getElementById('ded-name').textContent = f + ' = ' + FN[f] + ' (nas duas mãos)';
    });
  });

  /* ---- 8. quiz: Qual é a nota? ---- */
  var POOL = TREBLE.map(function (m) { return { m: m, c: 'treble' }; }).concat(BASS.map(function (m) { return { m: m, c: 'bass' }; }));
  var NAMES = ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'];
  var cur = null, last = null, tries = 0, right = 0, answered = false;
  var qOpts = document.getElementById('q-opts'), qFb = document.getElementById('q-fb'), qScore = document.getElementById('q-score');
  function newQ() {
    do { cur = POOL[Math.floor(Math.random() * POOL.length)]; } while (last && cur.m === last.m && cur.c === last.c);
    last = cur; answered = false;
    L.miniStaff(document.getElementById('vf-quiz'), { width: 200, height: 120, y: 12, clef: cur.c, notes: [{ keys: [vfKey(cur.m)], d: 'w' }] });
    document.getElementById('qq').textContent = 'Que nota é esta? (' + (cur.c === 'treble' ? 'clave de Sol' : 'clave de Fá') + ')';
    var ok = S[cur.m % 12], opts = [ok];
    while (opts.length < 4) { var o = NAMES[Math.floor(Math.random() * 7)]; if (opts.indexOf(o) < 0) opts.push(o); }
    opts.sort(function () { return Math.random() - 0.5; });
    qOpts.innerHTML = ''; qFb.textContent = ''; qFb.className = 'fb';
    opts.forEach(function (o) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.textContent = o;
      b.addEventListener('click', function () {
        if (answered) return;
        if (o === ok) {
          answered = true; b.classList.add('right'); tries++; right++;
          qFb.textContent = 'Isso! ' + ok + ' (' + LET[cur.m % 12] + oct(cur.m) + ') · ' + where(cur.m, cur.c) + '.'; qFb.className = 'fb ok';
          sound(cur.m);
        } else {
          b.classList.add('wrong'); b.disabled = true;
          qFb.textContent = 'Ainda não. Dica: ' + (cur.c === 'treble' ? 'Sol fica na 2ª linha.' : 'Fá fica na 4ª linha.'); qFb.className = 'fb no';
          if (!b.dataset.counted) { b.dataset.counted = 1; }
        }
        qScore.textContent = 'Acertos: ' + right;
      });
      qOpts.appendChild(b);
    });
  }
  document.getElementById('q-next').addEventListener('click', newQ);
  newQ();

  /* redesenha as pautas largas ao girar o celular / mudar a janela */
  var rT = 0, lastW = document.getElementById('vf-notes-sol').clientWidth;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () {
      var w = document.getElementById('vf-notes-sol').clientWidth;
      if ((w < 600) !== (lastW < 600)) drawNotes();
      lastW = w;
    }, 200);
  });
  window.__aula4 = { where: where, select: select, cur: function () { return cur; } };
})();
