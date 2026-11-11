/* Sustenido Music — pergunta se a pessoa já é cadastrada antes de ir
   ao cadastro ou à área do aluno. O flag fica neste aparelho, em localStorage. */
(function () {
  'use strict';
  var root = document.documentElement;
  var curso = root.getAttribute('data-sm-curso') || 'teclado';
  var acesso = root.getAttribute('data-sm-acesso') || 'acesso.html';
  var cadastro = root.getAttribute('data-sm-cadastro') || 'cadastro.html';
  var pagina = root.getAttribute('data-sm-pagina') || '';
  var key = 'sm_cadastrado_' + curso;
  var dlg;

  function marcado() {
    try { return !!localStorage.getItem(key); } catch (e) { return false; }
  }

  function marcar() {
    try {
      var agora;
      try {
        agora = new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Bahia',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }).format(new Date()).replace(',', ' às');
      } catch (x) {
        agora = new Date().toISOString();
      }
      localStorage.setItem(key, JSON.stringify({ em: agora }));
    } catch (e) {}
  }

  function normalizaPath(p) {
    if (!p) return '/';
    if (p.charAt(p.length - 1) === '/') p += 'index.html';
    return p;
  }

  function absUrl(url) {
    var a = document.createElement('a');
    a.href = url;
    return a;
  }

  function mesmaPagina(url) {
    var a = absUrl(url);
    return normalizaPath(a.pathname) === normalizaPath(location.pathname);
  }

  function ir(url) {
    var a = absUrl(url);
    if (mesmaPagina(url)) {
      if (a.hash) {
        if (location.hash !== a.hash) location.hash = a.hash;
        var el = document.getElementById(decodeURIComponent(a.hash.replace(/^#/, '')));
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    location.href = url;
  }

  function ehAcesso(href) {
    return /(?:^|\/)acesso\.html(?:[?#]|$)/.test(href || '');
  }

  function ehCadastro(href) {
    return /(?:^|\/)cadastro\.html(?:[?#]|$)/.test(href || '');
  }

  function fechar() {
    if (!dlg) return;
    if (typeof dlg.close === 'function' && dlg.open) dlg.close();
    else dlg.removeAttribute('open');
  }

  function montar() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'sm-ja-cad';
    dlg.className = 'sm-ja-cad';
    dlg.setAttribute('aria-labelledby', 'sm-ja-cad-t');
    dlg.innerHTML =
      '<div class="sm-ja-cad-box">' +
        '<h2 id="sm-ja-cad-t">Você já é cadastrado(a) na Sustenido Music?</h2>' +
        '<p>Se você ou um responsável já enviou o cadastro, entre com o código de acesso. Se ainda não, é só se cadastrar.</p>' +
        '<div class="btns">' +
          '<button type="button" class="btn gold" data-sm-resp="sim">Sim, já sou cadastrado</button>' +
          '<button type="button" class="btn ghost" data-sm-resp="nao">Não, quero me cadastrar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-sm-resp]') : null;
      if (btn) {
        e.preventDefault();
        var resp = btn.getAttribute('data-sm-resp');
        fechar();
        if (resp === 'sim') ir(acesso);
        else {
          try { sessionStorage.setItem('sm_ja_cad_ir', 'nao'); } catch (x) {}
          ir(cadastro);
        }
        return;
      }
      if (e.target === dlg) fechar();
    });
    return dlg;
  }

  function abrir() {
    var d = montar();
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
    var first = d.querySelector('[data-sm-resp="sim"]');
    if (first) first.focus();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a || a.hasAttribute('data-sm-direto')) return;
    var href = a.getAttribute('href') || '';
    if (ehAcesso(href)) {
      if (pagina === 'acesso' || pagina === 'cadastro' || pagina === 'pagamento') return;
      if (marcado()) return;
      e.preventDefault();
      abrir();
      return;
    }
    if (ehCadastro(href)) {
      if (pagina === 'cadastro') return;
      e.preventDefault();
      abrir();
    }
  });

  function aoCarregar() {
    if (pagina === 'cadastro' && !marcado()) {
      var pulou = false;
      try {
        pulou = sessionStorage.getItem('sm_ja_cad_ir') === 'nao';
        if (pulou) sessionStorage.removeItem('sm_ja_cad_ir');
      } catch (x) {}
      if (!pulou) abrir();
    }
  }

  window.SMEntrada = { marcado: marcado, marcar: marcar, abrir: abrir, key: key };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aoCarregar);
  else aoCarregar();
})();
