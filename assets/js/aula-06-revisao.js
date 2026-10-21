/* Sustenido Music — Aula 6: revisão (todos os tópicos) */
(function () {
  'use strict';
  var box = document.getElementById('rev'); if (!box) return;
  var P = window.SustenidoPiano, synth = P ? new P.PianoSynth() : null;
  var Q = [
    ['O que é cifra?', ['Letras que representam acordes', 'Um tipo de partitura só para bateria', 'O nome do dedo 1'], 0],
    ['O que é um acorde?', ['Uma nota tocada sozinha', 'Três ou mais notas tocadas ao mesmo tempo', 'Uma pausa'], 1],
    ['Na tríade, qual é a nota principal, que dá o nome ao acorde?', ['Terça', 'Quinta', 'Tônica'], 2],
    ['Qual cifra é Lá menor?', ['A', 'Am', 'Lm'], 1],
    ['Quais são as notas de G (Sol maior)?', ['Sol – Si – Ré', 'Sol – Lá – Si', 'Sol – Dó – Mi'], 0],
    ['Ouça e veja: Mi – Sol – Dó. Qual é a posição de C?', ['Estado fundamental', '1ª inversão', '2ª inversão'], 1, [64, 67, 72]],
    ['Ouça e veja: Sol – Dó – Mi. Qual é a posição de C?', ['Estado fundamental', '1ª inversão', '2ª inversão'], 2, [67, 72, 76]],
    ['Ouça e veja: Lá – Dó – Mi. Que acorde é este?', ['C', 'Am', 'F'], 1, [69, 72, 76]],
    ['Ouça e veja: Dó – Fá – Lá. Que acorde é, e em qual posição?', ['F na 2ª inversão', 'Dm no estado fundamental', 'C na 1ª inversão'], 0, [60, 65, 69]],
    ['A 1ª inversão começa em qual nota do acorde?', ['Tônica', 'Terça', 'Quinta'], 1],
    ['Para que servem as inversões?', ['Para deixar a música mais rápida', 'Para facilitar e economizar movimento na troca de acordes', 'Para mudar o tom da música'], 1],
    ['No campo harmônico de Dó maior, qual é o acorde do 5º grau?', ['G', 'Em', 'Bdim'], 0]
  ];
  var right = 0, done = 0;
  Q.forEach(function (q, qi) {
    var d = document.createElement('div'); d.className = 'rev-q';
    d.innerHTML = '<b>' + (qi + 1) + '.</b> ' + q[0];
    if (q[3]) {
      var kd = document.createElement('div'); kd.className = 'kb-inv'; d.appendChild(kd);
      var kb = new P.Keyboard(kd, { low: 60, high: 77 }); q[3].forEach(function (m) { kb.press(m, 'any'); });
      var ob = document.createElement('button'); ob.type = 'button'; ob.className = 'btn'; ob.textContent = '🔊 Ouvir';
      ob.addEventListener('click', function () { var c = synth.ensure(); if (!c) return; q[3].forEach(function (m) { synth.note(m, c.currentTime + 0.05, 1.5, 0.7); }); });
      d.appendChild(ob);
    }
    var o = document.createElement('div'); o.className = 'opts';
    q[1].forEach(function (t, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.textContent = t;
      b.addEventListener('click', function () {
        if (d.dataset.ans) return; d.dataset.ans = 1; done++;
        if (i === q[2]) { right++; b.classList.add('ok'); } else { b.classList.add('err'); o.children[q[2]].classList.add('ok'); }
        document.getElementById('rev-score').textContent = 'Acertos: ' + right + ' de ' + done + (done === Q.length ? (right >= 10 ? ' · Parabéns! 🎉' : ' · Revise a aula e tente de novo.') : '');
      });
      o.appendChild(b);
    });
    d.appendChild(o); box.appendChild(d);
  });
})();
