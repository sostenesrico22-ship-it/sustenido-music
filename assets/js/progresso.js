/* Sustenido Music — progresso do aluno (localStorage) */
(function(){
  var K='sm_tpz_';
  var P=window.SMProgresso={
    feita:function(n){try{return localStorage.getItem(K+'aula'+n)==='1'}catch(e){return false}},
    marcar:function(n,v){try{v?localStorage.setItem(K+'aula'+n,'1'):localStorage.removeItem(K+'aula'+n)}catch(e){}},
    basicoCompleto:function(){for(var i=1;i<=5;i++)if(!P.feita(i))return false;return true},
    provaAprovada:function(){try{return localStorage.getItem(K+'prova')==='aprovado'}catch(e){return false}},
    aprovar:function(nota){try{localStorage.setItem(K+'prova','aprovado');localStorage.setItem(K+'prova_nota',String(nota))}catch(e){}},
    nota:function(){try{return localStorage.getItem(K+'prova_nota')}catch(e){return null}}
  };
  function botao(){
    var b=document.querySelector('[data-concluir]'); if(!b)return;
    var n=+b.getAttribute('data-concluir');
    function pinta(){var f=P.feita(n);b.classList.toggle('feita',f);b.setAttribute('aria-pressed',f?'true':'false');
      b.textContent=f?'✓ Aula concluída':'Marcar como concluída';
      var h=document.querySelector('[data-concluir-hint]'); if(h)h.textContent=f?'Toque de novo se quiser desmarcar.':'Fez os exercícios? Marque a aula como concluída.';}
    b.addEventListener('click',function(){P.marcar(n,!P.feita(n));pinta()});pinta();
  }
  function lista(){
    document.querySelectorAll('[data-aula]').forEach(function(el){
      var n=+el.getAttribute('data-aula'),s=el.querySelector('.prog');if(!s)return;
      var f=P.feita(n);s.className='prog '+(f?'done':'todo');s.textContent=f?'✓ Concluída':'● Pendente';});
    var pv=document.getElementById('item-prova'),a6=document.getElementById('item-aula6');
    if(pv){var ok=P.basicoCompleto(),ap=P.provaAprovada();
      pv.innerHTML=ok?'<a class="lesson" href="aulas/prova-do-basico.html"><div class="num exam"><small>PROVA</small><b>📝</b></div><div><h3>Prova do Básico</h3><p>10 questões sobre as aulas 1 a 5. Acerte 70% para liberar o Nível Intermediário.</p>'+(ap?'<span class="prog done">✓ Aprovado'+(P.nota()?' · '+P.nota()+'%':'')+'</span>':'<span class="badge ok">Liberada</span>')+'</div><span class="go" aria-hidden="true">›</span></a>'
        :'<div class="lesson locked" aria-disabled="true"><div class="num exam"><small>PROVA</small><b>🔒</b></div><div><h3>🔒 Prova do Básico</h3><p>Conclua as aulas 1 a 5 para liberar a prova.</p><span class="badge soon">Trancada</span></div></div>';}
    if(a6){var ap6=P.provaAprovada();
      a6.innerHTML=ap6?'<a class="lesson" href="aulas/aula-06-escalas-com-sustenidos.html" data-aula="6"><div class="num"><small>AULA</small><b>6</b></div><div><h3>Escalas maiores com sustenidos e o círculo das quintas</h3><p>Nível Intermediário · Sol, Ré, Lá, Mi, Si, Fá♯ e Dó♯ maior.</p><span class="prog todo">● Pendente</span></div><span class="go" aria-hidden="true">›</span></a>'
        :'<div class="lesson locked" aria-disabled="true"><div class="num"><small>AULA</small><b>6</b></div><div><h3>🔒 Escalas maiores com sustenidos e o círculo das quintas</h3><p>Nível Intermediário · libera quando você for aprovado na Prova do Básico.</p><span class="badge soon">Trancada</span></div></div>';
      if(ap6){var s=a6.querySelector('.prog');var f=P.feita(6);s.className='prog '+(f?'done':'todo');s.textContent=f?'✓ Concluída':'● Pendente';}}
  }
  document.addEventListener('DOMContentLoaded',function(){botao();lista()});
})();
