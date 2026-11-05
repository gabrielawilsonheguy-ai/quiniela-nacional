// Núcleo de Quiniela Nacional: 5 turnos, método α y β (Manual BETA). Una sola definición para las 3 apps.
(function(){
const LIM=67;
const RK="lw:nac-reglas-v1",reglas={r3:false,ent:"B"};
try{const x=JSON.parse(localStorage.getItem(RK)||"null");if(x&&typeof x.r3==="boolean")reglas.r3=x.r3;if(x&&(x.ent==="A"||x.ent==="B"))reglas.ent=x.ent}catch(e){}
function setR3(v){reglas.r3=!!v;try{localStorage.setItem(RK,JSON.stringify(reglas))}catch(e){}}
// Entrada a Análisis: "B" = 5 sorteos antes de Y mín (normal); "A" = LIM sorteos sin salir
function setEnt(v){reglas.ent=v==="A"?"A":"B";try{localStorage.setItem(RK,JSON.stringify(reglas))}catch(e){}}
const ANTES=5;
const fmt=iso=>{const[a,b,c]=iso.split("-");return c+"/"+b+"/"+a};
const ORD=["previa","primera","matutina","vespertina","nocturna"],HORA={previa:"10:15",primera:"12:00",matutina:"15:00",vespertina:"18:00",nocturna:"21:00"};
const nom=k=>k.charAt(0).toUpperCase()+k.slice(1);
// Lee la base por fecha; detecta sola los turnos (cualquier campo con 20 números).
function parse(j){const s=j&&j.sorteos||{},M={};
 for(const iso of Object.keys(s)){const o=s[iso];if(!o||typeof o!=="object")continue;
  for(const k of Object.keys(o)){const p=o[k];
   if(Array.isArray(p)&&p.length===20&&p.every(x=>/^\d{2,4}$/.test(String(x)))){
    (M[k]=M[k]||[]).push({k:iso,f:fmt(iso),u:p.map(x=>String(x).slice(-1)).join(""),d:p.map(x=>String(x).slice(-2,-1)).join("")})}}}
 const keys=Object.keys(M).sort((a,b)=>{const i=ORD.indexOf(a),j2=ORD.indexOf(b);return(i<0?99:i)-(j2<0?99:j2)||a.localeCompare(b)});
 return keys.map(k=>({id:k,nombre:nom(k),hora:HORA[k]||"",data:M[k].sort((a,b)=>a.k.localeCompare(b.k))}))}
const STK=[8100,9800,11800,14300,17200,20800,25100,30300,36500,44000,53200],PAGA=7;
const stakeY=(A,y)=>{const i=y-A.v1;return i>=0&&i<11?STK[i]:0};
function apuesta(A,lastY,hitY){
 if(A.v1===undefined)return{tot:0,premio:0,neto:0,hit:false};
 let tot=0;for(let y=A.v1;y<=Math.min(A.v2,lastY);y++)tot+=stakeY(A,y);
 const hit=hitY!=null&&hitY>=A.v1&&hitY<=A.v2;const premio=hit?PAGA*stakeY(A,hitY):0;
 return{tot,premio,neto:premio-tot,hit}}
const f2=b=>(2-b)/b+b;
function analizar(ser){
 const vistos=[],D=[];let canc=null,amax=1;
 for(let y=1;y<=ser.length;y++){const d=ser[y-1];
  if(!vistos.includes(d)){vistos.push(d);const x=vistos.length,a=x===1?1:Math.log(y)/Math.log(x);
   const it={y,d,x,a,rj:false};let bb=null;{const N=x-1;if(N>=2){const S=y-1;if(S>D[N-1].y)bb={N,S,b:Math.log(S)/Math.log(N)}}}D.push(it);
   if(!canc){amax=Math.max(amax,a);
    if(bb&&bb.b>=2)canc={regla:1,txt:"β "+bb.N+" llegó a 2",y,it:[it],b:bb};
    else if(bb&&bb.b<1)canc={regla:2,txt:"β menor que 1",y,it:[it],b:bb};
    // (el α ya no cancela: por ahora solo cancela β ≥ 2; el α se muestra para comparar)
    else if(y===8&&D.length===8)canc={regla:3,txt:"8 distintos en los 8 primeros sorteos",y,it:D.slice(-8)}
    else if(reglas.r3&&y===5&&D.length===5)canc={regla:3,txt:"5 distintos en los 5 primeros sorteos",y,it:D.slice(-5)}}}}
 if(canc)canc.it.forEach(z=>z.rj=true);
 const B=[];
 for(let N=2;N<D.length;N++){const S=D[N].y-1;if(S>D[N-1].y)B.push({N,S,b:Math.log(S)/Math.log(N)})}
 const A={Yact:ser.length,D,B,amax,canc,nd:D.length,bmax:null};
 const B8=B.filter(z=>z.N<=8);if(B8.length)A.bmax=Math.max(...B8.map(z=>z.b));
 if(!canc&&D.length>=9){
  if(A.bmax===null)A.sinB=true;
  else{const C=[A.bmax];let b=A.bmax;for(let k=0;k<3;k++){b=f2(b);C.push(b)}
   const Y=Math.min(100,Math.max(11,Math.ceil(Math.pow(10,b)-1e-9)));
   A.cad=C;A.yraw=Math.pow(10,b);A.Y=Y;A.v1=Y-10;A.v2=Y}}
 return A}
function sim(data,i,f){
 f=f||"u";const n=data.length;
 if(n<2)return{R:null,ep:null,cer:[]};
 const last={},disc=new Set(),cer=[],ac={};let ep=null,sale=null;
 const serie=(L,t)=>data.slice(L+1,t+1).map(x=>x[f][i]);
 for(let t=0;t<n;t++){
  const d=data[t][f][i];sale=null;
  if(disc.has(d)){for(let k=cer.length-1;k>=0;k--){const c=cer[k];if(c.dig===d&&c.tipo!=="salio"&&!c.post){c.post={t,Ys:t-c.L,fecha:data[t].k};break}}}
  let cand=null;
  if(Object.keys(last).length===10){let m=Infinity;for(const x in last)if(!disc.has(x)&&last[x]<m){m=last[x];cand=x}}
  if(cand!==null&&d===cand){const Lp=last[cand];sale={t,dig:cand,Lp};
   if(ep&&ep.dig===cand){const A=analizar(serie(Lp,t-1)),Ys=t-Lp;
    cer.push({pos:i,dig:cand,arr:data[Lp+1].k,L:Lp,tipo:"salio",t,fecha:data[t].k,Ys,A,dentro:A.v1!==undefined&&Ys>=A.v1&&Ys<=A.v2});ep=null}}
  last[d]=t;disc.delete(d);
  if(Object.keys(last).length===10){
   for(let g=0;g<10;g++){
    let c=null,m=Infinity;for(const x in last)if(!disc.has(x)&&last[x]<m){m=last[x];c=x}
    if(c===null)break;
    const L=last[c],gap=t-L;
    if(L>=t)break;
    if(!ep){
     if(reglas.ent==="A"){if(gap>=LIM)ep={dig:c,L,arr:data[L+1].k,t0:t,f0:data[t].k}}
     else{ // B: ya salieron los 9 distintos; entra 5 sorteos antes de Y mín
      if(!ac[L])ac[L]=analizar(serie(L,t));
      const A0=ac[L];
      if(A0.canc){disc.add(c);continue}
      if(A0.v1!==undefined&&gap>=A0.v1-ANTES)ep={dig:c,L,arr:data[L+1].k,t0:t,f0:data[t].k}}}
    if(!ep)break;
    const A=analizar(serie(L,t));
    if(A.canc||(A.v2!==undefined&&A.Yact>=A.v2)){
     cer.push({pos:i,dig:c,arr:ep.arr,L,tipo:A.canc?"canc":"ventana",t,fecha:data[t].k,Yc:A.Yact,A});
     disc.add(c);ep=null;continue}
    break}}}
 let R=null;
 if(sale){const{Lp,dig}=sale;
  R={cierres:[data[n-1].k],dig,gap:n-1-Lp-1,kDiag:data[Lp].k,kCirc:data[Lp+1].k,oldHasta:data[Lp].k,x:9,estado:"Salió "+dig+" ✓",sal:true}}
 else{
  const seen=Object.keys(last).length;
  let c=null,m=Infinity;for(const x in last)if((seen<10||!disc.has(x))&&last[x]<m){m=last[x];c=x}
  if(c!==null&&last[c]<n-1){const L=last[c];
   const dist=new Set();for(let t=L+1;t<n;t++)dist.add(data[t][f][i]);
   R={cierres:[],dig:c,gap:n-1-L,kDiag:data[L].k,kCirc:data[L+1].k,oldHasta:data[L].k,x:dist.size};
   if(seen<10||dist.size<9){R.estado="Búsqueda "+dist.size+"/10";R.proc=false}
   else if(ep&&ep.dig===c){R.estado="Análisis";R.ana=true}
   else{R.estado="En proceso "+dist.size+"/10";R.proc=true}
   if(seen>=10&&dist.size>=9){const A=analizar(serie(L,n-1));R.cancR=!!A.canc;
    if(!A.canc&&A.v1!==undefined){R.v1=A.v1;R.v2=A.v2;R.Y=A.Y;
     if(R.proc&&reglas.ent==="B"){const fa=A.v1-ANTES-R.gap;if(fa>0)R.estado="Entra en "+fa+" sort."}}}}}
 let epv=null;
 if(ep&&R&&R.ana)epv=Object.assign({},ep,{A:analizar(serie(ep.L,n-1))});
 const saleEp=cer.find(c=>c.tipo==="salio"&&c.t===n-1)||null;
 return{R,ep:epv,cer,saleEp}}
function seguimiento(data,i,f){return sim(data,i,f).R}
// Carga de la base (con copia local si no hay conexión)
const URL_DATA="https://gabrielawilsonheguy-ai.github.io/quiniela-bolillero/data/resultados.json",CK="lw:nac-cache-v1";
const g=k=>{try{return localStorage.getItem(k)}catch(e){return null}},st=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
async function load(){
 try{const r=await fetch(URL_DATA,{cache:"no-store"});if(!r.ok)throw new Error(r.status);const j=await r.json();
  st(CK,JSON.stringify({t:Date.now(),j:{updated:j.updated,sorteos:j.sorteos}}));
  return{turnos:parse(j),msg:"base: "+(j.updated?new Date(j.updated).toLocaleString("es-AR",{dateStyle:"short",timeStyle:"short"}):"")}}
 catch(e){let c=null;try{c=JSON.parse(g(CK))}catch(x){}
  if(c)return{turnos:parse(c.j),msg:"sin conexión, última copia"};
  return{turnos:[],msg:"no se pudo leer la base"}}}
// Turno elegido (se recuerda entre las 3 apps)
const TK="lw:nac-turno-v1";
const getTurno=()=>g(TK)||"primera",setTurno=id=>st(TK,id);
function pick(turnos){const id=getTurno();return turnos.find(t=>t.id===id)||turnos.find(t=>t.id==="primera")||turnos[0]||null}
// Cantidad de filas en Análisis por turno (para el puntito de cada botón)
function badges(turnos){const o={};for(const t of turnos){let n=0;for(const f of["u","d"])for(let i=0;i<20;i++){if(sim(t.data,i,f).ep)n++}o[t.id]=n}return o}
function turBar(el,turnos,sel,onPick){
 const b=badges(turnos);
 el.innerHTML=turnos.map(t=>`<button class="btn${sel&&sel.id===t.id?' on':''}" data-t="${t.id}">${t.nombre}<small> ${t.hora}</small>${b[t.id]?`<i class="bd">${b[t.id]}</i>`:""}</button>`).join("");
 el.onclick=e=>{const x=e.target.closest("[data-t]");if(x){setTurno(x.dataset.t);onPick(x.dataset.t)}}}
window.LN={LIM,ANTES,reglas,setR3,setEnt,fmt,parse,analizar,sim,seguimiento,apuesta,stakeY,STK,PAGA,load,pick,getTurno,setTurno,badges,turBar,URL_DATA};
})();
