/* Sustenido Music Kids — voz do Nido (speechSynthesis pt-BR), vídeo com aviso "em breve" e jogo de estrelas. */
(function () {
  'use strict';
  var root = document.documentElement;
  var hasVoice = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  if (!hasVoice) root.classList.add('no-voz');
  var voice = null, current = null;
  function pickVoice() {
    if (!hasVoice) return;
    try {
      var vs = window.speechSynthesis.getVoices() || [];
      voice = vs.filter(function (v) { return /^pt[-_]BR/i.test(v.lang); })[0] || vs.filter(function (v) { return /^pt/i.test(v.lang); })[0] || null;
    } catch (e) { voice = null; }
  }
  if (hasVoice) { pickVoice(); try { window.speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) {} }

  function clearBtn() { if (current) { current.classList.remove('falando'); current = null; } }
  /* fala um texto; btn opcional (fica destacado enquanto fala) */
  function speak(text, btn) {
    if (!hasVoice || !text) return false;
    try {
      var ss = window.speechSynthesis;
      var wasMe = btn && btn === current;
      ss.cancel(); clearBtn();
      if (wasMe) return true; // segundo toque = parar
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR'; if (voice) u.voice = voice;
      u.rate = 0.95; u.pitch = 1.15;
      if (btn) { current = btn; btn.classList.add('falando'); }
      u.onend = u.onerror = function () { if (current === btn) clearBtn(); };
      ss.speak(u);
      return true;
    } catch (e) { clearBtn(); return false; }
  }
  function stopSpeak() { if (hasVoice) try { window.speechSynthesis.cancel(); } catch (e) {} clearBtn(); }

  function bindOuvir(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('.btn-ouvir[data-fala]'), function (b) {
      if (b._kb) return; b._kb = true;
      b.addEventListener('click', function () { speak(b.getAttribute('data-fala'), b); });
    });
  }

  /* vídeo: mostra o pôster "em breve" até o arquivo carregar de verdade */
  function setupVideos() {
    Array.prototype.forEach.call(document.querySelectorAll('.k-video'), function (box) {
      var v = box.querySelector('video'), soon = box.querySelector('.soon');
      if (!v || !soon) return;
      function ready() { soon.hidden = true; v.setAttribute('controls', ''); }
      function missing() { soon.hidden = false; v.removeAttribute('controls'); }
      if (v.readyState >= 1) ready();
      v.addEventListener('loadedmetadata', ready);
      v.addEventListener('error', missing, true);
      var src = v.querySelector('source'); if (src) src.addEventListener('error', missing);
      soon.addEventListener('click', function () { speak('O vídeo dessa aula vai chegar em breve! Enquanto isso, vamos brincar aqui embaixo!'); });
    });
  }

  /* jogo de estrelas genérico.
     rounds: [{ say: 'texto falado', show: 'texto curto na tela', options: [{ e: '🐤', label: 'Agudo', ok: true, play: fn }] }]
     ou rounds com custom: fn(round, done(ok)) para jogos no teclado. */
  function StarGame(box, rounds, opts) {
    opts = opts || {};
    var qEl = box.querySelector('.g-q'), oEl = box.querySelector('.g-opts'), sEl = box.querySelector('.stars'), rep = box.querySelector('.g-repeat');
    var i = 0, stars = 0, busy = false;
    sEl.innerHTML = rounds.map(function () { return '<span>⭐</span>'; }).join('');
    function star() { var s = sEl.children[stars]; if (s) s.classList.add('got'); stars++; }
    function show() {
      busy = false; oEl.innerHTML = '';
      if (i >= rounds.length) {
        qEl.textContent = '';
        var msg = stars === rounds.length ? 'Parabéns! Você ganhou todas as estrelas!' : 'Muito bem! Você ganhou ' + stars + ' estrelas!';
        oEl.innerHTML = '<div class="g-end"><span class="big">🏆</span>' + stars + ' ⭐</div>';
        var again = document.createElement('button'); again.type = 'button'; again.className = 'bigbtn'; again.style.minHeight = '70px'; again.style.width = '100%'; again.style.maxWidth = '320px'; again.textContent = '🔁 Jogar de novo';
        again.addEventListener('click', function () { i = 0; stars = 0; Array.prototype.forEach.call(sEl.children, function (x) { x.classList.remove('got'); }); show(); });
        var c = document.createElement('div'); c.className = 'center'; c.style.marginTop = '10px'; c.appendChild(again); oEl.appendChild(c);
        speak(msg); if (opts.onEnd) opts.onEnd(stars);
        return;
      }
      var R = rounds[i];
      qEl.textContent = R.show;
      speak(R.say);
      if (R.custom) { R.custom(R, answer); return; }
      var row = document.createElement('div'); row.className = 'big-row' + (R.options.length === 3 ? ' three' : '');
      R.options.forEach(function (o) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'bigbtn';
        b.innerHTML = '<span class="e" aria-hidden="true">' + o.e + '</span>' + o.label;
        b.addEventListener('click', function () {
          if (busy) return;
          if (o.play) o.play();
          if (o.ok) { b.classList.add('ok'); answer(true); }
          else { b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); answer(false); }
        });
        row.appendChild(b);
      });
      oEl.appendChild(row);
    }
    var tries = 0;
    function answer(ok) {
      if (ok) {
        busy = true; if (tries === 0) star(); tries = 0;
        speak(['Isso! Muito bem!', 'Acertou!', 'Uau, que legal!', 'Parabéns!'][Math.floor(Math.random() * 4)]);
        setTimeout(function () { i++; show(); }, 1700);
      } else { tries++; speak('Quase! Tente de novo.'); }
    }
    if (rep) rep.addEventListener('click', function () { if (i < rounds.length) speak(rounds[i].say, rep); });
    var start = box.querySelector('.g-start');
    if (start) start.addEventListener('click', function () { start.parentNode.removeChild(start); box.querySelector('.g-play').hidden = false; show(); });
    else show();
  }

  document.addEventListener('visibilitychange', function () { if (document.hidden) stopSpeak(); });
  function init() { bindOuvir(); setupVideos(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.NidoKids = { speak: speak, stop: stopSpeak, bindOuvir: bindOuvir, StarGame: StarGame, hasVoice: hasVoice };
})();
