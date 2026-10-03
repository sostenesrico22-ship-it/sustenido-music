/* Sustenido Music — Aula 1: O que é música */
(function () {
  'use strict';
  var L = window.SustenidoLesson, NS = 'http://www.w3.org/2000/svg';

  /* desenho som / silêncio */
  var SEGS = [{ som: true, w: 70 }, { som: false, w: 40 }, { som: true, w: 70 }, { som: false, w: 40 }, { som: true, w: 100 }];
  var wave = document.getElementById('wave'), segEls = [], x = 0;
  SEGS.forEach(function (s) {
    var d = '', mid = 30;
    if (s.som) {
      for (var i = 0; i <= s.w; i += 2) {
        var env = Math.sin(Math.PI * i / s.w);
        d += (i ? 'L' : 'M') + (x + i) + ',' + (mid - Math.sin(i / 3.2) * 20 * env).toFixed(1);
      }
    } else d = 'M' + x + ',' + mid + 'L' + (x + s.w) + ',' + mid;
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke-width', s.som ? 2.5 : 3);
    p.setAttribute('stroke', s.som ? '#1F2A44' : '#B8BFCE'); p.setAttribute('stroke-linecap', 'round');
    wave.appendChild(p);
    var t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x + s.w / 2); t.setAttribute('y', 68); t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-size', 11); t.setAttribute('font-weight', 700); t.setAttribute('fill', s.som ? '#1F2A44' : '#5C6680');
    t.setAttribute('font-family', 'system-ui, sans-serif');
    t.textContent = s.som ? 'som' : 'silêncio';
    wave.appendChild(t);
    segEls.push({ p: p, som: s.som });
    x += s.w;
  });
  function lightSeg(k) {
    segEls.forEach(function (s, j) { s.p.setAttribute('stroke', j === k ? '#C9A227' : (s.som ? '#1F2A44' : '#B8BFCE')); });
  }

  /* pautas pequenas (VexFlow, local) */
  var mel = L.miniStaff(document.getElementById('vf-mel'), {
    width: 300, height: 110, y: 10, end: true,
    notes: [{ keys: ['c/4'], d: 'q' }, { keys: ['d/4'], d: 'q' }, { keys: ['e/4'], d: 'q' }, { keys: ['f/4'], d: 'q' }, { keys: ['g/4'], d: 'h' }]
  });
  var har = L.miniStaff(document.getElementById('vf-har'), {
    width: 300, height: 110, y: 10, end: true,
    notes: [{ keys: ['c/4', 'e/4', 'g/4'], d: 'h', label: 'C' }, { keys: ['c/4', 'f/4', 'a/4'], d: 'h', label: 'F' },
      { keys: ['b/3', 'd/4', 'g/4'], d: 'h', label: 'G' }, { keys: ['c/4', 'e/4', 'g/4'], d: 'h', label: 'C' }]
  });
  var rit = L.miniStaff(document.getElementById('vf-rit'), {
    width: 300, height: 110, y: 10, end: true, time: '4/4', beam: true,
    notes: [{ keys: ['g/4'], d: 'q' }, { keys: ['g/4'], d: '8' }, { keys: ['g/4'], d: '8' }, { keys: ['g/4'], d: 'q' }, { keys: ['b/4'], d: 'qr' }]
  });

  var B = 0.5; // tempo (s)
  L.bindButtons({
    somSilencio: {
      seq: [{ t: 0, midi: 60, dur: 0.7, seg: 0 }, { t: 0.7, midi: null, dur: 0.4, seg: 1 }, { t: 1.1, midi: 64, dur: 0.7, seg: 2 },
        { t: 1.8, midi: null, dur: 0.4, seg: 3 }, { t: 2.2, midi: 67, dur: 1.0, seg: 4 }],
      step: function (n) { lightSeg(n.seg); }, end: function () { lightSeg(-1); }
    },
    melodia: {
      seq: [60, 62, 64, 65].map(function (m, i) { return { t: i * B, midi: m, dur: B * 0.95, i: i }; }).concat([{ t: 4 * B, midi: 67, dur: B * 2, i: 4 }]),
      step: function (n) { L.mark(mel, n.i); }, end: function () { L.mark(mel, -1); }
    },
    harmonia: {
      seq: [[60, 64, 67], [60, 65, 69], [59, 62, 67], [60, 64, 67]].map(function (c, i) { return { t: i * B * 2, midi: c, dur: B * 1.9, vel: 0.6, i: i }; }),
      step: function (n) { L.mark(har, n.i); }, end: function () { L.mark(har, -1); }
    },
    ritmo: {
      seq: [{ t: 0, midi: 67, dur: B * 0.9, i: 0 }, { t: B, midi: 67, dur: B * 0.45, i: 1 }, { t: B * 1.5, midi: 67, dur: B * 0.45, i: 2 },
        { t: B * 2, midi: 67, dur: B * 0.9, i: 3 }, { t: B * 3, midi: null, dur: B, i: 4 }],
      step: function (n) { L.mark(rit, n.i); }, end: function () { L.mark(rit, -1); }
    },
    grave: { seq: [{ t: 0, midi: 36, dur: 1.2 }] },
    agudo: { seq: [{ t: 0, midi: 84, dur: 1.2 }] },
    curto: { seq: [{ t: 0, midi: 67, dur: 0.15 }] },
    longo: { seq: [{ t: 0, midi: 67, dur: 2.2 }] },
    fraco: { seq: [{ t: 0, midi: 67, dur: 1.2, vel: 0.15 }] },
    forte: { seq: [{ t: 0, midi: 67, dur: 1.2, vel: 1 }] },
    piano: { seq: [{ t: 0, midi: 69, dur: 1.4 }] },
    flauta: { seq: [{ t: 0, midi: 69, dur: 1.4, kind: 'flute' }] }
  });
})();
