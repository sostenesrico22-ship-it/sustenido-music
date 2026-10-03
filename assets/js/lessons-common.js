/* Sustenido Music — utilidades comuns das aulas: tocar sequências curtas e ligar botões de som. */
(function () {
  'use strict';
  var P = window.SustenidoPiano;
  var synth = new P.PianoSynth();
  var timers = [], current = null;

  function stop() {
    timers.forEach(clearTimeout); timers = [];
    synth.stopAll();
    var c = current; current = null;
    if (c && c.onEnd) c.onEnd();
  }
  /* seq: [{ t: segundos, midi: número ou lista, dur: segundos, vel: 0..1, kind: 'piano'|'flute' }] */
  function play(seq, opts) {
    opts = opts || {};
    stop();
    var ctx = synth.ensure(); if (!ctx) return;
    var LEAD = 0.08, t0 = ctx.currentTime + LEAD, endT = 0;
    seq.forEach(function (n, i) {
      if (n.midi != null) {
        [].concat(n.midi).forEach(function (m) {
          if (n.kind === 'flute') synth.flute(m, t0 + n.t, n.dur, n.vel); else synth.note(m, t0 + n.t, n.dur, n.vel);
        });
      }
      endT = Math.max(endT, n.t + n.dur);
      if (opts.onStep) timers.push(setTimeout(function () { opts.onStep(n, i); }, (n.t + LEAD) * 1000));
    });
    current = { onEnd: opts.onEnd };
    timers.push(setTimeout(function () { var c = current; current = null; timers = []; if (c && c.onEnd) c.onEnd(); }, (endT + LEAD + 0.15) * 1000));
  }
  /* liga botões [data-sound="nome"] a um mapa { nome: { seq: fn|array, step: fn(n,i), end: fn } } */
  function bindButtons(map, root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('[data-sound]'), function (b) {
      b.addEventListener('click', function () {
        var name = b.getAttribute('data-sound'), def = map[name]; if (!def) return;
        if (b.classList.contains('is-playing')) { stop(); return; }
        var seq = typeof def.seq === 'function' ? def.seq() : def.seq;
        play(seq, {
          onStep: def.step,
          onEnd: function () { b.classList.remove('is-playing'); if (def.end) def.end(); }
        });
        b.classList.add('is-playing');
      });
    });
  }
  /* sequência simples: lista de midis com o mesmo intervalo */
  function scale(midis, step, dur, vel) {
    return midis.map(function (m, i) { return { t: i * step, midi: m, dur: dur || step * 0.95, vel: vel == null ? 0.8 : vel }; });
  }
  /* destaca notas VexFlow (StaveNote) pela classe */
  function vfEl(note) {
    var e = note.getSVGElement ? note.getSVGElement() : null;
    return e || document.getElementById('vf-' + note.getAttribute('id'));
  }
  /* desenha uma pauta curta com VexFlow e devolve as notas */
  function miniStaff(host, opts) {
    var VF = Vex.Flow;
    var W = opts.width || 300, H = opts.height || 120;
    host.innerHTML = '';
    var r = new VF.Renderer(host, VF.Renderer.Backends.SVG); r.resize(W, H);
    var ctx = r.getContext();
    var svg = host.querySelector('svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', '100%'); svg.removeAttribute('height');
    svg.style.width = '100%'; svg.style.height = 'auto';
    var st = new VF.Stave(opts.x == null ? 6 : opts.x, opts.y == null ? 6 : opts.y, W - (opts.x == null ? 6 : opts.x) - 6);
    if (opts.clef !== 'none') st.addClef(opts.clef || 'treble');
    if (opts.time) st.addTimeSignature(opts.time);
    if (opts.end) st.setEndBarType(VF.Barline.type.END);
    st.setContext(ctx).draw();
    var notes = opts.notes.map(function (n) {
      if (n.bar) return new VF.BarNote();
      var sn = new VF.StaveNote({ clef: (opts.clef && opts.clef !== 'none') ? opts.clef : 'treble', keys: n.keys, duration: n.d, auto_stem: true });
      if (n.label) sn.addModifier(new VF.Annotation(n.label).setFont('Arial', 13, 'bold').setVerticalJustification(VF.Annotation.VerticalJustify.TOP), 0);
      if (n.below) sn.addModifier(new VF.Annotation(n.below).setFont('Arial', opts.belowSize || 11, 'bold').setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM), 0);
      return sn;
    });
    var beams = opts.beam ? VF.Beam.generateBeams(notes) : [];
    VF.Formatter.FormatAndDraw(ctx, st, notes, { auto_beam: false });
    beams.forEach(function (b) { b.setContext(ctx).draw(); });
    var els = notes.map(function (n) { return n instanceof VF.BarNote ? null : vfEl(n); });
    els.stave = st; els.notes = notes; els.svg = svg; els.ctx = ctx;
    return els;
  }
  function mark(els, i, cls) {
    els.forEach(function (e, j) { if (e) e.classList.toggle(cls || 'hl', j === i); });
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
  window.SustenidoLesson = { synth: synth, play: play, stop: stop, bindButtons: bindButtons, scale: scale, miniStaff: miniStaff, mark: mark };
})();
