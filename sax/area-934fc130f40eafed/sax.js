/* Sustenido Music — Sax Alto Básico 1: som do sax, desenhos, jogos e exercícios.
   Todas as notas são ESCRITAS para o sax alto (instrumento em Mi♭: soa uma 6ª maior abaixo). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/sax\.js(\?.*)?$/, '');

  /* ---------- notas ---------- */
  var NOTES = {
    d4: { nome: 'Ré', grave: 'Ré grave', vf: 'd/4', midi: 62, keys: ['L1', 'L2', 'L3', 'R1', 'R2', 'R3'] },
    e4: { nome: 'Mi', grave: 'Mi grave', vf: 'e/4', midi: 64, keys: ['L1', 'L2', 'L3', 'R1', 'R2'] },
    f4: { nome: 'Fá', grave: 'Fá grave', vf: 'f/4', midi: 65, keys: ['L1', 'L2', 'L3', 'R1'] },
    g4: { nome: 'Sol', grave: 'Sol', vf: 'g/4', midi: 67, keys: ['L1', 'L2', 'L3'] },
    a4: { nome: 'Lá', grave: 'Lá', vf: 'a/4', midi: 69, keys: ['L1', 'L2'] },
    b4: { nome: 'Si', grave: 'Si', vf: 'b/4', midi: 71, keys: ['L1'] },
    c5: { nome: 'Dó', grave: 'Dó (médio)', vf: 'c/5', midi: 72, keys: ['L2'] },
    d5: { nome: 'Ré', grave: 'Ré agudo', vf: 'd/5', midi: 74, keys: ['8va', 'L1', 'L2', 'L3', 'R1', 'R2', 'R3'] },
    e5: { nome: 'Mi', grave: 'Mi agudo', vf: 'e/5', midi: 76, keys: ['8va', 'L1', 'L2', 'L3', 'R1', 'R2'] },
    f5: { nome: 'Fá', grave: 'Fá agudo', vf: 'f/5', midi: 77, keys: ['8va', 'L1', 'L2', 'L3', 'R1'] }
  };
  var KEYNAME = { '8va': 'chave de oitava (polegar esquerdo)', L1: 'indicador esquerdo', L2: 'médio esquerdo', L3: 'anelar esquerdo', R1: 'indicador direito', R2: 'médio direito', R3: 'anelar direito' };
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------- áudio ---------- */
  var ctx = null, master = null, buffers = {}, loading = null, active = [], timers = [], stopHooks = [];
  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    if (!loading) loading = Promise.all(Object.keys(NOTES).map(function (n) {
      return fetch(BASE + 'audio/' + n + '.mp3').then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function (ab) { return new Promise(function (ok, no) { ctx.decodeAudioData(ab, ok, no); }); })
        .then(function (b) { buffers[n] = b; }).catch(function () { /* usa o som sintetizado */ });
    }));
    return ctx;
  }
  function synthNote(n, t, dur, vel) { // reserva: timbre de palheta sintetizado
    var f = 440 * Math.pow(2, (NOTES[n].midi - 9 - 69) / 12);
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = f; o2.frequency.value = f; o2.detune.value = 4;
    lp.type = 'lowpass'; lp.frequency.value = 1700; lp.Q.value = 2;
    var g2 = ctx.createGain(); g2.gain.value = 0.25;
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(master);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18 * vel, t + 0.05); g.gain.setValueAtTime(0.18 * vel, t + Math.max(0.06, dur - 0.08)); g.gain.linearRampToValueAtTime(0, t + dur);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    active.push(o, o2);
  }
  function note(n, t, dur, vel) {
    if (!ctx || !NOTES[n]) return;
    vel = vel == null ? 1 : vel;
    var b = buffers[n];
    if (!b) return synthNote(n, t, dur, vel);
    var s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b; s.connect(g); g.connect(master);
    var end = Math.min(dur, b.duration - 0.05), rel = Math.min(0.12, end * 0.3);
    g.gain.setValueAtTime(vel, t); g.gain.setValueAtTime(vel, t + end - rel); g.gain.linearRampToValueAtTime(0, t + end);
    s.start(t); s.stop(t + end + 0.02); active.push(s);
  }
  function click(t, strong) {
    if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = strong ? 1500 : 1000; o.connect(g); g.connect(master);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(strong ? 0.25 : 0.15, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    o.start(t); o.stop(t + 0.06); active.push(o);
  }
  function stopAll() {
    timers.forEach(clearTimeout); timers = [];
    active.forEach(function (s) { try { s.stop(); } catch (e) { } }); active = [];
    var hk = stopHooks; stopHooks = []; hk.forEach(function (f) { f(); });
  }
  function at(sec, fn) { timers.push(setTimeout(fn, Math.max(0, sec * 1000))); }
  /* toca uma nota agora (depois que as amostras carregarem) */
  function playNow(n, dur) {
    stopAll(); if (!ensure()) return;
    loading.then(function () { note(n, ctx.currentTime + 0.03, dur || 1.4); });
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopAll(); });


  /* sequência simples: [{n:'b4', t:0, d:0.5}], onStep(ev, i), onEnd() */
  function seq(events, onStep, onEnd) {
    stopAll(); if (!ensure()) return;
    if (onEnd) stopHooks.push(onEnd);
    loading.then(function () {
      var t0 = ctx.currentTime + 0.08, now = ctx.currentTime, end = 0;
      events.forEach(function (ev, i) {
        if (ev.n) note(ev.n, t0 + ev.t, ev.d);
        if (onStep) at(t0 + ev.t - now, function () { onStep(ev, i); });
        end = Math.max(end, ev.t + ev.d);
      });
      at(t0 + end - now + 0.15, function () { stopAll(); });
    });
  }

  /* ---------- desenho do sax (partes + chaves) ---------- */
  var PARTS = {
    boquilha: { nome: 'Boquilha', txt: 'Peça de cima, onde a boca se apoia. É nela que o som começa: o ar faz a palheta vibrar contra a boquilha.' },
    palheta: { nome: 'Palheta', txt: 'Lâmina fina de cana presa embaixo da boquilha. Ela vibra com o ar. Para começar, use palheta nº 2 ou 2½. Molhe antes de tocar.' },
    abracadeira: { nome: 'Abraçadeira', txt: 'A “braçadeira” que prende a palheta na boquilha. Aperte os parafusos só de leve, sem esmagar a palheta.' },
    tudel: { nome: 'Tudel', txt: 'O “pescoço” curvo que liga a boquilha ao corpo. Tem uma cortiça onde a boquilha encaixa e a chave de oitava em cima.' },
    corpo: { nome: 'Corpo', txt: 'O tubo principal de metal (latão). Nele ficam quase todas as chaves. A parte de baixo, em forma de “U”, chama-se curva.' },
    chaves: { nome: 'Chaves e sapatilhas', txt: 'As chaves são as “teclas” onde os dedos apertam (as de madrepérola são as principais). Cada chave tem uma sapatilha: a almofadinha de couro que tampa o furo do corpo.' },
    campana: { nome: 'Campana', txt: 'A boca larga do sax, virada para cima e para a frente. É por onde o som sai mais forte.' },
    correia: { nome: 'Correia', txt: 'Alça que vai no pescoço e prende no gancho atrás do corpo. Segura o peso do sax: assim os dedos ficam livres e o pescoço não força.' }
  };
  var PART_ORDER = ['boquilha', 'palheta', 'abracadeira', 'tudel', 'corpo', 'chaves', 'campana', 'correia'];
  var KEYPOS = { '8va': [104, 132], L1: [130, 152], L2: [130, 180], L3: [130, 208], R1: [131, 268], R2: [132, 296], R3: [133, 324] };

  function drawSax(host, opts) {
    opts = opts || {};
    var svg = el('svg', { viewBox: '0 0 260 520', class: 'sax-svg', role: 'img', 'aria-label': 'Desenho do saxofone alto com as partes' });
    var defs = el('defs', {}, svg);
    var lg = el('linearGradient', { id: 'brass' + (opts.id || ''), x1: '0', x2: '1' }, defs);
    el('stop', { offset: '0', 'stop-color': '#B8892A' }, lg); el('stop', { offset: '.45', 'stop-color': '#F0CF6A' }, lg); el('stop', { offset: '1', 'stop-color': '#A87C22' }, lg);
    var brass = 'url(#brass' + (opts.id || '') + ')';
    function part(name) { var g = el('g', { 'data-part': name, class: 'part' }, svg); return g; }
    // correia (atrás)
    var gc = part('correia');
    el('path', { d: 'M112,168 C80,160 45,125 22,70 L10,6', fill: 'none', stroke: '#1F2A44', 'stroke-width': 7, 'stroke-linecap': 'round' }, gc);
    el('circle', { cx: 114, cy: 168, r: 6, fill: 'none', stroke: '#555', 'stroke-width': 3 }, gc);
    el('path', { d: 'M112,168 C80,160 45,125 22,70 L10,6', fill: 'none', stroke: 'transparent', 'stroke-width': 22, class: 'hit' }, gc);
    // corpo + curva
    var gb = part('corpo');
    el('path', { d: 'M121,108 L139,108 L147,420 C147,468 183,468 183,420 L217,420 C217,506 113,506 113,420 Z', fill: brass, stroke: '#7a5a14', 'stroke-width': 1.5 }, gb);
    el('rect', { x: 118, y: 104, width: 24, height: 8, rx: 2, fill: '#C99A30', stroke: '#7a5a14' }, gb);
    el('rect', { x: 104, y: 270, width: 9, height: 14, rx: 3, fill: '#8a6a1a' }, gb); // gancho do polegar direito
    // campana
    var gk = part('campana');
    el('path', { d: 'M183,420 L181,336 C179,306 166,290 150,274 L250,274 C236,292 223,308 221,336 L217,420 Z', fill: brass, stroke: '#7a5a14', 'stroke-width': 1.5 }, gk);
    el('ellipse', { cx: 200, cy: 274, rx: 50, ry: 8, fill: '#6b4e10', stroke: '#7a5a14' }, gk);
    // chaves e sapatilhas
    var gch = part('chaves');
    [[151, 136], [153, 230], [156, 350], [159, 395], [188, 380], [212, 352], [211, 395]].forEach(function (p) {
      el('circle', { cx: p[0], cy: p[1], r: 8, fill: '#D9B04A', stroke: '#7a5a14', 'stroke-width': 1.5 }, gch);
      el('circle', { cx: p[0], cy: p[1], r: 4, fill: '#7a5a14', opacity: .35 }, gch);
    });
    var keyEls = {};
    Object.keys(KEYPOS).forEach(function (k) {
      var p = KEYPOS[k];
      if (k === '8va') {
        keyEls[k] = el('rect', { x: p[0] - 7, y: p[1] - 9, width: 14, height: 18, rx: 5, class: 'skey', 'data-key': k }, gch);
      } else keyEls[k] = el('circle', { cx: p[0], cy: p[1], r: 9, class: 'skey', 'data-key': k }, gch);
    });
    el('line', { x1: 116, y1: 238, x2: 146, y2: 238, stroke: '#7a5a14', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, gch);
    // tudel
    var gt = part('tudel');
    el('path', { d: 'M130,110 C130,70 112,54 74,51', fill: 'none', stroke: '#8a6a1a', 'stroke-width': 13, 'stroke-linecap': 'round' }, gt);
    el('path', { d: 'M130,110 C130,70 112,54 74,51', fill: 'none', stroke: '#E7C35A', 'stroke-width': 9, 'stroke-linecap': 'round' }, gt);
    el('path', { d: 'M96,47 C108,46 118,52 122,62', fill: 'none', stroke: '#7a5a14', 'stroke-width': 3, 'stroke-linecap': 'round' }, gt);
    el('path', { d: 'M130,110 C130,70 112,54 74,51', fill: 'none', stroke: 'transparent', 'stroke-width': 26, class: 'hit' }, gt);
    // boquilha
    var gq = part('boquilha');
    el('path', { d: 'M78,44 L78,58 L34,55 L22,49 L34,43 Z', fill: '#1d1d22', stroke: '#000' }, gq);
    el('path', { d: 'M86,40 L86,62 L22,62 L14,49 L22,36 Z', fill: 'transparent', class: 'hit' }, gq);
    // palheta
    var gp = part('palheta');
    el('path', { d: 'M54,57 L30,55 L32,59 L54,61 Z', fill: '#D9B26F', stroke: '#9b7a3c', 'stroke-width': .8 }, gp);
    el('path', { d: 'M56,55 L26,53 L22,70 L56,72 Z', fill: 'transparent', class: 'hit' }, gp);
    // abraçadeira
    var ga = part('abracadeira');
    el('path', { d: 'M56,43 L66,44 L66,62 L56,61 Z', fill: '#C8CCD4', stroke: '#6d7280', 'stroke-width': 1 }, ga);
    el('circle', { cx: 61, cy: 66, r: 2.6, fill: '#6d7280' }, ga);
    el('path', { d: 'M52,30 L70,30 L70,64 L52,64 Z', fill: 'transparent', class: 'hit' }, ga);
    host.appendChild(svg);
    return {
      svg: svg, keys: keyEls,
      parts: function () { return svg.querySelectorAll('[data-part]'); },
      highlight: function (name, cls) {
        Array.prototype.forEach.call(svg.querySelectorAll('[data-part]'), function (g) { g.classList.toggle(cls || 'on', g.getAttribute('data-part') === name); });
      },
      press: function (list) {
        Object.keys(keyEls).forEach(function (k) { keyEls[k].classList.toggle('down', list.indexOf(k) >= 0); });
      }
    };
  }

  /* ---------- quadro de dedilhado (pequeno) ---------- */
  function fingerChart(n, small) {
    var keys = NOTES[n].keys;
    var svg = el('svg', { viewBox: '0 0 70 190', class: 'fchart' + (small ? ' small' : ''), role: 'img', 'aria-label': 'Dedilhado da nota ' + NOTES[n].grave });
    el('rect', { x: 26, y: 4, width: 18, height: 182, rx: 9, fill: '#F6EDCF', stroke: '#C9A227' }, svg);
    var pos = { '8va': [10, 28], L1: [35, 30], L2: [35, 58], L3: [35, 86], R1: [35, 122], R2: [35, 150], R3: [35, 178] };
    Object.keys(pos).forEach(function (k) {
      var p = pos[k], on = keys.indexOf(k) >= 0;
      if (k === '8va') el('rect', { x: p[0] - 6, y: p[1] - 8, width: 12, height: 16, rx: 4, class: 'fk' + (on ? ' on' : '') }, svg);
      else el('circle', { cx: p[0], cy: p[1] - 6 + (k[0] === 'R' ? 0 : 0), r: 10, class: 'fk' + (on ? ' on' : '') }, svg);
    });
    el('line', { x1: 18, y1: 104, x2: 52, y2: 104, stroke: '#1F2A44', 'stroke-width': 2 }, svg);
    var t = el('text', { x: 4, y: 12, 'font-size': 9, 'font-weight': 700, fill: '#5C6680' }, svg); t.textContent = '8va';
    return svg;
  }

  /* ---------- partitura (VexFlow) ---------- */
  var BEATS = { w: 4, h: 2, q: 1, '8': 0.5, wr: 4, hr: 2, qr: 1 };
  function score(host, opts) {
    var VF = window.Vex && Vex.Flow; if (!VF) { host.textContent = 'Partitura indisponível.'; return; }
    var measures = [[]];
    opts.notes.forEach(function (n) { if (n === '|') measures.push([]); else measures[measures.length - 1].push(n); });
    measures = measures.filter(function (m) { return m.length; });
    var per = opts.perLine || 2, lines = [];
    for (var i = 0; i < measures.length; i += per) lines.push(measures.slice(i, i + per));
    var box = document.createElement('div'); box.className = 'sax-score'; host.appendChild(box);
    var items = []; // {n, beat, len, el}
    var beat = 0;
    lines.forEach(function (ln, li) {
      var W = opts.width || 340, H = opts.labels === false ? 96 : 116;
      var d = document.createElement('div'); box.appendChild(d);
      var r = new VF.Renderer(d, VF.Renderer.Backends.SVG); r.resize(W, H);
      var c = r.getContext(), svg = d.querySelector('svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', '100%'); svg.removeAttribute('height');
      svg.style.width = '100%'; svg.style.height = 'auto';
      var x = 4, first = true;
      var widths = ln.map(function (m, k) { return k === 0 ? (W - 8) / ln.length + 24 : (W - 8) / ln.length - 24 / (ln.length - 1 || 1); });
      if (ln.length === 1) widths = [W - 8];
      ln.forEach(function (m, mi) {
        var st = new VF.Stave(x, opts.labels === false ? 4 : 0, widths[mi]);
        if (mi === 0) st.addClef('treble');
        if (li === 0 && mi === 0 && opts.time !== false) st.addTimeSignature(opts.time || '4/4');
        if (li === lines.length - 1 && mi === ln.length - 1) st.setEndBarType(VF.Barline.type.END);
        st.setContext(c).draw();
        var sns = m.map(function (n) {
          var rest = !n.k, dur = n.d + (rest ? 'r' : '');
          var sn = new VF.StaveNote({ clef: 'treble', keys: [rest ? 'b/4' : NOTES[n.k].vf], duration: dur, auto_stem: true });
          if (!rest && opts.labels !== false) sn.addModifier(new VF.Annotation(NOTES[n.k].nome).setFont('Arial', 11, 'bold').setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM), 0);
          if (n.c) sn.addModifier(new VF.Annotation(n.c).setFont('Arial', 10, 'bold').setVerticalJustification(VF.Annotation.VerticalJustify.TOP), 0);
          return sn;
        });
        VF.Formatter.FormatAndDraw(c, st, sns, { auto_beam: false });
        m.forEach(function (n, k) {
          var len = BEATS[n.d] || 1;
          items.push({ n: n.k, beat: beat, len: len, el: sns[k].getSVGElement ? sns[k].getSVGElement() : null });
          beat += len;
        });
        x += widths[mi];
      });
    });
    var total = beat;
    if (opts.controls === false) return { items: items, total: total };
    var bpm = opts.bpm || 72;
    var ctl = h('<div class="score-ctl"><button type="button" class="play">Tocar com o sax</button>' +
      '<label class="tempo-mini"><span>Andamento: <output>' + bpm + '</output> bpm</span><input type="range" min="40" max="120" step="2" value="' + bpm + '"></label>' +
      '<label class="chk"><input type="checkbox" checked> metrônomo</label></div>');
    host.appendChild(ctl);
    var btn = ctl.querySelector('.play'), rng = ctl.querySelector('input[type=range]'), out = ctl.querySelector('output'), met = ctl.querySelector('input[type=checkbox]');
    if (opts.noTempo) ctl.querySelector('.tempo-mini').hidden = true;
    rng.addEventListener('input', function () { bpm = +rng.value; out.textContent = bpm; });
    function mark(i) { items.forEach(function (it, j) { if (it.el) it.el.classList.toggle('hl', j === i); }); }
    btn.addEventListener('click', function () {
      if (btn.classList.contains('is-playing')) { stopAll(); return; }
      stopAll(); if (!ensure()) return;
      btn.classList.add('is-playing'); btn.textContent = 'Parar';
      stopHooks.push(function () { btn.classList.remove('is-playing'); btn.textContent = 'Tocar com o sax'; mark(-1); });
      loading.then(function () {
        if (!btn.classList.contains('is-playing')) return;
        var spb = 60 / bpm, t0 = ctx.currentTime + 0.1, lead = 4 * spb, now = ctx.currentTime;
        for (var b = 0; b < 4; b++) click(t0 + b * spb, b === 0);
        if (met.checked) for (var b2 = 0; b2 < total; b2++) click(t0 + lead + b2 * spb, b2 % 4 === 0);
        items.forEach(function (it, i) {
          var t = t0 + lead + it.beat * spb;
          if (it.n) note(it.n, t, it.len * spb * 0.92);
          at(t - now, function () { mark(i); });
        });
        at(t0 + lead + total * spb - now + 0.2, function () { stopAll(); });
      });
    });
    return { items: items, total: total };
  }

  /* ---------- jogo de perguntas (pontos) ---------- */
  function quiz(host, opts) {
    var qs = opts.shuffle === false ? opts.questions.slice() : shuffle(opts.questions);
    if (opts.max) qs = qs.slice(0, opts.max);
    var i = 0, pts = 0, ok = 0, streak = 0, best = 0;
    var box = h('<div class="game"><div class="game-bar"><span class="g-q"></span><span class="g-pts">⭐ 0</span><span class="g-st">🔥 0</span></div><div class="g-body"></div></div>');
    host.appendChild(box);
    var body = box.querySelector('.g-body');
    function bar() {
      box.querySelector('.g-q').textContent = 'Pergunta ' + Math.min(i + 1, qs.length) + '/' + qs.length;
      box.querySelector('.g-pts').textContent = '⭐ ' + pts + ' pts';
      box.querySelector('.g-st').textContent = '🔥 ' + streak;
    }
    function show() {
      bar(); body.innerHTML = '';
      if (i >= qs.length) return end();
      var q = qs[i];
      var qe = h('<div class="g-card"><p class="g-text"></p><div class="g-media"></div><div class="g-opts"></div><p class="g-fb" aria-live="polite"></p></div>');
      qe.querySelector('.g-text').textContent = q.q;
      var media = qe.querySelector('.g-media');
      if (q.finger) media.appendChild(fingerChart(q.finger));
      if (q.staff) { var sd = document.createElement('div'); sd.className = 'g-staff'; media.appendChild(sd); score(sd, { notes: [{ k: q.staff, d: 'w' }], time: false, labels: false, controls: false, perLine: 1, width: 120 }); }
      if (q.audio) { var pb = h('<button type="button" class="play">Ouvir a nota</button>'); pb.addEventListener('click', function () { playNow(q.audio, 1.6); }); media.appendChild(pb); }
      if (!media.children.length) media.remove();
      var order = q.opts.map(function (o, k) { return k; });
      if (q.keep !== true) order = shuffle(order);
      var oe = qe.querySelector('.g-opts');
      order.forEach(function (k) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'g-opt'; b.textContent = q.opts[k];
        b.addEventListener('click', function () {
          if (qe.classList.contains('done')) return;
          qe.classList.add('done');
          var right = k === q.a, fb = qe.querySelector('.g-fb');
          b.classList.add(right ? 'right' : 'wrong');
          oe.querySelectorAll('.g-opt')[order.indexOf(q.a)].classList.add('right');
          if (right) { ok++; streak++; best = Math.max(best, streak); var bonus = streak >= 3 ? 5 : 0; pts += 10 + bonus; fb.className = 'g-fb ok'; fb.textContent = '✔ Acertou! +' + (10 + bonus) + (bonus ? ' (bônus de sequência)' : '') + (q.why ? ' — ' + q.why : ''); }
          else { streak = 0; fb.className = 'g-fb no'; fb.textContent = '✘ Não foi dessa vez. ' + (q.why || ('Resposta: ' + q.opts[q.a])); }
          bar();
          var nx = h('<button type="button" class="btn-next">' + (i + 1 < qs.length ? 'Próxima pergunta ›' : 'Ver resultado ›') + '</button>');
          nx.addEventListener('click', function () { i++; show(); });
          qe.appendChild(nx);
        });
        oe.appendChild(b);
      });
      body.appendChild(qe);
    }
    function end() {
      var pc = Math.round(ok / qs.length * 100), stars = pc >= 90 ? 3 : pc >= 60 ? 2 : pc >= 30 ? 1 : 0;
      var msg = pc >= 90 ? 'Excelente! Você dominou esta aula.' : pc >= 60 ? 'Muito bem! Revise o que errou e jogue de novo.' : 'Vale rever a aula com calma e tentar outra vez.';
      var e = h('<div class="g-end"><div class="g-stars">' + '★★★'.slice(0, stars) + '<span>' + '★★★'.slice(0, 3 - stars) + '</span></div>' +
        '<p class="g-score">' + ok + ' de ' + qs.length + ' certas · ' + pts + ' pontos</p><p>' + msg + ' Melhor sequência: ' + best + '.</p>' +
        '<button type="button" class="btn-next">Jogar de novo ↻</button></div>');
      try { var k = 'sm_sax_rec_' + (opts.id || 'q'); var rec = +localStorage.getItem(k) || 0; if (pts > rec) { localStorage.setItem(k, pts); e.insertBefore(h('<p class="g-rec">🏆 Novo recorde: ' + pts + ' pts!</p>'), e.lastChild); } else e.insertBefore(h('<p class="g-rec">Seu recorde: ' + rec + ' pts</p>'), e.lastChild); } catch (x) { }
      e.querySelector('button').addEventListener('click', function () { qs = opts.shuffle === false ? qs : shuffle(qs); i = 0; pts = 0; ok = 0; streak = 0; best = 0; show(); });
      body.appendChild(e);
    }
    show();
  }

  /* ---------- Aula 1: explorar as partes + jogo "Encontre a peça" ---------- */
  function partsGame(host) {
    var info = h('<div class="part-info"><b>Toque numa parte do sax</b><span>Ou toque num nome abaixo.</span></div>');
    var wrap = document.createElement('div'); wrap.className = 'sax-wrap';
    host.appendChild(wrap);
    var S = drawSax(wrap, { id: 'p' });
    host.appendChild(info);
    var chips = document.createElement('div'); chips.className = 'part-chips';
    PART_ORDER.forEach(function (p) { var b = document.createElement('button'); b.type = 'button'; b.className = 'toggle'; b.textContent = PARTS[p].nome; b.setAttribute('data-p', p); chips.appendChild(b); });
    host.appendChild(chips);
    var gbar = h('<div class="game"><div class="game-bar"><span class="g-q">Jogo: encontre a peça</span><span class="g-pts">⭐ 0 pts</span><span class="g-st">🔥 0</span></div><div class="g-body"><p class="g-text">Vou dizer o nome de uma peça e você toca nela no desenho. São 8 rodadas, 10 pontos por acerto.</p><button type="button" class="btn-next" data-start>Começar o jogo ▶</button></div></div>');
    host.appendChild(gbar);
    var game = null;
    function explain(p) {
      S.highlight(p);
      info.innerHTML = '<b>' + PARTS[p].nome + '</b><span>' + PARTS[p].txt + '</span>';
      Array.prototype.forEach.call(chips.children, function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-p') === p ? 'true' : 'false'); });
    }
    chips.addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (b && !game) explain(b.getAttribute('data-p')); });
    function bar() {
      gbar.querySelector('.g-q').textContent = game ? 'Rodada ' + Math.min(game.i + 1, game.list.length) + '/' + game.list.length : 'Jogo: encontre a peça';
      gbar.querySelector('.g-pts').textContent = '⭐ ' + (game ? game.pts : 0) + ' pts';
      gbar.querySelector('.g-st').textContent = '🔥 ' + (game ? game.streak : 0);
    }
    var body = gbar.querySelector('.g-body');
    function ask() {
      bar();
      if (game.i >= game.list.length) {
        var g = game; game = null; chips.classList.remove('off');
        body.innerHTML = '<p class="g-score">Fim! ' + g.ok + ' de ' + g.list.length + ' certas · ' + g.pts + ' pontos</p><p>' + (g.ok === g.list.length ? 'Perfeito! Você conhece todas as peças do sax. 🎷' : 'Toque nos nomes acima para revisar e jogue de novo.') + '</p><button type="button" class="btn-next" data-start>Jogar de novo ↻</button>';
        bar(); return;
      }
      body.innerHTML = '<p class="g-text">Toque na peça: <b class="g-target">' + PARTS[game.list[game.i]].nome + '</b></p><p class="g-fb" aria-live="polite"></p>';
      S.highlight(null);
    }
    body.addEventListener('click', function (e) {
      if (e.target.closest('[data-start]')) {
        game = { list: shuffle(PART_ORDER), i: 0, pts: 0, ok: 0, streak: 0, wait: false }; chips.classList.add('off');
        info.innerHTML = '<b>Jogo em andamento</b><span>Toque direto no desenho do sax.</span>'; ask();
        wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    S.svg.addEventListener('click', function (e) {
      var g = e.target.closest('[data-part]'); if (!g) return;
      var p = g.getAttribute('data-part');
      if (!game) { explain(p); return; }
      if (game.wait) return;
      var target = game.list[game.i], fb = body.querySelector('.g-fb');
      game.wait = true;
      if (p === target) { game.ok++; game.streak++; var bonus = game.streak >= 3 ? 5 : 0; game.pts += 10 + bonus; S.highlight(p, 'right'); fb.className = 'g-fb ok'; fb.textContent = '✔ Isso! ' + PARTS[p].nome + ' +' + (10 + bonus); }
      else { game.streak = 0; S.highlight(p, 'wrong'); fb.className = 'g-fb no'; fb.textContent = '✘ Essa é a ' + PARTS[p].nome.toLowerCase() + '. A ' + PARTS[target].nome.toLowerCase() + ' está brilhando.'; setTimeout(function () { S.highlight(target, 'on'); }, 350); }
      bar();
      setTimeout(function () { S.highlight(null, 'right'); S.highlight(null, 'wrong'); game.wait = false; game.i++; ask(); }, 1500);
    });
  }

  /* ---------- dedilhados: botões de notas + sax com chaves ---------- */
  function fingerExplorer(host, list) {
    var lay = h('<div class="fx"><div class="fx-sax"></div><div class="fx-side"><div class="fx-name"><b>Escolha uma nota</b><span></span></div><div class="fx-staff"></div><div class="fx-chart"></div></div></div>');
    host.appendChild(lay);
    var S = drawSax(lay.querySelector('.fx-sax'), { id: 'f' + Math.random().toString(36).slice(2, 6) });
    var row = document.createElement('div'); row.className = 'note-btns'; host.appendChild(row);
    list.forEach(function (n) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'nbtn'; b.setAttribute('data-n', n);
      b.innerHTML = '<b>' + NOTES[n].nome + '</b><small>' + (n === 'c5' ? 'médio' : NOTES[n].keys[0] === '8va' ? 'agudo' : (n === 'd4' || n === 'e4' || n === 'f4') ? 'grave' : '&nbsp;') + '</small>';
      row.appendChild(b);
    });
    function show(n) {
      S.press(NOTES[n].keys);
      Array.prototype.forEach.call(row.children, function (c) { c.classList.toggle('on', c.getAttribute('data-n') === n); });
      lay.querySelector('.fx-name').innerHTML = '<b>' + NOTES[n].grave + '</b><span>' + NOTES[n].keys.map(function (k) { return KEYNAME[k]; }).join(' + ') + '</span>';
      var st = lay.querySelector('.fx-staff'); st.innerHTML = ''; score(st, { notes: [{ k: n, d: 'w' }], time: false, labels: false, controls: false, perLine: 1, width: 120 });
      var ch = lay.querySelector('.fx-chart'); ch.innerHTML = ''; ch.appendChild(fingerChart(n, true));
    }
    row.addEventListener('click', function (e) { var b = e.target.closest('[data-n]'); if (!b) return; var n = b.getAttribute('data-n'); show(n); playNow(n, 1.6); });
    var all = h('<div class="btn-row center"><button type="button" class="play alt">Tocar todas, do grave ao agudo</button></div>');
    host.appendChild(all);
    all.querySelector('button').addEventListener('click', function () {
      stopAll(); if (!ensure()) return;
      loading.then(function () {
        var t0 = ctx.currentTime + 0.05, now = ctx.currentTime;
        list.forEach(function (n, i) { note(n, t0 + i * 0.75, 0.7); at(t0 + i * 0.75 - now, function () { show(n); }); });
      });
    });
    show(list[0]);
  }
  /* jogo: monte o dedilhado tocando nas chaves */
  function fingerGame(host, list, rounds) {
    var box = h('<div class="game"><div class="game-bar"><span class="g-q">Monte o dedilhado</span><span class="g-pts">⭐ 0 pts</span><span class="g-st">🔥 0</span></div>' +
      '<div class="fg"><div class="fg-sax"></div><div class="fg-side"><p class="g-text">Toque nas chaves para apertar os dedos da nota pedida e confira.</p><div class="fg-staff"></div><div class="btn-row"><button type="button" class="btn-next" data-check>Conferir</button><button type="button" class="play alt" data-hear>Ouvir</button></div><p class="g-fb" aria-live="polite"></p></div></div></div>');
    host.appendChild(box);
    var S = drawSax(box.querySelector('.fg-sax'), { id: 'g' });
    S.svg.classList.add('clickable');
    var seq = [], i = 0, pts = 0, ok = 0, streak = 0, pressed = [], checked = false;
    function start() { seq = shuffle(list).concat(shuffle(list)).slice(0, rounds || 8); i = 0; pts = 0; ok = 0; streak = 0; ask(); }
    function bar() {
      box.querySelector('.g-q').textContent = i < seq.length ? 'Rodada ' + (i + 1) + '/' + seq.length : 'Fim de jogo';
      box.querySelector('.g-pts').textContent = '⭐ ' + pts + ' pts'; box.querySelector('.g-st').textContent = '🔥 ' + streak;
    }
    function ask() {
      bar(); pressed = []; checked = false; S.press([]);
      var side = box.querySelector('.fg-side'), fb = box.querySelector('.g-fb');
      fb.textContent = ''; fb.className = 'g-fb';
      if (i >= seq.length) {
        side.querySelector('.g-text').innerHTML = '<b>Resultado: ' + ok + ' de ' + seq.length + ' certas · ' + pts + ' pontos.</b> ' + (ok === seq.length ? 'Seus dedos já sabem o caminho! 🎷' : 'Treine as notas que errou e jogue de novo.');
        box.querySelector('[data-check]').textContent = 'Jogar de novo ↻';
        box.querySelector('.fg-staff').innerHTML = '';
        return;
      }
      box.querySelector('[data-check]').textContent = 'Conferir';
      var n = seq[i];
      side.querySelector('.g-text').innerHTML = 'Monte a nota: <b class="g-target">' + NOTES[n].grave + '</b>';
      var st = box.querySelector('.fg-staff'); st.innerHTML = ''; score(st, { notes: [{ k: n, d: 'w' }], time: false, labels: false, controls: false, perLine: 1, width: 120 });
    }
    S.svg.addEventListener('click', function (e) {
      var k = e.target.closest('[data-key]'); if (!k || checked || i >= seq.length) return;
      var id = k.getAttribute('data-key'), j = pressed.indexOf(id);
      if (j >= 0) pressed.splice(j, 1); else pressed.push(id);
      S.press(pressed);
    });
    box.querySelector('[data-hear]').addEventListener('click', function () { if (i < seq.length) playNow(seq[i], 1.4); });
    box.querySelector('[data-check]').addEventListener('click', function () {
      if (i >= seq.length) { start(); return; }
      if (checked) { i++; ask(); return; }
      var n = seq[i], need = NOTES[n].keys, fb = box.querySelector('.g-fb');
      var right = need.length === pressed.length && need.every(function (k) { return pressed.indexOf(k) >= 0; });
      checked = true;
      if (right) { ok++; streak++; var bonus = streak >= 3 ? 5 : 0; pts += 10 + bonus; fb.className = 'g-fb ok'; fb.textContent = '✔ Certo! +' + (10 + bonus); playNow(n, 1.4); }
      else { streak = 0; fb.className = 'g-fb no'; fb.textContent = '✘ Quase. O certo é: ' + need.map(function (k) { return KEYNAME[k]; }).join(' + ') + '.'; S.press(need); }
      bar();
      this.textContent = i + 1 < seq.length ? 'Próxima ›' : 'Ver resultado ›';
    });
    start();
  }

  /* ---------- treino com metrônomo: sopre / descanse (com ou sem nota) ---------- */
  function trainer(host, opts) {
    var notes = opts.notes || [];
    var html = '<div class="trainer"><div class="tr-big"><span class="tr-word">Pronto?</span><span class="tr-count"></span></div><div class="tr-bar"><i></i></div><div class="tr-opts">';
    if (notes.length) html += '<label>Nota<select data-n>' + notes.map(function (n) { return '<option value="' + n + '">' + NOTES[n].grave + '</option>'; }).join('') + (opts.allowNone ? '<option value="">Só boquilha + tudel (sem nota)</option>' : '') + '</select></label>';
    html += '<label>Soprar<select data-b>' + (opts.blowChoices || [4, 6, 8]).map(function (b) { return '<option value="' + b + '">' + b + ' tempos</option>'; }).join('') + '</select></label>';
    html += '<label>Repetições<select data-r><option>3</option><option selected>4</option><option>6</option></select></label></div>';
    html += '<div class="btn-row center"><button type="button" class="play">Começar (60 bpm)</button></div></div>';
    var box = h(html); host.appendChild(box);
    var btn = box.querySelector('.play'), word = box.querySelector('.tr-word'), cnt = box.querySelector('.tr-count'), barI = box.querySelector('.tr-bar i');
    btn.addEventListener('click', function () {
      if (btn.classList.contains('is-playing')) { stopAll(); return; }
      stopAll(); if (!ensure()) return;
      btn.classList.add('is-playing'); btn.textContent = 'Parar';
      stopHooks.push(function () { btn.classList.remove('is-playing'); btn.textContent = 'Começar (60 bpm)'; word.textContent = 'Pronto?'; cnt.textContent = ''; box.classList.remove('blow', 'rest'); barI.style.width = '0'; });
      loading.then(function () {
        if (!btn.classList.contains('is-playing')) return;
        var nSel = box.querySelector('[data-n]'), n = nSel ? nSel.value : '';
        var B = +box.querySelector('[data-b]').value, R = opts.rest || 4, reps = +box.querySelector('[data-r]').value;
        var t0 = ctx.currentTime + 0.1, now = ctx.currentTime, beat = 0, totalBeats = 4 + reps * (B + R);
        function phase(b, w, c, cls) { at(t0 + b - now, function () { word.textContent = w; cnt.textContent = c; box.classList.remove('blow', 'rest'); if (cls) box.classList.add(cls); barI.style.width = Math.round(b / totalBeats * 100) + '%'; }); }
        for (var k = 0; k < 4; k++) { click(t0 + k, k === 0); phase(k, 'Prepare', String(4 - k), ''); }
        beat = 4;
        for (var r = 0; r < reps; r++) {
          if (n) note(n, t0 + beat, B - 0.15, 0.95);
          for (var b = 0; b < B; b++) { click(t0 + beat + b, b === 0); phase(beat + b, opts.blowWord || 'Sopre', (b + 1) + ' de ' + B, 'blow'); }
          beat += B;
          for (var q = 0; q < R; q++) { click(t0 + beat + q, false); phase(beat + q, q === R - 1 ? 'Inspire!' : 'Descanse', (q + 1) + ' de ' + R, 'rest'); }
          beat += R;
        }
        at(t0 + beat - now, function () { stopAll(); word.textContent = 'Muito bem! 👏'; barI.style.width = '100%'; });
      });
    });
  }

  /* ---------- Aula 3: guia de respiração animado ---------- */
  function breath(host) {
    var P = { '448': [4, 4, 8], '4412': [4, 4, 12], '4016': [4, 0, 16] };
    var box = h('<div class="breath"><div class="br-ball"><span class="br-word">Toque em começar</span><span class="br-n"></span></div>' +
      '<div class="tr-opts"><label>Padrão<select><option value="448">4 · 4 · 8 (inspira · segura · solta)</option><option value="4412">4 · 4 · 12</option><option value="4016">4 · 0 · 16 (sem segurar)</option></select></label></div>' +
      '<div class="btn-row center"><button type="button" class="play">Começar 3 ciclos</button></div></div>');
    host.appendChild(box);
    var btn = box.querySelector('.play'), ball = box.querySelector('.br-ball'), w = box.querySelector('.br-word'), nn = box.querySelector('.br-n');
    btn.addEventListener('click', function () {
      if (btn.classList.contains('is-playing')) { stopAll(); return; }
      stopAll(); ensure();
      btn.classList.add('is-playing'); btn.textContent = 'Parar';
      stopHooks.push(function () { btn.classList.remove('is-playing'); btn.textContent = 'Começar 3 ciclos'; ball.className = 'br-ball'; ball.style.transitionDuration = '.4s'; w.textContent = 'Toque em começar'; nn.textContent = ''; });
      var p = P[box.querySelector('select').value], t = 0;
      for (var c = 0; c < 3; c++) {
        [['in', 'Inspire (barriga enche)', p[0]], ['hold', 'Segure, sem travar a garganta', p[1]], ['out', 'Solte em “sssss”, com apoio', p[2]]].forEach(function (ph) {
          if (!ph[2]) return;
          (function (start, cls, txt, len) {
            at(start, function () { ball.style.transitionDuration = len + 's'; ball.className = 'br-ball ' + cls; w.textContent = txt; });
            for (var s = 0; s < len; s++) (function (s) { at(start + s, function () { nn.textContent = (s + 1) + ' / ' + len; if (ctx) click(ctx.currentTime + 0.01, s === 0); }); })(s);
          })(t, ph[0], ph[1], ph[2]);
          t += ph[2];
        });
      }
      at(t, function () { stopAll(); w.textContent = 'Ótimo! Descanse um pouco.'; });
    });
  }

  /* ---------- progresso (localStorage, separado do curso de teclado) ---------- */
  var K = 'sm_sax_b1_aula';
  function feita(n) { try { return localStorage.getItem(K + n) === '1'; } catch (e) { return false; } }
  function marcar(n, v) { try { if (v) localStorage.setItem(K + n, '1'); else localStorage.removeItem(K + n); } catch (e) { } }
  function progress() {
    var b = document.querySelector('[data-concluir]');
    if (b) {
      var n = +b.getAttribute('data-concluir'), hint = document.querySelector('[data-concluir-hint]');
      var paint = function () { var f = feita(n); b.classList.toggle('feita', f); b.setAttribute('aria-pressed', f ? 'true' : 'false'); b.textContent = f ? '✓ Aula concluída' : 'Marcar como concluída'; if (hint) hint.textContent = f ? 'Toque de novo se quiser desmarcar.' : 'Fez os exercícios? Marque a aula como concluída.'; };
      b.addEventListener('click', function () { marcar(n, !feita(n)); paint(); }); paint();
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-aula]'), function (a) {
      var s = a.querySelector('.prog'); if (!s) return; var f = feita(+a.getAttribute('data-aula'));
      s.className = 'prog ' + (f ? 'done' : 'todo'); s.textContent = f ? '✓ Concluída' : '● Pendente';
    });
  }
  /* botões simples: <button data-note="b4" data-dur="1.5"> */
  function bindNoteButtons() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-note]'); if (!b) return;
      playNow(b.getAttribute('data-note'), +(b.getAttribute('data-dur') || 1.5));
    });
  }
  /* desenha os quadros de dedilhado em <span data-fchart="b4"> */
  function fillCharts() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-fchart]'), function (s) { s.appendChild(fingerChart(s.getAttribute('data-fchart'))); });
  }
  function init() { progress(); bindNoteButtons(); fillCharts(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.SAX = { loaded: function () { return Object.keys(buffers).length; }, NOTES: NOTES, drawSax: drawSax, fingerChart: fingerChart, score: score, quiz: quiz, partsGame: partsGame, fingerExplorer: fingerExplorer, fingerGame: fingerGame, trainer: trainer, breath: breath, playNow: playNow, seq: seq, stopAll: stopAll, ensure: ensure, note: note, at: at };
})();
