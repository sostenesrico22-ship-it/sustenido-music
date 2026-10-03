/* Sustenido Music — teclado SVG (vista de cima), diagramas de mão e sintetizador de piano (Web Audio).
   Sem dependências; reutilizável nas próximas aulas. */
(function (global) {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var SOLFEGE = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'];
  var LETTERS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  var IS_BLACK = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
  // deslocamento visual das teclas pretas (como num piano real)
  var BLACK_OFFSET = { 1: -3, 3: 3, 6: -4, 8: 0, 10: 4 };

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function noteName(midi) { return SOLFEGE[midi % 12]; }
  function noteLetter(midi) { return LETTERS[midi % 12] + (Math.floor(midi / 12) - 1); }

  /* ---------------- Teclado ---------------- */
  function Keyboard(container, opts) {
    opts = opts || {};
    this.low = opts.low || 48;   // C3
    this.high = opts.high || 72; // C5
    this.onKey = opts.onKey || null;
    this.blackLabels = !!opts.blackLabels; // nomes nas teclas pretas (Dó♯/Ré♭), opcional
    this.keys = {};
    this.markers = {};
    this._build(container);
  }
  Keyboard.prototype._build = function (container) {
    var WW = 40, WH = 190, BW = 24, BH = 118, TOP = 16;
    var whites = [];
    for (var m = this.low; m <= this.high; m++) if (!IS_BLACK[m % 12]) whites.push(m);
    var W = whites.length * WW, H = TOP + WH + 4;
    this.geom = { WW: WW, WH: WH, BW: BW, BH: BH, TOP: TOP };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Teclado de piano visto de cima, de Dó3 a Dó5' });
    var defs = el('defs', {}, svg);
    var gw = el('linearGradient', { id: 'kbWhite', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': '#E9EBF0' }, gw);
    el('stop', { offset: '0.12', 'stop-color': '#FFFFFF' }, gw);
    el('stop', { offset: '1', 'stop-color': '#F7F7F9' }, gw);
    var gb = el('linearGradient', { id: 'kbBlack', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': '#3A3F4D' }, gb);
    el('stop', { offset: '1', 'stop-color': '#14171F' }, gb);
    // tampa / feltro do teclado (vista de cima)
    el('rect', { x: 0, y: 0, width: W, height: TOP + 2, fill: '#1F2A44' }, svg);
    el('rect', { x: 0, y: TOP - 3, width: W, height: 3, fill: '#8E1B2B' }, svg); // feltro
    var gW = el('g', {}, svg), gB = el('g', {}, svg);
    this.markerLayer = el('g', { 'pointer-events': 'none' }, svg);
    var self = this, xOf = {};
    whites.forEach(function (midi, i) {
      var x = i * WW;
      xOf[midi] = x + WW / 2;
      var g = el('g', { class: 'key white', 'data-midi': midi }, gW);
      var r = el('rect', { x: x + 0.75, y: TOP, width: WW - 1.5, height: WH, rx: 4, fill: 'url(#kbWhite)', stroke: '#9AA0AE', 'stroke-width': 1.2 }, g);
      var pc = midi % 12;
      var lab = el('text', { class: 'kb-label', x: x + WW / 2, y: TOP + WH - 12, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#5C6680', 'font-family': 'system-ui, sans-serif' }, g);
      lab.textContent = SOLFEGE[pc];
      if (pc === 0) {
        var oc = el('text', { class: 'kb-label', x: x + WW / 2, y: TOP + WH - 30, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: midi === 60 ? '#9E7E14' : '#9AA0AE', 'font-family': 'system-ui, sans-serif' }, g);
        oc.textContent = noteLetter(midi);
      }
      self.keys[midi] = { g: g, rect: r, black: false, cx: x + WW / 2, cy: TOP + WH - 70 };
    });
    for (var midi = this.low; midi <= this.high; midi++) {
      var pc = midi % 12;
      if (!IS_BLACK[pc]) continue;
      var cx = xOf[midi - 1] + WW / 2 + BLACK_OFFSET[pc];
      var g = el('g', { class: 'key black', 'data-midi': midi }, gB);
      var r = el('rect', { x: cx - BW / 2, y: TOP - 1, width: BW, height: BH, rx: 3, fill: 'url(#kbBlack)', stroke: '#0B0D12', 'stroke-width': 1 }, g);
      // superfície superior (bisel) para dar volume na vista de cima
      el('rect', { x: cx - BW / 2 + 3, y: TOP + 2, width: BW - 6, height: BH - 14, rx: 2, fill: '#FFFFFF', 'fill-opacity': 0.08 }, g);
      if (self.blackLabels) {
        var bl = el('text', { class: 'kb-label', x: 0, y: 0, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#FFFFFF', 'font-family': 'system-ui, sans-serif',
          transform: 'translate(' + cx + ',' + (TOP + BH / 2 - 4) + ') rotate(-90)' }, g);
        bl.textContent = SOLFEGE[pc] + ' / ' + SOLFEGE[pc + 1] + '♭';
      }
      self.keys[midi] = { g: g, rect: r, black: true, cx: cx, cy: TOP + BH - 26 };
    }
    svg.addEventListener('pointerdown', function (e) {
      var k = e.target.closest ? e.target.closest('.key') : null;
      if (!k || !self.onKey) return;
      e.preventDefault();
      self.onKey(parseInt(k.getAttribute('data-midi'), 10));
    });
    container.innerHTML = '';
    container.appendChild(svg);
    this.svg = svg;
  };
  var PRESS = { rh: { white: '#F1D97E', black: '#C9A227' }, lh: { white: '#8FD3CA', black: '#2A9D8F' }, any: { white: '#C9D1E6', black: '#3A4B74' } };
  // hand: 'rh' | 'lh' | 'any' ou um objeto de cores { white: '#...', black: '#...' }
  Keyboard.prototype.press = function (midi, hand) {
    var k = this.keys[midi]; if (!k) return;
    var c = (hand && typeof hand === 'object') ? hand : (PRESS[hand] || PRESS.any);
    k.rect.setAttribute('fill', k.black ? c.black : c.white);
    k.pressed = hand;
  };
  Keyboard.prototype.release = function (midi) {
    var k = this.keys[midi]; if (!k) return;
    k.rect.setAttribute('fill', k.black ? 'url(#kbBlack)' : 'url(#kbWhite)');
    k.pressed = null;
  };
  Keyboard.prototype.releaseAll = function () { for (var m in this.keys) this.release(+m); };
  /* marcador de dedo: círculo colorido com o número do dedo e rótulo MD/ME */
  Keyboard.prototype.setMarker = function (hand, midi, finger, faint) {
    var old = this.markers[hand];
    if (old) { old.parentNode.removeChild(old); this.markers[hand] = null; }
    if (midi == null) return;
    var k = this.keys[midi]; if (!k) return;
    var col = hand === 'rh' ? '#C9A227' : '#2A9D8F';
    var txt = hand === 'rh' ? '#1F2A44' : '#FFFFFF';
    var g = el('g', { class: 'marker marker-' + hand, opacity: faint ? 0.55 : 1, transform: 'translate(' + k.cx + ',' + k.cy + ')' }, this.markerLayer);
    el('path', { d: 'M-18,-8 a18,18 0 0 1 36,0 v12 a18,18 0 0 1 -36,0 z', fill: col, stroke: '#FFFFFF', 'stroke-width': 2.5 }, g);
    var t = el('text', { x: 0, y: 4, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': 24, 'font-weight': 800, fill: txt, 'font-family': 'system-ui, sans-serif' }, g);
    t.textContent = finger;
    var tag = el('text', { x: 0, y: -33, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800, fill: hand === 'rh' ? '#9E7E14' : '#1E7369', 'font-family': 'system-ui, sans-serif' }, g);
    tag.textContent = hand === 'rh' ? 'MD' : 'ME';
    tag.setAttribute('paint-order', 'stroke'); tag.setAttribute('stroke-width', 3.5); tag.setAttribute('stroke-linejoin', 'round');
    tag.setAttribute('stroke', k.black ? '#14171F' : '#FFFFFF');
    if (k.black) tag.setAttribute('fill', '#FFFFFF');
    this.markers[hand] = g;
  };

  Keyboard.prototype.setLabels = function (on) {
    Array.prototype.forEach.call(this.svg.querySelectorAll('.kb-label'), function (t) { t.setAttribute('visibility', on ? 'visible' : 'hidden'); });
  };
  /* selo genérico sobre uma tecla (ex.: "Dó central", ✓ no desafio) */
  Keyboard.prototype.setBadge = function (id, midi, text, opts) {
    opts = opts || {};
    var old = this.markers['b-' + id];
    if (old) { old.parentNode.removeChild(old); this.markers['b-' + id] = null; }
    if (midi == null) return;
    var k = this.keys[midi]; if (!k) return;
    var g = el('g', { class: 'badge-' + id, transform: 'translate(' + k.cx + ',' + k.cy + ')' }, this.markerLayer);
    el('circle', { r: 16, fill: opts.color || '#1F2A44', stroke: '#FFFFFF', 'stroke-width': 2.5 }, g);
    var t = el('text', { x: 0, y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': opts.size || 18, 'font-weight': 800, fill: opts.textColor || '#FFFFFF', 'font-family': 'system-ui, sans-serif' }, g);
    t.textContent = text;
    if (opts.tag) {
      var tag = el('text', { x: 0, y: -26, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 800, fill: opts.tagColor || '#1F2A44', 'font-family': 'system-ui, sans-serif',
        'paint-order': 'stroke', stroke: '#FFFFFF', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, g);
      tag.textContent = opts.tag;
    }
    this.markers['b-' + id] = g;
  };
  Keyboard.prototype.clearBadges = function () {
    for (var key in this.markers) if (key.indexOf('b-') === 0 && this.markers[key]) { this.markers[key].parentNode.removeChild(this.markers[key]); this.markers[key] = null; }
  };

  /* ---------------- Diagrama de mão (estilizado, vista de cima, palma para baixo) ---------------- */
  function HandDiagram(container, hand) {
    this.hand = hand;
    var mirror = hand === 'lh';
    var col = hand === 'rh' ? '#C9A227' : '#2A9D8F';
    var dark = hand === 'rh' ? '#9E7E14' : '#1E7369';
    this.col = col; this.dark = dark;
    var svg = el('svg', { viewBox: '0 0 100 112', role: 'img', 'aria-label': hand === 'rh' ? 'Mão direita' : 'Mão esquerda' });
    // dedos da mão direita (polegar à esquerda); a esquerda é espelhada
    var F = [
      { n: 1, x: 15, y: 52, w: 14, h: 40, rot: -20, px: 22, py: 92 },
      { n: 2, x: 28, y: 20, w: 13, h: 46 },
      { n: 3, x: 43, y: 11, w: 13, h: 55 },
      { n: 4, x: 58, y: 16, w: 13, h: 50 },
      { n: 5, x: 72, y: 31, w: 11, h: 37 }
    ];
    this.fingers = {};
    var self = this, labels = [];
    F.forEach(function (f) {
      var x = mirror ? 100 - f.x - f.w : f.x;
      var g = el('g', {}, svg);
      if (f.rot) {
        var px = mirror ? 100 - f.px : f.px;
        g.setAttribute('transform', 'rotate(' + (mirror ? -f.rot : f.rot) + ' ' + px + ' ' + f.py + ')');
      }
      var r = el('rect', { class: 'finger', x: x, y: f.y, width: f.w, height: f.h, rx: f.w / 2, fill: '#EEF0F5', stroke: '#B8BFCE', 'stroke-width': 1.5 }, g);
      labels.push({ f: f, x: x, g: g, r: r });
    });
    // palma por cima da base dos dedos
    el('rect', { x: mirror ? 100 - 26 - 58 : 26, y: 56, width: 58, height: 50, rx: 16, fill: '#EEF0F5', stroke: '#B8BFCE', 'stroke-width': 1.5 }, svg);
    labels.forEach(function (o) {
      // número sempre na vertical: calcula a ponta do dedo já girada
      var cx = o.x + o.f.w / 2, cy = o.f.y + 8;
      if (o.f.rot) {
        var a = (mirror ? -o.f.rot : o.f.rot) * Math.PI / 180, px = mirror ? 100 - o.f.px : o.f.px, dx = cx - px, dy = cy - o.f.py;
        cx = px + dx * Math.cos(a) - dy * Math.sin(a); cy = o.f.py + dx * Math.sin(a) + dy * Math.cos(a);
      }
      var c = el('circle', { cx: cx, cy: cy, r: 7.5, fill: '#FFFFFF', stroke: '#B8BFCE', 'stroke-width': 1 }, svg);
      var t = el('text', { x: cx, y: cy + 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': 11, 'font-weight': 800, fill: '#5C6680', 'font-family': 'system-ui, sans-serif' }, svg);
      t.textContent = o.f.n;
      self.fingers[o.f.n] = { r: o.r, c: c, t: t };
    });
    container.innerHTML = '';
    container.appendChild(svg);
    var lab = document.createElement('div');
    lab.className = 'hand-label';
    lab.textContent = hand === 'rh' ? 'Mão direita' : 'Mão esquerda';
    container.appendChild(lab);
    this.container = container;
  }
  HandDiagram.prototype.set = function (finger) {
    for (var n in this.fingers) {
      var f = this.fingers[n], on = +n === finger;
      f.r.setAttribute('fill', on ? this.col : '#EEF0F5');
      f.r.setAttribute('stroke', on ? this.dark : '#B8BFCE');
      f.c.setAttribute('fill', on ? this.dark : '#FFFFFF');
      f.c.setAttribute('stroke', on ? this.dark : '#B8BFCE');
      f.t.setAttribute('fill', on ? '#FFFFFF' : '#5C6680');
    }
  };
  HandDiagram.prototype.setEnabled = function (on) { this.container.classList.toggle('off', !on); };

  /* ---------------- Sintetizador "tipo piano" (síntese aditiva) ---------------- */
  // ctx opcional: permite renderizar offline (OfflineAudioContext) com o mesmo timbre
  function PianoSynth(ctx) { this.ctx = ctx || null; this.voices = []; }
  PianoSynth.prototype.ensure = function () {
    if (!this.master) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!this.ctx && !AC) return null;
      var ctx = this.ctx = this.ctx || new AC();
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      this.master = ctx.createGain(); this.master.gain.value = 0.55;
      this.master.connect(comp); comp.connect(ctx.destination);
      // reverberação curta gerada (sem arquivos externos)
      try {
        var len = Math.floor(ctx.sampleRate * 1.4), ir = ctx.createBuffer(2, len, ctx.sampleRate);
        for (var ch = 0; ch < 2; ch++) {
          var d = ir.getChannelData(ch);
          for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
        }
        var conv = ctx.createConvolver(); conv.buffer = ir;
        var wet = ctx.createGain(); wet.gain.value = 0.12;
        this.master.connect(conv); conv.connect(wet); wet.connect(comp);
      } catch (e) { /* sem reverb */ }
    }
    if (this.ctx.state === 'suspended' && !(global.OfflineAudioContext && this.ctx instanceof global.OfflineAudioContext)) { var p = this.ctx.resume(); if (p && p.catch) p.catch(function () {}); }
    return this.ctx;
  };
  PianoSynth.prototype.note = function (midi, t, dur, vel) {
    var ctx = this.ctx; if (!ctx) return;
    vel = vel == null ? 0.8 : vel;
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    var out = ctx.createGain();
    out.gain.setValueAtTime(vel * 0.3, t);
    out.gain.setTargetAtTime(0, t + dur, 0.09);
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 0.4;
    lp.frequency.setValueAtTime(Math.min(f * 9, 14000), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(f * 2.5, 700), t + 1.5);
    lp.connect(out); out.connect(this.master);
    var amps = [1, 0.5, 0.3, 0.18, 0.1, 0.06, 0.035];
    var longTC = 1.3 * Math.pow(2, -(midi - 60) / 24); // graves soam mais
    var stopAt = t + dur + 0.7, oscs = [];
    for (var n = 1; n <= amps.length; n++) {
      var fn = f * n * Math.sqrt(1 + 0.0004 * n * n); // leve inarmonicidade das cordas
      if (fn > 16000) break;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = fn;
      var a = amps[n - 1];
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(a, t + 0.004);
      g.gain.setTargetAtTime(a * 0.35, t + 0.004, 0.07);
      g.gain.setTargetAtTime(0.0001, t + 0.12, longTC / Math.sqrt(n));
      o.connect(g); g.connect(lp);
      o.start(t); o.stop(stopAt);
      oscs.push(o);
    }
    // "martelo": ruído curtíssimo
    var nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate), nd = nb.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
    var ns = ctx.createBufferSource(); ns.buffer = nb;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(f * 4, 6000); bp.Q.value = 1.2;
    var ng = ctx.createGain(); ng.gain.value = 0.12;
    ns.connect(bp); bp.connect(ng); ng.connect(out); ns.start(t);
    var v = { out: out, oscs: oscs, end: stopAt };
    this.voices.push(v);
    var now = ctx.currentTime;
    this.voices = this.voices.filter(function (x) { return x.end > now; });
  };
  /* timbre alternativo (tipo flauta) — usado para explicar "timbre" */
  PianoSynth.prototype.flute = function (midi, t, dur, vel) {
    var ctx = this.ctx; if (!ctx) return;
    vel = vel == null ? 0.8 : vel;
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    var out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(vel * 0.22, t + 0.08);
    out.gain.setValueAtTime(vel * 0.22, t + dur);
    out.gain.linearRampToValueAtTime(0, t + dur + 0.12);
    out.connect(this.master);
    var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
    var g2 = ctx.createGain(); g2.gain.value = 0.12;
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 5; lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency);
    o.connect(out); o2.connect(g2); g2.connect(out);
    var end = t + dur + 0.2;
    [o, o2, lfo].forEach(function (x) { x.start(t); x.stop(end); });
    this.voices.push({ out: out, oscs: [o, o2, lfo], end: end });
  };
  PianoSynth.prototype.stopAll = function () {
    if (!this.ctx) return;
    var now = this.ctx.currentTime;
    this.voices.forEach(function (v) {
      try {
        v.out.gain.cancelScheduledValues(now);
        v.out.gain.setValueAtTime(v.out.gain.value, now);
        v.out.gain.setTargetAtTime(0, now, 0.03);
        v.oscs.forEach(function (o) { try { o.stop(now + 0.25); } catch (e) {} });
      } catch (e) {}
    });
    this.voices = [];
  };

  global.SustenidoPiano = { Keyboard: Keyboard, HandDiagram: HandDiagram, PianoSynth: PianoSynth, noteName: noteName, noteLetter: noteLetter, SOLFEGE: SOLFEGE, LETTERS: LETTERS, IS_BLACK: IS_BLACK };
})(window);
