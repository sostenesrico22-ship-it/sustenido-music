/* Sustenido Music — Aula 3: As notas no piano */
(function () {
  'use strict';
  var P = window.SustenidoPiano, L = window.SustenidoLesson;
  var S = P.SOLFEGE, LET = P.LETTERS, BLACK = P.IS_BLACK;
  var oct = function (m) { return Math.floor(m / 12) - 1; };
  var GROUP2 = { 1: 1, 3: 1 }, GROUP3 = { 6: 1, 8: 1, 10: 1 };
  var COL = {
    g2: { white: '#8FD3CA', black: '#2A9D8F' }, g3: { white: '#F1D97E', black: '#C9A227' },
    dos: { white: '#F6EDCF', black: '#3A4B74' }, tap: { white: '#C9D1E6', black: '#5A6B94' },
    right: { white: '#8FD3CA', black: '#2A9D8F' }, wrong: { white: '#F3B6B0', black: '#C0392B' }
  };
  function describe(m) {
    var pc = m % 12, o = oct(m);
    if (BLACK[pc]) return { name: S[pc] + ' / ' + S[pc + 1] + '♭', sub: LET[pc] + o + ' / ' + LET[pc + 1] + '♭' + o + ' · tecla preta' };
    return { name: S[pc], sub: 'Cifra ' + LET[pc] + ' · ' + LET[pc] + o + (m === 60 ? ' · Dó central' : '') };
  }
  function sound(m) { var ctx = L.synth.ensure(); if (ctx) L.synth.note(m, ctx.currentTime + 0.01, 0.7, 0.8); }

  /* ---- teclado principal ---- */
  var opt = { names: false, groups: false, dos: false, central: false };
  var nameEl = document.getElementById('ki-name'), subEl = document.getElementById('ki-sub');
  var tapTimer = 0;
  var kb = new P.Keyboard(document.getElementById('kb'), {
    low: 48, high: 72, blackLabels: true,
    onKey: function (m) {
      sound(m);
      var d = describe(m); nameEl.textContent = d.name; subEl.textContent = d.sub;
      repaint(); kb.press(m, COL.tap);
      clearTimeout(tapTimer); tapTimer = setTimeout(repaint, 380);
    }
  });
  function repaint() {
    kb.releaseAll(); kb.clearBadges();
    for (var m = 48; m <= 72; m++) {
      var pc = m % 12;
      if (opt.groups && GROUP2[pc]) kb.press(m, COL.g2);
      if (opt.groups && GROUP3[pc]) kb.press(m, COL.g3);
      if (opt.dos && pc === 0) { kb.press(m, COL.dos); kb.setBadge('do' + m, m, 'Dó', { color: '#C9A227', textColor: '#1F2A44', size: 12 }); }
    }
    if (opt.central) kb.setBadge('central', 60, '★', { color: '#1F2A44', tag: 'Dó central', tagColor: '#9E7E14' });
    kb.setLabels(opt.names);
    document.getElementById('kb-legend').hidden = !opt.groups;
  }
  Array.prototype.forEach.call(document.querySelectorAll('.toggle'), function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-t'); opt[k] = !opt[k];
      b.setAttribute('aria-pressed', String(opt[k]));
      repaint();
    });
  });
  document.getElementById('btn-central').addEventListener('click', function () {
    opt.central = true;
    document.querySelector('.toggle[data-t="central"]').setAttribute('aria-pressed', 'true');
    repaint(); sound(60);
    nameEl.textContent = 'Dó central'; subEl.textContent = 'Cifra C · C4';
    document.getElementById('kb').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  repaint();

  /* ---- desafio ---- */
  var qkb, phase, found, target, rounds, hits, lastTarget = -1, lock = false;
  var TARGETS = [2, 4, 5, 7, 9, 11], ROUNDS = 5;
  var dq = document.getElementById('dq'), dfb = document.getElementById('dfb');
  function fb(txt, ok) { dfb.textContent = txt; dfb.className = 'fb ' + (ok ? 'ok' : 'no'); }
  function flash(m, c, ms) { qkb.press(m, c); setTimeout(function () { qkb.release(m); repaintQuiz(); }, ms || 450); }
  function repaintQuiz() { found.forEach(function (m) { qkb.press(m, COL.right); }); }
  function nextTarget() {
    var t; do { t = TARGETS[Math.floor(Math.random() * TARGETS.length)]; } while (t === lastTarget);
    lastTarget = target = t;
    dq.textContent = 'Rodada ' + (rounds + 1) + '/' + ROUNDS + ': encontre o ' + S[t] + ' (' + LET[t] + ')';
  }
  function start() {
    phase = 'dos'; found = []; rounds = 0; hits = 0; lock = false;
    qkb.releaseAll(); qkb.clearBadges();
    dq.textContent = 'Toque nos 3 Dós do teclado.'; dfb.textContent = ''; dfb.className = 'fb';
  }
  qkb = new P.Keyboard(document.getElementById('kb-quiz'), {
    low: 48, high: 72,
    onKey: function (m) {
      sound(m);
      if (lock || phase === 'done') return;
      var pc = m % 12;
      if (phase === 'dos') {
        if (pc === 0 && found.indexOf(m) < 0) {
          found.push(m); qkb.press(m, COL.right); qkb.setBadge('ok' + m, m, '✓', { color: '#2A9D8F' });
          if (found.length === 3) {
            fb('Muito bem! Você achou os 3 Dós. 🎉', true);
            phase = 'notes'; lock = true;
            setTimeout(function () { lock = false; found = []; qkb.releaseAll(); qkb.clearBadges(); nextTarget(); }, 1300);
          } else fb('Isso! Falta' + (found.length === 2 ? ' 1.' : 'm ' + (3 - found.length) + '.'), true);
        } else if (pc === 0) fb('Esse Dó você já achou. Procure outro!', false);
        else { flash(m, COL.wrong); fb('Ainda não. Dica: o Dó fica à esquerda das 2 pretas.', false); }
      } else if (phase === 'notes') {
        if (pc === target) {
          hits++; rounds++; lock = true; flash(m, COL.right, 700);
          fb('Acertou: ' + S[pc] + '! ✓', true);
          setTimeout(function () {
            lock = false;
            if (rounds >= ROUNDS) { phase = 'done'; dq.textContent = 'Parabéns! Desafio concluído. 🏆'; fb('Agora você já sabe achar as notas no piano.', true); }
            else nextTarget();
          }, 900);
        } else {
          flash(m, COL.wrong); fb('Essa é ' + describe(m).name + '. Conte a partir do Dó: Dó, Ré, Mi…', false);
        }
      }
    }
  });
  qkb.setLabels(false);
  document.getElementById('btn-restart').addEventListener('click', start);
  start();
  window.__aula3 = { kb: kb, qkb: qkb, opt: opt, state: function () { return { phase: phase, found: found.slice(), target: target, rounds: rounds }; } };
})();
