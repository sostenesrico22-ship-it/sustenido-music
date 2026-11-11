/* Sustenido Music Kids — Aula 1 (mesmos sons da Aula 1 do curso: aula-01-musica.js) */
(function () {
  'use strict';
  var L = window.SustenidoLesson, N = window.NidoKids, B = 0.5;
  var cells = Array.prototype.slice.call(document.querySelectorAll('#somsil span'));
  function lightSeg(k) { cells.forEach(function (c, j) { c.classList.toggle('on', j === k); }); }
  function lighter(id) {
    var els = Array.prototype.slice.call(document.querySelectorAll('#' + id + ' span'));
    return function (k) { els.forEach(function (c, j) { c.classList.toggle('on', j === k); }); };
  }
  var okL = lighter('org-ok'), noL = lighter('org-no'), onda = document.getElementById('onda');
  var SEQ = {
    arrumado: { seq: [60, 62, 64, 65].map(function (m, i) { return { t: i * 0.5, midi: m, dur: 0.48, i: i }; }),
      step: function (n) { okL(n.i); }, end: function () { okL(-1); } },
    baguncado: { seq: [{ t: 0, midi: 79, dur: 0.2, i: 0 }, { t: 0.25, midi: 50, dur: 0.6, i: 1 }, { t: 0.5, midi: 73, dur: 0.15, i: 2 }, { t: 1.4, midi: 56, dur: 0.3, i: 3 }],
      step: function (n) { noL(n.i); }, end: function () { noL(-1); } },
    onda: { seq: [{ t: 0, midi: 67, dur: 2.2 }], step: function () { onda.classList.add('on'); }, end: function () { onda.classList.remove('on'); } },
    somSilencio: {
      seq: [{ t: 0, midi: 60, dur: 0.7, seg: 0 }, { t: 0.7, midi: null, dur: 0.4, seg: 1 }, { t: 1.1, midi: 64, dur: 0.7, seg: 2 },
        { t: 1.8, midi: null, dur: 0.4, seg: 3 }, { t: 2.2, midi: 67, dur: 1.0, seg: 4 }],
      step: function (n) { lightSeg(n.seg); }, end: function () { lightSeg(-1); }
    },
    melodia: { seq: [60, 62, 64, 65].map(function (m, i) { return { t: i * B, midi: m, dur: B * 0.95 }; }).concat([{ t: 4 * B, midi: 67, dur: B * 2 }]) },
    harmonia: { seq: [[60, 64, 67], [60, 65, 69], [59, 62, 67], [60, 64, 67]].map(function (c, i) { return { t: i * B * 2, midi: c, dur: B * 1.9, vel: 0.6 }; }) },
    ritmo: { seq: [{ t: 0, midi: 67, dur: B * 0.9 }, { t: B, midi: 67, dur: B * 0.45 }, { t: B * 1.5, midi: 67, dur: B * 0.45 }, { t: B * 2, midi: 67, dur: B * 0.9 }, { t: B * 3, midi: null, dur: B }] },
    grave: { seq: [{ t: 0, midi: 36, dur: 1.2 }] },
    agudo: { seq: [{ t: 0, midi: 84, dur: 1.2 }] },
    curto: { seq: [{ t: 0, midi: 67, dur: 0.15 }] },
    longo: { seq: [{ t: 0, midi: 67, dur: 2.2 }] },
    fraco: { seq: [{ t: 0, midi: 67, dur: 1.2, vel: 0.15 }] },
    forte: { seq: [{ t: 0, midi: 67, dur: 1.2, vel: 1 }] },
    piano: { seq: [{ t: 0, midi: 69, dur: 1.4 }] },
    flauta: { seq: [{ t: 0, midi: 69, dur: 1.4, kind: 'flute' }] }
  };
  L.bindButtons(SEQ);
  function p(name) { return function () { if (N) N.stop(); L.play(SEQ[name].seq); }; }
  function opt(e, label, name, ok) { return { e: e, label: label, play: p(name), ok: !!ok }; }
  var rounds = [
    { say: 'Toque o som agudo! O fininho!', show: 'Toque o som AGUDO 🐤', options: [opt('🐻', 'Grave', 'grave'), opt('🐤', 'Agudo', 'agudo', true)] },
    { say: 'Agora toque o som forte!', show: 'Toque o som FORTE 🦁', options: [opt('🦁', 'Forte', 'forte', true), opt('🐭', 'Fraco', 'fraco')] },
    { say: 'Toque o som longo! O compridão!', show: 'Toque o som LONGO 🐍', options: [opt('🐇', 'Curto', 'curto'), opt('🐍', 'Longo', 'longo', true)] },
    { say: 'Qual é a flauta? Toque na flauta!', show: 'Toque a FLAUTA 🪈', options: [opt('🎹', 'Piano', 'piano'), opt('🪈', 'Flauta', 'flauta', true)] },
    { say: 'Agora o som grave! O grossão!', show: 'Toque o som GRAVE 🐻', options: [opt('🐤', 'Agudo', 'agudo'), opt('🐻', 'Grave', 'grave', true)] }
  ];
  if (N) N.StarGame(document.getElementById('jogo'), rounds);
})();
