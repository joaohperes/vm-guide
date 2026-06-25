// ============================================================
// VM GUIDE — shell compartilhado (header, sidebar, busca global)
// ============================================================

// Índice global de páginas. Ordem = ordem da sidebar.
// cat = categoria (agrupador da sidebar). subtitle alimenta a busca.
const PAGES = [
  {id:'fisiologia',   file:'fisiologia.html',   cat:'Fundamentos',           label:'Fisiologia da VM',       title:'Fisiologia da VM com Pressão Positiva', subtitle:'Ciclo ventilatório, mecânica pulmonar e efeitos hemodinâmicos'},
  {id:'modos',        file:'modos.html',        cat:'Fundamentos',           label:'Modos de VM',            title:'Modos de Ventilação Mecânica',          subtitle:'AC-VC · AC-PC · SIMV-PSV · PSV'},
  {id:'parametros',   file:'parametros.html',   cat:'Fundamentos',           label:'Parâmetros iniciais',    title:'Parâmetros Iniciais',                   subtitle:'Configuração passo a passo (UpToDate / FCCS)'},
  {id:'sdra',         file:'sdra.html',         cat:'Patologias',            label:'SDRA',                   title:'SDRA — Ventilação Protetora (LTVV)',    subtitle:'Low Tidal Volume Ventilation'},
  {id:'prona',        file:'prona.html',        cat:'Patologias',            label:'Posição prona',          title:'Posição Prona na SDRA',                 subtitle:'Benefício de mortalidade na SDRA grave (PROSEVA)'},
  {id:'dpoc-asma',    file:'dpoc-asma.html',    cat:'Patologias',            label:'DPOC & Asma',            title:'DPOC & Asma — Hiperinsuflação Dinâmica',subtitle:'Air trapping e obstrução ao fluxo expiratório'},
  {id:'hipercapnia',  file:'hipercapnia.html',  cat:'Patologias',            label:'Hipercapnia permissiva', title:'Hipercapnia Permissiva',                subtitle:'Quando e como aceitar a elevação da PaCO₂'},
  {id:'tce',          file:'tce.html',          cat:'Patologias',            label:'VM no TCE',              title:'VM no TCE — Estratégia Neuroprotetora', subtitle:'Metas de PPC / PIC · Normoventilação'},
  {id:'complicacoes', file:'complicacoes.html', cat:'Segurança',             label:'Complicações da VM',     title:'Complicações da VM',                    subtitle:'Reconhecimento precoce, fisiopatologia e conduta'},
  {id:'dissincronia', file:'dissincronia.html', cat:'Segurança',             label:'Dissincronia P-V',       title:'Dissincronia Paciente-Ventilador',      subtitle:'Tipos, diagnóstico pelas curvas e conduta'},
  {id:'bnm',          file:'bnm.html',          cat:'Segurança',             label:'Bloqueio neuromuscular', title:'Bloqueio Neuromuscular na SDRA',        subtitle:'Quando paralisar, qual agente e por quanto tempo'},
  {id:'vni',          file:'vni.html',          cat:'Suporte não-invasivo',  label:'VNI & alto fluxo',       title:'VNI & Cânula Nasal de Alto Fluxo',      subtitle:'Quando evitar a IOT — e quando não insistir (ROX)'},
  {id:'desmame',      file:'desmame.html',      cat:'Desmame',               label:'SAT / SBT / Extubação',  title:'Desmame Ventilatório — SAT / SBT / Extubação', subtitle:'Critérios, protocolo e T-piece vs PSV baixo'},
  {id:'indutores',    file:'indutores.html',    cat:'Farmacologia',          label:'Indutores para RSI',     title:'Indutores para RSI',                    subtitle:'Perfil farmacológico e algoritmo por cenário'},
  {id:'sedoanalgesia',file:'sedoanalgesia.html',cat:'Farmacologia',          label:'Sedoanalgesia na UTI',   title:'Sedoanalgesia pós-IOT na UTI',          subtitle:'Sedativos, opioides e escalas de monitoramento'},
  {id:'calculadora',  file:'calculadora.html',  cat:'Referência',            label:'Calculadoras',           title:'Calculadoras',                          subtitle:'PBW/VC · Driving Pressure · VM · P/F · IRRS'},
  {id:'tabelas',      file:'tabelas.html',      cat:'Referência',            label:'Tabelas rápidas',        title:'Tabelas Rápidas',                       subtitle:'Consulta de plantão — situação vs estratégia'},
  {id:'pearls',       file:'pearls.html',       cat:'Caso clínico',          label:'Pearls & Pitfalls',      title:'Pearls & Pitfalls',                     subtitle:'Cenários de plantão: acerto, erro comum e o porquê do mecanismo'},
  {id:'quiz',         file:'quiz.html',         cat:'Caso clínico',          label:'Caso clínico / Quiz',    title:'Caso Clínico Interativo',               subtitle:'Quiz de múltipla escolha'},
  {id:'assistente',   file:'assistente.html',   cat:'Assistente IA',         label:'Assistente de conduta',  title:'Assistente de Conduta (IA)',            subtitle:'Cole a anamnese e receba sugestão de conduta ventilatória'}
];

// Caminho relativo até a raiz (páginas ficam na raiz, então '' basta).
function pageOf(id){return PAGES.find(p=>p.id===id);}
function currentPageId(){return document.body.dataset.page||'';}

// ------------------------------------------------------------
// SHELL: header + sidebar + overlay + busca + toast
// ------------------------------------------------------------
function buildShell(){
  const curId=currentPageId();
  // Header
  const header=document.createElement('header');
  header.className='header';
  header.innerHTML=
    '<a class="header-logo" href="index.html" style="text-decoration:none;display:flex;align-items:center;gap:7px"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1db88a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h8.5a2.5 2.5 0 1 0 -2.34 -3.24"/><path d="M3 12h15.5a2.5 2.5 0 1 1 -2.34 3.24"/><path d="M4 16h5.5a2.5 2.5 0 1 1 -2.34 3.24"/></svg>VMguide</a>'+
    '<span class="header-title">Ventilação Mecânica · Indutores · Sedoanalgesia</span>'+
    '<div class="header-actions">'+
      '<button class="btn-search" onclick="openSearch()">Buscar <kbd>⌘K</kbd></button>'+
      '<button class="btn-plantao" id="btnPlantao" onclick="togglePlantao()">Plantão</button>'+
      '<button class="menu-btn" onclick="toggleMenu()">☰ Menu</button>'+
    '</div>';

  const progress=document.createElement('div');progress.id='progress';
  const overlay=document.createElement('div');overlay.className='overlay';overlay.id='overlay';overlay.onclick=toggleMenu;
  const toast=document.createElement('div');toast.className='toast';toast.id='toast';

  // Sidebar agrupada por categoria
  const nav=document.createElement('nav');
  nav.className='sidebar';nav.id='sidebar';
  let html='';let lastCat=null;
  PAGES.forEach(p=>{
    if(p.cat!==lastCat){html+='<div class="sidebar-section">'+p.cat+'</div>';lastCat=p.cat;}
    const active=p.id===curId?' active':'';
    html+='<a class="nav-link'+active+'" href="'+p.file+'">'+p.label+'</a>';
  });
  nav.innerHTML=html;

  // Modal de busca
  const sb=document.createElement('div');sb.className='search-backdrop';sb.id='searchBackdrop';sb.onclick=closeSearch;
  const sm=document.createElement('div');sm.className='search-modal';sm.id='searchModal';sm.style.display='none';
  sm.onclick=e=>e.stopPropagation();
  sm.innerHTML='<input type="text" class="search-input" id="searchInput" placeholder="Buscar no guia… (ex: auto-PEEP, etomidato, prona)" autocomplete="off"><div class="search-results" id="searchResults"></div>';

  const b=document.body;
  b.insertBefore(toast,b.firstChild);
  b.insertBefore(sm,b.firstChild);
  b.insertBefore(sb,b.firstChild);
  b.insertBefore(nav,b.firstChild);
  b.insertBefore(overlay,b.firstChild);
  b.insertBefore(progress,b.firstChild);
  b.insertBefore(header,b.firstChild);
}

// ------------------------------------------------------------
// MODO PLANTÃO
// ------------------------------------------------------------
function setPlantaoBtn(on){
  const btn=document.getElementById('btnPlantao');
  if(!btn)return;
  if(on){btn.textContent='Sair do Plantão';btn.classList.add('active');}
  else{btn.textContent='Plantão';btn.classList.remove('active');}
}
function togglePlantao(){
  const on=document.body.classList.toggle('plantao-mode');
  setPlantaoBtn(on);
  try{localStorage.setItem('vmguide-plantao',on?'1':'0');}catch(e){}
}

// ------------------------------------------------------------
// SHARE LINKS + TOAST
// ------------------------------------------------------------
function copyLink(e,anchor){
  e.preventDefault();
  const url=window.location.origin+window.location.pathname+anchor;
  navigator.clipboard.writeText(url).then(()=>showToast('Link copiado!')).catch(()=>{
    const inp=document.createElement('input');inp.value=url;document.body.appendChild(inp);inp.select();document.execCommand('copy');document.body.removeChild(inp);showToast('Link copiado!');
  });
}
function showToast(msg){
  const t=document.getElementById('toast');if(!t)return;
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}

// ------------------------------------------------------------
// MENU MOBILE + PROGRESS
// ------------------------------------------------------------
function toggleMenu(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}
function initProgress(){
  window.addEventListener('scroll',()=>{
    const d=document.documentElement;
    const p=(d.scrollTop/(d.scrollHeight-d.clientHeight))*100;
    const el=document.getElementById('progress');if(el)el.style.width=p+'%';
  });
}

// ------------------------------------------------------------
// BUSCA GLOBAL (Cmd+K) — indexa PAGES; ao abrir, leva ao arquivo certo
// ------------------------------------------------------------
const searchIndex=[];
PAGES.forEach(p=>{
  searchIndex.push({title:p.title,ctx:'Seção',file:p.file});
  if(p.subtitle)searchIndex.push({title:p.subtitle,ctx:p.label,file:p.file});
});
let searchHits=[],searchSel=0;
function openSearch(){
  document.getElementById('searchBackdrop').classList.add('show');
  document.getElementById('searchModal').style.display='block';
  const inp=document.getElementById('searchInput');
  inp.value='';inp.focus();renderSearch('');
}
function closeSearch(){
  document.getElementById('searchBackdrop').classList.remove('show');
  document.getElementById('searchModal').style.display='none';
}
function norm(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function renderSearch(q){
  const res=document.getElementById('searchResults');
  const nq=norm(q.trim());
  searchHits=nq?searchIndex.filter(i=>norm(i.title).includes(nq)||norm(i.ctx).includes(nq)):searchIndex.filter(i=>i.ctx==='Seção');
  searchSel=0;
  if(!searchHits.length){res.innerHTML='<div class="search-empty">Nenhum resultado para "'+q+'"</div>';return;}
  res.innerHTML=searchHits.map((h,i)=>{
    let t=h.title;
    if(nq){const re=new RegExp('('+q.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');t=t.replace(re,'<mark>$1</mark>');}
    return '<a class="search-hit'+(i===0?' sel':'')+'" onclick="goToHit('+i+')"><div class="sh-title">'+t+'</div><div class="sh-ctx">'+h.ctx+'</div></a>';
  }).join('');
}
function goToHit(i){
  const h=searchHits[i];if(!h)return;
  window.location.href=h.file;
}
function moveSel(d){
  const hits=document.querySelectorAll('.search-hit');
  if(!hits.length)return;
  hits[searchSel]&&hits[searchSel].classList.remove('sel');
  searchSel=(searchSel+d+hits.length)%hits.length;
  hits[searchSel].classList.add('sel');
  hits[searchSel].scrollIntoView({block:'nearest'});
}
function initSearchKeys(){
  document.getElementById('searchInput').addEventListener('input',e=>renderSearch(e.target.value));
  document.addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();return;}
    const open=document.getElementById('searchModal').style.display==='block';
    if(!open)return;
    if(e.key==='Escape')closeSearch();
    else if(e.key==='ArrowDown'){e.preventDefault();moveSel(1);}
    else if(e.key==='ArrowUp'){e.preventDefault();moveSel(-1);}
    else if(e.key==='Enter'){e.preventDefault();goToHit(searchSel);}
  });
}

// ============================================================
// CALCULADORAS (rodam só se os elementos existirem na página)
// ============================================================
function calcPBW(){
  const h=parseFloat(document.getElementById('altura').value);
  const s=document.getElementById('sexo').value;
  if(!h||h<100||h>220){document.getElementById('calc-result').style.display='none';return}
  const pbw=s==='m'?50+0.91*(h-152.4):45.5+0.91*(h-152.4);
  document.getElementById('pbw-val').textContent=pbw.toFixed(1);
  document.getElementById('vc6-val').textContent=Math.round(pbw*6);
  document.getElementById('vc5-val').textContent=Math.round(pbw*5);
  document.getElementById('vc4-val').textContent=Math.round(pbw*4);
  document.getElementById('calc-result').style.display='block';
}
function calcDP(){
  const p=parseFloat(document.getElementById('pplat').value);
  const e=parseFloat(document.getElementById('peep-dp').value);
  if(isNaN(p)||isNaN(e)){document.getElementById('dp-result').style.display='none';return}
  const dp=p-e;
  const el=document.getElementById('dp-val');
  const st=document.getElementById('dp-status');
  el.textContent=dp.toFixed(1);
  if(dp<15){el.style.color='var(--teal)';st.textContent='Dentro da meta (< 15 cmH₂O)'}
  else if(dp<20){el.style.color='var(--amber)';st.textContent='Limítrofe — considerar ajuste de VC ou PEEP'}
  else{el.style.color='var(--red)';st.textContent='ACIMA DO ALVO — risco de VILI. Reduzir VC ou aumentar PEEP.'}
  document.getElementById('dp-result').style.display='block';
}
function calcVM(){
  const vc=parseFloat(document.getElementById('vc-vm').value);
  const fr=parseFloat(document.getElementById('fr-vm').value);
  if(isNaN(vc)||isNaN(fr)||vc<=0||fr<=0){document.getElementById('vm-result').style.display='none';return}
  const vm=(vc/1000)*fr;
  const el=document.getElementById('vm-val');
  const st=document.getElementById('vm-status');
  el.textContent=vm.toFixed(1);
  if(vm<4){el.style.color='var(--red)';st.textContent='Baixa — risco de hipercapnia e hipoventilação'}
  else if(vm<=8){el.style.color='var(--teal)';st.textContent='Normal (4–8 L/min)'}
  else if(vm<=12){el.style.color='var(--amber)';st.textContent='Elevada — avaliar alcalose ou drive alto'}
  else{el.style.color='var(--red)';st.textContent='Muito elevada — revisar parâmetros'}
  document.getElementById('vm-result').style.display='block';
}
function calcPF(){
  const pao2=parseFloat(document.getElementById('pao2').value);
  const fio2=parseFloat(document.getElementById('fio2').value);
  if(isNaN(pao2)||isNaN(fio2)||fio2<=0||fio2>1){document.getElementById('pf-result').style.display='none';return}
  const pf=pao2/fio2;
  const el=document.getElementById('pf-val');
  const st=document.getElementById('pf-status');
  el.textContent=Math.round(pf);
  if(pf>300){el.style.color='var(--teal)';st.textContent='Normal (sem SDRA)'}
  else if(pf>200){el.style.color='var(--amber)';st.textContent='SDRA leve (200–300) — Berlin 2012'}
  else if(pf>100){el.style.color='var(--red)';st.textContent='SDRA moderada (100–200) — Berlin 2012'}
  else{el.style.color='var(--red)';st.textContent='SDRA grave (< 100) — Berlin 2012'}
  document.getElementById('pf-result').style.display='block';
}
function calcIRRS(){
  const fr=parseFloat(document.getElementById('fr-irrs').value);
  const vc=parseFloat(document.getElementById('vc-irrs').value);
  if(isNaN(fr)||isNaN(vc)||vc<=0){document.getElementById('irrs-result').style.display='none';return}
  const irrs=fr/(vc/1000);
  const el=document.getElementById('irrs-val');
  const st=document.getElementById('irrs-status');
  el.textContent=Math.round(irrs);
  if(irrs<80){el.style.color='var(--teal)';st.textContent='Alta probabilidade de extubação bem-sucedida'}
  else if(irrs<105){el.style.color='var(--amber)';st.textContent='Limítrofe — SBT bem-sucedido, extubação com cuidado'}
  else{el.style.color='var(--red)';st.textContent='SBT com falha — não extubar'}
  document.getElementById('irrs-result').style.display='block';
}

// ============================================================
// QUIZ (só inicia se existir #quiz-container)
// ============================================================
const questions=[
  {
    caso:'Paciente masculino, 68 anos, 175 cm, 95 kg. SDRA por pneumonia (P/F = 140). IOT realizada. Ventilador configurado: AC-VC, VC 570 mL, FR 18, PEEP 10, FiO₂ 0,8. Medida da Pplat: 34 cmH₂O.',
    pergunta:'Qual é a conduta ventilatória mais adequada?',
    opcoes:[
      'Aumentar FR para 22 irpm para melhorar a oxigenação',
      'Reduzir VC para 6 mL/kg PBW (PBW = 75 kg → 450 mL) e reavalie Pplat em 15 min',
      'Aumentar PEEP para 14 cmH₂O conforme tabela ARDSnet',
      'Trocar para AC-PC com pressão inspiratória de 20 cmH₂O'
    ],
    correta:1,
    feedback:'O PBW para 175 cm/masc = 50 + 0,91×(175−152,4) = 70,6 kg. VC inicial = 70,6×6 = 424 mL. O VC de 570 mL é equivalente a ~8 mL/kg PBW — acima do alvo. Com Pplat 34 (>30 cmH₂O), a prioridade é reduzir o VC para 6 mL/kg PBW (~424 mL) e reavalie a Pplat. Aumentar PEEP com Pplat já elevada pioraria a driving pressure. O modo não é o problema aqui.'
  },
  {
    caso:'Paciente asmático, 32 anos, IOT de emergência por broncoespasmo grave. Ventilador: AC-VC, VC 500 mL, FR 16, PEEP 5, fluxo 40 L/min. Após 10 min: PA 70/40 mmHg, FC 130 bpm, curva de fluxo com fluxo expiratório que não retorna a zero.',
    pergunta:'Qual é a manobra diagnóstica e terapêutica mais imediata?',
    opcoes:[
      'Iniciar noradrenalina 0,1 mcg/kg/min para a hipotensão',
      'Realizar pausa inspiratória para medir Pplat',
      'Desconectar o circuito do tubo endotraqueal e permitir expiração passiva por 30–60 s',
      'Reduzir PEEP de 5 para 0 cmH₂O'
    ],
    correta:2,
    feedback:'A curva de fluxo com expiração que não retorna a zero é diagnóstica de auto-PEEP (PEEPi) por air trapping. Com hipotensão grave, o mecanismo é o mesmo do tamponamento: ↑ pressão intratorácica → ↓ retorno venoso → ↓ DC. A manobra imediata e potencialmente salvadora é desconectar o circuito — permite expiração passiva e alívio da hiperinsuflação dinâmica. UpToDate: "immediate disconnection... is a potentially life-saving maneuver." NÃO escalar DVA sem tentar isso primeiro.'
  },
  {
    caso:'TCE grave (GCS 6), TC com herniação uncal iminente. Precisa de IOT emergencial. PA 85/50 mmHg (choque hemorrágico). Sem acesso a cetamina no momento.',
    pergunta:'Qual indutor é mais adequado para RSI nessa situação?',
    opcoes:[
      'Propofol 1,5 mg/kg — reduz a PIC',
      'Midazolam 0,2 mg/kg — início mais suave',
      'Etomidato 0,15 mg/kg — neutro hemodinamicamente, preserva PPC',
      'Aguardar cetamina antes de intubar'
    ],
    correta:2,
    feedback:'Nesse cenário há conflito: TCE com herniação iminente (precisa proteger PIC) + hipotensão (precisa manter PPC). O propofol piora a hipotensão — contraindiciado. O midazolam também é hipotensor e tem onset lento. Aguardar é perigoso com herniação iminente. O etomidato em dose reduzida (0,15 mg/kg para choque) é o melhor indutor: neutro hemodinamicamente, preserva PPC, onset rápido. UpToDate: em TCE + hipotensão, "etomidate is the preferred induction agent."'
  },
  {
    caso:'Paciente em VM há 72h por SDRA. RASS −3 sob propofol 40 mcg/kg/min. FiO₂ agora em 0,4, PEEP 8, SpO₂ 95%. Equipe questiona quando iniciar avaliação de desmame.',
    pergunta:'Quais critérios esse paciente já atende para iniciar avaliação de desmame?',
    opcoes:[
      'Nenhum — SDRA contraindica desmame precoce',
      'SpO₂ ≥90% com FiO₂ ≤0,4 e PEEP ≤8 — mas falta avaliar drive respiratório (RASS −3 impede SBT)',
      'Todos os critérios — pode extubar imediatamente',
      'Deve aguardar gasometria com PaO₂ >80 mmHg antes de qualquer avaliação'
    ],
    correta:1,
    feedback:'O paciente atende aos critérios de oxigenação (SpO₂ 95% com FiO₂ 0,4 e PEEP 8) e causa em resolução. Porém, RASS −3 é sedação profunda demais para realizar SBT. O próximo passo é realizar SAT (Spontaneous Awakening Trial): suspender propofol e titular para RASS −1 a +1. Somente após SAT bem-sucedido realizar o SBT. Não há contraindicação de desmame em SDRA quando oxigenação está adequada — ao contrário, desmame precoce reduz VIDD.'
  },
  {
    caso:'Paciente em PSV 12 cmH₂O / PEEP 5, RASS −1. FR mostrada no ventilador: 28 irpm. FR programada: 12 irpm. Curva de pressão mostra deflexões negativas na fase expiratória sem disparo do ventilador.',
    pergunta:'Que tipo de dissincronia está presente e qual é a conduta inicial?',
    opcoes:[
      'Double triggering — reduzir sensibilidade de trigger',
      'Flow starvation — aumentar fluxo inspiratório para 80 L/min',
      'Trigger inefetivo — investigar auto-PEEP e reduzir threshold de trigger',
      'Delayed cycling — reduzir threshold de ciclagem em PSV'
    ],
    correta:2,
    feedback:'Deflexões negativas na fase expiratória sem disparo do ventilador = trigger inefetivo (missed trigger) — o esforço do paciente não é detectado. A diferença entre FR no display (28) e FR programada (12) mostra que há muitos esforços espontâneos. Causa mais comum: auto-PEEP (o paciente precisa "vencer" o PEEPi + threshold de trigger). Conduta: medir auto-PEEP (pausa expiratória), ↓ FR, ↑ fluxo inspiratório, PEEP extrínseco ≤80% PEEPi para equilibrar, e/ou reduzir threshold de trigger.'
  }
];
let currentQ=0,score=0,answered=false;
function renderQuestion(){
  const q=questions[currentQ];
  document.getElementById('quiz-case').innerHTML=q.caso;
  document.getElementById('quiz-question').textContent=q.pergunta;
  document.getElementById('quiz-progress').textContent=(currentQ+1)+' / '+questions.length;
  document.getElementById('quiz-feedback').className='quiz-feedback';
  document.getElementById('quiz-feedback').innerHTML='';
  document.getElementById('quiz-next-btn').style.display='none';
  answered=false;
  const opts=document.getElementById('quiz-options');
  opts.innerHTML='';
  const letters=['A','B','C','D'];
  q.opcoes.forEach((o,i)=>{
    const btn=document.createElement('button');
    btn.className='quiz-opt';
    btn.innerHTML='<span class="quiz-letter">'+letters[i]+'</span>'+o;
    btn.onclick=()=>answer(i);
    opts.appendChild(btn);
  });
}
function answer(idx){
  if(answered)return;
  answered=true;
  const q=questions[currentQ];
  const opts=document.querySelectorAll('.quiz-opt');
  opts.forEach((o,i)=>{
    o.classList.add('disabled');
    if(i===q.correta)o.classList.add('correct');
    else if(i===idx&&idx!==q.correta)o.classList.add('wrong');
  });
  const fb=document.getElementById('quiz-feedback');
  if(idx===q.correta){
    score++;
    fb.className='quiz-feedback correct show';
    fb.innerHTML='<strong>✓ Correto!</strong> '+q.feedback;
  }else{
    fb.className='quiz-feedback wrong show';
    fb.innerHTML='<strong>✗ Incorreto.</strong> '+q.feedback;
  }
  const nextBtn=document.getElementById('quiz-next-btn');
  nextBtn.style.display='inline-block';
  nextBtn.textContent=currentQ<questions.length-1?'Próxima questão →':'Ver resultado';
}
function nextQuestion(){
  currentQ++;
  if(currentQ>=questions.length){
    document.getElementById('quiz-question-screen').style.display='none';
    document.getElementById('quiz-score').classList.add('show');
    document.getElementById('score-num').textContent=score+'/'+questions.length;
  }else{
    renderQuestion();
  }
}
function restartQuiz(){
  currentQ=0;score=0;answered=false;
  document.getElementById('quiz-score').classList.remove('show');
  document.getElementById('quiz-question-screen').style.display='block';
  renderQuestion();
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded',()=>{
  buildShell();
  try{ if(localStorage.getItem('vmguide-plantao')==='1'){document.body.classList.add('plantao-mode');setPlantaoBtn(true);} }catch(e){}
  initProgress();
  initSearchKeys();
  if(document.getElementById('quiz-container'))renderQuestion();
});
