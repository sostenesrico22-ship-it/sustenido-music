import { firebaseConfig } from "../assets/js/firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PROFESSOR = "sostenesrico22@gmail.com";
// Gabarito fica SÓ aqui no app do professor
const GABARITO = { "basico-1": { q1:"B", q2:"C", q3:"A", q4:"D", q5:"B", q6:"A", q7:"C", q8:"D", q9:"A" } };
const $ = (i) => document.getElementById(i);
const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
let unsub = null, docsAtuais = [];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

$('entrar').onclick = async () => {
  const p = new GoogleAuthProvider(); p.setCustomParameters({ login_hint: PROFESSOR, prompt: "select_account" });
  try { await signInWithPopup(auth, p); }
  catch (e) { if (e.code === 'auth/popup-blocked') return signInWithRedirect(auth, p); $('erro').textContent = 'Erro ao entrar: ' + e.code; $('erro').hidden = false; }
};
$('sair').onclick = () => signOut(auth);

onAuthStateChanged(auth, (u) => {
  if (unsub) { unsub(); unsub = null; }
  const ok = u && u.email === PROFESSOR;
  if (u && !ok) { $('erro').textContent = 'Esta conta (' + u.email + ') não é a do professor.'; $('erro').hidden = false; signOut(auth); }
  $('login').hidden = !!ok; $('painel').hidden = !ok; $('sair').hidden = !ok;
  if (ok) escutar();
});
$('provaSel').onchange = escutar;

function escutar() {
  if (unsub) unsub();
  const pid = $('provaSel').value, g = GABARITO[pid];
  $('gab').textContent = Object.entries(g).map(([k, v]) => k.slice(1) + v).join(' ');
  $('thead').innerHTML = '<tr><th>Aluno</th><th>Status</th>' + Object.keys(g).map(k => '<th>' + k.slice(1) + '</th>').join('') +
    '<th>Acertos</th><th>Q10 escrita</th><th>Nota</th><th>Saídas</th><th>Aula 6</th></tr>';
  unsub = onSnapshot(collection(db, 'provas', pid, 'envios'), (snap) => {
    docsAtuais = snap.docs;
    const linhas = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    let env = 0;
    $('tbody').innerHTML = linhas.length ? linhas.map(a => {
      const r = a.respostas || {}; let ac = 0;
      const cels = Object.keys(g).map(k => { if (!r[k]) return '<td class="vz">—</td>'; const c = r[k] === g[k]; if (c) ac++; return '<td class="' + (c ? 'ok' : 'no') + '">' + esc(r[k]) + '</td>'; }).join('');
      const ca = a.correcaoAberta; if (a.status === 'enviada') env++;
      const nota = ac + (ca === true ? 1 : 0);
      const notaTxt = (ca === true || ca === false) ? nota + '/10' : nota + '/10 <small>(falta Q10)</small>';
      const sai = a.saidasDaTela || 0;
      return '<tr data-id="' + a.id + '"><td class="nome">' + esc(a.nome || '(sem nome)') + '</td>' +
        '<td><span class="st ' + (a.status === 'enviada' ? 'env' : '') + '">' + (a.status === 'enviada' ? 'Enviada' : 'Fazendo…') + '</span></td>' + cels +
        '<td><b>' + ac + '/9</b></td>' +
        '<td class="aberta ' + (ca === true ? 'ok' : ca === false ? 'no' : '') + '">' + (esc(a.textoAberta) || '<span class="vz">—</span>') +
        '<br><button class="mini ' + (ca === true ? 'on' : '') + '" data-ac="certa">✓ Certa</button><button class="mini ' + (ca === false ? 'on' : '') + '" data-ac="errada">✗ Errada</button></td>' +
        '<td><b>' + notaTxt + '</b></td>' +
        '<td>' + (sai ? '<span class="warn">⚠ saiu ' + sai + 'x</span>' : '✓') + '</td>' +
        '<td><button class="mini lib ' + (a.liberado ? 'on' : '') + '" data-ac="lib">' + (a.liberado ? '✓ Liberada' : 'Liberar Aula 6') + '</button></td></tr>';
    }).join('') : '<tr><td colspan="16">Nenhum aluno ainda. As respostas aparecem aqui ao vivo.</td></tr>';
    $('resumo').textContent = linhas.length + ' aluno(s) · ' + env + ' enviada(s)';
  }, (e) => { $('tbody').innerHTML = '<tr><td class="warn">Erro: ' + esc(e.code) + '</td></tr>'; });
}

$('tbody').addEventListener('click', async (e) => {
  const b = e.target.closest('button[data-ac]'); if (!b) return;
  const id = b.closest('tr').dataset.id, pid = $('provaSel').value;
  const ref = doc(db, 'provas', pid, 'envios', id);
  const d = (docsAtuais.find(x => x.id === id) || {}).data?.() || {};
  try {
    if (b.dataset.ac === 'certa') await updateDoc(ref, { correcaoAberta: true });
    if (b.dataset.ac === 'errada') await updateDoc(ref, { correcaoAberta: false });
    if (b.dataset.ac === 'lib') {
      const g = GABARITO[pid], r = d.respostas || {};
      const nota = Object.keys(g).filter(k => r[k] === g[k]).length + (d.correcaoAberta === true ? 1 : 0);
      await updateDoc(ref, { liberado: !d.liberado, nota, liberadoEm: serverTimestamp() });
    }
  } catch (err) { alert('Não foi possível salvar: ' + err.code); }
});

$('arquivar').onclick = async () => {
  if (!docsAtuais.length) return alert('Não há envios nesta rodada.');
  if (!confirm('Arquivar a rodada atual? A tabela fica vazia e os alunos podem fazer a prova de novo. Os dados ficam guardados no arquivo.')) return;
  const pid = $('provaSel').value, tag = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const batch = writeBatch(db);
  docsAtuais.forEach(d => { batch.set(doc(db, 'provas', pid, 'arquivo', tag + '_' + d.id), { ...d.data(), uid: d.id, arquivadoEm: serverTimestamp() }); batch.delete(d.ref); });
  try { await batch.commit(); } catch (err) { alert('Erro ao arquivar: ' + err.code); }
};
