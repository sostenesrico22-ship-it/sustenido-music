(function(){
'use strict';
var NS='http://www.w3.org/2000/svg';
/* ---------- ÁUDIO (Web Audio, sons sintetizados) ---------- */
var ac=null,master,noiseBuf;
function A(){if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=.8;
 var comp=ac.createDynamicsCompressor();master.connect(comp);comp.connect(ac.destination);
 noiseBuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);var d=noiseBuf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
 if(ac.state==='suspended')ac.resume();return ac;}
function env(t,peak,dec){var g=ac.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+.003);g.gain.exponentialRampToValueAtTime(0.0001,t+dec);g.connect(master);return g;}
function noise(t,dec,type,f,peak,q){var s=ac.createBufferSource();s.buffer=noiseBuf;var fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;if(q)fl.Q.value=q;s.connect(fl);fl.connect(env(t,peak,dec));s.start(t);s.stop(t+dec+.05);}
function tone(t,f1,f2,dec,peak,type){var o=ac.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+dec*.8);o.connect(env(t,peak,dec));o.start(t);o.stop(t+dec+.05);}
var SND={
 kick:function(t,v){tone(t,140,45,.45,1.2*v);tone(t,600,100,.03,.4*v,'triangle');},
 snare:function(t,v){noise(t,.2,'highpass',1200,.7*v);tone(t,220,160,.1,.5*v,'triangle');},
 rim:function(t,v){tone(t,1700,1600,.04,.5*v,'square');noise(t,.03,'bandpass',3000,.4*v,4);},
 hh:function(t,v){noise(t,.06,'highpass',7500,.45*v);},
 hho:function(t,v){noise(t,.4,'highpass',7000,.4*v);},
 t1:function(t,v){tone(t,240,170,.35,.9*v);noise(t,.05,'bandpass',900,.15*v);},
 t2:function(t,v){tone(t,180,125,.4,.9*v);noise(t,.05,'bandpass',700,.15*v);},
 ft:function(t,v){tone(t,115,80,.55,1*v);noise(t,.06,'bandpass',500,.15*v);},
 crash:function(t,v){noise(t,1.6,'highpass',4500,.55*v);noise(t,.8,'bandpass',9000,.25*v,1);},
 ride:function(t,v){noise(t,.7,'bandpass',8000,.25*v,2);tone(t,2600,2500,.5,.08*v,'triangle');tone(t,3700,3600,.4,.05*v);},
 click:function(t,v){tone(t,v>1?1800:1200,v>1?1800:1200,.03,.5,'square');}
};
function play(id,t,v){A();SND[id](t||ac.currentTime,v||1);}
/* ---------- PEÇAS ---------- */
var P={
 crash:{n:'Prato de ataque',d:'Crash · marca começos',k:'C',x:125,y:88},
 ride:{n:'Prato de condução',d:'Ride · conduz o ritmo',k:'V',x:485,y:110},
 hh:{n:'Chimbal fechado',d:'Hi-hat · o "relógio" do ritmo',k:'D',x:85,y:188},
 hho:{n:'Chimbal aberto',d:'Pedal solto · som longo',k:'E',x:85,y:188},
 t1:{n:'Tom 1',d:'Agudo · viradas',k:'F',x:240,y:168},
 t2:{n:'Tom 2',d:'Médio · viradas',k:'G',x:352,y:168},
 snare:{n:'Caixa',d:'Marca o 2 e o 4',k:'S',x:170,y:262},
 rim:{n:'Caixa (aro)',d:'Cross-stick · som de "toc"',k:'R',x:150,y:262},
 ft:{n:'Surdo',d:'Tom de chão · grave',k:'H',x:455,y:262},
 kick:{n:'Bumbo',d:'Pé direito · marca o 1 e o 3',k:'X',x:300,y:300}
};
function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
function drum(g,cx,cy,rx,h,shell){var s=el('g',{'class':'shake'},g);
 el('rect',{x:cx-rx,y:cy,width:rx*2,height:h,fill:shell,rx:4},s);
 el('rect',{x:cx-rx,y:cy+h-6,width:rx*2,height:6,fill:'#b9bfcc'},s);el('rect',{x:cx-rx,y:cy-2,width:rx*2,height:6,fill:'#b9bfcc'},s);
 for(var i=-2;i<=2;i++)el('rect',{x:cx+i*rx*.42-2,y:cy+4,width:4,height:h-10,fill:'#d6dae3'},s);
 el('ellipse',{cx:cx,cy:cy,rx:rx,ry:rx*.27,fill:'#f2efe6',stroke:'#b9bfcc','stroke-width':3},s);return s;}
function cym(g,cx,cy,rx,two){var s=el('g',{'class':'shake'},g);
 el('ellipse',{cx:cx,cy:cy,rx:rx,ry:rx*.17,fill:'url(#gold)',stroke:'#8a6d12','stroke-width':1.5},s);
 el('ellipse',{cx:cx,cy:cy-1,rx:rx*.18,ry:rx*.05,fill:'#a6841b'},s);
 if(two)el('ellipse',{cx:cx,cy:cy+9,rx:rx,ry:rx*.15,fill:'url(#gold)',stroke:'#8a6d12','stroke-width':1.5},s);return s;}
function makeKit(box,info){
 var svg=el('svg',{viewBox:'0 0 600 420',role:'img','aria-label':'Bateria interativa'});box.appendChild(svg);
 var df=el('defs',{},svg),lg=el('linearGradient',{id:'gold',x1:0,y1:0,x2:1,y2:1},df);
 el('stop',{offset:0,'stop-color':'#f3d77a'},lg);el('stop',{offset:.5,'stop-color':'#C9A227'},lg);el('stop',{offset:1,'stop-color':'#9c7a14'},lg);
 var st={stroke:'#8d95a8','stroke-width':4};
 // ferragens
 [[125,95,125,395],[485,118,485,395],[85,190,85,395],[170,290,150,395],[170,290,190,395]].forEach(function(l){el('line',Object.assign({x1:l[0],y1:l[1],x2:l[2],y2:l[3]},st),svg);});
 el('line',Object.assign({x1:405,y1:300,x2:400,y2:395},st),svg);el('line',Object.assign({x1:505,y1:300,x2:510,y2:395},st),svg);
 el('rect',{x:60,y:388,width:50,height:10,rx:3,fill:'#6b7389'},svg);el('rect',{x:280,y:388,width:40,height:10,rx:3,fill:'#6b7389'},svg);
 var parts={};
 function part(id,fn){var g=el('g',{'class':'part','data-id':id},svg);fn(g);parts[id]=g;
  g.addEventListener('pointerdown',function(e){e.preventDefault();hit(id,null,true);});return g;}
 part('kick',function(g){var s=el('g',{'class':'shake'},g);el('circle',{cx:300,cy:300,r:88,fill:'#2a2f3d',stroke:'#b9bfcc','stroke-width':7},s);
  el('circle',{cx:300,cy:300,r:76,fill:'#f2efe6'},s);el('text',{x:300,y:296,'text-anchor':'middle','font-weight':800,'font-size':22,fill:'#1F2A44'},s).textContent='Sustenido';
  el('text',{x:300,y:322,'text-anchor':'middle','font-weight':800,'font-size':18,fill:'#C9A227'},s).textContent='Music';});
 part('t1',function(g){drum(g,240,165,46,48,'#7a1f2b');});
 part('t2',function(g){drum(g,352,165,52,54,'#7a1f2b');});
 part('ft',function(g){drum(g,455,255,66,90,'#7a1f2b');});
 part('snare',function(g){drum(g,170,258,60,30,'#c9ccd3');});
 part('rim',function(g){el('path',{d:'M110 258 A60 16 0 0 0 130 270',stroke:'transparent','stroke-width':18,fill:'none'},g);});
 part('hho',function(g){el('rect',{x:30,y:150,width:110,height:30,fill:'transparent'},g);});
 part('hh',function(g){cym(g,85,188,55,true);});
 part('crash',function(g){cym(g,125,88,78);});
 part('ride',function(g){cym(g,485,110,90);});
 [['crash','Ataque',125,62],['ride','Condução',485,82],['hh','Chimbal',85,225],['t1','Tom 1',240,205],['t2','Tom 2',352,212],['snare','Caixa',170,300],['ft','Surdo',455,335],['kick','Bumbo',300,405]].forEach(function(l){
  el('text',{'class':'lbl',x:l[2],y:l[3]},svg).textContent=l[1]+' ('+P[l[0]].k+')';});
 el('text',{'class':'lbl k',x:85,y:150},svg).textContent='aberto (E)';
 // pedal do bumbo (batedor)
 var beater=el('line',{x1:300,y1:395,x2:300,y2:330,stroke:'#e6c65a','stroke-width':6,'stroke-linecap':'round',style:'transform-origin:300px 395px;transition:transform .06s'},svg);
 // baquetas
 function stick(c){var g=el('g',{'class':'stick'},svg);el('line',{x1:0,y1:0,x2:95,y2:-120,stroke:'#d9a861','stroke-width':9,'stroke-linecap':'round'},g);
  el('line',{x1:60,y1:-76,x2:95,y2:-120,stroke:'#a8743a','stroke-width':10,'stroke-linecap':'round'},g);el('circle',{cx:0,cy:0,r:6,fill:'#f0d29a'},g);g.dataset.c=c;return g;}
 var L=stick('L'),R=stick('R');R.querySelector('line').setAttribute('x2',-95);R.querySelectorAll('line')[1].setAttribute('x1',-60);R.querySelectorAll('line')[1].setAttribute('x2',-95);R.querySelector('line').setAttribute('x2','-95');
 [L,R].forEach(function(s){var ls=s.querySelectorAll('line');ls[0].setAttribute('x2',s===L?95:-95);});
 var pos={L:[200,330],R:[400,330]};function place(s,x,y,a){s.style.transform='translate('+x+'px,'+y+'px) rotate('+a+'deg)';}
 place(L,200,340,0);place(R,400,340,0);
 var lastHand='R';
 function hit(id,when,user,hand){var p=P[id];
  if(user)play(id);
  var d=when?Math.max(0,(when-ac.currentTime)*1000):0;
  setTimeout(function(){var g=parts[id];g.classList.remove('hit');void g.getBBox();g.classList.add('hit');setTimeout(function(){g.classList.remove('hit');},140);
   if(info){info.innerHTML='<b>'+p.n+'</b><span>'+p.d+' · tecla '+p.k+'</span>';}
   if(id==='kick'){beater.style.transform='rotate(-18deg)';setTimeout(function(){beater.style.transform='';},90);return;}
   var s=hand?(hand==='L'?L:R):(p.x<300?L:R);
   if(!hand&&id==='snare')s=L; if(!hand&&(id==='hh'||id==='hho'))s=R; // mãos cruzadas (destro)
   var sgn=s===L?1:-1;place(s,p.x,p.y-26,sgn*-22);setTimeout(function(){place(s,p.x,p.y,0);},55);},d);}
 return {hit:hit};
}
/* ---------- RITMOS ---------- */
var NAMES={crash:'Ataque',ride:'Condução',hh:'Chimbal',hho:'Chimbal ab.',t1:'Tom 1',t2:'Tom 2',snare:'Caixa',rim:'Caixa aro',ft:'Surdo',kick:'Bumbo'};
var ORDER=['crash','ride','hho','hh','t1','t2','snare','rim','ft','kick'];
var R8='x.x.x.x.x.x.x.x.',BK='x.......x.......',BS='....x.......x...';
var PAT={
 ex_sem:{t:'Semínimas',bpm:70,d:'Uma batida por tempo: <b>1, 2, 3, 4</b>.',p:{hh:'x...x...x...x...'}},
 ex_col:{t:'Colcheias',bpm:70,d:'Duas batidas por tempo: <b>1 e 2 e 3 e 4 e</b>.',p:{hh:R8}},
 ex_semi:{t:'Semicolcheias',bpm:60,d:'Quatro batidas por tempo: <b>1 i e a 2 i e a…</b>',p:{hh:'xxxxxxxxxxxxxxxx'}},
 ex_hk:{t:'Chimbal + bumbo',bpm:60,d:'Chimbal em colcheias e bumbo no <b>1</b> e no <b>3</b>.',p:{hh:R8,kick:BK}},
 ex_hs:{t:'Chimbal + caixa',bpm:60,d:'Chimbal em colcheias e caixa no <b>2</b> e no <b>4</b>.',p:{hh:R8,snare:BS}},
 rock:{t:'1 · Pop/rock básico',bpm:90,main:1,d:'Chimbal em colcheias, bumbo no 1 e 3, caixa no 2 e 4. Fale: <b>tum-tss-tá-tss</b>.',p:{hh:R8,snare:BS,kick:BK}},
 balada:{t:'2 · Balada de louvor',bpm:68,main:1,d:'Chimbal leve, bumbo no 1 e no "e" do 3, caixa no 2 e 4. Bem tranquilo, deixando espaço pra voz.',v:{hh:.6},p:{hh:R8,snare:BS,kick:'x.........x.....'}},
 extra:{t:'3 · Pop com bumbo extra',bpm:95,main:1,d:'Bumbo no 1, no "e" do 2, no 3 e no "e" do 3. Mais dançante.',p:{hh:R8,snare:BS,kick:'x.....x.x.x.....'}},
 ride:{t:'4 · Pop no condução',bpm:90,main:1,d:'Mão direita no prato de condução e ataque no 1. Usado no refrão.',p:{crash:'x...............',ride:'..x.x.x.x.x.x.x.',snare:BS,kick:BK}},
 baiao:{t:'5 · Baião simplificado (2/4)',bpm:85,main:1,meter:2,d:'Atenção: baião é <b>2/4</b>. A grade mostra <b>2 compassos de 2/4</b>. Bumbo no 1, no "a" do 1 e no 2 (desenho da zabumba), chimbal fazendo o triângulo, com o chimbal aberto no contratempo.',v:{hh:.45},p:{hh:'xx.xxx.xxx.xxx.x',hho:'..x...x...x...x.',kick:'x..xx...x..xx...'}},
 vir1:{t:'Virada 1',bpm:75,d:'Compasso 1: ritmo. Compasso 2: no tempo 4, quatro semicolcheias na caixa. Volta com ataque.',p:{crash:'x...............'+'................',hh:'..x.x.x.x.x.x.x.'+'x.x.x.x.x.x.....',snare:BS+'....x.......xxxx',kick:BK+BK}},
 vir2:{t:'Virada 2',bpm:75,d:'No tempo 4 do compasso 2: caixa, tom 1, tom 2, surdo (descendo).',p:{crash:'x...............'+'................',hh:'..x.x.x.x.x.x.x.'+'x.x.x.x.x.x.....',snare:BS+'....x.......x...',t1:'................'+'.............x..',t2:'................'+'..............x.',ft:'................'+'...............x',kick:BK+BK}},
 vir3:{t:'Virada 3',bpm:70,d:'Tempos 3 e 4 do compasso 2: 2 na caixa, 2 no tom 1, 2 no tom 2, 2 no surdo.',p:{crash:'x...............'+'................',hh:'..x.x.x.x.x.x.x.'+'x.x.x.x.........',snare:BS+'....x...xx......',t1:'................'+'..........xx....',t2:'................'+'............xx..',ft:'................'+'..............xx',kick:BK+'x...............'}},
 rud:{t:'Toque simples R L',bpm:70,d:'Direita, esquerda, direita, esquerda… em colcheias, mesmo volume nas duas mãos.',hands:'R.L.R.L.R.L.R.L.',p:{snare:R8}}
};
function len(p){var n=0;for(var k in p.p)n=Math.max(n,p.p[k].length);return n;}
/* ---------- PAUTA (partitura de bateria) ---------- */
var YP={crash:-5,ride:0,hh:-5,hho:-5,t1:5,t2:10,snare:15,rim:15,ft:25,kick:35};
var CYM={crash:1,ride:1,hh:1,hho:1};
function staff(pat,box){box.innerHTML='';var n=len(pat),meter=pat.meter||4,spb=meter*4;
 var W=60+n*26,H=120,svg=el('svg',{viewBox:'0 0 '+W+' '+H},box),top=40;
 for(var i=0;i<5;i++)el('line',{x1:8,x2:W-6,y1:top+i*10,y2:top+i*10,stroke:'#1F2A44','stroke-width':1},svg);
 el('rect',{x:14,y:top+10,width:4,height:20,fill:'#1F2A44'},svg);el('rect',{x:22,y:top+10,width:4,height:20,fill:'#1F2A44'},svg);
 el('text',{x:40,y:top+18,'font-size':20,'font-weight':800,'text-anchor':'middle',fill:'#1F2A44'},svg).textContent=meter;
 el('text',{x:40,y:top+38,'font-size':20,'font-weight':800,'text-anchor':'middle',fill:'#1F2A44'},svg).textContent='4';
 var x0=60,sw=(W-x0-10)/n;
 for(var b=spb;b<=n;b+=spb){var bx=x0+b*sw-sw/2;el('line',{x1:bx,x2:bx,y1:top,y2:top+40,stroke:'#1F2A44','stroke-width':b===n?3:1.2},svg);}
 var stemTop=top-22;
 for(var beat=0;beat<n/4;beat++){var xs=[],has16=false;
  for(var s=beat*4;s<beat*4+4;s++){var any=false;
   for(var k in pat.p){if(pat.p[k][s]==='x'){any=true;var x=x0+s*sw,y=top+YP[k];
    if(CYM[k]){el('path',{d:'M'+(x-4)+' '+(y-4)+'L'+(x+4)+' '+(y+4)+'M'+(x+4)+' '+(y-4)+'L'+(x-4)+' '+(y+4),stroke:'#1F2A44','stroke-width':1.8},svg);if(k==='hho')el('circle',{cx:x,cy:stemTop-8,r:3.5,fill:'none',stroke:'#1F2A44'},svg);}
    else el('ellipse',{cx:x,cy:y,rx:5.2,ry:4,fill:'#1F2A44',transform:'rotate(-20 '+x+' '+y+')'},svg);
    if(y>top+40)el('line',{x1:x-8,x2:x+8,y1:top+50,y2:top+50,stroke:'#1F2A44'},svg);
    if(y<top)el('line',{x1:x-8,x2:x+8,y1:top-10,y2:top-10,stroke:'#1F2A44'},svg);}}
   if(any){var lowest=-99;for(var k2 in pat.p)if(pat.p[k2][s]==='x')lowest=Math.max(lowest,top+YP[k2]);
    el('line',{x1:x0+s*sw+5,x2:x0+s*sw+5,y1:lowest,y2:stemTop,stroke:'#1F2A44','stroke-width':1.4},svg);xs.push(s);if(s%2)has16=true;}}
  if(xs.length>1){el('rect',{x:x0+xs[0]*sw+5,y:stemTop,width:(xs[xs.length-1]-xs[0])*sw,height:4,fill:'#1F2A44'},svg);
   if(has16)el('rect',{x:x0+xs[0]*sw+5,y:stemTop+7,width:(xs[xs.length-1]-xs[0])*sw,height:4,fill:'#1F2A44'},svg);}
  else if(xs.length===1&&(xs[0]%4)){el('path',{d:'M'+(x0+xs[0]*sw+5)+' '+stemTop+' q8 8 6 18',stroke:'#1F2A44','stroke-width':2,fill:'none'},svg);}
 }
 return svg;}
/* ---------- PLAYER ---------- */
var kit1=makeKit(document.getElementById('kit1'),document.getElementById('kitInfo'));
var kit2=makeKit(document.getElementById('kit2'),document.getElementById('kitInfo2'));
var kit3=makeKit(document.getElementById('kit3'),null);
var cur='rock',playing=false,step=0,nextT=0,timer=null,bpmEl=document.getElementById('bpm'),bpmv=document.getElementById('bpmv');
var cells=[],hds=[];
function countLabel(s,meter){var i=s%4,beat=Math.floor((s%(meter*4))/4)+1;return ['' +beat,'i','e','a'][i];}
function render(){var pat=PAT[cur],n=len(pat),meter=pat.meter||4,spb=meter*4;
 document.getElementById('pdesc').innerHTML='<b>'+pat.t+'</b> · '+pat.d+' <span class="note">(sugestão: '+pat.bpm+' BPM)</span>';
 staff(pat,document.getElementById('pstaff'));
 var g=document.getElementById('grid');g.innerHTML='';cells=[];hds=[];
 var rows=ORDER.filter(function(k){return pat.p[k];});
 var per=n>16?16:n;
 for(var b0=0;b0<n;b0+=per){var bar=document.createElement('div');bar.className='gbar';
  var hr=document.createElement('div');hr.className='grow';hr.style.setProperty('--n',per);hr.innerHTML='<span class="nm">'+(n>16?'Compasso '+(b0/16+1):(meter===2?'2 × 2/4':'4/4'))+'</span>';
  for(var s=b0;s<b0+per;s++){var h=document.createElement('span');h.className='hd';h.textContent=pat.hands?(pat.hands[s]==='.'?'':pat.hands[s]):countLabel(s,meter);hr.appendChild(h);hds[s]=h;}
  bar.appendChild(hr);
  rows.forEach(function(k){var r=document.createElement('div');r.className='grow';r.style.setProperty('--n',per);r.innerHTML='<span class="nm">'+NAMES[k]+'</span>';
   for(var s=b0;s<b0+per;s++){var c=document.createElement('span');c.className='cell'+(Math.floor(s/4)%2?' b':'')+(pat.p[k][s]==='x'?' on':'');
    (function(k,s,c){c.addEventListener('click',function(){var a=pat.p[k].split('');a[s]=a[s]==='x'?'.':'x';pat.p[k]=a.join('');c.classList.toggle('on');staff(pat,document.getElementById('pstaff'));if(a[s]==='x')play(k);});})(k,s,c);
    r.appendChild(c);(cells[s]=cells[s]||[]).push(c);}
   bar.appendChild(r);});
  g.appendChild(bar);}
 document.querySelectorAll('#psel button').forEach(function(b){b.classList.toggle('on',b.dataset.id===cur);});}
function mark(s,t){setTimeout(function(){document.querySelectorAll('.cell.now,.hd.now').forEach(function(e){e.classList.remove('now');});
 (cells[s]||[]).forEach(function(c){c.classList.add('now');});if(hds[s])hds[s].classList.add('now');},Math.max(0,(t-ac.currentTime)*1000));}
function tick(){var pat=PAT[cur],n=len(pat),dur=60/(+bpmEl.value)/4;
 while(nextT<ac.currentTime+.12){var s=step%n;
  for(var k in pat.p){if(pat.p[k][s]==='x'){var v=(pat.v&&pat.v[k])||1;if(k==='hh'&&s%4)v*=.7;SND[k](nextT,v);
   var hand=pat.hands?(pat.hands[s]==='L'?'L':'R'):null;kit3.hit(k,nextT,false,hand);}}
  if(document.getElementById('click').checked&&s%4===0)SND.click(nextT,s===0?2:1);
  mark(s,nextT);nextT+=dur;step++;}
 timer=setTimeout(tick,25);}
function start(){A();if(playing)return;playing=true;step=0;nextT=ac.currentTime+.06;tick();document.getElementById('play').textContent='■ Parar';}
function stop(){playing=false;clearTimeout(timer);document.getElementById('play').textContent='▶ Tocar';document.querySelectorAll('.cell.now,.hd.now').forEach(function(e){e.classList.remove('now');});}
function load(id,go){var was=playing;stop();cur=id;bpmEl.value=PAT[id].bpm;bpmv.textContent=PAT[id].bpm;render();if(go||was)start();}
var psel=document.getElementById('psel');
['rock','balada','extra','ride','baiao','vir1','vir2','vir3'].forEach(function(id){var b=document.createElement('button');b.dataset.id=id;b.textContent=PAT[id].t;b.onclick=function(){load(id);};psel.appendChild(b);});
document.getElementById('play').onclick=function(){playing?stop():start();};
bpmEl.oninput=function(){bpmv.textContent=bpmEl.value;};
document.querySelectorAll('[data-load]').forEach(function(b){b.addEventListener('click',function(){load(b.dataset.load,true);document.getElementById('player').scrollIntoView({behavior:'smooth',block:'start'});});});
render();
/* ---------- TECLADO ---------- */
var KEYS={x:'kick',' ':'kick',s:'snare',r:'rim',d:'hh',e:'hho',f:'t1',g:'t2',h:'ft',c:'crash',v:'ride'};
document.addEventListener('keydown',function(e){if(e.repeat||/INPUT|TEXTAREA/.test(e.target.tagName))return;var id=KEYS[e.key.toLowerCase()];if(!id)return;e.preventDefault();
 var k=document.getElementById('kit2'),r=k.getBoundingClientRect(),vis=r.top<innerHeight&&r.bottom>0;(vis?kit2:kit1).hit(id,null,true);});
/* ---------- PAUTA LEGENDA ---------- */
(function(){var box=document.getElementById('staffKey'),items=['crash','hh','ride','t1','t2','snare','ft','kick'],pat={p:{}};
 items.forEach(function(k,i){var a=new Array(16).fill('.');a[i*2]='x';pat.p[k]=a.join('');});
 var svg=staff(pat,box);svg.setAttribute('viewBox','0 0 476 150');var W=476,x0=60,sw=(W-x0-10)/16;
 var nm={crash:'Ataque',hh:'Chimbal',ride:'Condução',t1:'Tom 1',t2:'Tom 2',snare:'Caixa',ft:'Surdo',kick:'Bumbo'};
 items.forEach(function(k,i){var t=el('text',{x:x0+i*2*sw,y:i%2?138:124,'font-size':11,'font-weight':700,'text-anchor':'middle',fill:'#7a1f2b'},svg);t.textContent=nm[k];});
 svg.querySelectorAll('rect[height="4"]').forEach(function(r){r.remove();});})();
/* ---------- FIGURAS ---------- */
(function(){var F=[['Semibreve','4 tempos','1 por compasso 4/4',0],['Mínima','2 tempos','2 por compasso',1],['Semínima','1 tempo','4 por compasso · "1 2 3 4"',2],['Colcheia','½ tempo','8 por compasso · "1 e 2 e"',3],['Semicolcheia','¼ de tempo','16 por compasso · "1 i e a"',4]];
 var box=document.getElementById('figs');F.forEach(function(f){var d=document.createElement('div');d.className='fig';var svg=el('svg',{viewBox:'0 0 60 70',width:60,height:70});
  var filled=f[3]>=2;el('ellipse',{cx:24,cy:52,rx:8,ry:6,fill:filled?'#1F2A44':'#fff',stroke:'#1F2A44','stroke-width':2.5,transform:'rotate(-20 24 52)'},svg);
  if(f[3]>=1)el('line',{x1:31,y1:50,x2:31,y2:10,stroke:'#1F2A44','stroke-width':2.2},svg);
  if(f[3]>=3)el('path',{d:'M31 10 q14 10 9 26',stroke:'#1F2A44','stroke-width':3,fill:'none'},svg);
  if(f[3]>=4)el('path',{d:'M31 20 q14 10 9 26',stroke:'#1F2A44','stroke-width':3,fill:'none'},svg);
  d.appendChild(svg);d.insertAdjacentHTML('beforeend','<b>'+f[0]+'</b>'+f[1]+'<br><small>'+f[2]+'</small>');box.appendChild(d);});})();
/* ---------- EMPUNHADURA ---------- */
(function(){var svg=el('svg',{viewBox:'0 0 300 120',width:'100%'},document.getElementById('gripSvg'));
 el('line',{x1:20,y1:70,x2:280,y2:70,stroke:'#d9a861','stroke-width':12,'stroke-linecap':'round'},svg);el('ellipse',{cx:284,cy:70,rx:8,ry:6,fill:'#a8743a'},svg);
 el('circle',{cx:105,cy:70,r:12,fill:'none',stroke:'#C9A227','stroke-width':4},svg);
 el('text',{x:105,y:40,'text-anchor':'middle','font-size':13,'font-weight':800,fill:'#1F2A44'},svg).textContent='Ponto de apoio (≈ 1/3)';
 el('text',{x:105,y:104,'text-anchor':'middle','font-size':11,fill:'#5b6377'},svg).textContent='polegar + indicador';
 el('text',{x:265,y:104,'text-anchor':'middle','font-size':11,fill:'#5b6377'},svg).textContent='ponta';
 el('text',{x:30,y:104,'text-anchor':'middle','font-size':11,fill:'#5b6377'},svg).textContent='traseira';})();
/* ---------- EXERCÍCIOS ---------- */
var EX=[['ex_sem','Semínimas no chimbal, contando "1 2 3 4" em voz alta','60 BPM'],['ex_col','Colcheias no chimbal, contando "1 e 2 e"','60 → 80 BPM'],['ex_hk','Chimbal + bumbo no 1 e no 3','60 BPM'],['ex_hs','Chimbal + caixa no 2 e no 4','60 BPM'],['rock','Pop/rock básico completo','60 → 90 BPM'],['balada','Balada de louvor','65 BPM'],['extra','Pop com bumbo extra','70 → 95 BPM'],['ride','Pop no condução com ataque no 1','80 BPM'],['vir1','Ritmo + virada 1 (caixa no tempo 4)','70 BPM'],['vir2','Ritmo + virada 2 (descendo os tons)','70 BPM'],['vir3','Ritmo + virada 3 (tempos 3 e 4)','65 BPM'],['baiao','Baião simplificado (2/4)','70 → 90 BPM']];
var done={};try{done=JSON.parse(localStorage.getItem('sm_bat_ex')||'{}');}catch(e){}
var ul=document.getElementById('exl');EX.forEach(function(x,i){var li=document.createElement('li');li.className=done[i]?'done':'';
 li.innerHTML='<div><b>'+x[1]+'</b><small>Meta: '+x[2]+' · 4 vezes seguidas sem errar</small></div><button type="button">▶ Ouvir</button><input type="checkbox" aria-label="Concluído"'+(done[i]?' checked':'')+'>';
 li.querySelector('button').onclick=function(){load(x[0],true);document.getElementById('player').scrollIntoView({behavior:'smooth'});};
 li.querySelector('input').onchange=function(e){done[i]=e.target.checked;li.className=done[i]?'done':'';try{localStorage.setItem('sm_bat_ex',JSON.stringify(done));}catch(_){}}
 ul.appendChild(li);});
})();
