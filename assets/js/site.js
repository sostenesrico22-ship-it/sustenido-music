/* Sustenido Music — configuração do site.
   O nome da marca fica SÓ na linha "brand" abaixo: se um dia precisar mudar,
   cabeçalho, rodapé, página inicial e título da aba são atualizados automaticamente. */
window.SITE = {
  brand: 'Sustenido Music',
  tagline: 'Site de aulas de música: teoria e prática de piano popular',
  teacher: 'Sóstenes Silva'
};
(function (S) {
  'use strict';
  var DEFAULT_BRAND = 'Sustenido Music'; // texto que vem escrito no HTML (para quem abre sem JavaScript)
  function fill() {
    var words = S.brand.trim().split(/\s+/), lastWord = words.pop();
    Array.prototype.forEach.call(document.querySelectorAll('[data-site="brand"]'), function (el) {
      if (el.hasAttribute('data-split')) { // última palavra em dourado
        el.textContent = words.length ? words.join(' ') + ' ' : '';
        var sp = document.createElement('span'); sp.textContent = lastWord; el.appendChild(sp);
      } else el.textContent = S.brand;
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-site="tagline"]'), function (el) { el.textContent = S.tagline; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-site="teacher"]'), function (el) { el.textContent = S.teacher; });
    if (S.brand !== DEFAULT_BRAND) document.title = document.title.split(DEFAULT_BRAND).join(S.brand);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill); else fill();
})(window.SITE);
