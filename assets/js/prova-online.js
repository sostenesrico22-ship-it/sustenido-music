/* Sustenido Music — Prova online (respostas ao vivo para o professor) */
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuração pela página (<body data-prova-id data-mc data-trava data-libera>).
// Sem atributos = Prova do Básico (comportamento original).
const CFG = document.body.dataset;
const PROVA_ID = CFG.provaId || "basico-1";
const NUM_MC = +(CFG.mc || 9);              // nº de questões de marcar
const TRAVA = CFG.trava || "basico";        // "basico" = exige aulas 1–5 · "nenhuma" = sem trava
const LIBERA = CFG.libera ?? "aula6";       // "aula6" = professor libera a Aula 6 · "" = não libera nada
const $ = (i) => document.getElementById(i);
const P = window.SMProgresso;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app), db = getFirestore(app);
let ref = null, emProva = false, respostas = {};

function semConsulta(on){ $('hdr-link').hidden = on; document.querySelector('footer').hidden = on; const nv = $('nav-teste'); if(nv) nv.style.display = on ? 'none' : ''; }
function salvo(t){ $('salvo').textContent = t; }
async function salvar(dados){
  if(!ref) return;
  try{ await setDoc(ref, { ...dados, atualizadoEm: serverTimestamp() }, { merge: true }); salvo('✓ Salvo'); }
  catch(e){ console.warn(e); salvo('⚠ Sem conexão — tente de novo'); }
}
function mostrarEnviada(){
  $('inicio').hidden = true; $('prova').hidden = true; $('resultado').hidden = false; semConsulta(false);
}
function escutarLiberacao(){
  onSnapshot(ref, (s) => {
    const d = s.data(); if(!d) return;
    if(LIBERA !== "aula6") return;
    if(d.liberado === true && !P.provaAprovada()){
      P.aprovar(typeof d.nota === 'number' ? Math.round(d.nota*10) : '');
    }
    if(d.liberado === true){
      $('res-lib').innerHTML = '🎉 O professor liberou a <b>Aula 6 – Nível Intermediário</b>!';
      $('res-acoes').innerHTML = '<a class="btn-concluir feita" style="text-decoration:none" href="aula-06-acordes.html">Ir para a Aula 6 ›</a><a class="btn" href="../index.html">Lista de aulas</a>';
    }
  }, (e) => console.warn(e));
}

if(TRAVA === "basico" && !P.basicoCompleto() && !P.provaAprovada()){ $('trancada').hidden = false; }
else {
  $('inicio').hidden = false;
  try{ $('nome').value = localStorage.getItem('sm_tpz_nome') || ''; }catch(e){}
  onAuthStateChanged(auth, async (u) => {
    if(!u) return;
    ref = doc(db, 'provas', PROVA_ID, 'envios', u.uid);
    try{
      const s = await getDoc(ref);
      if(s.exists() && s.data().status === 'enviada'){ mostrarEnviada(); }
      escutarLiberacao();
    }catch(e){ console.warn(e); }
  });
  signInAnonymously(auth).catch((e) => { console.warn(e); $('erro-ini').textContent = 'Sem conexão com o servidor. Verifique a internet.'; $('erro-ini').hidden = false; });
}

$('comecar').onclick = async () => {
  const nome = $('nome').value.trim();
  if(nome.length < 3){ $('erro-ini').textContent = 'Digite seu nome para começar.'; $('erro-ini').hidden = false; return; }
  if(!ref){ $('erro-ini').textContent = 'Conectando… aguarde um instante e toque de novo.'; $('erro-ini').hidden = false; return; }
  $('erro-ini').hidden = true;
  try{ localStorage.setItem('sm_tpz_nome', nome); }catch(e){}
  const el = document.documentElement;
  try{ if(el.requestFullscreen) await el.requestFullscreen(); else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen(); }catch(e){}
  emProva = true; respostas = {};
  $('inicio').hidden = true; $('prova').hidden = false; semConsulta(true); window.scrollTo(0,0);
  await salvar({ nome, respostas: {}, textoAberta: '', status: 'em_andamento', iniciadoEm: serverTimestamp() });
};

document.querySelectorAll('.quiz-q.mc').forEach((q) => {
  q.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
    q.querySelectorAll('.opt').forEach((x) => x.classList.remove('sel'));
    b.classList.add('sel');
    const n = 'q' + (+q.dataset.q + 1);
    respostas[n] = b.dataset.l;
    salvar({ respostas: { [n]: b.dataset.l } });
  }));
});
let tmr;
$('aberta').addEventListener('input', () => { clearTimeout(tmr); salvo('…'); tmr = setTimeout(() => salvar({ textoAberta: $('aberta').value }), 700); });

let ultimaSaida = 0;
function saiu(){
  if(!emProva) return;
  const t = Date.now(); if(t - ultimaSaida < 1500) return; ultimaSaida = t;
  salvar({ saidasDaTela: increment(1), ultimaSaidaEm: serverTimestamp() });
}
document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'hidden') saiu(); });
window.addEventListener('blur', saiu);
window.addEventListener('beforeunload', (e) => { if(emProva){ e.preventDefault(); e.returnValue = ''; } });

$('prova').onsubmit = async (e) => {
  e.preventDefault();
  const falta = Object.keys(respostas).length < NUM_MC || !$('aberta').value.trim();
  if(falta){ $('falta').hidden = false; return; }
  $('falta').hidden = true;
  emProva = false;
  await salvar({ respostas, textoAberta: $('aberta').value.trim(), status: 'enviada', enviadoEm: serverTimestamp() });
  try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){}
  mostrarEnviada(); window.scrollTo(0,0);
};
