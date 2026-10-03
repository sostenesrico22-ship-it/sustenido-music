/* Sustenido Music — Aula 2: As notas musicais */
(function () {
  'use strict';
  var L = window.SustenidoLesson;
  var MIDI = [60, 62, 64, 65, 67, 69, 71];
  var chips = Array.prototype.slice.call(document.querySelectorAll('#chips .note-chip'));
  function lightChip(i) { chips.forEach(function (c, j) { c.classList.toggle('on', j === i); }); }
  chips.forEach(function (c, i) {
    c.addEventListener('click', function () {
      L.play([{ t: 0, midi: MIDI[i], dur: 0.8 }], { onEnd: function () { lightChip(-1); } });
      lightChip(i);
    });
  });
  var cells = Array.prototype.slice.call(document.querySelectorAll('#strip span'));
  function lightCell(i) { cells.forEach(function (c, j) { c.classList.toggle('on', j === i); }); }
  var STRIP = [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72];

  L.bindButtons({
    sete: {
      seq: MIDI.map(function (m, i) { return { t: i * 0.5, midi: m, dur: 0.48, i: i }; }),
      step: function (n) { lightChip(n.i); }, end: function () { lightChip(-1); }
    },
    tresDos: {
      seq: [{ t: 0, midi: 48, dur: 0.8, i: 0 }, { t: 0.9, midi: 60, dur: 0.8, i: 7 }, { t: 1.8, midi: 72, dur: 1.0, i: 14 }],
      step: function (n) { lightCell(n.i); }, end: function () { lightCell(-1); }
    },
    duasOitavas: {
      seq: STRIP.map(function (m, i) { return { t: i * 0.3, midi: m, dur: 0.3, i: i }; }),
      step: function (n) { lightCell(n.i); }, end: function () { lightCell(-1); }
    },
    do: { seq: [{ t: 0, midi: 60, dur: 0.9 }] },
    dos: { seq: [{ t: 0, midi: 61, dur: 0.9 }] },
    re: { seq: [{ t: 0, midi: 62, dur: 0.9 }] }
  });

  /* teste rápido */
  var QS = [
    { q: 'Qual é a cifra de Sol?', opts: ['S', 'G', 'C'], ok: 'G', midi: 67 },
    { q: 'E a cifra de Fá?', opts: ['E', 'A', 'F'], ok: 'F', midi: 65 },
    { q: 'A letra A é qual nota?', opts: ['Dó', 'Lá', 'Ré'], ok: 'Lá', midi: 69 },
    { q: 'Depois do Si vem…', opts: ['Dó', 'Lá', 'Fá'], ok: 'Dó', midi: 72 }
  ];
  var qi = 0, hits = 0, firstTry = true;
  var qEl = document.getElementById('quiz-q'), oEl = document.getElementById('quiz-opts'), fEl = document.getElementById('quiz-fb');
  function render() {
    fEl.textContent = ''; fEl.className = 'fb'; oEl.innerHTML = '';
    if (qi >= QS.length) {
      qEl.textContent = 'Você acertou ' + hits + ' de ' + QS.length + ' de primeira!';
      var again = document.createElement('button'); again.className = 'play'; again.type = 'button'; again.textContent = 'Jogar de novo';
      again.addEventListener('click', function () { qi = 0; hits = 0; render(); });
      oEl.appendChild(again);
      return;
    }
    var Q = QS[qi]; firstTry = true;
    qEl.textContent = (qi + 1) + '/' + QS.length + ' · ' + Q.q;
    Q.opts.forEach(function (o) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.textContent = o;
      b.addEventListener('click', function () {
        if (o === Q.ok) {
          b.classList.add('right'); fEl.textContent = 'Isso mesmo! 🎉'; fEl.className = 'fb ok';
          if (firstTry) hits++;
          L.play([{ t: 0, midi: Q.midi, dur: 0.6 }]);
          Array.prototype.forEach.call(oEl.children, function (x) { x.disabled = true; });
          setTimeout(function () { qi++; render(); }, 1100);
        } else {
          firstTry = false; b.classList.add('wrong'); fEl.textContent = 'Quase! Tente de novo.'; fEl.className = 'fb no';
        }
      });
      oEl.appendChild(b);
    });
  }
  render();
})();
