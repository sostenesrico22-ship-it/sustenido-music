/* Sustenido Music — Aula 6: Inversões de acordes (teclado interativo + exercício) */
(function () {
  'use strict';
  var P = window.SustenidoPiano;
  if (!P || !document.getElementById('kb-inv')) return;
  var ROLE = {
    T: { color: '#C62828', text: '#FFFFFF', key: { white: '#F4B4B4', black: '#C62828' } },
    '3ª': { color: '#2A9D8F', text: '#FFFFFF', key: { white: '#8FD3CA', black: '#2A9D8F' } },
    '5ª': { color: '#C9A227', text: '#1F2A44', key: { white: '#F1D97E', black: '#C9A227' } }
  };
  // [midi, função] da nota mais grave para a mais aguda
  var CHORDS = {
    C: { nome: 'Dó maior', inv: [[[60, 'T'], [64, '3ª'], [67, '5ª']], [[64, '3ª'], [67, '5ª'], [72, 'T']], [[67, '5ª'], [72, 'T'], [76, '3ª']]] },
    F: { nome: 'Fá maior', inv: [[[65, 'T'], [69, '3ª'], [72, '5ª']], [[69, '3ª'], [72, '5ª'], [77, 'T']], [[60, '5ª'], [65, 'T'], [69, '3ª']]] },
    G: { nome: 'Sol maior', inv: [[[67, 'T'], [71, '3ª'], [74, '5ª']], [[71, '3ª'], [74, '5ª'], [79, 'T']], [[62, '5ª'], [67, 'T'], [71, '3ª']]] }
  };
  var INV_NOME = ['Estado fundamental', '1ª inversão', '2ª inversão'];
  var INV_DICA = ['começa na tônica', 'começa na terça', 'começa na quinta'];
  var synth = new P.PianoSynth();
  function play(notes, arpeggio) {
    var ctx = synth.ensure(); if (!ctx) return;
    var t = ctx.currentTime + 0.05;
    notes.forEach(function (n, i) { synth.note(n[0], t + (arpeggio ? i * 0.35 : 0), 1.6, 0.75); });
    if (arpeggio) notes.forEach(function (n) { synth.note(n[0], t + 1.15, 1.6, 0.6); });
  }
  function show(kb, notes) {
    kb.releaseAll(); kb.clearBadges();
    notes.forEach(function (n, i) {
      var r = ROLE[n[1]];
      kb.press(n[0], r.key);
      kb.setBadge('n' + i, n[0], n[1], { color: r.color, textColor: r.text, size: n[1] === 'T' ? 17 : 13, tag: P.noteName(n[0]), tagColor: r.color });
    });
  }
  function names(notes) { return notes.map(function (n) { return P.noteName(n[0]); }).join(' – '); }

  /* ---- Explorador ---- */
  var state = { chord: 'C', inv: 0 };
  var kb = new P.Keyboard(document.getElementById('kb-inv'), { low: 60, high: 79, onKey: function (m) { var c = synth.ensure(); if (c) synth.note(m, c.currentTime + 0.02, 1.2, 0.7); } });
  var info = document.getElementById('inv-info');
  function render(sound) {
    var notes = CHORDS[state.chord].inv[state.inv];
    show(kb, notes);
    info.innerHTML = '<b>' + CHORDS[state.chord].nome + ' · ' + INV_NOME[state.inv] + '</b> (' + INV_DICA[state.inv] + '): <b>' + names(notes) + '</b>';
    Array.prototype.forEach.call(document.querySelectorAll('[data-chord]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-chord') === state.chord); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-inv]'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-inv') === state.inv); });
    if (sound) play(notes, false);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-chord],[data-inv],#inv-play,#inv-arp');
    if (!b) return;
    if (b.hasAttribute('data-chord')) { state.chord = b.getAttribute('data-chord'); render(true); }
    else if (b.hasAttribute('data-inv')) { state.inv = +b.getAttribute('data-inv'); render(true); }
    else play(CHORDS[state.chord].inv[state.inv], b.id === 'inv-arp');
  });
  render(false);

  /* ---- Exercício: qual é a inversão? ---- */
  var qkb = new P.Keyboard(document.getElementById('kb-quiz'), { low: 60, high: 79 });
  var q = null, acertos = 0, total = 0, fb = document.getElementById('quiz-fb'), score = document.getElementById('quiz-score');
  function nova() {
    var keys = Object.keys(CHORDS), c, i;
    do { c = keys[Math.floor(Math.random() * keys.length)]; i = Math.floor(Math.random() * 3); } while (q && q.c === c && q.i === i);
    q = { c: c, i: i, done: false };
    var notes = CHORDS[c].inv[i];
    qkb.releaseAll(); qkb.clearBadges();
    notes.forEach(function (n, k) { qkb.press(n[0], 'any'); qkb.setBadge('q' + k, n[0], P.noteName(n[0]), { color: '#1F2A44', size: 11 }); });
    document.getElementById('quiz-q').textContent = 'Acorde de ' + CHORDS[c].nome + ': ' + names(notes) + '. Qual é a posição?';
    fb.textContent = '';
    Array.prototype.forEach.call(document.querySelectorAll('[data-resp]'), function (b) { b.className = 'opt'; });
  }
  document.getElementById('quiz-opts').addEventListener('click', function (e) {
    var b = e.target.closest('[data-resp]'); if (!b || q.done) return;
    var r = +b.getAttribute('data-resp');
    total++;
    if (r === q.i) {
      acertos++; q.done = true; b.className = 'opt right';
      fb.textContent = '✅ Isso! A nota mais grave é a ' + ['tônica', 'terça', 'quinta'][q.i] + '.';
      show(qkb, CHORDS[q.c].inv[q.i]); play(CHORDS[q.c].inv[q.i], true);
    } else {
      b.className = 'opt wrong';
      fb.textContent = '❌ Quase! Olhe a nota mais grave (a da esquerda): ela é a tônica, a terça ou a quinta?';
    }
    score.textContent = acertos + ' de ' + total + ' respostas certas';
  });
  document.getElementById('quiz-next').addEventListener('click', nova);
  document.getElementById('quiz-ouvir').addEventListener('click', function () { play(CHORDS[q.c].inv[q.i], false); });
  nova();
  window.__inv = { state: state, CHORDS: CHORDS };
})();
