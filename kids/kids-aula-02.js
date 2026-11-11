/* Sustenido Music Kids — Aula 2 (mesmos sons da Aula 2 do curso: aula-02-notas.js) */
(function () {
  'use strict';
  var L = window.SustenidoLesson, P = window.SustenidoPiano, N = window.NidoKids;
  var MIDI = [60, 62, 64, 65, 67, 69, 71];
  var NAMES = ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'], LET = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  var GOLD = { white: '#F1D97E', black: '#C9A227' };
  var nameEl = document.getElementById('kb-name');
  var game = null; // função do jogo quando ativo

  var chips = Array.prototype.slice.call(document.querySelectorAll('#chips .n7'));
  function lightChip(i) { chips.forEach(function (c, j) { c.classList.toggle('on', j === i); }); }

  function showName(midi) {
    var pc = midi % 12, i = [0, 2, 4, 5, 7, 9, 11].indexOf(pc);
    if (i >= 0) nameEl.innerHTML = NAMES[i] + '<small>' + LET[i] + '</small>';
    else nameEl.innerHTML = P.SOLFEGE[pc] + '<small>♯</small>';
  }
  var kb = new P.Keyboard(document.getElementById('kb'), {
    low: 60, high: 72,
    onKey: function (m) {
      if (N) N.stop();
      kb.releaseAll(); kb.press(m, GOLD); showName(m);
      var i = MIDI.indexOf(m); lightChip(i);
      L.play([{ t: 0, midi: m, dur: 0.8 }], { onEnd: function () { kb.release(m); lightChip(-1); } });
      if (game) game(m);
    }
  });
  var kb2 = new P.Keyboard(document.getElementById('kb2'), {
    low: 60, high: 64, blackLabels: false,
    onKey: function (m) { kb2.releaseAll(); kb2.press(m, GOLD); L.play([{ t: 0, midi: m, dur: 0.8 }], { onEnd: function () { kb2.release(m); } }); }
  });

  chips.forEach(function (c, i) {
    c.addEventListener('click', function () {
      if (N) N.stop();
      lightChip(i); kb.releaseAll(); kb.press(MIDI[i], GOLD); showName(MIDI[i]);
      L.play([{ t: 0, midi: MIDI[i], dur: 0.8 }], { onEnd: function () { lightChip(-1); kb.releaseAll(); } });
    });
  });
  var cells = Array.prototype.slice.call(document.querySelectorAll('#strip span'));
  function lightCell(i) { cells.forEach(function (c, j) { c.classList.toggle('on', j === i); }); }
  var STRIP = [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72];
  function k2(m) { return { step: function () { kb2.releaseAll(); kb2.press(m, GOLD); }, end: function () { kb2.releaseAll(); } }; }
  L.bindButtons({
    sete: {
      seq: MIDI.map(function (m, i) { return { t: i * 0.5, midi: m, dur: 0.48, i: i }; }),
      step: function (n) { lightChip(n.i); kb.releaseAll(); kb.press(MIDI[n.i], GOLD); showName(MIDI[n.i]); },
      end: function () {
        lightChip(-1); kb.releaseAll();
        var b7 = document.getElementById('big7'); b7.classList.remove('pop'); void b7.offsetWidth; b7.classList.add('pop');
        if (N) N.speak('Repete comigo! Quantas notas são? Sete!');
      }
    },
    tresDos: {
      seq: [{ t: 0, midi: 48, dur: 0.8, i: 0 }, { t: 0.9, midi: 60, dur: 0.8, i: 7 }, { t: 1.8, midi: 72, dur: 1.0, i: 14 }],
      step: function (n) { lightCell(n.i); }, end: function () { lightCell(-1); }
    },
    duasOitavas: {
      seq: STRIP.map(function (m, i) { return { t: i * 0.3, midi: m, dur: 0.3, i: i }; }),
      step: function (n) { lightCell(n.i); }, end: function () { lightCell(-1); }
    },
    do: { seq: [{ t: 0, midi: 60, dur: 0.9 }], step: k2(60).step, end: k2(60).end },
    dos: { seq: [{ t: 0, midi: 61, dur: 0.9 }], step: k2(61).step, end: k2(61).end },
    re: { seq: [{ t: 0, midi: 62, dur: 0.9 }], step: k2(62).step, end: k2(62).end }
  });

  /* Mostrar o Dó / o outro Dó */
  function showDo(m, fala) {
    if (N) N.stop();
    kb.releaseAll(); kb.press(m, GOLD); showName(m); lightChip(m === 60 ? 0 : -1);
    L.play([{ t: 0, midi: m, dur: 1.2 }], { onEnd: function () { kb.releaseAll(); lightChip(-1); } });
    if (N && fala) setTimeout(function () { N.speak(fala); }, 900);
  }
  document.getElementById('btn-do').addEventListener('click', function () { showDo(60, 'Esse é o Dó! A tecla branquinha antes das duas pretinhas.'); });
  document.getElementById('btn-do2').addEventListener('click', function () { showDo(72, 'Olha! Aqui tem outro Dó, mais fininho!'); });
  /* Repete comigo: 7 */
  var big7 = document.getElementById('big7');
  document.getElementById('btn-repete').addEventListener('click', function () {
    var fala = 'Repete comigo! Dó, ré, mi, fá, sol, lá, si! Quantas notas são? Sete!';
    big7.classList.remove('pop'); void big7.offsetWidth; big7.classList.add('pop');
    if (N && !N.speak(fala, this)) {} // sem voz: só a animação
  });

  /* Jogo: o Nido fala a nota e a criança toca no teclado */
  var box = document.getElementById('jogo');
  var gkHost = document.createElement('div'); gkHost.className = 'kb-kids';
  var gk = null;
  function round(i) {
    return {
      say: 'Ache o ' + NAMES[i] + '! Toque no ' + NAMES[i] + ' no teclado.',
      show: 'Ache o ' + NAMES[i].toUpperCase() + '!',
      custom: function (R, done) {
        var o = box.querySelector('.g-opts'); o.appendChild(gkHost);
        if (!gk) gk = new P.Keyboard(gkHost, { low: 60, high: 71, onKey: function (m) { if (gk.cb) gk.cb(m); } });
        gk.releaseAll();
        gk.cb = function (m) {
          if (N) N.stop();
          L.play([{ t: 0, midi: m, dur: 0.6 }]);
          if (m === MIDI[i]) { gk.press(m, { white: '#9BE3AE', black: '#1a7f37' }); gk.cb = null; done(true); }
          else { gk.press(m, { white: '#FFC2B3', black: '#B3261E' }); setTimeout(function () { gk.release(m); }, 500); done(false); }
        };
      }
    };
  }
  if (N) N.StarGame(box, [0, 2, 4, 5, 1].map(round));
})();
