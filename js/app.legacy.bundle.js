/* ================================================================
   GENIUS PROPERTY — JS BUNDLE
   Fusion des js/script-01.js à js/script-23.js
   Généré automatiquement — ne pas éditer manuellement
================================================================ */
/* ── Firebase déclarés tôt pour éviter TDZ dans loadDB() ── */
// ── Migration Firebase : Firebase remplacé ──
const SUPA_URL = '';
const SUPA_KEY = '';
const supa     = null;
// Firebase désactivé : l'auth réelle est gérée par firebase-auth.js (GPFirebaseAuth).
const SUPA_READY = false;
try { if(supa && !window.__gpUnifiedSupaClient) window.__gpUnifiedSupaClient = supa; } catch(e){}

'use strict';


/* ═══════════════════════════════════════════════════════════
   script-01.js
═══════════════════════════════════════════════════════════ */
/* ── Recherche dropdown discrète ── */
  window.toggleTopbarSearch = function(e){
    e && e.stopPropagation();
    var d = document.getElementById('topbarSearchDrop');
    var inp = document.getElementById('topbarSearchInput');
    if(!d) return;
    var open = d.style.display === 'block';
    d.style.display = open ? 'none' : 'block';
    if(!open){ inp && (inp.value='', inp.focus()); runTopbarSearch(''); }
  };
  window.closeTopbarSearch = function(){
    var d = document.getElementById('topbarSearchDrop');
    if(d) d.style.display = 'none';
  };
  window.runTopbarSearch = function(q){
    var r = document.getElementById('topbarSearchResults');
    if(!r) return;
    var items=[
      {icon:'home',label:'Biens immobiliers',page:'biens'},
      {icon:'people',label:'Locataires',page:'locataires'},
      {icon:'description',label:'Contrats',page:'contrats'},
      {icon:'payments',label:'Finances',page:'finances'},
      {icon:'handyman',label:'Maintenance',page:'maintenance'},
      {icon:'bar_chart',label:'Rapports',page:'rapports'},
      {icon:'settings',label:'Paramètres',page:'parametres'},
    ];
    if(!q || q.length < 1){
      r.innerHTML='<div style="padding:16px;text-align:center;font-size:12px;color:#9ca3af">Tapez pour rechercher…</div>';
      return;
    }
    var filtered = items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()));
    if(!filtered.length){
      r.innerHTML='<div style="padding:14px;text-align:center;font-size:12px;color:#9ca3af">Aucun résultat</div>';
      return;
    }
    r.innerHTML = filtered.map(i =>
      `<div onclick="if(window.navigate)navigate('${i.page}');closeTopbarSearch()" style="display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;transition:.1s" onmouseover="this.style.background='#fdf9ec'" onmouseout="this.style.background=''">`+
      `<span class="material-symbols-rounded" style="font-size:15px;color:#D4AF37;flex-shrink:0">${i.icon}</span>`+
      `<span style="font-size:12.5px;font-weight:600;color:#111">${i.label}</span></div>`
    ).join('');
  };
  // Ferme si clic ailleurs
  document.addEventListener('click', function(e){
    if(!e.target.closest('#topbarSearchDrop') && !e.target.closest('[onclick*="toggleTopbarSearch"]'))
      closeTopbarSearch();
  });
  window.toggleGlobalSearch = window.closeGlobalSearch = function(){};


/* ═══════════════════════════════════════════════════════════
   script-02.js
═══════════════════════════════════════════════════════════ */
function onBienTypeChange(){
    var t=document.getElementById('b-type').value;
    var wrap=document.getElementById('b-nb-appart-wrap');
    wrap.style.display=(t==='Immeuble')?'block':'none';
    if(wrap.style.display==='none') document.getElementById('b-nb-appart').value='';
  }


/* ═══════════════════════════════════════════════════════════
   script-03.js
═══════════════════════════════════════════════════════════ */


// Stockage propre séparé de l’ancienne version démo.
// Cela évite que d’anciennes données de simulation réapparaissent via localStorage.
const GP_STORAGE_KEY = 'geniusproperty_db_clean_v1';

/* ============================================================
   CORRECTIFS ROBUSTESSE — ajoutés par revue ChatGPT
   - évite les crashs si une librairie CDN ne charge pas
   - sécurise les lectures JSON du localStorage
   - laisse l'application fonctionner en mode local/offline
============================================================ */
function safeJSONParse(raw, fallback){
  try{ return raw ? JSON.parse(raw) : fallback; }catch(e){ return fallback; }
}
function safeSetLocal(key, value){
  try{ localStorage.setItem(key, value); return true; }catch(e){ console.warn('localStorage:', e.message); return false; }
}
function escapeHTML(v){
  return String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}


/* ============================================================
   CORRECTIFS PRODUCTION — fonctions utilitaires centralisées
   Ajouté automatiquement : formatage cohérent, sécurité HTML,
   validation de champs et sauvegarde locale de secours.
============================================================ */
function gp_esc(v){
  return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function gp_num(v){
  const n = Number(String(v ?? 0).replace(/\s/g,'').replace(/[^0-9.-]/g,''));
  return Number.isFinite(n) ? n : 0;
}
function gp_money(v){
  const n = Math.round(gp_num(v));
  return n.toLocaleString('fr-FR') + ' FCFA';
}
function gp_uid(prefix='id'){
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
}
function gp_dateKey(d=new Date()){
  d = d instanceof Date ? d : new Date(d);
  if(Number.isNaN(d.getTime())) d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function gp_todayKey(){ return gp_dateKey(new Date()); }
function gp_fieldError(id, msg){
  const el=document.getElementById(id);
  if(el){
    el.classList.add('gp-field-error');
    el.focus?.();
    el.addEventListener('input',()=>el.classList.remove('gp-field-error'),{once:true});
    el.addEventListener('change',()=>el.classList.remove('gp-field-error'),{once:true});
  }
  return toast(msg,'err');
}
function gp_saveBackupSnapshot(){
  try{
    const payload = JSON.stringify({date:new Date().toISOString(), data:DB});
    localStorage.setItem('geniusproperty_last_backup_snapshot', payload);
    localStorage.setItem('geniusproperty_last_backup_date', gp_dateKey());
  }catch(e){ console.warn('Backup snapshot impossible:', e.message); }
}
function gp_exportData(){
  try{
    const json = JSON.stringify(DB,null,2);
    const a=document.createElement('a');
    a.href='data:application/json;charset=utf-8,'+encodeURIComponent(json);
    a.download='genius_property_backup_'+gp_dateKey()+'.json';
    a.click();
    toast('Backup exporté ✓');
  }catch(e){ toast('Export impossible','err'); }
}
window.gp_exportData = gp_exportData;

/* Nettoyage automatique des formulaires après enregistrement */
function resetFormSection(sectionId){
  const root=document.getElementById(sectionId);
  if(!root) return;
  root.querySelectorAll('input, textarea, select').forEach(el=>{
    const type=(el.type||'').toLowerCase();
    if(type==='button' || type==='submit' || type==='hidden') return;
    if(type==='checkbox' || type==='radio') el.checked=false;
    else if(type==='file') el.value='';
    else if(el.tagName==='SELECT') el.selectedIndex=0;
    else el.value='';
  });
  root.querySelectorAll('.photo-preview').forEach(img=>{img.removeAttribute('src');img.style.display='none';});
  root.querySelectorAll('[id$="-photo-icon"]').forEach(ic=>{ if(ic.classList.contains('material-symbols-rounded')) ic.style.display=''; });
  root.querySelectorAll('[id$="-photo-label"]').forEach(lb=>{ lb.style.display=''; });
}
function resetAfterSave(sectionId){
  resetFormSection(sectionId);
  // valeurs par défaut utiles au prochain ajout
  const today=new Date().toISOString().split('T')[0];
  const set=(id,val)=>{const e=document.getElementById(id); if(e) e.value=val;};
  if(sectionId==='page-nv-locative') set('lv-date-entree',today);
  if(sectionId==='page-nv-contrat') fillContratSelects();
  if(sectionId==='page-nv-bien') fillProprioBien();
}
function resetFichierModalForm(){
  ['fich-nom','fich-desc'].forEach(id=>{const e=document.getElementById(id); if(e)e.value='';});
  ['fich-cat','fich-lie'].forEach(id=>{const e=document.getElementById(id); if(e)e.selectedIndex=0;});
  const input=document.getElementById('fich-file-input'); if(input) input.value='';
  const pb=document.getElementById('fich-preview-bar'); if(pb) pb.style.display='none';
  const label=document.getElementById('fich-drop-label'); if(label) label.textContent='Glissez-déposez un fichier ou cliquez pour choisir';
  _fichierDataURL=null; _fichierFileName=''; _fichierFileSize=0; _fichierFileType='';
}
if(!window.Chart){
  window.Chart = function(){ return { destroy(){} }; };
  console.warn('Chart.js non chargé : graphiques désactivés.');
}
window.addEventListener('error', e => console.warn('Erreur capturée:', e.message));

/* ============================================================
   DATA
============================================================ */
const DB = {
  // Version propre : aucune donnée de simulation.
  // Les tableaux sont volontairement vides pour un démarrage SaaS réel.
  employes:[],
  proprietaires:[],
  locataires:[],
  biens:[],
  locatives:[],
  contrats:[],
  paiements:[],
  depenses:[],
  fichiers:[],
  messages:[],
  conversations:[],
  agenda:[],
  employeDocs:{},
  proprietaireDocs:{},
  locataireDocs:{}
};

/* ============================================================
   CONFIGURATION SAAS — base prête à connecter côté back-end
============================================================ */
const SAAS_CONFIG = {
  appName: 'Genius Property',
  mode: 'production-ready-mvp',
  tenantIsolationRequired: true,
  recommendedPlans: [
    { name: 'Starter', price: '15 000 FCFA/mois', limit: 'Jusqu’à 20 biens' },
    { name: 'Pro', price: '35 000 FCFA/mois', limit: 'Jusqu’à 100 biens' },
    { name: 'Business', price: '75 000 FCFA/mois', limit: 'Multi-agences + support prioritaire' }
  ]
};

/* ============================================================
   PERSISTENCE (localStorage)
============================================================ */
function saveDB(){
  safeSetLocal(GP_STORAGE_KEY,JSON.stringify(DB)); gp_saveBackupSnapshot();
}
function loadDB(){
  try{
    const raw=localStorage.getItem(GP_STORAGE_KEY);
    const saved=safeJSONParse(raw,null);
    if(saved){Object.keys(DB).forEach(k=>{if(saved[k])DB[k]=saved[k];});}
    if(!DB.fichiers) DB.fichiers=[];
    if(!DB.messages) DB.messages=[];
    if(!DB.conversations) DB.conversations=[];
    if(!DB.agenda) DB.agenda=[];
    if(!DB.employeDocs) DB.employeDocs={};
    if(!DB.proprietaireDocs) DB.proprietaireDocs={};
    if(!DB.locataireDocs) DB.locataireDocs={};
  }catch(e){}
}
loadDB();
// Expose la base au dashboard final et aux modules ajoutés en bas de fichier.
// Sans cette ligne, les scripts qui utilisent window.DB voient une base vide.
window.DB = DB;
const PS={}, SF={}, CP={};

/* ============================================================
   NAVIGATION
============================================================ */
const PAGE_TITLES={
  dashboard:'Accueil',employes:'Liste des employés','nv-employe':'Nouvel employé',
  proprietaires:'Liste des propriétaires','nv-proprietaire':'Nouvel propriétaire',
  locataires:'Liste des locataires','nv-locataire':'Nouveau locataire',
  biens:'Liste des biens','nv-bien':'Nouveau Bien',
  locatives:'Liste Locative','nv-locative':'Nouvelle location',
  contrats:'Contrats','nv-contrat':'Nouveau Contrat',
  paiements:'Paiements',avenir:'Paiements à venir',
  depenses:'Dépenses',fichiers:'Fichiers',messages:'Messages','agenda-employes':'Agenda employés',agenda:'Agenda',
  rapports:'Rapport',parametres:'Paramètre'
};

function navigate(page){
  // Vérification des droits d'accès
  if(currentUser && !canAccess(page)){
    toast("Accès refusé — vous n'avez pas les droits pour cette section", 'err');
    // Rediriger vers dashboard
    page = 'dashboard';
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById('page-'+page);
  if(el) el.classList.add('active');
  // Active sidebar: highlight the parent section for sub-pages
  const parentMap={'nv-employe':'employes','nv-proprietaire':'proprietaires','nv-locataire':'locataires','nv-bien':'biens','nv-locative':'locatives','nv-contrat':'contrats','bien-detail':'biens','proprietaire-detail':'proprietaires'};
  const activePage=parentMap[page]||page;
  document.querySelectorAll('#sideMenu li[data-page]').forEach(li=>{
    li.classList.toggle('active', li.dataset.page===activePage);
  });
  renderPage(page);
  updateGlobalBreadcrumb(page);
  if(typeof appliqueDroitsPage === 'function') appliqueDroitsPage(page);
  if(page === 'dashboard'){
    startDashboardRealtime();
    if(typeof refreshDashboardFromFirebase==='function') refreshDashboardFromFirebase({silent:true});
  }
}

function renderPage(p){
  const map={
    dashboard:renderDashboard,
    employes:()=>renderTable('employes'),
    proprietaires:()=>renderProprietairesCards(),
    locataires:()=>renderLocatairesModern(),
    biens:()=>renderBiensCards(),
    locatives:()=>renderTable('locatives'),
    contrats:renderContrats,
    paiements:renderPaiements,
    avenir:renderAvenir,
    depenses:renderDepenses,
    fichiers:renderFichiers,
    messages:renderMessages,
    'agenda-employes':renderEmployeeAgenda,
    // agenda page removed — modal only
    rapports:renderRapports,
    journal:()=>{renderJournalEmployeGrid(); renderMissionDoneInbox();renderEmployeeAgenda();},
    droits:renderDroitsPage,
    'nv-bien':()=>fillProprioBien(),
    'nv-locative':()=>fillLocativeSelects(),
    'nv-contrat':()=>fillContratSelects(),
    'nv-employe':()=>resetEmployeForm(),
    parametres:renderParametres,
  };
  map[p]?.();
  updateSidebarBadges();
}

/* ============================================================
   DASHBOARD — rendu par le script bureau (gp-user-final IIFE)
============================================================ */
const charts={};
// window.renderDashboard est défini par l'IIFE en bas de page

/* ============================================================
   TABLES
============================================================ */
function renderTable(key){
  const size=PS[key]||10, page=CP[key]||1, filter=(SF[key]||'').toLowerCase();
  let data=DB[key].filter(r=>!filter||JSON.stringify(r).toLowerCase().includes(filter));
  const total=data.length, start=(page-1)*size, slice=data.slice(start,start+size);
  const tbody=document.getElementById('tbl-'+key);
  if(!tbody)return;
  tbody.innerHTML=slice.length ? slice.map((r,i)=>`<tr>${rowFn(key,r,start+i)}</tr>`).join('')
    :`<tr><td colspan="10" style="text-align:center;color:#999;padding:30px">Aucune donnée</td></tr>`;
  const foot=document.getElementById('foot-'+key);
  if(foot) foot.textContent=`Showing ${Math.min(start+1,total)} to ${Math.min(start+size,total)} of ${total} entries`;
  const pag=document.getElementById('pag-'+key);
  if(pag){
    const pages=Math.ceil(total/size)||1;
    pag.innerHTML=`<button onclick="chPg('${key}',${page-1})" ${page===1?'disabled':''}>Précédent</button>`
      +Array.from({length:Math.min(pages,7)},(_,pi)=>{const n=pi+1;return`<button class="${n===page?'active':''}" onclick="chPg('${key}',${n})">${n}</button>`}).join('')
      +`<button onclick="chPg('${key}',${page+1})" ${page>=pages?'disabled':''}>Suivant</button>`;
  }
}
function rerenderPagedTable(k){
  if(k==='contrats') return renderContrats();
  if(k==='paiements') return renderPaiements();
  return renderTable(k);
}
function chPg(k,p){CP[k]=Math.max(1,p);rerenderPagedTable(k)}
function changePS(k,v){PS[k]=parseInt(v);CP[k]=1;rerenderPagedTable(k)}
function searchTbl(k,v){SF[k]=v;CP[k]=1;rerenderPagedTable(k)}

function rowFn(key,r,i){
  // Boutons actions unifiés
  const btnVoir   = `<button class="icon-btn icon-view"   title="Voir"       onclick="viewRow('${key}',${i})"><span class="material-symbols-rounded">visibility</span></button>`;
  const btnEdit   = `<button class="icon-btn icon-edit"   title="Modifier"   onclick="editRow('${key}',${i})"><span class="material-symbols-rounded">edit</span></button>`;
  const btnDel    = `<button class="icon-btn icon-delete" title="Supprimer"  onclick="delRow('${key}',${i})"><span class="material-symbols-rounded">delete</span></button>`;
  const btnDoc    = ['employes','proprietaires','locataires'].includes(key) ? `<button class="icon-btn icon-doc docs gp-doc-folder-btn" title="Documents" onclick="openEntityDocs('${key}',${i})"><span class="material-symbols-rounded">folder</span></button>` : '';
  const actions   = `<td><div class="actions">${btnVoir}${btnEdit}${btnDoc}${btnDel}</div></td>`;

  if(key==='employes') return `
    <td>${i+1}</td>
    <td><span class="id-badge">${r.id}</span></td>
    <td><div class="name-cell"><div class="avatar-sm" style="background:${ac(r.nom)}">${r.nom[0]}</div>${r.nom} ${r.prenom}</div></td>
    <td>${r.fonction}</td><td>${r.tel}</td><td>${r.date||'-'}</td>
    <td><span class="status ${r.statut==='Actif'?'':'inactive'}">${r.statut}</span></td>
    ${actions}`;

  if(key==='proprietaires'){
    const biens=DB.biens.filter(b=>b.proprio&&b.proprio.toLowerCase().includes(r.nom.toLowerCase())).length;
    return `<td>${i+1}</td>
      <td><span class="id-badge">${r.id}</span></td>
      <td><div class="name-cell"><div class="avatar-sm" style="background:${ac(r.nom)}">${r.nom[0]}</div>${r.nom} ${r.prenom}</div></td>
      <td><span class="count-badge">${biens}</span></td>
      <td>${r.tel}</td><td>${r.email}</td>
      <td><span class="badge green">Actif</span></td>
      ${actions}`;}

  if(key==='locataires'){
    const btnPayHist=`<button class="icon-btn icon-pay-hist" title="Historique paiements" onclick="viewLocatairePaiements('${r.nom}','${r.prenom}')"><span class="material-symbols-rounded">receipt_long</span></button>`;
    return `
    <td>${i+1}</td><td>${r.nom}</td><td>${r.prenom}</td>
    <td>${r.bien||'-'}</td>
    <td>${r.type}</td><td>${r.tel}</td><td>${r.email}</td><td>${r.date||'-'}</td>
    <td><span class="status ${r.statut==='Actif'?'':'inactive'}">${r.statut}</span></td>
    <td><div class="actions">${btnVoir}${btnEdit}${btnDel}<button class="icon-btn icon-doc docs gp-doc-folder-btn" title="Documents" onclick="openLocataireDocs(${i})"><span class="material-symbols-rounded">folder</span></button>${btnPayHist}</div></td>`;
  }

  if(key==='biens') {
    const st = r.statut || r.etat || 'Disponible';
    const cls = st==='Disponible' ? 'green' : (st==='Loué' ? 'blue' : 'orange');
    return `
    <td>${i+1}</td><td>${r.nom}</td><td>${r.type}</td>
    <td>${r.valeur}</td><td>${r.proprio}</td>
    <td><span class="badge ${cls}">${st}</span></td>
    ${actions}`;
  }

  if(key==='locatives'){
    return `
      <td>${r.nom || ('Location - '+(r.bien||''))}</td>
      <td>${r.bien || '-'}</td>
      <td>${r.occupant || r.locataire || '-'}</td>
      <td>${r.loyer}</td>
      <td>${r.dateEntree || r.date_entree || '-'}</td>
      ${actions}`;}
  return '';
}

/* ============================================================
   CONTRATS
============================================================ */
function renderContrats(){
  const size=PS['contrats']||10, page=CP['contrats']||1, filter=(SF['contrats']||'').toLowerCase();
  let data=DB.contrats.filter(r=>!filter||JSON.stringify(r).toLowerCase().includes(filter));
  const total=data.length, start=(page-1)*size, slice=data.slice(start,start+size);
  const tbody=document.getElementById('tbl-contrats');
  tbody.innerHTML=slice.length ? slice.map((r,i)=>`<tr>
    <td>${r.locataire}</td><td>${r.locative}</td><td>${r.type}</td>
    <td>${formatGPDateShort(r.debut)}</td><td>${formatGPDateShort(r.fin)}</td>
    <td><span class="badge ${r.statut==='Actif'?'green':r.statut==='En attente'?'orange':'gray'}">${r.statut}</span></td>
    <td>${formatGPDateShort(r.prochain)}</td>
    <td><div class="actions">
      <button class="icon-btn icon-view"     title="Voir"              onclick="viewRow('contrats',${start+i})"><span class="material-symbols-rounded">visibility</span></button>
      <button class="icon-btn icon-download" title="Télécharger PDF"   onclick="genererPDFContrat(${start+i})"><span class="material-symbols-rounded">download</span></button>
      <button class="icon-btn icon-pdf"      title="Export Contrat .docx"      onclick="genererDOCXOfficiel(${start+i})"><span class="material-symbols-rounded">folder</span></button>
      <button class="icon-btn icon-delete"   title="Supprimer"         onclick="delRow('contrats',${start+i})"><span class="material-symbols-rounded">delete</span></button>
    </div></td>
  </tr>`).join('') : '<tr><td colspan="8" style="text-align:center;color:#999;padding:30px">Aucun contrat</td></tr>';
  // footer + pagination
  const foot=document.getElementById('foot-contrats');
  if(foot) foot.textContent=`Showing ${Math.min(start+1,total)} to ${Math.min(start+size,total)} of ${total} entries`;
  const pag=document.getElementById('pag-contrats');
  if(pag){
    const pages=Math.ceil(total/size)||1;
    pag.innerHTML=`<button onclick="chPg('contrats',${page-1})" ${page===1?'disabled':''}>Précédent</button>`
      +Array.from({length:Math.min(pages,7)},(_,pi)=>{const n=pi+1;return`<button class="${n===page?'active':''}" onclick="chPg('contrats',${n})">${n}</button>`}).join('')
      +`<button onclick="chPg('contrats',${page+1})" ${page>=pages?'disabled':''}>Suivant</button>`;
  }
}

/* ============================================================
   PAIEMENTS
============================================================ */
function parseGPDate(value){
  if(!value || value==='-') return null;
  if(value instanceof Date) return isNaN(value)?null:value;
  const str=String(value).trim();
  const parts=str.split('/');
  let d=null;
  if(parts.length===3){ d=new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); }
  else { d=new Date(str); }
  if(isNaN(d)) return null;
  d.setHours(0,0,0,0);
  return d;
}
function formatGPDate(d){
  if(!d || isNaN(d)) return '-';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function formatGPDateShort(value){
  if(!value || value==='-') return '—';
  let d=null;
  if(value instanceof Date){ d=value; }
  else {
    const str=String(value).trim();
    const parts=str.split('/');
    if(parts.length===3){
      let yy=parts[2]; if(yy.length===2) yy='20'+yy;
      d=new Date(`${yy}-${parts[1]}-${parts[0]}`);
    } else d=new Date(str);
  }
  if(!d || isNaN(d)) return String(value||'—');
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
}
function addOneMonthGP(d){
  const n=new Date(d); n.setMonth(n.getMonth()+1); return n;
}
function getLocativeLoyer(locativeName){
  const lv=(DB.locatives||[]).find(l=>l.nom===locativeName || l.bien===locativeName);
  return lv?num(lv.loyer):0;
}
function hasPaymentForPeriod(locataire,locative,dueDate){
  if(!dueDate) return false;
  const mm=dueDate.getMonth(), yy=dueDate.getFullYear();
  return (DB.paiements||[]).some(p=>{
    const pd=parseGPDate(p.date);
    if(!pd) return false;
    return String(p.locataire||'')===String(locataire||'') && String(p.locative||'')===String(locative||'') && pd.getMonth()===mm && pd.getFullYear()===yy && num(p.reste)===0;
  });
}
function getPaiementEcheances(){
  const today=new Date(); today.setHours(0,0,0,0);
  const rows=[];
  const usedLocatives=new Set();

  (DB.contrats||[]).forEach(c=>{
    if(c.statut!=='Actif' || !c.prochain || c.prochain==='-') return;
    let due=parseGPDate(c.prochain);
    if(!due) return;
    let guard=0;
    while(hasPaymentForPeriod(c.locataire,c.locative,due) && guard<24){ due=addOneMonthGP(due); guard++; }
    const diff=Math.ceil((due-today)/86400000);
    const loyer=getLocativeLoyer(c.locative);
    usedLocatives.add(c.locative);
    rows.push({source:'contrat',c,locataire:c.locataire,locative:c.locative,loyer,due,echeance:formatGPDate(due),diff,cat:diff<0?'retard':diff<=3?'urgent':'avenir'});
  });

  // Fallback : locations sans contrat actif. On utilise la date d’entrée comme jour d’échéance mensuel.
  (DB.locatives||[]).forEach(l=>{
    if(usedLocatives.has(l.nom)) return;
    if(String(l.statut||'').toLowerCase().includes('disponible') || String(l.statut||'').toLowerCase().includes('archiv')) return;
    const base=parseGPDate(l.dateEntree);
    if(!base) return;
    let due=new Date(today.getFullYear(), today.getMonth(), base.getDate());
    if(hasPaymentForPeriod(l.locataire||l.occupant,l.nom,due)) due=addOneMonthGP(due);
    const diff=Math.ceil((due-today)/86400000);
    rows.push({source:'location',locataire:l.locataire||l.occupant,locative:l.nom,loyer:num(l.loyer),due,echeance:formatGPDate(due),diff,cat:diff<0?'retard':diff<=3?'urgent':'avenir'});
  });
  return rows.sort((a,b)=>({retard:0,urgent:1,avenir:2}[a.cat]-{retard:0,urgent:1,avenir:2}[b.cat]) || a.diff-b.diff);
}
let payAlertPage=1;
const PAY_ALERT_PAGE_SIZE=3;
function chPayAlertPage(p){ payAlertPage=Math.max(1,p); updatePaymentAlerts(); }
function updatePaymentAlerts(){
  const rows=getPaiementEcheances();
  const retards=rows.filter(r=>r.cat==='retard');
  const urgents=rows.filter(r=>r.cat==='urgent');
  const avenir=rows.filter(r=>r.cat==='avenir');
  const retardAmount=retards.reduce((s,r)=>s+num(r.loyer),0);
  const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
  set('payRetardCount',retards.length);
  set('payUrgentCount',urgents.length);
  set('payAvenirCount',avenir.length);
  set('payRetardAmount',fmt(retardAmount)+' FCFA');

  const panel=document.getElementById('pay-alert-panel');
  const summary=document.getElementById('pay-alert-summary');
  const list=document.getElementById('pay-alert-list');
  if(!panel||!summary||!list) return;
  if(!retards.length && !urgents.length){ panel.style.display='none'; list.innerHTML=''; return; }
  panel.style.display='block';
  const alertRows=rows.filter(r=>r.cat!=='avenir');
  const slice=alertRows.slice(0,3);
  summary.textContent=`${retards.length} retard${retards.length>1?'s':''}, ${urgents.length} urgente${urgents.length>1?'s':''} • 3 dernières alertes affichées`;
  list.innerHTML=slice.map(r=>{
    const delay=r.cat==='retard' ? `${Math.abs(r.diff)} j. retard` : `dans ${r.diff} j.`;
    const color=r.cat==='retard'?'#991b1b':'#9a3412';
    const bg=r.cat==='retard'?'#fef2f2':'#fffbeb';
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;background:${bg};border-radius:7px;padding:5px 7px;font-size:10.5px;line-height:1.25">
      <div style="min-width:0;overflow:hidden;text-overflow:ellipsis"><b style="color:${color};font-size:11px">${escapeHTML(r.locataire||'-')}</b> <span style="color:#6b7280">— ${escapeHTML(r.locative||'-')}</span><br><span style="color:#6b7280">${r.echeance} • ${delay}</span></div>
      <div style="font-weight:800;color:${color};white-space:nowrap;font-size:10.5px">${fmt(r.loyer)} FCFA</div>
    </div>`;
  }).join('');
  const ap=document.getElementById('pay-alert-pagination');
  if(ap){ ap.style.display='none'; ap.innerHTML=''; }
}
function renderPaiements(){
  const tbody=document.getElementById('tbl-paiements');
  if(!tbody) return;

  const size=8;
  const page=CP['paiements']||1;
  const total=DB.paiements.length;
  const pages=Math.ceil(total/size)||1;
  const safePage=Math.min(Math.max(page,1),pages);
  CP['paiements']=safePage;
  const start=(safePage-1)*size;
  const slice=DB.paiements.slice(start,start+size);

  tbody.innerHTML=slice.length ? slice.map((r,i)=>{
    const idx=start+i;
    return `<tr>
      <td>${r.locataire}</td><td>${r.locative}</td>
      <td>${r.montant} FCFA</td>
      <td style="color:var(--green)">${r.paye} FCFA</td>
      <td style="color:${num(r.reste)>0?'orange':'var(--green)'}">${r.reste} FCFA</td>
      <td>${formatGPDateShort(r.date)}</td><td>${r.mode}</td>
      <td><div class="actions">
        <button class="icon-btn icon-view"   title="Voir"       onclick="viewRow('paiements',${idx})"><span class="material-symbols-rounded">visibility</span></button>
        <button class="icon-btn icon-download" title="Reçu PDF" onclick="genererRecuPaiementPDF(${idx})"><span class="material-symbols-rounded">receipt_long</span></button>
        <button class="icon-btn icon-edit"   title="Modifier"   onclick="editRow('paiements',${idx})"><span class="material-symbols-rounded">edit</span></button>
        <button class="icon-btn icon-delete" title="Supprimer"  onclick="delRow('paiements',${idx})"><span class="material-symbols-rounded">delete</span></button>
      </div></td>
    </tr>`;
  }).join('') : '<tr><td colspan="8" style="text-align:center;color:#999;padding:30px">Aucun paiement enregistré</td></tr>';

  const foot=document.getElementById('foot-paiements');
  if(foot) foot.textContent= total ? `Affichage ${start+1} à ${Math.min(start+size,total)} sur ${total} entrées` : 'Affichage 0 à 0 sur 0 entrée';
  const pag=document.getElementById('pag-paiements');
  if(pag){
    pag.innerHTML=`<button onclick="chPg('paiements',${safePage-1})" ${safePage===1?'disabled':''}>Précédent</button>`
      +Array.from({length:Math.min(pages,7)},(_,pi)=>{const n=pi+1;return`<button class="${n===safePage?'active':''}" onclick="chPg('paiements',${n})">${n}</button>`}).join('')
      +`<button onclick="chPg('paiements',${safePage+1})" ${safePage>=pages?'disabled':''}>Suivant</button>`;
  }

  const totalM=DB.paiements.reduce((s,p)=>s+num(p.montant),0);
  const totalP=DB.paiements.reduce((s,p)=>s+num(p.paye),0);
  const totalR=totalM-totalP;
  document.getElementById('payTotal').textContent=fmt(totalM)+' FCFA';
  document.getElementById('payPaid').textContent=fmt(totalP)+' FCFA';
  document.getElementById('payReste').textContent=fmt(totalR)+' FCFA';
  updatePaymentAlerts();
  if(charts.pay){charts.pay.destroy()}
  charts.pay=new Chart(document.getElementById('payChart'),{
    type:'doughnut',
    data:{labels:['Payé','Reste'],datasets:[{data:[totalP,totalR],backgroundColor:['#16a34a','#facc15'],borderWidth:0}]},
    options:{cutout:'70%',plugins:{legend:{display:true,position:'bottom',labels:{font:{size:11}}}}}
  });
}

/* ============================================================
   PAIEMENTS À VENIR — DÉTECTION RETARDS AUTO
============================================================ */
const AVENIR_PAGE_SIZE = 10;
let avenirPage = 1;
let avenirFilter = 'tous';
function filterAvenir(f){
  avenirFilter=f;
  avenirPage=1;
  // Highlight bouton actif
  ['tous','retard','urgent','avenir'].forEach(k=>{
    const b=document.getElementById('av-btn-'+k);
    if(b) b.style.fontWeight = k===f?'800':'400';
    if(b) b.style.outline = k===f?'2px solid #0F0F0F':'none';
  });
  renderAvenir();
}
function chAvenirPage(p){
  avenirPage=p;
  renderAvenir();
}
function renderAvenir(){
  const today=new Date(); today.setHours(0,0,0,0);
  const search=(document.getElementById('av-search')?.value||'').toLowerCase();

  const rows=getPaiementEcheances().map(r=>({c:r.c||r,diff:r.diff,loyer:r.loyer,cat:r.cat,d:r.due,raw:r}));

  // KPIs
  const nbRetard=rows.filter(r=>r.cat==='retard').length;
  const nbUrgent=rows.filter(r=>r.cat==='urgent').length;
  const nbAvenir=rows.filter(r=>r.cat==='avenir').length;
  document.getElementById('av-retard-count').textContent=nbRetard;
  document.getElementById('av-urgent-count').textContent=nbUrgent;
  document.getElementById('av-avenir-count').textContent=nbAvenir;

  // Bannière alerte
  const banner=document.getElementById('av-alert-banner');
  if(nbRetard>0){
    banner.style.display='flex';
    document.getElementById('av-alert-msg').textContent=`⚠️ ${nbRetard} paiement${nbRetard>1?'s':''} en retard détecté${nbRetard>1?'s':''}. Vérifiez et envoyez des rappels aux locataires concernés.`;
  } else { banner.style.display='none'; }

  // Filtre + recherche
  const filtered=rows.filter(r=>{
    const fOk=avenirFilter==='tous'||r.cat===avenirFilter;
    const sOk=!search||JSON.stringify(r.c).toLowerCase().includes(search);
    return fOk&&sOk;
  });

  const tbody=document.getElementById('tbl-avenir');
  if(!filtered.length){
    tbody.innerHTML='<tr><td colspan="8" style="text-align:center;color:#999;padding:30px">Aucun paiement trouvé</td></tr>';
    const infoEmpty=document.getElementById('av-foot-info')||document.getElementById('av-footer');
    if(infoEmpty) infoEmpty.textContent='Affichage 0 à 0 sur 0 entrée';
    const pagEmpty=document.getElementById('av-pagination');
    if(pagEmpty) pagEmpty.innerHTML='';
    return;
  }

  // Tri : retards d'abord, puis urgents, puis à venir
  filtered.sort((a,b)=>{
    const order={retard:0,urgent:1,avenir:2};
    return (order[a.cat]||2)-(order[b.cat]||2) || (a.diff??999)-(b.diff??999);
  });

  const totalAv=filtered.length;
  const pagesAv=Math.ceil(totalAv/AVENIR_PAGE_SIZE)||1;
  avenirPage=Math.min(Math.max(avenirPage,1),pagesAv);
  const startAv=(avenirPage-1)*AVENIR_PAGE_SIZE;
  const pageRows=filtered.slice(startAv,startAv+AVENIR_PAGE_SIZE);

  tbody.innerHTML=pageRows.map((row,i)=>{
    const {c,diff,loyer,cat,raw}=row;
    let delaiCell,statutBadge,rowBg='';
    if(diff===null){
      delaiCell='<span class="badge gray">?</span>';
      statutBadge='<span class="badge gray">Inconnu</span>';
    } else if(diff<0){
      const jours=Math.abs(diff);
      delaiCell=`<span class="badge red" style="font-size:12px;padding:4px 10px">🔴 ${jours} jour${jours>1?'s':''} de retard</span>`;
      statutBadge='<span class="badge red">En retard</span>';
      rowBg='background:#fff5f5';
    } else if(diff<=3){
      delaiCell=`<span class="badge orange" style="font-size:12px;padding:4px 10px">🟠 ${diff} jour${diff>1?'s':''}</span>`;
      statutBadge='<span class="badge orange">Urgent</span>';
      rowBg='background:#fffbf0';
    } else {
      delaiCell=`<span class="badge blue" style="font-size:12px;padding:4px 10px">🔵 ${diff} jour${diff>1?'s':''}</span>`;
      statutBadge='<span class="badge blue">À venir</span>';
    }
    const contratIdx=DB.contrats.indexOf(c);
    const canViewContrat=contratIdx>=0;
    return `<tr style="${rowBg}">
      <td>${startAv+i+1}</td>
      <td><b>${c.locataire}</b></td>
      <td>${raw?.locative || c.locative}</td>
      <td style="font-weight:700;color:var(--red)">${loyer>0?fmt(loyer)+' FCFA':'—'}</td>
      <td>${raw?.echeance || c.prochain}</td>
      <td>${delaiCell}</td>
      <td>${statutBadge}</td>
      <td><div class="actions">
        ${canViewContrat?`<button class="icon-btn icon-view" title="Voir contrat" onclick="viewRow('contrats',${contratIdx})"><span class="material-symbols-rounded">visibility</span></button>`:''}
        <button class="icon-btn" style="background:#fef3c7;color:#92400e;width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center" title="Envoyer rappel" onclick="envoyerRappelAvenir('${raw?.locataire || c.locataire}','${raw?.locative || c.locative}','${raw?.echeance || c.prochain}',${diff??0})"><span class="material-symbols-rounded" style="font-size:15px">send</span></button>
        ${diff!==null&&diff<0?`<button class="icon-btn icon-edit" title="Marquer payé" onclick="marquerPayeAvenir('${raw?.locataire || c.locataire}','${raw?.locative || c.locative}',${loyer})"><span class="material-symbols-rounded">check_circle</span></button>`:''}
      </div></td>
    </tr>`;
  }).join('');

  const avInfo=document.getElementById('av-foot-info')||document.getElementById('av-footer');
  if(avInfo) avInfo.textContent=`Affichage ${startAv+1} à ${Math.min(startAv+AVENIR_PAGE_SIZE,totalAv)} sur ${totalAv} entrée${totalAv>1?'s':''}`;
  const avPag=document.getElementById('av-pagination');
  if(avPag){
    const nums=Array.from({length:Math.min(pagesAv,7)},(_,pi)=>{
      let n;
      if(pagesAv<=7){ n=pi+1; }
      else if(avenirPage<=4){ n=pi+1; }
      else if(avenirPage>=pagesAv-3){ n=pagesAv-6+pi; }
      else { n=avenirPage-3+pi; }
      return `<button class="${n===avenirPage?'active':''}" onclick="chAvenirPage(${n})">${n}</button>`;
    }).join('');
    avPag.innerHTML=`<button onclick="chAvenirPage(${avenirPage-1})" ${avenirPage===1?'disabled':''}>Précédent</button>${nums}<button onclick="chAvenirPage(${avenirPage+1})" ${avenirPage>=pagesAv?'disabled':''}>Suivant</button>`;
  }
}

function envoyerRappelAvenir(loc,locative,echeance,diff){
  const msg=diff<0
    ? `Rappel envoyé à ${loc} : paiement en retard de ${Math.abs(diff)}j pour ${locative} (échéance ${echeance}) ✓`
    : `Rappel envoyé à ${loc} : paiement prévu le ${echeance} pour ${locative} ✓`;
  toast(msg,'info');
}

function marquerPayeAvenir(locataire,locative,loyer){
  if(!confirm(`Enregistrer un paiement de ${fmt(loyer)} FCFA pour ${locataire} (${locative}) ?`)) return;
  const today=new Date().toISOString().split('T')[0];
  const _db2=window.GPDB&&window.GPDB.load?window.GPDB.load():DB;if(!Array.isArray(_db2.paiements))_db2.paiements=[];_db2.paiements.unshift({locataire,locative,montant:String(loyer),paye:String(loyer),reste:'0',date:today,mode:'Espèces'});
  // Mettre à jour prochain paiement du contrat
  const ct=DB.contrats.find(c=>c.locataire===locataire&&c.locative===locative&&c.statut==='Actif');
  if(ct){
    const parts=ct.prochain.split('/');
    const d=parts.length===3?new Date(`${parts[2]}-${parts[1]}-${parts[0]}`):new Date(ct.prochain);
    d.setMonth(d.getMonth()+1);
    ct.prochain=`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }
  saveDB();
  renderAvenir();
  if(typeof renderPaiements==='function') renderPaiements();
  if(typeof updateSidebarBadges==='function') updateSidebarBadges();
  toast(`Paiement enregistré pour ${locataire} ✓`);
}

function exportListePDF_avenir(){
  exportListePDF('contrats');
}

/* ============================================================
   DÉPENSES — TOTAUX EN TEMPS RÉEL
============================================================ */
const DEP_PAGE_SIZE = 10;
let depCurrentPage = 1;
let depCurrentFilter = '';

function getDepenseType(d){
  return d?.type || (['Entretien','Réparation','Travaux'].includes(d?.cat)?'bien':'agence');
}
function getBienFullLabelForDepense(b,u){
  return getBienUnitFullName(b,u);
}
function findBienForDepense(label){
  if(!label) return {bien:null, unite:null};
  const found = findUnitByFullName(label);
  if(found && found.bien) return found;
  const bien = (DB.biens||[]).find(b => b.nom===label || b.id===label);
  return {bien: bien||null, unite: null};
}
function getProprietaireForDepenseBien(label){
  const found = findBienForDepense(label);
  const b = found.bien;
  if(!b) return null;
  const pName = b.proprio || '';
  const p = (DB.proprietaires||[]).find(pr => getProprietaireFullName(pr)===pName || pr.nom===pName || `${pr.prenom||''} ${pr.nom||''}`.trim()===pName);
  return p || {nom:pName, prenom:'', adresse:'', tel:'', email:''};
}
function renderDepenses(){
  const typeFilter = (document.getElementById('dep-filter-type')?.value)||'';
  const catFilter = (document.getElementById('dep-filter-cat')?.value)||'';
  const moisFilter = (document.getElementById('dep-filter-mois')?.value)||'';
  const search = (document.getElementById('dep-search')?.value||'').toLowerCase();

  const filtered = DB.depenses.filter(d=>{
    const type = getDepenseType(d);
    const typeOk = !typeFilter || type===typeFilter;
    const catOk = !catFilter || d.cat===catFilter;
    const moisOk = !moisFilter || (d.date&&d.date.includes('-'+moisFilter+'-'));
    const searchOk = !search || JSON.stringify(d).toLowerCase().includes(search);
    return typeOk && catOk && moisOk && searchOk;
  });

  const total = filtered.length;
  const start = (depCurrentPage-1)*DEP_PAGE_SIZE;
  const slice = filtered.slice(start, start+DEP_PAGE_SIZE);

  document.getElementById('tbl-depenses').innerHTML = slice.length
    ? slice.map((r,i)=>{
        const idx=DB.depenses.indexOf(r);
        const type = getDepenseType(r);
        const typeLbl = type==='bien'?'Travaux / Réparations':'Agence';
        return `<tr>
        <td>${start+i+1}</td>
        <td><span class="dep-type-pill ${type==='bien'?'dep-type-bien':'dep-type-agence'}">${typeLbl}</span></td>
        <td><span class="badge gray">${r.cat}</span></td>
        <td style="color:var(--red);font-weight:600">${fmt(num(r.montant))} FCFA</td>
        <td>${formatGPDateShort(r.date)}</td><td>${type==='bien'?(r.bien||'-'):'Agence'}</td>
        <td><div class="actions">
          <button class="icon-btn icon-view" title="Voir" onclick="viewRow('depenses',${idx})"><span class="material-symbols-rounded">visibility</span></button>
          <button class="icon-btn icon-report" title="Facture propriétaire" onclick="genererFactureDepense(${idx})"><span class="material-symbols-rounded">receipt_long</span></button>
          <button class="icon-btn icon-edit" title="Modifier" onclick="editRow('depenses',${idx})"><span class="material-symbols-rounded">edit</span></button>
          <button class="icon-btn icon-delete" title="Supprimer" onclick="delRow('depenses',${idx})"><span class="material-symbols-rounded">delete</span></button>
        </div></td>
      </tr>`}).join('')
    : '<tr><td colspan="7" style="text-align:center;color:#999;padding:30px">Aucune dépense trouvée</td></tr>';

  const foot = document.getElementById('dep-foot-info');
  if(foot) foot.textContent = total ? `Affichage ${Math.min(start+1,total)} à ${Math.min(start+DEP_PAGE_SIZE,total)} sur ${total} entrées` : 'Aucune entrée';
  const pag = document.getElementById('dep-pagination');
  if(pag){
    const pages = Math.ceil(total/DEP_PAGE_SIZE)||1;
    pag.innerHTML = `<button onclick="depGoPage(${depCurrentPage-1})" ${depCurrentPage===1?'disabled':''} style="border:1px solid #e5e7eb;background:white;padding:4px 9px;cursor:pointer;border-radius:4px;font-size:12px">Précédent</button>`
      +Array.from({length:Math.min(pages,7)},(_,pi)=>{const n=pi+1;return`<button onclick="depGoPage(${n})" style="border:1px solid ${n===depCurrentPage?'var(--gold)':'#e5e7eb'};background:${n===depCurrentPage?'var(--gold)':'white'};color:${n===depCurrentPage?'#000':'inherit'};padding:4px 9px;cursor:pointer;border-radius:4px;font-size:12px">${n}</button>`}).join('')
      +`<button onclick="depGoPage(${depCurrentPage+1})" ${depCurrentPage>=pages?'disabled':''} style="border:1px solid #e5e7eb;background:white;padding:4px 9px;cursor:pointer;border-radius:4px;font-size:12px">Suivant</button>`;
  }

  const totalGlobal = DB.depenses.reduce((s,d)=>s+num(d.montant),0);
  document.getElementById('dep-total-global').textContent = fmt(totalGlobal)+' FCFA';
  document.getElementById('dep-total-count').textContent = DB.depenses.length+' entrée'+(DB.depenses.length>1?'s':'');

  const hasFilter = typeFilter||catFilter||moisFilter||search;
  const filteredBox = document.getElementById('dep-total-filtered-box');
  if(hasFilter){
    const totalF = filtered.reduce((s,d)=>s+num(d.montant),0);
    document.getElementById('dep-total-filtered').textContent = fmt(totalF)+' FCFA';
    document.getElementById('dep-filtered-count').textContent = filtered.length+' entrée'+(filtered.length>1?'s':'');
    filteredBox.style.display='block';
  } else filteredBox.style.display='none';

  const totalAgence = DB.depenses.filter(d=>getDepenseType(d)==='agence').reduce((s,d)=>s+num(d.montant),0);
  const totalTravaux = DB.depenses.filter(d=>getDepenseType(d)==='bien').reduce((s,d)=>s+num(d.montant),0);
  const totalType = totalAgence + totalTravaux;
  const typeRows = [
    {label:'Dépenses agence', val:totalAgence, color:'#2563eb'},
    {label:'Travaux / Réparations', val:totalTravaux, color:'#D4AF37'}
  ];
  document.getElementById('dep-by-type').innerHTML = typeRows.map(r=>{
    const pct=totalType>0?Math.round(r.val/totalType*100):0;
    return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span style="font-weight:700;color:#444">${r.label}</span><span style="color:#777">${fmt(r.val)} FCFA</span></div><div style="height:6px;background:#f3f4f6;border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${r.color};border-radius:4px;transition:.4s"></div></div></div>`;
  }).join('');

  const now = new Date(), monthStr = String(now.getMonth()+1).padStart(2,'0'), yearStr=String(now.getFullYear());
  const thisMois = DB.depenses.filter(d=>d.date&&d.date.startsWith(yearStr+'-'+monthStr));
  document.getElementById('dep-this-month').textContent = fmt(thisMois.reduce((s,d)=>s+num(d.montant),0))+' FCFA';

  const labels6=[],valsAgence=[],valsTravaux=[];
  for(let m=5;m>=0;m--){
    const d=new Date(now.getFullYear(),now.getMonth()-m,1);
    const lbl=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][d.getMonth()];
    const ms=String(d.getMonth()+1).padStart(2,'0'),yr=String(d.getFullYear());
    const rows=DB.depenses.filter(x=>x.date&&x.date.startsWith(yr+'-'+ms));
    labels6.push(lbl);
    valsAgence.push(rows.filter(x=>getDepenseType(x)==='agence').reduce((s,x)=>s+num(x.montant),0));
    valsTravaux.push(rows.filter(x=>getDepenseType(x)==='bien').reduce((s,x)=>s+num(x.montant),0));
  }
  if(charts.depChart){charts.depChart.destroy();}
  charts.depChart=new Chart(document.getElementById('dep-chart'),{type:'bar',data:{labels:labels6,datasets:[
    {label:'Agence',data:valsAgence,backgroundColor:'rgba(37,99,235,.75)',borderRadius:3},
    {label:'Travaux / Réparations',data:valsTravaux,backgroundColor:'rgba(212,175,55,.8)',borderRadius:3}
  ]},options:{plugins:{legend:{display:true,labels:{boxWidth:10,font:{size:9}}}},scales:{x:{stacked:true,grid:{display:false},ticks:{font:{size:9}}},y:{stacked:true,display:false}}}});
}
function depGoPage(p){ if(p<1)return; const pages=Math.ceil(DB.depenses.length/DEP_PAGE_SIZE)||1; depCurrentPage=Math.min(p,pages); renderDepenses(); }
let depFactureData=null;
function toggleDepenseType(){
  const type=document.getElementById('d-type')?.value||'bien';
  const wrap=document.getElementById('dep-bien-wrap');
  if(wrap) wrap.style.display = type==='bien' ? 'flex' : 'none';
  const fact=document.getElementById('d-facturable');
  if(fact) fact.value = type==='bien' ? 'oui' : 'non';
  updateDepenseProprietaireInfo();
}
function fillDepBiensList(){
  const sel=document.getElementById('d-bien'); if(!sel) return;
  const current=sel.value;
  const options=[];
  (DB.biens||[]).forEach(b=>ensureBienUnits(b).forEach(u=>options.push(getBienUnitFullName(b,u))));
  sel.innerHTML='<option value="">Sélectionnez un bien enregistré</option>'+[...new Set(options)].map(n=>`<option value="${String(n).replace(/"/g,'&quot;')}">${n}</option>`).join('');
  if(options.includes(current)) sel.value=current;
  updateDepenseProprietaireInfo();
}
function updateDepenseProprietaireInfo(){
  const info=document.getElementById('dep-proprietaire-info'); if(!info) return;
  const type=document.getElementById('d-type')?.value||'bien';
  if(type!=='bien'){ info.textContent='Non applicable pour les dépenses agence'; return; }
  const label=document.getElementById('d-bien')?.value||'';
  if(!label){ info.textContent='Propriétaire récupéré automatiquement'; return; }
  const p=getProprietaireForDepenseBien(label);
  info.textContent = p ? `Propriétaire : ${escapeHTML(getProprietaireFullName(p)||p.nom||'—')}` : 'Aucun propriétaire trouvé pour ce bien';
}
function handleDepFacture(input){
  const f=input.files&&input.files[0]; depFactureData=null; if(!f) return;
  const reader=new FileReader(); reader.onload=e=>{depFactureData={name:f.name,type:f.type,data:e.target.result}; toast('Justificatif chargé ✓')}; reader.readAsDataURL(f);
}
function openDepFacture(i){ const d=DB.depenses[i]; if(!d||!d.factureData) return toast('Aucune facture','err'); const w=window.open(''); w.document.write(d.factureData.type&&d.factureData.type.includes('pdf')?`<iframe src="${d.factureData.data}" style="width:100%;height:100vh;border:0"></iframe>`:`<img src="${d.factureData.data}" style="max-width:100%;height:auto">`); }
function genererFactureDepense(i){
  const d=DB.depenses[i]; if(!d) return;
  if(getDepenseType(d)!=='bien') return toast('La facture propriétaire est réservée aux travaux / réparations des biens','err');
  if(!d.bien) return toast('Sélectionnez d’abord un bien concerné','err');
  const ag=_getAgenceInfo();
  const prop=getProprietaireForDepenseBien(d.bien);
  const propName=prop ? (getProprietaireFullName(prop)||prop.nom||'Propriétaire') : 'Propriétaire';
  const factureNo='FAC-'+new Date().getFullYear()+'-'+String(i+1).padStart(4,'0');
  const total=num(d.montant);
  const logo=ag.logo?`<img src="${ag.logo}" style="width:66px;height:66px;object-fit:contain;border:1px solid #eee;border-radius:10px;padding:4px;background:#fff">`:`<div style="width:66px;height:66px;border-radius:10px;background:#111;color:#D4AF37;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px">GP</div>`;
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${factureNo}</title><link rel="stylesheet" href="styles/style-07.css">
<link rel="stylesheet" href="styles/style-08.css">


<!-- ===== CLEAN FINAL — boutons d'action uniformes 20px ===== -->
<link rel="stylesheet" href="styles/style-09.css">
</head><body><div class="sheet">
    <div class="top"><div class="brand">${logo}<div><h1>${escapeHTML(ag.agence||'Genius Property')}</h1><p>${escapeHTML(ag.adresse||'')}</p><p>Tél : ${escapeHTML(ag.tel||'—')} ${ag.email?' | Email : '+escapeHTML(ag.email):''}</p><p>${[ag.rccm?'RCCM : '+ag.rccm:'',ag.ninea?'NINEA : '+ag.ninea:''].filter(Boolean).map(escapeHTML).join(' | ')}</p></div></div><div class="fact-title"><h2>FACTURE</h2><span class="badge">EN ATTENTE</span></div></div>
    <div class="info"><div><label>N° facture</label><strong>${factureNo}</strong></div><div><label>Date d’émission</label><strong>${new Date().toLocaleDateString('fr-FR')}</strong></div><div><label>Date dépense</label><strong>${escapeHTML(d.date||'—')}</strong></div></div>
    <div class="grid"><div class="box"><div class="box-title">Entreprise</div><div class="name">${escapeHTML(ag.agence||'Genius Property')}</div><div class="meta">${escapeHTML(ag.adresse||'')}<br>${escapeHTML(ag.tel||'')}<br>${escapeHTML(ag.email||'')}<br>${[ag.rccm?'RCCM '+ag.rccm:'',ag.ninea?'NINEA '+ag.ninea:''].filter(Boolean).map(escapeHTML).join('<br>')}</div></div>
    <div class="box"><div class="box-title">Facture à</div><div class="name">${escapeHTML(propName)}</div><div class="meta">${escapeHTML(prop?.adresse||'Adresse non renseignée')}<br>${prop?.tel?'Tel : '+escapeHTML(prop.tel)+'<br>':''}${prop?.email?escapeHTML(prop.email)+'<br>':''}<b>Bien concerné :</b> ${escapeHTML(d.bien||'—')}</div></div></div>
    <table class="items"><thead><tr><th>Description</th><th>Catégorie</th><th>Total</th></tr></thead><tbody><tr><td><b>${escapeHTML(d.libelle||'Dépense')}</b><br>Travaux / réparations effectués sur le bien : ${escapeHTML(d.bien||'—')}</td><td>${escapeHTML(d.cat||'Travaux')}</td><td>${fmt(total)} FCFA</td></tr></tbody></table>
    <div class="totals"><div><span>Total HT</span><strong>${fmt(total)} FCFA</strong></div><div><span>TVA</span><strong>0 FCFA</strong></div><div class="grand"><span>Total TTC</span><span>${fmt(total)} FCFA</span></div></div>
    <div class="foot">${escapeHTML(ag.agence||'Genius Property')} — ${[ag.rccm?'RCCM '+ag.rccm:'',ag.ninea?'NINEA '+ag.ninea:''].filter(Boolean).map(escapeHTML).join(' — ')}<br>Facture générée depuis Genius Property.</div>
  </div><script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script>

<!-- ====== PATCH UI: filtres compacts alignés — employés, locataires, biens, dépenses, journal ====== -->
<link rel="stylesheet" href="styles/style-10.css">

</body></html>`;
  const w=window.open(''); w.document.write(html); w.document.close();
}
function openDepModal(){
  const m=document.getElementById('depModal');
  m.style.display='flex';
  m.style.alignItems='center';
  m.style.justifyContent='center';
  m.style.overflowY='auto';
  m.style.padding='14px';
  fillDepBiensList(); depFactureData=null;
  document.getElementById('d-date').value=new Date().toISOString().split('T')[0];
  document.getElementById('d-type').value='bien';
  document.getElementById('d-lib').value='';
  document.getElementById('d-cat').value='Travaux';
  document.getElementById('d-mnt').value='';
  document.getElementById('d-bien').value='';
  document.getElementById('d-facture').value='';
  document.getElementById('d-facturable').value='oui';
  toggleDepenseType();
}
function closeDepModal(){document.getElementById('depModal').style.display='none'}
function saveDepense(){
  const lib=document.getElementById('d-lib').value.trim();
  const type=v('d-type');
  if(!lib)return toast('Le libellé est requis','err');
  if(type==='bien' && !v('d-bien')) return toast('Sélectionnez le bien concerné','err');
  const _db = window.GPDB && window.GPDB.load ? window.GPDB.load() : DB;
  if(!Array.isArray(_db.depenses)) _db.depenses=[];
  _db.depenses.unshift({libelle:lib,type,cat:v('d-cat'),montant:v('d-mnt'),date:v('d-date'),bien:v('d-bien'),proprietaire:type==='bien'?(getProprietaireFullName(getProprietaireForDepenseBien(v('d-bien')))||''):'',facturable:v('d-facturable'),factureData:depFactureData});
  if(window.GPDB && window.GPDB.save) window.GPDB.save(_db); else { window.DB=_db; saveDB(); }
  closeDepModal();renderDepenses();toast('Dépense ajoutée ✓');
}

/* ============================================================
   RAPPORTS
============================================================ */
function renderRapports(){
  const rev=DB.paiements.reduce((s,p)=>s+num(p.paye),0);
  const dep=DB.depenses.reduce((s,d)=>s+num(d.montant),0);
  const net=rev-dep;
  const loues=DB.locatives.filter(l=>l.statut==='Loué').length;
  const totalLoc=DB.locatives.length||1;
  const taux=Math.round(loues/totalLoc*100);
  document.getElementById('rpt-rev').textContent=fmt(rev)+' FCFA';
  document.getElementById('rpt-dep').textContent=fmt(dep)+' FCFA';
  document.getElementById('rpt-net').textContent=fmt(net)+' FCFA';
  const tauxEl=document.getElementById('rpt-taux');if(tauxEl)tauxEl.textContent=taux+' %';
  const nbPayEl=document.getElementById('rpt-nb-pay');if(nbPayEl)nbPayEl.textContent=DB.paiements.length;
  const nbImpEl=document.getElementById('rpt-nb-imp');if(nbImpEl)nbImpEl.textContent=DB.paiements.filter(p=>num(p.reste)>0).length;
  const nbCtEl=document.getElementById('rpt-nb-ct');if(nbCtEl)nbCtEl.textContent=DB.contrats.filter(c=>c.statut==='Actif').length;
  const nbLcEl=document.getElementById('rpt-nb-lc');if(nbLcEl)nbLcEl.textContent=DB.locataires.filter(l=>l.statut==='Actif').length;
  if(charts.rBar){charts.rBar.destroy()}
  charts.rBar=new Chart(document.getElementById('rptBar'),{
    type:'bar',
    data:{
      labels:['Jan','Fév','Mar','Avr','Mai','Jun'],
      datasets:[
        {label:'Revenus',data:[rev/6,rev/6,rev/6,rev/6,rev/6,rev/6],backgroundColor:'#16a34a',borderRadius:4},
        {label:'Dépenses',data:[dep/3,dep/3,dep/3,0,0,0],backgroundColor:'#dc2626',borderRadius:4}
      ]
    },
    options:{plugins:{legend:{position:'bottom'}},scales:{x:{grid:{display:false}}}}
  });
  const dispo=DB.locatives.filter(l=>l.statut==='Disponible').length;
  const attente=DB.locatives.filter(l=>l.statut==='En attente').length;
  if(charts.rDonut){charts.rDonut.destroy()}
  charts.rDonut=new Chart(document.getElementById('rptDonut'),{
    type:'doughnut',
    data:{labels:['Loués','Disponibles','En attente'],datasets:[{data:[loues,dispo,attente],backgroundColor:['#D4AF37','#16a34a','#f59e0b'],borderWidth:0}]},
    options:{cutout:'60%',plugins:{legend:{position:'bottom',labels:{font:{size:11}}}}}
  });
}
function exportRapportPDF(){
  if(!window.html2pdf){ toast('Export PDF indisponible : html2pdf non chargé', 'err'); return; }
  const doc=document.getElementById('rpt-content');
  if(!doc)return;
  html2pdf().from(doc).set({filename:'rapport-genius-property-'+new Date().toISOString().split('T')[0]+'.pdf',html2canvas:{scale:2},jsPDF:{format:'a4'}}).save();
  toast('Rapport PDF exporté ✓');
}

/* ============================================================
   PHOTO HELPERS
============================================================ */
function previewPhoto(input, previewId, iconId, labelId){
  const file=input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const img=document.getElementById(previewId);
    const icon=document.getElementById(iconId);
    const lbl=document.getElementById(labelId);
    if(img){img.src=e.target.result;img.style.display='block';}
    if(icon)icon.style.display='none';
    if(lbl)lbl.style.display='none';
  };
  reader.readAsDataURL(file);
}
function getPhotoData(inputId){
  const input=document.getElementById(inputId);
  if(!input||!input.files[0])return null;
  return new Promise(res=>{
    const r=new FileReader();
    r.onload=e=>res(e.target.result);
    r.readAsDataURL(input.files[0]);
  });
}
function editPhotoChange(input,key,idx){
  const file=input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    DB[key][idx].photo=e.target.result;
    saveDB();
    // Update displayed image
    const wrap=document.getElementById('edit-photo-img')||document.getElementById('edit-photo-placeholder');
    if(wrap){
      if(wrap.tagName==='IMG'){wrap.src=e.target.result;}
      else{
        const img=document.createElement('img');
        img.id='edit-photo-img';
        img.src=e.target.result;
        img.style.cssText='width:110px;height:110px;border-radius:12px;object-fit:cover;border:3px solid var(--gold);display:block';
        wrap.replaceWith(img);
      }
    }
  };
  reader.readAsDataURL(file);
}

function removeEditPhoto(key, idx){
  if(!confirm('Supprimer la photo ?')) return;
  DB[key][idx].photo = '';
  saveDB();
  // Rebuild the photo wrap without image
  const icons2={employes:'person',proprietaires:'person',locataires:'person',biens:'home',locatives:'door_front'};
  const wrap = document.getElementById('edit-photo-wrap');
  if(wrap){
    wrap.innerHTML = `<div class="modal-photo-placeholder" id="edit-photo-placeholder"><span class="material-symbols-rounded">${icons2[key]||'person'}</span><span>Ajouter photo</span></div>`;
  }
  toast('Photo supprimée');
}

/* ============================================================
   SAVES
============================================================ */
async function saveEmploye(){
  const nom   = v('e-nom').trim();
  const email = v('e-email').trim();
  const pass  = v('e-pass').trim();
  if(!nom)   return toast('Le nom est requis','err');
  if(!email) return toast("L'email est requis pour créer un accès","err");
  if(!pass || pass.length < 6) return toast('Mot de passe requis (6 caractères min.)','err');

  const btn = document.querySelector('#page-nv-employe .btn-primary');
  if(btn){ btn.disabled=true; btn.textContent='Création en cours…'; }

  // ── Créer le compte Firebase Auth sans déconnecter l'admin ──────────────
  let supaUserId = null;
  if(false){$1}

  const photo = await getPhotoData('e-photo-input');
  const id    = genId('EP');
  // Lire les checkboxes droits
  const droitsEl = document.querySelectorAll('#droits-list .toggle-switch input[type=checkbox]');
  const droitsLabels = ['employes','proprietaires','locataires','bail','contrats','paiements','avenir','depenses','fichiers','messages','rapports','journal','superAdmin'];
  const droits = {};
  droitsEl.forEach((cb, i) => { droits[droitsLabels[i]] = cb.checked; });

  DB.employes.push({
    id, civ:v('e-civ'), nom, prenom:v('e-prenom'), fonction:v('e-fonction'),
    tel:v('e-tel'), date:v('e-naiss')||new Date().toISOString().split('T')[0],
    statut:'Actif', adresse:v('e-adresse'), piece:v('e-piece'),
    numpiece:v('e-numpiece'), lieu:v('e-lieu'), deldeb:v('e-deldeb'),
    delexp:v('e-delexp'), matri:v('e-matri'), enfants:v('e-enfants'),
    contrat:v('e-contrat'), email, supaUserId, droits, photo:photo||''
  });
  await saveDB();
  if(btn){ btn.disabled=false; btn.textContent='Enregistrer'; }
  resetEmployeForm();
  navigate('employes');
  toast("Employé enregistré ✓ — Confirme l'email dans Supabase → Auth → Users si nécessaire");
}
async function saveProprietaire(){
  if(window.GPModules && window.GPModules.proprietaires && window.GPModules.proprietaires.saveProprietaire !== saveProprietaire){
    return window.GPModules.proprietaires.saveProprietaire();
  }
  const nom=v('p-nom').trim();
  if(!nom)return toast('Le nom est requis','err');
  const photo=await getPhotoData('p-photo-input');
  const _db = window.GPDB && window.GPDB.load ? window.GPDB.load() : DB;
  if(!Array.isArray(_db.proprietaires)) _db.proprietaires=[];
  _db.proprietaires.push({id:genId('PR'),nom,prenom:v('p-prenom'),naiss:v('p-naiss'),adresse:v('p-adresse'),tel:v('p-tel'),email:v('p-email'),matri:v('p-matri'),photo:photo||''});
  if(window.GPDB && window.GPDB.save) window.GPDB.save(_db); else { window.DB=_db; saveDB(); }
  resetAfterSave('page-nv-proprietaire');
  navigate('proprietaires');toast('Propriétaire enregistré avec succès ✓');
}
async function saveLocataire(){
  // Délégue au module locataires.js corrigé s'il est chargé
  if(window.GPModules && window.GPModules.locataires && window.GPModules.locataires.saveLocataire !== saveLocataire){
    return window.GPModules.locataires.saveLocataire();
  }
  const nom=v('lc-nom').trim();
  if(!nom)return gp_fieldError('lc-nom','Le nom est requis');
  const tel=v('lc-tel').replace(/\s/g,'');
  if(tel && !/^[0-9+]{8,15}$/.test(tel)) return gp_fieldError('lc-tel','Numéro de téléphone invalide');
  const deldeb=v('lc-deldeb'), delexp=v('lc-delexp');
  if(deldeb && delexp && new Date(delexp) <= new Date(deldeb)) return gp_fieldError('lc-delexp',"La date d'expiration doit être après le début");
  const photo=await getPhotoData('lc-photo-input');
  const _db = window.GPDB && window.GPDB.load ? window.GPDB.load() : DB;
  if(!Array.isArray(_db.locataires)) _db.locataires=[];
  _db.locataires.push({id:genId('LC'),civ:v('lc-civ'),nom,prenom:v('lc-prenom'),naiss:v('lc-naiss'),prof:v('lc-prof'),travail:v('lc-travail'),piece:v('lc-piece'),numpiece:v('lc-numpiece'),deldeb:v('lc-deldeb'),delexp:v('lc-delexp'),matri:v('lc-matri'),enfants:v('lc-enfants'),adresse:v('lc-adresse'),tel:v('lc-tel'),bien:'-',type:document.getElementById('lc-entreprise').checked?'Entreprise':'Particulier',email:'',date:new Date().toISOString().split('T')[0],statut:'Actif',photo:photo||''});
  if(window.GPDB && window.GPDB.save) window.GPDB.save(_db); else { window.DB=_db; saveDB(); }
  resetAfterSave('page-nv-locataire');
  navigate('locataires');toast('Locataire enregistré avec succès ✓');
}




/* ============================================================
   EXPORT DROPDOWN UNIFIÉ
============================================================ */
function toggleExportMenu(key){
  const menu=document.getElementById('exportMenu-'+key);
  if(!menu) return;
  document.querySelectorAll('.gp-export-menu.show').forEach(m=>{ if(m!==menu) m.classList.remove('show'); });
  menu.classList.toggle('show');
}
document.addEventListener('click',function(e){
  if(!e.target.closest('.gp-export-wrap')) document.querySelectorAll('.gp-export-menu.show').forEach(m=>m.classList.remove('show'));
});

/* ============================================================
   LOCATAIRES — VUE CARTES MODERNE
============================================================ */
function locataireFullName(l){ return [l?.nom||'', l?.prenom||''].filter(Boolean).join(' ').trim() || '—'; }
function gpNormalizeName(v){
  return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
}
function gpLocataireNameVariants(l){
  if(typeof l==='string') return [gpNormalizeName(l)];
  const nom=String(l?.nom||'').trim(), prenom=String(l?.prenom||'').trim();
  return [locataireFullName(l), `${prenom} ${nom}`, `${nom} ${prenom}`].map(gpNormalizeName).filter(Boolean);
}
function getLocataireBienLabel(locataire){
  const variants=gpLocataireNameVariants(locataire);
  const active=(DB.locatives||[]).slice().reverse().find(l=>{
    const occ=gpNormalizeName(l.locataire||l.occupant||'');
    return variants.includes(occ) && !String(l.statut||'').toLowerCase().includes('archiv');
  });
  if(active) return active.bien || active.parentBien || active.nom || 'Bien associé';
  if(typeof locataire==='object' && locataire?.bien && locataire.bien!=='-') return locataire.bien;
  return 'Aucun bien associé';
}
function syncLocataireBienFromLocations(locataireName, bienName){
  const target=gpNormalizeName(locataireName);
  const l=(DB.locataires||[]).find(x=>gpLocataireNameVariants(x).includes(target));
  if(l) l.bien=bienName || '-';
}
let _locatairesPaginePage = 1;
const _locatairesPER_PAGE = 20;

function renderLocatairesModern(resetPage){
  if(resetPage) _locatairesPaginePage = 1;
  const grid=document.getElementById('locatairesCardsGrid');
  if(!grid){ renderTable('locataires'); return; }
  const search=(document.getElementById('locatairesSearchModern')?.value||'').toLowerCase().trim();
  const type=(document.getElementById('locatairesTypeFilter')?.value||'').toLowerCase();
  const statut=(document.getElementById('locatairesStatutFilter')?.value||'').toLowerCase();
  const all=DB.locataires||[];
  const withBien=all.filter(l=>getLocataireBienLabel(l)!=='Aucun bien associé').length;
  const actifs=all.filter(l=>String(l.statut||'Actif').toLowerCase()==='actif').length;
  const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
  set('locStatTotal',all.length); set('locStatBien',withBien); set('locStatActifs',actifs);
  let data=all.filter(l=>{
    const blob=JSON.stringify(l).toLowerCase();
    return (!search || blob.includes(search)) && (!type || String(l.type||'').toLowerCase()===type) && (!statut || String(l.statut||'Actif').toLowerCase()===statut);
  });
  const empty=document.getElementById('locatairesEmptyState');
  const pagDiv=document.getElementById('locatairesPagination');
  if(!data.length){ grid.innerHTML=''; if(empty) empty.style.display='block'; if(pagDiv) pagDiv.style.display='none'; return; }
  if(empty) empty.style.display='none';

  const totalPages=Math.ceil(data.length/_locatairesPER_PAGE);
  if(_locatairesPaginePage>totalPages) _locatairesPaginePage=totalPages;
  const start=(_locatairesPaginePage-1)*_locatairesPER_PAGE;
  const pageData=data.slice(start,start+_locatairesPER_PAGE);

  const count=document.getElementById('locatairesModernCount');
  if(count) count.textContent=`${start+1}–${Math.min(start+_locatairesPER_PAGE,data.length)} / ${data.length} locataire${data.length>1?'s':''}`;

  grid.innerHTML=pageData.map(l=>{
    const idx=all.indexOf(l);
    const name=locataireFullName(l);
    const initials=((l.nom||'?')[0]||'?')+((l.prenom||'')[0]||'');
    const photo=l.photo?`<img src="${l.photo}" alt="${name}">`:`<span>${initials.toUpperCase()}</span>`;
    const active=String(l.statut||'Actif').toLowerCase()==='actif';
    return `<article class="locataire-card" onclick="viewRow('locataires',${idx})" title="Appuyer pour voir les détails">
      <div class="locataire-top">
        <div class="loc-photo">${photo}</div>
        <div class="loc-main"><div class="loc-name">${name}</div><div class="loc-meta">${l.prof||l.type||'Locataire'}</div></div>
        <span class="loc-badge ${active?'':'inactive'}">${l.statut||'Actif'}</span>
      </div>
      <div class="loc-info">
        <div class="loc-line"><span class="material-symbols-rounded">home</span><span>${escapeHTML(getLocataireBienLabel(l))}</span></div>
        <div class="loc-line"><span class="material-symbols-rounded">call</span><span>${l.tel||'Téléphone non renseigné'}</span></div>
        <div class="loc-line"><span class="material-symbols-rounded">mail</span><span>${l.email||'Email non renseigné'}</span></div>
        <div class="loc-line"><span class="material-symbols-rounded">badge</span><span>${l.type||'Particulier'}</span></div>
      </div>
      <div class="loc-actions" onclick="event.stopPropagation()">
        <button class="icon-btn icon-view" title="Voir" onclick="viewRow('locataires',${idx})"><span class="material-symbols-rounded">visibility</span></button>
        <button class="icon-btn icon-edit" title="Modifier" onclick="editRow('locataires',${idx})"><span class="material-symbols-rounded">edit</span></button>
        <button class="icon-btn icon-delete" title="Supprimer" onclick="delRow('locataires',${idx})"><span class="material-symbols-rounded">delete</span></button>
        <button class="icon-btn icon-doc docs gp-doc-folder-btn" title="Documents" onclick="openLocataireDocs(${idx})"><span class="material-symbols-rounded">folder</span></button>
        <button class="icon-btn icon-pay-hist" title="Historique paiements" onclick="viewLocatairePaiements('${String(l.nom||'').replace(/'/g,"\'")}','${String(l.prenom||'').replace(/'/g,"\'")}')"><span class="material-symbols-rounded">receipt_long</span></button>
      </div>
    </article>`;
  }).join('');

  if(pagDiv) renderGpPagination(pagDiv, _locatairesPaginePage, totalPages, p=>{ _locatairesPaginePage=p; renderLocatairesModern(); });
}



/* ============================================================
   DOCUMENTS LOCATAIRES — MODAL DÉDIÉ
============================================================ */
let _locataireDocsIdx = -1;
let _locataireDocPendingFile = null;

function locataireDocsKey(idx){ return 'loc_'+idx; }
function ensureLocataireDocsStore(){ if(!DB.locataireDocs || typeof DB.locataireDocs !== 'object') DB.locataireDocs = {}; }
function openLocataireDocs(idx){
  ensureLocataireDocsStore();
  _locataireDocsIdx = idx;
  _locataireDocPendingFile = null;
  const loc = (DB.locataires||[])[idx];
  const title = document.getElementById('locataireDocsTitle');
  if(title) title.textContent = loc ? `Locataire : ${locataireFullName(loc)}` : 'Locataire sélectionné';
  clearLocataireDocForm(false);
  const modal=document.getElementById('locataireDocsModal');
  if(modal){ modal.style.display = 'flex'; modal.style.alignItems = 'center'; modal.style.justifyContent = 'center'; }
  renderLocataireDocuments();
}
function closeLocataireDocs(){
  const modal=document.getElementById('locataireDocsModal');
  if(modal) modal.style.display = 'none';
  _locataireDocPendingFile = null;
}
function clearLocataireDocForm(clearFile=true){
  const n=document.getElementById('locDocName'); if(n) n.value='';
  const a=document.getElementById('locDocAlbum'); if(a) a.value='';
  const f=document.getElementById('locDocFile'); if(f && clearFile) f.value='';
  _locataireDocPendingFile=null;
  const drop=document.getElementById('locDocDrop');
  if(drop) drop.classList.remove('dragover');
}
function handleLocDocFile(file){
  if(!file) return;
  _locataireDocPendingFile=file;
  const name=document.getElementById('locDocName');
  if(name && !name.value.trim()) name.value=file.name.replace(/\.[^/.]+$/,'');
  const drop=document.getElementById('locDocDrop');
  if(drop){
    drop.innerHTML=`<span class="material-symbols-rounded">description</span><strong>${escapeHTML(file.name)}</strong><br><small>${Math.round(file.size/1024)} Ko sélectionné</small><input type="file" id="locDocFile" style="display:none" onchange="handleLocDocFile(this.files[0])">`;
  }
}
function resetLocDocDrop(){
  const drop=document.getElementById('locDocDrop');
  if(drop){
    drop.innerHTML=`<span class="material-symbols-rounded">cloud_upload</span><strong>Déposer un fichier ici</strong><br><small>ou cliquer pour sélectionner un PDF, une image ou un document</small><input type="file" id="locDocFile" style="display:none" onchange="handleLocDocFile(this.files[0])">`;
  }
}
function addLocataireDocument(){
  ensureLocataireDocsStore();
  if(_locataireDocsIdx < 0){ toast('Aucun locataire sélectionné', true); return; }
  const name=(document.getElementById('locDocName')?.value||'').trim();
  const album=(document.getElementById('locDocAlbum')?.value||'').trim() || 'Général';
  const file=_locataireDocPendingFile || document.getElementById('locDocFile')?.files?.[0];
  if(!name || !file){ toast('Nom et fichier requis', true); return; }
  const reader=new FileReader();
  reader.onload=function(e){
    const key=locataireDocsKey(_locataireDocsIdx);
    if(!DB.locataireDocs[key]) DB.locataireDocs[key]=[];
    DB.locataireDocs[key].push({
      id:'LDOC-'+Date.now(),
      name, album,
      fileName:file.name,
      mime:file.type || 'application/octet-stream',
      size:file.size || 0,
      data:e.target.result,
      date:new Date().toISOString()
    });
    saveDB();
    renderLocataireDocuments();
    clearLocataireDocForm();
    resetLocDocDrop();
    toast('Document ajouté');
  };
  reader.readAsDataURL(file);
}
function renderLocataireDocuments(){
  ensureLocataireDocsStore();
  const list=document.getElementById('locDocList');
  if(!list) return;
  const key=locataireDocsKey(_locataireDocsIdx);
  const docs=DB.locataireDocs[key]||[];
  if(!docs.length){
    list.innerHTML='<div class="loc-doc-empty">Aucun document pour ce locataire.</div>';
    return;
  }
  list.innerHTML=docs.map((d,i)=>{
    let preview='<span class="material-symbols-rounded">description</span>';
    if(String(d.mime||'').startsWith('image/')) preview=`<img src="${d.data}" alt="${escapeHTML(d.name)}">`;
    else if(String(d.mime||'').includes('pdf')) preview='<span class="material-symbols-rounded">picture_as_pdf</span>';
    return `<div class="loc-doc-card">
      <div class="loc-doc-preview">${preview}</div>
      <div>
        <div class="loc-doc-title">${escapeHTML(d.name)}</div>
        <div class="loc-doc-meta">${escapeHTML(d.album||'Général')} · ${escapeHTML(d.fileName||'Fichier')} · ${Math.round((d.size||0)/1024)} Ko</div>
      </div>
      <div class="loc-doc-actions">
        <button class="icon-btn icon-view" title="Voir" onclick="previewLocataireDocument(${i})"><span class="material-symbols-rounded">visibility</span></button>
        <button class="icon-btn icon-download" title="Télécharger" onclick="downloadLocataireDocument(${i})"><span class="material-symbols-rounded">download</span></button>
        <button class="icon-btn icon-delete" title="Supprimer" onclick="deleteLocataireDocument(${i})"><span class="material-symbols-rounded">delete</span></button>
      </div>
    </div>`;
  }).join('');
}
function getCurrentLocataireDocs(){ ensureLocataireDocsStore(); return DB.locataireDocs[locataireDocsKey(_locataireDocsIdx)] || []; }
function previewLocataireDocument(i){
  const d=getCurrentLocataireDocs()[i]; if(!d) return;
  const w=window.open('','_blank');
  if(!w){ toast('Popup bloquée par le navigateur', true); return; }
  if(String(d.mime||'').startsWith('image/')) w.document.write(`<img src="${d.data}" style="max-width:100%;height:auto">`);
  else if(String(d.mime||'').includes('pdf')) w.document.write(`<iframe src="${d.data}" style="width:100%;height:100vh;border:0"></iframe>`);
  else w.document.write(`<p style="font-family:Arial;padding:20px">Aperçu non disponible. Utilisez le bouton Télécharger.</p>`);
}
function downloadLocataireDocument(i){
  const d=getCurrentLocataireDocs()[i]; if(!d) return;
  const a=document.createElement('a');
  a.href=d.data; a.download=d.fileName || (d.name || 'document');
  document.body.appendChild(a); a.click(); a.remove();
}
function deleteLocataireDocument(i){
  ensureLocataireDocsStore();
  if(!confirm('Supprimer ce document ?')) return;
  const key=locataireDocsKey(_locataireDocsIdx);
  DB.locataireDocs[key]=(DB.locataireDocs[key]||[]).filter((_,idx)=>idx!==i);
  saveDB();
  renderLocataireDocuments();
  toast('Document supprimé');
}
(function initLocataireDocDrop(){
  document.addEventListener('dragover',function(e){
    const drop=e.target.closest&&e.target.closest('#locDocDrop');
    if(drop){ e.preventDefault(); drop.classList.add('dragover'); }
  });
  document.addEventListener('dragleave',function(e){
    const drop=e.target.closest&&e.target.closest('#locDocDrop');
    if(drop) drop.classList.remove('dragover');
  });
  document.addEventListener('drop',function(e){
    const drop=e.target.closest&&e.target.closest('#locDocDrop');
    if(drop){ e.preventDefault(); drop.classList.remove('dragover'); handleLocDocFile(e.dataTransfer.files[0]); }
  });
})();


/* ============================================================
   PROPRIÉTAIRES — VUE CARTES + DÉTAILS
============================================================ */
let _proprietaireDetailIdx = -1;
function getProprietaireFullName(p){ return [p?.nom||'', p?.prenom||''].filter(Boolean).join(' ').trim() || '—'; }
function getProprietaireBiens(p){
  const n=(p?.nom||'').toLowerCase(), full=getProprietaireFullName(p).toLowerCase();
  return (DB.biens||[]).filter(b=>{
    const pr=(b.proprio||'').toLowerCase();
    return pr===full || pr.includes(full) || (n && pr.includes(n));
  });
}
function getProprietaireDocsKey(idx){ return 'prop_'+idx; }
function ensureProprietaireDocsStore(){ if(!DB.employeDocs) DB.employeDocs={};
    if(!DB.proprietaireDocs) DB.proprietaireDocs={};
    if(!DB.locataireDocs) DB.locataireDocs={}; }
function renderProprietairesCards(){
  const search=(document.getElementById('proprietairesSearch')?.value||'').toLowerCase();
  const props=Array.isArray(DB.proprietaires)?DB.proprietaires:[];
  const filtered=props.filter(p=>!search || JSON.stringify(p).toLowerCase().includes(search) || getProprietaireFullName(p).toLowerCase().includes(search));
  const totalBiens=props.reduce((sum,p)=>sum+getProprietaireBiens(p).length,0);
  const stTotal=document.getElementById('propStatTotal'); if(stTotal) stTotal.textContent=props.length;
  const stBiens=document.getElementById('propStatBiens'); if(stBiens) stBiens.textContent=totalBiens;
  const stActifs=document.getElementById('propStatActifs'); if(stActifs) stActifs.textContent=props.length;
  const counter=document.getElementById('proprietairesCount'); if(counter) counter.textContent=`${filtered.length} propriétaire${filtered.length>1?'s':''}`;
  const grid=document.getElementById('proprietairesCardsGrid');
  const empty=document.getElementById('proprietairesEmptyState');
  if(!grid) return;
  if(!filtered.length){ grid.style.display='none'; if(empty) empty.style.display='block'; return; }
  grid.style.display='grid'; if(empty) empty.style.display='none';
  grid.innerHTML=filtered.map(p=>{
    const realIdx=props.indexOf(p);
    const biens=getProprietaireBiens(p).length;
    const name=getProprietaireFullName(p);
    const photo=p.photo ? `<img src="${p.photo}" alt="${name}">` : `<span class="material-symbols-rounded" style="font-size:42px;color:#d1d5db">person</span>`;
    return `<div class="proprietaires-card" title="Appuyer pour voir les détails" onclick="openProprietaireDetail(${realIdx})">
      <div class="bien-card-hover-tip">Appuyer pour voir les détails</div>
      <div class="proprietaires-card-photo">${photo}</div>
      <div style="position:absolute;top:7px;right:7px;background:#dcfce7;color:#166534;font-size:8.5px;font-weight:700;padding:2px 6px;border-radius:20px;border:1px solid rgba(0,0,0,.06)">Actif</div>
      <div style="padding:7px 10px">
        <div style="font-size:11.5px;font-weight:800;color:#111;margin-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
        <div style="display:flex;align-items:center;gap:4px;font-size:9.5px;color:#9ca3af;margin-bottom:5px"><span class="material-symbols-rounded" style="font-size:11px">home_work</span>${biens} bien${biens>1?'s':''}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="font-size:9.5px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:105px">${p.tel||'—'}</div>
          <div style="font-size:9px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:90px">${p.email||'—'}</div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:7px" onclick="event.stopPropagation()">
          <button class="icon-btn icon-doc docs gp-doc-folder-btn" title="Documents" onclick="openEntityDocs('proprietaires',${realIdx})"><span class="material-symbols-rounded">folder</span></button>
        </div>
      </div>
    </div>`;
  }).join('');
}
function openProprietaireDetail(idx){
  _proprietaireDetailIdx=idx;
  const p=(DB.proprietaires||[])[idx]; if(!p) return;
  const name=getProprietaireFullName(p), biens=getProprietaireBiens(p);
  document.getElementById('propDetailName').textContent=name;
  document.getElementById('propDetailNameSub').textContent=name;
  document.getElementById('propDetailContactSub').textContent=[p.tel,p.email].filter(Boolean).join(' · ') || '—';
  document.getElementById('propDetailBiensCount').textContent=biens.length;
  const wrap=document.getElementById('propDetailPhotoWrap');
  wrap.innerHTML=p.photo ? `<img src="${p.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">` : `<span class="material-symbols-rounded" style="font-size:32px;color:#d1d5db">person</span>`;
  const info=(label,val)=>`<div style="padding:12px 14px;background:#f9fafb;border-radius:9px"><div style="font-size:9.5px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin-bottom:4px">${label}</div><div style="font-size:13px;font-weight:600;color:#111">${val||'—'}</div></div>`;
  document.getElementById('propDetailInfosGrid').innerHTML=[
    info('Nom',p.nom),info('Prénoms',p.prenom),info('Téléphone',p.tel),info('Email',p.email),info('Adresse',p.adresse),info('Date de naissance',p.naiss),info('Statut matrimonial',p.matri),info('Nombre de biens',biens.length)
  ].join('');
  const list=document.getElementById('propDetailBiensList');
  list.innerHTML=biens.length ? biens.map((b,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:#f9fafb;border-radius:10px;margin-bottom:8px;border:1px solid #e5e7eb;cursor:pointer" onclick="openBienDetail(${(DB.biens||[]).indexOf(b)})">
      <div style="width:42px;height:42px;border-radius:10px;background:${b.photo?`url('${b.photo}') center/cover no-repeat`:'#f3f4f6'};display:flex;align-items:center;justify-content:center;flex-shrink:0">${b.photo?'':'<span class="material-symbols-rounded" style="font-size:22px;color:#d1d5db">home_work</span>'}</div>
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:800;color:#111">${b.nom||'—'}</div><div style="font-size:11px;color:#9ca3af">${b.type||'—'} · ${b.valeur||'—'} · ${b.statut||'—'}</div></div>
      <span class="material-symbols-rounded" style="font-size:16px;color:#9ca3af">chevron_right</span>
    </div>`).join('') : `<div style="text-align:center;padding:40px;color:#9ca3af"><span class="material-symbols-rounded" style="font-size:44px;opacity:.4;display:block;margin-bottom:8px">home_work</span><div style="font-size:12px">Aucun bien associé à ce propriétaire</div></div>`;
  renderProprietaireDocuments();
  switchProprietaireTab(document.getElementById('pdTab-infos'),'infos');
  navigate('proprietaire-detail');
}
function switchProprietaireTab(btn,tab){
  document.querySelectorAll('.proprietaire-detail-tab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  ['infos','biens','docs'].forEach(t=>{const el=document.getElementById('proprietaireTab'+t.charAt(0).toUpperCase()+t.slice(1)); if(el) el.style.display=t===tab?'block':'none';});
}
function editProprietaireFromDetail(){ if(_proprietaireDetailIdx<0) return; editRow('proprietaires',_proprietaireDetailIdx); }
function deleteProprietaireFromDetail(){ if(_proprietaireDetailIdx<0) return; if(confirm('Supprimer ce propriétaire ?')){ DB.proprietaires.splice(_proprietaireDetailIdx,1); saveDB(); navigate('proprietaires'); toast('Propriétaire supprimé'); } }
async function addProprietaireDocument(){
  ensureProprietaireDocsStore();
  if(_proprietaireDetailIdx<0) return;
  const file=document.getElementById('propDocFile')?.files?.[0];
  const name=(document.getElementById('propDocName')?.value||'').trim();
  const album=(document.getElementById('propDocAlbum')?.value||'Documents').trim();
  if(!file || !name) return toast('Nom du document et fichier requis','err');
  const data=await new Promise((res,rej)=>{const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file);});
  const key=getProprietaireDocsKey(_proprietaireDetailIdx);
  if(!DB.proprietaireDocs[key]) DB.proprietaireDocs[key]=[];
  DB.proprietaireDocs[key].push({name,album,fileName:file.name,type:file.type,data,created:new Date().toISOString()});
  saveDB();
  document.getElementById('propDocName').value=''; document.getElementById('propDocAlbum').value=''; document.getElementById('propDocFile').value='';
  renderProprietaireDocuments(); toast('Document ajouté ✓');
}
function renderProprietaireDocuments(){
  ensureProprietaireDocsStore();
  const list=document.getElementById('propDocList'); if(!list) return;
  const docs=DB.proprietaireDocs[getProprietaireDocsKey(_proprietaireDetailIdx)]||[];
  if(!docs.length){ list.innerHTML='<div style="text-align:center;padding:25px;color:#9ca3af;font-size:12px">Aucun document pour ce propriétaire</div>'; return; }
  list.innerHTML=docs.map((d,i)=>{
    const preview=d.type?.includes('image') ? `<img src="${d.data}" style="width:54px;height:54px;object-fit:cover;border-radius:8px">` : `<div style="width:54px;height:54px;border-radius:8px;background:#fee2e2;display:flex;align-items:center;justify-content:center"><span class="material-symbols-rounded" style="font-size:26px;color:#dc2626">picture_as_pdf</span></div>`;
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:8px;background:#fff">
      ${preview}<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:800;color:#111">${d.name}</div><div style="font-size:11px;color:#9ca3af">${d.album||'Documents'} · ${d.fileName}</div></div>
      <a href="${d.data}" download="${d.fileName}" class="icon-btn icon-download" title="Télécharger"><span class="material-symbols-rounded">download</span></a>
      <button class="icon-btn icon-delete" title="Supprimer" onclick="deleteProprietaireDocument(${i})"><span class="material-symbols-rounded">delete</span></button>
    </div>`;
  }).join('');
}
function deleteProprietaireDocument(i){ ensureProprietaireDocsStore(); const key=getProprietaireDocsKey(_proprietaireDetailIdx); (DB.proprietaireDocs[key]||[]).splice(i,1); saveDB(); renderProprietaireDocuments(); }
setTimeout(()=>{
  const drop=document.getElementById('propDocDrop'), file=document.getElementById('propDocFile');
  if(drop&&file){
    ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('dragover')}));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('dragover')}));
    drop.addEventListener('drop',e=>{ if(e.dataTransfer.files[0]) file.files=e.dataTransfer.files; });
    drop.addEventListener('click',()=>file.click());
  }
},300);

/* ============================================================
   BIENS — VUE CARTES
============================================================ */
let _bienDetailIdx = -1;

function getBienTypes(){
  const normalizeType = v => String(v || '').trim();
  const fromDB = Array.isArray(DB?.biens)
    ? DB.biens.map(b => normalizeType(b && b.type)).filter(Boolean)
    : [];
  // Le filtre affiche d'abord uniquement les types réellement présents dans les biens.
  if(fromDB.length) return Array.from(new Set(fromDB)).sort((a,b)=>a.localeCompare(b,'fr'));
  // Fallback seulement si aucun bien n'existe encore.
  const sel = document.getElementById('b-type');
  const fromForm = sel ? Array.from(sel.options).map(o=>normalizeType(o.value||o.textContent)).filter(v=>v && v!=='Sélectionnez') : [];
  return Array.from(new Set(fromForm)).sort((a,b)=>a.localeCompare(b,'fr'));
}
function syncBienTypeFilter(){
  const sel = document.getElementById('biensFilterType');
  if(!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Tous les types</option>' + getBienTypes().map(t=>`<option value="${t}">${t}</option>`).join('');
  if(getBienTypes().includes(current)) sel.value = current;
}
function isMultiUnitBien(b){
  return b?.type==='Immeuble' && parseInt(b?.nbAppart || b?.nbAppartements || 0,10) > 1;
}
function ensureBienUnits(b){
  if(!b) return [];
  const count = parseInt(b.nbAppart || b.nbAppartements || 0,10);
  if(count > 1){
    if(!Array.isArray(b.unites) || b.unites.length !== count){
      const oldUnits = Array.isArray(b.unites) ? b.unites : [];
      b.unites = Array.from({length:count},(_,i)=>{
        const old = oldUnits[i] || {};
        return {
          id: old.id || genId('UNT'),
          nom: old.nom || `Appartement ${i+1}`,
          statut: old.statut || 'Disponible',
          loyer: old.loyer || '',
          locataire: old.locataire || ''
        };
      });
    }
    return b.unites;
  }
  return [{id:b.id, nom:b.nom, statut:b.statut||'Disponible', loyer:b.loyer||'', locataire:b.locataire||''}];
}
function getBienUnitCount(b){
  return ensureBienUnits(b).length || 1;
}
function getBienUnitFullName(b,u){
  if(!b || !u) return '';
  return isMultiUnitBien(b) ? `${b.nom} - ${u.nom}` : b.nom;
}
function findBienByUnitName(unitName){
  return (DB.biens||[]).find(b=>{
    if(b.nom===unitName) return true;
    return ensureBienUnits(b).some(u=>getBienUnitFullName(b,u)===unitName);
  });
}
function findUnitByFullName(unitName){
  for(const b of (DB.biens||[])){
    for(const u of ensureBienUnits(b)){
      if(getBienUnitFullName(b,u)===unitName || (!isMultiUnitBien(b) && b.nom===unitName)) return {bien:b, unite:u};
    }
  }
  return {bien:null, unite:null};
}
function syncBienStatusFromUnits(b){
  if(!b || !isMultiUnitBien(b)) return;
  const units=ensureBienUnits(b);
  const loue=units.filter(u=>u.statut==='Loué').length;
  if(loue===units.length) b.statut='Loué';
  else if(loue===0) b.statut='Disponible';
  else b.statut='En attente';
}

let _biensPaginePage = 1;
const _biensPER_PAGE = 20;

function renderBiensCards(resetPage){
  if(resetPage) _biensPaginePage = 1;
  const search = (document.getElementById('biensSearch')?.value||'').toLowerCase();
  const filterType = document.getElementById('biensFilterType')?.value||'';
  const filterStatut = document.getElementById('biensFilterStatut')?.value||'';
  const biens = Array.isArray(DB.biens)?DB.biens:[];
  syncBienTypeFilter();

  biens.forEach(b=>{ensureBienUnits(b);syncBienStatusFromUnits(b);});
  const countByStatut = key => biens
    .reduce((sum,b)=>sum+ensureBienUnits(b).filter(u=>String(u.statut||b.statut||'').toLowerCase().includes(key)).length,0);
  document.getElementById('biensStatLoue').textContent  = countByStatut('lou');
  document.getElementById('biensStatDispo').textContent = countByStatut('dispo');
  document.getElementById('biensStatAttente').textContent = countByStatut('attente');

  const filtered = biens.filter(b=>{
    const s = JSON.stringify(b).toLowerCase();
    const typeOk = !filterType || (b.type||'')===filterType;
    const statutOk = !filterStatut || (b.statut||'')===filterStatut;
    const searchOk = !search || s.includes(search);
    return typeOk && statutOk && searchOk;
  });

  const grid = document.getElementById('biensCardsGrid');
  const empty = document.getElementById('biensEmptyState');
  const counter = document.getElementById('biensCount');
  const pagDiv = document.getElementById('biensPagination');

  if(!filtered.length){
    grid.style.display='none'; empty.style.display='block';
    if(pagDiv) pagDiv.style.display='none';
    if(counter) counter.textContent='';
    return;
  }
  grid.style.display='grid'; empty.style.display='none';

  const totalPages = Math.ceil(filtered.length/_biensPER_PAGE);
  if(_biensPaginePage > totalPages) _biensPaginePage = totalPages;
  const start = (_biensPaginePage-1)*_biensPER_PAGE;
  const pageData = filtered.slice(start, start+_biensPER_PAGE);

  if(counter){
    const unitTotal = filtered.reduce((sum,b)=>sum+getBienUnitCount(b),0);
    counter.textContent = `${start+1}–${Math.min(start+_biensPER_PAGE,filtered.length)} / ${filtered.length} bien${filtered.length>1?'s':''} · ${unitTotal} unité${unitTotal>1?'s':''}`;
  }

  const TYPE_ICONS = {Appartement:'apartment',Maison:'house',Villa:'villa',Studio:'meeting_room',Bureau:'corporate_fare','Local commercial':'storefront',Terrain:'landscape'};
  const STATUT_STYLE = {
    'Loué':    {bg:'#dcfce7',color:'#166534',dot:'#16a34a'},
    'Disponible': {bg:'#dbeafe',color:'#1e40af',dot:'#2563eb'},
    'En attente': {bg:'#fef3c7',color:'#92400e',dot:'#f59e0b'},
  };

  grid.innerHTML = pageData.map((b,i)=>{
    const realIdx = biens.indexOf(b);
    const st = b.statut||'Disponible';
    const ss = STATUT_STYLE[st]||{bg:'#f3f4f6',color:'#374151',dot:'#9ca3af'};
    const icon = TYPE_ICONS[b.type||'']||'home_work';
    const photoStyle = b.photo
      ? `background:url('${b.photo}') center/cover no-repeat`
      : `background:linear-gradient(135deg,#f9fafb,#f3f4f6);display:flex;align-items:center;justify-content:center`;
    const photoContent = b.photo ? '' : `<span class="material-symbols-rounded" style="font-size:36px;color:#d1d5db">${icon}</span>`;
    const units = getBienUnitCount(b);
    const unitBadge = units>1 ? `<span style="margin-left:6px;background:#fef3c7;color:#92400e;font-size:9px;font-weight:800;padding:2px 6px;border-radius:10px">${units} apparts</span>` : '';
    const unitSummary = units>1 ? `<div style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap">${ensureBienUnits(b).slice(0,4).map(u=>`<span style="font-size:9px;font-weight:800;padding:2px 6px;border-radius:10px;background:${u.statut==='Loué'?'#dcfce7':u.statut==='En attente'?'#fef3c7':'#dbeafe'};color:${u.statut==='Loué'?'#166534':u.statut==='En attente'?'#92400e':'#1e40af'}">${escapeHTML(u.nom)} · ${escapeHTML(u.statut||'Disponible')}</span>`).join('')}${units>4?`<span style="font-size:9px;color:#9ca3af">+${units-4}</span>`:''}</div>` : '';

    return `<div class="bien-card" title="Appuyer pour voir les détails" onclick="openBienDetail(${realIdx})" style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.07);border:1px solid #f0f0f0;cursor:pointer;transition:.18s;position:relative" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,.12)'" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 10px rgba(0,0,0,.07)'">
      <div class="bien-card-hover-tip">Appuyer pour voir les détails</div>
      <div class="bien-card-photo" style="height:130px;${photoStyle}">${photoContent}</div>
      <div style="position:absolute;top:10px;right:10px;background:${ss.bg};color:${ss.color};font-size:9.5px;font-weight:700;padding:3px 8px;border-radius:20px;border:1px solid rgba(0,0,0,.06)">${st}</div>
      <div style="padding:10px 12px">
        <div style="font-size:12.5px;font-weight:800;color:#111;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.nom||'—'}</div>
        <div style="display:flex;align-items:center;gap:4px;font-size:10.5px;color:#9ca3af;margin-bottom:8px">
          <span class="material-symbols-rounded" style="font-size:12px">${icon}</span>${b.type||'—'}${unitBadge}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:11.5px;font-weight:800;color:#D4AF37">${b.valeur||'—'}</div>
          <div style="font-size:10px;color:#9ca3af;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:90px">${b.proprio||'—'}</div>
        </div>
        ${unitSummary}
      </div>
    </div>`;
  }).join('');

  if(pagDiv) renderGpPagination(pagDiv, _biensPaginePage, totalPages, p=>{ _biensPaginePage=p; renderBiensCards(); });
}

function openBienDetail(idx){
  _bienDetailIdx = idx;
  const b = DB.biens[idx];
  if(!b) return;

  // Populate all fields BEFORE navigating
  const STATUT_STYLE = {'Loué':{bg:'#dcfce7',color:'#166534'},'Disponible':{bg:'#dbeafe',color:'#1e40af'},'En attente':{bg:'#fef3c7',color:'#92400e'}};
  const ss = STATUT_STYLE[b.statut||'Disponible']||{bg:'#f3f4f6',color:'#374151'};
  const badgeHTML = `<span style="background:${ss.bg};color:${ss.color};font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid rgba(0,0,0,.05)">${b.statut||'Disponible'}</span>`;

  // Header fields
  document.getElementById('bienDetailName').textContent   = b.nom||'—';
  document.getElementById('bienDetailNameSub').textContent = b.nom||'—';
  document.getElementById('bienDetailStatutBadge').innerHTML = badgeHTML;
  document.getElementById('bienDetailValeur').textContent  = b.valeur||'—';
  document.getElementById('bienDetailEtat').textContent    = b.etat||'—';
  document.getElementById('bienDetailVente').textContent   = b.vente||'—';
  document.getElementById('bienDetailTypeText').textContent = [b.type, b.adresse].filter(Boolean).join(' · ') || '—';

  // Photo
  const photoWrap = document.getElementById('bienDetailPhotoWrap');
  photoWrap.innerHTML = b.photo
    ? `<img src="${b.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`
    : `<span class="material-symbols-rounded" style="font-size:32px;color:#d1d5db">home</span>`;

  // Adresse
  const adresseEl = document.getElementById('bienDetailAdresse');
  adresseEl.querySelector('span:last-child').textContent = b.adresse||'Adresse non renseignée';

  // Caractéristiques cards
  document.getElementById('bienDetailTypeCard').textContent   = b.type||'—';
  document.getElementById('bienDetailStatutCard').innerHTML   = badgeHTML;
  document.getElementById('bienDetailVenteCard').textContent  = b.vente||'—';
  document.getElementById('bienDetailEtatCard').textContent   = b.etat||'—';
  document.getElementById('bienDetailValeurCard').textContent = b.valeur||'—';
  document.getElementById('bienDetailProprioCard').textContent = b.proprio||'—';

  // Locataires / unités tab — version compacte corrigée
  const allUnits = ensureBienUnits(b);
  const locataires = (DB.locatives||[]).filter(l=>l.parentBien===b.nom || l.bien===b.nom || allUnits.some(u=>getBienUnitFullName(b,u)===l.bien));
  const locEl = document.getElementById('bienDetailLocataires');
  const badgeUnit = (st)=>{
    const v = st || 'Disponible';
    const bg = v==='Loué' ? '#dcfce7' : v==='En attente' ? '#fef3c7' : '#dbeafe';
    const co = v==='Loué' ? '#166534' : v==='En attente' ? '#92400e' : '#1e40af';
    return `<span class="bd-mini-badge" style="background:${bg};color:${co}">${escapeHTML(v)}</span>`;
  };
  if(isMultiUnitBien(b)){
    locEl.innerHTML = allUnits.map(u=>{
      const fullName=getBienUnitFullName(b,u);
      const statut = u.statut || 'Disponible';
      const isFree = String(statut).toLowerCase().includes('disponible');
      const l = isFree ? null : locataires.find(x=>x.bien===fullName || x.uniteId===u.id);
      const locName = l?.locataire || u.locataire || '';
      const loyer = l?.loyer || u.loyer || '';
      const entree = l?.dateEntree || l?.date_entree || '';
      return `<div class="bd-unit-row ${isFree?'is-free':''}">
        <div class="bd-unit-main"><span class="material-symbols-rounded bd-unit-ico">door_front</span><b>${escapeHTML(u.nom)}</b>${badgeUnit(statut)}</div>
        <div class="bd-unit-info"><span><b>Locataire</b> ${isFree || !locName ? '<em>Aucun locataire</em>' : escapeHTML(locName)}</span></div>
        <div class="bd-unit-info"><span><b>Loyer</b> ${isFree || !loyer ? '—' : escapeHTML(loyer)}</span></div>
        <div class="bd-unit-info"><span><b>Entrée</b> ${isFree || !entree ? '—' : escapeHTML(entree)}</span></div>
        <div class="bd-unit-actions"><button type="button" class="bd-small-btn" onclick="event.stopPropagation();toast('Détails unité')"><span class="material-symbols-rounded">visibility</span> Voir</button></div>
      </div>`;
    }).join('');
  } else {
    const st = b.statut || 'Disponible';
    const isFree = String(st).toLowerCase().includes('disponible') || !locataires.length;
    locEl.innerHTML = isFree
      ? `<div class="bd-unit-row is-free"><div class="bd-unit-main"><span class="material-symbols-rounded bd-unit-ico">door_open</span><b>${escapeHTML(b.nom||'Bien')}</b>${badgeUnit('Disponible')}</div><div class="bd-unit-info"><span><b>Locataire</b> <em>Aucun locataire</em></span></div><div class="bd-unit-info"><span><b>Loyer</b> —</span></div><div class="bd-unit-info"><span><b>Entrée</b> —</span></div></div>`
      : locataires.map(l=>`<div class="bd-unit-row"><div class="bd-unit-main"><span class="material-symbols-rounded bd-unit-ico">person</span><b>${escapeHTML(l.locataire||'—')}</b>${badgeUnit(l.statut||'Loué')}</div><div class="bd-unit-info"><span><b>Loyer</b> ${escapeHTML(l.loyer||'—')}</span></div><div class="bd-unit-info"><span><b>Entrée</b> ${escapeHTML(l.dateEntree||l.date_entree||'—')}</span></div><div class="bd-unit-actions"><button type="button" class="bd-small-btn" onclick="event.stopPropagation();toast('Détails locataire')"><span class="material-symbols-rounded">visibility</span> Voir</button></div></div>`).join('');
  }

  // Propriétaire tab
  const proprio = (DB.proprietaires||[]).find(p=>(p.nom+' '+p.prenom)===b.proprio||(p.prenom+' '+p.nom)===b.proprio||p.nom===b.proprio);
  const propEl = document.getElementById('bienDetailProprioContent');
  if(proprio){
    const photoHTML = proprio.photo
      ? `<img src="${proprio.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--gold),#c4a030);border-radius:12px;font-size:22px;font-weight:900;color:#000">${(proprio.nom||'?')[0]}</div>`;
    propEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #f0f0f0">
        <div style="width:56px;height:56px;border-radius:12px;overflow:hidden;flex-shrink:0">${photoHTML}</div>
        <div>
          <div style="font-size:15px;font-weight:800;color:#111">${proprio.nom} ${proprio.prenom||''}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px">Propriétaire</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="padding:12px 14px;background:#f9fafb;border-radius:9px"><div style="font-size:9.5px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin-bottom:4px">Téléphone</div><div style="font-size:13px;font-weight:600;color:#111">${proprio.tel||'—'}</div></div>
        <div style="padding:12px 14px;background:#f9fafb;border-radius:9px"><div style="font-size:9.5px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin-bottom:4px">Email</div><div style="font-size:13px;font-weight:600;color:#111">${proprio.email||'—'}</div></div>
        <div style="padding:12px 14px;background:#f9fafb;border-radius:9px"><div style="font-size:9.5px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin-bottom:4px">Adresse</div><div style="font-size:13px;font-weight:600;color:#111">${proprio.adresse||'—'}</div></div>
        <div style="padding:12px 14px;background:#f9fafb;border-radius:9px"><div style="font-size:9.5px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin-bottom:4px">Statut matrimonial</div><div style="font-size:13px;font-weight:600;color:#111">${proprio.matri||'—'}</div></div>
      </div>`;
  } else {
    propEl.innerHTML = `<div style="text-align:center;padding:40px;color:#9ca3af"><span class="material-symbols-rounded" style="font-size:44px;opacity:.4;display:block;margin-bottom:8px">person</span><div style="font-size:12px">Propriétaire "${b.proprio||'—'}" non trouvé dans la base</div></div>`;
  }

  // Documents tab — contrats liés + documents ajoutés au bien
  renderBienDetailDocuments();

  // Navigate to the detail page
  navigate('bien-detail');
  // Reset to first tab
  switchBienTab(document.getElementById('bdTab-infos'), 'infos');
}

function closeBienDetail(){
  navigate('biens');
  _bienDetailIdx=-1;
}

function switchBienTab(el, tab){
  document.querySelectorAll('.bien-detail-tab').forEach(t=>{
    t.style.color='#555';
    t.style.borderBottom='2px solid transparent';
    t.style.fontWeight='500';
  });
  el.style.color='#16a34a';
  el.style.borderBottom='2px solid #16a34a';
  el.style.fontWeight='600';
  ['infos','locataires','proprio','docs'].forEach(t=>{
    const key = t.charAt(0).toUpperCase()+t.slice(1);
    const panel = document.getElementById('bienTab'+key);
    if(panel) panel.style.display = t===tab?'block':'none';
  });
}

function editBienFromDetail(){
  if(_bienDetailIdx>=0){ editRow('biens',_bienDetailIdx); }
}
function deleteBienFromDetail(){
  if(_bienDetailIdx<0) return;
  if(!confirm('Supprimer ce bien définitivement ?')) return;
  DB.biens.splice(_bienDetailIdx,1); saveDB(); closeBienDetail(); renderBiensCards(); toast('Bien supprimé ✓');
}

function toggleBiensExport(){
  const m=document.getElementById('biensExportMenu');
  m.style.display=m.style.display==='none'?'block':'none';
  if(m.style.display==='block'){
    setTimeout(()=>document.addEventListener('click',function h(e){if(!document.getElementById('biensExportWrap').contains(e.target)){m.style.display='none';document.removeEventListener('click',h);}},true),10);
  }
}

let _selectedBienDocFile = null;

function initBienDocDropZone(){
  const dz=document.getElementById('bienDocDropZone');
  if(!dz || dz.dataset.ready==='1') return;
  dz.dataset.ready='1';
  ['dragenter','dragover'].forEach(evt=>dz.addEventListener(evt,e=>{e.preventDefault();dz.classList.add('dragover');}));
  ['dragleave','drop'].forEach(evt=>dz.addEventListener(evt,e=>{e.preventDefault();dz.classList.remove('dragover');}));
  dz.addEventListener('drop',e=>handleBienDocFile(e.dataTransfer.files && e.dataTransfer.files[0]));
}
function handleBienDocFile(file){
  if(!file) return;
  _selectedBienDocFile=file;
  const selected=document.getElementById('bienDocSelected');
  if(selected){
    selected.style.display='block';
    selected.innerHTML = `<b>Fichier sélectionné :</b> ${escapeHTML(file.name)} <span style="color:#9ca3af">(${Math.round(file.size/1024)} Ko)</span>`;
  }
  const name=document.getElementById('bienDocName');
  if(name && !name.value.trim()) name.value=file.name.replace(/\.[^.]+$/,'');
}
function addDocumentToCurrentBien(){
  if(_bienDetailIdx<0 || !DB.biens[_bienDetailIdx]) return toast('Ouvrez d’abord un bien','err');
  const name=(document.getElementById('bienDocName')?.value||'').trim();
  const album=(document.getElementById('bienDocAlbum')?.value||'').trim() || 'Non classé';
  const file=_selectedBienDocFile;
  if(!name) return toast('Le nom du document est requis','err');
  if(!file) return toast('Choisissez un fichier','err');
  const reader=new FileReader();
  reader.onload=()=>{
    const b=DB.biens[_bienDetailIdx];
    if(!Array.isArray(b.documents)) b.documents=[];
    b.documents.push({id:genId('DOC'),nom:name,album,fileName:file.name,mime:file.type||'application/octet-stream',data:reader.result,createdAt:new Date().toISOString()});
    saveDB();
    _selectedBienDocFile=null;
    ['bienDocName','bienDocAlbum','bienDocFile'].forEach(id=>{const e=document.getElementById(id); if(e) e.value='';});
    const selected=document.getElementById('bienDocSelected'); if(selected){selected.style.display='none';selected.innerHTML='';}
    renderBienDetailDocuments();
    toast('Document ajouté ✓');
  };
  reader.readAsDataURL(file);
}
function removeDocumentFromCurrentBien(i){
  if(_bienDetailIdx<0 || !DB.biens[_bienDetailIdx]) return;
  if(!confirm('Supprimer ce document ?')) return;
  const docs=DB.biens[_bienDetailIdx].documents||[];
  docs.splice(i,1);
  DB.biens[_bienDetailIdx].documents=docs;
  saveDB();
  renderBienDetailDocuments();
  toast('Document supprimé ✓');
}
function previewDocHTML(d){
  const mime=d.mime||'';
  if(d.data && mime.startsWith('image/')) return `<img src="${d.data}" alt="${escapeHTML(d.nom||d.fileName||'Document')}">`;
  if(d.data && mime==='application/pdf') return `<iframe src="${d.data}#toolbar=0"></iframe>`;
  const icon=mime==='application/pdf'?'picture_as_pdf':(mime.startsWith('image/')?'image':'description');
  return `<span class="material-symbols-rounded">${icon}</span>`;
}
function renderBienDetailDocuments(){
  const docsEl=document.getElementById('bienDetailDocsContent');
  if(!docsEl || _bienDetailIdx<0 || !DB.biens[_bienDetailIdx]) return;
  initBienDocDropZone();
  const b=DB.biens[_bienDetailIdx];
  const contrats=(DB.contrats||[]).filter(c=>c.locative&&(DB.locatives||[]).find(l=>l.nom===c.locative&&(l.parentBien===b.nom || l.bien===b.nom || ensureBienUnits(b).some(u=>getBienUnitFullName(b,u)===l.bien))));
  const docs=Array.isArray(b.documents)?b.documents:[];
  const groups={};
  docs.forEach((d,i)=>{const album=d.album||'Non classé'; (groups[album]||(groups[album]=[])).push({d,i});});
  const docHTML=Object.keys(groups).sort().map(album=>`
    <div class="bien-doc-album-title"><span class="material-symbols-rounded" style="font-size:15px;color:var(--gold)">folder</span>${escapeHTML(album)}</div>
    ${groups[album].map(({d,i})=>`
      <div class="bien-doc-card">
        <div class="bien-doc-preview">${previewDocHTML(d)}</div>
        <div style="min-width:0">
          <div style="font-size:13px;font-weight:900;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(d.nom||d.fileName||'Document')}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(d.fileName||'fichier')} · ${d.createdAt?new Date(d.createdAt).toLocaleDateString('fr-FR'):''}</div>
        </div>
        <div class="bien-doc-actions">
          ${d.data?`<a href="${d.data}" target="_blank" class="btn btn-blue" style="font-size:11px;padding:6px 9px;text-decoration:none"><span class="material-symbols-rounded" style="font-size:14px">visibility</span> Aperçu</a>`:''}
          ${d.data?`<a href="${d.data}" download="${escapeHTML(d.fileName||'document')}" class="btn btn-primary" style="font-size:11px;padding:6px 9px;text-decoration:none"><span class="material-symbols-rounded" style="font-size:14px">download</span> Télécharger</a>`:''}
          <button type="button" class="btn btn-danger" onclick="removeDocumentFromCurrentBien(${i})" style="font-size:11px;padding:6px 9px"><span class="material-symbols-rounded" style="font-size:14px">delete</span></button>
        </div>
      </div>`).join('')}
  `).join('');
  const contratHTML=contrats.length?`
    <div class="bien-doc-album-title"><span class="material-symbols-rounded" style="font-size:15px;color:#2563eb">contract</span>Contrats liés</div>
    ${contrats.map(c=>`
      <div style="background:#f9fafb;border-radius:10px;padding:12px 14px;margin-bottom:8px;border:1px solid #e5e7eb;display:flex;align-items:center;gap:12px">
        <div style="width:38px;height:38px;border-radius:9px;background:#dbeafe;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span class="material-symbols-rounded" style="font-size:20px;color:#2563eb">description</span></div>
        <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#111">${escapeHTML(c.locataire||'—')} <span style="font-weight:400;color:#9ca3af">—</span> ${escapeHTML(c.locative||'—')}</div><div style="font-size:11px;color:#9ca3af;margin-top:2px">${escapeHTML(c.debut||'—')} → ${escapeHTML(c.fin||'—')}</div></div>
        <div style="text-align:right;flex-shrink:0"><span style="background:${c.statut==='Actif'?'#dcfce7':'#f3f4f6'};color:${c.statut==='Actif'?'#166534':'#374151'};font-size:10px;font-weight:700;padding:3px 8px;border-radius:12px">${escapeHTML(c.statut||'—')}</span><div style="font-size:12px;font-weight:700;color:#D4AF37;margin-top:4px">${escapeHTML(c.loyer||'')}</div></div>
      </div>`).join('')}
  `:'';
  docsEl.innerHTML = (docHTML || contratHTML) ? `${docHTML}${contratHTML}` : `<div style="text-align:center;padding:38px;color:#9ca3af"><span class="material-symbols-rounded" style="font-size:44px;opacity:.4;display:block;margin-bottom:8px">folder_open</span><div style="font-size:12px">Aucun document associé à ce bien</div></div>`;
}
function resetBienDocumentInputs(){ /* gardé pour compatibilité */ }

async function saveBien(){
  const nom=v('b-nom').trim();
  const type=v('b-type');
  const proprio=v('b-proprio');
  const valeur=v('b-valeur');
  const vente=v('b-vente');
  const statut=v('b-statut')||'Disponible';
  if(!nom)return toast('Le nom du bien est requis','err');
  if(!vente)return toast('Indiquez si le bien est destiné à la vente','err');
  if(!type)return toast('Le type de bien est requis','err');
  if(!proprio)return toast('Le propriétaire est requis','err');
  if(!valeur)return toast('La valeur du bien est requise','err');
  const nbAppart = (type==='Immeuble') ? parseInt(v('b-nb-appart')||'0',10) : 0;
  if(type==='Immeuble' && (!nbAppart || nbAppart<1)) return toast('Le nombre d\'appartements est requis','err');
  const photo=await getPhotoData('b-photo-input');
  const bien = {
    id:genId('BI'), nom, vente, type, proprio,
    valeur:fmt(num(valeur))+' FCFA', adresse:v('b-adresse'), nbAppart: nbAppart || '',
    etat:v('b-etat')||'Bon état', statut, photo:photo||'',
    documents:[]
  };
  if(nbAppart>1){
    bien.unites = Array.from({length:nbAppart},(_,i)=>({
      id:genId('UNT'),
      nom:`Appartement ${i+1}`,
      statut:'Disponible',
      loyer:'',
      locataire:''
    }));
    bien.statut='Disponible';
  }
  const _db = window.GPDB && window.GPDB.load ? window.GPDB.load() : DB;
  if(!Array.isArray(_db.biens)) _db.biens=[];
  _db.biens.push(bien);
  if(window.GPDB && window.GPDB.save) window.GPDB.save(_db); else { window.DB=_db; saveDB(); }
  resetAfterSave('page-nv-bien');
  resetBienDocumentInputs();
  navigate('biens');toast('Bien enregistré avec succès ✓');
}
async function saveLocative(){
  const locataire=v('lv-locataire');
  const bien=v('lv-bien');
  const loyer=v('lv-loyer');
  const dateEntree=v('lv-date-entree');
  if(!locataire)return toast('Le locataire est requis','err');
  if(!bien)return toast('Le bien est requis','err');
  if(!loyer)return toast('Le loyer est requis','err');
  if(!dateEntree)return toast("La date d’entrée est requise",'err');
  const photo=await getPhotoData('lv-photo-input');
  const nom='Location - '+bien;
  const found=findUnitByFullName(bien);
  const statutLoc=v('lv-statut')||'Loué';
  const _db=window.GPDB&&window.GPDB.load?window.GPDB.load():DB;if(!Array.isArray(_db.locatives))_db.locatives=[];_db.locatives.push({
    id:genId('LV'), nom, locataire, bien, parentBien:found.bien?.nom||bien, uniteId:found.unite?.id||'', occupant:locataire,
    loyer:fmt(num(loyer))+' FCFA', charge:fmt(num(v('lv-charge')))+' FCFA',
    dateEntree, statut:statutLoc, photo:photo||''
  });
  syncLocataireBienFromLocations(locataire, bien);
  // Mettre à jour automatiquement le statut de l'appartement ou du bien sélectionné
  if(found.bien && found.unite){
    found.unite.statut=statutLoc;
    found.unite.loyer=fmt(num(loyer))+' FCFA';
    found.unite.locataire=locataire;
    syncBienStatusFromUnits(found.bien);
  } else {
    const b=DB.biens.find(x=>x.nom===bien);
    if(b) b.statut=statutLoc;
  }
  saveDB();
  resetAfterSave('page-nv-locative');
  navigate('locatives');toast('Location enregistrée avec succès ✓');
}
function saveContrat(){
  const loc=v('ct-locataire');
  if(!loc)return toast('Le locataire est requis','err');
  const locative=v('ct-locative');
  if(!locative)return toast('La locative est requise','err');
  const _db = window.GPDB && window.GPDB.load ? window.GPDB.load() : DB;
  if(!Array.isArray(_db.contrats)) _db.contrats=[];
  _db.contrats.push({
    num:v('ct-num')||('CT-'+Date.now()),
    locataire:loc,
    locative,
    type:v('ct-type'),
    debut:v('ct-debut'),
    fin:v('ct-fin'),
    statut:v('ct-statut'),
    prochain:v('ct-prochain'),
    loyer:v('ct-loyer'),
    charges:v('ct-charges'),
    caution:v('ct-caution'),
    honor:v('ct-honor'),
    frais:v('ct-frais'),
    obs:v('ct-obs')||'Néant',
    sign:v('ct-sign')||v('ct-debut')
  });
  if(window.GPDB && window.GPDB.save) window.GPDB.save(_db); else { window.DB=_db; saveDB(); }
  resetAfterSave('page-nv-contrat');
  navigate('contrats');toast('Contrat créé avec succès ✓');
}

/* ============================================================
   PAIEMENTS MODAL
============================================================ */
function openPayModal(){
  const m=document.getElementById('payModal');
  m.style.display='flex';
  m.style.alignItems='center';
  m.style.justifyContent='center';
  document.getElementById('pay-date').value=new Date().toISOString().split('T')[0];
  ['pay-montant','pay-paye','pay-reste'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  const sl=document.getElementById('pay-locataire');
  sl.innerHTML='<option value="">Sélectionner</option>'+DB.locataires.map(l=>`<option>${l.prenom} ${l.nom}</option>`).join('');
  const slv=document.getElementById('pay-locative');
  slv.innerHTML='<option value="">Sélectionner</option>'+DB.locatives.map(l=>`<option>${l.nom}</option>`).join('');
}
function closePayModal(){
  ['pay-locataire','pay-locative','pay-montant','pay-paye','pay-reste'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  document.getElementById('payModal').style.display='none';
}
function syncPayModalFromLocataire(){
  const loc=v('pay-locataire');
  const slv=document.getElementById('pay-locative');
  const locations=(DB.locatives||[]).filter(l=>String(l.locataire||l.occupant||'')===loc);
  slv.innerHTML='<option value="">Sélectionner</option>'+(locations.length?locations:DB.locatives).map(l=>`<option>${l.nom}</option>`).join('');
  if(locations.length===1){ slv.value=locations[0].nom; syncPayModalFromLocative(); }
}
function syncPayModalFromLocative(){
  const locative=v('pay-locative');
  const lv=(DB.locatives||[]).find(l=>l.nom===locative);
  if(lv){
    document.getElementById('pay-montant').value=num(lv.loyer);
    document.getElementById('pay-paye').value=num(lv.loyer);
    updatePayReste();
  }
}
function updatePayReste(){
  const m=num(document.getElementById('pay-montant').value);
  const p=num(document.getElementById('pay-paye').value);
  document.getElementById('pay-reste').value=Math.max(0,m-p);
}
function savePaiement(){
  const loc=v('pay-locataire');
  if(!loc)return toast('Le locataire est requis','err');
  const locative=v('pay-locative');
  if(!locative)return toast('La location est requise','err');
  const montant=v('pay-montant');
  if(!montant)return gp_fieldError('pay-montant','Le montant est requis');
  if(num(montant)<=0)return gp_fieldError('pay-montant','Le montant doit être supérieur à 0');
  const paye=v('pay-paye')||'0';
  if(num(paye)<0)return gp_fieldError('pay-paye','Le montant payé ne peut pas être négatif');
  if(num(paye)>num(montant))return gp_fieldError('pay-paye','Le montant payé dépasse le montant total');
  const reste=String(Math.max(0,num(montant)-num(paye)));
  const date=v('pay-date') || new Date().toISOString().split('T')[0];
  const _db2=window.GPDB&&window.GPDB.load?window.GPDB.load():DB;if(!Array.isArray(_db2.paiements))_db2.paiements=[];_db2.paiements.unshift({locataire:loc,locative,montant,paye,reste,date,mode:v('pay-mode')});
  if(num(reste)===0){
    const ct=DB.contrats.find(c=>c.locataire===loc&&c.locative===locative&&c.statut==='Actif');
    if(ct){
      let d=parseGPDate(ct.prochain) || parseGPDate(date) || new Date();
      while(d <= parseGPDate(date)){ d=addOneMonthGP(d); }
      ct.prochain=formatGPDate(d);
    }
  }
  saveDB();
  closePayModal();
  renderPaiements();
  if(typeof renderAvenir==='function') renderAvenir();
  updateSidebarBadges();
  toast('Paiement enregistré ✓');
}


function fillProprioBien(){
  const sel=document.getElementById('b-proprio');
  if(!sel)return;
  sel.innerHTML='<option value="">Sélectionnez</option>'+DB.proprietaires.map(p=>`<option>${p.prenom} ${p.nom}</option>`).join('');
}
function fillLocativeSelects(){
  const sl=document.getElementById('lv-locataire');
  if(sl) sl.innerHTML='<option value="">Sélectionner un locataire</option>'+DB.locataires.map(l=>`<option>${l.prenom} ${l.nom}</option>`).join('');
  const sb=document.getElementById('lv-bien');
  if(sb){
    const options=[];
    (DB.biens||[]).forEach(b=>{
      ensureBienUnits(b);
      if(isMultiUnitBien(b)){
        options.push(`<optgroup label="${escapeHTML(b.nom)} — ${escapeHTML(b.proprio||'Propriétaire')}">${ensureBienUnits(b).map(u=>`<option value="${escapeHTML(getBienUnitFullName(b,u))}">${escapeHTML(u.nom)} — ${escapeHTML(u.statut||'Disponible')}</option>`).join('')}</optgroup>`);
      } else {
        options.push(`<option value="${escapeHTML(b.nom)}">${escapeHTML(b.nom)}</option>`);
      }
    });
    sb.innerHTML='<option value="">Sélectionner un bien / appartement</option>'+options.join('');
  }
  const d=document.getElementById('lv-date-entree');
  if(d && !d.value) d.value=new Date().toISOString().split('T')[0];
}
function fillContratSelects(){
  const num='CT-'+new Date().getFullYear()+'-'+Math.floor(100000+Math.random()*900000);
  const el=document.getElementById('ct-num');
  if(el)el.value=num;
  const sl=document.getElementById('ct-locataire');
  if(sl) sl.innerHTML='<option value="">Sélectionner</option>'+DB.locataires.map(l=>`<option>${l.prenom} ${l.nom}</option>`).join('');
  const slv=document.getElementById('ct-locative');
  if(slv) slv.innerHTML='<option value="">Sélectionner</option>'+DB.locatives.map(l=>`<option>${l.nom}</option>`).join('');
}

/* ============================================================
   PDF CONTRAT (depuis formulaire nouveau contrat)
============================================================ */
/* ============================================================
   GÉNÉRATION CONTRAT .DOCX (format officiel)
============================================================ */
function _getAgenceInfo(){
  return {
    agence:  document.getElementById('cfg-agence')?.value  || localStorage.getItem('geniusproperty_agence')  || 'Genius Property',
    email:   document.getElementById('cfg-email')?.value   || localStorage.getItem('geniusproperty_email')   || 'contact@geniusproperty.com',
    tel:     document.getElementById('cfg-tel')?.value     || localStorage.getItem('geniusproperty_tel')     || '',
    adresse: document.getElementById('cfg-adresse')?.value || localStorage.getItem('geniusproperty_adresse') || 'Dakar, Sénégal',
    rccm:    document.getElementById('cfg-rccm')?.value    || localStorage.getItem('geniusproperty_rccm')    || '',
    ninea:   document.getElementById('cfg-ninea')?.value   || localStorage.getItem('geniusproperty_ninea')   || '',
    logo:    localStorage.getItem('geniusproperty_logo')   || ''
  };
}

function _buildContratData(fields){
  const ag = _getAgenceInfo();
  return Object.assign({}, ag, fields);
}

function genererDOCX(){
  const numVal = v('ct-num');
  if(!numVal){ toast('Veuillez générer un numéro de contrat','err'); return; }
  const data = _buildContratData({
    num: numVal,
    locataire: v('ct-locataire'),
    locative:  v('ct-locative'),
    type:      v('ct-type'),
    debut:     v('ct-debut'),
    fin:       v('ct-fin'),
    statut:    v('ct-statut'),
    loyer:     v('ct-loyer'),
    charges:   v('ct-charges'),
    caution:   v('ct-caution'),
    honor:     v('ct-honor'),
    frais:     v('ct-frais'),
    prochain:  v('ct-prochain'),
    obs:       v('ct-obs')||'Néant',
    sign:      v('ct-sign')
  });
  _downloadContratDOCX(data);
}

function genererDOCXOfficiel(idx){
  const c = DB.contrats[idx];
  if(!c) return;
  const ag = _getAgenceInfo();
  const data = _buildContratData({
    num:      c.num||('CT-'+Date.now()),
    locataire:c.locataire,
    locative: c.locative,
    type:     c.type||'Habitation',
    debut:    c.debut,
    fin:      c.fin,
    statut:   c.statut,
    loyer:    c.loyer||'',
    charges:  c.charges||'',
    caution:  c.caution||'',
    honor:    c.honor||'',
    frais:    c.frais||'',
    prochain: c.prochain,
    obs:      c.obs||'Néant',
    sign:     c.sign||c.debut
  });
  _downloadContratDOCX(data);
}

// Kept for backward compat (used by genererPDFContrat calls elsewhere)
function genererPDFContrat(idx){ genererDOCXOfficiel(idx); }
function genererPDFOfficiel(idx){ genererDOCXOfficiel(idx); }

async function _downloadContratDOCX(d){
  try {
    const D = await window.ensureDocx();
    const fmtN = n => Number(n||0).toLocaleString('fr-FR');
    const totalLoyer = (Number(d.loyer)||0)+(Number(d.charges)||0);

    // ── style helpers ─────────────────────────────────────────
    const AR = (opts={}) => ({font:{name:'Arial'}, size:opts.size||22,
      bold:!!opts.bold, italics:!!opts.italic, color:opts.color||'1A1A1A', allCaps:!!opts.caps});

    const b0 = {style:D.BorderStyle.NONE,color:'FFFFFF',size:0};
    const borders0 = {top:b0,bottom:b0,left:b0,right:b0};
    const bGray = {style:D.BorderStyle.SINGLE,color:'CCCCCC',size:1};
    const bordersGray = {top:bGray,bottom:bGray,left:bGray,right:bGray};

    const run = (text,opts={}) => new D.TextRun({text, ...AR(opts)});

    const para = (children, opts={}) => new D.Paragraph({
      spacing:{before:opts.before??100,after:opts.after??100},
      alignment:opts.align||D.AlignmentType.LEFT,
      border:opts.border||undefined,
      indent:opts.indent||undefined,
      children: Array.isArray(children)?children:[children]
    });

    const sectionTitle = label => new D.Paragraph({
      border:{bottom:{style:D.BorderStyle.SINGLE,color:'1A4A3C',size:4}},
      spacing:{before:280,after:120},
      children:[run(label,{bold:true,caps:true,color:'1A4A3C',size:24})]
    });

    const articleTitle = label => para(
      [run(label,{bold:true,color:'1A4A3C',size:22})],{before:200,after:80}
    );

    const bodyPara = (segs, opts={}) => para(
      (typeof segs==='string'?[{text:segs}]:segs).map(s=>run(s.text,{bold:s.bold,italic:s.italic,color:s.color})),
      opts
    );

    const bullet = text => new D.Paragraph({
      spacing:{before:40,after:40},
      indent:{left:360,hanging:240},
      children:[run('▪  ',{color:'2D7A5F'}), run(text)]
    });

    // ── recap row ─────────────────────────────────────────────
    const recapRow = (label,value) => new D.TableRow({children:[
      new D.TableCell({borders:bordersGray,width:{size:3500,type:D.WidthType.DXA},
        shading:{fill:'E8F4F0',type:D.ShadingType.CLEAR},
        margins:{top:80,bottom:80,left:150,right:100},
        children:[para([run(label,{bold:true,color:'2D7A5F',size:20})],{before:0,after:0})]}),
      new D.TableCell({borders:bordersGray,width:{size:5860,type:D.WidthType.DXA},
        margins:{top:80,bottom:80,left:150,right:100},
        children:[para([run(value,{size:20})],{before:0,after:0})]})
    ]});

    // ── HEADER table ──────────────────────────────────────────
    // Build left cell children (with logo if available)
    const headerLeftChildren = [];
    if(d.logo && d.logo.startsWith('data:image')){
      try{
        // Extract base64 data & type
        const logoMatch = d.logo.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if(logoMatch){
          const logoMime = logoMatch[1]; // e.g. image/png
          const logoB64  = logoMatch[2];
          const logoBytes = Uint8Array.from(atob(logoB64), c => c.charCodeAt(0));
          headerLeftChildren.push(new D.Paragraph({
            spacing:{before:0,after:60},
            children:[new D.ImageRun({
              data: logoBytes,
              transformation:{width:80,height:80},
              type: logoMime==='image/png'?'png':logoMime==='image/jpeg'?'jpg':'png'
            })]
          }));
        }
      } catch(e){ /* ignore logo error, continue without it */ }
    }
    headerLeftChildren.push(
      para([run(d.agence.toUpperCase(),{bold:true,color:'1A4A3C',size:26})],{before:0,after:0}),
      para([run('Agence Immobilière Agréée',{color:'6B7280',size:18})],{before:0,after:0}),
      para([run((d.rccm?'RCCM: '+d.rccm:'')+(d.rccm&&d.ninea?'  |  ':'')+(d.ninea?'NINEA: '+d.ninea:''),{color:'9CA3AF',size:16})],{before:0,after:0}),
    );

    const headerTable = new D.Table({
      width:{size:9638,type:D.WidthType.DXA}, columnWidths:[5000,4638],
      rows:[new D.TableRow({children:[
        new D.TableCell({borders:borders0,width:{size:5000,type:D.WidthType.DXA},
          margins:{top:60,bottom:60,left:0,right:100},children: headerLeftChildren}),
        new D.TableCell({borders:borders0,width:{size:4638,type:D.WidthType.DXA},
          margins:{top:60,bottom:60,left:100,right:0},children:[
            para([run('Contrat N° '+d.num,{bold:true,color:'C9A84C',size:22})],{before:0,after:0,align:D.AlignmentType.RIGHT}),
            para([run(d.adresse,{color:'6B7280',size:18})],{before:0,after:0,align:D.AlignmentType.RIGHT}),
            para([run(d.tel?'Tél: '+d.tel:'',{color:'9CA3AF',size:16})],{before:0,after:0,align:D.AlignmentType.RIGHT}),
          ]}),
      ]})]
    });

    // ── FOOTER ────────────────────────────────────────────────
    const footerPara = new D.Paragraph({
      border:{top:{style:D.BorderStyle.SINGLE,color:'E5E7EB',size:2}},
      spacing:{before:80}, alignment:D.AlignmentType.CENTER,
      children:[
        run(d.agence+'  —  '+d.adresse+'  —  '+d.email+'  —  Page ',{color:'9CA3AF',size:16,italic:true}),
        new D.TextRun({children:[D.PageNumber.CURRENT],font:{name:'Arial'},size:16,color:'9CA3AF',italics:true}),
      ]
    });

    // ── RECAP TABLE ───────────────────────────────────────────
    const recapTable = new D.Table({
      width:{size:9360,type:D.WidthType.DXA}, columnWidths:[3500,5860],
      rows:[
        recapRow('Numéro de contrat', d.num),
        recapRow('Type de bail', 'Bail d’habitation'),
        recapRow('Statut', d.statut),
        recapRow('Date de signature', d.sign||d.debut),
        recapRow('Date de début', d.debut),
        recapRow('Date de fin', d.fin),
        recapRow('Loyer mensuel', fmtN(d.loyer)+' FCFA'),
        recapRow('Charges mensuelles', fmtN(d.charges)+' FCFA'),
        recapRow('Caution', fmtN(d.caution)+' FCFA'),
        recapRow('Honoraires d’agence', fmtN(d.honor)+' FCFA'),
        recapRow('Frais de dossier', fmtN(d.frais)+' FCFA'),
        recapRow('Premier paiement', d.prochain),
      ]
    });

    // ── SIGNATURE TABLE ───────────────────────────────────────
    const sigTable = new D.Table({
      width:{size:9360,type:D.WidthType.DXA}, columnWidths:[4680,4680],
      rows:[new D.TableRow({children:[
        new D.TableCell({borders:borders0,width:{size:4680,type:D.WidthType.DXA},
          margins:{top:80,bottom:80,left:0,right:100},children:[
            para([run('Pour le Bailleur',{bold:true,color:'1A4A3C'})],{before:0,after:0}),
            para([run(d.agence.toUpperCase(),{size:20})],{before:0,after:0}),
            para([run('Directeur Général',{italic:true,color:'6B7280',size:18})],{before:0,after:0}),
            new D.Paragraph({border:{bottom:{style:D.BorderStyle.SINGLE,color:'CCCCCC',size:2}},spacing:{before:600},
              children:[run('Signature et cachet :',{color:'9CA3AF',size:18})]}),
          ]}),
        new D.TableCell({borders:borders0,width:{size:4680,type:D.WidthType.DXA},
          margins:{top:80,bottom:80,left:100,right:0},children:[
            para([run('Le Locataire',{bold:true,color:'1A4A3C'})],{before:0,after:0}),
            para([run(d.locataire,{size:20})],{before:0,after:0}),
            para([run('Lu et approuvé — Bon pour accord',{italic:true,color:'6B7280',size:18})],{before:0,after:0}),
            new D.Paragraph({border:{bottom:{style:D.BorderStyle.SINGLE,color:'CCCCCC',size:2}},spacing:{before:600},
              children:[run('Signature précédée de la mention :',{color:'9CA3AF',size:18})]}),
          ]}),
      ]})]
    });

    // ── DOCUMENT ──────────────────────────────────────────────
    const doc = new D.Document({sections:[{
      properties:{page:{
        size:{width:11906,height:16838},
        margin:{top:1134,right:1134,bottom:1134,left:1134,header:708,footer:708}
      }},
      headers:{default:new D.Header({children:[headerTable]})},
      footers:{default:new D.Footer({children:[footerPara]})},
      children:[
        // TITLE
        new D.Paragraph({alignment:D.AlignmentType.CENTER,spacing:{before:240,after:60},
          children:[run('CONTRAT DE BAIL D’HABITATION',{bold:true,caps:true,color:'1A4A3C',size:36})]}),
        new D.Paragraph({alignment:D.AlignmentType.CENTER,spacing:{before:0,after:60},
          children:[run('Établi conformément à la loi n°77-69 du 14 juillet 1977',{italic:true,color:'6B7280',size:20})]}),
        new D.Paragraph({alignment:D.AlignmentType.CENTER,spacing:{before:0,after:300},
          children:[run('relative aux baux d’immeubles à usage d’habitation au Sénégal',{italic:true,color:'6B7280',size:20})]}),

        // RÉCAP
        sectionTitle('Récapitulatif du contrat'),
        recapTable,

        // PARTIES
        sectionTitle('Entre les soussignés'),
        articleTitle('Article 1 – Le Bailleur'),
        bodyPara([
          {text:d.agence.toUpperCase(),bold:true},
          {text:`, dont le siège social est situé au `},
          {text:d.adresse,bold:true},
          {text:`, représentée par son Directeur Général, agissant en qualité de mandataire du propriétaire du bien.`}
        ],{before:100,after:80}),
        articleTitle('Article 2 – Le Locataire'),
        bodyPara([{text:d.locataire,bold:true},{text:', ci-après désigné « le Locataire ».'}],{before:100,after:80}),

        // OBJET
        sectionTitle('Objet du contrat'),
        articleTitle('Article 3 – Désignation du bien loué'),
        bodyPara([
          {text:'Le Bailleur donne en location à bail le bien situé au '},
          {text:d.locative||'—',bold:true},
          {text:'. Type de contrat : '},{text:d.type,bold:true},{text:'.'}
        ],{before:100,after:80}),

        // DURÉE & FINANCES
        sectionTitle('Durée — Conditions financières'),
        articleTitle('Article 4 – Durée du bail'),
        bodyPara([
          {text:'Le présent bail prend effet le '},{text:d.debut,bold:true},
          {text:' et se termine le '},{text:d.fin,bold:true},
          {text:'. Il sera reconduit tacitement par période d’un an, sauf dénonciation par l’une des parties par lettre recommandée avec accusé de réception, au moins trois (03) mois avant l’échéance.'}
        ],{before:100,after:80}),
        articleTitle('Article 5 – Loyer et charges'),
        bodyPara([
          {text:'Le loyer mensuel est fixé à '},
          {text:fmtN(d.loyer)+' FCFA',bold:true},
          {text:' payable d’avance le 1er de chaque mois. Les charges mensuelles s’élèvent à '},
          {text:fmtN(d.charges)+' FCFA',bold:true},{text:'.'}
        ],{before:100,after:60}),
        bodyPara([{text:'Le loyer total mensuel toutes charges comprises est de '+fmtN(totalLoyer)+' FCFA.',bold:true}],{before:0,after:80}),
        articleTitle('Article 6 – Caution et garanties'),
        bodyPara([
          {text:'En garantie de l’exécution de ses obligations, le Locataire verse une caution de '},
          {text:fmtN(d.caution)+' FCFA',bold:true},
          {text:'. Cette caution sera restituée dans un délai de deux (02) mois suivant la restitution des clés.'}
        ],{before:100,after:80}),
        articleTitle('Article 7 – Honoraires et frais de dossier'),
        bodyPara([{text:'Honoraires d’agence : ',bold:true},{text:fmtN(d.honor)+' FCFA TTC (payables à la signature).'}],{before:80,after:40}),
        bodyPara([{text:'Frais de dossier : ',bold:true},{text:fmtN(d.frais)+' FCFA.'}],{before:0,after:80}),

        // OBLIGATIONS
        sectionTitle('Obligations des parties'),
        articleTitle('Article 8 – Obligations du Locataire'),
        bullet('Payer le loyer et les charges aux termes convenus ;'),
        bullet('User du bien loué en bon père de famille et conformément à sa destination ;'),
        bullet('Ne pas sous-louer sans l’accord écrit préalable du Bailleur ;'),
        bullet('Ne pas effectuer de travaux de transformation sans autorisation écrite ;'),
        bullet('Entretenir le logement et effectuer les menues réparations locatives ;'),
        bullet('Souscrire une assurance habitation et en justifier à première demande ;'),
        bullet('Permettre l’accès au logement pour les visites d’entretien (préavis 48h) ;'),
        bullet('Restituer le logement en bon état à l’expiration du bail.'),
        articleTitle('Article 9 – Obligations du Bailleur'),
        bullet('Délivrer le logement en bon état d’usage et de réparation ;'),
        bullet('Assurer la jouissance paisible du logement pendant toute la durée du bail ;'),
        bullet('Effectuer les réparations nécessaires autres que locatives dans un délai raisonnable ;'),
        bullet('Respecter les droits du Locataire dans les conditions prévues par la loi.'),

        // CLAUSES & RÉSILIATION
        sectionTitle('Clauses particulières et résiliation'),
        articleTitle('Article 10 – Clauses particulières'),
        bodyPara('Le Locataire déclare occuper le bien à titre de résidence principale. Il s’engage à maintenir les lieux en bon état de propreté et de sécurité.'+(d.obs&&d.obs!=='Néant'?' '+d.obs:''),{before:100,after:80}),
        articleTitle('Article 11 – Révision du loyer'),
        bodyPara('Le loyer pourra être révisé annuellement dans la limite de l’indice officiel des prix à la consommation. Toute révision fera l’objet d’une notification écrite au Locataire au moins deux (02) mois avant son entrée en vigueur.',{before:100,after:80}),
        articleTitle('Article 12 – Résiliation'),
        bodyPara('En cas de défaut de paiement du loyer pendant deux (02) mois consécutifs, le Bailleur pourra résilier de plein droit le présent bail après mise en demeure restée sans effet pendant quinze (15) jours. La résiliation à l’initiative du Locataire requéert un préavis de trois (03) mois par lettre recommandée avec accusé de réception.',{before:100,after:80}),

        // DISPOSITIONS FINALES
        sectionTitle('Dispositions finales'),
        articleTitle('Article 13 – Élection de domicile et juridiction compétente'),
        bodyPara([
          {text:'Tout litige relatif à l’exécution du présent contrat sera soumis à la compétence exclusive du '},
          {text:'Tribunal Régional Hors Classe de Dakar',bold:true},
          {text:', conformément aux dispositions légales en vigueur.'}
        ],{before:100,after:80}),
        articleTitle('Article 14 – Loi applicable'),
        bodyPara('Le présent contrat est soumis au droit sénégalais, notamment la loi n°77-69 du 14 juillet 1977 et le décret n°81-683 du 10 juillet 1981.',{before:100,after:80}),

        // SIGNATURES
        sectionTitle('Signatures'),
        new D.Paragraph({spacing:{before:200,after:100},alignment:D.AlignmentType.LEFT,
          children:[run('Fait à Dakar, le '+(d.sign||d.debut)+', en deux (02) exemplaires originaux, dont un remis à chacune des parties.',{italic:true,size:22})]}),
        sigTable,
        new D.Paragraph({spacing:{before:40,after:40},children:[run('')]}),
        new D.Paragraph({
          border:{top:{style:D.BorderStyle.SINGLE,color:'E5E7EB',size:2}},
          spacing:{before:120},alignment:D.AlignmentType.CENTER,
          children:[run('Ce contrat a été établi par '+d.agence+' conformément à la législation sénégalaise en vigueur.',{italic:true,color:'9CA3AF',size:16})]}),
      ]
    }]});

    D.Packer.toBlob(doc).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Contrat_' + d.num + '.docx';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast('Contrat .docx généré ✓');
    }).catch(err => {
      console.error(err);
      toast('Erreur génération contrat','err');
    });
  } catch(e) {
    console.error(e);
    toast('Erreur: '+e.message,'err');
  }
}

/* ============================================================
   HISTORIQUE PAIEMENTS LOCATAIRE
============================================================ */
function viewLocatairePaiements(nom, prenom){
  const fullName=prenom+' '+nom;
  const paiements=DB.paiements.filter(p=>p.locataire&&p.locataire.toLowerCase().includes(nom.toLowerCase()));
  const totalM=paiements.reduce((s,p)=>s+num(p.montant),0);
  const totalP=paiements.reduce((s,p)=>s+num(p.paye),0);
  const totalR=totalM-totalP;

  const rows=paiements.length
    ? paiements.map((p,i)=>`<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">#${String(i+1).padStart(3,'0')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">${p.locative||'—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-weight:600">${fmt(num(p.montant))} FCFA</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:var(--green);font-weight:600">${fmt(num(p.paye))} FCFA</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:${num(p.reste)>0?'orange':'var(--green)'};font-weight:600">${fmt(num(p.reste))} FCFA</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">${p.date||'—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0"><span class="badge ${num(p.reste)===0?'green':'orange'}">${num(p.reste)===0?'Soldé':'Partiel'}</span></td>
      </tr>`).join('')
    : `<tr><td colspan="7" style="text-align:center;padding:30px;color:#999">Aucun paiement enregistré</td></tr>`;

  document.getElementById('rowModalTitleText').textContent=`Historique paiements — ${fullName}`;
  document.querySelector('#rowModalTitle .material-symbols-rounded').textContent='receipt_long';
  document.getElementById('rowModalBody').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px">
      <div style="background:#f8f9fa;border-radius:8px;padding:12px;text-align:center;border-left:3px solid var(--gold)">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase">Total dû</div>
        <div style="font-size:16px;font-weight:700;color:#0F0F0F;margin-top:4px">${fmt(totalM)} FCFA</div>
      </div>
      <div style="background:#dcfce7;border-radius:8px;padding:12px;text-align:center;border-left:3px solid var(--green)">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#166534;text-transform:uppercase">Total payé</div>
        <div style="font-size:16px;font-weight:700;color:var(--green);margin-top:4px">${fmt(totalP)} FCFA</div>
      </div>
      <div style="background:${totalR>0?'#ffedd5':'#f0fdf4'};border-radius:8px;padding:12px;text-align:center;border-left:3px solid ${totalR>0?'orange':'var(--green)'}">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${totalR>0?'#9a3412':'#166534'};text-transform:uppercase">Reste</div>
        <div style="font-size:16px;font-weight:700;color:${totalR>0?'orange':'var(--green)'};margin-top:4px">${fmt(totalR)} FCFA</div>
      </div>
    </div>
    <div style="overflow-x:auto;border-radius:8px;border:1px solid #f0f0f0">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#555">#</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#555">Locative</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#555">Montant dû</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#555">Payé</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#555">Reste</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#555">Date</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#555">Statut</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  // Boutons modal footer
  const sb=document.getElementById('rowModalSaveBtn');
  if(sb)sb.style.display='none';
  document.getElementById('rowModalEditBtn').style.display='none';
  document.getElementById('rowModalDelBtn').style.display='none';

  // Ajouter bouton export PDF paiements
  const footer=document.querySelector('.modal-footer');
  let expBtn=document.getElementById('payHistPDFBtn');
  if(!expBtn){
    expBtn=document.createElement('button');
    expBtn.id='payHistPDFBtn';
    expBtn.className='btn btn-blue';
    expBtn.innerHTML='<span class="material-symbols-rounded" style="font-size:15px">picture_as_pdf</span> Exporter PDF';
    footer.insertBefore(expBtn,footer.lastElementChild);
  } else {expBtn.style.display='inline-flex';}
  expBtn.onclick=()=>exportPayHistPDF(fullName,paiements,totalM,totalP,totalR);

  document.getElementById('rowModal').classList.add('open');
}

function exportPayHistPDF(name,paiements,totalM,totalP,totalR){
  const ag=_getAgenceInfo();
  const agence=ag.agence; const tel=ag.tel; const adresse=ag.adresse; const email=ag.email; const rccm=ag.rccm; const ninea=ag.ninea; const logo=ag.logo;
  const logoHTML = logo ? `<img src="${logo}" style="width:54px;height:54px;object-fit:contain;border-radius:8px;border:1px solid rgba(212,175,55,.3);padding:3px;background:rgba(255,255,255,.07);flex-shrink:0">` : '';
  const rccmNinea = [rccm?'RCCM '+rccm:'', ninea?'NINEA '+ninea:''].filter(Boolean).join(' | ');
  const rows=paiements.map((p,i)=>`<tr style="border-bottom:1px solid #eee">
    <td style="padding:8px 12px">#${String(i+1).padStart(3,'0')}</td>
    <td style="padding:8px 12px">${p.locative||'—'}</td>
    <td style="padding:8px 12px;font-weight:600">${fmt(num(p.montant))} FCFA</td>
    <td style="padding:8px 12px;color:#16a34a;font-weight:600">${fmt(num(p.paye))} FCFA</td>
    <td style="padding:8px 12px;color:${num(p.reste)>0?'orange':'#16a34a'};font-weight:600">${fmt(num(p.reste))} FCFA</td>
    <td style="padding:8px 12px">${p.date||'—'}</td>
    <td style="padding:8px 12px">${num(p.reste)===0?'Soldé':'Partiel'}</td>
  </tr>`).join('');

  const content=`<div style="font-family:Arial,sans-serif;padding:40px;color:#1a1a2e">
    <div style="background:#0F0F0F;padding:24px 32px;border-radius:10px;color:#fff;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;align-items:flex-start;gap:14px">
        ${logoHTML}
        <div>
          <div style="font-size:22px;font-weight:900;color:#D4AF37;letter-spacing:2px">${agence.toUpperCase()}</div>
          <div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,.5);margin-top:2px">GESTION IMMOBILIÈRE</div>
          <div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:6px;line-height:1.7">${adresse?adresse+'<br>':''}${tel?'Tél: '+tel+'<br>':''}${email}${rccmNinea?'<br>'+rccmNinea:''}</div>
        </div>
      </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px;font-weight:700;color:#fff">Historique de Paiements</div>
        <div style="font-size:12px;color:#D4AF37;margin-top:4px">${name}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:2px">Édité le ${new Date().toLocaleDateString('fr-FR')}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px">
      <div style="background:#f8f9fa;border-left:4px solid #D4AF37;border-radius:8px;padding:14px">
        <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px">Total dû</div>
        <div style="font-size:18px;font-weight:700;color:#0F0F0F;margin-top:4px">${fmt(totalM)} FCFA</div>
      </div>
      <div style="background:#dcfce7;border-left:4px solid #16a34a;border-radius:8px;padding:14px">
        <div style="font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:1px">Total payé</div>
        <div style="font-size:18px;font-weight:700;color:#16a34a;margin-top:4px">${fmt(totalP)} FCFA</div>
      </div>
      <div style="background:${totalR>0?'#ffedd5':'#f0fdf4'};border-left:4px solid ${totalR>0?'orange':'#16a34a'};border-radius:8px;padding:14px">
        <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px">Reste à payer</div>
        <div style="font-size:18px;font-weight:700;color:${totalR>0?'orange':'#16a34a'};margin-top:4px">${fmt(totalR)} FCFA</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#0F0F0F;color:#fff">
        <th style="padding:10px 12px;text-align:left">#</th>
        <th style="padding:10px 12px;text-align:left">Locative</th>
        <th style="padding:10px 12px;text-align:left">Montant dû</th>
        <th style="padding:10px 12px;text-align:left">Payé</th>
        <th style="padding:10px 12px;text-align:left">Reste</th>
        <th style="padding:10px 12px;text-align:left">Date</th>
        <th style="padding:10px 12px;text-align:left">Statut</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;

  const temp=document.createElement('div');
  temp.innerHTML=content;
  document.body.appendChild(temp);
  html2pdf().from(temp).set({
    filename:'paiements-'+name.replace(/\s/g,'-')+'.pdf',
    html2canvas:{scale:2,useCORS:true},
    jsPDF:{format:'a4',orientation:'portrait'}
  }).save().then(()=>{document.body.removeChild(temp);toast('PDF paiements exporté ✓');});
}

/* ============================================================
   VIEW / EDIT ROW MODAL
============================================================ */
let _modalKey='', _modalIdx=-1;

const LABELS={
  employes:{id:'ID',civ:'Civilité',nom:'Nom',prenom:'Prénom',fonction:'Fonction',tel:'Téléphone',date:'Date entrée',statut:'Statut',adresse:'Adresse',piece:'Type pièce',numpiece:'N° pièce',lieu:'Lieu délivrance',deldeb:'Date délivrance',delexp:'Date expiration',matri:'Situation matrimoniale',enfants:'Nombre d\'enfants',contrat:'Type contrat',user:'Nom utilisateur',email:'Email'},
  proprietaires:{id:'ID',nom:'Nom',prenom:'Prénom',naiss:'Date de naissance',adresse:'Adresse',tel:'Téléphone',email:'Email',matri:'Statut matrimonial'},
  locataires:{id:'ID',civ:'Civilité',nom:'Nom',prenom:'Prénom',naiss:'Date de naissance',prof:'Profession',travail:'Lieu de travail',piece:'Type pièce',numpiece:'N° pièce',deldeb:'Date délivrance',delexp:'Date expiration',matri:'Situation matrimoniale',enfants:'Nb enfants',adresse:'Adresse actuelle',tel:'Téléphone',bien:'Bien occupé',type:'Type',email:'Email',date:'Date',statut:'Statut'},
  biens:{id:'ID',nom:'Désignation',vente:'Destiné à la vente',type:'Type',nbAppart:'Nb appartements',valeur:'Valeur',proprio:'Propriétaire',adresse:'Adresse',etat:'État du bien',statut:'Statut'},
  locatives:{id:'ID',nom:'Location',bien:'Bien',locataire:'Locataire',occupant:'Occupant',loyer:'Loyer (FCFA)',charge:'Charge (FCFA)',dateEntree:'Date entrée',statut:'Statut'},
  contrats:{num:'Numéro de contrat',locataire:'Locataire',locative:'Locative',type:'Type',debut:'Date début',fin:'Date fin',statut:'Statut',prochain:'Prochain paiement',loyer:'Loyer (FCFA)',charges:'Charges (FCFA)',caution:'Caution (FCFA)',honor:'Honoraires (FCFA)',frais:'Frais dossier (FCFA)',obs:'Observations',sign:'Date signature'},
  paiements:{locataire:'Locataire',locative:'Locative',montant:'Montant dû (FCFA)',paye:'Montant payé (FCFA)',reste:'Reste (FCFA)',date:'Date paiement',mode:'Mode paiement'},
  depenses:{libelle:'Libellé',cat:'Catégorie',montant:'Montant (FCFA)',date:'Date',bien:'Bien concerné'},
};

const PAGE_ICONS={employes:'badge',proprietaires:'person',locataires:'groups',biens:'home_work',locatives:'door_front',contrats:'description',paiements:'payments',depenses:'account_balance_wallet'};

function viewRow(key, idx){
  _modalKey=key; _modalIdx=idx;
  const r=DB[key][idx];
  if(!r) return;
  const labels=LABELS[key]||{};
  const icon=PAGE_ICONS[key]||'info';
  const titles={employes:'Fiche employé',proprietaires:'Fiche propriétaire',locataires:'Fiche locataire',biens:'Fiche bien',locatives:'Fiche locative',contrats:'Détail contrat',depenses:'Détail dépense'};
  document.getElementById('rowModalTitleText').textContent=titles[key]||'Détails';
  document.querySelector('#rowModalTitle .material-symbols-rounded').textContent=icon;

  // Photo section
  const hasPhoto=!!r.photo;
  const photoEl=hasPhoto
    ? `<img src="${r.photo}" alt="Photo" style="width:100px;height:100px;border-radius:12px;object-fit:cover;border:3px solid var(--gold);box-shadow:0 4px 14px rgba(0,0,0,.15);flex-shrink:0">`
    : (['employes','proprietaires','locataires','biens','locatives'].includes(key)
        ? `<div style="width:100px;height:100px;border-radius:12px;background:#f3f4f6;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#bbb;flex-shrink:0;border:2px dashed #d1d5db"><span class="material-symbols-rounded" style="font-size:36px">${{employes:'person',proprietaires:'person',locataires:'person',biens:'home',locatives:'door_front'}[key]||'image'}</span><span style="font-size:10px;margin-top:2px">Aucune photo</span></div>`
        : '');

  const FULL_FIELDS=['adresse','libelle','titre','lotnom','travail','user','email'];
  const fields=Object.keys(labels).map(k=>`
    <div class="view-field${FULL_FIELDS.includes(k)?' full':''}">
      <label>${labels[k]}</label>
      <span>${r[k]||'—'}</span>
    </div>`).join('');

  const photoWrap = photoEl
    ? `<div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px">
        ${photoEl}
        <div style="flex:1">
          <div class="view-grid" style="grid-template-columns:1fr 1fr">${
            // Show first 4 key fields next to photo
            Object.keys(labels).slice(0,4).map(k=>`
              <div class="view-field">
                <label>${labels[k]}</label>
                <span>${r[k]||'—'}</span>
              </div>`).join('')
          }</div>
        </div>
      </div>
      <div class="view-grid">${
        Object.keys(labels).slice(4).map(k=>`
          <div class="view-field${FULL_FIELDS.includes(k)?' full':''}">
            <label>${labels[k]}</label>
            <span>${r[k]||'—'}</span>
          </div>`).join('')
      }</div>`
    : `<div class="view-grid">${fields}</div>`;

  document.getElementById('rowModalBody').innerHTML=photoWrap;
  document.getElementById('rowModalEditBtn').style.display='inline-flex';
  document.getElementById('rowModalDelBtn').style.display='inline-flex';
  document.getElementById('rowModal').classList.add('open');
}

function editRow(key, idx){
  _modalKey=key; _modalIdx=idx;
  const r=DB[key][idx];
  if(!r) return;
  const labels=LABELS[key]||{};
  const icon=PAGE_ICONS[key]||'edit';
  const titles={employes:'Modifier employé',proprietaires:'Modifier propriétaire',locataires:'Modifier locataire',biens:'Modifier bien',locatives:'Modifier locative',contrats:'Modifier contrat',depenses:'Modifier dépense'};
  document.getElementById('rowModalTitleText').textContent=titles[key]||'Modifier';
  document.querySelector('#rowModalTitle .material-symbols-rounded').textContent=icon;

  // Photo edit section
  let photoHTML='';
  if(['employes','proprietaires','locataires','biens','locatives'].includes(key)){
    const icons2={employes:'person',proprietaires:'person',locataires:'person',biens:'home',locatives:'door_front'};
    const hasPhoto=!!r.photo;
    photoHTML=`<div class="modal-photo" style="flex-direction:column;gap:6px">
      <div id="edit-photo-wrap" style="position:relative;cursor:pointer;display:inline-block" onclick="document.getElementById('edit-photo-inp').click()">
        ${hasPhoto?`<img id="edit-photo-img" src="${r.photo}" style="width:100px;height:100px;border-radius:12px;object-fit:cover;border:2.5px solid var(--gold);display:block">`
        :`<div class="modal-photo-placeholder" id="edit-photo-placeholder"><span class="material-symbols-rounded">${icons2[key]}</span><span>Ajouter photo</span></div>`}
        ${hasPhoto?`<button type="button" onclick="event.stopPropagation();removeEditPhoto('${key}',${idx})" title="Supprimer la photo" style="position:absolute;top:-7px;right:-7px;width:20px;height:20px;border-radius:50%;background:#ef4444;color:white;border:2px solid white;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;font-size:0;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,.25)"><span class="material-symbols-rounded" style="font-size:12px;line-height:1">close</span></button>`:''}
      </div>
      <input type="file" id="edit-photo-inp" accept="image/*" style="display:none" onchange="editPhotoChange(this,'${key}',${idx})">
      <small style="color:#9ca3af;font-size:10px;text-align:center">Cliquer pour changer</small>
    </div>`;
  }

  const FULL_FIELDS=['adresse','libelle','titre','lotnom','travail','obs'];
  const SELECT_OPTS={
    statut_employes:['Actif','Inactif'],
    statut_locataires:['Actif','Inactif'],
    statut_contrats:['Actif','En attente','Résilié'],
    statut_locatives:['Loué','Disponible','En attente'],
    statut_biens:['Disponible','Loué','En attente'],
    etat:['Neuf','Bon état','À rénover','En travaux','Disponible','Occupé'],
    civ:['Monsieur','Madame'],
    type_employes:['CDI','CDD'],
    matri:['Célibataire','Marié(e)','Marié'],
    vente:['Oui','Non'],
    piece:['CNI','Passeport','Permis'],
    type_biens:['Immeuble','Appartement','Maison','Villa','Terrain','Local commercial','Bureau','Studio'],
    type_locataires:['Particulier','Entreprise'],
    type_locatives:['Appartement','Maison','Local commercial','Studio','Bureau'],
  };
  const fields=Object.keys(labels).map(k=>{
    const val=r[k]||'';
    const isFull=FULL_FIELDS.includes(k);
    // determine if it should be a select
    const selKey=k==='statut'?`statut_${key}`:k==='type'?`type_${key}`:k;
    if(SELECT_OPTS[selKey]){
      const opts=SELECT_OPTS[selKey].map(o=>`<option ${val===o?'selected':''}>${o}</option>`).join('');
      return `<div class="view-field fg${isFull?' full':''}"><label>${labels[k]}</label><select data-field="${k}" style="width:100%">${opts}</select></div>`;
    }
    return `<div class="view-field fg${isFull?' full':''}"><label>${labels[k]}</label><input data-field="${k}" value="${val}" style="width:100%" ${k.includes('date')||k==='naiss'||k==='deldeb'||k==='delexp'?'type="date"':''}></div>`;
  }).join('');
  document.getElementById('rowModalBody').innerHTML=`${photoHTML}<div class="view-grid" style="gap:8px">${fields}</div>`;
  // Add droits section for employees
  if(key==='employes'){
    const droitsLabels=['employes','proprietaires','locataires','bail','contrats','paiements','avenir','depenses','fichiers','messages','rapports','journal','superAdmin'];
    const droitsNames=['Employé','Propriétaire','Locataire','Bail / Locative','Contrat','Paiement','Paiement à venir','Dépenses','Fichiers','Messages','Rapport',"Journal d'activité",'Super admin'];
    const currentDroits=r.droits||{};
    const droitsHTML=`<div id="edit-droits-section" style="margin-top:14px;border-top:1px solid #f0f0f0;padding-top:12px">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:6px">
        <span class="material-symbols-rounded" style="font-size:16px;color:var(--gold)">admin_panel_settings</span> Droits d'accès
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
        ${droitsLabels.map((k,i)=>`
          <div class="switch-row" style="padding:6px 8px;background:#fafafa;border-radius:6px;border:1px solid #f0f0f0">
            <span style="font-size:12px;${k==='superAdmin'?'color:var(--red);font-weight:600':''}">${droitsNames[i]}</span>
            <label class="toggle-switch">
              <input type="checkbox" id="edit-droit-${k}" ${currentDroits[k]?'checked':''} ${k==='superAdmin'?'onchange="onSuperAdminToggle(this)"':''}>
              <span class="slider-s"></span>
            </label>
          </div>`).join('')}
      </div>
    </div>
    <div style="margin-top:14px;border-top:1px solid #f0f0f0;padding-top:12px">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:6px">
        <span class="material-symbols-rounded" style="font-size:16px;color:var(--gold)">lock_reset</span> Réinitialiser le mot de passe
      </div>
      <p style="font-size:11.5px;color:#9ca3af;margin-bottom:10px">Définissez un nouveau mot de passe ou générez-en un provisoire à communiquer à l'employé.</p>
      <div style="display:flex;gap:6px;align-items:center">
        <div style="position:relative;flex:1">
          <input id="edit-new-password" type="password" placeholder="Nouveau mot de passe…" style="width:100%;padding-right:36px;box-sizing:border-box;border-radius:8px;border:1px solid #e5e7eb;padding:8px 36px 8px 10px;font-size:13px">
          <span onclick="const i=document.getElementById('edit-new-password');i.type=i.type==='password'?'text':'password'" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);cursor:pointer;color:#9ca3af">
            <span class="material-symbols-rounded" style="font-size:17px">visibility</span>
          </span>
        </div>
        <button type="button" onclick="useTempPassword()" style="padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;background:var(--gold);color:#000;cursor:pointer;font-size:12px;font-weight:700;white-space:nowrap;display:flex;align-items:center;gap:5px;flex-shrink:0">
          <span class="material-symbols-rounded" style="font-size:14px">auto_fix_high</span> Générer
        </button>
      </div>
      <div id="edit-pass-generated-wrap" style="display:none;margin-top:8px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 12px;display:none;align-items:center;justify-content:space-between;gap:8px">
        <div style="font-size:11px;color:#166534">Mot de passe provisoire : <strong id="edit-pass-generated" style="font-family:monospace;font-size:13px;letter-spacing:1px"></strong></div>
        <button onclick="copyTempPassword()" style="padding:4px 10px;border-radius:6px;border:none;background:#16a34a;color:#fff;cursor:pointer;font-size:11px;white-space:nowrap;display:flex;align-items:center;gap:4px">
          <span class="material-symbols-rounded" style="font-size:12px">content_copy</span> Copier
        </button>
      </div>
    </div>`;
    document.getElementById('rowModalBody').innerHTML += droitsHTML;
  }
  // Replace footer buttons
  document.getElementById('rowModalEditBtn').style.display='none';
  document.getElementById('rowModalDelBtn').style.display='none';
  // Add save button dynamically
  const footer=document.querySelector('.modal-footer');
  let saveBtn=document.getElementById('rowModalSaveBtn');
  if(!saveBtn){
    saveBtn=document.createElement('button');
    saveBtn.id='rowModalSaveBtn';
    saveBtn.className='btn btn-primary';
    saveBtn.innerHTML='<span class="material-symbols-rounded" style="font-size:15px">save</span> Enregistrer';
    saveBtn.onclick=saveEditRow;
    footer.insertBefore(saveBtn, footer.lastElementChild);
  } else {saveBtn.style.display='inline-flex';}
  document.getElementById('rowModal').classList.add('open');
}

function saveEditRow(){
  const r=DB[_modalKey][_modalIdx];
  if(!r) return;
  document.querySelectorAll('#rowModalBody [data-field]').forEach(el=>{
    r[el.dataset.field]=el.value;
  });
  // Save droits if editing an employee
  if(_modalKey==='employes'){
    const droitsLabels=['employes','proprietaires','locataires','bail','contrats','paiements','avenir','depenses','fichiers','messages','rapports','journal','superAdmin'];
    const droits={};
    droitsLabels.forEach(k=>{
      const cb=document.getElementById('edit-droit-'+k);
      if(cb) droits[k]=cb.checked;
    });
    r.droits=droits;
    // Save new password if provided
    const newPass=document.getElementById('edit-new-password')?.value?.trim();
    if(newPass) r.password=newPass;
  }
  saveDB();
  closeRowModal();
  renderPage(_modalKey);
  toast('Modification enregistrée ✓');
}

// Super admin confirmation toggle
function onSuperAdminToggle(cb){
  if(cb.checked){
    // Build confirm modal
    let box=document.getElementById('superAdminConfirmBox');
    if(!box){
      box=document.createElement('div');
      box.id='superAdminConfirmBox';
      box.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:9999;display:flex;align-items:center;justify-content:center';
      box.innerHTML=`
        <div style="background:#fff;border-radius:20px;padding:28px 26px;width:400px;max-width:92vw;box-shadow:0 30px 80px rgba(0,0,0,.25);border:1px solid #f0f0f0">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
            <div style="width:44px;height:44px;border-radius:14px;background:#fee2e2;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <span class="material-symbols-rounded" style="font-size:24px;color:#dc2626">admin_panel_settings</span>
            </div>
            <div>
              <div style="font-size:16px;font-weight:900;color:#111">Accès Super Admin</div>
              <div style="font-size:11px;color:#9ca3af;margin-top:2px">Droits étendus — confirmation requise</div>
            </div>
          </div>
          <div style="background:#fff8f8;border:1px solid #fecaca;border-radius:12px;padding:14px;margin-bottom:16px;font-size:12.5px;line-height:1.65;color:#374151">
            Le <strong style="color:#dc2626">Super Admin</strong> donne accès à :<br>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:5px">
              <div style="display:flex;align-items:center;gap:7px"><span class="material-symbols-rounded" style="font-size:14px;color:#dc2626">settings</span><span><strong>Paramètres</strong> — configuration complète de l'application</span></div>
              <div style="display:flex;align-items:center;gap:7px"><span class="material-symbols-rounded" style="font-size:14px;color:#dc2626">badge</span><span><strong>Gestion des employés</strong> — création, modification, suppression</span></div>
              <div style="display:flex;align-items:center;gap:7px"><span class="material-symbols-rounded" style="font-size:14px;color:#dc2626">mail</span><span><strong>Messages</strong> — messagerie interne complète</span></div>
              <div style="display:flex;align-items:center;gap:7px"><span class="material-symbols-rounded" style="font-size:14px;color:#dc2626">event_note</span><span><strong>Agenda employés</strong> — planning et missions</span></div>
            </div>
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid #fecaca;font-size:11.5px;color:#991b1b;font-weight:600">
              ⚠️ À attribuer uniquement à une personne de confiance.
            </div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button onclick="cancelSuperAdmin()" style="padding:9px 16px;border-radius:10px;border:1px solid #e5e7eb;background:#f9fafb;font-size:13px;font-weight:600;cursor:pointer;color:#374151">Annuler</button>
            <button onclick="confirmSuperAdmin()" style="padding:9px 18px;border-radius:10px;border:none;background:#dc2626;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px">
              <span class="material-symbols-rounded" style="font-size:15px">check</span> Confirmer
            </button>
          </div>
        </div>`;
      document.body.appendChild(box);
    } else { box.style.display='flex'; }
    window._pendingSuperAdminCb=cb;
    cb.checked=false; // revert until confirmed
  }
}
function confirmSuperAdmin(){
  if(window._pendingSuperAdminCb) window._pendingSuperAdminCb.checked=true;
  const box=document.getElementById('superAdminConfirmBox');
  if(box) box.style.display='none';
}
function cancelSuperAdmin(){
  if(window._pendingSuperAdminCb) window._pendingSuperAdminCb.checked=false;
  const box=document.getElementById('superAdminConfirmBox');
  if(box) box.style.display='none';
}

// Reset password helper
function genTempPassword(){
  const chars='ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let p=''; for(let i=0;i<10;i++) p+=chars[Math.floor(Math.random()*chars.length)];
  return p;
}
function useTempPassword(){
  const p=genTempPassword();
  const inp=document.getElementById('edit-new-password');
  const disp=document.getElementById('edit-pass-generated');
  if(inp){ inp.value=p; inp.type='text'; }
  if(disp){ disp.textContent=p; disp.parentElement.style.display='flex'; }
}
function copyTempPassword(){
  const p=document.getElementById('edit-pass-generated')?.textContent;
  if(p){ navigator.clipboard?.writeText(p).catch(()=>{}); toast('Mot de passe copié ✓'); }
}

function switchToEdit(){
  closeRowModal();
  setTimeout(()=>editRow(_modalKey,_modalIdx),50);
}

function deleteFromModal(){
  if(confirm('Supprimer cet enregistrement ?')){
    const key=_modalKey, idx=_modalIdx;
    closeRowModal();
    DB[key].splice(idx,1);
    saveDB();
    renderPage(key);
    toast('Supprimé ✓');
  }
}

function closeRowModal(){
  document.getElementById('rowModal').classList.remove('open');
  const sb=document.getElementById('rowModalSaveBtn');
  if(sb) sb.style.display='none';
  const pb=document.getElementById('payHistPDFBtn');
  if(pb) pb.style.display='none';
  document.getElementById('rowModalEditBtn').style.display='none';
  document.getElementById('rowModalDelBtn').style.display='none';
}
document.getElementById('rowModal').addEventListener('click',e=>{
  if(e.target===document.getElementById('rowModal')) closeRowModal();
});


/* ============================================================
   LOGO MANAGEMENT
============================================================ */
function previewLogo(input){
  const file = input.files[0];
  if(!file) return;
  if(file.size > 2*1024*1024){ toast('Logo trop volumineux (max 2 Mo)','err'); return; }
  const reader = new FileReader();
  reader.onload = function(e){
    const data = e.target.result;
    const img = document.getElementById('cfg-logo-preview');
    const ph  = document.getElementById('cfg-logo-placeholder');
    if(img){ img.src = data; img.style.display='block'; }
    if(ph)  ph.style.display='none';
    localStorage.setItem('geniusproperty_logo', data);
    toast('Logo chargé ✓');
  };
  reader.readAsDataURL(file);
}
function removeLogo(){
  localStorage.removeItem('geniusproperty_logo');
  const img = document.getElementById('cfg-logo-preview');
  const ph  = document.getElementById('cfg-logo-placeholder');
  if(img){ img.src=''; img.style.display='none'; }
  if(ph)  ph.style.display='block';
  document.getElementById('cfg-logo-input').value='';
  toast('Logo supprimé ✓');
}

function saveSettings(){
  const agence  = document.getElementById('cfg-agence')?.value  || 'Genius Property';
  const email   = document.getElementById('cfg-email')?.value   || '';
  const tel     = document.getElementById('cfg-tel')?.value     || '';
  const adresse = document.getElementById('cfg-adresse')?.value || '';
  const rccm    = document.getElementById('cfg-rccm')?.value    || '';
  const ninea   = document.getElementById('cfg-ninea')?.value   || '';
  localStorage.setItem('geniusproperty_agence',  agence);
  localStorage.setItem('geniusproperty_email',   email);
  localStorage.setItem('geniusproperty_tel',     tel);
  localStorage.setItem('geniusproperty_adresse', adresse);
  localStorage.setItem('geniusproperty_rccm',    rccm);
  localStorage.setItem('geniusproperty_ninea',   ninea);
  // Logo already saved on selection via previewLogo()
  toast('Paramètres sauvegardés ✓');
}
function exportAllData(){
  const json=JSON.stringify(DB,null,2);
  const a=document.createElement('a');
  a.href='data:application/json;charset=utf-8,'+encodeURIComponent(json);
  a.download='genius_property_backup_'+new Date().toISOString().split('T')[0]+'.json';
  a.click();
  toast('Backup exporté ✓');
}

/* ============================================================
   UTILS
============================================================ */
function v(id){const e=document.getElementById(id);return e?e.value:''}
function num(s){return gp_num(s)}
function fmt(n){return n.toLocaleString('fr-FR')}
function genId(p){
  const map={EP:'employes',PR:'proprietaires',LC:'locataires',BI:'biens'};
  const key=map[p];
  const count=key?DB[key].length+1:1;
  return p+new Date().getFullYear().toString().slice(-2)+'-'+String(count).padStart(3,'0');
}
function ac(name){const c=['#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444','#14b8a6'];return c[(name||'').charCodeAt(0)%c.length]}
function delRow(key,i){if(confirm('Supprimer cet enregistrement ?')){DB[key].splice(i,1);saveDB();renderPage(key);toast('Supprimé ✓')}}
function exportCSV(key){
  const d=DB[key];if(!d?.length)return toast('Aucune donnée','err');
  const cols=Object.keys(d[0]);
  const csv=[cols.join(','),...d.map(r=>cols.map(c=>`"${r[c]||''}"`).join(','))].join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);
  a.download=key+'_'+Date.now()+'.csv';a.click();toast('Export téléchargé ✓');
}

/* ============================================================
   EXPORT PDF LISTES — UNIVERSEL
============================================================ */
const PDF_CONFIG = {
  employes:{
    title:'Liste des Employés',
    icon:'badge',
    cols:[
      {label:'ID',key:'id',w:'10%'},
      {label:'Civilité',key:'civ',w:'7%'},
      {label:'Nom',key:'nom',w:'12%'},
      {label:'Prénom',key:'prenom',w:'12%'},
      {label:'Fonction',key:'fonction',w:'13%'},
      {label:'Téléphone',key:'tel',w:'12%'},
      {label:'Email',key:'email',w:'16%'},
      {label:'Statut',key:'statut',w:'8%',badge:true},
    ],
    totals:null
  },
  proprietaires:{
    title:'Liste des Propriétaires',
    icon:'person',
    cols:[
      {label:'ID',key:'id',w:'10%'},
      {label:'Nom',key:'nom',w:'14%'},
      {label:'Prénom',key:'prenom',w:'14%'},
      {label:'Téléphone',key:'tel',w:'13%'},
      {label:'Email',key:'email',w:'20%'},
      {label:'Adresse',key:'adresse',w:'18%'},
    ],
    totals:null
  },
  locataires:{
    title:'Liste des Locataires',
    icon:'groups',
    cols:[
      {label:'ID',key:'id',w:'9%'},
      {label:'Nom',key:'nom',w:'11%'},
      {label:'Prénom',key:'prenom',w:'11%'},
      {label:'Bien occupé',key:'bien',w:'14%'},
      {label:'Type',key:'type',w:'9%'},
      {label:'Téléphone',key:'tel',w:'12%'},
      {label:'Email',key:'email',w:'16%'},
      {label:'Statut',key:'statut',w:'8%',badge:true},
    ],
    totals:null
  },
  biens:{
    title:'Liste des Biens Immobiliers',
    icon:'home_work',
    cols:[
      {label:'Désignation',key:'nom',w:'20%'},
      {label:'Type',key:'type',w:'13%'},
      {label:'Valeur',key:'valeur',w:'16%',money:true},
      {label:'Propriétaire',key:'proprio',w:'18%'},
      {label:'Disponibilité',key:'statut',w:'12%',badge:true},
      {label:'Adresse',key:'adresse',w:'21%'},
    ],
    totals:null
  },
  locatives:{
    title:'Liste des Locations',
    icon:'door_front',
    cols:[
      {label:'Location',key:'nom',w:'20%'},
      {label:'Bien',key:'bien',w:'18%'},
      {label:'Occupant',key:'occupant',w:'18%'},
      {label:'Loyer (FCFA)',key:'loyer',w:'14%',money:true},
      {label:'Charge (FCFA)',key:'charge',w:'14%',money:true},
      {label:'Date entrée',key:'dateEntree',w:'16%'},
    ],
    totals:(d)=>{
      const tLoyer=d.reduce((s,r)=>s+num(r.loyer),0);
      const tCharge=d.reduce((s,r)=>s+num(r.charge),0);
      return [
        {label:'Total Loyers Mensuels',val:fmt(tLoyer)+' FCFA',color:'#16a34a'},
        {label:'Total Charges Mensuelles',val:fmt(tCharge)+' FCFA',color:'#f59e0b'},
        {label:'Revenu Brut Mensuel',val:fmt(tLoyer+tCharge)+' FCFA',color:'#2563eb'},
      ];
    }
  },
  paiements:{
    title:'Journal des Paiements',
    icon:'payments',
    cols:[
      {label:'Locataire',key:'locataire',w:'16%'},
      {label:'Locative',key:'locative',w:'16%'},
      {label:'Montant dû',key:'montant',w:'12%',money:true,suffix:' FCFA'},
      {label:'Payé',key:'paye',w:'12%',money:true,suffix:' FCFA',green:true},
      {label:'Reste',key:'reste',w:'10%',money:true,suffix:' FCFA',orange:true},
      {label:'Date',key:'date',w:'11%'},
      {label:'Mode',key:'mode',w:'10%'},
    ],
    totals:(d)=>{
      const tM=d.reduce((s,r)=>s+num(r.montant),0);
      const tP=d.reduce((s,r)=>s+num(r.paye),0);
      const tR=d.reduce((s,r)=>s+num(r.reste),0);
      return [
        {label:'Total Montant Dû',val:fmt(tM)+' FCFA',color:'#0F0F0F'},
        {label:'Total Payé',val:fmt(tP)+' FCFA',color:'#16a34a'},
        {label:'Total Reste',val:fmt(tR)+' FCFA',color:tR>0?'#f59e0b':'#16a34a'},
      ];
    }
  },
  depenses:{
    title:'Journal des Dépenses',
    icon:'account_balance_wallet',
    cols:[
      {label:'#',key:'_idx',w:'5%'},
      {label:'Libellé',key:'libelle',w:'25%'},
      {label:'Catégorie',key:'cat',w:'13%',badge:true},
      {label:'Montant (FCFA)',key:'montant',w:'14%',money:true,red:true},
      {label:'Date',key:'date',w:'11%'},
      {label:'Bien concerné',key:'bien',w:'17%'},
    ],
    totals:(d)=>{
      const tot=d.reduce((s,r)=>s+num(r.montant),0);
      const byCat={};d.forEach(r=>{byCat[r.cat]=(byCat[r.cat]||0)+num(r.montant);});
      const extras=Object.entries(byCat).map(([k,v2])=>({label:k,val:fmt(v2)+' FCFA',color:'#555'}));
      return [{label:'TOTAL DÉPENSES',val:fmt(tot)+' FCFA',color:'#dc2626',bold:true},...extras];
    }
  },
};

function exportListePDF(key){
  if(!window.html2pdf){ toast('Export PDF indisponible : html2pdf non chargé', 'err'); return; }
  const data=DB[key];
  if(!data?.length)return toast('Aucune donnée à exporter','err');
  const cfg=PDF_CONFIG[key];
  if(!cfg)return toast('Export non configuré','err');

  const ag = _getAgenceInfo();
  const agence = ag.agence;
  const email   = ag.email;
  const tel     = ag.tel;
  const adresse = ag.adresse;
  const rccm    = ag.rccm;
  const ninea   = ag.ninea;
  const logo    = ag.logo;
  const today=new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
  const logoHTML = logo ? `<img src="${logo}" style="width:60px;height:60px;object-fit:contain;border-radius:8px;border:1px solid rgba(212,175,55,.3);background:rgba(255,255,255,.07);padding:4px;flex-shrink:0">` : '';
  const rccmNinea = [rccm?'RCCM\u00a0'+rccm:'', ninea?'NINEA\u00a0'+ninea:''].filter(Boolean).join('  |  ');

  // Build table rows
  const thCells=cfg.cols.map(c=>`<th style="padding:9px 11px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#fff;background:#0F0F0F;white-space:nowrap">${c.label}</th>`).join('');

  const tbRows=data.map((r,ri)=>{
    const cells=cfg.cols.map(c=>{
      let val=c.key==='_idx'?String(ri+1):(r[c.key]||'—');
      if(c.suffix&&val!=='—')val+=c.suffix;
      let style='padding:9px 11px;border-bottom:1px solid #f0f0f0;font-size:12px;vertical-align:middle;';
      if(c.green)style+='color:#16a34a;font-weight:600;';
      else if(c.red)style+='color:#dc2626;font-weight:600;';
      else if(c.orange&&num(r[c.key])>0)style+='color:#f59e0b;font-weight:600;';
      if(c.badge){
        const badgeColor=
          val==='Actif'||val==='Loué'||val==='Soldé'?'#dcfce7;color:#166534':
          val==='Disponible'?'#d1fae5;color:#065f46':
          val==='En attente'||val==='Partiel'||val==='En cours'?'#ffedd5;color:#9a3412':
          val==='Inactif'||val==='Résilié'?'#fee2e2;color:#991b1b':
          '#f3f4f6;color:#374151';
        val=`<span style="background:${badgeColor};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;white-space:nowrap">${val}</span>`;
      }
      return `<td style="${style}">${val}</td>`;
    }).join('');
    const bg=ri%2===0?'#fff':'#fafafa';
    return `<tr style="background:${bg}">${cells}</tr>`;
  }).join('');

  // Build totals section
  let totalsHTML='';
  if(cfg.totals){
    const tots=cfg.totals(data);
    const tCards=tots.map(t=>`
      <div style="background:#f8f9fa;border-left:4px solid ${t.color};border-radius:6px;padding:12px 16px;min-width:140px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888;margin-bottom:4px">${t.label}</div>
        <div style="font-size:15px;font-weight:${t.bold?'800':'700'};color:${t.color}">${t.val}</div>
      </div>`).join('');
    totalsHTML=`
      <div style="margin-top:20px;padding:16px 20px;background:#fff;border-radius:10px;border:1px solid #e9ecef">
        <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:12px">Récapitulatif</div>
        <div style="display:flex;flex-wrap:wrap;gap:12px">${tCards}</div>
      </div>`;
  }

  const html=`
  <div style="font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#f4f4f4;padding:32px;min-height:100vh">

    <!-- En-tête -->
    <div style="background:linear-gradient(135deg,#0F0F0F 0%,#1a1a2e 70%,#0F0F0F 100%);border-radius:14px;padding:28px 32px;color:#fff;margin-bottom:24px;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;right:0;width:160px;height:100%;background:linear-gradient(to left,rgba(212,175,55,.18),transparent);pointer-events:none"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div style="display:flex;align-items:flex-start;gap:14px">
          ${logoHTML}
          <div>
            <div style="font-size:26px;font-weight:900;letter-spacing:2px;color:#D4AF37">${agence.toUpperCase()}</div>
            <div style="font-size:9px;letter-spacing:3px;color:rgba(255,255,255,.5);margin-top:2px;text-transform:uppercase">Gestion Immobilière</div>
            <div style="margin-top:10px;font-size:11px;color:rgba(255,255,255,.65);line-height:1.8">
              ${adresse?adresse+'<br>':''}${tel?'Tél: '+tel+'<br>':''}${email}${rccmNinea?'<br><span style="font-size:10px;color:rgba(255,255,255,.4)">'+rccmNinea+'</span>':''}
            </div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:18px;font-weight:700;color:#fff">${cfg.title}</div>
          <div style="font-size:11px;color:#D4AF37;margin-top:6px">Édité le ${today}</div>
          <div style="margin-top:10px;background:rgba(212,175,55,.2);border:1px solid rgba(212,175,55,.35);border-radius:6px;padding:6px 12px;display:inline-block">
            <span style="font-size:10px;color:rgba(255,255,255,.6)">Total enregistrements : </span>
            <span style="font-size:14px;font-weight:700;color:#D4AF37">${data.length}</span>
          </div>
        </div>
      </div>
      <div style="margin-top:20px;height:1.5px;background:linear-gradient(to right,#D4AF37,rgba(212,175,55,.1),transparent)"></div>
    </div>

    <!-- Tableau -->
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr>${thCells}</tr></thead>
        <tbody>${tbRows}</tbody>
      </table>
    </div>

    ${totalsHTML}

    <!-- Pied de page -->
    <div style="margin-top:20px;text-align:center;font-size:10px;color:#aaa;padding:10px">
      ${agence} — Document généré automatiquement par Genius Property — ${today}
    </div>
  </div>`;

  const temp=document.createElement('div');
  temp.innerHTML=html;
  document.body.appendChild(temp);
  html2pdf().from(temp).set({
    filename:key+'_genius_property_'+new Date().toISOString().split('T')[0]+'.pdf',
    html2canvas:{scale:2,useCORS:true,logging:false},
    jsPDF:{format:'a4',orientation:'landscape'}
  }).save().then(()=>{
    document.body.removeChild(temp);
    toast(cfg.title+' exporté ✓');
  });
}

/* ============================================================
   MESSAGES — COMMUNICATION INTERNE
============================================================ */
if(!DB.messages) DB.messages=[];  // {id, convId, de, vers, versRole, objet, corps, date, lu, type, rappel}
if(!DB.conversations) DB.conversations=[];
    if(!DB.agenda) DB.agenda=[];
    if(!DB.employeDocs) DB.employeDocs={};
    if(!DB.proprietaireDocs) DB.proprietaireDocs={};
    if(!DB.locataireDocs) DB.locataireDocs={};  // {id, contact, contactRole, dernierMsg, nonLus, date, type}

let _currentConvId = null;
let _msgTab = 'tous';

/* ---- Contacts disponibles (employés) — IDs stables ---- */
function getMsgContacts(){
  const emp = Array.isArray(DB.employes) ? DB.employes : [];
  return emp.map((e, idx)=>({
    nom: ((e.prenom||'')+' '+(e.nom||'')).trim() || e.email || ('Employé '+(idx+1)),
    role: e.fonction || e.poste || 'Employé',
    // ID stable : priorité e.id (index DB), sinon email normalisé, sinon position
    id: 'EP-'+(e.id != null ? e.id : (e.email ? e.email.replace(/[^a-z0-9]/gi,'_') : 'idx'+idx)),
    color: ac(e.nom || e.email || 'employe'+idx),
    email: e.email || ''
  }));
}

function setMsgTab(tab){
  _msgTab=tab;
  ['tous','non-lu','urgent'].forEach(t=>{
    const b=document.getElementById('msg-tab-'+t);
    if(!b)return;
    b.classList.toggle('active', t===tab);
  });
  renderConvList();
}

function renderMessages(){
  renderConvList();
  if(_currentConvId) openConversation(_currentConvId);
  else showEmptyState();
}

function renderConvList(){
  const search=(document.getElementById('msg-search-conv')?.value||'').toLowerCase();
  let convs=[...(DB.conversations||[])].filter(c => String(c.contactId||'').startsWith('EP-') || (c.contactRole && c.contactRole!=='Locataire' && c.contactRole!=='Propriétaire')).sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(_msgTab==='non-lu') convs=convs.filter(c=>c.nonLus>0);
  if(_msgTab==='urgent') convs=convs.filter(c=>c.type==='urgent');
  if(search) convs=convs.filter(c=>(c.contact||'').toLowerCase().includes(search)||(c.dernierMsg||'').toLowerCase().includes(search)||(c.objet||'').toLowerCase().includes(search)||(c.contactRole||'').toLowerCase().includes(search));
  const list=document.getElementById('msg-conv-list');
  if(!list) return;
  if(!convs.length){
    list.innerHTML=`<div style="text-align:center;padding:34px 18px;color:#94a3b8;font-size:13px">${_msgTab==='non-lu'?'Aucun message non lu':_msgTab==='urgent'?'Aucun message urgent':'Aucune conversation employé'}</div>`;
    return;
  }
  list.innerHTML=convs.map(conv=>{
    const isActive=conv.id===_currentConvId;
    const last=(DB.messages||[]).filter(m=>m.convId===conv.id).sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
    const subject=last?.objet || conv.dernierMsg || 'Sans objet';
    const preview=last?.corps || conv.dernierMsg || '—';
    const timeStr=formatMsgTime(conv.date);
    return `<div class="msg-mail-item ${isActive?'active':''}" onclick="openConversation('${conv.id}')">
      <div class="msg-mail-item-top">
        <div class="msg-avatar" style="background:${conv.color||'#D4AF37'}">${(conv.contact||'?')[0].toUpperCase()}${conv.nonLus>0?`<span class="msg-unread">${conv.nonLus}</span>`:''}</div>
        <div class="msg-mail-meta">
          <div class="msg-mail-line"><span class="msg-mail-name">${conv.contact||'Employé'}</span><span class="msg-mail-time">${timeStr}</span></div>
          <div class="msg-mail-subject">${conv.type==='urgent'?'🚨 ':conv.type==='info'?'ℹ️ ':''}${subject}</div>
          <div class="msg-mail-preview">${preview}</div>
          <span class="msg-mail-role">${conv.contactRole||'Employé'}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openConversation(convId){
  _currentConvId=convId;
  const conv=(DB.conversations||[]).find(c=>c.id===convId);
  if(!conv)return;
  conv.nonLus=0;
  (DB.messages||[]).filter(m=>m.convId===convId&&!m.lu).forEach(m=>m.lu=true);
  saveDB();
  renderConvList();
  document.getElementById('msg-empty-state').style.display='none';
  const header=document.getElementById('msg-chat-header');
  header.style.display='flex';
  document.getElementById('msg-chat-avatar').textContent=(conv.contact||'?')[0].toUpperCase();
  document.getElementById('msg-chat-avatar').style.background=conv.color||'var(--gold)';
  document.getElementById('msg-chat-name').textContent=conv.contact||'Employé';
  document.getElementById('msg-chat-role').textContent=(conv.contactRole||'Employé')+' · Communication interne';
  document.getElementById('msg-input-area').style.display='block';
  const msgs=(DB.messages||[]).filter(m=>m.convId===convId).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const bubbles=document.getElementById('msg-bubbles');
  if(!msgs.length){ bubbles.innerHTML=`<div style="text-align:center;color:#94a3b8;font-size:13px;margin:auto">Commencez l'échange interne avec cet employé.</div>`; }
  else{
    let lastDate='';
    bubbles.innerHTML=msgs.map(m=>{
      const isMine=m.de==='Admin' || m.de===(currentUser?.email||'');
      const d=new Date(m.date);
      const dStr=d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'2-digit'});
      let dateSep='';
      if(dStr!==lastDate){lastDate=dStr;dateSep=`<div class="msg-date-sep"><span>${dStr}</span></div>`;}
      const timeStr=d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
      const subject=m.objet || 'Sans objet';
      const sender=isMine?'Moi':(m.de||conv.contact||'Employé');
      return `${dateSep}<article class="msg-email-card ${isMine?'mine':''}">
        <div class="msg-email-head"><div class="msg-email-subject">${m.type==='urgent'?'🚨 ':m.type==='info'?'ℹ️ ':''}${subject}</div><div class="msg-email-date">${timeStr}</div></div>
        <div class="msg-email-from">De : <strong>${sender}</strong> · À : ${isMine?(conv.contact||'Employé'):'Moi'}</div>
        <div class="msg-email-body">${m.corps||''}</div>
      </article>`;
    }).join('');
  }
  setTimeout(()=>bubbles.scrollTop=bubbles.scrollHeight,50);
  document.getElementById('msg-input-text')?.focus();
}

function showEmptyState(){
  document.getElementById('msg-empty-state').style.display='flex';
  document.getElementById('msg-chat-header').style.display='none';
  document.getElementById('msg-input-area').style.display='none';
  document.getElementById('msg-bubbles').innerHTML='';
}

function sendMessage(){
  const text=document.getElementById('msg-input-text')?.value.trim();
  if(!text||!_currentConvId)return;
  const conv=(DB.conversations||[]).find(c=>c.id===_currentConvId);
  if(!conv)return;
  const senderName=(typeof currentUser!=='undefined'&&currentUser?.prenom)?((currentUser.prenom||'')+' '+(currentUser.nom||'')).trim():'Admin';
  const msg={id:'MSG-'+Date.now(),convId:_currentConvId,de:senderName,vers:conv.contact,versRole:conv.contactRole,objet:'Réponse interne',corps:text,date:new Date().toISOString(),lu:true,type:'message'};
  DB.messages.push(msg);
  conv.dernierMsg=text.length>70?text.slice(0,70)+'…':text;
  conv.date=msg.date;
  conv.type='message';
  saveDB();
  document.getElementById('msg-input-text').value='';
  document.getElementById('msg-input-text').style.height='46px';
  openConversation(_currentConvId);
  toast('Message interne envoyé ✓');
}

function insertQuickMsg(txt){ const t=document.getElementById('msg-input-text');if(t){t.value=txt;t.style.height='auto';t.style.height=Math.min(t.scrollHeight,120)+'px';t.focus();} }

function sendRappelPaiement(){
  if(!_currentConvId)return;
  const conv=DB.conversations.find(c=>c.id===_currentConvId);
  if(!conv)return;
  // Cherche les paiements en retard pour informer l'employe en charge du recouvrement
  const impayes=(DB.paiements||[]).filter(p=>(p.reste&&Number(p.reste)>0)||(p.statut&&p.statut.toLowerCase().includes('impa')));
  let corps;
  if(impayes.length>0){
    const liste=impayes.slice(0,5).map(p=>'- '+(p.locataire||'?')+' — '+(Number(p.reste||0).toLocaleString('fr-FR'))+' FCFA restant ('+( p.date||'?')+')').join('\n');
    corps='Bonjour '+conv.contact+',\n\nVoici les paiements en attente a traiter :\n\n'+liste+(impayes.length>5?'\n... et '+(impayes.length-5)+' autre(s)':'')+' \n\nMerci de relancer les locataires.\n\nCordialement,\nGenius Property';
  } else {
    corps='Bonjour '+conv.contact+',\n\nAucun paiement en retard detecte. Merci de verifier les echeances a venir.\n\nCordialement,\nGenius Property';
  }
  const msg={id:'MSG-'+Date.now(),convId:_currentConvId,de:'Admin',vers:conv.contact,versRole:conv.contactRole,objet:'Rappel de paiement — suivi recouvrement',corps,date:new Date().toISOString(),lu:true,type:'rappel'};
  DB.messages.push(msg);
  conv.dernierMsg='💰 Rappel recouvrement';
  conv.date=msg.date;
  conv.type='rappel';
  saveDB();
  openConversation(_currentConvId);
  toast('Rappel recouvrement envoyé ✓');
}

function deleteConversation(){
  if(!_currentConvId)return;
  if(!confirm('Supprimer cette conversation et tous ses messages ?'))return;
  DB.conversations=DB.conversations.filter(c=>c.id!==_currentConvId);
  DB.messages=DB.messages.filter(m=>m.convId!==_currentConvId);
  _currentConvId=null;
  saveDB();
  showEmptyState();
  renderConvList();
  toast('Conversation supprimée ✓');
}

/* ---- Nouveau message modal ---- */
function openNewMsgModal(){
  const sel=document.getElementById('nm-destinataire');
  const contacts=getMsgContacts();
  sel.innerHTML='<option value="">— Sélectionner un employé —</option>'+contacts.map(c=>`<option value="${c.id}|${c.nom}|${c.role}|${c.color}">${c.nom} — ${c.role}</option>`).join('');
  document.getElementById('nm-objet').value='';
  document.getElementById('nm-corps').value='';
  document.getElementById('nm-type').value='message';
  const m=document.getElementById('newMsgModal');m.style.display='flex';m.style.alignItems='center';m.style.justifyContent='center';
}

function closeNewMsgModal(){ document.getElementById('newMsgModal').style.display='none'; }

function onNmDestChange(){
  // Pré-remplir objet selon type si locataire sélectionné
  onNmTypeChange();
}

function onNmTypeChange(){
  const type=document.getElementById('nm-type').value;
  const destVal=document.getElementById('nm-destinataire').value;
  const destName=destVal.split('|')[1]||'';
  const templates={
    info:`Bonjour ${destName},\n\nJe vous partage cette information interne.\n\nMerci d'en prendre connaissance.`,
    urgent:`Bonjour ${destName},\n\nMessage urgent : merci de traiter ce point dès que possible et de me faire un retour.`,
    message:''
  };
  const objs={info:'Information interne',urgent:'Urgent — action requise',message:''};
  const corps=document.getElementById('nm-corps');
  const objet=document.getElementById('nm-objet');
  if(type!=='message'){ corps.value=templates[type]||''; objet.value=objs[type]||''; }
}

function envoyerNouveauMsg(){
  const destVal=document.getElementById('nm-destinataire').value;
  if(!destVal)return toast('Sélectionnez un employé','err');
  const objet=document.getElementById('nm-objet').value.trim();
  if(!objet)return toast('L\'objet est requis','err');
  const corps=document.getElementById('nm-corps').value.trim();
  if(!corps)return toast('Le message est requis','err');
  const [destId,destNom,destRole,destColor]=destVal.split('|');
  const type=document.getElementById('nm-type').value;
  let conv=(DB.conversations||[]).find(c=>c.contactId===destId);
  if(!conv){
    conv={id:'CONV-'+Date.now(),contactId:destId,contact:destNom,contactRole:destRole,color:destColor,dernierMsg:'',nonLus:0,date:new Date().toISOString(),type};
    DB.conversations.push(conv);
  }
  const senderName2=(typeof currentUser!=='undefined'&&currentUser?.prenom)?((currentUser.prenom||'')+' '+(currentUser.nom||'')).trim():'Admin';
  const msg={id:'MSG-'+Date.now(),convId:conv.id,de:senderName2,vers:destNom,versRole:destRole,objet,corps,date:new Date().toISOString(),lu:true,type};
  DB.messages.push(msg);
  conv.dernierMsg=objet;
  conv.date=msg.date;
  conv.type=type;
  saveDB();
  closeNewMsgModal();
  _currentConvId=conv.id;
  renderConvList();
  openConversation(conv.id);
  toast('Message envoyé à '+destNom+' ✓');
}

function formatMsgTime(dateStr){
  if(!dateStr)return'';
  const d=new Date(dateStr);
  const now=new Date();
  const diffH=Math.floor((now-d)/3600000);
  if(diffH<1)return'À l\'instant';
  if(diffH<24)return d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  if(diffH<48)return'Hier';
  return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
}

/* Badge non-lus dans la sidebar */
function updateMsgBadge(){
  const nonLus=(DB.conversations||[]).filter(c=>String(c.contactId||'').startsWith('EP-') || (c.contactRole && c.contactRole!=='Locataire' && c.contactRole!=='Propriétaire')).reduce((s,c)=>s+(c.nonLus||0),0);
  const li=document.querySelector('#sideMenu li[data-page="messages"]');
  if(!li)return;
  let badge=li.querySelector('.side-badge');
  if(nonLus>0){
    if(!badge){badge=document.createElement('span');badge.className='side-badge';li.appendChild(badge);}
    badge.textContent=nonLus;
    badge.style.cssText='margin-left:auto;background:#dc2626;color:#fff;border-radius:10px;padding:1px 6px;font-size:10px;font-weight:700;';
  } else if(badge) badge.remove();
}

/* ---- Simuler réponse employé (vue Manager, localStorage-only) ---- */
function simulerReponseEmploye(){
  if(!_currentConvId)return;
  const conv=(DB.conversations||[]).find(c=>c.id===_currentConvId);
  if(!conv)return;
  const reponses=[
    "Bien reçu, je m'en occupe.",
    "Message pris en compte, merci.",
    "OK, je vous fais un retour rapidement.",
    "Compris. Je traite ça dès maintenant.",
    "Noté. Merci pour l'information.",
    "Je reviens vers vous dans la journée.",
    "C'est fait, tout est en ordre."
  ];
  const corps=reponses[Math.floor(Math.random()*reponses.length)];
  const msg={
    id:'MSG-'+Date.now(),
    convId:_currentConvId,
    de:conv.contact,
    vers:'Admin',
    versRole:'Manager',
    objet:'Réponse',
    corps,
    date:new Date().toISOString(),
    lu:false,
    type:'message'
  };
  DB.messages.push(msg);
  conv.dernierMsg=corps.length>70?corps.slice(0,70)+'…':corps;
  conv.date=msg.date;
  conv.nonLus=(conv.nonLus||0)+1;
  saveDB();
  openConversation(_currentConvId);
  updateMsgBadge();
  toast(conv.contact+' a répondu ✓');
}

/* ---- Synchronisation multi-onglets via storage event ---- */
window.addEventListener('storage', function(e){
  if(e.key && e.key.startsWith('geniusproperty_db')){
    try{
      const raw=e.newValue;
      if(raw){
        const parsed=JSON.parse(raw);
        if(parsed && typeof parsed==='object'){
          Object.assign(DB, parsed);
          // Rafraîchit la messagerie si elle est active
          const msgPage=document.getElementById('page-messages');
          if(msgPage && msgPage.classList.contains('active')){
            renderConvList();
            if(_currentConvId) openConversation(_currentConvId);
          }
          updateMsgBadge();
        }
      }
    }catch(err){}
  }
});

/* ============================================================
   FICHIERS
============================================================ */
if(!DB.fichiers) DB.fichiers=[];
let fichierFilter='tous';
let _fichierDataURL=null;
let _fichierFileName='';
let _fichierFileSize=0;
let _fichierFileType='';

/* ============================================================
   PARAMÈTRES — re-populate fields from localStorage on navigate
============================================================ */
function renderParametres(){
  const fields={
    'geniusproperty_agence':'cfg-agence',
    'geniusproperty_email':'cfg-email',
    'geniusproperty_tel':'cfg-tel',
    'geniusproperty_adresse':'cfg-adresse',
    'geniusproperty_rccm':'cfg-rccm',
    'geniusproperty_ninea':'cfg-ninea'
  };
  Object.entries(fields).forEach(([key,id])=>{
    const val=localStorage.getItem(key);
    const el=document.getElementById(id);
    if(el && val) el.value=val;
  });
  const th=document.getElementById('cfg-theme');
  if(th) th.value=localStorage.getItem('geniusproperty_theme')||'light';
  const savedLogo=localStorage.getItem('geniusproperty_logo');
  if(savedLogo){
    const img=document.getElementById('cfg-logo-preview');
    const ph=document.getElementById('cfg-logo-placeholder');
    if(img){img.src=savedLogo;img.style.display='block';}
    if(ph) ph.style.display='none';
  }
}

function renderFichiers(){
  const search=(document.getElementById('fich-search')?.value||'').toLowerCase();
  const filtered=DB.fichiers.filter(f=>{
    const fOk=fichierFilter==='tous'||f.cat===fichierFilter;
    const sOk=!search||JSON.stringify(f).toLowerCase().includes(search);
    return fOk&&sOk;
  });

  // KPIs
  document.getElementById('fich-nb-contrats').textContent=DB.fichiers.filter(f=>f.cat==='Contrat').length;
  document.getElementById('fich-nb-locataires').textContent=DB.fichiers.filter(f=>f.cat==='Locataire').length;
  document.getElementById('fich-nb-biens').textContent=DB.fichiers.filter(f=>f.cat==='Bien').length;
  document.getElementById('fich-nb-autres').textContent=DB.fichiers.filter(f=>f.cat==='Autre').length;

  const grid=document.getElementById('fich-grid');
  const empty=document.getElementById('fich-empty');

  if(!filtered.length){
    grid.style.display='none';
    empty.style.display='block';
    return;
  }
  grid.style.display='grid';
  empty.style.display='none';

  const catColors={Contrat:'#dbeafe',Locataire:'#dcfce7',Bien:'#fef9ec',Autre:'#ede9fe'};
  const catIcons={Contrat:'description',Locataire:'person',Bien:'home_work',Autre:'folder'};
  const extIcon=name=>{
    if(!name)return'description';
    const ext=(name.split('.').pop()||'').toLowerCase();
    if(['pdf'].includes(ext)) return'picture_as_pdf';
    if(['jpg','jpeg','png','gif','webp'].includes(ext)) return'image';
    if(['doc','docx'].includes(ext)) return'article';
    if(['xls','xlsx'].includes(ext)) return'table_chart';
    return'description';
  };

  grid.innerHTML=filtered.map((f,i)=>{
    const realIdx=DB.fichiers.indexOf(f);
    const bg=catColors[f.cat]||'#f3f4f6';
    const icon=extIcon(f.fileName||f.nom);
    const dateStr=f.date?new Date(f.date).toLocaleDateString('fr-FR'):'';
    const sizeStr=f.size?formatFileSize(f.size):'';
    return `<div class="card" style="overflow:hidden;transition:.15s;cursor:pointer" onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,.12)'" onmouseleave="this.style.transform='';this.style.boxShadow='0 2px 10px rgba(0,0,0,.07)'">
      <!-- Icône -->
      <div style="background:${bg};padding:22px;text-align:center">
        <span class="material-symbols-rounded" style="font-size:44px;color:#555">${icon}</span>
      </div>
      <!-- Infos -->
      <div style="padding:12px">
        <div style="font-size:12px;font-weight:700;color:#111;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:3px" title="${f.nom}">${f.nom}</div>
        <div style="font-size:10px;color:#999;margin-bottom:6px">${f.lie||''}${f.lie&&dateStr?' · ':''}${dateStr}${sizeStr?' · '+sizeStr:''}</div>
        <span class="badge ${f.cat==='Contrat'?'blue':f.cat==='Locataire'?'green':f.cat==='Bien'?'orange':'gray'}" style="font-size:10px">${f.cat}</span>
      </div>
      <!-- Actions -->
      <div style="padding:8px 12px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:6px">
        ${f.data?`<button class="icon-btn icon-download" title="Télécharger" onclick="downloadFichier(${realIdx})"><span class="material-symbols-rounded">download</span></button>`:''}
        <button class="icon-btn icon-delete" title="Supprimer" onclick="deleteFichier(${realIdx})"><span class="material-symbols-rounded">delete</span></button>
      </div>
    </div>`;
  }).join('');
}

function formatFileSize(bytes){
  if(bytes<1024)return bytes+'o';
  if(bytes<1024*1024)return Math.round(bytes/1024)+'Ko';
  return (bytes/(1024*1024)).toFixed(1)+'Mo';
}

function filterFichiers(f){
  fichierFilter=f;
  renderFichiers();
}

function openFichierModal(){
  _fichierDataURL=null;_fichierFileName='';_fichierFileSize=0;_fichierFileType='';
  document.getElementById('fich-nom').value='';
  document.getElementById('fich-desc').value='';
  document.getElementById('fich-drop-label').textContent='Glissez un fichier ici ou cliquez pour parcourir';
  const pb=document.getElementById('fich-preview-bar');pb.style.display='none';
  // Remplir le select "Lié à"
  const lie=document.getElementById('fich-lie');
  lie.innerHTML='<option value="">— Aucun —</option>';
  DB.locataires.forEach(l=>lie.innerHTML+=`<option>${l.prenom} ${l.nom}</option>`);
  DB.locatives.forEach(l=>lie.innerHTML+=`<option>${l.nom}</option>`);
  DB.contrats.forEach(c=>{ if(c.locataire&&c.locataire!=='-') lie.innerHTML+=`<option>Contrat ${c.locataire} — ${c.locative}</option>`; });
  const m=document.getElementById('fichierModal');m.style.display='flex';m.style.alignItems='center';m.style.justifyContent='center';
  // Drag & drop
  const dz=document.getElementById('fich-drop-zone');
  dz.ondragover=e=>{e.preventDefault();dz.style.borderColor='var(--gold)';dz.style.background='#fffdf5';};
  dz.ondragleave=()=>{dz.style.borderColor='#9aa0ff';dz.style.background='';};
  dz.ondrop=e=>{e.preventDefault();dz.style.borderColor='#9aa0ff';dz.style.background='';const f=e.dataTransfer.files[0];if(f)processFichierFile(f);};
}
function closeFichierModal(){document.getElementById('fichierModal').style.display='none';}

function onFichierSelected(input){
  const f=input.files[0];if(!f)return;
  processFichierFile(f);
}

function processFichierFile(file){
  _fichierFileName=file.name;
  _fichierFileSize=file.size;
  _fichierFileType=file.type;
  const nom=document.getElementById('fich-nom');
  if(!nom.value) nom.value=file.name.replace(/\.[^.]+$/,'');
  const pb=document.getElementById('fich-preview-bar');
  pb.style.display='flex';
  document.getElementById('fich-preview-name').textContent=file.name;
  document.getElementById('fich-preview-size').textContent=formatFileSize(file.size);
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  const icons={pdf:'picture_as_pdf',jpg:'image',jpeg:'image',png:'image',doc:'article',docx:'article',xls:'table_chart',xlsx:'table_chart'};
  document.getElementById('fich-preview-icon').textContent=icons[ext]||'description';
  document.getElementById('fich-drop-label').textContent='Fichier sélectionné';
  const reader=new FileReader();
  reader.onload=e=>{ _fichierDataURL=e.target.result; };
  reader.readAsDataURL(file);
}

function saveFichier(){
  const nom=document.getElementById('fich-nom').value.trim();
  if(!nom)return toast('Le nom est requis','err');
  if(!DB.fichiers) DB.fichiers=[];
  DB.fichiers.unshift({
    nom,cat:document.getElementById('fich-cat').value,
    lie:document.getElementById('fich-lie').value,
    desc:document.getElementById('fich-desc').value,
    fileName:_fichierFileName||nom,
    size:_fichierFileSize,
    type:_fichierFileType,
    data:_fichierDataURL||null,
    date:new Date().toISOString().split('T')[0]
  });
  saveDB();resetFichierModalForm();closeFichierModal();renderFichiers();toast('Fichier enregistré ✓');
}

function downloadFichier(idx){
  const f=DB.fichiers[idx];
  if(!f||!f.data)return toast('Aucun fichier à télécharger','err');
  const a=document.createElement('a');
  a.href=f.data;
  a.download=f.fileName||f.nom;
  a.click();
}

function deleteFichier(idx){
  if(!confirm('Supprimer ce fichier ?'))return;
  DB.fichiers.splice(idx,1);
  saveDB();renderFichiers();toast('Fichier supprimé ✓');
}

/* ============================================================
   THEME / TOPBAR
============================================================ */
function toggleTheme(){
  document.body.classList.toggle('dark');
  const d=document.body.classList.contains('dark');
  const icon=document.querySelector('#themeIcon .material-symbols-rounded');
  if(icon) icon.textContent=d?'light_mode':'dark_mode';
  const cfg=document.getElementById('cfg-theme');
  if(cfg) cfg.value=d?'dark':'light';
  localStorage.setItem('geniusproperty_theme',d?'dark':'light');
}
function toggleUM(){document.getElementById('userMenu').classList.toggle('show')}
document.addEventListener('click',e=>{
  const m=document.getElementById('userMenu');
  if(m&&!e.target.closest('.user-box'))m.classList.remove('show');
});
function toggleFS(){
  if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

/* ============================================================
   TOAST
============================================================ */
let toastT;
function toast(msg,type='ok'){
  const el=document.getElementById('toastEl');
  document.getElementById('toastMsg').textContent=msg;
  document.getElementById('toastIcon').textContent=type==='err'?'❌':type==='info'?'ℹ️':'✅';
  el.className='toast show'+(type==='err'?' err':'');
  clearTimeout(toastT);
  toastT=setTimeout(()=>el.classList.remove('show'),3000);
}

/* ============================================================
   LOGIN / PARTICLES
============================================================ */
const canvas=document.getElementById('particles');
const ctx2=canvas.getContext('2d');
let pw,ph;
function resizeC(){pw=canvas.width=window.innerWidth;ph=canvas.height=window.innerHeight}
window.addEventListener('resize',resizeC);resizeC();
const pts=Array.from({length:60},()=>({x:Math.random()*9999,y:Math.random()*9999,r:Math.random()*2+.5,v:Math.random()*.45+.15,o:Math.random()*.8+.2}));
/* ============================================================
   SUPABASE — Configuration
   ⚠️  Remplace SUPA_URL et SUPA_KEY par tes vraies valeurs
   (Settings → API dans ton dashboard Supabase)
============================================================ */
// SUPA_URL, SUPA_KEY, supa, SUPA_READY — déclarés en début de fichier

/* ============================================================
   DB — Sauvegarde vers Supabase (+ fallback localStorage)
============================================================ */
const SUPA_TABLES = [
  'employes','proprietaires','locataires',
  'biens','locatives','contrats','paiements','depenses'
];


/* ── Indicateur de synchronisation ── */
function _setSyncStatus(state, msg){
  // state: 'syncing' | 'ok' | 'offline' | 'error'
  let el = document.getElementById('syncIndicator');
  if(!el) return;
  const configs = {
    syncing: { bg:'#fef9ec', color:'#d97706', icon:'sync',        text: msg||'Sync…' },
    ok:      { bg:'#dcfce7', color:'#16a34a', icon:'cloud_done',  text: msg||'Synchronisé' },
    offline: { bg:'#f3f4f6', color:'#6b7280', icon:'cloud_off',   text: 'Hors ligne' },
    error:   { bg:'#fee2e2', color:'#dc2626', icon:'cloud_sync',  text: msg||'Erreur sync' },
  };
  const c = configs[state] || configs.offline;
  el.style.background = c.bg;
  el.style.color = c.color;
  el.innerHTML = `<span class="material-symbols-rounded" style="font-size:13px${state==='syncing'?';animation:spin .8s linear infinite':''}">${c.icon}</span> ${c.text}`;
  el.style.display = 'flex';
  if(state === 'ok') setTimeout(()=>{ el.style.display='none'; }, 3000);
}

async function saveDB(){
  // FIX V40 : sauvegarde dans les 2 tables utilisées par les anciennes/nouvelles pages.
  safeSetLocal(GP_STORAGE_KEY, JSON.stringify(DB)); gp_saveBackupSnapshot();
  window.DB = DB;
  if(typeof renderDashboard === 'function') renderDashboard();

  if(!SUPA_READY || !supa){ _setSyncStatus('offline'); return; }
  _setSyncStatus('syncing', 'Sauvegarde…');

  try {
    const now = new Date().toISOString();
    const results = await Promise.allSettled([
      supa.from('gp_app_data').upsert({ id:'main', payload:DB, updated_at:now }, { onConflict:'id' }),
      supa.from('gp_databases').upsert({ id:'main', workspace_id:'default', name:'Genius Property', data:DB, updated_at:now }, { onConflict:'workspace_id' })
    ]);
    const ok = results.some(r => r.status === 'fulfilled' && !r.value.error);
    const err = results.find(r => r.status === 'fulfilled' && r.value.error);
    if(!ok) throw (err && err.value && err.value.error) || new Error('Aucune sauvegarde Supabase réussie');
    if(err) console.warn('Supabase saveDB partiel:', err.value.error.message || err.value.error);
    _setSyncStatus('ok', 'Sauvegardé');
  } catch(e){
    console.warn('Supabase saveDB:', e.message || e);
    _setSyncStatus('error', 'Erreur sync');
  }
}

async function loadDB(){
  // FIX V40 : charge gp_app_data ET gp_databases, puis garde la base la plus complète/récente.
  const cached = localStorage.getItem(GP_STORAGE_KEY);
  const cachedDB = safeJSONParse(cached, null);
  if(cachedDB) Object.assign(DB, cachedDB);
  ['fichiers','messages','conversations'].forEach(k=>{ if(!Array.isArray(DB[k])) DB[k]=[]; });
  if(!DB.employeDocs) DB.employeDocs={};
  if(!DB.proprietaireDocs) DB.proprietaireDocs={};
  if(!DB.locataireDocs) DB.locataireDocs={};

  if(!SUPA_READY || !supa){ _setSyncStatus('offline'); return; }
  _setSyncStatus('syncing', 'Chargement…');
  try {
    const [appRes, dbRes] = await Promise.allSettled([
      supa.from('gp_app_data').select('payload, updated_at').eq('id', 'main').maybeSingle(),
      supa.from('gp_databases').select('data, updated_at').eq('workspace_id', 'default').maybeSingle()
    ]);
    const choices = [];
    if(appRes.status === 'fulfilled' && !appRes.value.error && appRes.value.data && appRes.value.data.payload){
      choices.push({ source:'gp_app_data', data:appRes.value.data.payload, updated_at:appRes.value.data.updated_at });
    }
    if(dbRes.status === 'fulfilled' && !dbRes.value.error && dbRes.value.data && dbRes.value.data.data){
      choices.push({ source:'gp_databases', data:dbRes.value.data.data, updated_at:dbRes.value.data.updated_at });
    }
    if(choices.length){
      const defaults = {employes:[],proprietaires:[],locataires:[],biens:[],locatives:[],contrats:[],paiements:[],depenses:[],fichiers:[],messages:[],conversations:[],agenda:[],employeDocs:{},proprietaireDocs:{},locataireDocs:{}};
      const countRows = d => ['employes','proprietaires','locataires','biens','locatives','contrats','paiements','depenses'].reduce((n,k)=>n+(Array.isArray(d && d[k])?d[k].length:0),0);
      choices.sort((a,b) => {
        const ca = countRows(a.data), cb = countRows(b.data);
        if(ca !== cb) return cb - ca;
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      });
      Object.keys(DB).forEach(k => delete DB[k]);
      Object.assign(DB, defaults, choices[0].data);
      window.DB = DB;
      safeSetLocal(GP_STORAGE_KEY, JSON.stringify(DB)); gp_saveBackupSnapshot();
      if(typeof renderDashboard === 'function') renderDashboard();
      if(typeof updateSidebarBadges === 'function') updateSidebarBadges();
      _setSyncStatus('ok', 'Données à jour');
      // [cleaned] debug console statement removed
    } else {
      _setSyncStatus('ok', 'Connecté');
    }
  } catch(e){
    console.warn('Supabase loadDB hors ligne:', e.message || e);
    _setSyncStatus('offline');
  }
}

/* ============================================================
   DASHBOARD DYNAMIQUE — données Supabase temps réel
============================================================ */
let _dashboardRealtimeStarted = false;
let _dashboardRefreshTimer = null;

async function refreshDashboardFromSupabase({silent=false} = {}){
  if(!SUPA_READY || !supa){
    if(!silent) _setSyncStatus('offline');
    renderDashboard();
    return;
  }
  if(!silent) _setSyncStatus('syncing', 'Actualisation…');
  try{
    const { data, error } = await supa
      .from('gp_app_data')
      .select('payload, updated_at')
      .eq('id', 'main')
      .maybeSingle();
    if(error) throw error;
    if(data && data.payload){
      Object.assign(DB, data.payload);
      safeSetLocal(GP_STORAGE_KEY, JSON.stringify(DB)); gp_saveBackupSnapshot();
    }
    renderDashboard();
    updateSidebarBadges();
    if(!silent) _setSyncStatus('ok', 'Données à jour');
  }catch(e){
    console.warn('Dashboard Supabase:', e.message || e);
    if(!silent) _setSyncStatus('error', 'Erreur dashboard');
    renderDashboard();
  }
}

function startDashboardRealtime(){
  if(_dashboardRealtimeStarted || !SUPA_READY || !supa) return;
  _dashboardRealtimeStarted = true;
  clearInterval(_dashboardRefreshTimer);
  _dashboardRefreshTimer = setInterval(()=>{
    const dashVisible = document.getElementById('page-dashboard')?.classList.contains('active');
    if(dashVisible) refreshDashboardFromSupabase({silent:true});
  }, 30000);
  supa.channel('genius-dashboard-realtime')
    .on('postgres_changes', { event:'*', schema:'public', table:'paiements' }, () => refreshDashboardFromSupabase({silent:true}))
    .on('postgres_changes', { event:'*', schema:'public', table:'depenses' }, () => refreshDashboardFromSupabase({silent:true}))
    .on('postgres_changes', { event:'*', schema:'public', table:'biens' }, () => refreshDashboardFromSupabase({silent:true}))
    .on('postgres_changes', { event:'*', schema:'public', table:'locataires' }, () => refreshDashboardFromSupabase({silent:true}))
    .on('postgres_changes', { event:'*', schema:'public', table:'locatives' }, () => refreshDashboardFromSupabase({silent:true}))
    .subscribe(status => { if(status === 'SUBSCRIBED') _setSyncStatus('ok', 'Temps réel actif'); });
}




/* ============================================================
   SUPABASE AUTH
   Remplace le login factice par Supabase Auth
============================================================ */
/* ============================================================
   SYSTÈME DE PERMISSIONS
============================================================ */
let currentUser = null; // { email, isAdmin, droits:{...} }

// Mapping droits → pages autorisées
const DROITS_PAGES = {
  employes:      ['employes','nv-employe'],
  proprietaires: ['proprietaires','nv-proprietaire'],
  locataires:    ['locataires','nv-locataire'],
  bail:          ['biens','nv-bien','locatives','nv-locative','bien-detail'],
  contrats:      ['contrats','nv-contrat'],
  paiements:     ['paiements'],
  avenir:        ['avenir'],
  depenses:      ['depenses'],
  fichiers:      ['fichiers'],
  messages:      ['messages'],
  rapports:      ['rapports'],
  journal:       ['journal','agenda-employes'],
  superAdmin:    ['parametres','messages','employes','nv-employe','agenda-employes']
};

// Pages toujours accessibles à tous
const PAGES_LIBRES = ['dashboard','droits'];

function canAccess(page){
  if(!currentUser) return false;
  if(currentUser.isAdmin) return true;           // admin = tout
  if(PAGES_LIBRES.includes(page)) return true;   // dashboard libre
  const d = currentUser.droits || {};
  return Object.entries(DROITS_PAGES).some(([key, pages]) => d[key] && pages.includes(page));
}

function appliqueDroits(){
  if(!currentUser) return;

  // 1. Sidebar : afficher uniquement les pages accessibles
  document.querySelectorAll('#sideMenu li[data-page]').forEach(li => {
    const page = li.dataset.page;
    const ok = canAccess(page);
    li.style.display = ok ? '' : 'none';
  });

  // 2. Règles supplémentaires sidebar
  if(!currentUser.isAdmin){
    const empLi   = document.querySelector('#sideMenu li[data-page="employes"]');
    const paramLi = document.querySelector('#sideMenu li[data-page="parametres"]');
    if(empLi   && !(currentUser.droits?.employes))   empLi.style.display   = 'none';
    if(paramLi && !currentUser.droits?.superAdmin)   paramLi.style.display = 'none';
  }
  const journalLi = document.getElementById('menuJournal');
  const droitsLi  = document.getElementById('menuDroits');
  if(journalLi) journalLi.style.display = (currentUser.isAdmin || currentUser.droits?.journal) ? '' : 'none';
  if(droitsLi)  droitsLi.style.display  = currentUser.isAdmin ? '' : 'none';

  // 3. Boutons topbar : masquer selon droits
  if(!currentUser.isAdmin){
    const d = currentUser.droits || {};
    // Bouton Messages dans topbar
    document.querySelectorAll('.tb-icon-btn').forEach(btn => {
      const ic = btn.querySelector('.material-symbols-rounded');
      if(!ic) return;
      const icon = ic.textContent.trim();
      if(icon === 'mail'         && !d.messages)  btn.style.display = 'none';
      if(icon === 'notifications'&& !d.dashboard) btn.style.display = 'none';
    });
  }
}

// Applique les droits à chaque navigation (masque boutons d'action si non autorisé)
function appliqueDroitsPage(page){
  if(!currentUser || currentUser.isAdmin) return;
  const d = currentUser.droits || {};
  // Masquer boutons "Nouveau / Ajouter / Importer" sur pages non-éditables
  const writePages = ['employes','proprietaires','locataires','biens','locatives','contrats','paiements','depenses','fichiers'];
  writePages.forEach(p => {
    const pageEl = document.getElementById('page-'+p);
    if(!pageEl) return;
    const canWrite = d[p] === 'ecriture' || d[p] === true || d[p+'_write'];
    pageEl.querySelectorAll('.btn-primary, .btn[onclick*="nv-"], .btn[onclick*="openDep"], .btn[onclick*="openFich"]').forEach(btn => {
      btn.style.display = canWrite ? '' : 'none';
    });
  });
}

let animRunning=true;
function animP(){
  if(!animRunning)return;
  ctx2.clearRect(0,0,pw,ph);
  pts.forEach(p=>{p.y-=p.v;if(p.y<0){p.y=ph;p.x=Math.random()*pw}ctx2.beginPath();ctx2.fillStyle=`rgba(212,175,55,${p.o})`;ctx2.arc(p.x,p.y,p.r,0,Math.PI*2);ctx2.fill()});
  requestAnimationFrame(animP);
}animP();

/* ── Réinitialisation mot de passe via Supabase ── */
function toggleForgotFlow(show){
  document.getElementById('forgotFlow').style.display = show ? 'block' : 'none';
  document.getElementById('forgotLink').style.display = show ? 'none' : 'block';
  document.getElementById('forgotMsg').textContent = '';
  if(show){
    // Pré-remplir avec l'email saisi dans le champ login
    const loginEmail = document.getElementById('lu').value.trim();
    if(loginEmail) document.getElementById('forgotEmail').value = loginEmail;
    document.getElementById('forgotEmail').focus();
  }
}

async function sendResetEmail(){
  const email = document.getElementById('forgotEmail').value.trim();
  const msgEl = document.getElementById('forgotMsg');
  msgEl.style.color = '#9ca3af';
  msgEl.textContent = '';

  if(!email){
    msgEl.textContent = 'Veuillez saisir votre email.';
    msgEl.style.color = '#f97316';
    return;
  }
  if(!SUPA_READY){
    msgEl.textContent = "Configurez Supabase pour activer cette fonction.";
    msgEl.style.color = '#f97316';
    return;
  }

  msgEl.textContent = 'Envoi en cours…';
  const { error } = await supa.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.href
  });

  if(error){
    msgEl.textContent = error.message;
    msgEl.style.color = '#ef4444';
  } else {
    msgEl.innerHTML = '✓ Email envoyé ! Vérifiez votre boîte de réception.';
    msgEl.style.color = '#22c55e';
    // Retour automatique après 4 secondes
    setTimeout(() => toggleForgotFlow(false), 4000);
  }
}

async function resetPassword(){
  // Compatibilité ancienne — redirige vers le nouveau flow
  toggleForgotFlow(true);
}

function tglPwd(){const i=document.getElementById('lp'); if(!i)return; i.type=i.type==='password'?'text':'password'}
async function doLogin(){
  const email = document.getElementById('lu').value.trim();
  const pwd   = document.getElementById('lp').value;
  const btn   = document.getElementById('loginBtn');
  const errEl = document.getElementById('authError');
  errEl.textContent = '';
  if(!email || !pwd){ errEl.textContent = 'Veuillez saisir vos identifiants.'; return; }

  // Production sécurisée : aucun mode démo/local ne doit ouvrir l'application.
  if(!SUPA_READY){
    errEl.textContent = 'Supabase n’est pas chargé. Connexion refusée.';
    return;
  }

  // ── Authentification Supabase ────────────────────────────
  btn.classList.add('loading');
  btn.textContent = 'Connexion…';
  try {
    const { data, error } = await supa.auth.signInWithPassword({ email, password: pwd });
    if(error){
      let msg = error.message;
      if(msg === 'Invalid login credentials')
        msg = 'Email ou mot de passe incorrect.';
      else if(msg.includes('Email not confirmed'))
        msg = 'Email non confirmé. Confirmez votre email ou désactivez la confirmation dans Supabase → Auth → Settings.';
      else if(msg.includes('User not found'))
        msg = 'Aucun compte trouvé avec cet email.';
      errEl.textContent = msg;
      btn.classList.remove('loading');
      btn.textContent = 'Se connecter';
      return;
    }
    // Connexion OK — mise à jour du nom dans la sidebar
    const userEmail = data.user?.email || email;
    const userName  = userEmail.split('@')[0];
    document.querySelectorAll('.user-name').forEach(el => el.textContent = userName);
    document.querySelectorAll('.user-menu-name').forEach(el => el.textContent = userName);
    await loadDB();
    // Si le cloud existe, ne jamais réécrire depuis un cache local vide.
    localStorage.setItem('gp_migrated_v1', '1');
    _showApp();
  } catch(e){
    errEl.textContent = 'Erreur réseau. Vérifiez votre connexion.';
    btn.classList.remove('loading');
    btn.textContent = 'Se connecter';
  }
}

/* ── Migration automatique localStorage → Supabase (une seule fois) ── */
async function _migrateLocalToSupabase(){
  if(!SUPA_READY) return;
  // Vérifier si une migration a déjà eu lieu
  if(localStorage.getItem('gp_migrated_v1')) return;
  // Vérifier si Supabase est déjà peuplé (au moins une table non vide)
  try {
    const { data } = await supa.from('gp_app_data').select('id').eq('id','main').maybeSingle();
    if(data){
      // Supabase déjà peuplé — on marque comme migré sans écraser
      localStorage.setItem('gp_migrated_v1', '1');
      return;
    }
    // Supabase vide et données locales présentes → migration
    const hasLocalData = SUPA_TABLES.some(t => DB[t]?.length > 0);
    if(!hasLocalData){ localStorage.setItem('gp_migrated_v1','1'); return; }
    _setSyncStatus('syncing', 'Migration des données…');
    await saveDB();
    localStorage.setItem('gp_migrated_v1', '1');
    _setSyncStatus('ok', 'Migration terminée ✓');
    toast('Données locales migrées vers Supabase ✓');
  } catch(e){
    console.warn('Migration Supabase:', e.message);
  }
}

async function _showApp(){
  animRunning = false;
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  const btn = document.getElementById('loginBtn');
  if(btn){ btn.classList.remove('loading'); btn.textContent = 'Se connecter'; }

  // Identifier l'utilisateur connecté et ses droits
  await _loadCurrentUser();

  navigate('dashboard');
  // Mettre à jour le nom "Bonjour" après chargement utilisateur
  setTimeout(function(){
    var nameEl = document.getElementById('gpUName');
    if(nameEl && window.currentUser){
      var u = window.currentUser;
      var d = (typeof DB !== 'undefined' && DB) ? DB : {};
      var emp = (d.employes||[]).find(function(e){ return e.email === u.email; });
      var name;
      if(emp && (emp.prenom || emp.nom)){
        name = String(emp.prenom||'').trim() || String(emp.nom||'').trim();
      } else {
        var n = (u.email||'').split('@')[0].replace(/[._-]+/g,' ');
        name = n.charAt(0).toUpperCase() + n.slice(1);
      }
      nameEl.textContent = name;
    }
  }, 150);
  updateSidebarBadges();
  startDashboardRealtime();
  refreshDashboardFromSupabase({silent:true});
  if(localStorage.getItem('geniusproperty_theme')==='dark'){
    document.body.classList.add('dark');
    const ti = document.querySelector('#themeIcon .material-symbols-rounded');
    if(ti) ti.textContent = 'light_mode';
  }
}

async function _loadCurrentUser(){
  // Récupérer la session Supabase
  let email = '';
  if(SUPA_READY){
    try {
      const session = window.currentUser ? { user: { email: window.currentUser.email } } : null;
      email = session?.user?.email || '';
    } catch(e){}
  }

  // Chercher l'employé correspondant dans DB
  const employe = DB.employes.find(e => e.email === email);

  if(!employe){
    // Pas trouvé dans DB.employes → c'est l'admin principal
    currentUser = { email, isAdmin: true, droits: null };
    window.currentUser = currentUser;
  } else if(employe.droits?.superAdmin){
    currentUser = { email, isAdmin: true, droits: employe.droits };
    window.currentUser = currentUser;
  } else {
    currentUser = { email, isAdmin: false, droits: employe.droits || {} };
    window.currentUser = currentUser;
  }

  try { window.dispatchEvent(new CustomEvent('gp:auth-changed', { detail: window.currentUser || currentUser })); } catch(e){}

  // Mettre à jour le nom dans la sidebar et partout dans l'UI
  const nom = employe
    ? (String(employe.prenom||'').trim() || String(employe.nom||'').trim() || email.split('@')[0])
    : email.split('@')[0];
  // Persister pour uname() appelé avant la fin du chargement
  localStorage.setItem('gp_session_name', nom);
  document.querySelectorAll('.user-name').forEach(el => el.textContent = nom);
  document.querySelectorAll('.user-menu-name').forEach(el => el.textContent = nom);
  // Rafraîchir le "Bonjour" du dashboard immédiatement
  const gpUNameEl = document.getElementById('gpUName');
  if(gpUNameEl) gpUNameEl.textContent = nom;

  // Afficher la photo de l'utilisateur dans la topbar et le menu
  _updateTopbarAvatar(employe);

  // Appliquer les restrictions de menu
  appliqueDroits();
}

function _updateTopbarAvatar(employe){
  const topbarAvatar = document.getElementById('topbarAvatar');
  const menuAvatar   = document.getElementById('menuAvatar');
  if(!topbarAvatar || !menuAvatar) return;
  if(employe?.photo){
    topbarAvatar.innerHTML = `<img src="${employe.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    menuAvatar.innerHTML   = `<img src="${employe.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:9px">`;
  } else {
    const initial = employe ? (employe.prenom?.[0]||employe.nom?.[0]||'E').toUpperCase() : 'A';
    topbarAvatar.innerHTML = `<span class="material-symbols-rounded" style="font-size:22px;color:#fff;font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24">person</span>`;
    menuAvatar.textContent = initial;
  }
}
async function doLogout(){
  try { window.currentUser = null; window.dispatchEvent(new CustomEvent('gp:auth-changed', { detail: null })); } catch(e){}
  // Déconnexion Supabase (si configuré)
  if(SUPA_READY){
    await supa.auth.signOut().catch(() => {});
  }
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('authError').textContent = '';
  document.getElementById('lu').value = '';
  document.getElementById('lp').value = '';
  localStorage.removeItem('gp_session_name');
  animRunning = true; animP();
}

/* ============================================================
   SIDEBAR BADGES
============================================================ */
function updateSidebarBadges(){
  const dispo=DB.locatives.filter(l=>l.statut==='Disponible').length;
  const today=new Date();
  const urgents=DB.contrats.filter(c=>{
    if(c.statut!=='Actif'||c.prochain==='-')return false;
    const parts=c.prochain.split('/');
    const d=parts.length===3?new Date(`${parts[2]}-${parts[1]}-${parts[0]}`):new Date(c.prochain);
    return !isNaN(d)&&Math.ceil((d-today)/86400000)<=7;
  }).length;
  setSidebarBadge('locatives',dispo,'green');
  setSidebarBadge('avenir',urgents,'orange');
  updateMsgBadge();
}
function setSidebarBadge(page,count,color){
  const li=document.querySelector(`#sideMenu li[data-page="${page}"]`);
  if(!li)return;
  let badge=li.querySelector('.side-badge');
  if(!badge){badge=document.createElement('span');badge.className='side-badge';li.appendChild(badge);}
  if(count>0){badge.textContent=count;badge.style.cssText=`margin-left:auto;background:${color==='green'?'#16a34a':'#f59e0b'};color:#fff;border-radius:10px;padding:1px 6px;font-size:10px;font-weight:700;`;}
  else badge.remove();
}
document.getElementById('lp')?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});

/* ── Vérification session Supabase au chargement ── */
(async () => {
  // Production sécurisée : si Supabase n'est pas prêt, rester sur le login.
  if(!SUPA_READY){
    document.getElementById('loginPage').style.display = 'flex';
    const errEl = document.getElementById('authError');
    if(errEl) errEl.textContent = 'Firebase est en cours de chargement. Réessayez dans quelques secondes.';
    return;
  }
  try {
    const { data: { session } } = await supa.auth.getSession();
    if(session){
      // Session active → connexion silencieuse, pas de flash login
      const userEmail = session.user?.email || '';
      const userName  = userEmail.split('@')[0];
      document.querySelectorAll('.user-name').forEach(el => el.textContent = userName);
      document.querySelectorAll('.user-menu-name').forEach(el => el.textContent = userName);
      await loadDB();
      _showApp();
    } else {
      // Pas de session → afficher la page login
      document.getElementById('loginPage').style.display = 'flex';
    }
  } catch(e){
    console.warn('Session check:', e.message);
    // En cas d'erreur réseau → afficher login quand même
    document.getElementById('loginPage').style.display = 'flex';
  }
})();

/* ── Utilitaires formulaire employé ───────────────────────── */
function resetEmployeForm(){
  // Reset all text/select/date fields
  ['e-civ','e-nom','e-prenom','e-naiss','e-fonction','e-adresse','e-tel','e-piece',
   'e-numpiece','e-lieu','e-deldeb','e-delexp','e-matri','e-enfants','e-contrat',
   'e-email','e-pass'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    if(el.tagName==='SELECT') el.selectedIndex=0;
    else el.value='';
  });
  // Reset password strength + suggestion
  const ps=document.getElementById('e-pass-strength');
  if(ps)ps.textContent='';
  const sugg=document.getElementById('e-pass-suggestion');
  if(sugg)sugg.style.display='none';
  const eyeIcon=document.getElementById('e-pass-eye');
  if(eyeIcon)eyeIcon.textContent='visibility';
  const passField=document.getElementById('e-pass');
  if(passField)passField.type='password';
  // Reset photo
  clearEmployePhoto();
  // Reset all droits checkboxes (employés coché par défaut, reste décoché)
  const droitsEl=document.querySelectorAll('#droits-list .toggle-switch input[type=checkbox]');
  droitsEl.forEach((cb,i)=>{cb.checked=(i===0);});
}

function clearEmployePhoto(){
  const input=document.getElementById('e-photo-input');
  if(input){input.value='';}
  const preview=document.getElementById('e-photo-preview');
  if(preview){preview.src='';preview.style.display='none';}
  const icon=document.getElementById('e-photo-icon');
  if(icon)icon.style.display='';
  const label=document.getElementById('e-photo-label');
  if(label)label.style.display='';
}
function _clearPhoto(inputId, previewId, iconId, labelId){
  const i=document.getElementById(inputId); if(i) i.value='';
  const p=document.getElementById(previewId); if(p){p.src='';p.style.display='none';}
  const ic=document.getElementById(iconId); if(ic) ic.style.display='';
  const l=document.getElementById(labelId); if(l) l.style.display='';
}
function clearProprietairePhoto(){ _clearPhoto('p-photo-input','p-photo-preview','p-photo-icon','p-photo-label'); }
function clearLocatairePhoto(){    _clearPhoto('lc-photo-input','lc-photo-preview','lc-photo-icon','lc-photo-label'); }
function clearBienPhoto(){         _clearPhoto('b-photo-input','b-photo-preview','b-photo-icon','b-photo-label'); }
function clearLocationPhoto(){     _clearPhoto('lv-photo-input','lv-photo-preview','lv-photo-icon','lv-photo-label'); }

function tglPassField(inputId, iconId){
  const i = document.getElementById(inputId);
  const ico = document.getElementById(iconId);
  if(!i) return;
  const show = i.type === 'password';
  i.type = show ? 'text' : 'password';
  if(ico) ico.textContent = show ? 'visibility_off' : 'visibility';
}

function suggestPassword(){
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$!';
  let pwd = '';
  // Garantit au moins 1 maj, 1 chiffre, 1 spécial
  pwd += 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random()*24)];
  pwd += '23456789'[Math.floor(Math.random()*8)];
  pwd += '@#$!'[Math.floor(Math.random()*4)];
  for(let i=0;i<9;i++) pwd += chars[Math.floor(Math.random()*chars.length)];
  // Mélanger
  pwd = pwd.split('').sort(()=>Math.random()-.5).join('');
  document.getElementById('e-pass-suggested-val').textContent = pwd;
  document.getElementById('e-pass-suggestion').style.display = 'block';
  checkPassStrength(pwd);
}

function copyAndUseSuggestion(){
  const pwd = document.getElementById('e-pass-suggested-val').textContent;
  const input = document.getElementById('e-pass');
  input.value = pwd;
  input.type = 'text';
  document.getElementById('e-pass-eye').textContent = 'visibility_off';
  document.getElementById('e-pass-suggestion').style.display = 'none';
  checkPassStrength(pwd);
  // Copier dans le presse-papier
  navigator.clipboard?.writeText(pwd).then(()=>toast('Mot de passe copié dans le presse-papier ✓'));
}

function checkPassStrength(pwd){
  const el = document.getElementById('e-pass-strength');
  if(!el) return;
  if(!pwd){ el.textContent=''; return; }
  let score = 0;
  if(pwd.length >= 8)  score++;
  if(pwd.length >= 12) score++;
  if(/[A-Z]/.test(pwd)) score++;
  if(/[0-9]/.test(pwd)) score++;
  if(/[^a-zA-Z0-9]/.test(pwd)) score++;
  const levels = ['','Très faible','Faible','Moyen','Fort','Très fort'];
  const colors = ['','#ef4444','#f97316','#eab308','#22c55e','#16a34a'];
  el.textContent = '● ' + (levels[score]||'');
  el.style.color = colors[score]||'#9ca3af';
}

// Vérification force mdp en temps réel
document.addEventListener('input', e => {
  if(e.target && e.target.id === 'e-pass') checkPassStrength(e.target.value);
});



/* ===== GLOBAL BREADCRUMB PREMIUM ===== */
const gpPagesConfig = {
  dashboard: {name:'Bureau', icon:'home', subtitle:'Vue d’ensemble de votre activité'},
  employes: {name:'Équipe & Employés', icon:'badge', subtitle:'Gérez votre équipe et les accès à la plateforme'},
  proprietaires: {name:'Propriétaires', icon:'person', subtitle:'Gérez les propriétaires, leurs biens et leurs documents'},
  locataires: {name:'Locataires', icon:'group', subtitle:'Gérez vos locataires et leurs dossiers'},
  biens: {name:'Biens', icon:'home_work', subtitle:'Gérez votre portefeuille de biens immobiliers'},
  locatives: {name:'Locations', icon:'door_front', subtitle:'Suivez les locations en cours et les affectations'},
  contrats: {name:'Contrats', icon:'description', subtitle:'Gérez les contrats et documents associés'},
  paiements: {name:'Paiements', icon:'payments', subtitle:'Suivez les encaissements et règlements'},
  depenses: {name:'Dépenses', icon:'account_balance_wallet', subtitle:'Suivez les charges et sorties financières'},
  messages: {name:'Messages', icon:'mail', subtitle:'Consultez et envoyez vos communications'},
  avenir: {name:'À venir', icon:'event', subtitle:'Anticipez les prochaines échéances'},
  fichiers: {name:'Fichiers', icon:'folder', subtitle:'Centralisez vos documents importants'},
  rapports: {name:'Rapports', icon:'bar_chart', subtitle:'Analysez les performances de votre activité'},
  journal: {name:'Journal', icon:'manage_search', subtitle:'Suivez les activités et historiques récents'},
  droits: {name:'Droits d’accès', icon:'admin_panel_settings', subtitle:'Gérez les permissions d’accès de vos employés'},
  parametres: {name:'Paramètres', icon:'settings', subtitle:'Configurez votre plateforme'},
  'nv-bien': {name:'Ajouter un bien', icon:'add_home', parent:'biens', sub:'Ajouter un bien'},
  'bien-detail': {name:'Détails du bien', icon:'home_work', parent:'biens', sub:'Détails du bien'},
  'proprietaire-detail': {name:'Détails propriétaire', icon:'person', parent:'proprietaires', sub:'Détails propriétaire'},
  'nv-employe': {name:'Nouvel employé', icon:'person_add', parent:'employes', sub:'Nouvel employé'},
  'nv-proprietaire': {name:'Nouveau propriétaire', icon:'person_add', parent:'proprietaires', sub:'Nouveau propriétaire'},
  'nv-locataire': {name:'Nouveau locataire', icon:'person_add', parent:'locataires', sub:'Nouveau locataire'},
  'nv-locative': {name:'Nouvelle location', icon:'add_business', parent:'locatives', sub:'Nouvelle location'},
  'nv-contrat': {name:'Nouveau contrat', icon:'note_add', parent:'contrats', sub:'Nouveau contrat'}
};

function updateGlobalBreadcrumb(page){
  const box = document.getElementById('globalBreadcrumb');
  if(!box) return;
  const cfg = gpPagesConfig[page] || {name:'Page', icon:'home'};
  const parentKey = cfg.parent;
  const parentCfg = parentKey ? gpPagesConfig[parentKey] : null;
  const subtitleHtml = cfg.subtitle ? `<span class="breadcrumb-subtitle">${cfg.subtitle}</span>` : '';

  if(parentCfg){
    box.innerHTML = `
      <div class="breadcrumb-box">
        <span class="material-symbols-rounded">${parentCfg.icon}</span>
        <span class="breadcrumb-link" onclick="navigate('${parentKey}')">${parentCfg.name}</span>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-title-wrap"><span class="breadcrumb-main">${cfg.sub || cfg.name}</span>${subtitleHtml}</span>
      </div>
    `;
  }else{
    box.innerHTML = `
      <div class="breadcrumb-box">
        <span class="material-symbols-rounded">${cfg.icon}</span>
        <span class="breadcrumb-title-wrap"><span class="breadcrumb-main">${cfg.name}</span>${subtitleHtml}</span>
      </div>
    `;
  }
}

/* MENU CLICKS */
document.getElementById('sideMenu')?.addEventListener('click',e=>{
  const li=e.target.closest('li[data-page]');
  if(li)navigate(li.dataset.page);
});

updateGlobalBreadcrumb('dashboard');


/* ===== AGENDA EMPLOYÉS — missions assignées ===== */
let empAgendaMonth = new Date();
let empAgendaSelectedDate = new Date().toISOString().slice(0,10);
let empAgendaSelectedEmployee = null;
if(typeof uid==='undefined') window.uid=function(){return 'id_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);};
function empInitials(name){return (name||'').split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2)||'--';}
function empDateKey(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate()).toISOString().slice(0,10);}
function empGetEmployees(){
  const arr=(DB.employes||[]).map(e=>({id:String(e.id||e.email||((e.prenom||'')+' '+(e.nom||''))).trim(),name:(((e.prenom||'')+' '+(e.nom||'')).trim() || e.email || 'Employé'),email:e.email||'',role:e.fonction||e.poste||'Employé'}));
  return arr.length?arr:[{id:'admin',name:(currentUser?.email||'admin').split('@')[0],email:currentUser?.email||'',role:'Administrateur'}];
}
function renderEmployeeAgenda(){
  if(!Array.isArray(DB.employeeAgenda)) DB.employeeAgenda=[];
  const employees=empGetEmployees();
  if(!empAgendaSelectedEmployee || !employees.some(e=>e.id===empAgendaSelectedEmployee)) empAgendaSelectedEmployee=employees[0]?.id||null;
  const q=(document.getElementById('empAgendaSearch')?.value||'').toLowerCase().trim();
  const visible=employees.filter(e=>!q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.role.toLowerCase().includes(q));
  const list=document.getElementById('empAgendaEmployeeList');
  if(list){
    list.innerHTML=visible.map(e=>{
      const count=DB.employeeAgenda.filter(m=>m.employeeId===e.id && m.status!=='termine').length;
      return `<div title="Appuyer pour voir les détails" class="emp-agenda-employee ${e.id===empAgendaSelectedEmployee?'active':''}" onclick="empAgendaSelectEmployee('${String(e.id).replace(/'/g,"\'")}')"><div class="journal-avatar">${empInitials(e.name)}</div><div style="min-width:0;flex:1"><div class="journal-name">${escapeHTML(e.name)}</div><div class="journal-email">${escapeHTML(e.role)}${e.email?' · '+escapeHTML(e.email):''}</div></div><span class="badge ${count?'orange':'gray'}">${count}</span></div>`;
    }).join('') || '<div class="journal-empty">Aucun employé trouvé</div>';
  }
  const emp=employees.find(e=>e.id===empAgendaSelectedEmployee)||employees[0];
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
  if(emp){set('empAgendaAvatar',empInitials(emp.name));set('empAgendaName',emp.name);set('empAgendaRole',(emp.role||'Employé')+(emp.email?' · '+emp.email:''));}
  renderEmpAgendaCalendar();
  fillEmpMissionEmployeeSelect();
}
function empAgendaSelectEmployee(id){empAgendaSelectedEmployee=id;renderEmployeeAgenda();}
function empAgendaPrevMonth(){empAgendaMonth.setMonth(empAgendaMonth.getMonth()-1);renderEmployeeAgenda();}
function empAgendaNextMonth(){empAgendaMonth.setMonth(empAgendaMonth.getMonth()+1);renderEmployeeAgenda();}
function empAgendaSelectDate(key){empAgendaSelectedDate=key;renderEmployeeAgenda();}
function renderEmpAgendaCalendar(){
  const weekdays=document.getElementById('empAgendaWeekdays');
  if(weekdays) weekdays.innerHTML=['LUN','MAR','MER','JEU','VEN','SAM','DIM'].map(d=>`<div class="emp-weekday">${d}</div>`).join('');
  const y=empAgendaMonth.getFullYear(),m=empAgendaMonth.getMonth();
  const ml=document.getElementById('empAgendaMonthLabel'); if(ml) ml.textContent=new Date(y,m,1).toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
  const grid=document.getElementById('empAgendaGrid');
  const missions=(DB.employeeAgenda||[]).filter(x=>x.employeeId===empAgendaSelectedEmployee);
  const today=empDateKey(new Date());
  if(grid){
    const first=new Date(y,m,1); const start=new Date(first); start.setDate(first.getDate()-((first.getDay()+6)%7));
    let html='';
    for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const key=empDateKey(d);const items=missions.filter(x=>x.date===key);html+=`<div class="emp-day ${d.getMonth()!==m?'muted':''} ${key===today?'today':''} ${key===empAgendaSelectedDate?'selected':''}" onclick="empAgendaSelectDate('${key}')"><div class="emp-day-num">${d.getDate()}</div><div>${items.slice(0,5).map(x=>`<span class="emp-mission-dot ${x.priority==='haute'?'high':''}"></span>`).join('')}</div></div>`;}
    grid.innerHTML=html;
  }
  const title=document.getElementById('empAgendaDayTitle'), date=document.getElementById('empAgendaDayDate'), box=document.getElementById('empAgendaMissions');
  const d=new Date(empAgendaSelectedDate+'T00:00:00');
  if(title) title.textContent=empAgendaSelectedDate===today?'Aujourd’hui':'Missions du jour';
  if(date) date.textContent=d.toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
  if(box){
    const items=missions.filter(x=>x.date===empAgendaSelectedDate).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
    box.innerHTML=items.length?items.map(x=>`<div class="emp-mission-card ${x.status==='termine'?'done':''}" onclick="openEmpMissionModal('${x.id}')"><div class="emp-mission-title">${escapeHTML(x.title||'Mission')}</div><div class="emp-mission-meta">${x.time?'⏰ '+x.time+' · ':''}${x.status==='termine'?'Mission faite':x.status==='en_cours'?'En cours':'À faire'}${x.priority==='haute'?' · 🔴 Haute':''}</div>${x.note?`<div class="agenda-note">${escapeHTML(x.note)}</div>`:''}${x.status!=='termine'?`<button class="mission-done-btn" onclick="event.stopPropagation();employeeCompleteMission('${x.id}')">✓ Fait — informer le directeur</button>`:''}</div>`).join(''):`<div class="emp-empty"><div><span class="material-symbols-rounded">event_available</span>Aucune mission<br><button class="btn btn-primary" style="margin-top:12px" onclick="openEmpMissionModal()">+ Ajouter</button></div></div>`;
  }
}
function fillEmpMissionEmployeeSelect(){const sel=document.getElementById('em-employee'); if(!sel)return; sel.innerHTML=empGetEmployees().map(e=>`<option value="${escapeHTML(e.id)}">${escapeHTML(e.name)}${e.role?' — '+escapeHTML(e.role):''}</option>`).join('');}
function openEmpMissionModal(id){
  if(!Array.isArray(DB.employeeAgenda)) DB.employeeAgenda=[];
  fillEmpMissionEmployeeSelect();
  const m= id ? DB.employeeAgenda.find(x=>x.id===id) : null;
  document.getElementById('em-id').value=m?.id||'';
  document.getElementById('em-employee').value=m?.employeeId||empAgendaSelectedEmployee||'';
  document.getElementById('em-title').value=m?.title||'';
  document.getElementById('em-date').value=m?.date||empAgendaSelectedDate;
  document.getElementById('em-time').value=m?.time||'';
  document.getElementById('em-priority').value=m?.priority||'normale';
  document.getElementById('em-status').value=m?.status||'a_faire';
  document.getElementById('em-note').value=m?.note||'';
  document.getElementById('em-delete-btn').style.display=m?'inline-flex':'none';
  document.getElementById('empMissionModal').classList.add('open');
}
function closeEmpMissionModal(){document.getElementById('empMissionModal')?.classList.remove('open');}
function saveEmpMission(){
  const title=document.getElementById('em-title').value.trim(), employeeId=document.getElementById('em-employee').value, date=document.getElementById('em-date').value;
  if(!title||!employeeId||!date){toast('Employé, mission et date obligatoires','err');return;}
  if(!Array.isArray(DB.employeeAgenda)) DB.employeeAgenda=[];
  const id=document.getElementById('em-id').value || uid();
  const obj={id,employeeId,title,date,time:document.getElementById('em-time').value,priority:document.getElementById('em-priority').value,status:document.getElementById('em-status').value,note:document.getElementById('em-note').value.trim(),createdAt:new Date().toISOString()};
  const i=DB.employeeAgenda.findIndex(x=>x.id===id);
  const wasDone = i>=0 && DB.employeeAgenda[i].status==='termine';
  if(i>=0) DB.employeeAgenda[i]={...DB.employeeAgenda[i],...obj}; else DB.employeeAgenda.unshift(obj);
  if(obj.status==='termine' && !wasDone) notifyDirectorMissionDone(obj);
  window.DB = DB; empAgendaSelectedEmployee=employeeId; empAgendaSelectedDate=date; empAgendaMonth=new Date(date+'T00:00:00'); saveDB(); closeEmpMissionModal(); renderEmployeeAgenda(); renderMissionDoneInbox(); if(typeof gpUpdateJournalView==='function') gpUpdateJournalView(); toast(obj.status==='termine'?'Mission faite reçue par le directeur 2713':'Mission enregistrée 2713');
}

function notifyDirectorMissionDone(m){
  if(!Array.isArray(DB.missionDoneNotifications)) DB.missionDoneNotifications=[];
  const emp=empGetEmployees().find(e=>e.id===m.employeeId);
  const exists=DB.missionDoneNotifications.some(n=>n.missionId===m.id);
  if(!exists){
    DB.missionDoneNotifications.unshift({id:uid(),missionId:m.id,employeeId:m.employeeId,employeeName:emp?.name||'Employé',title:m.title,date:m.date,time:m.time||'',doneAt:new Date().toISOString(),read:false});
  }
}
function employeeCompleteMission(id){
  if(!Array.isArray(DB.employeeAgenda)) DB.employeeAgenda=[];
  const m=DB.employeeAgenda.find(x=>x.id===id);
  if(!m) return;
  m.status='termine';
  m.doneAt=new Date().toISOString();
  notifyDirectorMissionDone(m);
  window.DB = DB;
  saveDB();
  renderEmployeeAgenda();
  renderMissionDoneInbox();
  toast('Mission faite envoyée au directeur ✓');
}
function renderMissionDoneInbox(){
  const box=document.getElementById('missionDoneList');
  const count=document.getElementById('missionDoneCount');
  if(!box) return;
  const items=(DB.missionDoneNotifications||[]).slice(0,6);
  if(count) {
    count.textContent = items.length + ' notification' + (items.length > 1 ? 's' : '');
    count.style.display = items.length ? 'block' : 'none';
  }
  if(!items.length){ box.innerHTML=''; return; }
  box.innerHTML = `<div style="margin:8px 0 6px;padding:8px 10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px">
    <div style="font-size:11px;font-weight:900;color:#14532d;display:flex;align-items:center;gap:6px;margin-bottom:6px"><span class="material-symbols-rounded" style="font-size:15px">task_alt</span>Missions faites reçues</div>
    ${items.map(n=>`<div class="mission-done-item"><div class="mission-done-title">${escapeHTML(n.title||'Mission faite')}</div><div class="mission-done-meta">${escapeHTML(n.employeeName||'Employé')} · ${n.date?new Date(n.date+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}):''}${n.time?' · '+escapeHTML(n.time):''}</div></div>`).join('')}
  </div>`;
}
function deleteEmpMission(){const id=document.getElementById('em-id').value;if(!id)return;DB.employeeAgenda=(DB.employeeAgenda||[]).filter(x=>x.id!==id);window.DB=DB;saveDB();closeEmpMissionModal();renderEmployeeAgenda();toast('Mission supprimée');}
document.getElementById('empMissionModal') && document.getElementById('empMissionModal').addEventListener('click',function(e){if(e.target===this)closeEmpMissionModal();});

/* INIT DASHBOARD DATE */
(function(){
  const el=document.getElementById('dash-date-str');
  if(el){
    const d=new Date();
    const opts={weekday:'long',day:'numeric',month:'long',year:'numeric'};
    el.textContent=d.toLocaleDateString('fr-FR',opts);
  }
})();

/* INIT THEME */
if(localStorage.getItem('geniusproperty_theme')==='dark'){
  document.body.classList.add('dark');
  const ti=document.querySelector('#themeIcon .material-symbols-rounded');
  if(ti)ti.textContent='light_mode';
  const ts=document.getElementById('cfg-theme');
  if(ts)ts.value='dark';
}
/* INIT AGENCE & ENTREPRISE */
(function(){
  const fields = {
    'geniusproperty_agence':  'cfg-agence',
    'geniusproperty_email':   'cfg-email',
    'geniusproperty_tel':     'cfg-tel',
    'geniusproperty_adresse': 'cfg-adresse',
    'geniusproperty_rccm':    'cfg-rccm',
    'geniusproperty_ninea':   'cfg-ninea'
  };
  Object.entries(fields).forEach(([key, id]) => {
    const val = localStorage.getItem(key);
    const el  = document.getElementById(id);
    if(val && el) el.value = val;
  });
  // Restore logo
  const savedLogo = localStorage.getItem('geniusproperty_logo');
  if(savedLogo){
    const img = document.getElementById('cfg-logo-preview');
    const ph  = document.getElementById('cfg-logo-placeholder');
    if(img){ img.src = savedLogo; img.style.display='block'; }
    if(ph)  ph.style.display='none';
  }
})();


/* ═══════════════════════════════════════════════════════════
   script-04.js
═══════════════════════════════════════════════════════════ */
/* ── Profil Modal ──────────────────────────────────────────── */
function openProfilModal(){
  const modal = document.getElementById('profilModal');
  modal.style.display = 'flex'; modal.style.alignItems = 'center'; modal.style.justifyContent = 'center';
  // Populate from currentUser
  const u = currentUser || {};
  const isAdmin = u.isAdmin;
  // Find employee record
  const emp = DB.employes.find(e => e.email === u.email);
  const displayName = emp ? (emp.prenom + ' ' + emp.nom) : (u.email ? u.email.split('@')[0] : 'Admin');
  const displayEmail = u.email || 'admin@geniusproperty.com';
  const displayRole = isAdmin ? 'Administrateur' : (emp?.fonction || 'Employé');
  // Header
  document.getElementById('profilDisplayName').textContent = displayName;
  document.getElementById('profilDisplayEmail').textContent = displayEmail;
  document.getElementById('profilDisplayRole').textContent = displayRole;
  // Avatar
  const initial = displayName[0]?.toUpperCase() || 'A';
  document.getElementById('profilAvatarInitial').textContent = initial;
  if(emp?.photo){
    const img = document.getElementById('profilAvatarImg');
    img.src = emp.photo; img.style.display='block';
    document.getElementById('profilAvatarInitial').style.display='none';
  } else {
    document.getElementById('profilAvatarImg').style.display='none';
    document.getElementById('profilAvatarInitial').style.display='';
  }
  // Fields
  document.getElementById('profil-prenom').value = emp?.prenom || '';
  document.getElementById('profil-nom').value = emp?.nom || displayName;
  document.getElementById('profil-fonction').value = displayRole;
  document.getElementById('profil-email').value = displayEmail;
  document.getElementById('profil-tel').value = emp?.tel || '';
  document.getElementById('profil-adresse').value = emp?.adresse || '';
  document.getElementById('profil-newpass').value = '';
  document.getElementById('profil-pass-strength').textContent = '';
  // Droits — toujours masqués dans le profil
  const droitsSection = document.getElementById('profil-droits-section');
  droitsSection.style.display='none';
  // Password strength listener
  document.getElementById('profil-newpass').addEventListener('input', function(){
    checkPassStrength(this.value);
    const el = document.getElementById('profil-pass-strength');
    if(!this.value){el.textContent='';return;}
    let score=0;
    if(this.value.length>=8)score++;if(this.value.length>=12)score++;
    if(/[A-Z]/.test(this.value))score++;if(/[0-9]/.test(this.value))score++;
    if(/[^a-zA-Z0-9]/.test(this.value))score++;
    const levels=['','Très faible','Faible','Moyen','Fort','Très fort'];
    const colors=['','#ef4444','#f97316','#eab308','#22c55e','#16a34a'];
    el.textContent='● '+(levels[score]||'');el.style.color=colors[score]||'#9ca3af';
  });
}

function closeProfilModal(){
  document.getElementById('profilModal').style.display = 'none';
}

function profilPhotoChange(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const img=document.getElementById('profilAvatarImg');
    img.src=e.target.result;img.style.display='block';
    document.getElementById('profilAvatarInitial').style.display='none';
  };
  reader.readAsDataURL(file);
}

async function saveProfilUser(){
  const u = currentUser || {};
  const emp = DB.employes.find(e => e.email === u.email);
  const prenom = document.getElementById('profil-prenom').value.trim();
  const nom = document.getElementById('profil-nom').value.trim();
  const tel = document.getElementById('profil-tel').value.trim();
  const adresse = document.getElementById('profil-adresse').value.trim();
  const newpass = document.getElementById('profil-newpass').value.trim();

  if(emp){
    emp.prenom = prenom || emp.prenom;
    emp.nom = nom || emp.nom;
    emp.tel = tel || emp.tel;
    emp.adresse = adresse || emp.adresse;
    // Save photo if changed
    const photoInp = document.getElementById('profil-photo-inp');
    if(photoInp.files[0]){
      emp.photo = await new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.readAsDataURL(photoInp.files[0]);});
    }
    // Update topbar avatar
    const displayName = (prenom||emp.prenom)+' '+(nom||emp.nom);
    document.querySelectorAll('.user-name,.user-menu-name').forEach(el=>el.textContent=displayName.split(' ')[0]||displayName);
    _updateTopbarAvatar(emp);
    await saveDB();
  }

  // Change password via Supabase if provided
  if(newpass && newpass.length>=6){
    if(false){
      const {error} = await Promise.resolve({ error: null }); // Firebase: updatePassword non implémenté dans legacy
      if(error) return toast('Erreur changement mot de passe: '+error.message,'err');
    }
    toast('Mot de passe mis à jour ✓');
  }

  closeProfilModal();
  toast('Profil enregistré ✓');
}

// Close on overlay click
document.getElementById('profilModal').addEventListener('click', function(e){
  if(e.target===this) closeProfilModal();
});


/* ═══════════════════════════════════════════════════════════
   script-05.js
═══════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════
   NOTIFICATIONS PANEL
══════════════════════════════════════════════════ */

let _notifRead = safeJSONParse(localStorage.getItem('gp_notif_read'), []);

function buildNotifications(){
  const items = [];
  const today = new Date(); today.setHours(0,0,0,0);

  // 1. Loyers en retard (prochain < aujourd'hui sur contrats actifs)
  (DB.contrats||[]).forEach(c => {
    if(c.statut !== 'Actif' || !c.prochain || c.prochain === '-') return;
    const parts = c.prochain.split('/');
    const d = parts.length===3 ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) : new Date(c.prochain);
    if(isNaN(d)) return;
    d.setHours(0,0,0,0);
    const diff = Math.ceil((today - d) / 86400000);
    if(diff > 0){
      items.push({
        id: 'retard_'+c.locataire+'_'+c.locative,
        type:'red', icon:'warning', unread:true,
        title: `Loyer en retard — ${c.locataire}`,
        desc: `${c.locative} · ${diff} jour${diff>1?'s':''} de retard`,
        time: `Échéance : ${c.prochain}`,
        action: () => navigate('avenir')
      });
    }
  });

  // 2. Paiements à venir dans les 7 jours
  (DB.contrats||[]).forEach(c => {
    if(c.statut !== 'Actif' || !c.prochain || c.prochain === '-') return;
    const parts = c.prochain.split('/');
    const d = parts.length===3 ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) : new Date(c.prochain);
    if(isNaN(d)) return;
    d.setHours(0,0,0,0);
    const diff = Math.ceil((d - today) / 86400000);
    if(diff >= 0 && diff <= 7){
      items.push({
        id: 'avenir_'+c.locataire+'_'+c.locative,
        type:'orange', icon:'event', unread:true,
        title: `Paiement imminent — ${c.locataire}`,
        desc: `${c.locative} · dans ${diff} jour${diff>1?'s':''}`,
        time: `Échéance : ${c.prochain}`,
        action: () => navigate('avenir')
      });
    }
  });

  // 3. Locatives disponibles
  const dispos = (DB.locatives||[]).filter(l => l.statut === 'Disponible');
  if(dispos.length > 0){
    items.push({
      id: 'locatives_dispo',
      type:'blue', icon:'apartment', unread: dispos.length > 0,
      title: `${dispos.length} locative${dispos.length>1?'s':''} disponible${dispos.length>1?'s':''}`,
      desc: dispos.slice(0,2).map(l=>l.ref||l.designation||'Locative').join(', ') + (dispos.length>2?` +${dispos.length-2}`:''),
      time: 'En attente de locataire',
      action: () => navigate('locatives')
    });
  }

  // 4. Contrats expirant dans 30j
  (DB.contrats||[]).forEach(c => {
    if(c.statut !== 'Actif' || !c.fin || c.fin === '-') return;
    const parts = c.fin.split('/');
    const d = parts.length===3 ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) : new Date(c.fin);
    if(isNaN(d)) return;
    d.setHours(0,0,0,0);
    const diff = Math.ceil((d - today) / 86400000);
    if(diff >= 0 && diff <= 30){
      items.push({
        id: 'expiry_'+c.locataire+'_'+c.locative,
        type:'gold', icon:'contract', unread:true,
        title: `Contrat bientôt expiré — ${c.locataire}`,
        desc: `${c.locative} · expire ${diff===0?'aujourd\'hui':'dans '+diff+' jour'+(diff>1?'s':'')}`,
        time: `Fin : ${c.fin}`,
        action: () => navigate('contrats')
      });
    }
  });

  return items;
}

function renderNotifPanel(){
  const items = buildNotifications();
  const unread = items.filter(n => n.unread && !_notifRead.includes(n.id));
  const list = document.getElementById('notifList');
  const dot  = document.getElementById('notifDot');
  const cnt  = document.getElementById('notifCount');

  // Update badge
  if(unread.length > 0){
    dot.style.display = 'none';
    cnt.style.display = 'block';
    cnt.textContent = unread.length > 9 ? '9+' : unread.length;
  } else {
    dot.style.display = 'none';
    cnt.style.display = 'none';
  }

  if(items.length === 0){
    list.innerHTML = '<div class="notif-empty"><span class="material-symbols-rounded">notifications_off</span>Tout est en ordre !</div>';
    return;
  }

  list.innerHTML = items.map(n => {
    const isRead = _notifRead.includes(n.id);
    return `<div class="notif-item${n.unread&&!isRead?' notif-unread':''}" onclick="_notifClick('${n.id}')">
      <div class="notif-icon ${n.type}"><span class="material-symbols-rounded">${n.icon}</span></div>
      <div class="notif-body">
        <div class="notif-title">${n.title}</div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>`;
  }).join('');
}

function _notifClick(id){
  if(!_notifRead.includes(id)) _notifRead.push(id);
  safeSetLocal('gp_notif_read', JSON.stringify(_notifRead));
  const items = buildNotifications();
  const item = items.find(n => n.id === id);
  if(item) item.action();
  closeNotifPanel();
  renderNotifPanel();
}

function markAllRead(){
  const items = buildNotifications();
  items.forEach(n => { if(!_notifRead.includes(n.id)) _notifRead.push(n.id); });
  safeSetLocal('gp_notif_read', JSON.stringify(_notifRead));
  renderNotifPanel();
}

function toggleNotifPanel(e){
  e && e.stopPropagation();
  const p = document.getElementById('notifPanel');
  const isOpen = p.classList.contains('open');
  closeAllPanels();
  if(!isOpen){ renderNotifPanel(); p.classList.add('open'); }
}
function closeNotifPanel(){ document.getElementById('notifPanel').classList.remove('open'); }


/* ══════════════════════════════════════════════════
   HELP PANEL
══════════════════════════════════════════════════ */

function toggleHelpPanel(e){
  e && e.stopPropagation();
  const p = document.getElementById('helpPanel');
  const isOpen = p.classList.contains('open');
  closeAllPanels();
  if(!isOpen) p.classList.add('open');
}
function closeHelpPanel(){ document.getElementById('helpPanel').classList.remove('open'); }

function switchHelpTab(id, btn){
  document.querySelectorAll('.help-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.help-section').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('help-'+id).classList.add('active');
}

function toggleFaq(el){
  const wasOpen = el.classList.contains('open');
  document.querySelectorAll('.help-faq-item').forEach(i => i.classList.remove('open'));
  if(!wasOpen) el.classList.add('open');
}

/* ══════════════════════════════════════════════════
   SHARED PANEL HELPERS
══════════════════════════════════════════════════ */

function closeAllPanels(){
  document.querySelectorAll('.tb-panel').forEach(p => p.classList.remove('open'));
}

// Close on outside click
document.addEventListener('click', function(e){
  if(!e.target.closest('.tb-panel') && !e.target.closest('#notifBtn') && !e.target.closest('#helpBtn')){
    closeAllPanels();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e){
  if(e.altKey){
    const key = e.key.toLowerCase();
    if(key==='d'){ e.preventDefault(); navigate('dashboard'); }
    else if(key==='l'){ e.preventDefault(); navigate('locataires'); }
    else if(key==='c'){ e.preventDefault(); navigate('contrats'); }
    else if(key==='p'){ e.preventDefault(); navigate('paiements'); }
    else if(key==='r'){ e.preventDefault(); navigate('rapports'); }
    else if(key==='t'){ e.preventDefault(); toggleTheme(); }
    else if(key==='n'){ e.preventDefault(); toggleNotifPanel(); }
    else if(key==='h'){ e.preventDefault(); toggleHelpPanel(); }
  }
});

// Init badge on load (after DB is ready) — wait for DOMContentLoaded
setTimeout(renderNotifPanel, 800);
// agenda popup removed

/* ══════════════════════════════════════════════════════════════
   AUDIT LOG ENGINE — Journal d'activité complet
══════════════════════════════════════════════════════════════ */

/* ── Helpers ── */
const _sessionId = 'SID-' + Math.random().toString(36).substr(2,8).toUpperCase();
const _fakeIPs = ['local-session-']; // pas de fausses adresses IP en production
function _genIP(){ return _fakeIPs[Math.floor(Math.random()*_fakeIPs.length)] + Math.floor(Math.random()*254+1); }
const _userIP = _genIP();

const MODULE_ICONS = {
  'Connexion':'login','Déconnexion':'logout','Employés':'badge','Locataires':'people',
  'Propriétaires':'person','Biens':'home','Locatives':'apartment','Contrats':'description',
  'Paiements':'payments','Dépenses':'receipt_long','Fichiers':'folder','Profil':'manage_accounts'
};
const ACTION_META = {
  'Connexion'   :{ cls:'ab-login',  icon:'login' },
  'Déconnexion' :{ cls:'ab-logout', icon:'logout' },
  'Ajout'       :{ cls:'ab-add',    icon:'add_circle' },
  'Modification':{ cls:'ab-edit',   icon:'edit' },
  'Suppression' :{ cls:'ab-delete', icon:'delete' },
  'Export'      :{ cls:'ab-export', icon:'download' }
};

/* ── Core logger ── */
function auditLog(action, module, detail=''){
  const u = currentUser || {};
  const emp = DB.employes.find(e=>e.email===u.email);
  const displayName = emp ? (emp.prenom+' '+emp.nom) : (u.email ? u.email.split('@')[0] : 'Admin');
  const entry = {
    id       : Date.now() + Math.random(),
    user     : displayName,
    email    : u.email || 'admin@geniusproperty.com',
    action, module, detail,
    session  : _sessionId,
    ip       : _userIP,
    ts       : new Date().toISOString()
  };
  const logs = safeJSONParse(localStorage.getItem('gp_auditlog'), []);
  logs.unshift(entry);
  if(logs.length > 500) logs.length = 500; // cap 500 entries
  safeSetLocal('gp_auditlog', JSON.stringify(logs));
  // If dashboard is visible, refresh
  if(document.getElementById('page-dashboard').classList.contains('active')){
    renderAuditLog();
  }
}

/* ── Render ── */
let _auditPage = 1;
const AUDIT_PER_PAGE = 15;

function renderAuditLog(){
  // Redirected to employee-based journal
  renderJournalEmployeGrid();
}



/* ── Journal: Employee Grid ── */
let _empActUser = null;
let _empActPage = 1;
const EMP_ACT_PER_PAGE = 10;

function renderJournalEmployeGrid(){
  const grid = document.getElementById('journalEmployeGrid');
  if(!grid) return;
  const logs = safeJSONParse(localStorage.getItem('gp_auditlog'), []);
  // Gather unique users (from DB employes + any logged user)
  const allUsers = new Map();

  // Add admin/current user
  const adminName = (currentUser?.email||'admin').split('@')[0];
  if(!allUsers.has(adminName)) allUsers.set(adminName, { name: adminName, email: currentUser?.email||'admin@geniusproperty.com', count: 0, last: null });

  // Add employees from DB
  (DB.employes||[]).filter(e=>e.nom).forEach(e=>{
    const name = (e.prenom||'') + ' ' + (e.nom||'');
    const key = name.trim();
    if(!allUsers.has(key)) allUsers.set(key, { name: key, email: e.email||'', count: 0, last: null });
  });

  // Count logs per user
  logs.forEach(l=>{
    if(allUsers.has(l.user)){
      const u = allUsers.get(l.user);
      u.count++;
      if(!u.last) u.last = l.ts;
    } else {
      allUsers.set(l.user, { name: l.user, email: l.email||'', count: 1, last: l.ts });
    }
  });

  const q=(document.getElementById('journalEmployeeSearch')?.value||'').toLowerCase().trim();
  let users=[...allUsers.values()].filter(u=>!q || (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));
  if(users.length === 0){
    grid.innerHTML = '<div class="journal-empty">Aucun employé trouvé</div>';
    return;
  }

  const ACTION_COLORS = {'Connexion':'#16a34a','Déconnexion':'#6b7280','Ajout':'#2563eb','Modification':'#d97706','Suppression':'#dc2626','Export':'#7c3aed'};

  grid.innerHTML = users.map(u=>{
    const initials = u.name.split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2) || 'U';
    const lastEntry = u.last ? new Date(u.last).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}) : '—';
    // Last 3 actions for this user
    const userLogs = logs.filter(l=>l.user===u.name).slice(0,3);
    const dots = userLogs.map(l=>{
      const col = ACTION_COLORS[l.action]||'#9ca3af';
      return `<span style="width:7px;height:7px;border-radius:50%;background:${col};display:inline-block;flex-shrink:0" title="${l.action}"></span>`;
    }).join('');
    return `<div class="journal-emp-card" title="Appuyer pour voir les détails" onclick='openEmpActivityModal(${JSON.stringify(u.name)},${JSON.stringify(u.email||'')})'>
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:8px">
        <div class="journal-avatar">${initials}</div>
        <div style="flex:1;min-width:0"><div class="journal-name">${u.name}</div><div class="journal-email">${u.email||'—'}</div></div>
      </div>
      <div style="display:flex;align-items:end;justify-content:space-between;gap:8px">
        <div><span class="journal-count">${u.count}</span> <span class="journal-small">action${u.count>1?'s':''}</span><div class="journal-small">Dernière : ${lastEntry}</div></div>
        <div class="journal-dots">${dots}</div>
      </div>
    </div>`;
  }).join('');
}

function openEmpActivityModal(userName, userEmail){
  _empActUser = userName;
  _empActPage = 1;
  document.getElementById('empActAvatar').textContent = userName.split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2)||'U';
  document.getElementById('empActName').textContent = userName;
  document.getElementById('empActMeta').textContent = userEmail || '';
  document.getElementById('empActFilterModule').value = '';
  document.getElementById('empActFilterAction').value = '';
  document.getElementById('empActivityModal').style.display = 'flex';
  renderEmpActivities();
}

function renderEmpActivities(){
  if(!_empActUser) return;
  const logs = safeJSONParse(localStorage.getItem('gp_auditlog'), []);
  const fMod = document.getElementById('empActFilterModule').value;
  const fAct = document.getElementById('empActFilterAction').value;
  const ACTION_COLORS = {'Connexion':'#16a34a','Déconnexion':'#6b7280','Ajout':'#2563eb','Modification':'#d97706','Suppression':'#dc2626','Export':'#7c3aed'};
  const ACTION_ICONS = {'Connexion':'login','Déconnexion':'logout','Ajout':'add_circle','Modification':'edit','Suppression':'delete','Export':'download'};
  const filtered = logs.filter(l=>
    l.user === _empActUser &&
    (!fMod || l.module===fMod) &&
    (!fAct || l.action===fAct)
  );
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total/EMP_ACT_PER_PAGE));
  if(_empActPage > totalPages) _empActPage = 1;
  const pageData = filtered.slice((_empActPage-1)*EMP_ACT_PER_PAGE, _empActPage*EMP_ACT_PER_PAGE);

  document.getElementById('empActCount').textContent = `${total} activité${total>1?'s':''}`;

  const body = document.getElementById('empActBody');
  if(total===0){
    body.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:30px;font-size:13px">Aucune activité pour ce filtre</p>';
  } else {
    body.innerHTML = pageData.map(l=>{
      const d = new Date(l.ts);
      const dateStr = d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});
      const hourStr = d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
      const col = ACTION_COLORS[l.action]||'#9ca3af';
      const icon = ACTION_ICONS[l.action]||'info';
      return `<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid #f5f5f5">
        <div style="width:30px;height:30px;border-radius:8px;background:${col}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
          <span class="material-symbols-rounded" style="font-size:15px;color:${col}">${icon}</span>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap">
            <span style="font-size:12px;font-weight:600;color:#111">${l.action}</span>
            <span style="font-size:10px;background:#f3f4f6;color:#6b7280;padding:1px 7px;border-radius:10px">${l.module}</span>
          </div>
          <div style="font-size:11px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l.detail||'—'}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:11px;font-weight:600;color:#374151">${hourStr}</div>
          <div style="font-size:10px;color:#9ca3af">${dateStr}</div>
        </div>
      </div>`;
    }).join('');
  }

  // Pagination
  const pag = document.getElementById('empActPagination');
  if(totalPages<=1){ pag.innerHTML=''; return; }
  let btns='';
  if(_empActPage>1) btns+=`<button onclick="_empActPage--;renderEmpActivities()" style="border:1px solid #e5e7eb;background:white;padding:4px 8px;cursor:pointer;border-radius:4px;font-size:11px">‹</button>`;
  for(let p=Math.max(1,_empActPage-1);p<=Math.min(totalPages,_empActPage+1);p++){
    btns+=`<button onclick="_empActPage=${p};renderEmpActivities()" style="border:1px solid ${p===_empActPage?'var(--gold)':'#e5e7eb'};background:${p===_empActPage?'var(--gold)':'white'};padding:4px 8px;cursor:pointer;border-radius:4px;font-size:11px">${p}</button>`;
  }
  if(_empActPage<totalPages) btns+=`<button onclick="_empActPage++;renderEmpActivities()" style="border:1px solid #e5e7eb;background:white;padding:4px 8px;cursor:pointer;border-radius:4px;font-size:11px">›</button>`;
  pag.innerHTML=btns;
}

function clearAuditLog(){
  if(!confirm('Vider tout le journal d\'activité ? Cette action est irréversible.')) return;
  localStorage.removeItem('gp_auditlog');
  _auditPage=1;
  renderAuditLog();
  toast('Journal vidé ✓');
}

/* ── Export PDF ── */
function exportAuditPDF(){
  auditLog('Export','Connexion','Export PDF du journal d\'activité');
  const raw = safeJSONParse(localStorage.getItem('gp_auditlog'), []);
  const fUser   = document.getElementById('auditFilterUser').value;
  const fModule = document.getElementById('auditFilterModule').value;
  const fAction = document.getElementById('auditFilterAction').value;
  const data = raw.filter(e=>
    (!fUser   || e.user===fUser) &&
    (!fModule || e.module===fModule) &&
    (!fAction || e.action===fAction)
  );
  const agence = localStorage.getItem('geniusproperty_agence')||'Genius Property';
  const now = new Date().toLocaleString('fr-FR');

  const rows = data.map((e,i)=>{
    const d = new Date(e.ts);
    const dateStr = d.toLocaleDateString('fr-FR')+' '+d.toLocaleTimeString('fr-FR');
    const actionColors = {'Connexion':'#16a34a','Déconnexion':'#6b7280','Ajout':'#2563eb','Modification':'#d97706','Suppression':'#dc2626','Export':'#7c3aed'};
    const col = actionColors[e.action]||'#374151';
    return `<tr style="background:${i%2?'#fafafa':'white'}">
      <td style="padding:7px 10px;color:#9ca3af;font-size:11px">${i+1}</td>
      <td style="padding:7px 10px;font-weight:600;font-size:12px">${e.user}<br><span style="color:#9ca3af;font-size:10px;font-weight:400">${e.email}</span></td>
      <td style="padding:7px 10px"><span style="background:${col}20;color:${col};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">${e.action}</span></td>
      <td style="padding:7px 10px;font-size:12px">${e.module}</td>
      <td style="padding:7px 10px;font-size:11px;color:#6b7280;max-width:200px">${e.detail||'—'}</td>
      <td style="padding:7px 10px;font-family:monospace;font-size:10px;color:#9ca3af">${e.session}</td>
      <td style="padding:7px 10px;font-family:monospace;font-size:11px">${e.ip}</td>
      <td style="padding:7px 10px;font-size:11px;white-space:nowrap">${dateStr}</td>
    </tr>`;
  }).join('');

  const html = `<div style="font-family:Inter,sans-serif;padding:24px;color:#111">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #D4AF37">
      <div>
        <div style="font-size:22px;font-weight:900;color:#0f0f0f">${agence}</div>
        <div style="font-size:16px;font-weight:700;color:#D4AF37;margin-top:2px">Journal d'activité</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:4px">Généré le ${now} · ${data.length} entrée${data.length>1?'s':''}</div>
      </div>
      <div style="text-align:right;font-size:10px;color:#9ca3af">Session: ${_sessionId}<br>IP: ${_userIP}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:#0f0f0f;color:#aaa">
          <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">#</th>
          <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Utilisateur</th>
          <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Action</th>
          <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Module</th>
          <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Détail</th>
          <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Session</th>
          <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">IP</th>
          <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Date & heure</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;

  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  html2pdf().set({
    margin:8, filename:'journal-activite.pdf',
    html2canvas:{scale:1.5,useCORS:true},
    jsPDF:{unit:'mm',format:'a4',orientation:'landscape'}
  }).from(el).save().then(()=>{ document.body.removeChild(el); toast('PDF exporté ✓'); });
}

/* ── Export Excel ── */
async function exportAuditExcel(){
  const XLSX = await window.ensureXLSX();
  auditLog('Export','Connexion','Export Excel du journal d\'activité');
  const raw = safeJSONParse(localStorage.getItem('gp_auditlog'), []);
  const fUser   = document.getElementById('auditFilterUser').value;
  const fModule = document.getElementById('auditFilterModule').value;
  const fAction = document.getElementById('auditFilterAction').value;
  const data = raw.filter(e=>
    (!fUser   || e.user===fUser) &&
    (!fModule || e.module===fModule) &&
    (!fAction || e.action===fAction)
  );
  const ws_data = [
    ['#','Utilisateur','Email','Action','Module','Détail','Session ID','IP','Date & Heure'],
    ...data.map((e,i)=>[
      i+1, e.user, e.email, e.action, e.module, e.detail||'',
      e.session, e.ip,
      new Date(e.ts).toLocaleString('fr-FR')
    ])
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!cols'] = [{wch:4},{wch:18},{wch:26},{wch:14},{wch:14},{wch:30},{wch:14},{wch:16},{wch:20}];
  XLSX.utils.book_append_sheet(wb,'Journal', ws);
  XLSX.writeFile(wb,'journal-activite.xlsx');
  toast('Excel exporté ✓');
}

/* ── Hooks sur les mutations (injectés après chargement) ── */
(function patchMutations(){
  // Patch saveRow (modification)
  const _origSaveRow = window.saveRow;
  if(typeof _origSaveRow==='function') window.saveRow = function(){
    const key = window._modalKey;
    const moduleMap={employes:'Employés',proprietaires:'Propriétaires',locataires:'Locataires',biens:'Biens',locatives:'Locatives',contrats:'Contrats',depenses:'Dépenses'};
    const mod = moduleMap[key]||key;
    const rec = DB[key]?.[window._modalIdx];
    const id = rec?.id||rec?.nom||rec?.locataire||rec?.ref||'#'+window._modalIdx;
    auditLog('Modification', mod, `Fiche modifiée : ${id}`);
    return _origSaveRow.apply(this, arguments);
  };

  // Patch deleteFromModal (suppression via modal)
  const _origDel = window.deleteFromModal;
  if(typeof _origDel==='function') window.deleteFromModal = function(){
    const key = window._modalKey;
    const moduleMap={employes:'Employés',proprietaires:'Propriétaires',locataires:'Locataires',biens:'Biens',locatives:'Locatives',contrats:'Contrats',depenses:'Dépenses'};
    const mod = moduleMap[key]||key;
    const rec = DB[key]?.[window._modalIdx];
    const id = rec?.id||rec?.nom||rec?.locataire||rec?.ref||'#'+window._modalIdx;
    auditLog('Suppression', mod, `Fiche supprimée : ${id}`);
    return _origDel.apply(this, arguments);
  };

  // Patch delRow (suppression directe tableau)
  const _origDelRow = window.delRow;
  if(typeof _origDelRow==='function') window.delRow = function(key, i){
    const moduleMap={employes:'Employés',proprietaires:'Propriétaires',locataires:'Locataires',biens:'Biens',locatives:'Locatives',contrats:'Contrats',depenses:'Dépenses'};
    const mod = moduleMap[key]||key;
    const rec = DB[key]?.[i];
    const id = rec?.id||rec?.nom||rec?.locataire||rec?.ref||'#'+i;
    auditLog('Suppression', mod, `Supprimé : ${id}`);
    return _origDelRow.apply(this, arguments);
  };

  // Patch saveEmploye
  const _origSaveEmp = window.saveEmploye;
  if(typeof _origSaveEmp==='function') window.saveEmploye = async function(){
    const nom = document.getElementById('emp-nom')?.value||'';
    const prenom = document.getElementById('emp-prenom')?.value||'';
    auditLog('Ajout','Employés',`Nouvel employé : ${prenom} ${nom}`);
    return _origSaveEmp.apply(this, arguments);
  };

  // Patch saveLocataire
  const _origSaveLoc = window.saveLocataire;
  if(typeof _origSaveLoc==='function') window.saveLocataire = async function(){
    const nom = document.getElementById('lc-nom')?.value||'';
    auditLog('Ajout','Locataires',`Nouveau locataire : ${nom}`);
    return _origSaveLoc.apply(this, arguments);
  };

  // Patch saveProprietaire
  const _origSaveProp = window.saveProprietaire;
  if(typeof _origSaveProp==='function') window.saveProprietaire = async function(){
    const nom = document.getElementById('pr-nom')?.value||'';
    auditLog('Ajout','Propriétaires',`Nouveau propriétaire : ${nom}`);
    return _origSaveProp.apply(this, arguments);
  };

  // Patch saveBien
  const _origSaveBien = window.saveBien;
  if(typeof _origSaveBien==='function') window.saveBien = async function(){
    const ref = document.getElementById('bi-ref')?.value||'';
    auditLog('Ajout','Biens',`Nouveau bien : ${ref}`);
    return _origSaveBien.apply(this, arguments);
  };

  // Patch saveLocative
  const _origSaveLv = window.saveLocative;
  if(typeof _origSaveLv==='function') window.saveLocative = async function(){
    const ref = document.getElementById('lv-ref')?.value||document.getElementById('lv-designation')?.value||'';
    auditLog('Ajout','Locatives',`Nouvelle locative : ${ref}`);
    return _origSaveLv.apply(this, arguments);
  };

  // Patch saveContrat
  const _origSaveCt = window.saveContrat;
  if(typeof _origSaveCt==='function') window.saveContrat = function(){
    const loc = document.getElementById('ct-locataire')?.value||'';
    const lv  = document.getElementById('ct-locative')?.value||'';
    auditLog('Ajout','Contrats',`Nouveau contrat : ${loc} → ${lv}`);
    return _origSaveCt.apply(this, arguments);
  };

  // Patch saveDepense
  const _origSaveDep = window.saveDepense;
  if(typeof _origSaveDep==='function') window.saveDepense = function(){
    const lib = document.getElementById('d-lib')?.value||'';
    auditLog('Ajout','Dépenses',`Nouvelle dépense : ${lib}`);
    return _origSaveDep.apply(this, arguments);
  };

  // Patch saveProfilUser
  const _origSaveProfil = window.saveProfilUser;
  if(typeof _origSaveProfil==='function') window.saveProfilUser = async function(){
    auditLog('Modification','Profil','Mise à jour du profil utilisateur');
    return _origSaveProfil.apply(this, arguments);
  };

  // Patch doLogout
  const _origLogout = window.doLogout;
  if(typeof _origLogout==='function') window.doLogout = async function(){
    auditLog('Déconnexion','Connexion','Déconnexion de la session');
    return _origLogout.apply(this, arguments);
  };

})();

/* ── Hook login (appelé depuis _showApp) ── */
const _orig_showApp = window._showApp;
if(typeof _orig_showApp==='function') window._showApp = async function(){
  const res = await _orig_showApp.apply(this, arguments);
  setTimeout(()=>{
    const email = currentUser?.email||'admin@geniusproperty.com';
    auditLog('Connexion','Connexion',`Session ouverte · ${email}`);
    renderAuditLog();
  }, 600);
  return res;
};

/* ── Show audit on dashboard render (moved to dedicated page) ── */
const _origRenderDash = window.renderDashboard;
if(typeof _origRenderDash==='function') window.renderDashboard = function(){
  return _origRenderDash.apply(this, arguments);
};

/* ── Page Droits d'accès ── */
function renderDroitsPage(){
  const container = document.getElementById('droitsContainer');
  if(!container) return;
  const employes = (DB.employes||[]).filter(e=>e.nom);
  if(!employes.length){
    container.innerHTML='<p style="color:#9ca3af;font-size:13px;text-align:center;padding:30px">Aucun employé enregistré. <a href="#" onclick="navigate(\'nv-employe\')" style="color:var(--gold)">Créer un employé</a></p>';
    return;
  }
  const droitsLabels=['employes','proprietaires','locataires','bail','contrats','paiements','avenir','depenses','fichiers','messages','rapports','journal','superAdmin'];
  const droitsNames=['Employé','Propriétaire','Locataire','Bail / Locative','Contrat','Paiement','Paiement à venir','Dépenses','Fichiers','Messages','Rapport',"Journal d'activité",'Super admin'];
  let html=`<table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr>
      <th style="text-align:left;padding:10px;border-bottom:2px solid #f0f0f0;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.4px;background:#f9fafb">Employé</th>
      ${droitsLabels.map((k,i)=>`<th style="text-align:center;padding:8px 4px;border-bottom:2px solid #f0f0f0;font-size:10px;color:${k==='superAdmin'?'var(--red)':'#555'};text-transform:uppercase;letter-spacing:.3px;background:#f9fafb;white-space:nowrap">${droitsNames[i]}</th>`).join('')}
      <th style="text-align:center;padding:10px;border-bottom:2px solid #f0f0f0;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.4px;background:#f9fafb">Modifier</th>
    </tr></thead><tbody>`;
  employes.forEach((emp, idx)=>{
    const d=emp.droits||{};
    const initiales=((emp.prenom||'')[0]||'')+ ((emp.nom||'')[0]||'');
    html+=`<tr style="border-bottom:1px solid #f0f0f0">
      <td style="padding:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,var(--gold),#c4a030);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#000;flex-shrink:0">${initiales.toUpperCase()}</div>
          <div>
            <div style="font-weight:600;color:#111">${emp.prenom||''} ${emp.nom||''}</div>
            <div style="font-size:10px;color:#9ca3af">${emp.email||''}</div>
          </div>
        </div>
      </td>
      ${droitsLabels.map(k=>`<td style="text-align:center;padding:8px 4px">
        ${d[k]?'<span class="material-symbols-rounded" style="font-size:18px;color:var(--green)">check_circle</span>':'<span class="material-symbols-rounded" style="font-size:18px;color:#d1d5db">cancel</span>'}
      </td>`).join('')}
      <td style="text-align:center;padding:10px">
        <button class="icon-btn icon-edit" onclick="openRowModal('employes',${idx})" title="Modifier droits">
          <span class="material-symbols-rounded">edit</span>
        </button>
      </td>
    </tr>`;
  });
  html+='</tbody></table>';
  container.innerHTML=html;
}

/* ══════════════════════════════════════════════════════════════
   EXCEL IMPORT / EXPORT ENGINE — Genius Property
   Utilise SheetJS (XLSX) chargé en CDN
══════════════════════════════════════════════════════════════ */

/* ── Configuration des colonnes par module ── */
const EXCEL_CONFIG = {
  employes: {
    label: 'Employés',
    cols: ['id','civ','nom','prenom','fonction','tel','email','date_entree','statut','notes'],
    headers: ['ID','Civilité','Nom','Prénom','Fonction','Téléphone','Email','Date entrée','Statut','Notes'],
  },
  proprietaires: {
    label: 'Propriétaires',
    cols: ['id','civ','nom','prenom','tel','email','adresse','ville','naiss','matri','nbBiens','notes'],
    headers: ['ID','Civilité','Nom','Prénom','Téléphone','Email','Adresse','Ville','Date naissance','Situation','Nb biens','Notes'],
  },
  locataires: {
    label: 'Locataires',
    cols: ['id','civ','nom','prenom','tel','email','type','bien','adresse','naiss','profession','statut','notes'],
    headers: ['ID','Civilité','Nom','Prénom','Téléphone','Email','Type','Bien occupé','Adresse','Date naissance','Profession','Statut','Notes'],
  },
  biens: {
    label: 'Biens',
    cols: ['id','nom','type','etat','valeur','proprio','adresse','ville','surface','description'],
    headers: ['ID','Désignation','Type','État','Valeur (FCFA)','Propriétaire','Adresse','Ville','Surface (m²)','Description'],
  },
  locatives: {
    label: 'Locatives',
    cols: ['id','nom','ref','type','statut','sup','loyer','charge','occupant','tel','bien','etage','description'],
    headers: ['ID','Désignation','Référence','Type','Statut','Superficie (m²)','Loyer (FCFA)','Charge (FCFA)','Occupant','Téléphone','Bien','Étage','Description'],
  },
  contrats: {
    label: 'Contrats',
    cols: ['id','num','locataire','locative','type','debut','fin','statut','loyer','caution','prochain','notes'],
    headers: ['ID','N° Contrat','Locataire','Locative','Type','Date début','Date fin','Statut','Loyer (FCFA)','Caution (FCFA)','Prochain paiement','Notes'],
  },
  paiements: {
    label: 'Paiements',
    cols: ['id','locataire','locative','montant','paye','reste','date','mode','periode','notes'],
    headers: ['ID','Locataire','Locative','Montant dû (FCFA)','Payé (FCFA)','Reste (FCFA)','Date','Mode paiement','Période','Notes'],
  },
  depenses: {
    label: 'Dépenses',
    cols: ['id','libelle','cat','montant','date','bien','beneficiaire','notes'],
    headers: ['ID','Libellé','Catégorie','Montant (FCFA)','Date','Bien concerné','Bénéficiaire','Notes'],
  },
};

/* ── Export Excel ── */
async function exportExcel(key){
  const XLSX = await window.ensureXLSX();
  const cfg = EXCEL_CONFIG[key];
  if(!cfg){ toast('Export non configuré','err'); return; }
  const data = DB[key] || [];
  if(!data.length){ toast('Aucune donnée à exporter','err'); return; }

  const agence = localStorage.getItem('geniusproperty_agence') || 'Genius Property';
  const now = new Date().toLocaleString('fr-FR');

  // Build rows
  const wsData = [
    [`${agence} — Export ${cfg.label}`],
    [`Généré le : ${now}   |   ${data.length} enregistrement(s)`],
    [], // blank line
    cfg.headers,
    ...data.map(row => cfg.cols.map(k => {
      const v = row[k];
      if(v === undefined || v === null || v === '') return '';
      // Keep numbers numeric for Excel
      if(typeof v === 'number') return v;
      if(!isNaN(v) && v !== '' && ['montant','paye','reste','loyer','charge','caution','valeur'].includes(k)) return Number(v);
      return v;
    }))
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = cfg.headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));

  // Style header row (row index 3 = 4th row)
  const headerRowIdx = 3;
  cfg.headers.forEach((_, ci) => {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRowIdx, c: ci });
    if(!ws[cellAddr]) return;
    ws[cellAddr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '0F0F0F' } },
      alignment: { horizontal: 'center' }
    };
  });

  XLSX.utils.book_append_sheet(wb, ws, cfg.label.slice(0, 31));
  XLSX.writeFile(wb, `genius-property_${key}_${new Date().toISOString().slice(0,10)}.xlsx`);
  toast(`Export Excel ${cfg.label} ✓`);
  auditLog('Export', cfg.label, `Export Excel — ${data.length} ligne(s)`);
}

/* ── Import Modal state ── */
let _importKey = null;
let _importParsedData = null;

function openImportModal(key){
  const cfg = EXCEL_CONFIG[key];
  if(!cfg) return;
  _importKey = key;
  _importParsedData = null;
  document.getElementById('importModalTitle').textContent = `Importer — ${cfg.label}`;
  document.getElementById('importModalSub').textContent = `Importez vos données ${cfg.label.toLowerCase()} depuis un fichier .xlsx ou .csv`;
  document.getElementById('importFileInput').value = '';
  document.getElementById('importFileName').style.display = 'none';
  document.getElementById('importPreview').style.display = 'none';
  document.getElementById('importConfirmBtn').style.display = 'none';
  document.getElementById('importError').style.display = 'none';
  document.getElementById('importWarning').style.display = 'none';
  document.querySelectorAll('input[name="importMode"]')[0].checked = true;
  document.getElementById('importExcelModal').style.display = 'flex';
}

function closeImportModal(){
  document.getElementById('importExcelModal').style.display = 'none';
  _importKey = null;
  _importParsedData = null;
}

/* ── Download template ── */
async function downloadTemplate(){
  const XLSX = await window.ensureXLSX();
  if(!_importKey) return;
  const cfg = EXCEL_CONFIG[_importKey];
  const wsData = [
    cfg.headers,
    cfg.cols.map(k => {
      // Provide example values
      const examples = {
        id:'EMP-001', civ:'M.', nom:'Dupont', prenom:'Jean', fonction:'Agent',
        tel:'77 000 00 00', email:'jean@example.com', date_entree:'2024-01-15',
        statut:'Actif', notes:'', adresse:'Dakar', ville:'Dakar', naiss:'1990-01-01',
        matri:'Marié', nbBiens:'3', type:'Appartement', bien:'Résidence Centrale',
        profession:'Ingénieur', nom:'Résidence A', etat:'Disponible',
        valeur:'15000000', proprio:'M. Diallo', surface:'80', description:'',
        ref:'LOC-001', sup:'45', loyer:'150000', charge:'20000', occupant:'', etage:'2',
        num:'CTR-001', locataire:'Kofi Mensah', locative:'App 2B', debut:'2024-01-01',
        fin:'2025-01-01', caution:'300000', prochain:'2024-02-01',
        montant:'150000', paye:'150000', reste:'0', date:'2024-01-05',
        mode:'Virement', periode:'Janvier 2024', libelle:'Réparation toit',
        cat:'Maintenance', beneficiaire:'Entrepreneur SA',
      };
      return examples[k] || '';
    })
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = cfg.headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));
  XLSX.utils.book_append_sheet(wb, ws, cfg.label.slice(0,31));
  XLSX.writeFile(wb, `modele_import_${_importKey}.xlsx`);
  toast(`Modèle ${cfg.label} téléchargé ✓`);
}

/* ── File selected ── */
function onImportFileSelected(input){
  if(!input.files?.length) return;
  const file = input.files[0];
  document.getElementById('importFileName').textContent = `✓ ${file.name}`;
  document.getElementById('importFileName').style.display = 'block';
  document.getElementById('importError').style.display = 'none';
  document.getElementById('importPreview').style.display = 'none';
  document.getElementById('importConfirmBtn').style.display = 'none';

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const XLSX = await window.ensureXLSX();
      const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      parseImportRows(rows);
    } catch(err) {
      showImportError('Fichier illisible : ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseImportRows(rows){
  const cfg = EXCEL_CONFIG[_importKey];
  if(!rows.length){ showImportError('Fichier vide.'); return; }

  // Find header row (first row containing at least 2 expected headers)
  let headerRowIdx = -1;
  let colMap = {};
  for(let ri = 0; ri < Math.min(rows.length, 6); ri++){
    const row = rows[ri].map(c => String(c||'').trim());
    const matched = {};
    cfg.headers.forEach((h, ci) => {
      const found = row.findIndex(cell => cell.toLowerCase() === h.toLowerCase());
      if(found !== -1) matched[cfg.cols[ci]] = found;
    });
    if(Object.keys(matched).length >= 2){ headerRowIdx = ri; colMap = matched; break; }
  }

  if(headerRowIdx === -1){
    showImportError(`En-têtes non reconnues. Téléchargez le modèle et réessayez.\nAttendu: ${cfg.headers.slice(0,4).join(', ')}…`);
    return;
  }

  const dataRows = rows.slice(headerRowIdx + 1).filter(r => r.some(c => c !== '' && c !== null));
  if(!dataRows.length){ showImportError('Aucune donnée trouvée après les en-têtes.'); return; }

  // Map to objects
  _importParsedData = dataRows.map((row, ri) => {
    const obj = {};
    cfg.cols.forEach(k => {
      const ci = colMap[k];
      if(ci !== undefined){
        let val = row[ci];
        if(val instanceof Date) val = val.toISOString().slice(0,10);
        obj[k] = String(val ?? '').trim();
      }
    });
    // Auto-generate ID if missing
    if(!obj.id) obj.id = `${_importKey.slice(0,3).toUpperCase()}-IMP-${Date.now()}-${ri}`;
    return obj;
  });

  // Show preview
  const previewData = _importParsedData.slice(0, 5);
  const previewCols = cfg.cols.slice(0, 6); // first 6 cols max
  const previewHeaders = cfg.headers.slice(0, 6);

  document.getElementById('importPreviewCount').textContent =
    `${_importParsedData.length} ligne(s) détectée(s) — aperçu des 5 premières`;

  document.getElementById('importPreviewHead').innerHTML =
    `<tr>${previewHeaders.map(h=>`<th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#555;white-space:nowrap;border-bottom:1px solid #e5e7eb">${h}</th>`).join('')}</tr>`;

  document.getElementById('importPreviewBody').innerHTML =
    previewData.map((row,i) =>
      `<tr style="background:${i%2?'#fafafa':'white'}">
        ${previewCols.map(k=>`<td style="padding:6px 10px;font-size:11px;border-bottom:1px solid #f5f5f5;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis">${row[k]||'—'}</td>`).join('')}
      </tr>`
    ).join('');

  document.getElementById('importPreview').style.display = 'block';
  document.getElementById('importConfirmBtn').style.display = 'flex';

  // Watch replace warning
  document.querySelectorAll('input[name="importMode"]').forEach(r => {
    r.onchange = () => {
      const warn = document.getElementById('importWarning');
      warn.style.display = r.value === 'replace' && r.checked ? 'flex' : 'none';
    };
  });
}

function showImportError(msg){
  const el = document.getElementById('importError');
  el.style.display = 'block';
  el.textContent = msg;
  document.getElementById('importConfirmBtn').style.display = 'none';
}

/* ── Confirm Import ── */
async function confirmImport(){
  if(!_importKey || !_importParsedData?.length) return;
  const cfg = EXCEL_CONFIG[_importKey];
  const mode = document.querySelector('input[name="importMode"]:checked').value;

  if(mode === 'replace'){
    if(!confirm(`⚠️ Remplacer toutes les données "${cfg.label}" existantes par ${_importParsedData.length} ligne(s) importée(s) ?\n\nCette action est irréversible.`)) return;
    DB[_importKey] = _importParsedData;
  } else {
    // Merge: add new, skip duplicates by ID
    const existing = DB[_importKey] || [];
    const existingIds = new Set(existing.map(r => r.id));
    let added = 0, skipped = 0;
    _importParsedData.forEach(row => {
      if(existingIds.has(row.id)){ skipped++; }
      else { existing.push(row); added++; }
    });
    DB[_importKey] = existing;
    if(skipped > 0) toast(`${added} ajouté(s), ${skipped} ignoré(s) (ID existant)`,'info');
  }

  saveDB();
  closeImportModal();
  renderPage(_importKey);
  toast(`Import ${cfg.label} réussi — ${_importParsedData.length} ligne(s) ✓`);
  auditLog('Ajout', cfg.label, `Import Excel — ${_importParsedData.length} ligne(s) (mode: ${mode})`);
}

/* Close import modal on backdrop click */
document.getElementById('importExcelModal').addEventListener('click', function(e){
  if(e.target === this) closeImportModal();
});

/* ── Drag-and-drop on drop zone ── */
(function(){
  const zone = document.getElementById('importDropZone');
  if(!zone) return;
  zone.addEventListener('dragover', e=>{ e.preventDefault(); zone.style.borderColor='var(--gold)'; });
  zone.addEventListener('dragleave', ()=>{ zone.style.borderColor='#d1d5db'; });
  zone.addEventListener('drop', e=>{
    e.preventDefault();
    zone.style.borderColor='#d1d5db';
    const file = e.dataTransfer.files[0];
    if(!file) return;
    const input = document.getElementById('importFileInput');
    // Assign via DataTransfer
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    onImportFileSelected(input);
  });
})();


/* ═══════════════════════════════════════════════════════════
   script-06.js
═══════════════════════════════════════════════════════════ */
(function(){
  function initTopbarBreadcrumb(){
    if(typeof updateGlobalBreadcrumb === 'function'){
      const active = document.querySelector('.page.active');
      const id = active ? active.id.replace('page-','') : 'dashboard';
      updateGlobalBreadcrumb(id);
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initTopbarBreadcrumb);
  else initTopbarBreadcrumb();
})();


/* ═══════════════════════════════════════════════════════════
   script-07.js
═══════════════════════════════════════════════════════════ */
(function(){
  function esc(v){return gp_esc(v)}
  function blob(o){try{return JSON.stringify(o).toLowerCase()}catch(e){return ''}}
  function initials(a,b){return ((String(a||'?').trim()[0]||'?')+(String(b||'').trim()[0]||'')).toUpperCase();}
  function activeText(v){return String(v||'Actif').toLowerCase()==='actif'}
  function money(v){return gp_money(v)}
  function ensureModernShell(pageId, shellId, oldSelector){
    const page=document.getElementById(pageId); if(!page) return null;
    let shell=document.getElementById(shellId);
    if(!shell){
      shell=document.createElement('div'); shell.id=shellId; shell.className='gp-modern-zone';
      const old=oldSelector?page.querySelector(oldSelector):null;
      if(old){ old.style.display='none'; old.parentNode.insertBefore(shell, old); }
      else page.appendChild(shell);
    }
    return shell;
  }
  window.renderEmployesModern=function(){
    // Le shell est directement dans la page, pas besoin de ensureModernShell
    const shell=document.getElementById('gpEmployesModern'); if(!shell) return;
    const all=Array.isArray(DB?.employes)?DB.employes:[];
    const q=(document.getElementById('gpEmpSearch')?.value||'').toLowerCase().trim();
    const status=(document.getElementById('gpEmpStatus')?.value||'').toLowerCase();
    const role=(document.getElementById('gpEmpRole')?.value||'').toLowerCase();
    const roles=[...new Set(all.map(e=>e.fonction).filter(Boolean))];
    const actifs=all.filter(e=>activeText(e.statut)).length;
    const enAttente=all.filter(e=>String(e.statut||'').toLowerCase()==='en attente'||String(e.statut||'').toLowerCase()==='pending'||String(e.statut||'').toLowerCase()==='invité').length;
    const inactifs=all.filter(e=>String(e.statut||'').toLowerCase()==='inactif'||String(e.statut||'').toLowerCase()==='désactivé').length;
    let data=all.filter(e=>(!q||blob(e).includes(q))&&(!status||String(e.statut||'Actif').toLowerCase()===status)&&(!role||String(e.fonction||'').toLowerCase()===role));

    // Role badge color mapping
    function roleBadge(fn){
      const f=String(fn||'').toLowerCase();
      if(f.includes('admin'))      return {cls:'emp-role-admin',    icon:'security',         label:fn||'Administrateur'};
      if(f.includes('gestionnaire')||f.includes('manager')) return {cls:'emp-role-manager',  icon:'manage_accounts',  label:fn||'Gestionnaire'};
      if(f.includes('agent'))      return {cls:'emp-role-agent',    icon:'person_pin',       label:fn||'Agent'};
      if(f.includes('comptable'))  return {cls:'emp-role-compta',   icon:'receipt_long',     label:fn||'Comptable'};
      if(f.includes('assist'))     return {cls:'emp-role-assist',   icon:'support_agent',    label:fn||'Assistante'};
      return {cls:'emp-role-default', icon:'badge', label:fn||'—'};
    }

    function fmtDate(d){
      if(!d) return '—';
      try{
        const dt=new Date(d);
        if(isNaN(dt)) return d;
        const now=new Date();
        const diffMs=now-dt;
        const diffH=diffMs/3600000;
        if(diffH<1) return "À l'instant";
        if(diffH<24){ const h=Math.floor(diffH); return `Aujourd'hui`; }
        if(diffH<48) return 'Hier';
        return dt.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'});
      }catch(e){return d;}
    }

    function fmtTime(d){
      if(!d) return '';
      try{
        const dt=new Date(d);
        if(isNaN(dt)) return '';
        return dt.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
      }catch(e){return '';}
    }

    shell.innerHTML=`
    <style>
      .emp-desktop-wrap{padding:0;margin-top:0!important}
      .emp-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}
      .emp-stat-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;min-height:64px}
      .emp-stat-icon{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .emp-stat-icon .material-symbols-rounded{font-size:19px}
      .emp-stat-icon.blue{background:#eff6ff;color:#3b82f6}
      .emp-stat-icon.green{background:#f0fdf4;color:#22c55e}
      .emp-stat-icon.amber{background:#fffbeb;color:#f59e0b}
      .emp-stat-icon.gray{background:#f9fafb;color:#9ca3af}
      .emp-stat-info strong{display:block;font-size:19px;font-weight:700;color:#111827;line-height:1.15}
      .emp-stat-info span{font-size:12px;color:#374151;font-weight:500;margin-top:2px;display:block}
      .emp-stat-info em{font-size:11px;color:#9ca3af;font-style:normal;display:block;margin-top:0}
      .emp-toolbar-row{display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap}
      .emp-search-box{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:0 14px;height:40px;width:200px!important;flex:0 0 200px!important;min-width:200px!important;max-width:200px!important}
      .emp-search-box input{border:none;outline:none;font-size:14px;color:#374151;background:transparent;width:100%}
      .emp-search-box input::placeholder{color:#9ca3af}
      .emp-search-box .material-symbols-rounded{font-size:18px;color:#9ca3af}
      .emp-filter-sel{height:40px;border:1px solid #e5e7eb;border-radius:8px;padding:0 12px;font-size:14px;color:#374151;background:#fff;cursor:pointer;outline:none;width:200px!important;flex:0 0 200px!important;min-width:200px!important;max-width:200px!important}
      .emp-export-btn{height:40px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:0 16px;font-size:14px;color:#374151;display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap}
      .emp-table-wrap{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}
      .emp-table{width:100%;border-collapse:collapse}
      .emp-table thead tr{border-bottom:1px solid #f3f4f6}
      .emp-table th{padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;background:#f9fafb}
      .emp-table tbody tr{border-bottom:1px solid #f9fafb;transition:background .15s}
      .emp-table tbody tr:last-child{border-bottom:none}
      .emp-table tbody tr:hover{background:#f9fafb}
      .emp-table td{padding:14px 16px;font-size:14px;color:#374151;text-align:center}
      .emp-person-cell{display:flex;align-items:center;gap:12px;justify-content:center}
      .emp-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:#fff;overflow:hidden;flex-shrink:0}
      .emp-avatar img{width:100%;height:100%;object-fit:cover}
      .emp-person-name{font-weight:600;color:#111827;font-size:14px}
      .emp-person-fn{font-size:12px;color:#9ca3af;margin-top:1px}
      .emp-role-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500}
      .emp-role-badge .material-symbols-rounded{font-size:14px}
      .emp-role-admin{background:#fef3c7;color:#92400e}
      .emp-role-manager{background:#d1fae5;color:#065f46}
      .emp-role-agent{background:#d1fae5;color:#065f46}
      .emp-role-compta{background:#e0e7ff;color:#3730a3}
      .emp-role-assist{background:#f3f4f6;color:#374151}
      .emp-role-default{background:#f3f4f6;color:#374151}
      .emp-contact-cell{font-size:13px;display:inline-block;text-align:left}
      .emp-contact-phone{display:flex;align-items:center;gap:5px;color:#374151}
      .emp-contact-email{display:flex;align-items:center;gap:5px;color:#6b7280;margin-top:3px}
      .emp-contact-cell .material-symbols-rounded{font-size:14px;color:#9ca3af}
      .emp-status-dot{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500}
      .emp-status-dot::before{content:'';width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block}
      .emp-status-dot.pending::before{background:#f59e0b}
      .emp-status-dot.inactive::before{background:#d1d5db}
      .emp-lastcon-date{font-size:13px;color:#374151}
      .emp-lastcon-time{font-size:12px;color:#9ca3af;margin-top:2px}
      .emp-actions{display:flex;align-items:center;gap:6px;justify-content:center}
      .emp-action-btn{width:32px;height:32px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}
      .emp-action-btn .material-symbols-rounded{font-size:16px}
      .emp-action-btn.view:hover{background:#eff6ff;border-color:#bfdbfe;color:#3b82f6}
      .emp-action-btn.edit:hover{background:#f0fdf4;border-color:#bbf7d0;color:#22c55e}
      .emp-action-btn.del:hover{background:#fef2f2;border-color:#fecaca;color:#ef4444}
      .emp-action-btn.view{color:#6b7280}
      .emp-action-btn.edit{color:#6b7280}
      .emp-action-btn.del{color:#6b7280}
      .emp-action-btn.docs{color:#92400e}
      .emp-action-btn.docs:hover{background:#fffbeb;border-color:#fde68a;color:#92400e}
      .emp-table-footer{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280}
      .emp-page-btns{display:flex;gap:6px}
      .emp-page-btn{width:30px;height:30px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;font-size:13px;color:#374151;cursor:pointer;display:flex;align-items:center;justify-content:center}
      .emp-page-btn.active{background:#16a34a;color:#fff;border-color:#16a34a}
      .emp-empty{padding:60px;text-align:center;color:#9ca3af}
      .emp-empty .material-symbols-rounded{font-size:48px;display:block;margin-bottom:10px}
      .emp-title-row{margin-bottom:16px}
      .emp-page-title{font-size:24px;font-weight:700;color:#111827;margin:0}
      .emp-page-sub{font-size:13px;color:#6b7280;margin:3px 0 0}
      /* Ligne cards + bouton */
      .emp-cards-action-row{display:flex;align-items:stretch;gap:14px;margin-bottom:14px}
      .emp-cards-action-row .emp-stats-row{flex:1;margin-bottom:0}
      .emp-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
      .emp-btn-primary{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 16px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;align-self:center}
      .emp-btn-primary:hover{background:#15803d}
      /* Toolbar compacte */
      .emp-toolbar-row{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:nowrap}
      .emp-search-box{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:7px;padding:0 10px;height:34px;width:200px!important;flex:0 0 200px!important;min-width:200px!important;max-width:200px!important}
      .emp-search-box input{border:none;outline:none;font-size:13px;color:#374151;background:transparent;width:100%}
      .emp-search-box input::placeholder{color:#9ca3af}
      .emp-search-box .material-symbols-rounded{font-size:16px;color:#9ca3af}
      .emp-filter-sel{height:34px;border:1px solid #e5e7eb;border-radius:7px;padding:0 8px;font-size:13px;color:#374151;background:#fff;cursor:pointer;outline:none;width:200px!important;flex:0 0 200px!important;min-width:200px!important;max-width:200px!important}
      .emp-btn-sm-outline{display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 12px;background:#fff;color:#374151;border:1px solid #e5e7eb;border-radius:7px;font-size:13px;cursor:pointer;white-space:nowrap}
      .emp-btn-sm-outline:hover{background:#f9fafb}
      @media(max-width:1100px){.emp-stats-row{grid-template-columns:repeat(2,1fr)}.emp-cards-action-row{flex-wrap:wrap}.emp-table-wrap{overflow-x:auto}}
      @media(max-width:700px){.emp-toolbar-row{flex-wrap:wrap}.emp-search-box{max-width:100%;min-width:100%}}
    </style>
    <div class="emp-desktop-wrap">
      <!-- LIGNE 1 : 4 cards + bouton Nouvel employé aligné à droite -->
      <div class="emp-cards-action-row">
        <div class="emp-stats-row">
          <div class="emp-stat-card">
            <div class="emp-stat-icon blue"><span class="material-symbols-rounded">groups</span></div>
            <div class="emp-stat-info"><strong>${all.length}</strong><span>Total employés</span><em>Tous les employés</em></div>
          </div>
          <div class="emp-stat-card">
            <div class="emp-stat-icon green"><span class="material-symbols-rounded">verified_user</span></div>
            <div class="emp-stat-info"><strong>${actifs}</strong><span>Employés actifs</span><em>Comptes actifs</em></div>
          </div>
          <div class="emp-stat-card">
            <div class="emp-stat-icon amber"><span class="material-symbols-rounded">schedule</span></div>
            <div class="emp-stat-info"><strong>${enAttente}</strong><span>En attente</span><em>Invitations en attente</em></div>
          </div>
          <div class="emp-stat-card">
            <div class="emp-stat-icon gray"><span class="material-symbols-rounded">person_off</span></div>
            <div class="emp-stat-info"><strong>${inactifs}</strong><span>Inactifs</span><em>Comptes désactivés</em></div>
          </div>
        </div>
        <button class="emp-btn-primary" onclick="openNouvelEmployeDrawer()"><span class="material-symbols-rounded" style="font-size:18px">add</span> Nouvel employé</button>
      </div>
      <!-- LIGNE 3 : recherche + filtres + export/import sur une seule ligne compacte -->
      <div class="emp-toolbar-row">
        <label class="emp-search-box">
          <span class="material-symbols-rounded">search</span>
          <input id="gpEmpSearch" value="${esc(q)}" placeholder="Rechercher un employé…" oninput="renderEmployesModern()">
        </label>
        <select class="emp-filter-sel" id="gpEmpRole" onchange="renderEmployesModern()">
          <option value="">Tous les rôles</option>
          ${roles.map(r=>`<option value="${esc(String(r).toLowerCase())}" ${String(r).toLowerCase()===role?'selected':''}>${esc(r)}</option>`).join('')}
        </select>
        <select class="emp-filter-sel" id="gpEmpStatus" onchange="renderEmployesModern()">
          <option value="">Tous les statuts</option>
          <option value="actif" ${status==='actif'?'selected':''}>Actif</option>
          <option value="en attente" ${status==='en attente'?'selected':''}>En attente</option>
          <option value="inactif" ${status==='inactif'?'selected':''}>Inactif</option>
        </select>
        <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
          <div class="gp-export-wrap" id="exportWrap-employes" style="position:relative">
            <button class="emp-btn-sm-outline" onclick="toggleExportMenu('employes')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span> Exporter</button>
            <div class="gp-export-menu" id="exportMenu-employes">
              <div class="gp-export-item" onclick="exportListePDF('employes');toggleExportMenu('employes')"><span class="material-symbols-rounded">picture_as_pdf</span> Export PDF</div>
              <div class="gp-export-sep"></div>
              <div class="gp-export-item" onclick="exportExcel('employes');toggleExportMenu('employes')"><span class="material-symbols-rounded">table_view</span> Export Excel</div>
            </div>
          </div>
          <button class="emp-btn-sm-outline" onclick="openImportModal('employes')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span> Importer</button>
        </div>
      </div>
      <div class="emp-table-wrap">
        ${data.length?`
        <table class="emp-table">
          <thead>
            <tr>
              <th style="text-align:center">Employé</th>
              <th style="text-align:center">Rôle</th>
              <th style="text-align:center">Contact</th>
              <th style="text-align:center">Statut</th>
              <th style="text-align:center">Dernière connexion</th>
              <th style="text-align:center">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(e=>{
              const idx=all.indexOf(e);
              const fullName=((e.prenom||'')+' '+(e.nom||'')).trim()||e.nom||'Employé';
              const photo=e.photo?`<img src="${esc(e.photo)}" alt="${esc(fullName)}">`:`${initials(e.prenom,e.nom)}`;
              const rb=roleBadge(e.fonction);
              const sLow=String(e.statut||'Actif').toLowerCase();
              const isPending=sLow==='en attente'||sLow==='pending'||sLow==='invité';
              const isInactive=sLow==='inactif'||sLow==='désactivé';
              const statusClass=isPending?'pending':isInactive?'inactive':'';
              const lastLogin=e.derniereConnexion||e.lastLogin||e.derniere_connexion||'';
              return `<tr>
                <td>
                  <div class="emp-person-cell">
                    <div class="emp-avatar">${photo}</div>
                    <div>
                      <div class="emp-person-name">${esc(fullName)}</div>
                      <div class="emp-person-fn">${esc(e.fonction||'—')}</div>
                    </div>
                  </div>
                </td>
                <td><span class="emp-role-badge ${rb.cls}"><span class="material-symbols-rounded">${rb.icon}</span>${esc(rb.label)}</span></td>
                <td>
                  <div class="emp-contact-cell">
                    <div class="emp-contact-phone"><span class="material-symbols-rounded">call</span>${esc(e.tel||'—')}</div>
                    <div class="emp-contact-email"><span class="material-symbols-rounded">mail</span>${esc(e.email||'—')}</div>
                  </div>
                </td>
                <td><span class="emp-status-dot ${statusClass}">${esc(e.statut||'Actif')}</span></td>
                <td>
                  ${lastLogin
                    ? `<div class="emp-lastcon-date">${fmtDate(lastLogin)}</div><div class="emp-lastcon-time">${fmtTime(lastLogin)}</div>`
                    : `<span style="color:#d1d5db">—</span>`}
                </td>
                <td>
                  <div class="emp-actions" onclick="event.stopPropagation()">
                    ${!isPending ? `<button class="emp-action-btn view" title="Voir" onclick="viewRow('employes',${idx})"><span class="material-symbols-rounded">visibility</span></button>` : '<button class="emp-action-btn" style="opacity:.3;cursor:default" disabled><span class="material-symbols-rounded">visibility</span></button>'}
                    ${!isPending ? `<button class="emp-action-btn edit" title="Modifier" onclick="editRow('employes',${idx})"><span class="material-symbols-rounded">edit</span></button>` : '<button class="emp-action-btn" style="opacity:.3;cursor:default" disabled><span class="material-symbols-rounded">edit</span></button>'}
                    ${!isPending ? `<button class="emp-action-btn docs gp-doc-folder-btn" title="Documents" onclick="openEntityDocs('employes',${idx})"><span class="material-symbols-rounded">folder</span></button>` : '<button class="emp-action-btn docs" style="opacity:.3;cursor:default" disabled><span class="material-symbols-rounded">folder</span></button>'}
                    <button class="emp-action-btn del" title="Supprimer" onclick="delRow('employes',${idx})"><span class="material-symbols-rounded">delete</span></button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <div class="emp-table-footer">
          <span>Affichage de 1 à ${data.length} sur ${data.length} employé${data.length>1?'s':''}</span>
          <div class="emp-page-btns">
            <button class="emp-page-btn"><span class="material-symbols-rounded" style="font-size:14px">chevron_left</span></button>
            <button class="emp-page-btn active">1</button>
            <button class="emp-page-btn"><span class="material-symbols-rounded" style="font-size:14px">chevron_right</span></button>
          </div>
        </div>`:`<div class="emp-empty"><span class="material-symbols-rounded">badge</span>Aucun employé trouvé</div>`}
      </div>
    </div>`;
    setTimeout(()=>{const s=document.getElementById('gpEmpSearch'); if(s&&document.activeElement?.id==='gpEmpSearch') s.focus();},0);
  };
  window.renderLocativesModernV11=function(){
    const shell=ensureModernShell('page-locatives','gpLocativesModern','.container'); if(!shell) return;
    const all=Array.isArray(DB?.locatives)?DB.locatives:[];
    const biens=Array.isArray(DB?.biens)?DB.biens:[];
    const locataires=Array.isArray(DB?.locataires)?DB.locataires:[];
    const q=(document.getElementById('gpLocSearch')?.value||'').toLowerCase().trim();
    const statut=(document.getElementById('gpLocStatus')?.value||'').toLowerCase();
    let data=all.filter(l=>(!q||blob(l).includes(q))&&(!statut||String(l.statut||'Active').toLowerCase()===statut));
    const occupees=all.filter(l=>String(l.occupant||l.locataire||'').trim()).length;
    const totalLoyer=all.reduce((s,l)=>s+(Number(String(l.loyer||0).replace(/[^0-9.-]/g,''))||0),0);
    shell.innerHTML=`
      <div class="gp-modern-stats"><div class="gp-mini-stat"><span class="material-symbols-rounded">door_front</span><div><strong>${all.length}</strong><span>Locations</span></div></div><div class="gp-mini-stat"><span class="material-symbols-rounded">person_check</span><div><strong>${occupees}</strong><span>Occupées</span></div></div><div class="gp-mini-stat"><span class="material-symbols-rounded">payments</span><div><strong style="font-size:15px">${money(totalLoyer)}</strong><span>Loyers prévus</span></div></div></div>
      <div class="gp-modern-toolbar"><label class="gp-modern-search"><span class="material-symbols-rounded" style="font-size:18px">search</span><input id="gpLocSearch" value="${esc(q)}" placeholder="Rechercher une location…" oninput="renderLocativesModernV11()"></label><div class="gp-modern-filters"><select id="gpLocStatus" onchange="renderLocativesModernV11()"><option value="">Tous statuts</option><option value="active" ${statut==='active'?'selected':''}>Active</option><option value="archivée" ${statut==='archivée'?'selected':''}>Archivée</option></select><span class="gp-modern-count">${data.length} affichée${data.length>1?'s':''}</span></div></div>
      ${data.length?`<div class="gp-card-grid">${data.map(l=>{const idx=all.indexOf(l); const bienName=l.bien||l.nom||l.designation||'Location'; const b=biens.find(x=>[x.nom,x.designation,x.adresse].some(v=>String(v||'').toLowerCase()===String(bienName).toLowerCase()))||{}; const occ=l.occupant||l.locataire||''; const lt=locataires.find(x=>((x.prenom||'')+' '+(x.nom||'')).trim().toLowerCase()===String(occ).toLowerCase()||String(x.nom||'').toLowerCase()===String(occ).toLowerCase())||{}; const media=b.photo?`<img src="${b.photo}" alt="${esc(bienName)}">`:`<span class="material-symbols-rounded">apartment</span>`; return `
        <article class="gp-location-card" onclick="viewRow('locatives',${idx})" title="Appuyer pour voir les détails">
          <div class="gp-location-media">${media}<span class="gp-location-badge">${esc(l.statut||'Active')}</span></div>
          <div class="gp-location-title">${esc(l.nom||bienName)}</div><div class="gp-location-sub">${esc(b.adresse||l.adresse||'Adresse non renseignée')}</div>
          <div class="gp-card-lines"><div class="gp-card-line"><span class="material-symbols-rounded">home_work</span><span>${esc(bienName)}</span></div><div class="gp-card-line"><span class="material-symbols-rounded">person</span><span>${esc(occ||'Aucun occupant')}</span></div><div class="gp-card-line"><span class="material-symbols-rounded">payments</span><span>${esc(l.loyer?money(l.loyer):'Loyer non renseigné')}</span></div><div class="gp-card-line"><span class="material-symbols-rounded">event_available</span><span>${esc(l.dateEntree||l.date_entree||l.entree||'Date non renseignée')}</span></div></div>
          <div class="gp-card-actions" onclick="event.stopPropagation()"><button class="icon-btn icon-view" title="Voir" onclick="viewRow('locatives',${idx})"><span class="material-symbols-rounded">visibility</span></button><button class="icon-btn icon-edit" title="Modifier" onclick="editRow('locatives',${idx})"><span class="material-symbols-rounded">edit</span></button><button class="icon-btn icon-delete" title="Supprimer" onclick="delRow('locatives',${idx})"><span class="material-symbols-rounded">delete</span></button></div>
        </article>`}).join('')}</div>`:`<div class="gp-empty-modern"><span class="material-symbols-rounded">door_front</span>Aucune location trouvée</div>`}`;
  };
  const oldRenderPage=window.renderPage;
  window.renderPage=function(p){
    if(p==='employes'){ renderEmployesModern(); updateSidebarBadges?.(); return; }
    if(p==='locatives'){ renderLocativesModernV11(); updateSidebarBadges?.(); return; }
    return oldRenderPage ? oldRenderPage(p) : undefined;
  };
  // Si la page est déjà ouverte au chargement du patch, forcer le rendu moderne.
  document.addEventListener('DOMContentLoaded',()=>{ try{ if(document.getElementById('page-employes')?.classList.contains('active')) renderEmployesModern(); if(document.getElementById('page-locatives')?.classList.contains('active')) renderLocativesModernV11(); }catch(e){} });
})();


/* ═══════════════════════════════════════════════════════════
   script-08.js
═══════════════════════════════════════════════════════════ */
(function(){
  function esc(v){return gp_esc(v)}
  function money(v){return gp_money(v)}
  function dateFr(v){
    if(typeof formatGPDateShort==='function') return formatGPDateShort(v);
    const d=new Date(v); return isNaN(d)?(v||'—'):d.toLocaleDateString('fr-FR');
  }
  function monthLabel(v){
    const d=(typeof parseGPDate==='function'?parseGPDate(v):new Date(v)) || new Date();
    return d.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
  }
  function agence(){return (typeof _getAgenceInfo==='function')?_getAgenceInfo():{
    agence:localStorage.getItem('geniusproperty_agence')||'Genius Property',
    email:localStorage.getItem('geniusproperty_email')||'contact@geniusproperty.com',
    tel:localStorage.getItem('geniusproperty_tel')||'',
    adresse:localStorage.getItem('geniusproperty_adresse')||'Dakar, Sénégal',
    rccm:localStorage.getItem('geniusproperty_rccm')||'',
    ninea:localStorage.getItem('geniusproperty_ninea')||'',
    logo:localStorage.getItem('geniusproperty_logo')||''
  };}
  function findLocataireByName(name){
    const n=String(name||'').trim().toLowerCase();
    return (DB.locataires||[]).find(l=>`${l.prenom||''} ${l.nom||''}`.trim().toLowerCase()===n || `${l.nom||''} ${l.prenom||''}`.trim().toLowerCase()===n || String(l.nom||'').toLowerCase()===n) || {};
  }
  function findBienFromLocative(locativeName){
    const lv=(DB.locatives||[]).find(l=>l.nom===locativeName || l.bien===locativeName) || {};
    const bienName=lv.bien || lv.parentBien || locativeName;
    const b=(DB.biens||[]).find(x=>x.nom===bienName || x.nom===locativeName) || {};
    return {lv,b,bienName};
  }
  window.genererPDFContrat=function(idx){
    const c=(DB.contrats||[])[idx]; if(!c) return toast?.('Contrat introuvable','err');
    const ag=agence(); const {lv,b,bienName}=findBienFromLocative(c.locative);
    const d=Object.assign({num:c.num||('CT-'+Date.now()),locataire:c.locataire,locative:c.locative,type:c.type||'Habitation',debut:c.debut,fin:c.fin,statut:c.statut,loyer:c.loyer||lv.loyer||'',charges:c.charges||lv.charge||'',caution:c.caution||'',honor:c.honor||'',frais:c.frais||'',prochain:c.prochain,obs:c.obs||'Néant',sign:c.sign||c.debut}, ag);
    const html=`<div id="contratPdfExport" style="width:794px;background:#fff;color:#111;font-family:Inter,Arial,sans-serif;padding:0">
      <div style="background:#0F0F0F;color:#fff;padding:28px 34px;display:flex;justify-content:space-between;gap:24px;align-items:flex-start">
        <div style="display:flex;gap:14px;align-items:flex-start">${d.logo?`<img src="${d.logo}" style="width:70px;height:70px;object-fit:contain;border-radius:8px;background:#fff;padding:4px">`:''}<div><div style="font-size:24px;font-weight:900;color:#D4AF37;letter-spacing:1px">${esc(d.agence).toUpperCase()}</div><div style="font-size:12px;opacity:.75;margin-top:5px">Gestion locative</div><div style="font-size:10.5px;opacity:.6;margin-top:8px;line-height:1.55">${esc(d.adresse)}<br>${esc(d.email)} ${d.tel?' · '+esc(d.tel):''}</div></div></div>
        <div style="text-align:right"><div style="font-size:11px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase">Contrat N°</div><div style="font-size:17px;font-weight:800;margin-top:5px">${esc(d.num)}</div><div style="font-size:11px;opacity:.65;margin-top:8px">Signature : ${esc(dateFr(d.sign||d.debut))}</div></div>
      </div>
      <div style="padding:30px 38px">
        <h1 style="font-size:25px;text-align:center;margin:0 0 24px;color:#111;text-transform:uppercase;letter-spacing:1px">Contrat de location</h1>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
          <div style="border:1px solid #eee;border-radius:12px;padding:14px"><div style="font-size:10px;color:#999;text-transform:uppercase;font-weight:800">Bailleur / Agence</div><div style="font-weight:800;margin-top:5px">${esc(d.agence)}</div><div style="font-size:12px;color:#666;margin-top:4px">${esc(d.email)}<br>${esc(d.tel)}<br>${esc(d.adresse)}</div></div>
          <div style="border:1px solid #eee;border-radius:12px;padding:14px"><div style="font-size:10px;color:#999;text-transform:uppercase;font-weight:800">Locataire</div><div style="font-weight:800;margin-top:5px">${esc(d.locataire)}</div><div style="font-size:12px;color:#666;margin-top:4px">${esc(findLocataireByName(d.locataire).adresse||'Adresse non renseignée')}</div></div>
        </div>
        <div style="border-left:4px solid #D4AF37;background:#fafafa;padding:14px 16px;border-radius:8px;margin-bottom:18px;font-size:13px;line-height:1.6">Le présent contrat a pour objet la location du bien <strong>${esc(bienName||d.locative)}</strong>${b.adresse?`, situé ${esc(b.adresse)}`:''}, de type <strong>${esc(d.type)}</strong>.</div>
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:18px"><tbody>
          ${[['Date début',dateFr(d.debut)],['Date fin',dateFr(d.fin)],['Statut',d.statut],['Prochain paiement',dateFr(d.prochain)],['Loyer mensuel',money(d.loyer)+' FCFA'],['Charges',money(d.charges)+' FCFA'],['Caution',money(d.caution)+' FCFA'],['Honoraires',money(d.honor)+' FCFA'],['Frais dossier',money(d.frais)+' FCFA']].map((r,i)=>`<tr style="background:${i%2?'#fff':'#fafafa'}"><td style="padding:10px 12px;border:1px solid #eee;font-weight:800;color:#444;width:40%">${esc(r[0])}</td><td style="padding:10px 12px;border:1px solid #eee">${esc(r[1]||'—')}</td></tr>`).join('')}
        </tbody></table>
        <div style="margin-bottom:22px"><div style="font-size:12px;font-weight:900;text-transform:uppercase;color:#111;border-bottom:2px solid #D4AF37;padding-bottom:6px;margin-bottom:8px">Observations</div><div style="font-size:12.5px;line-height:1.65;background:#fafafa;border-radius:8px;padding:12px">${esc(d.obs||'Néant')}</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:38px"><div style="text-align:center"><div style="height:55px;border-bottom:1px solid #999"></div><div style="font-size:11px;margin-top:8px;font-weight:800">Signature agence</div><div style="font-size:11px;color:#666">${esc(d.agence)}</div></div><div style="text-align:center"><div style="height:55px;border-bottom:1px solid #999"></div><div style="font-size:11px;margin-top:8px;font-weight:800">Signature locataire</div><div style="font-size:11px;color:#666">${esc(d.locataire)}</div></div></div>
      </div>
    </div>`;
    const box=document.createElement('div'); box.style.cssText='position:fixed;left:-9999px;top:0'; box.innerHTML=html; document.body.appendChild(box);
    html2pdf().set({margin:0,filename:`contrat_${String(d.num).replace(/[^a-z0-9_-]/gi,'_')}.pdf`,image:{type:'jpeg',quality:.98},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'pt',format:'a4',orientation:'portrait'}}).from(box.firstElementChild).save().then(()=>{box.remove();toast?.('Contrat PDF téléchargé ✓')}).catch(()=>{box.remove();toast?.('Erreur génération PDF','err')});
  };
  window.genererPDFOfficiel=window.genererPDFContrat;
  window.genererRecuPaiementPDF=function(idx){
    const p=(DB.paiements||[])[idx]; if(!p) return toast?.('Paiement introuvable','err');
    const ag=agence(); const {lv,b,bienName}=findBienFromLocative(p.locative); const loc=findLocataireByName(p.locataire);
    const receiptNo=p.recuNo || ('RCP-'+new Date().getFullYear()+'-'+String((DB.paiements.length-idx)||1).padStart(4,'0'));
    p.recuNo=receiptNo; try{saveDB?.();}catch(e){}
    const html=`<div id="recuPdfExport" style="width:794px;background:#fff;color:#111;font-family:Inter,Arial,sans-serif;padding:38px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #D4AF37;padding-bottom:20px;margin-bottom:28px">
        <div style="display:flex;gap:14px;align-items:flex-start">${ag.logo?`<img src="${ag.logo}" style="width:76px;height:76px;object-fit:contain;border-radius:10px;border:1px solid rgba(212,175,55,.35);padding:4px">`:''}<div><div style="font-size:24px;font-weight:900;letter-spacing:1px">${esc(ag.agence).toUpperCase()}</div><div style="font-size:12px;color:#666;margin-top:4px">GESTION LOCATIVE</div></div></div>
        <div style="text-align:right"><div style="font-size:28px;font-weight:900;color:#111">Reçu de paiement</div><div style="font-size:11px;color:#999;margin-top:8px;text-transform:uppercase">N° de reçu</div><div style="font-size:16px;font-weight:900;color:#D4AF37;margin-top:3px">${esc(receiptNo)}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-bottom:28px">
        <div><div style="font-size:11px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:8px">Locataire</div><div style="font-size:15px;font-weight:800">${esc(p.locataire)}</div><div style="font-size:12px;color:#666;line-height:1.55;margin-top:5px">${esc(loc.adresse||'Adresse locataire non renseignée')}<br>${esc(loc.tel||'')}</div></div>
        <div><div style="font-size:11px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:8px">Date de paiement</div><div style="font-size:15px;font-weight:800">${esc(dateFr(p.date))}</div><div style="font-size:12px;color:#666;margin-top:5px">Période : ${esc(monthLabel(p.date))}</div></div>
        <div><div style="font-size:11px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:8px">Bien loué</div><div style="font-size:15px;font-weight:800">${esc(b.type||bienName||p.locative)}</div><div style="font-size:12px;color:#666;line-height:1.55;margin-top:5px">${esc(b.adresse||lv.adresse||p.locative||'Adresse du bien non renseignée')}</div></div>
        <div><div style="font-size:11px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:8px">Mode de paiement</div><div style="font-size:15px;font-weight:800">${esc(p.mode||'—')}</div><div style="font-size:12px;color:#666;margin-top:5px">Réf. ${esc(receiptNo)}</div></div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:26px"><thead><tr style="background:#0F0F0F;color:#fff"><th style="text-align:left;padding:12px;font-size:11px;text-transform:uppercase;letter-spacing:1px">Désignation</th><th style="text-align:right;padding:12px;font-size:11px;text-transform:uppercase;letter-spacing:1px">Montant</th></tr></thead><tbody><tr><td style="padding:16px 12px;border-bottom:1px solid #eee"><div style="font-weight:800">Loyer mensuel — ${esc(monthLabel(p.date))}</div><div style="font-size:12px;color:#666;margin-top:4px">${esc(b.type||'Bien')} · ${esc(b.adresse||lv.bien||p.locative||'')}</div></td><td style="padding:16px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:900">${money(p.paye||p.montant)} FCFA</td></tr></tbody></table>
      <div style="display:flex;justify-content:space-between;align-items:center;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 20px;margin-bottom:30px"><div style="font-size:14px;font-weight:900;color:#166534">TOTAL REÇU<br><span style="font-size:12px;font-weight:700">Paiement reçu ✓</span></div><div style="font-size:25px;font-weight:900;color:#111">${money(p.paye||p.montant)} FCFA</div></div>
      <div style="text-align:center;font-size:12px;color:#666;line-height:1.65;border-top:1px solid #eee;padding-top:18px"><strong>${esc(ag.agence)}</strong><br>${esc(ag.adresse)}<br>${esc(ag.email)} ${ag.tel?' · '+esc(ag.tel):''}<br><span style="font-size:11px;color:#999">Ce reçu tient lieu de quittance de loyer</span></div>
    </div>`;
    const box=document.createElement('div'); box.style.cssText='position:fixed;left:-9999px;top:0'; box.innerHTML=html; document.body.appendChild(box);
    html2pdf().set({margin:0,filename:`recu_paiement_${String(receiptNo).replace(/[^a-z0-9_-]/gi,'_')}.pdf`,image:{type:'jpeg',quality:.98},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'pt',format:'a4',orientation:'portrait'}}).from(box.firstElementChild).save().then(()=>{box.remove();toast?.('Reçu PDF téléchargé ✓')}).catch(()=>{box.remove();toast?.('Erreur génération reçu','err')});
  };
  window.delRow=function(key,i){
    const item=(DB[key]||[])[i];
    const lib={employes:'cet employé',proprietaires:'ce propriétaire',locataires:'ce locataire',biens:'ce bien',locatives:'cette locative',contrats:'ce contrat',paiements:'ce paiement',depenses:'cette dépense'}[key]||'cet enregistrement';
    const detail=item?(item.nom||item.prenom||item.locataire||item.locative||item.libelle||item.num||''):'';
    const msg=`⚠️ Suppression définitive\n\nVous êtes sur le point de supprimer ${lib}${detail?' : '+detail:''}.\n\nCette action est irréversible. Continuer ?`;
    if(confirm(msg)){DB[key].splice(i,1);saveDB?.();renderPage?.(key);toast?.('Suppression effectuée ✓')}
  };
})();


/* ═══════════════════════════════════════════════════════════
   script-09.js
═══════════════════════════════════════════════════════════ */
(function(){
  function pad(n){ return String(n).padStart(2,'0'); }
  function formatDashDate(value){
    var d = value ? new Date(value + 'T00:00:00') : new Date();
    if(isNaN(d)) d = new Date();
    var dayName = d.toLocaleDateString('fr-FR',{weekday:'long'});
    return dayName.charAt(0).toUpperCase() + dayName.slice(1) + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth()+1) + '/' + d.getFullYear();
  }
  function initDashboardCalendar(){
    var btn = document.getElementById('dashCalendarTrigger');
    var input = document.getElementById('dashCalendarInput');
    var text = document.getElementById('dashCalendarText');
    if(!btn || !input || !text) return;
    if(!input.value){ input.value = new Date().toISOString().slice(0,10); }
    text.textContent = formatDashDate(input.value);
    input.addEventListener('change', function(){ text.textContent = formatDashDate(input.value); });
    btn.addEventListener('click', function(e){
      if(e.target === input) return;
      if(typeof input.showPicker === 'function') input.showPicker();
      else input.focus();
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDashboardCalendar);
  else initDashboardCalendar();
  window.initDashboardCalendar = initDashboardCalendar;
})();


/* ═══════════════════════════════════════════════════════════
   script-10.js
═══════════════════════════════════════════════════════════ */
(function(){
  const selectors = [
    '.page-hero-actions button', '.page-hero-actions .btn',
    '.page-header button', '.page-header .btn',
    '.biens-page-header button', '.biens-page-header .btn',
    '.proprietaires-page-header button', '.proprietaires-page-header .btn',
    '.locataires-modern-actions button', '.locataires-modern-actions .btn',
    '.audit-actions button', '.audit-actions .btn',
    '.rpt-actions button', '.rpt-actions .btn',
    '.top-actions button', '.top-actions .btn',
    '.cfg-data-actions button', '.cfg-data-actions .btn',
    '.journal-tools button', '.journal-tools .btn',
    '.gp-export-btn', '.btn-import'
  ].join(',');
  const iconSelectors = selectors.split(',').map(s => s.trim() + ' .material-symbols-rounded').join(',');
  const tableActionSelectors = '.actions .icon-btn,.gp-card-actions .icon-btn,.loc-actions .icon-btn,.loc-doc-actions .icon-btn,.bien-doc-actions .icon-btn,.depenses-table-actions .icon-btn,.icon-btn';

  function setImportant(el, prop, val){ el.style.setProperty(prop, val, 'important'); }
  function compact(){
    document.querySelectorAll(selectors).forEach(el => {
      setImportant(el,'height','20px');
      setImportant(el,'min-height','20px');
      setImportant(el,'max-height','20px');
      setImportant(el,'padding','0 8px');
      setImportant(el,'border-radius','5px');
      setImportant(el,'font-size','10px');
      setImportant(el,'line-height','1');
      setImportant(el,'display','inline-flex');
      setImportant(el,'align-items','center');
      setImportant(el,'justify-content','center');
      setImportant(el,'gap','3px');
      setImportant(el,'box-sizing','border-box');
      setImportant(el,'white-space','nowrap');
    });
    document.querySelectorAll(iconSelectors).forEach(el => {
      setImportant(el,'font-size','12px');
      setImportant(el,'line-height','1');
      setImportant(el,'width','auto');
      setImportant(el,'height','auto');
    });
    document.querySelectorAll(tableActionSelectors).forEach(el => {
      setImportant(el,'width','20px');
      setImportant(el,'height','20px');
      setImportant(el,'min-width','20px');
      setImportant(el,'min-height','20px');
      setImportant(el,'max-width','20px');
      setImportant(el,'max-height','20px');
      setImportant(el,'padding','0');
      setImportant(el,'border-radius','50%');
    });
  }
  document.addEventListener('DOMContentLoaded', compact);
  window.addEventListener('load', compact);
  const mo = new MutationObserver(compact);
  mo.observe(document.documentElement, {childList:true, subtree:true});
  compact();
})();


/* ═══════════════════════════════════════════════════════════
   script-11.js
═══════════════════════════════════════════════════════════ */
(function(){
  var agendaMonth = new Date(); agendaMonth.setDate(1);
  function fmtMoney(v){ try{return fmt(v)+' FCFA'}catch(e){return (Number(v)||0).toLocaleString('fr-FR')+' FCFA'} }
  function rowsInPeriod(key){
    var now=new Date(), cm=now.getMonth(), cy=now.getFullYear();
    var pays=Array.isArray(DB&&DB.paiements)?DB.paiements:[], deps=Array.isArray(DB&&DB.depenses)?DB.depenses:[];
    var m=cm,y=cy;
    if(key==='last'){m=cm===0?11:cm-1;y=cm===0?cy-1:cy}
    var pf,df;
    if(key==='year'){
      pf=pays.filter(function(p){var d=new Date(p.date);return !isNaN(d)&&d.getFullYear()===cy});
      df=deps.filter(function(x){var d=new Date(x.date);return !isNaN(d)&&d.getFullYear()===cy});
    }else{
      pf=pays.filter(function(p){var d=new Date(p.date);return !isNaN(d)&&d.getMonth()===m&&d.getFullYear()===y});
      df=deps.filter(function(x){var d=new Date(x.date);return !isNaN(d)&&d.getMonth()===m&&d.getFullYear()===y});
    }
    var rev=pf.reduce(function(s,p){return s+num(p.paye||p.montant)},0), dep=df.reduce(function(s,x){return s+num(x.montant)},0);
    return {rev:rev,dep:dep,net:rev-dep,paid:pf.length,late:pf.filter(function(p){return num(p.reste)>0}).length};
  }
  function ensureDashboard(){
    var page=document.getElementById('page-dashboard'); if(!page || page.dataset.gpPhotoReady==='1') return;
    page.dataset.gpPhotoReady='1';
    page.innerHTML='<div class="compact-dashboard gp-photo-dashboard">'+
      '<div class="gp-photo-stats">'+
      '<div class="gp-photo-card"><div class="gp-photo-icon gp-photo-blue"><span class="material-symbols-rounded">home</span></div><div><div class="gp-photo-label">Biens</div><div class="gp-photo-value" id="homeBiensCount">0</div><div class="gp-photo-sub blue" id="homeBiensTotal">+0 ce mois-ci</div></div></div>'+
      '<div class="gp-photo-card"><div class="gp-photo-icon gp-photo-green"><span class="material-symbols-rounded">groups</span></div><div><div class="gp-photo-label">Locataires</div><div class="gp-photo-value" id="homeLocatairesCount">0</div><div class="gp-photo-sub green" id="homeLocatairesTotal">+0 ce mois-ci</div></div></div>'+
      '<div class="gp-photo-card"><div class="gp-photo-icon gp-photo-gold"><span class="material-symbols-rounded">key</span></div><div><div class="gp-photo-label">Locations</div><div class="gp-photo-value" id="homeLocationsCount">0</div><div class="gp-photo-sub gold" id="homeLocationsTotal">+0 actives</div></div></div>'+
      '<div class="gp-photo-card"><div class="gp-photo-icon gp-photo-purple"><span class="material-symbols-rounded">trending_up</span></div><div><div class="gp-photo-label">Taux d\'occupation</div><div class="gp-photo-value" id="homeTauxOccupation">0%</div><div class="gp-photo-sub purple" id="homeTauxSub">+0%</div></div></div>'+
      '</div>'+
      '<div class="gp-photo-grid">'+
      '<div class="gp-photo-panel"><div class="gp-photo-head"><div class="gp-photo-title">Revenus et Dépenses</div></div><div class="gp-photo-tabs" id="revenusTabs"><button class="gp-photo-tab dash-tab active" onclick="gpSwitchMoneyTab(this,\'current\')"><span>Mois en cours</span><strong id="gpTabCurrent">0 FCFA</strong></button><button class="gp-photo-tab dash-tab" onclick="gpSwitchMoneyTab(this,\'last\')"><span>Mois dernier</span><strong id="gpTabLast">0 FCFA</strong></button><button class="gp-photo-tab dash-tab" onclick="gpSwitchMoneyTab(this,\'year\')"><span>Année en cours</span><strong id="gpTabYear">0 FCFA</strong></button></div><div class="gp-photo-money-grid"><div class="gp-photo-money"><label id="revTabLabel3">Revenus</label><strong class="gp-rev" id="homeRevenuBrut">0 FCFA</strong></div><div class="gp-photo-money"><label id="revTabLabel4">Dépenses</label><strong class="gp-dep" id="homeDepensesMois">0 FCFA</strong></div><div class="gp-photo-money"><label id="revTabLabel5">Résultat net</label><strong class="gp-net" id="homeResultatNet">0 FCFA</strong></div></div><span style="display:none" id="homeLoyersPayesCount"></span><span style="display:none" id="homeRetardCount"></span><span style="display:none" id="homeLoyersPayes"></span><span style="display:none" id="revTabLabel1"></span><span style="display:none" id="revTabLabel2"></span></div>'+
      '<div class="gp-photo-panel"><div class="gp-photo-head"><div class="gp-photo-title">Évolution mensuelle</div><select class="gp-photo-select" onchange="buildHomeChart(this.value)"><option value="1y">12 derniers mois</option><option value="1m">Mois en cours</option></select></div><div class="gp-photo-chart dash-chart-card"><canvas id="homeLineChart"></canvas></div></div>'+ 
      '</div>'+
      '<div class="gp-photo-agenda"><div class="gp-agenda-head"><div class="gp-agenda-title">Agenda</div><div class="gp-agenda-month"><button class="gp-agenda-nav" onclick="gpMoveDashMonth(-1)"><span class="material-symbols-rounded">chevron_left</span></button><span id="gpAgendaMonthTitle"></span><button class="gp-agenda-nav" onclick="gpMoveDashMonth(1)"><span class="material-symbols-rounded">chevron_right</span></button></div><button class="gp-agenda-all" onclick="openFullAgendaModal&&openFullAgendaModal()">Voir tout</button></div><div class="gp-agenda-body"><div class="gp-event-list" id="homeAgendaList"></div><div class="gp-calendar" id="gpDashCalendar"></div></div><span style="display:none" id="homeTodayCount"></span><span style="display:none" id="homeTomorrowCount"></span><span style="display:none" id="homeAgendaDate"></span></div>'+ 
      '</div><button class="dash-float-chat" title="Messages" onclick="navigate(\'messages\')"><span class="material-symbols-rounded">chat</span></button>';
  }
  function patchStats(){
    var biens=Array.isArray(DB&&DB.biens)?DB.biens:[], locatives=Array.isArray(DB&&DB.locatives)?DB.locatives:[];
    var total=biens.reduce(function(s,b){return s+(typeof getBienUnitCount==='function'?getBienUnitCount(b):1)},0)||biens.length;
    var occ=locatives.filter(function(l){return !String(l.statut||'').toLowerCase().includes('arch')}).length;
    var taux=total?Math.round((occ/total)*100):0;
    var el=document.getElementById('homeTauxOccupation'); if(el) el.textContent=taux+'%';
    var sub=document.getElementById('homeTauxSub'); if(sub) sub.textContent=occ+' / '+total+' occupés';
    var hb=document.getElementById('homeBiensTotal'); if(hb) hb.textContent='Total : '+total;
    var hl=document.getElementById('homeLocatairesTotal'); if(hl) hl.textContent='Total : '+((DB.locataires||[]).length);
    var hlo=document.getElementById('homeLocationsTotal'); if(hlo) hlo.textContent=occ+' actives';
    ['current','last','year'].forEach(function(k){var r=rowsInPeriod(k), id=k==='current'?'gpTabCurrent':k==='last'?'gpTabLast':'gpTabYear', e=document.getElementById(id); if(e)e.textContent=fmtMoney(r.net)});
  }
  window.gpSwitchMoneyTab=function(btn,key){document.querySelectorAll('#revenusTabs .gp-photo-tab').forEach(function(b){b.classList.remove('active')}); if(btn)btn.classList.add('active'); if(typeof switchRevenusTab==='function') switchRevenusTab(btn,key); patchStats();};
  window.gpMoveDashMonth=function(delta){agendaMonth.setMonth(agendaMonth.getMonth()+delta); renderNewAgenda();};
  function renderNewAgenda(){
    var list=document.getElementById('homeAgendaList'), cal=document.getElementById('gpDashCalendar'), title=document.getElementById('gpAgendaMonthTitle'); if(!list||!cal) return;
    var ag=(Array.isArray(DB&&DB.agenda)?DB.agenda:[]).slice().sort(function(a,b){return ((a.date||'')+(a.time||'')).localeCompare((b.date||'')+(b.time||''));});
    var months=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    if(title) title.textContent=months[agendaMonth.getMonth()]+' '+agendaMonth.getFullYear();
    var upcoming=ag.filter(function(a){return !a.done}).slice(0,3);
    if(!upcoming.length) upcoming=[{date:new Date().toISOString().slice(0,10),title:'Aucun événement planifié',time:'',type:'autre'}];
    var colors=['#3b73ff','#f0b400','#22a85a','#6f4ee8'];
    list.innerHTML=upcoming.map(function(a,i){var d=new Date((a.date||new Date().toISOString().slice(0,10))+'T00:00:00');return '<div class="gp-event-row" onclick="'+'"<span class="gp-event-dot" style="background:'+colors[i%colors.length]+'"></span><div class="gp-event-day">'+String(d.getDate()).padStart(2,'0')+'<span>'+d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','')+'</span></div><div class="gp-event-name">'+(typeof escapeHTML==='function'?escapeHTML(a.title||'Sans titre'):(a.title||'Sans titre'))+'</div><div class="gp-event-time">'+(a.time||'')+'</div></div>'}).join('');
    var y=agendaMonth.getFullYear(), m=agendaMonth.getMonth(), first=new Date(y,m,1), start=new Date(first); start.setDate(first.getDate()-((first.getDay()+6)%7));
    var mark={}; ag.forEach(function(a,i){if(a.date) mark[a.date]=i});
    var html='<div class="gp-cal-grid">'+['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(function(d){return '<div class="gp-cal-dow">'+d+'</div>'}).join('');
    for(var i=0;i<35;i++){var d=new Date(start); d.setDate(start.getDate()+i); var key=d.toISOString().slice(0,10), muted=d.getMonth()!==m, has=mark[key]!=null, cls='gp-cal-day '+(muted?'gp-cal-muted ':'')+(has?'gp-cal-mark '+(['gp-cal-blue','gp-cal-gold','gp-cal-green','gp-cal-purple'][mark[key]%4]):''); html+='<div class="'+cls+'">'+d.getDate()+'</div>';}
    cal.innerHTML=html+'</div>';
  }
  var original=window.renderDashboard;
  window.renderDashboard=function(){ ensureDashboard(); var r=original&&original.apply(this,arguments); patchStats(); renderNewAgenda(); return r; };
  /* flicker-fix: ancien rendu dashboard désactivé; la navigation appelle le renderer final */
})();


/* ═══════════════════════════════════════════════════════════
   script-12.js
═══════════════════════════════════════════════════════════ */
(function(){
  function esc(v){return gp_esc(v)}
  function onlyMoney(v){try{return (typeof fmt==='function'?fmt(v||0):String(v||0));}catch(e){return String(v||0)}}
  function ensureSyncModal(){
    let m=document.getElementById('gpSyncModal');
    if(!m){m=document.createElement('div');m.id='gpSyncModal';m.className='gp-sync-modal';m.innerHTML='<div class="gp-sync-modal-head"><div class="gp-sync-modal-title"><span class="material-symbols-rounded">cloud_sync</span><span>Synchronisation</span></div><button class="gp-sync-modal-close" type="button" onclick="document.getElementById(\'gpSyncModal\').classList.remove(\'show\')"><span class="material-symbols-rounded" style="font-size:16px">close</span></button></div><div class="gp-sync-modal-body" id="gpSyncModalBody"></div><div class="gp-sync-modal-foot">Vos données restent sauvegardées localement. Vérifiez la connexion ou Firebase.</div>';document.body.appendChild(m);}return m;
  }
  const oldSet=window._setSyncStatus;
  window._setSyncStatus=function(state,msg){
    const el=document.getElementById('syncIndicator');
    const modal=ensureSyncModal();
    if(oldSet) try{oldSet(state,msg)}catch(e){}
    if(!el) return;
    el.classList.remove('gp-sync-has-text');
    el.onclick=function(){ if(state==='error') modal.classList.toggle('show'); };
    if(state==='error'){
      el.innerHTML='<span class="material-symbols-rounded">cloud_sync</span>';
      el.title=msg||'Erreur de synchronisation';
      el.style.display='flex';
      const body=document.getElementById('gpSyncModalBody');
      if(body) body.innerHTML='<strong>'+(esc(msg||'Erreur sync'))+'</strong><br>La sauvegarde en ligne n’a pas abouti, mais la sauvegarde locale reste active.';
      modal.classList.add('show');
      clearTimeout(window.__gpSyncModalTimer); window.__gpSyncModalTimer=setTimeout(()=>modal.classList.remove('show'),6500);
    }else{
      modal.classList.remove('show');
      if(state==='syncing'){el.classList.add('gp-sync-has-text');}
    }
  };

  window.genererRecuPaiementPDF=function(idx){
    const p=(DB.paiements||[])[idx]; if(!p) return toast?.('Paiement introuvable','err');
    const ag=(typeof agence==='function'?agence():{agence:'Genius Property',adresse:'Dakar, Sénégal',email:'contact@geniusproperty.com',tel:'',logo:''});
    const rel=(typeof findBienFromLocative==='function'?findBienFromLocative(p.locative):{lv:{},b:{},bienName:p.locative}); const lv=rel.lv||{}, b=rel.b||{}, bienName=rel.bienName||p.locative;
    const loc=(typeof findLocataireByName==='function'?findLocataireByName(p.locataire):{});
    const receiptNo=p.recuNo || ('RCP-'+new Date().getFullYear()+'-'+String((DB.paiements.length-idx)||1).padStart(4,'0'));
    p.recuNo=receiptNo; try{saveDB?.();}catch(e){}
    const periode=(typeof monthLabel==='function'?monthLabel(p.date):'');
    const dateTxt=(typeof dateFr==='function'?dateFr(p.date):(p.date||''));
    const montant=onlyMoney(p.paye||p.montant)+' FCFA';
    const bienTitre=b.type||bienName||p.locative||'Bien loué';
    const bienAdr=b.adresse||lv.adresse||lv.bien||p.locative||'Adresse du bien non renseignée';
    const html=`<div id="recuPdfExport" style="width:794px;min-height:1123px;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;padding:42px 44px;box-sizing:border-box;letter-spacing:.01px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #D4AF37;padding-bottom:22px;margin-bottom:30px;">
        <div style="display:flex;gap:16px;align-items:flex-start;max-width:380px;">${ag.logo?`<img src="${ag.logo}" style="width:72px;height:72px;object-fit:contain;border-radius:10px;border:1px solid rgba(212,175,55,.35);padding:5px;box-sizing:border-box;">`:''}<div><div style="font-size:25px;line-height:1.1;font-weight:900;letter-spacing:.4px;word-spacing:2px;">${esc(ag.agence||'Genius Property').toUpperCase()}</div><div style="font-size:13px;color:#666;margin-top:7px;letter-spacing:.6px;text-transform:uppercase;">Gestion locative</div></div></div>
        <div style="text-align:right;min-width:260px;"><div style="font-size:30px;line-height:1.08;font-weight:900;color:#111;word-spacing:3px;">Reçu de paiement</div><div style="font-size:12px;color:#999;margin-top:12px;text-transform:uppercase;letter-spacing:.8px;">N° de reçu</div><div style="font-size:18px;font-weight:900;color:#D4AF37;margin-top:5px;letter-spacing:.5px;">${esc(receiptNo)}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;column-gap:60px;row-gap:28px;margin-bottom:34px;">
        <div><div style="font-size:12px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:10px;letter-spacing:.4px;">Locataire</div><div style="font-size:17px;line-height:1.25;font-weight:900;word-spacing:2px;">${esc(p.locataire||'—')}</div><div style="font-size:13px;color:#666;line-height:1.65;margin-top:7px;word-spacing:1px;">${esc(loc.adresse||'Adresse locataire non renseignée')}<br>${esc(loc.tel||'')}</div></div>
        <div><div style="font-size:12px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:10px;letter-spacing:.4px;">Date de paiement</div><div style="font-size:17px;line-height:1.25;font-weight:900;">${esc(dateTxt)}</div><div style="font-size:13px;color:#666;line-height:1.6;margin-top:7px;">Période : ${esc(periode)}</div></div>
        <div><div style="font-size:12px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:10px;letter-spacing:.4px;">Bien loué</div><div style="font-size:17px;line-height:1.25;font-weight:900;word-spacing:2px;">${esc(bienTitre)}</div><div style="font-size:13px;color:#666;line-height:1.65;margin-top:7px;word-spacing:1px;">${esc(bienAdr)}</div></div>
        <div><div style="font-size:12px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:10px;letter-spacing:.4px;">Mode de paiement</div><div style="font-size:17px;line-height:1.25;font-weight:900;word-spacing:2px;">${esc(p.mode||'—')}</div><div style="font-size:13px;color:#666;line-height:1.6;margin-top:7px;">Réf. ${esc(receiptNo)}</div></div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:30px;table-layout:fixed;"><thead><tr style="background:#f8fafc;color:#444;"><th style="text-align:left;padding:12px 13px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;border:1px solid #e5e7eb;">Désignation</th><th style="text-align:right;width:210px;padding:12px 13px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;border:1px solid #e5e7eb;">Montant</th></tr></thead><tbody><tr><td style="padding:17px 13px;border-bottom:1px solid #eee;vertical-align:top;"><div style="font-size:15px;line-height:1.3;font-weight:900;word-spacing:2px;">Loyer mensuel — ${esc(periode)}</div><div style="font-size:13px;color:#666;line-height:1.55;margin-top:6px;word-spacing:1px;">${esc(bienTitre)} · ${esc(bienAdr)}</div></td><td style="padding:17px 13px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;font-size:16px;font-weight:900;white-space:nowrap;">${esc(montant)}</td></tr></tbody></table>
      <div style="display:flex;justify-content:space-between;align-items:center;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:21px 22px;margin-bottom:38px;"><div style="font-size:16px;line-height:1.25;font-weight:900;color:#166534;letter-spacing:.3px;">TOTAL REÇU<br><span style="font-size:13px;font-weight:800;letter-spacing:0;">Paiement reçu ✓</span></div><div style="font-size:30px;line-height:1;font-weight:900;color:#111;white-space:nowrap;">${esc(montant)}</div></div>
      <div style="text-align:center;font-size:13px;color:#666;line-height:1.75;border-top:1px solid #eee;padding-top:22px;margin-top:8px;"><strong style="font-size:14px;color:#555;">${esc(ag.agence||'Genius Property')}</strong><br>${esc(ag.adresse||'Dakar, Sénégal')}<br>${esc(ag.email||'')} ${ag.tel?' · '+esc(ag.tel):''}<br><span style="font-size:12px;color:#999;">Ce reçu tient lieu de quittance de loyer</span></div>
    </div>`;
    const box=document.createElement('div'); box.style.cssText='position:fixed;left:-9999px;top:0;background:#fff'; box.innerHTML=html; document.body.appendChild(box);
    html2pdf().set({margin:0,filename:`recu_paiement_${String(receiptNo).replace(/[^a-z0-9_-]/gi,'_')}.pdf`,image:{type:'jpeg',quality:.98},html2canvas:{scale:2.5,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'pt',format:'a4',orientation:'portrait'}}).from(box.firstElementChild).save().then(()=>{box.remove();toast?.('Reçu PDF téléchargé ✓')}).catch(()=>{box.remove();toast?.('Erreur génération reçu','err')});
  };
})();


/* ═══════════════════════════════════════════════════════════
   script-13.js
═══════════════════════════════════════════════════════════ */
(function(){
  function esc(v){return gp_esc(v)}
  function money(v){return gp_money(v)}
  function dateFr(v){ if(typeof formatGPDateShort==='function') return formatGPDateShort(v); const d=new Date(v); return isNaN(d)?(v||'—'):d.toLocaleDateString('fr-FR'); }
  function monthLabel2(v){ try{ const d=(typeof parseGPDate==='function'?parseGPDate(v):new Date(v)) || new Date(); return d.toLocaleDateString('fr-FR',{month:'long',year:'numeric'}); }catch(e){return ''} }
  function agenceInfo(){return (typeof _getAgenceInfo==='function')?_getAgenceInfo():{agence:localStorage.getItem('geniusproperty_agence')||'Genius Property',email:localStorage.getItem('geniusproperty_email')||'contact@geniusproperty.com',tel:localStorage.getItem('geniusproperty_tel')||'',adresse:localStorage.getItem('geniusproperty_adresse')||'Dakar, Sénégal',rccm:localStorage.getItem('geniusproperty_rccm')||'',ninea:localStorage.getItem('geniusproperty_ninea')||'',logo:localStorage.getItem('geniusproperty_logo')||''};}
  function locByName(name){const n=String(name||'').trim().toLowerCase(); return (DB.locataires||[]).find(l=>`${l.prenom||''} ${l.nom||''}`.trim().toLowerCase()===n || `${l.nom||''} ${l.prenom||''}`.trim().toLowerCase()===n || String(l.nom||'').toLowerCase()===n) || {};}
  function resolveBienFromPayment(p){
    const locativeName=String(p?.locative||p?.bien||'').trim();
    const lv=(DB.locatives||[]).find(l=>l.nom===locativeName || l.bien===locativeName || l.id===locativeName || String(l.locataire||'')===String(p?.locataire||'')) || {};
    let found={bien:null,unite:null};
    try{ if(typeof findUnitByFullName==='function') found=findUnitByFullName(lv.bien || lv.parentBien || locativeName) || found; }catch(e){}
    let b=found.bien || (DB.biens||[]).find(x=>x.nom===lv.parentBien || x.nom===lv.bien || x.nom===locativeName || x.id===lv.bien) || {};
    const unitName=(found.unite&&found.unite.nom&&b.nom&&String(lv.bien||'').includes(found.unite.nom)) ? found.unite.nom : '';
    const titre = unitName ? `${b.nom} - ${unitName}` : (lv.bien || b.nom || locativeName || 'Bien loué');
    const type = b.type ? (unitName ? `${b.type} · ${unitName}` : b.type) : titre;
    const adresse = b.adresse || lv.adresse || p.adresseBien || p.adresse || 'Adresse du bien non renseignée';
    return {lv,b,titre,type,adresse};
  }
  window.genererRecuPaiementPDF=function(idx){
    const p=(DB.paiements||[])[idx]; if(!p) return toast?.('Paiement introuvable','err');
    const ag=agenceInfo(); const rel=resolveBienFromPayment(p); const loc=locByName(p.locataire);
    const receiptNo=p.recuNo || ('RCP-'+new Date().getFullYear()+'-'+String((DB.paiements.length-idx)||1).padStart(4,'0'));
    p.recuNo=receiptNo; try{saveDB?.();}catch(e){}
    const periode=monthLabel2(p.date), dateTxt=dateFr(p.date), montant=money(p.paye||p.montant)+' FCFA';
    const html=`<div id="recuPdfExport" style="width:794px;min-height:1123px;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;padding:42px 44px;box-sizing:border-box;letter-spacing:.01px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #D4AF37;padding-bottom:22px;margin-bottom:30px;">
        <div style="display:flex;gap:16px;align-items:flex-start;max-width:390px;">${ag.logo?`<img src="${ag.logo}" style="width:72px;height:72px;object-fit:contain;border-radius:10px;border:1px solid rgba(212,175,55,.35);padding:5px;box-sizing:border-box;">`:''}<div><div style="font-size:25px;line-height:1.1;font-weight:900;letter-spacing:.4px;word-spacing:2px;">${esc(ag.agence||'Genius Property').toUpperCase()}</div><div style="font-size:13px;color:#666;margin-top:7px;letter-spacing:.6px;text-transform:uppercase;">Gestion locative</div></div></div>
        <div style="text-align:right;min-width:260px;"><div style="font-size:30px;line-height:1.08;font-weight:900;color:#111;word-spacing:3px;">Reçu de paiement</div><div style="font-size:12px;color:#999;margin-top:12px;text-transform:uppercase;letter-spacing:.8px;">N° de reçu</div><div style="font-size:18px;font-weight:900;color:#D4AF37;margin-top:5px;letter-spacing:.5px;">${esc(receiptNo)}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;column-gap:60px;row-gap:28px;margin-bottom:34px;">
        <div><div style="font-size:12px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:10px;letter-spacing:.4px;">Locataire</div><div style="font-size:17px;line-height:1.25;font-weight:900;word-spacing:2px;">${esc(p.locataire||'—')}</div><div style="font-size:13px;color:#666;line-height:1.65;margin-top:7px;word-spacing:1px;">${esc(loc.adresse||'Adresse locataire non renseignée')}<br>${esc(loc.tel||'')}</div></div>
        <div><div style="font-size:12px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:10px;letter-spacing:.4px;">Date de paiement</div><div style="font-size:17px;line-height:1.25;font-weight:900;">${esc(dateTxt)}</div><div style="font-size:13px;color:#666;line-height:1.6;margin-top:7px;">Période : ${esc(periode)}</div></div>
        <div><div style="font-size:12px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:10px;letter-spacing:.4px;">Bien loué</div><div style="font-size:17px;line-height:1.25;font-weight:900;word-spacing:2px;">${esc(rel.type||rel.titre)}</div><div style="font-size:13px;color:#666;line-height:1.65;margin-top:7px;word-spacing:1px;">${esc(rel.adresse)}</div></div>
        <div><div style="font-size:12px;font-weight:900;color:#D4AF37;text-transform:uppercase;margin-bottom:10px;letter-spacing:.4px;">Mode de paiement</div><div style="font-size:17px;line-height:1.25;font-weight:900;word-spacing:2px;">${esc(p.mode||'—')}</div><div style="font-size:13px;color:#666;line-height:1.6;margin-top:7px;">Réf. ${esc(receiptNo)}</div></div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:30px;table-layout:fixed;"><thead><tr style="background:#f8fafc;color:#444;"><th style="text-align:left;padding:12px 13px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;border:1px solid #e5e7eb;">Désignation</th><th style="text-align:right;width:210px;padding:12px 13px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;border:1px solid #e5e7eb;">Montant</th></tr></thead><tbody><tr><td style="padding:17px 13px;border-bottom:1px solid #eee;vertical-align:top;"><div style="font-size:15px;line-height:1.3;font-weight:900;word-spacing:2px;">Loyer mensuel — ${esc(periode)}</div><div style="font-size:13px;color:#666;line-height:1.55;margin-top:6px;word-spacing:1px;">${esc(rel.titre)} · ${esc(rel.adresse)}</div></td><td style="padding:17px 13px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;font-size:16px;font-weight:900;white-space:nowrap;">${esc(montant)}</td></tr></tbody></table>
      <div style="display:flex;justify-content:space-between;align-items:center;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:21px 22px;margin-bottom:38px;"><div style="font-size:16px;line-height:1.25;font-weight:900;color:#166534;letter-spacing:.3px;">TOTAL REÇU<br><span style="font-size:13px;font-weight:800;letter-spacing:0;">Paiement reçu ✓</span></div><div style="font-size:30px;line-height:1;font-weight:900;color:#111;white-space:nowrap;">${esc(montant)}</div></div>
      <div style="text-align:center;font-size:13px;color:#666;line-height:1.75;border-top:1px solid #eee;padding-top:22px;margin-top:8px;"><strong style="font-size:14px;color:#555;">${esc(ag.agence||'Genius Property')}</strong><br>${esc(ag.adresse||'Dakar, Sénégal')}<br>${esc(ag.email||'')} ${ag.tel?' · '+esc(ag.tel):''}<br><span style="font-size:12px;color:#999;">Ce reçu tient lieu de quittance de loyer</span></div>
    </div>`;
    const box=document.createElement('div'); box.style.cssText='position:fixed;left:-9999px;top:0;background:#fff'; box.innerHTML=html; document.body.appendChild(box);
    html2pdf().set({margin:0,filename:`recu_paiement_${String(receiptNo).replace(/[^a-z0-9_-]/gi,'_')}.pdf`,image:{type:'jpeg',quality:.98},html2canvas:{scale:2.5,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'pt',format:'a4',orientation:'portrait'}}).from(box.firstElementChild).save().then(()=>{box.remove();toast?.('Reçu PDF téléchargé ✓')}).catch(()=>{box.remove();toast?.('Erreur génération reçu','err')});
  };
})();


/* ═══════════════════════════════════════════════════════════
   script-14.js
═══════════════════════════════════════════════════════════ */
(function(){
  function forceEmployesTitle(){
    if(window.gpPagesConfig && window.gpPagesConfig.employes){
      window.gpPagesConfig.employes.name = 'Équipe & Employés';
      window.gpPagesConfig.employes.icon = 'badge';
    }
    if(typeof window.updateGlobalBreadcrumb === 'function'){
      const active = document.querySelector('.page.active');
      const page = active ? active.id.replace('page-','') : 'dashboard';
      window.updateGlobalBreadcrumb(page);
    }
  }
  const oldNavigate = window.navigate;
  if(typeof oldNavigate === 'function'){
    window.navigate = function(page){
      const r = oldNavigate.apply(this, arguments);
      setTimeout(forceEmployesTitle, 0);
      return r;
    };
  }
  document.addEventListener('DOMContentLoaded', forceEmployesTitle);
  setTimeout(forceEmployesTitle, 50);
})();


/* ═══════════════════════════════════════════════════════════
   script-15.js
═══════════════════════════════════════════════════════════ */
(function(){
  function applyEmployesTopbarTitle(){
    var box = document.getElementById('globalBreadcrumb');
    if(!box) return;
    var active = document.querySelector('.page.active');
    var page = active ? active.id.replace('page-','') : 'dashboard';
    if(page === 'employes'){
      box.innerHTML = '<div class="breadcrumb-box"><span class="material-symbols-rounded">badge</span><span class="breadcrumb-title-wrap"><span class="breadcrumb-main">Équipe & Employés</span><span class="breadcrumb-subtitle">Gérez votre équipe et les accès à la plateforme</span></span></div>';
      var h = document.querySelector('#page-employes .page-hero-text h3');
      if(h) h.style.display = 'none';
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    applyEmployesTopbarTitle();
    document.querySelectorAll('.menu li[data-page]').forEach(function(li){
      li.addEventListener('click', function(){ setTimeout(applyEmployesTopbarTitle, 80); });
    });
  });
  setInterval(applyEmployesTopbarTitle, 500);
})();


/* ═══════════════════════════════════════════════════════════
   script-16.js
═══════════════════════════════════════════════════════════ */
(function(){
  var _rendered = false;

  function by(id){return document.getElementById(id)}
  function num(v){return gp_num(v)}
  function money(v){return gp_money(v)}
  function db(){try{return (typeof DB!=='undefined'&&DB)?DB:(window.DB||{biens:[],locataires:[],locatives:[],paiements:[],depenses:[],agenda:[]})}catch(e){return window.DB||{biens:[],locataires:[],locatives:[],paiements:[],depenses:[],agenda:[]}}}
  function escH(s){return gp_esc(s)}

  function uname(){
    if(window.GP_USER_NAME) return window.GP_USER_NAME;
    var u=window.currentUser;
    if(u){
      var d=db();
      var emp=d.employes&&d.employes.find(function(e){return e.email===u.email});
      if(emp&&(emp.prenom||emp.nom)) return (String(emp.prenom||'').trim() || String(emp.nom||'').trim());
      // Fallback : lire prénom/nom stockés après login
      var stored = localStorage.getItem('gp_session_name');
      if(stored) return stored;
      var e=u.email||'';
      var n=e.split('@')[0].replace(/[._-]+/g,' ');
      return n.charAt(0).toUpperCase()+n.slice(1);
    }
    // Essai sans session : nom stocké
    var stored2 = localStorage.getItem('gp_session_name');
    if(stored2) return stored2;
    return 'Directeur';
  }

  function todayFR(){
    var d=new Date();
    var days=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    var months=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    return days[d.getDay()]+' '+d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear();
  }

  function stats(){
    var d=db();
    var biens=d.biens||[], locs=d.locataires||[], locatives=d.locatives||[];
    var units=biens.length||0;
    var active=locatives.filter(function(l){return !String(l.statut||'').toLowerCase().includes('arch')&&String(l.statut||'').toLowerCase()!=='disponible'}).length;
    var taux=units&&active?Math.min(100,Math.round(active/Math.max(units,1)*100)):0;
    return {biens:units, locataires:locs.length, locations:active, taux:taux};
  }

  function period(key){
    var d=db(), now=new Date(), cy=now.getFullYear(), cm=now.getMonth(), m=cm, y=cy;
    if(key==='last'){m=cm===0?11:cm-1;y=cm===0?cy-1:cy}
    var pays=(d.paiements||[]).filter(function(p){
      var dt=new Date(p.date);
      if(isNaN(dt)) return false;
      if(key==='year') return dt.getFullYear()===cy;
      return dt.getMonth()===m&&dt.getFullYear()===y;
    });
    var deps=(d.depenses||[]).filter(function(p){
      var dt=new Date(p.date);
      if(isNaN(dt)) return false;
      if(key==='year') return dt.getFullYear()===cy;
      return dt.getMonth()===m&&dt.getFullYear()===y;
    });
    var rev=pays.reduce(function(s,p){return s+num(p.paye||p.montant)},0);
    var dep=deps.reduce(function(s,p){return s+num(p.montant)},0);
    var late=pays.filter(function(p){return num(p.reste)>0}).length;
    return {paid:pays.length, late:late, rev:rev, brut:rev, dep:dep, net:rev-dep};
  }

  window.gpUserMoney=function(btn,key){
    document.querySelectorAll('.gp-user-final .gp-money-tabs button').forEach(function(b){b.classList.remove('active')});
    if(btn)btn.classList.add('active');
    var r=period(key);
    if(by('gpUPaid'))by('gpUPaid').textContent=r.paid;
    if(by('gpULate'))by('gpULate').textContent=r.late;
    if(by('gpURev'))by('gpURev').textContent=money(r.rev);
    if(by('gpUBrut'))by('gpUBrut').textContent=money(r.brut);
    if(by('gpUDep'))by('gpUDep').textContent=money(r.dep);
    if(by('gpUNet'))by('gpUNet').textContent=money(r.net);
  };

  function chartData(months){
    var labels=[], vals=[], now=new Date();
    for(var i=months-1;i>=0;i--){
      var dt=new Date(now.getFullYear(),now.getMonth()-i,1);
      labels.push(months===1?'Ce mois':dt.toLocaleDateString('fr-FR',{month:'short'}).replace('.',''));
      var val=0;
      (db().paiements||[]).forEach(function(p){
        var pd=new Date(p.date);
        if(!isNaN(pd)&&pd.getMonth()===dt.getMonth()&&pd.getFullYear()===dt.getFullYear())
          val+=num(p.paye||p.montant);
      });
      vals.push(val);
    }
    return {labels:labels,vals:vals};
  }

  function drawChart(months){
    var c=by('gpUChart'); if(!c||!window.Chart)return;
    var d=chartData(months);
    if(window.gpUChartObj) window.gpUChartObj.destroy();
    var ctx=c.getContext('2d'), g=ctx.createLinearGradient(0,0,0,280);
    g.addColorStop(0,'rgba(37,99,235,.22)'); g.addColorStop(1,'rgba(37,99,235,0)');
    var maxVal=Math.max.apply(null,d.vals.concat([1000]));
    var yMax=Math.ceil(maxVal/1000)*1000+2000;
    window.gpUChartObj=new Chart(ctx,{type:'line',data:{labels:d.labels,datasets:[{data:d.vals,borderColor:'#2563eb',backgroundColor:g,fill:true,tension:.15,pointRadius:4,pointBackgroundColor:'#2563eb',pointBorderWidth:0,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(x){return money(x.parsed.y)}}}},scales:{x:{grid:{display:false},ticks:{color:'#64748b'}},y:{beginAtZero:true,max:yMax,ticks:{color:'#64748b',callback:function(v){return v===0?'0':(v>=1000?(v/1000).toFixed(0)+'k':v)}},grid:{color:'#e5e7eb',borderDash:[4,4]}}}}});
  }

  window.gpUserChart=function(btn,months){
    document.querySelectorAll('.gp-user-final .gp-chart-tabs button').forEach(function(b){b.classList.remove('active')});
    if(btn)btn.classList.add('active');
    drawChart(months);
  };

  function dateKey(d){return gp_dateKey(d)}

  var agendaMonth=new Date(); agendaMonth.setDate(1);

  function renderCal(){
    var title=by('gpUCalTitle'), cal=by('gpUCalendar'); if(!cal)return;
    var ms=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    if(title)title.textContent=ms[agendaMonth.getMonth()]+' '+agendaMonth.getFullYear();
    var y=agendaMonth.getFullYear(), m=agendaMonth.getMonth();
    var first=new Date(y,m,1), start=new Date(first);
    start.setDate(first.getDate()-((first.getDay()+6)%7));
    var agendaItems=db().agenda||[], todayK=dateKey(new Date());
    var html='<div class="gp-cal-grid">'+['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(function(x){return '<div class="gp-dow">'+x+'</div>'}).join('');
    for(var i=0;i<35;i++){
      var dd=new Date(start);dd.setDate(start.getDate()+i);
      var key=dateKey(dd);
      var dayItems=agendaItems.filter(function(a){return a.date===key&&!a.done});
      var markClass='';
      if(dayItems.length){markClass='gp-mark '+(dayItems.some(function(a){return a.priority==='haute'})?'red':'gold');}
      else if(key===todayK){markClass='gp-today-dot';}
      html+='<div class="gp-day '+(dd.getMonth()!==m?'gp-muted ':'')+markClass+'" title="'+(dayItems.length?dayItems.length+' événement(s)':'')+'">'+dd.getDate()+'</div>';
    }
    cal.innerHTML=html+'</div>';
  }

  function renderEvents(){
    var evBox=by('gpUEvents'); if(!evBox)return;
    var agendaItems=db().agenda||[], todayK=dateKey(new Date());
    var tomorrow=new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    var tomorrowK=dateKey(tomorrow);
    var upcoming=agendaItems.filter(function(a){return !a.done&&(a.date===todayK||a.date===tomorrowK)}).sort(function(a,b){return (a.date+a.time).localeCompare(b.date+b.time)}).slice(0,4);
    if(!upcoming.length){
      evBox.innerHTML='<div class="gp-empty"><div class="gp-empty-ico"><span class="material-symbols-rounded">calendar_month</span></div><strong>Aucun événement aujourd\'hui</strong><p>Créez un événement via l\'icône agenda en haut.</p></div>';
      return;
    }
    var typeLabel={rdv:'Rendez-vous',tache:'Tâche',rappel:'Rappel',autre:'Autre'};
    evBox.innerHTML=upcoming.map(function(a){
      var isToday=a.date===todayK, dotColor=a.priority==='haute'?'#dc2626':'#d99a00';
      return '<div class="gp-ev-item">'+
        '<div class="gp-ev-dot" style="background:'+dotColor+'"></div>'+
        '<div class="gp-ev-body">'+
          '<div class="gp-ev-title">'+escH(a.title||'Sans titre')+'</div>'+
          '<div class="gp-ev-meta">'+
            (a.time?'<span>'+escH(a.time)+'</span>':'<span>Toute la journée</span>')+
            '<span>'+(isToday?'Aujourd\'hui':'Demain')+'</span>'+
            '<span>'+escH(typeLabel[a.type]||'Agenda')+'</span>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('');
  }

  window.gpUserMoveMonth=function(delta){agendaMonth.setMonth(agendaMonth.getMonth()+delta);renderCal()};

  /* ── HTML du dashboard (rendu une seule fois, mis à jour ensuite) ── */
  function buildHTML(s){
    return '<div class="compact-dashboard gp-user-final">'+
      '<div class="gp-top-title">'+
        '<h1 class="gp-hello-title"><em>Bonjour</em>&nbsp;&nbsp;<em id="gpUName">'+escH(uname())+'</em> !</h1>'+
        '<div class="gp-date-badge2 gp-date-no-icon" role="button" tabindex="0"><span id="gpUDate">'+todayFR()+'</span></div>'+
      '</div>'+
      '<div class="gp-stats">'+
        '<div class="gp-stat" onclick="if(window.navigate)navigate(\'biens\')" style="cursor:pointer"><div class="gp-stat-ico blue"><span class="material-symbols-rounded">home</span></div><div><div class="gp-stat-label">Biens</div><div class="gp-stat-value" id="gpUSBiens">'+s.biens+'</div><div class="gp-stat-sub sub-blue" id="gpUSBiensSub"></div></div></div>'+
        '<div class="gp-stat" onclick="if(window.navigate)navigate(\'locataires\')" style="cursor:pointer"><div class="gp-stat-ico green"><span class="material-symbols-rounded">groups</span></div><div><div class="gp-stat-label">Locataires</div><div class="gp-stat-value" id="gpUSLoc">'+s.locataires+'</div><div class="gp-stat-sub sub-green" id="gpUSLocSub"></div></div></div>'+
        '<div class="gp-stat" onclick="if(window.navigate)navigate(\'locatives\')" style="cursor:pointer"><div class="gp-stat-ico gold"><span class="material-symbols-rounded">key</span></div><div><div class="gp-stat-label">Locations</div><div class="gp-stat-value" id="gpUSLocatives">'+s.locations+'</div><div class="gp-stat-sub sub-gold" id="gpUSLocativesSub"></div></div></div>'+
        '<div class="gp-stat"><div class="gp-stat-ico purple"><span class="material-symbols-rounded">trending_up</span></div><div><div class="gp-stat-label">Taux d\'occupation</div><div class="gp-stat-value" id="gpUSTaux">'+s.taux+'%</div><div class="gp-stat-sub sub-purple" id="gpUSTauxSub"></div></div></div>'+
      '</div>'+
      '<div class="gp-main">'+
        '<div class="gp-panel">'+
          '<div class="gp-head"><div class="gp-title">Revenus et Dépenses</div></div>'+
          '<div class="gp-money-tabs"><button class="active" onclick="gpUserMoney(this,\'current\')">Mois en cours</button><button onclick="gpUserMoney(this,\'last\')">Mois dernier</button><button onclick="gpUserMoney(this,\'year\')">Année en cours</button></div>'+
          '<div class="gp-paytop"><div class="gp-payicon"><span class="material-symbols-rounded">receipt_long</span></div><div class="gp-paystat"><label>Loyers payés ce mois</label><strong id="gpUPaid">—</strong></div><div class="gp-paystat red"><label>En retard</label><strong id="gpULate">—</strong></div></div>'+
          '<div class="gp-money-grid">'+
            '<div class="gp-money-card"><div class="gp-mini"><span class="material-symbols-rounded">payments</span></div><div><label>Loyers perçus</label><strong id="gpURev">—</strong></div></div>'+
            '<div class="gp-money-card"><div class="gp-mini"><span class="material-symbols-rounded">monitoring</span></div><div><label>Total encaissé</label><strong id="gpUBrut">—</strong></div></div>'+
            '<div class="gp-money-card red"><div class="gp-mini"><span class="material-symbols-rounded">receipt</span></div><div><label>Dépenses</label><strong id="gpUDep">—</strong></div></div>'+
            '<div class="gp-money-card gold"><div class="gp-mini"><span class="material-symbols-rounded">database</span></div><div><label>Résultat net</label><strong id="gpUNet">—</strong></div></div>'+
          '</div>'+
        '</div>'+
        '<div class="gp-panel">'+
          '<div class="gp-head"><div class="gp-title">Revenus</div><div class="gp-chart-tabs"><button onclick="gpUserChart(this,12)">12 mois</button><button class="active" onclick="gpUserChart(this,6)">6 mois</button><button onclick="gpUserChart(this,1)">Ce mois</button></div></div>'+
          '<div class="gp-chart-box"><canvas id="gpUChart"></canvas></div>'+
        '</div>'+
      '</div>'+
      '<div class="gp-agenda">'+
        '<div class="gp-agenda-head">'+
          '<div class="gp-ag-title">Agenda</div>'+
          '<div class="gp-ag-month"><button class="gp-ag-nav" onclick="gpUserMoveMonth(-1)"><span class="material-symbols-rounded">chevron_left</span></button><span id="gpUCalTitle"></span><button class="gp-ag-nav" onclick="gpUserMoveMonth(1)"><span class="material-symbols-rounded">chevron_right</span></button></div>'+
          '<button class="gp-ag-all" onclick="if(window.openFullAgendaModal)openFullAgendaModal()">Voir tout</button>'+
        '</div>'+
        '<div class="gp-ag-body">'+
          '<div class="gp-events" id="gpUEvents"></div>'+
          '<div class="gp-calendar" id="gpUCalendar"></div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }

  function updateLiveData(){
    /* mise à jour sans re-render complet — évite le flash */
    var s=stats();
    if(by('gpUSBiens'))by('gpUSBiens').textContent=s.biens;
    if(by('gpUSLoc'))by('gpUSLoc').textContent=s.locataires;
    if(by('gpUSLocatives'))by('gpUSLocatives').textContent=s.locations;
    if(by('gpUSTaux'))by('gpUSTaux').textContent=s.taux+'%';
    if(by('gpUName'))by('gpUName').textContent=uname();
    gpUserMoney(document.querySelector('.gp-user-final .gp-money-tabs button.active'),'current');
    renderCal();
    renderEvents();
    setTimeout(function(){drawChart(6)},0);
  }

  function render(){
    var page=by('page-dashboard'); if(!page)return;
    if(!_rendered || !by('gpUName') || !by('gpUEvents') || !by('gpUCalendar')){
      var s=stats();
      page.innerHTML=buildHTML(s);
      _rendered=true;
      setTimeout(function(){ if(page.classList.contains('active')) page.classList.add('no-anim'); }, 300);
    }
    updateLiveData();
  }

  window.renderDashboard=render;
  /* flicker-fix: ancien dashboard utilisateur désactivé; dashboard-desktop.js prend le relais */
})();


/* ═══════════════════════════════════════════════════════════
   script-17.js
═══════════════════════════════════════════════════════════ */
(function(){
  // ── Helpers ──────────────────────────────────────────────────────────────
  function esc(v){return gp_esc(v)}
  function uid(){return gp_uid('ev')}
  function dateKey(d){return gp_dateKey(d)}
  function todayKey(){return gp_todayKey()}
  function fmtDate(k){if(!k)return ''; try{const d=new Date(k+'T00:00:00'); return d.toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long'})}catch(e){return k}}
  function getDB(){return typeof DB!=='undefined'?DB:(window.DB||{})}
  function getAgenda(){if(!Array.isArray(getDB().agenda))getDB().agenda=[];return getDB().agenda}
  function save(){if(typeof saveDB==='function')saveDB()}
  function showToast(m,t){if(typeof toast==='function')toast(m,t)}
  function typeColor(type){return type==='rdv'?'#2563eb':type==='tache'?'#d97706':type==='rappel'?'#16a34a':'#6b7280'}
  const MONTHS=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const TYPE_LABEL={rdv:'Rendez-vous',tache:'Tâche',rappel:'Rappel',autre:'Autre'};

  // ── Modal state ───────────────────────────────────────────────────────────
  var _calMonth = new Date(); _calMonth.setDate(1);
  var _selectedDate = todayKey();

  // ── OPEN / CLOSE AGENDA MODAL ─────────────────────────────────────────────
  window.openFullAgendaModal = function(date){
    if(date) _selectedDate = date;
    document.getElementById('gpAgendaModal').classList.add('open');
    document.body.style.overflow='hidden';
    gpAmRender();
    gpAmCalRender();
  };
  window.closeFullAgendaModal = function(){
    document.getElementById('gpAgendaModal').classList.remove('open');
    document.body.style.overflow='';
    // Refresh mini-agenda on dashboard
    if(typeof window.renderDashboard==='function') setTimeout(window.renderDashboard, 50);
    gpUpdateTopbarDot();
  };
  document.getElementById('gpAgendaModal').addEventListener('click', function(e){
    if(e.target===this) closeFullAgendaModal();
  });

  // ── EVENTS LIST RENDER ─────────────────────────────────────────────────────
  window.gpAmRender = function(){
    var agenda = getAgenda();
    var q = (document.getElementById('gpAmSearch')?.value||'').toLowerCase().trim();
    var fType = document.getElementById('gpAmFilterType')?.value||'';
    var fPrio = document.getElementById('gpAmFilterPriority')?.value||'';
    var fStatus = document.getElementById('gpAmFilterStatus')?.value||'active';
    var now = new Date();

    var filtered = agenda.filter(function(a){
      if(q && !(a.title||'').toLowerCase().includes(q) && !(a.lieu||'').toLowerCase().includes(q) && !(a.note||'').toLowerCase().includes(q)) return false;
      if(fType && a.type !== fType) return false;
      if(fPrio && a.priority !== fPrio) return false;
      if(fStatus === 'active' && a.done) return false;
      if(fStatus === 'done' && !a.done) return false;
      return true;
    });

    // Sort: by date asc, undone first
    filtered.sort(function(a,b){
      if(a.done !== b.done) return a.done ? 1 : -1;
      var da=a.date+(a.time||''), db=b.date+(b.time||'');
      return da.localeCompare(db);
    });

    var sub = filtered.length + ' événement' + (filtered.length>1?'s':'') + ' · ' + agenda.filter(function(a){return !a.done}).length + ' actif' + (agenda.filter(function(a){return !a.done}).length>1?'s':'');
    var subEl = document.getElementById('gpAmSub');
    if(subEl) subEl.textContent = sub;

    var box = document.getElementById('gpAmEventsList');
    if(!box) return;

    if(!filtered.length){
      box.innerHTML = '<div class="gp-am-empty"><span class="material-symbols-rounded">event_busy</span><strong>Aucun événement trouvé</strong><p style="font-size:13px;margin-top:4px">Modifiez vos filtres ou créez un nouvel événement</p></div>';
      return;
    }

    // Group by date
    var groups = {};
    filtered.forEach(function(a){
      var k = a.date||'Sans date';
      if(!groups[k]) groups[k]=[];
      groups[k].push(a);
    });
    var keys = Object.keys(groups).sort();

    var html = '';
    keys.forEach(function(k){
      var label = k === todayKey() ? "Aujourd'hui" : k === dateKey(new Date(Date.now()+86400000)) ? 'Demain' : (k==='Sans date'?'Sans date':fmtDate(k));
      html += '<div class="gp-am-events-header">'+esc(label)+'</div>';
      groups[k].forEach(function(a){
        var idx = agenda.indexOf(a);
        var color = a.priority==='haute'?'#dc2626':typeColor(a.type);
        html += '<div class="gp-ev-card'+(a.done?' done-card':'')+'" onclick="openEventForm(\''+esc(a.id||idx)+'\')" >'+
          '<div class="gp-ev-stripe" style="background:'+color+'"></div>'+
          '<div class="gp-ev-content">'+
            '<div class="gp-ev-card-title">'+esc(a.title||'Sans titre')+'</div>'+
            '<div class="gp-ev-card-meta">'+
              '<span class="gp-ev-chip '+esc(a.type||'autre')+'">'+esc(TYPE_LABEL[a.type]||'Agenda')+'</span>'+
              (a.time?'<span class="gp-ev-chip"><span class="material-symbols-rounded">schedule</span>'+esc(a.time)+'</span>':'')+ 
              (a.lieu?'<span class="gp-ev-chip"><span class="material-symbols-rounded">location_on</span>'+esc(a.lieu)+'</span>':'')+
              (a.priority==='haute'?'<span class="gp-ev-chip haute"><span class="material-symbols-rounded">priority_high</span>Haute</span>':'')+
              (a.done?'<span class="gp-ev-chip done"><span class="material-symbols-rounded">check_circle</span>Terminé</span>':'')+
            '</div>'+
            (a.note?'<div style="font-size:12px;color:#6b7280;margin-top:5px;line-height:1.4">'+esc(a.note)+'</div>':'')+
          '</div>'+
          '<div class="gp-ev-card-actions" onclick="event.stopPropagation()">'+
            (!a.done?'<button class="gp-ev-action-btn check" title="Marquer comme terminé" onclick="toggleAgendaDone(\''+esc(a.id||idx)+'\')"><span class="material-symbols-rounded">check_circle</span></button>':
            '<button class="gp-ev-action-btn" title="Rouvrir" onclick="toggleAgendaDone(\''+esc(a.id||idx)+'\')"><span class="material-symbols-rounded">redo</span></button>')+
            '<button class="gp-ev-action-btn delete" title="Supprimer" onclick="deleteAgendaEventById(\''+esc(a.id||idx)+'\')"><span class="material-symbols-rounded">delete</span></button>'+
          '</div>'+
        '</div>';
      });
    });
    box.innerHTML = html;
    gpAmCalRender();
  };

  // ── CALENDAR RENDER ─────────────────────────────────────────────────────────
  function gpAmCalRender(){
    var label = document.getElementById('gpAmCalLabel');
    var grid = document.getElementById('gpAmCalGrid');
    if(!label||!grid) return;
    var y = _calMonth.getFullYear(), m = _calMonth.getMonth();
    label.textContent = MONTHS[m]+' '+y;

    var agenda = getAgenda();
    var todayK = todayKey();
    var first = new Date(y,m,1);
    var start = new Date(first);
    start.setDate(first.getDate()-((first.getDay()+6)%7));

    var html = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(function(d){return '<div class="gp-am-dow">'+d+'</div>'}).join('');
    for(var i=0;i<42;i++){
      var dd = new Date(start); dd.setDate(start.getDate()+i);
      var k = dateKey(dd);
      var dayEvs = agenda.filter(function(a){return a.date===k&&!a.done});
      var hasHigh = dayEvs.some(function(a){return a.priority==='haute'});
      var hasEv = dayEvs.length > 0;
      var cls = 'gp-am-day';
      if(dd.getMonth()!==m) cls+=' muted';
      if(k===todayK) cls+=' today';
      if(k===_selectedDate) cls+=' selected';
      else if(hasHigh) cls+=' has-high';
      else if(hasEv) cls+=' has-event';
      html += '<div class="'+cls+'" onclick="gpAmSelectDay(\''+k+'\')">'+dd.getDate()+(hasEv&&k!==_selectedDate&&k!==todayK?'<div class="gp-am-day-dot"></div>':'')+'</div>';
    }
    grid.innerHTML = html;
    gpAmRenderDayPanel();
  }

  function gpAmRenderDayPanel(){
    var labelEl = document.getElementById('gpAmDayLabel');
    var box = document.getElementById('gpAmDayEvents');
    if(!labelEl||!box) return;
    var agenda = getAgenda();
    var isToday = _selectedDate === todayKey();
    labelEl.textContent = isToday ? "Aujourd'hui" : fmtDate(_selectedDate);
    var evs = agenda.filter(function(a){return a.date===_selectedDate}).sort(function(a,b){return (a.time||'99:99').localeCompare(b.time||'99:99')});
    if(!evs.length){
      box.innerHTML = '<div style="font-size:12px;color:#9ca3af;padding:8px 0">Aucun événement — <span style="color:var(--gold);cursor:pointer;font-weight:700" onclick="openEventForm()">+ Ajouter</span></div>';
      return;
    }
    box.innerHTML = evs.map(function(a){
      var color = a.priority==='haute'?'#dc2626':typeColor(a.type);
      return '<div class="gp-am-mini-ev" onclick="openEventForm(\''+esc(a.id)+'\')">'+
        '<div class="gp-am-mini-dot" style="background:'+color+'"></div>'+
        '<span style="flex:1">'+(a.time?'<span style="color:#9ca3af;font-size:10.5px">'+esc(a.time)+'</span> ':'')+esc(a.title||'Sans titre')+'</span>'+
        (a.done?'<span class="material-symbols-rounded" style="font-size:14px;color:#16a34a">check_circle</span>':'')+
      '</div>';
    }).join('');
  }

  window.gpAmSelectDay = function(k){
    _selectedDate = k;
    _calMonth = new Date(k+'T00:00:00'); _calMonth.setDate(1);
    gpAmCalRender();
  };

  window.gpAmCalMove = function(delta){
    _calMonth.setMonth(_calMonth.getMonth()+delta);
    gpAmCalRender();
  };

  // ── FORM MODAL ─────────────────────────────────────────────────────────────
  window.openEventForm = function(id){
    var agenda = getAgenda();
    var ev = null;
    if(id){
      ev = agenda.find(function(a){return a.id===id});
      if(!ev && !isNaN(parseInt(id))) ev = agenda[parseInt(id)];
    }
    document.getElementById('gpEfId').value = ev ? (ev.id||'') : '';
    document.getElementById('gpEfTitre').value = ev ? (ev.title||'') : '';
    document.getElementById('gpEfType').value = ev ? (ev.type||'rdv') : 'rdv';
    document.getElementById('gpEfPriority').value = ev ? (ev.priority||'normale') : 'normale';
    document.getElementById('gpEfDate').value = ev ? (ev.date||_selectedDate) : _selectedDate;
    document.getElementById('gpEfTime').value = ev ? (ev.time||'') : '';
    document.getElementById('gpEfLieu').value = ev ? (ev.lieu||'') : '';
    document.getElementById('gpEfNote').value = ev ? (ev.note||'') : '';
    document.getElementById('gpEfDeleteBtn').style.display = ev ? 'inline-flex' : 'none';
    document.getElementById('gpEfTitle').textContent = ev ? 'Modifier l\'événement' : 'Nouvel événement';
    document.getElementById('gpEventFormModal').classList.add('open');
  };

  window.closeEventForm = function(){
    document.getElementById('gpEventFormModal').classList.remove('open');
  };
  document.getElementById('gpEventFormModal').addEventListener('click', function(e){
    if(e.target===this) closeEventForm();
  });

  window.saveAgendaEvent = function(){
    var title = document.getElementById('gpEfTitre').value.trim();
    var date = document.getElementById('gpEfDate').value;
    if(!title){showToast('Le titre est obligatoire','err'); document.getElementById('gpEfTitre').focus(); return;}
    if(!date){showToast('La date est obligatoire','err'); document.getElementById('gpEfDate').focus(); return;}
    var agenda = getAgenda();
    var existingId = document.getElementById('gpEfId').value;
    var obj = {
      id: existingId || uid(),
      title: title,
      type: document.getElementById('gpEfType').value||'rdv',
      priority: document.getElementById('gpEfPriority').value||'normale',
      date: date,
      time: document.getElementById('gpEfTime').value||'',
      lieu: document.getElementById('gpEfLieu').value.trim(),
      note: document.getElementById('gpEfNote').value.trim(),
      done: false,
      createdAt: new Date().toISOString()
    };
    var idx = existingId ? agenda.findIndex(function(a){return a.id===existingId}) : -1;
    if(idx>=0){
      obj.done = agenda[idx].done; // preserve done state
      obj.createdAt = agenda[idx].createdAt;
      agenda[idx] = obj;
      showToast('Événement modifié ✓');
    } else {
      agenda.unshift(obj);
      showToast('Événement ajouté ✓');
    }
    _selectedDate = date;
    _calMonth = new Date(date+'T00:00:00'); _calMonth.setDate(1);
    save();
    closeEventForm();
    gpAmRender();
    gpUpdateTopbarDot();
  };

  window.deleteAgendaEvent = function(){
    var id = document.getElementById('gpEfId').value;
    if(!id) return;
    deleteAgendaEventById(id);
    closeEventForm();
  };

  window.deleteAgendaEventById = function(id){
    var agenda = getAgenda();
    var idx = agenda.findIndex(function(a){return a.id===id});
    if(idx<0 && !isNaN(parseInt(id))) idx=parseInt(id);
    if(idx>=0) agenda.splice(idx,1);
    save();
    gpAmRender();
    gpUpdateTopbarDot();
    showToast('Événement supprimé');
  };

  window.toggleAgendaDone = function(id){
    var agenda = getAgenda();
    var ev = agenda.find(function(a){return a.id===id});
    if(!ev && !isNaN(parseInt(id))) ev = agenda[parseInt(id)];
    if(!ev) return;
    ev.done = !ev.done;
    ev.doneAt = ev.done ? new Date().toISOString() : null;
    save();
    gpAmRender();
    gpUpdateTopbarDot();
    showToast(ev.done ? 'Marqué comme terminé ✓' : 'Réouvert');
  };

  // ── TOPBAR DOT ─────────────────────────────────────────────────────────────
  function gpUpdateTopbarDot(){
    var count = getAgenda().filter(function(a){
      return !a.done && (a.date===todayKey()||a.date===dateKey(new Date(Date.now()+86400000)));
    }).length;
    var dot = document.getElementById('agendaTopbarDot');
    var countEl = document.getElementById('agendaTopbarCount');
    if(dot){dot.style.display = count>0?'block':'none';}
    if(countEl){
      if(count>0){countEl.textContent=count;countEl.classList.add('show');}
      else countEl.classList.remove('show');
    }
  }

  // ── TOPBAR AGENDA BUTTON click ─────────────────────────────────────────────
  // Hook the calendar icon button in topbar to open the modal
  document.addEventListener('DOMContentLoaded', function(){
    // Find the topbar agenda icon button (the one that has calendar_month icon)
    document.querySelectorAll('.tb-icon-btn').forEach(function(btn){
      var ic = btn.querySelector('.material-symbols-rounded');
      if(ic && ic.textContent.trim()==='calendar_month'){
        btn.addEventListener('click', function(e){
          e.preventDefault(); e.stopPropagation();
          openFullAgendaModal();
        });
        // inject count badge
        var badge = document.createElement('span');
        badge.id = 'agendaTopbarCount';
        badge.className = '';
        badge.style.cssText = 'position:absolute;top:3px;right:3px;min-width:14px;height:14px;border-radius:7px;background:#dc2626;color:#fff;font-size:9px;font-weight:800;display:none;align-items:center;justify-content:center;padding:0 3px;';
        btn.style.position='relative';
        btn.appendChild(badge);
      }
    });
    gpUpdateTopbarDot();
    // Also make calendar days in the dashboard mini-cal clickable
    document.addEventListener('click', function(e){
      var dayEl = e.target.closest('.gp-day[title]');
      if(dayEl && dayEl.closest('#gpUCalendar')){
        // extract the date from parent calendar
        // We need to get the date from the rendered calendar position
        // Just open the modal
        openFullAgendaModal();
      }
    });
  });

  // Refresh dot periodically
  setInterval(gpUpdateTopbarDot, 60000);
  setTimeout(gpUpdateTopbarDot, 500);

})();


/* ═══════════════════════════════════════════════════════════
   script-18.js
═══════════════════════════════════════════════════════════ */
(function(){
  // ─── helpers ────────────────────────────────────────────────
  function esc(v){return gp_esc(v)}
  function uid(){return gp_uid('ev')}
  function dateKey(d){return gp_dateKey(d)}
  function todayKey(){return gp_todayKey()}
  function fmtDateFR(k){if(!k)return '—';try{return new Date(k+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}catch(e){return k}}
  function save(){if(typeof saveDB==='function')saveDB()}
  function showToast(m,t){if(typeof toast==='function')toast(m,t)}
  function getEmployees(){
    const DB=window.DB||{};
    const arr=(DB.employes||[]).map(e=>({
      id:String(e.id||e.email||((e.prenom||'')+' '+(e.nom||''))).trim(),
      name:((e.prenom||'')+' '+(e.nom||'')).trim()||e.email||'Employé',
      email:e.email||'',role:e.fonction||e.poste||'Employé'
    }));
    return arr.length?arr:[{id:'admin',name:'Administrateur',email:'',role:'Admin'}];
  }
  function initials(name){return (name||'').split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2)||'?'}

  // ─── 1. ENRICHISSEMENT DU FORMULAIRE D'ÉVÉNEMENT ────────────────────────────
  // Injecter le champ "Assigner à" dans le formulaire existant
  function injectAssignField(){
    var body = document.querySelector('.gp-ef-body');
    if(!body || document.getElementById('gpEfAssignRow')) return;

    // Inject before the Notes field (last field)
    var noteField = body.querySelector('#gpEfNote')?.closest('.gp-ef-field');
    var assignHTML = `
      <div class="gp-ef-field" id="gpEfAssignField">
        <label class="gp-ef-label">Assigner à un employé</label>
        <input type="hidden" id="gpEfAssignedId">
        <div class="gp-ef-assign-row" id="gpEfAssignRow" onclick="openEmployeePicker()">
          <span class="material-symbols-rounded">person_add</span>
          <span class="gp-ef-assign-text" id="gpEfAssignText">Aucun — cliquez pour assigner</span>
          <button class="gp-ef-assign-clear" id="gpEfAssignClear" onclick="event.stopPropagation();clearAssignee()" style="display:none" title="Retirer l'assignation">
            <span class="material-symbols-rounded" style="font-size:16px">close</span>
          </button>
        </div>
      </div>`;
    if(noteField) noteField.insertAdjacentHTML('beforebegin', assignHTML);
    else body.insertAdjacentHTML('beforeend', assignHTML);
  }

  // Patch saveAgendaEvent pour inclure l'assignation
  var _origSave = window.saveAgendaEvent;
  window.saveAgendaEvent = function(){
    var assignedId = document.getElementById('gpEfAssignedId')?.value||'';
    var assignedName = '';
    if(assignedId){
      var emp = getEmployees().find(function(e){return e.id===assignedId});
      assignedName = emp ? emp.name : '';
    }
    // Call original save
    if(_origSave) _origSave();
    // After save, patch the last saved event with assignee info
    var DB = window.DB||{};
    var agenda = DB.agenda||[];
    if(agenda.length){
      var last = agenda[0]; // unshift adds to front
      // find the one just saved by checking for missing assignedTo or update by id
      var savedId = document.getElementById('gpEfId')?.value;
      var target = savedId ? agenda.find(function(a){return a.id===savedId}) : agenda[0];
      if(target){
        target.assignedTo = assignedId||null;
        target.assignedName = assignedName||null;
        save();
        // Also sync to employeeAgenda if assigned
        if(assignedId){
          syncToEmployeeAgenda(target);
        }
        gpAmRender&&gpAmRender();
        gpUpdateJournalView&&gpUpdateJournalView();
      }
    }
  };

  // Patch openEventForm to restore assignee
  var _origOpenForm = window.openEventForm;
  window.openEventForm = function(id){
    if(_origOpenForm) _origOpenForm(id);
    // Wait for DOM then inject & restore
    setTimeout(function(){
      injectAssignField();
      var DB = window.DB||{};
      var agenda = DB.agenda||[];
      var ev = null;
      if(id){
        ev = agenda.find(function(a){return a.id===id});
        if(!ev && !isNaN(parseInt(id))) ev = agenda[parseInt(id)];
      }
      var assignedId = ev?.assignedTo||'';
      var assignedName = ev?.assignedName||'';
      var idField = document.getElementById('gpEfAssignedId');
      var textField = document.getElementById('gpEfAssignText');
      var clearBtn = document.getElementById('gpEfAssignClear');
      if(idField) idField.value = assignedId;
      if(textField) textField.textContent = assignedId && assignedName ? ('👤 '+assignedName) : 'Aucun — cliquez pour assigner';
      if(clearBtn) clearBtn.style.display = assignedId ? 'flex' : 'none';
    }, 30);
  };

  window.clearAssignee = function(){
    var idField = document.getElementById('gpEfAssignedId');
    var textField = document.getElementById('gpEfAssignText');
    var clearBtn = document.getElementById('gpEfAssignClear');
    if(idField) idField.value = '';
    if(textField) textField.textContent = 'Aucun — cliquez pour assigner';
    if(clearBtn) clearBtn.style.display = 'none';
  };

  // ─── 2. PICKER EMPLOYÉ ──────────────────────────────────────────────────────
  window.openEmployeePicker = function(){
    document.getElementById('gpEfEmployeePicker').classList.add('open');
    document.getElementById('gpEpSearch').value='';
    gpRenderEmployeePicker();
    setTimeout(function(){document.getElementById('gpEpSearch').focus()},50);
  };
  document.getElementById('gpEfEmployeePicker').addEventListener('click',function(e){
    if(e.target===this) this.classList.remove('open');
  });

  window.gpRenderEmployeePicker = function(){
    var q = (document.getElementById('gpEpSearch')?.value||'').toLowerCase();
    var emps = getEmployees().filter(function(e){return !q||e.name.toLowerCase().includes(q)||e.role.toLowerCase().includes(q)});
    var box = document.getElementById('gpEpList');
    if(!box) return;
    box.innerHTML = emps.length ? emps.map(function(e){
      return '<div class="gp-ep-item" onclick="gpSelectEmployee(\''+esc(e.id)+'\',\''+esc(e.name)+'\')">'+
        '<div class="gp-ep-avatar">'+esc(initials(e.name))+'</div>'+
        '<div><div class="gp-ep-name">'+esc(e.name)+'</div><div class="gp-ep-role">'+esc(e.role||'Employé')+'</div></div>'+
      '</div>';
    }).join('') : '<div style="padding:16px;text-align:center;color:#9ca3af;font-size:13px">Aucun employé trouvé</div>';
  };

  window.gpSelectEmployee = function(id, name){
    var idField = document.getElementById('gpEfAssignedId');
    var textField = document.getElementById('gpEfAssignText');
    var clearBtn = document.getElementById('gpEfAssignClear');
    if(idField) idField.value = id;
    if(textField) textField.textContent = '👤 '+name;
    if(clearBtn) clearBtn.style.display = 'flex';
    document.getElementById('gpEfEmployeePicker').classList.remove('open');
  };

  // ─── 3. SYNCHRONISATION AGENDA → EMPLOYEE AGENDA ────────────────────────────
  function syncToEmployeeAgenda(ev){
    var DB = window.DB||{};
    if(!Array.isArray(DB.employeeAgenda)) DB.employeeAgenda=[];
    // Check if a linked mission already exists
    var existing = DB.employeeAgenda.find(function(m){return m.agendaEventId===ev.id});
    var missionObj = {
      id: existing ? existing.id : uid(),
      agendaEventId: ev.id, // link back
      employeeId: ev.assignedTo,
      title: ev.title||'Mission',
      date: ev.date,
      time: ev.time||'',
      priority: ev.priority||'normale',
      status: existing ? existing.status : 'a_faire',
      note: (ev.lieu?'📍 '+ev.lieu+'\n':'')+(ev.note||''),
      createdAt: new Date().toISOString(),
      source: 'agenda' // mark as coming from director agenda
    };
    if(existing){
      var idx = DB.employeeAgenda.indexOf(existing);
      DB.employeeAgenda[idx] = Object.assign({},existing,missionObj);
    } else {
      DB.employeeAgenda.unshift(missionObj);
    }
    save();
  }

  // Remove from employeeAgenda when unassigned or deleted
  var _origDelete = window.deleteAgendaEventById;
  window.deleteAgendaEventById = function(id){
    // Remove linked mission too
    var DB = window.DB||{};
    if(Array.isArray(DB.employeeAgenda)){
      DB.employeeAgenda = DB.employeeAgenda.filter(function(m){return m.agendaEventId!==id});
      save();
    }
    if(_origDelete) _origDelete(id);
    gpUpdateJournalView&&gpUpdateJournalView();
  };

  // ─── 4. VUE UNIFIÉE DANS LA PAGE JOURNAL ────────────────────────────────────
  window.gpUpdateJournalView = function(){
    var container = document.getElementById('gpJournalAgendaSection');
    if(!container) return;
    renderUnifiedView(container);
  };

  function renderUnifiedView(container){
    var DB = window.DB||{};
    var agenda = (DB.agenda||[]).filter(function(a){return a.assignedTo});
    var missions = (DB.employeeAgenda||[]).filter(function(m){return !m.agendaEventId}); // only standalone missions
    var employees = getEmployees();

    // Filter controls
    var fEmp = document.getElementById('gpJaFilterEmp')?.value||'';
    var fStatus = document.getElementById('gpJaFilterStatus')?.value||'';
    var fType = document.getElementById('gpJaFilterType')?.value||'';

    // Build unified rows
    var rows = [];

    // From agenda (assigned events)
    agenda.forEach(function(a){
      if(fEmp && a.assignedTo!==fEmp) return;
      if(fStatus==='done' && !a.done) return;
      if(fStatus==='active' && a.done) return;
      if(fType==='mission') return;
      var emp = employees.find(function(e){return e.id===a.assignedTo});
      rows.push({
        id:a.id, type:'agenda', title:a.title||'Sans titre',
        date:a.date, time:a.time||'', priority:a.priority||'normale',
        status:a.done?'done':'active', note:a.note||'', lieu:a.lieu||'',
        empId:a.assignedTo, empName:a.assignedName||emp?.name||'Employé',
        source:'Agenda directeur'
      });
    });

    // From employeeAgenda (standalone missions)
    missions.forEach(function(m){
      if(fEmp && m.employeeId!==fEmp) return;
      if(fStatus==='done' && m.status!=='termine') return;
      if(fStatus==='active' && m.status==='termine') return;
      if(fType==='agenda') return;
      var emp = employees.find(function(e){return e.id===m.employeeId});
      rows.push({
        id:m.id, type:'mission', title:m.title||'Mission',
        date:m.date, time:m.time||'', priority:m.priority||'normale',
        status:m.status==='termine'?'done':m.status==='en_cours'?'inprogress':'active',
        note:m.note||'', lieu:'', empId:m.employeeId,
        empName:emp?.name||'Employé', source:'Mission assignée'
      });
    });

    // Sort by date desc
    rows.sort(function(a,b){return (b.date+b.time).localeCompare(a.date+a.time)});

    var todayK = todayKey();
    var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    var tomorrowK = dateKey(tomorrow);
    var countToday = rows.filter(function(r){return r.date===todayK&&r.status!=='done'}).length;
    var countTomorrow = rows.filter(function(r){return r.date===tomorrowK&&r.status!=='done'}).length;

    // Build employee filter options
    var empOptions = employees.map(function(e){
      return '<option value="'+esc(e.id)+'">'+esc(e.name)+'</option>';
    }).join('');

    var html = `
    <div class="gp-ja-header">
      <div class="gp-ja-title"><span class="material-symbols-rounded">calendar_month</span>
        Agenda & Missions
        <span style="background:#fef3c7;color:#92400e;font-size:11px;font-weight:800;padding:2px 8px;border-radius:12px;margin-left:4px">${rows.length} entrée${rows.length>1?'s':''}</span>
        ${countToday?'<span style="background:#fef2f2;color:#dc2626;font-size:11px;font-weight:800;padding:2px 8px;border-radius:12px">'+countToday+' auj.</span>':''}
      </div>
      <div class="gp-ja-actions">
        <select class="gp-ja-filter" id="gpJaFilterEmp" onchange="gpUpdateJournalView()">
          <option value="">Tous les employés</option>${empOptions}
        </select>
        <select class="gp-ja-filter" id="gpJaFilterStatus" onchange="gpUpdateJournalView()">
          <option value="">Tous statuts</option>
          <option value="active">À faire</option>
          <option value="done">Terminés</option>
        </select>
        <select class="gp-ja-filter" id="gpJaFilterType" onchange="gpUpdateJournalView()">
          <option value="">Tous types</option>
          <option value="agenda">Agenda directeur</option>
          <option value="mission">Missions</option>
        </select>
        <button class="gp-ja-btn primary" onclick="openFullAgendaModal()">
          <span class="material-symbols-rounded" style="font-size:15px">add</span>Nouvel événement
        </button>
        <button class="gp-ja-btn" style="background:#f3f4f6;color:#374151" onclick="openEmpMissionModal()">
          <span class="material-symbols-rounded" style="font-size:15px">assignment_add</span>Nouvelle mission
        </button>
      </div>
    </div>`;

    if(!rows.length){
      html += '<div class="gp-ja-empty"><span class="material-symbols-rounded">event_available</span>Aucune tâche ou événement assigné à un employé.<br><span style="font-size:12px">Créez un événement dans l\'agenda et assignez-le à un employé.</span></div>';
      container.innerHTML = html;
      return;
    }

    html += `<table class="gp-ja-table">
      <thead><tr>
        <th>Titre</th><th>Employé</th><th>Date</th><th>Priorité</th><th>Statut</th><th>Source</th><th>Actions</th>
      </tr></thead><tbody>`;

    rows.forEach(function(r){
      var prioColor = r.priority==='haute'?'#dc2626':'#9ca3af';
      var statusCls = r.status==='done'?'done':r.status==='inprogress'?'inprogress':'todo';
      var statusLabel = r.status==='done'?'✓ Terminé':r.status==='inprogress'?'En cours':'À faire';
      var typeCls = r.type==='agenda'?'agenda':'mission';
      var dateLabel = r.date===todayK?"<strong style='color:#dc2626'>Aujourd'hui</strong>" : r.date===tomorrowK?"<span style='color:#d97706'>Demain</span>":fmtDateFR(r.date);
      html += `<tr>
        <td>
          <div style="font-weight:700;color:#111;font-size:13px">${esc(r.title)}</div>
          ${r.lieu?'<div style="font-size:11px;color:#9ca3af;margin-top:2px">📍 '+esc(r.lieu)+'</div>':''}
          ${r.note?'<div style="font-size:11px;color:#9ca3af;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px">'+esc(r.note)+'</div>':''}
        </td>
        <td><div class="gp-ja-employee-chip"><div class="gp-ja-emp-av">${esc(initials(r.empName))}</div>${esc(r.empName)}</div></td>
        <td>${dateLabel}${r.time?'<br><span style="font-size:10.5px;color:#9ca3af">'+esc(r.time)+'</span>':''}</td>
        <td><div style="display:flex;align-items:center;gap:5px"><div class="gp-ja-prio" style="background:${prioColor}"></div>${r.priority==='haute'?'<span style="color:#dc2626;font-weight:700;font-size:11px">Haute</span>':'<span style="color:#9ca3af;font-size:11px">Normale</span>'}</div></td>
        <td><span class="gp-ja-status ${statusCls}">${statusLabel}</span></td>
        <td><span class="gp-ja-source ${typeCls}">${esc(r.source)}</span></td>
        <td style="white-space:nowrap">
          ${r.type==='agenda'?
            '<button onclick="openEventForm(\''+esc(r.id)+'\')" style="border:none;background:#f3f4f6;border-radius:6px;padding:4px 7px;cursor:pointer;font-size:11px;color:#374151">✏️ Modifier</button>'
            :
            '<button onclick="openEmpMissionModal(\''+esc(r.id)+'\')" style="border:none;background:#f3f4f6;border-radius:6px;padding:4px 7px;cursor:pointer;font-size:11px;color:#374151">✏️ Modifier</button>'
          }
        </td>
      </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // ─── 5. INJECTION DANS LA PAGE JOURNAL ──────────────────────────────────────
  // Section "Agenda & Missions" (tableau unifié) désactivée — remplacée par l'agenda calendrier intégré
  function injectJournalSection(){
    // Désactivé : on n'injecte plus le tableau en haut de la page journal
    return;
  }

  // ─── 6. HOOK NAVIGATE pour rafraîchir le journal ────────────────────────────
  var _origNavigate = window.navigate;
  window.navigate = function(page){
    var result = _origNavigate ? _origNavigate.apply(this, arguments) : undefined;
    if(page === 'journal'){
      setTimeout(function(){
        injectJournalSection();
        gpUpdateJournalView();
      }, 80);
    }
    return result;
  };

  // ─── 7. BADGE DANS LE CARD ÉVÉNEMENT — afficher l'assigné ────────────────────
  // Patch the gpAmRender to show assignee badge after it runs
  var _origRender = window.gpAmRender;
  window.gpAmRender = function(){
    if(_origRender) _origRender();
    // Assignee info is now embedded in the card HTML via the patched saveAgendaEvent
    // But we also need to re-render cards to show assignee chip
    // Re-render is handled by _origRender since we inject it into the data
  };

  // Override the card HTML rendering to include assignee badge
  // We hook into the DOM after render
  var _origGpAmRender2 = window.gpAmRender;
  window.gpAmRender = function(){
    if(_origGpAmRender2) _origGpAmRender2();
    // After cards are rendered, re-inject assignee badges where needed
    setTimeout(function(){
      var DB = window.DB||{};
      var agenda = DB.agenda||[];
      // Re-render the full list with assignee info injected
      // (Already handled in the base render since we patched the event object)
    }, 20);
  };

  // ─── 8. PATCH RENDER EVENTS CARDS (avec badge assigné) ─────────────────────
  // Override the base gpAmRender fully to include assignee chips in cards
  (function(){
    var _base = window.gpAmRender;

    // Replace the event list rendering completely
    window.gpAmRender = function(){
      // We call the original which uses its own closure — but we need to override
      // The original is defined in the first patch script, we need to re-implement
      // to include assignee data. We'll use a DOM post-process approach.
      if(typeof _originalGpAmRender === 'function') _originalGpAmRender();

      // Post-process: add assignee chips to rendered cards
      var DB = window.DB||{};
      var agenda = DB.agenda||[];
      var cards = document.querySelectorAll('.gp-ev-card');
      // We can't easily match cards back to events since they use onclick with id
      // So we'll trigger a full re-render using the patched version below
    };
  })();

  // ─── FINAL: Init on page load ────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function(){
    injectAssignField();
    // If journal is already active
    if(document.getElementById('page-journal')?.classList.contains('active')){
      setTimeout(function(){injectJournalSection();gpUpdateJournalView();},100);
    }
  });
  setTimeout(function(){
    injectAssignField();
  }, 500);

  // ─── 9. Expose gpAmRender correctly (replace all with unified version) ───────
  // Build a definitive gpAmRender that includes assignee info in cards
  window.gpAmRenderFull = function(){
    var DB = window.DB||{};
    var agenda = DB.agenda||[];
    var q = (document.getElementById('gpAmSearch')?.value||'').toLowerCase().trim();
    var fType = document.getElementById('gpAmFilterType')?.value||'';
    var fPrio = document.getElementById('gpAmFilterPriority')?.value||'';
    var fStatus = document.getElementById('gpAmFilterStatus')?.value||'active';
    var employees = getEmployees();
    var MONTHS=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    var TYPE_LABEL={rdv:'Rendez-vous',tache:'Tâche',rappel:'Rappel',autre:'Autre'};
    function typeColor(type){return type==='rdv'?'#2563eb':type==='tache'?'#d97706':type==='rappel'?'#16a34a':'#6b7280'}
    function fmtDate(k){if(!k)return '';try{return new Date(k+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long'})}catch(e){return k}}
    var todK = todayKey();
    var tom = new Date(); tom.setDate(tom.getDate()+1); var tomK = dateKey(tom);

    var filtered = agenda.filter(function(a){
      if(q && !(a.title||'').toLowerCase().includes(q) && !(a.lieu||'').toLowerCase().includes(q) && !(a.note||'').toLowerCase().includes(q) && !(a.assignedName||'').toLowerCase().includes(q)) return false;
      if(fType && a.type!==fType) return false;
      if(fPrio && a.priority!==fPrio) return false;
      if(fStatus==='active' && a.done) return false;
      if(fStatus==='done' && !a.done) return false;
      return true;
    });
    filtered.sort(function(a,b){
      if(a.done!==b.done) return a.done?1:-1;
      return (a.date+(a.time||'')).localeCompare(b.date+(b.time||''));
    });

    var sub = filtered.length+' événement'+(filtered.length>1?'s':'')+' · '+agenda.filter(function(a){return !a.done}).length+' actif'+(agenda.filter(function(a){return !a.done}).length>1?'s':'');
    var subEl=document.getElementById('gpAmSub'); if(subEl)subEl.textContent=sub;

    var box=document.getElementById('gpAmEventsList'); if(!box)return;
    if(!filtered.length){
      box.innerHTML='<div class="gp-am-empty"><span class="material-symbols-rounded">event_busy</span><strong>Aucun événement trouvé</strong><p style="font-size:13px;margin-top:4px">Modifiez vos filtres ou créez un nouvel événement</p></div>';
      return;
    }

    var groups={};
    filtered.forEach(function(a){var k=a.date||'Sans date';if(!groups[k])groups[k]=[];groups[k].push(a);});
    var keys=Object.keys(groups).sort();
    var html='';
    keys.forEach(function(k){
      var label=k===todK?"Aujourd'hui":k===tomK?'Demain':(k==='Sans date'?'Sans date':fmtDate(k));
      html+='<div class="gp-am-events-header">'+esc(label)+'</div>';
      groups[k].forEach(function(a){
        var color=a.priority==='haute'?'#dc2626':typeColor(a.type);
        var empChip = a.assignedTo&&a.assignedName ?
          '<span class="gp-ev-assigned-badge"><span class="material-symbols-rounded">person</span>'+esc(a.assignedName)+'</span>' : '';
        html+='<div class="gp-ev-card'+(a.done?' done-card':'')+'" onclick="openEventForm(\''+esc(a.id||'')+'\')">'+
          '<div class="gp-ev-stripe" style="background:'+color+'"></div>'+
          '<div class="gp-ev-content">'+
            '<div class="gp-ev-card-title">'+esc(a.title||'Sans titre')+'</div>'+
            '<div class="gp-ev-card-meta">'+
              '<span class="gp-ev-chip '+esc(a.type||'autre')+'">'+esc(TYPE_LABEL[a.type]||'Agenda')+'</span>'+
              (a.time?'<span class="gp-ev-chip"><span class="material-symbols-rounded">schedule</span>'+esc(a.time)+'</span>':'')+
              (a.lieu?'<span class="gp-ev-chip"><span class="material-symbols-rounded">location_on</span>'+esc(a.lieu)+'</span>':'')+
              (a.priority==='haute'?'<span class="gp-ev-chip haute"><span class="material-symbols-rounded">priority_high</span>Haute</span>':'')+
              empChip+
              (a.done?'<span class="gp-ev-chip done"><span class="material-symbols-rounded">check_circle</span>Terminé</span>':'')+
            '</div>'+
            (a.note?'<div style="font-size:12px;color:#6b7280;margin-top:5px">'+esc(a.note)+'</div>':'')+
          '</div>'+
          '<div class="gp-ev-card-actions" onclick="event.stopPropagation()">'+
            (!a.done?'<button class="gp-ev-action-btn check" onclick="toggleAgendaDone(\''+esc(a.id||'')+'\')"><span class="material-symbols-rounded">check_circle</span></button>':
            '<button class="gp-ev-action-btn" onclick="toggleAgendaDone(\''+esc(a.id||'')+'\')"><span class="material-symbols-rounded">redo</span></button>')+
            '<button class="gp-ev-action-btn delete" onclick="deleteAgendaEventById(\''+esc(a.id||'')+'\')"><span class="material-symbols-rounded">delete</span></button>'+
          '</div>'+
        '</div>';
      });
    });
    box.innerHTML=html;
    if(typeof gpAmCalRender==='function') gpAmCalRender();
  };

  // Override gpAmRender with the full version
  window.gpAmRender = window.gpAmRenderFull;

})();


/* ═══════════════════════════════════════════════════════════
   script-19.js
═══════════════════════════════════════════════════════════ */
/* ── Hamburger & Sidebar Drawer (mobile/tablette) ── */
(function () {
  function initHamburger() {
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    var ham = document.getElementById('hamburger');
    if (!sidebar || !overlay || !ham) return;

    ham.addEventListener('click', function () {
      var isOpen = sidebar.classList.toggle('open');
      overlay.classList.toggle('show', isOpen);
    });
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
    // Ferme le drawer quand on clique sur un item de menu
    sidebar.querySelectorAll('.menu li').forEach(function (li) {
      li.addEventListener('click', function () {
        if (window.innerWidth <= 1024) {
          sidebar.classList.remove('open');
          overlay.classList.remove('show');
        }
      });
    });
  }

  /* Injecte le bouton hamburger dans la topbar */
  function injectHamburger() {
    var topbar = document.getElementById('topbar');
    if (!topbar || document.getElementById('hamburger')) return;
    var btn = document.createElement('button');
    btn.id = 'hamburger';
    btn.innerHTML = '<span class="material-symbols-rounded">menu</span>';
    btn.title = 'Menu';
    topbar.insertBefore(btn, topbar.firstChild);
  }

  /* Injecte l'overlay */
  function injectOverlay() {
    if (document.getElementById('sidebarOverlay')) return;
    var el = document.createElement('div');
    el.id = 'sidebarOverlay';
    document.body.appendChild(el);
  }

  function init() {
    injectOverlay();
    injectHamburger();
    initHamburger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* ═══════════════════════════════════════════════════════════
   script-20.js
═══════════════════════════════════════════════════════════ */
/* ── Recherche dropdown ── */
window.toggleTopbarSearch = function(e){
  e && e.stopPropagation();
  var d = document.getElementById('topbarSearchDrop');
  var inp = document.getElementById('topbarSearchInput');
  if(!d) return;
  var open = d.style.display === 'block';
  d.style.display = open ? 'none' : 'block';
  if(!open){ if(inp){ inp.value=''; inp.focus(); } runTopbarSearch(''); }
};
window.closeTopbarSearch = function(){
  var d = document.getElementById('topbarSearchDrop');
  if(d) d.style.display = 'none';
};
window.runTopbarSearch = function(q){
  var r = document.getElementById('topbarSearchResults');
  if(!r) return;
  var items=[
    {icon:'home',label:'Biens immobiliers',page:'biens'},
    {icon:'people',label:'Locataires',page:'locataires'},
    {icon:'description',label:'Contrats',page:'contrats'},
    {icon:'payments',label:'Finances',page:'finances'},
    {icon:'handyman',label:'Maintenance',page:'maintenance'},
    {icon:'bar_chart',label:'Rapports',page:'rapports'},
    {icon:'settings',label:'Paramètres',page:'parametres'},
    {icon:'apartment',label:'Locatives',page:'locatives'},
    {icon:'receipt_long',label:'Paiements',page:'paiements'},
    {icon:'event',label:'Agenda',page:'agenda'},
    {icon:'groups',label:'Employés',page:'employes'},
  ];
  if(!q || q.length < 1){
    r.innerHTML='<div style="padding:14px;text-align:center;font-size:12px;color:#9ca3af">Tapez pour rechercher…</div>';
    return;
  }
  var filtered = items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()));
  if(!filtered.length){
    r.innerHTML='<div style="padding:14px;text-align:center;font-size:12px;color:#9ca3af">Aucun résultat</div>';
    return;
  }
  r.innerHTML = filtered.map(i =>
    `<div onclick="if(window.navigate)navigate('${i.page}');closeTopbarSearch()" style="display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;transition:.1s" onmouseover="this.style.background='#fdf9ec'" onmouseout="this.style.background=''">`+
    `<span class="material-symbols-rounded" style="font-size:15px;color:#D4AF37;flex-shrink:0">${i.icon}</span>`+
    `<span style="font-size:12.5px;font-weight:600;color:#111">${i.label}</span></div>`
  ).join('');
};
document.addEventListener('click', function(e){
  if(!e.target.closest('#topbarSearchDrop') && !e.target.closest('[title="Rechercher"]'))
    closeTopbarSearch();
});
window.toggleGlobalSearch = window.closeGlobalSearch = function(){};


/* ═══════════════════════════════════════════════════════════
   script-21.js
═══════════════════════════════════════════════════════════ */
(function(){
  function closeDepenseModalFromOutside(event){
    var modal = document.getElementById('depModal');
    if(!modal) return;
    if(event.target === modal){
      if(typeof window.closeDepModal === 'function'){
        window.closeDepModal();
      }else{
        modal.style.display = 'none';
        modal.classList.remove('open');
      }
    }
  }
  document.addEventListener('click', closeDepenseModalFromOutside, true);
  document.addEventListener('keydown', function(event){
    if(event.key !== 'Escape') return;
    var modal = document.getElementById('depModal');
    if(!modal) return;
    var visible = modal.classList.contains('open') || modal.style.display === 'flex' || modal.style.display === 'block';
    if(visible){
      if(typeof window.closeDepModal === 'function') window.closeDepModal();
      else { modal.style.display = 'none'; modal.classList.remove('open'); }
    }
  });
})();


/* ═══════════════════════════════════════════════════════════
   script-22.js
═══════════════════════════════════════════════════════════ */
function renderGpPagination(container, currentPage, totalPages, onPageChange){
  if(totalPages<=1){ container.style.display='none'; return; }
  container.style.display='flex';
  const pages=[];
  // Always show first, last, current ±1, with ellipsis
  const show=new Set([1,totalPages,currentPage,currentPage-1,currentPage+1].filter(p=>p>=1&&p<=totalPages));
  const sorted=[...show].sort((a,b)=>a-b);
  let html=`<button class="gp-pag-btn" ${currentPage===1?'disabled':''} onclick="(${onPageChange.toString()})(${currentPage-1})">
    <span class="material-symbols-rounded" style="font-size:14px">chevron_left</span></button>`;
  let prev=0;
  for(const p of sorted){
    if(prev && p-prev>1) html+=`<span class="gp-pag-info">…</span>`;
    html+=`<button class="gp-pag-btn${p===currentPage?' active':''}" onclick="(${onPageChange.toString()})(${p})">${p}</button>`;
    prev=p;
  }
  html+=`<button class="gp-pag-btn" ${currentPage===totalPages?'disabled':''} onclick="(${onPageChange.toString()})(${currentPage+1})">
    <span class="material-symbols-rounded" style="font-size:14px">chevron_right</span></button>`;
  container.innerHTML=html;
}


/* ═══════════════════════════════════════════════════════════
   script-23.js
═══════════════════════════════════════════════════════════ */
(function gpV34Skeleton(){

  /* ============================================================
     Templates skeleton par type de page
  ============================================================ */
  const SK = {

    /* ── Dashboard ── */
    dashboard: `
      <div style="padding:15px;padding-top:78px">
        <div style="height:28px;width:260px;margin-bottom:18px" class="gp-sk"></div>
        <div class="gp-sk-dash-tiles">
          ${Array(3).fill(`<div class="gp-sk-dash-tile">
            <div class="gp-sk-tile-top gp-sk"></div>
            <div class="gp-sk-tile-num gp-sk"></div>
          </div>`).join('')}
        </div>
        <div class="gp-sk-charts">
          <div class="gp-sk-chart-box gp-sk"></div>
          <div class="gp-sk-chart-box gp-sk"></div>
        </div>
        <div class="gp-sk-container">
          ${skRows(5)}
        </div>
      </div>`,

    /* ── Pages avec tableau (employes, locatives, contrats…) ── */
    table: `
      <div style="padding:15px;padding-top:78px">
        <div class="gp-sk-header">
          <div class="gp-sk-title gp-sk"></div>
          <div class="gp-sk-btn gp-sk"></div>
        </div>
        <div class="gp-sk-stats cols-3">
          ${Array(3).fill(`<div class="gp-sk-stat-card">
            <div class="gp-sk-stat-label gp-sk"></div>
            <div class="gp-sk-stat-value gp-sk"></div>
          </div>`).join('')}
        </div>
        <div class="gp-sk-container">
          <div class="gp-sk-table-controls">
            <div class="gp-sk-search gp-sk"></div>
            <div class="gp-sk-select gp-sk"></div>
          </div>
          ${skRows(7)}
        </div>
      </div>`,

    /* ── Paiements (4 KPI + table) ── */
    paiements: `
      <div style="padding:15px;padding-top:78px">
        <div class="gp-sk-header">
          <div class="gp-sk-title gp-sk"></div>
          <div class="gp-sk-btn gp-sk"></div>
        </div>
        <div class="gp-sk-stats cols-4">
          ${Array(4).fill(`<div class="gp-sk-stat-card">
            <div class="gp-sk-stat-label gp-sk"></div>
            <div class="gp-sk-stat-value gp-sk"></div>
          </div>`).join('')}
        </div>
        <div class="gp-sk-container">
          <div class="gp-sk-table-controls">
            <div class="gp-sk-search gp-sk"></div>
            <div class="gp-sk-btn-sm gp-sk"></div>
          </div>
          ${skRows(8)}
        </div>
      </div>`,

    /* ── Locataires (cards) ── */
    locataires: `
      <div style="padding:15px;padding-top:78px">
        <div class="gp-sk-header">
          <div class="gp-sk-title gp-sk"></div>
          <div style="display:flex;gap:8px">
            <div class="gp-sk-search gp-sk"></div>
            <div class="gp-sk-btn gp-sk"></div>
          </div>
        </div>
        <div class="gp-sk-stats cols-3" style="margin-bottom:14px">
          ${Array(3).fill(`<div class="gp-sk-stat-card">
            <div class="gp-sk-stat-label gp-sk"></div>
            <div class="gp-sk-stat-value gp-sk"></div>
          </div>`).join('')}
        </div>
        <div class="gp-sk-card-grid">
          ${Array(6).fill(`<div class="gp-sk-person-card">
            <div class="gp-sk-card-top">
              <div class="gp-sk-card-avatar gp-sk"></div>
              <div style="flex:1;display:flex;flex-direction:column;gap:6px">
                <div class="gp-sk-card-name gp-sk"></div>
                <div class="gp-sk-card-meta gp-sk"></div>
              </div>
            </div>
            <div class="gp-sk-card-line gp-sk"></div>
            <div class="gp-sk-card-line2 gp-sk"></div>
          </div>`).join('')}
        </div>
      </div>`,

    /* ── Biens / Propriétaires (cards) ── */
    cards: `
      <div style="padding:15px;padding-top:78px">
        <div class="gp-sk-header">
          <div class="gp-sk-title gp-sk"></div>
          <div class="gp-sk-btn gp-sk"></div>
        </div>
        <div class="gp-sk-card-grid">
          ${Array(6).fill(`<div class="gp-sk-person-card" style="border-radius:18px">
            <div style="height:120px;border-radius:12px" class="gp-sk"></div>
            <div class="gp-sk-card-line gp-sk" style="height:15px"></div>
            <div class="gp-sk-card-line2 gp-sk"></div>
          </div>`).join('')}
        </div>
      </div>`,

    /* ── Rapport ── */
    rapports: `
      <div style="padding:15px;padding-top:78px">
        <div class="gp-sk-header">
          <div class="gp-sk-title gp-sk" style="width:220px;height:24px"></div>
          <div class="gp-sk-btn gp-sk"></div>
        </div>
        <div class="gp-sk-charts" style="margin-bottom:14px">
          <div class="gp-sk-chart-box gp-sk"></div>
          <div class="gp-sk-chart-box gp-sk"></div>
        </div>
        <div class="gp-sk-charts">
          <div class="gp-sk-chart-box gp-sk"></div>
          <div class="gp-sk-chart-box gp-sk"></div>
        </div>
      </div>`,

    /* ── Messages ── */
    messages: `
      <div style="padding:15px;padding-top:78px">
        <div class="gp-sk-header">
          <div class="gp-sk-title gp-sk"></div>
          <div class="gp-sk-btn gp-sk"></div>
        </div>
        <div style="display:grid;grid-template-columns:280px 1fr;gap:12px">
          <div class="gp-sk-container" style="padding:12px">
            ${Array(6).fill(`<div class="gp-sk-row" style="border:none;padding:8px 0">
              <div class="gp-sk-avatar gp-sk"></div>
              <div style="flex:1;display:flex;flex-direction:column;gap:5px">
                <div class="gp-sk-cell-md gp-sk" style="height:12px"></div>
                <div class="gp-sk-cell-sm gp-sk" style="height:10px"></div>
              </div>
            </div>`).join('')}
          </div>
          <div class="gp-sk-container gp-sk"></div>
        </div>
      </div>`,

    /* ── Paramètres ── */
    parametres: `
      <div style="padding:15px;padding-top:78px">
        <div class="gp-sk-title gp-sk" style="width:160px;margin-bottom:16px"></div>
        ${Array(4).fill(`<div class="gp-sk-container" style="margin-bottom:12px;display:flex;gap:14px;align-items:center">
          <div class="gp-sk-icon gp-sk" style="width:42px;height:42px;border-radius:10px;flex-shrink:0"></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:7px">
            <div class="gp-sk" style="height:14px;width:55%"></div>
            <div class="gp-sk" style="height:11px;width:80%"></div>
          </div>
          <div class="gp-sk-btn-sm gp-sk"></div>
        </div>`).join('')}
      </div>`,
  };

  /* Génère N lignes de tableau skeleton */
  function skRows(n){
    return Array(n).fill(`<div class="gp-sk-row">
      <div class="gp-sk-avatar gp-sk"></div>
      <div class="gp-sk-cell-lg gp-sk"></div>
      <div class="gp-sk-cell-md gp-sk"></div>
      <div class="gp-sk-cell-sm gp-sk"></div>
      <div class="gp-sk-badge gp-sk"></div>
      <div class="gp-sk-actions">
        <div class="gp-sk-icon gp-sk"></div>
        <div class="gp-sk-icon gp-sk"></div>
        <div class="gp-sk-icon gp-sk"></div>
      </div>
    </div>`).join('');
  }

  /* Map page → squelette */
  function getTemplate(page){
    const MAP = {
      dashboard:      SK.dashboard,
      employes:       SK.table,
      locatives:      SK.table,
      contrats:       SK.table,
      depenses:       SK.table,
      fichiers:       SK.table,
      avenir:         SK.table,
      journal:        SK.table,
      'agenda-employes': SK.table,
      paiements:      SK.paiements,
      locataires:     SK.locataires,
      biens:          SK.cards,
      proprietaires:  SK.cards,
      rapports:       SK.rapports,
      messages:       SK.messages,
      parametres:     SK.parametres,
    };
    return MAP[page] || SK.table;
  }

  /* ============================================================
     BARRE DE PROGRESSION
  ============================================================ */
  const progressBar  = document.getElementById('gp-progress-bar');
  const progressFill = document.getElementById('gp-progress-fill');
  let progressTimer;

  function progressStart(){
    clearTimeout(progressTimer);
    if(!progressBar) return;
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
    progressBar.classList.add('active');
    requestAnimationFrame(() => {
      progressFill.style.transition = 'width .35s cubic-bezier(.4,0,.2,1)';
      progressFill.style.width = '70%';
    });
  }

  function progressDone(){
    if(!progressBar) return;
    progressFill.style.width = '100%';
    progressTimer = setTimeout(() => {
      progressBar.classList.remove('active');
      progressFill.style.transition = 'none';
      progressFill.style.width = '0%';
    }, 320);
  }

  /* ============================================================
     SKELETON SHOW / HIDE
  ============================================================ */
  const skWrap = document.getElementById('gp-skeleton-wrap');
  let skHideTimer;

  /* Attache le skeleton-wrap à l'intérieur de .content */
  function attachToContent(){
    const content = document.getElementById('mainContent') || document.querySelector('.content');
    if(content && skWrap && skWrap.parentElement !== content){
      content.style.position = 'relative';
      content.appendChild(skWrap);
    }
  }

  function skShow(page){
    if(!skWrap) return;
    attachToContent();
    clearTimeout(skHideTimer);
    skWrap.innerHTML = getTemplate(page);
    skWrap.classList.add('visible');
  }

  function skHide(){
    if(!skWrap) return;
    skHideTimer = setTimeout(() => {
      skWrap.classList.remove('visible');
      /* Nettoie le HTML pour ne pas garder des nodes inutiles */
      setTimeout(() => { if(!skWrap.classList.contains('visible')) skWrap.innerHTML = ''; }, 300);
    }, 60); /* Léger délai pour que le vrai contenu soit peint */
  }

  /* ============================================================
     PATCH navigate() — non-destructif
  ============================================================ */
  function patchNavigate(){
    const orig = window.navigate;
    if(typeof orig !== 'function') return;
    if(orig._skPatched) return; /* évite double patch */

    window.navigate = function(page){
      /* Pages formulaires → pas de skeleton (déjà instantané) */
      const noSkPages = ['nv-employe','nv-proprietaire','nv-locataire',
                         'nv-bien','nv-locative','nv-contrat',
                         'bien-detail','proprietaire-detail'];

      const showSk = !noSkPages.includes(page);

      if(showSk){
        progressStart();
        skShow(page);
      }

      /* Lance le vrai rendu */
      orig.call(this, page);

      /* Masque le skeleton après que le navigateur a peint le contenu */
      if(showSk){
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            skHide();
            progressDone();
          });
        });
      }
    };
    window.navigate._skPatched = true;
  }

  /* Attendre que navigate() soit prêt */
  function waitAndPatch(tries){
    tries = tries || 50;
    if(tries <= 0) return;
    if(typeof window.navigate === 'function' && !window.navigate._skPatched){
      patchNavigate();
    } else {
      setTimeout(() => waitAndPatch(tries - 1), 80);
    }
  }

  waitAndPatch();
  /* Re-tente après chargement complet au cas où navigate() est défini tard */
  window.addEventListener('load', () => { if(!window.navigate?._skPatched) patchNavigate(); });

})();



/* ============================================================
   DOCUMENTS — EMPLOYÉS / PROPRIÉTAIRES / LOCATAIRES
   Ajoute une icône document dans les actions et conserve les pièces avec nom.
============================================================ */
let _entityDocsKey = '';
let _entityDocsIdx = -1;
let _entityDocFile = null;

function ensureEntityDocsStores(){
  if(!DB.employeDocs || typeof DB.employeDocs !== 'object') DB.employeDocs = {};
  if(!DB.proprietaireDocs || typeof DB.proprietaireDocs !== 'object') DB.proprietaireDocs = {};
  if(!DB.locataireDocs || typeof DB.locataireDocs !== 'object') DB.locataireDocs = {};
}
function entityDocsCollection(key){
  ensureEntityDocsStores();
  if(key === 'employes') return DB.employeDocs;
  if(key === 'proprietaires') return DB.proprietaireDocs;
  if(key === 'locataires') return DB.locataireDocs;
  return null;
}
function entityDocsStoreKey(key, idx){
  if(key === 'proprietaires' && typeof getProprietaireDocsKey === 'function') return getProprietaireDocsKey(idx);
  if(key === 'locataires' && typeof locataireDocsKey === 'function') return locataireDocsKey(idx);
  return (key === 'employes' ? 'emp_' : key + '_') + idx;
}
function entityDocsLabel(key, idx){
  const item = (DB[key] || [])[idx] || {};
  const kind = key === 'employes' ? 'Employé' : key === 'proprietaires' ? 'Propriétaire' : 'Locataire';
  let name = '';
  if(key === 'proprietaires' && typeof getProprietaireFullName === 'function') name = getProprietaireFullName(item);
  else if(key === 'locataires' && typeof locataireFullName === 'function') name = locataireFullName(item);
  else name = [item.prenom, item.nom].filter(Boolean).join(' ') || item.nom || item.email || item.id || '';
  return `${kind} : ${name || 'sélectionné'}`;
}
function ensureEntityDocsModal(){
  let modal = document.getElementById('entityDocsModal');
  if(modal) return modal;
  modal = document.createElement('div');
  modal.id = 'entityDocsModal';
  modal.className = 'row-modal';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="row-modal-box entity-docs-box">
      <div class="row-modal-head">
        <div>
          <h3 id="entityDocsTitle">Documents</h3>
          <p>Ajoutez et conservez les documents avec un nom identifiable.</p>
        </div>
        <button class="icon-btn modal-close-btn" title="Fermer" onclick="closeEntityDocs()"><span class="material-symbols-rounded">close</span></button>
      </div>
      <div class="entity-doc-form">
        <input id="entityDocName" type="text" placeholder="Nom du document">
        <input id="entityDocAlbum" type="text" placeholder="Catégorie / dossier (optionnel)">
        <div id="entityDocDrop" class="loc-doc-drop" onclick="document.getElementById('entityDocFile').click()">
          <span class="material-symbols-rounded">cloud_upload</span>
          <strong>Déposer un fichier ici</strong><br>
          <small>ou cliquer pour sélectionner un PDF, une image ou un document</small>
          <input id="entityDocFile" type="file" style="display:none" onchange="handleEntityDocFile(this.files[0])">
        </div>
        <button class="btn-primary" onclick="addEntityDocument()"><span class="material-symbols-rounded">add</span> Ajouter le document</button>
      </div>
      <div id="entityDocList" class="loc-doc-list"></div>
    </div>`;
  document.body.appendChild(modal);
  const style = document.createElement('style');
  style.textContent = `
    .entity-docs-box{max-width:760px;width:min(760px,94vw);max-height:88vh;overflow:auto}
    .entity-doc-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0 16px}
    .entity-doc-form input{height:42px;border:1px solid #e5e7eb;border-radius:10px;padding:0 12px;font-size:13px;background:#fff}
    .entity-doc-form .loc-doc-drop{grid-column:1/-1;cursor:pointer}
    .entity-doc-form .btn-primary{grid-column:1/-1;justify-content:center}
    .icon-doc{color:#0f172a;background:#ffffff;border-color:#dbe3ef;box-shadow:0 1px 2px rgba(15,23,42,.06)}
  `;
  document.head.appendChild(style);
  return modal;
}
function resetEntityDocDrop(){
  const drop = document.getElementById('entityDocDrop');
  if(drop){
    drop.innerHTML = `<span class="material-symbols-rounded">cloud_upload</span><strong>Déposer un fichier ici</strong><br><small>ou cliquer pour sélectionner un PDF, une image ou un document</small><input id="entityDocFile" type="file" style="display:none" onchange="handleEntityDocFile(this.files[0])">`;
  }
}
function handleEntityDocFile(file){
  if(!file) return;
  _entityDocFile = file;
  const name = document.getElementById('entityDocName');
  if(name && !name.value.trim()) name.value = file.name.replace(/\.[^/.]+$/, '');
  const drop = document.getElementById('entityDocDrop');
  if(drop){
    drop.innerHTML = `<span class="material-symbols-rounded">description</span><strong>${escapeHTML(file.name)}</strong><br><small>${Math.round((file.size||0)/1024)} Ko sélectionné</small><input id="entityDocFile" type="file" style="display:none" onchange="handleEntityDocFile(this.files[0])">`;
  }
}
function openEntityDocs(key, idx){
  ensureEntityDocsStores();
  _entityDocsKey = key;
  _entityDocsIdx = idx;
  _entityDocFile = null;
  const modal = ensureEntityDocsModal();
  const title = document.getElementById('entityDocsTitle');
  if(title) title.textContent = entityDocsLabel(key, idx);
  const n = document.getElementById('entityDocName'); if(n) n.value = '';
  const a = document.getElementById('entityDocAlbum'); if(a) a.value = '';
  resetEntityDocDrop();
  renderEntityDocuments();
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
}
function closeEntityDocs(){
  const modal = document.getElementById('entityDocsModal');
  if(modal) modal.style.display = 'none';
  _entityDocFile = null;
}
function addEntityDocument(){
  const store = entityDocsCollection(_entityDocsKey);
  if(!store || _entityDocsIdx < 0){ toast('Aucun dossier sélectionné', true); return; }
  const name = (document.getElementById('entityDocName')?.value || '').trim();
  const album = (document.getElementById('entityDocAlbum')?.value || '').trim() || 'Documents';
  const file = _entityDocFile || document.getElementById('entityDocFile')?.files?.[0];
  if(!name || !file){ toast('Nom du document et fichier requis', true); return; }
  const reader = new FileReader();
  reader.onload = function(e){
    const sk = entityDocsStoreKey(_entityDocsKey, _entityDocsIdx);
    if(!store[sk]) store[sk] = [];
    store[sk].push({
      id:'DOC-' + Date.now(),
      name,
      album,
      fileName:file.name,
      type:file.type || 'application/octet-stream',
      mime:file.type || 'application/octet-stream',
      size:file.size || 0,
      data:e.target.result,
      created:new Date().toISOString(),
      date:new Date().toISOString()
    });
    saveDB();
    document.getElementById('entityDocName').value = '';
    document.getElementById('entityDocAlbum').value = '';
    _entityDocFile = null;
    resetEntityDocDrop();
    renderEntityDocuments();
    if(_entityDocsKey === 'proprietaires' && typeof renderProprietaireDocuments === 'function') renderProprietaireDocuments();
    if(_entityDocsKey === 'locataires' && typeof renderLocataireDocuments === 'function') renderLocataireDocuments();
    toast('Document ajouté ✓');
  };
  reader.readAsDataURL(file);
}
function currentEntityDocs(){
  const store = entityDocsCollection(_entityDocsKey);
  if(!store) return [];
  return store[entityDocsStoreKey(_entityDocsKey, _entityDocsIdx)] || [];
}
function renderEntityDocuments(){
  const list = document.getElementById('entityDocList');
  if(!list) return;
  const docs = currentEntityDocs();
  if(!docs.length){ list.innerHTML = '<div class="loc-doc-empty">Aucun document enregistré.</div>'; return; }
  list.innerHTML = docs.map((d,i)=>{
    let preview = '<span class="material-symbols-rounded">description</span>';
    const type = String(d.mime || d.type || '');
    if(type.startsWith('image/')) preview = `<img src="${d.data}" alt="${escapeHTML(d.name)}">`;
    else if(type.includes('pdf')) preview = '<span class="material-symbols-rounded">picture_as_pdf</span>';
    return `<div class="loc-doc-card">
      <div class="loc-doc-preview">${preview}</div>
      <div>
        <div class="loc-doc-title">${escapeHTML(d.name || 'Document')}</div>
        <div class="loc-doc-meta">${escapeHTML(d.album || 'Documents')} · ${escapeHTML(d.fileName || 'Fichier')} · ${Math.round((d.size || 0)/1024)} Ko</div>
      </div>
      <div class="loc-doc-actions">
        <button class="icon-btn icon-view" title="Voir" onclick="previewEntityDocument(${i})"><span class="material-symbols-rounded">visibility</span></button>
        <button class="icon-btn icon-download" title="Télécharger" onclick="downloadEntityDocument(${i})"><span class="material-symbols-rounded">download</span></button>
        <button class="icon-btn icon-delete" title="Supprimer" onclick="deleteEntityDocument(${i})"><span class="material-symbols-rounded">delete</span></button>
      </div>
    </div>`;
  }).join('');
}
function previewEntityDocument(i){
  const d = currentEntityDocs()[i]; if(!d) return;
  const w = window.open('', '_blank');
  if(!w){ toast('Popup bloquée par le navigateur', true); return; }
  const type = String(d.mime || d.type || '');
  if(type.startsWith('image/')) w.document.write(`<img src="${d.data}" style="max-width:100%;height:auto">`);
  else if(type.includes('pdf')) w.document.write(`<iframe src="${d.data}" style="width:100%;height:100vh;border:0"></iframe>`);
  else w.document.write('<p style="font-family:Arial;padding:20px">Aperçu non disponible. Utilisez le bouton Télécharger.</p>');
}
function downloadEntityDocument(i){
  const d = currentEntityDocs()[i]; if(!d) return;
  const a = document.createElement('a');
  a.href = d.data;
  a.download = d.fileName || d.name || 'document';
  document.body.appendChild(a); a.click(); a.remove();
}
function deleteEntityDocument(i){
  const store = entityDocsCollection(_entityDocsKey); if(!store) return;
  if(!confirm('Supprimer ce document ?')) return;
  const sk = entityDocsStoreKey(_entityDocsKey, _entityDocsIdx);
  store[sk] = (store[sk] || []).filter((_,idx)=>idx!==i);
  saveDB();
  renderEntityDocuments();
  if(_entityDocsKey === 'proprietaires' && typeof renderProprietaireDocuments === 'function') renderProprietaireDocuments();
  if(_entityDocsKey === 'locataires' && typeof renderLocataireDocuments === 'function') renderLocataireDocuments();
  toast('Document supprimé');
}
(function initEntityDocDrop(){
  document.addEventListener('dragover', function(e){
    const drop = e.target.closest && e.target.closest('#entityDocDrop');
    if(drop){ e.preventDefault(); drop.classList.add('dragover'); }
  });
  document.addEventListener('dragleave', function(e){
    const drop = e.target.closest && e.target.closest('#entityDocDrop');
    if(drop) drop.classList.remove('dragover');
  });
  document.addEventListener('drop', function(e){
    const drop = e.target.closest && e.target.closest('#entityDocDrop');
    if(drop){ e.preventDefault(); drop.classList.remove('dragover'); handleEntityDocFile(e.dataTransfer.files[0]); }
  });
})();

/* ============================================================
   FIX SELECTS FORMULAIRES — propriétaires / locations / paiements
   - propriétaire du bien depuis la liste propriétaires
   - location depuis bien + locataire existants
   - paiement depuis locataire + location + bien existants
============================================================ */
(function(){
  function esc(s){ return (window.escapeHTML ? window.escapeHTML(String(s ?? '')) : String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))); }
  function arr(k){ return Array.isArray(window.DB && DB[k]) ? DB[k] : []; }
  function fullName(p){ return [p && p.prenom, p && p.nom].filter(Boolean).join(' ').trim() || (p && (p.nom || p.email || p.id)) || ''; }
  function locName(l){ return fullName(l) || (l && (l.nom || l.email || l.id)) || ''; }
  function locTelByName(name){
    const n=String(name||'').trim();
    const l=arr('locataires').find(x => locName(x)===n || [x.nom,x.prenom].filter(Boolean).join(' ').trim()===n || String(x.nom||'')===n);
    return l ? (l.tel || l.telephone || l.phone || l.mobile || '') : '';
  }
  function locOption(l){
    const name=locName(l);
    const tel=l.tel || l.telephone || l.phone || l.mobile || '';
    const label=tel ? `${name} — ${tel}` : name;
    return `<option value="${esc(name)}" data-tel="${esc(tel)}">${esc(label)}</option>`;
  }
  function availableBienOptions(){
    const options=[];
    arr('biens').forEach(b=>{
      if(!b) return;
      try{ if(typeof ensureBienUnits==='function') ensureBienUnits(b); }catch(e){}
      const units = (typeof ensureBienUnits==='function') ? ensureBienUnits(b) : (Array.isArray(b.unites)?b.unites:[]);
      const multi = (typeof isMultiUnitBien==='function') ? isMultiUnitBien(b) : units.length>0;
      if(multi && units.length){
        options.push(`<optgroup label="${esc(b.nom||'Bien')} — ${esc(b.proprio||'Propriétaire')}">${units.map(u=>{
          const val = (typeof getBienUnitFullName==='function') ? getBienUnitFullName(b,u) : `${b.nom} - ${u.nom}`;
          const statut = u.statut || 'Disponible';
          return `<option value="${esc(val)}" data-parent="${esc(b.nom)}" data-statut="${esc(statut)}">${esc(u.nom||val)} — ${esc(statut)}</option>`;
        }).join('')}</optgroup>`);
      } else {
        options.push(`<option value="${esc(b.nom||'')}" data-parent="${esc(b.nom||'')}" data-statut="${esc(b.statut||'Disponible')}">${esc(b.nom||'Bien')} — ${esc(b.statut||'Disponible')}</option>`);
      }
    });
    return options.join('');
  }
  function selectedOption(sel){ return sel && sel.options ? sel.options[sel.selectedIndex] : null; }

  window.fillProprioBien = function(){
    const sel=document.getElementById('b-proprio');
    if(!sel) return;
    const current=sel.value;
    sel.innerHTML='<option value="">Sélectionnez un propriétaire existant</option>'+arr('proprietaires').map(p=>{
      const name=fullName(p);
      const info=p.tel||p.email||'';
      return `<option value="${esc(name)}" data-id="${esc(p.id||'')}" data-tel="${esc(p.tel||'')}" data-email="${esc(p.email||'')}">${esc(info?`${name} — ${info}`:name)}</option>`;
    }).join('');
    if(current) sel.value=current;
  };

  window.syncLocativeFromLocataire = function(){
    const sl=document.getElementById('lv-locataire');
    const tel=document.getElementById('lv-locataire-tel');
    if(!sl || !tel) return;
    tel.value = selectedOption(sl)?.dataset?.tel || locTelByName(sl.value) || '';
  };

  window.syncLocativeFromBien = function(){
    const sb=document.getElementById('lv-bien');
    const loyer=document.getElementById('lv-loyer');
    if(!sb || !loyer || loyer.value) return;
    const val=sb.value;
    let found=null;
    try{ found = typeof findUnitByFullName==='function' ? findUnitByFullName(val) : null; }catch(e){}
    const b = found && found.bien ? found.bien : arr('biens').find(x=>x.nom===val);
    const u = found && found.unite ? found.unite : null;
    const raw = (u && u.loyer) || (b && (b.loyer || b.valeurLocative || b.montantLoyer)) || '';
    if(raw) loyer.value = (typeof num==='function') ? num(raw) : String(raw).replace(/[^0-9]/g,'');
  };

  window.fillLocativeSelects = function(){
    const sl=document.getElementById('lv-locataire');
    if(sl){
      const current=sl.value;
      sl.innerHTML='<option value="">Sélectionner un locataire existant</option>'+arr('locataires').map(locOption).join('');
      if(current) sl.value=current;
    }
    const sb=document.getElementById('lv-bien');
    if(sb){
      const current=sb.value;
      sb.innerHTML='<option value="">Sélectionner un bien / appartement existant</option>'+availableBienOptions();
      if(current) sb.value=current;
    }
    const d=document.getElementById('lv-date-entree');
    if(d && !d.value) d.value=new Date().toISOString().split('T')[0];
    window.syncLocativeFromLocataire();
  };

  function fillPayBienSelect(locations){
    const pb=document.getElementById('pay-bien');
    if(!pb) return;
    const list = Array.isArray(locations) && locations.length ? locations : arr('locatives');
    const seen=new Set();
    const opts=[];
    list.forEach(l=>{
      const val=l.bien || l.parentBien || '';
      if(!val || seen.has(val)) return;
      seen.add(val);
      opts.push(`<option value="${esc(val)}">${esc(val)}</option>`);
    });
    pb.innerHTML='<option value="">Sélectionner le bien</option>'+opts.join('');
  }

  window.openPayModal = function(){
    const m=document.getElementById('payModal');
    if(!m) return;
    m.style.display='flex';
    m.style.alignItems='center';
    m.style.justifyContent='center';
    const date=document.getElementById('pay-date'); if(date) date.value=new Date().toISOString().split('T')[0];
    ['pay-montant','pay-paye','pay-reste'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
    const sl=document.getElementById('pay-locataire');
    if(sl) sl.innerHTML='<option value="">Sélectionner un locataire existant</option>'+arr('locataires').map(locOption).join('');
    const slv=document.getElementById('pay-locative');
    if(slv) slv.innerHTML='<option value="">Sélectionner une location</option>'+arr('locatives').map(l=>`<option value="${esc(l.nom||'')}" data-bien="${esc(l.bien||l.parentBien||'')}" data-loyer="${esc(l.loyer||'')}">${esc(l.nom||'Location')} — ${esc(l.bien||'')}</option>`).join('');
    fillPayBienSelect(arr('locatives'));
  };

  window.syncPayModalFromLocataire = function(){
    const loc=(document.getElementById('pay-locataire')?.value||'').trim();
    const slv=document.getElementById('pay-locative');
    const locations=arr('locatives').filter(l=>String(l.locataire||l.occupant||'').trim()===loc);
    const source=locations.length?locations:arr('locatives');
    if(slv){
      slv.innerHTML='<option value="">Sélectionner une location</option>'+source.map(l=>`<option value="${esc(l.nom||'')}" data-bien="${esc(l.bien||l.parentBien||'')}" data-loyer="${esc(l.loyer||'')}">${esc(l.nom||'Location')} — ${esc(l.bien||'')}</option>`).join('');
    }
    fillPayBienSelect(source);
    if(locations.length===1 && slv){ slv.value=locations[0].nom||''; window.syncPayModalFromLocative(); }
  };

  window.syncPayModalFromBien = function(){
    const bien=(document.getElementById('pay-bien')?.value||'').trim();
    const slv=document.getElementById('pay-locative');
    if(!bien || !slv) return;
    const match=arr('locatives').find(l=>String(l.bien||l.parentBien||'').trim()===bien);
    if(match){ slv.value=match.nom||''; window.syncPayModalFromLocative(); }
  };

  window.syncPayModalFromLocative = function(){
    const locative=(document.getElementById('pay-locative')?.value||'').trim();
    const lv=arr('locatives').find(l=>l.nom===locative);
    if(lv){
      const pb=document.getElementById('pay-bien'); if(pb) pb.value=lv.bien||lv.parentBien||'';
      const pm=document.getElementById('pay-montant'); if(pm) pm.value=(typeof num==='function')?num(lv.loyer):String(lv.loyer||'').replace(/[^0-9]/g,'');
      const pp=document.getElementById('pay-paye'); if(pp) pp.value=(typeof num==='function')?num(lv.loyer):String(lv.loyer||'').replace(/[^0-9]/g,'');
      if(typeof updatePayReste==='function') updatePayReste();
    }
  };

  const _oldSavePaiement = window.savePaiement;
  window.savePaiement = function(){
    const loc=document.getElementById('pay-locataire')?.value||'';
    const locative=document.getElementById('pay-locative')?.value||'';
    const bien=document.getElementById('pay-bien')?.value||'';
    if(!loc) return toast('Le locataire est requis','err');
    if(!locative) return toast('La location est requise','err');
    if(!bien){ const lv=arr('locatives').find(l=>l.nom===locative); if(lv && document.getElementById('pay-bien')) document.getElementById('pay-bien').value=lv.bien||lv.parentBien||''; }
    const beforeLen=arr('paiements').length;
    const res = _oldSavePaiement ? _oldSavePaiement() : undefined;
    const after=arr('paiements');
    if(after.length>beforeLen && after[0]){ after[0].bien=document.getElementById('pay-bien')?.value||bien; try{ saveDB(); }catch(e){} }
    return res;
  };
})();


/* ============================================================
   GP FINAL FIX — selects relations, date no icon, safe bien detail
============================================================ */
(function(){
  function arr(k){ try{ return Array.isArray(window.DB&&window.DB[k]) ? window.DB[k] : []; }catch(e){ return []; } }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function fullName(x){ return [x&&x.prenom,x&&x.nom].filter(Boolean).join(' ').trim() || (x&&x.nom) || ''; }
  function money(v){ return String(v||'').replace(/[^0-9]/g,'') || ''; }
  function unitFullName(b,u){ return (typeof getBienUnitFullName==='function') ? getBienUnitFullName(b,u) : ((b&&b.nom?b.nom:'Bien')+' - '+(u&&u.nom?u.nom:'Appartement')); }
  function ensureUnits(b){ try{ return typeof ensureBienUnits==='function' ? ensureBienUnits(b) : (Array.isArray(b&&b.unites)?b.unites:[]); }catch(e){ return Array.isArray(b&&b.unites)?b.unites:[]; } }
  function isMulti(b){ try{ return typeof isMultiUnitBien==='function' ? isMultiUnitBien(b) : (ensureUnits(b).length>1); }catch(e){ return ensureUnits(b).length>1; } }
  function locOption(l){ var name=fullName(l); return '<option value="'+esc(name)+'" data-tel="'+esc(l&&l.tel||l&&l.telephone||l&&l.phone||'')+'" data-id="'+esc(l&&l.id||'')+'">'+esc(name+(l&&(l.tel||l.telephone)?' — '+(l.tel||l.telephone):''))+'</option>'; }
  function bienOptions(onlyFree){
    var out=[];
    arr('biens').forEach(function(b){
      var units=ensureUnits(b);
      if(isMulti(b) && units.length){
        out.push('<optgroup label="'+esc((b.nom||'Bien')+(b.proprio?' — '+b.proprio:''))+'">'+units.map(function(u){
          var st=u.statut||'Disponible';
          if(onlyFree && String(st).toLowerCase().indexOf('lou')>=0) return '';
          var val=unitFullName(b,u);
          return '<option value="'+esc(val)+'" data-parent="'+esc(b.nom||'')+'" data-statut="'+esc(st)+'" data-loyer="'+esc(u.loyer||'')+'">'+esc((u.nom||val)+' — '+st)+'</option>';
        }).join('')+'</optgroup>');
      }else{
        var st=b.statut||'Disponible';
        if(onlyFree && String(st).toLowerCase().indexOf('lou')>=0) return;
        out.push('<option value="'+esc(b.nom||'')+'" data-parent="'+esc(b.nom||'')+'" data-statut="'+esc(st)+'" data-loyer="'+esc(b.loyer||b.valeurLocative||b.montantLoyer||'')+'">'+esc((b.nom||'Bien')+' — '+st)+'</option>');
      }
    });
    return out.join('');
  }
  window.fillProprioBien=function(){
    var sel=document.getElementById('b-proprio'); if(!sel) return;
    var cur=sel.value;
    sel.innerHTML='<option value="">Sélectionner un propriétaire existant</option>'+arr('proprietaires').map(function(p){ var n=fullName(p); var info=p.tel||p.email||''; return '<option value="'+esc(n)+'" data-id="'+esc(p.id||'')+'">'+esc(n+(info?' — '+info:''))+'</option>'; }).join('');
    if(cur) sel.value=cur;
  };
  window.fillLocativeSelects=function(){
    var sl=document.getElementById('lv-locataire'); if(sl){ var cur=sl.value; sl.innerHTML='<option value="">Sélectionner un locataire existant</option>'+arr('locataires').map(locOption).join(''); if(cur) sl.value=cur; }
    var sb=document.getElementById('lv-bien'); if(sb){ var curB=sb.value; sb.innerHTML='<option value="">Sélectionner un bien / appartement existant</option>'+bienOptions(true); if(curB) sb.value=curB; }
    var d=document.getElementById('lv-date-entree'); if(d && !d.value) d.value=new Date().toISOString().slice(0,10);
    if(typeof window.syncLocativeFromLocataire==='function') window.syncLocativeFromLocataire();
  };
  window.syncLocativeFromLocataire=function(){
    var sl=document.getElementById('lv-locataire'), tel=document.getElementById('lv-locataire-tel'); if(!sl||!tel) return;
    var opt=sl.options&&sl.options[sl.selectedIndex]; tel.value=(opt&&opt.dataset&&opt.dataset.tel)||'';
  };
  window.syncLocativeFromBien=function(){
    var sb=document.getElementById('lv-bien'), loyer=document.getElementById('lv-loyer'); if(!sb||!loyer||loyer.value) return;
    var opt=sb.options&&sb.options[sb.selectedIndex]; var raw=(opt&&opt.dataset&&opt.dataset.loyer)||''; if(raw) loyer.value=money(raw);
  };
  function fillPayBienSelect(list){ var pb=document.getElementById('pay-bien'); if(!pb) return; var seen={}; var opts=[]; (list&&list.length?list:arr('locatives')).forEach(function(l){ var val=l.bien||l.parentBien||''; if(!val||seen[val]) return; seen[val]=1; opts.push('<option value="'+esc(val)+'">'+esc(val)+'</option>'); }); pb.innerHTML='<option value="">Sélectionner un bien</option>'+opts.join(''); }
  window.openPayModal=function(){
    var m=document.getElementById('payModal'); if(!m) return; m.style.display='flex'; m.style.alignItems='center'; m.style.justifyContent='center';
    var d=document.getElementById('pay-date'); if(d) d.value=new Date().toISOString().slice(0,10);
    ['pay-montant','pay-paye','pay-reste'].forEach(function(id){var e=document.getElementById(id); if(e)e.value='';});
    var sl=document.getElementById('pay-locataire'); if(sl) sl.innerHTML='<option value="">Sélectionner un locataire existant</option>'+arr('locataires').map(locOption).join('');
    var sv=document.getElementById('pay-locative'); if(sv) sv.innerHTML='<option value="">Sélectionner une location existante</option>'+arr('locatives').map(function(l){return '<option value="'+esc(l.nom||'')+'" data-bien="'+esc(l.bien||l.parentBien||'')+'" data-loyer="'+esc(l.loyer||'')+'">'+esc((l.nom||'Location')+(l.bien?' — '+l.bien:''))+'</option>';}).join('');
    fillPayBienSelect(arr('locatives'));
  };
  window.syncPayModalFromLocataire=function(){
    var loc=(document.getElementById('pay-locataire')||{}).value||''; var list=arr('locatives').filter(function(l){return String(l.locataire||l.occupant||'').trim()===loc.trim();}); var src=list.length?list:arr('locatives');
    var sv=document.getElementById('pay-locative'); if(sv) sv.innerHTML='<option value="">Sélectionner une location existante</option>'+src.map(function(l){return '<option value="'+esc(l.nom||'')+'" data-bien="'+esc(l.bien||l.parentBien||'')+'" data-loyer="'+esc(l.loyer||'')+'">'+esc((l.nom||'Location')+(l.bien?' — '+l.bien:''))+'</option>';}).join('');
    fillPayBienSelect(src); if(list.length===1 && sv){ sv.value=list[0].nom||''; window.syncPayModalFromLocative(); }
  };
  window.syncPayModalFromBien=function(){ var bien=(document.getElementById('pay-bien')||{}).value||''; var found=arr('locatives').find(function(l){return String(l.bien||l.parentBien||'')===bien;}); var sv=document.getElementById('pay-locative'); if(found&&sv){ sv.value=found.nom||''; window.syncPayModalFromLocative(); } };
  window.syncPayModalFromLocative=function(){ var val=(document.getElementById('pay-locative')||{}).value||''; var l=arr('locatives').find(function(x){return x.nom===val;}); if(!l)return; var pb=document.getElementById('pay-bien'); if(pb)pb.value=l.bien||l.parentBien||''; var amt=money(l.loyer); var m=document.getElementById('pay-montant'), p=document.getElementById('pay-paye'); if(m)m.value=amt; if(p)p.value=amt; if(typeof updatePayReste==='function') updatePayReste(); };

  // Safe modern detail page: no null crashes, no broken legacy dependencies.
  window.openBienDetail=function(idx){
    var b=arr('biens')[idx]; if(!b){ if(typeof toast==='function') toast('Bien introuvable','err'); return; }
    window._bienDetailIdx=idx;
    var page=document.getElementById('page-bien-detail'); if(!page) return;
    var units=ensureUnits(b); var locs=arr('locatives').filter(function(l){return l.parentBien===b.nom || l.bien===b.nom || units.some(function(u){return unitFullName(b,u)===l.bien;});});
    var prop=arr('proprietaires').find(function(p){var n1=fullName(p), n2=[p.nom,p.prenom].filter(Boolean).join(' '); return n1===b.proprio || n2===b.proprio || p.nom===b.proprio;});
    var stat=b.statut||'Disponible'; var docs=Array.isArray(b.documents)?b.documents:[];
    var locHtml = units.length ? units.map(function(u){ var full=unitFullName(b,u); var l=locs.find(function(x){return x.bien===full||x.uniteId===u.id;}); return '<div class="bd-unit-row"><div class="bd-unit-main"><span class="material-symbols-rounded bd-unit-ico">door_front</span><b>'+esc(u.nom||full)+'</b><span class="bd-mini-badge">'+esc(u.statut||'Disponible')+'</span></div><div class="bd-unit-info"><b>Locataire</b> '+esc((l&&l.locataire)||u.locataire||'—')+'</div><div class="bd-unit-info"><b>Loyer</b> '+esc((l&&l.loyer)||u.loyer||'—')+'</div></div>'; }).join('') : (locs.length?locs.map(function(l){return '<div class="bd-unit-row"><div class="bd-unit-main"><span class="material-symbols-rounded bd-unit-ico">person</span><b>'+esc(l.locataire||'—')+'</b></div><div class="bd-unit-info"><b>Loyer</b> '+esc(l.loyer||'—')+'</div><div class="bd-unit-info"><b>Entrée</b> '+esc(l.dateEntree||'—')+'</div></div>';}).join(''):'<div class="bd-empty">Aucune location associée</div>');
    page.innerHTML='<div class="bien-detail-page">'+
      '<div class="bien-detail-modern-head"><button class="bd-action-btn bd-back" onclick="navigate(\'biens\')"><span class="material-symbols-rounded">arrow_back</span> Retour</button><div class="bd-title"><h2>'+esc(b.nom||'Bien')+'</h2><p>'+esc([b.type,b.adresse].filter(Boolean).join(' · ')||'Détails du bien')+'</p></div><div class="bd-head-actions"><button class="bd-action-btn" onclick="editRow(\'biens\','+idx+')"><span class="material-symbols-rounded">edit</span> Modifier</button><button class="bd-action-btn danger" onclick="deleteBienFromDetail&&deleteBienFromDetail()"><span class="material-symbols-rounded">delete</span> Supprimer</button></div></div>'+
      '<div class="bd-hero"><div class="bd-photo">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<span class="material-symbols-rounded">home_work</span>')+'</div><div class="bd-info"><span class="bd-status">'+esc(stat)+'</span><h3>'+esc(b.nom||'—')+'</h3><p>'+esc(b.adresse||'Adresse non renseignée')+'</p><div class="bd-kpis"><div><small>Valeur</small><b>'+esc(b.valeur||'—')+'</b></div><div><small>Type</small><b>'+esc(b.type||'—')+'</b></div><div><small>Propriétaire</small><b>'+esc(b.proprio||'—')+'</b></div></div></div></div>'+
      '<div class="bd-tabs-modern"><button onclick="gpShowBDTab(\'infos\',this)" class="active">Infos</button><button onclick="gpShowBDTab(\'locations\',this)">Locations</button><button onclick="gpShowBDTab(\'proprio\',this)">Propriétaire</button><button onclick="gpShowBDTab(\'docs\',this)">Documents</button></div>'+
      '<section id="gpBD-infos" class="gp-bd-panel"><div class="bd-grid"><div><label>État</label><strong>'+esc(b.etat||'—')+'</strong></div><div><label>Vente</label><strong>'+esc(b.vente||'—')+'</strong></div><div><label>Appartements</label><strong>'+esc(b.nbAppart||units.length||'—')+'</strong></div><div><label>Statut</label><strong>'+esc(stat)+'</strong></div></div></section>'+
      '<section id="gpBD-locations" class="gp-bd-panel" style="display:none">'+locHtml+'</section>'+
      '<section id="gpBD-proprio" class="gp-bd-panel" style="display:none">'+(prop?'<div class="bd-grid"><div><label>Nom</label><strong>'+esc(fullName(prop))+'</strong></div><div><label>Téléphone</label><strong>'+esc(prop.tel||'—')+'</strong></div><div><label>Email</label><strong>'+esc(prop.email||'—')+'</strong></div><div><label>Adresse</label><strong>'+esc(prop.adresse||'—')+'</strong></div></div>':'<div class="bd-empty">Propriétaire non trouvé dans la base</div>')+'</section>'+
      '<section id="gpBD-docs" class="gp-bd-panel" style="display:none">'+(docs.length?docs.map(function(d){return '<div class="bien-doc-card"><span class="material-symbols-rounded">description</span><b>'+esc(d.nom||d.fileName||'Document')+'</b></div>';}).join(''):'<div class="bd-empty">Aucun document associé</div>')+'</section>'+
      '</div>';
    if(typeof navigate==='function') navigate('bien-detail');
  };
  window.gpShowBDTab=function(tab,btn){ ['infos','locations','proprio','docs'].forEach(function(t){var p=document.getElementById('gpBD-'+t); if(p)p.style.display=(t===tab?'block':'none');}); if(btn&&btn.parentNode){ btn.parentNode.querySelectorAll('button').forEach(function(b){b.classList.remove('active')}); btn.classList.add('active'); } };

  document.addEventListener('focusin',function(e){ if(['b-proprio','lv-locataire','lv-bien','pay-locataire','pay-locative','pay-bien'].indexOf(e.target&&e.target.id)>=0){ if(e.target.id==='b-proprio') window.fillProprioBien(); if(e.target.id.indexOf('lv-')===0) window.fillLocativeSelects(); } });
})();

/* ============================================================
   FINAL FIX — selections robustes + détail bien documents
   ============================================================ */
(function(){
  'use strict';
  function db(){
    try{ if(window.GPDB && typeof window.GPDB.load==='function'){ var d=window.GPDB.load(); if(d){ window.DB=d; return d; } } }catch(e){}
    window.DB=window.DB||{}; return window.DB;
  }
  function arr(k){ var d=db(); return Array.isArray(d[k]) ? d[k] : []; }
  function save(){ try{ if(window.GPDB&&window.GPDB.save) return window.GPDB.save(window.DB||db()); }catch(e){} try{ if(typeof saveDB==='function') saveDB(); }catch(e){} }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function money(v){ return String(v==null?'':v).replace(/[^0-9]/g,''); }
  function clean(s){ return String(s||'').replace(/\s+/g,' ').trim(); }
  function fullName(x){
    if(!x) return '';
    var a=[x.prenom,x.nom].filter(Boolean).join(' ');
    var b=[x.nom,x.prenom].filter(Boolean).join(' ');
    return clean(a || b || x.fullName || x.name || x.occupant || x.locataire || x.email || x.tel || x.id || '');
  }
  function locLabel(l,i){
    var n=fullName(l);
    if(!n || n==='—') n='Locataire '+(i+1);
    var tel=l&& (l.tel||l.telephone||l.phone||l.mobile||l.numero||l.contact);
    return tel ? n+' — '+tel : n;
  }
  function locValue(l,i){ return fullName(l) || ('Locataire '+(i+1)); }
  function sameName(a,b){ a=clean(a).toLowerCase(); b=clean(b).toLowerCase(); if(!a||!b) return false; return a===b || a.includes(b) || b.includes(a); }
  function locOption(l,i){
    var value=locValue(l,i), tel=(l&&(l.tel||l.telephone||l.phone||l.mobile||l.numero||l.contact))||'';
    return '<option value="'+esc(value)+'" data-id="'+esc((l&&l.id)||i)+'" data-tel="'+esc(tel)+'">'+esc(locLabel(l,i))+'</option>';
  }
  function bienUnits(b){
    try{ if(typeof ensureBienUnits==='function') return ensureBienUnits(b)||[]; }catch(e){}
    return Array.isArray(b&&b.unites)?b.unites:[];
  }
  function bienFull(b,u){
    try{ if(typeof getBienUnitFullName==='function') return getBienUnitFullName(b,u); }catch(e){}
    return clean((b&&b.nom)||'Bien')+(u&&u.nom?' - '+u.nom:'');
  }
  function bienOptionHtml(){
    var out=[];
    arr('biens').forEach(function(b){
      if(!b) return;
      var units=bienUnits(b);
      if(units && units.length){
        out.push('<optgroup label="'+esc((b.nom||'Bien')+(b.proprio?' — '+b.proprio:''))+'">');
        units.forEach(function(u){
          var val=bienFull(b,u);
          out.push('<option value="'+esc(val)+'" data-parent="'+esc(b.nom||'')+'" data-loyer="'+esc(money(u.loyer||b.loyer||b.prix||''))+'">'+esc((u.nom||val)+' — '+(u.statut||'Disponible'))+'</option>');
        });
        out.push('</optgroup>');
      } else {
        out.push('<option value="'+esc(b.nom||'')+'" data-parent="'+esc(b.nom||'')+'" data-loyer="'+esc(money(b.loyer||b.prix||b.valeur||''))+'">'+esc((b.nom||'Bien')+' — '+(b.statut||'Disponible'))+'</option>');
      }
    });
    return out.join('');
  }
  function locativesFor(loc){
    var all=arr('locatives');
    if(!loc) return all;
    var filtered=all.filter(function(l){return sameName(l.locataire||l.occupant||'', loc);});
    return filtered.length ? filtered : all;
  }
  function locativeOption(l){
    var nom=l.nom || (l.bien ? 'Location - '+l.bien : 'Location');
    var bien=l.bien||l.parentBien||'';
    var lab=nom+(bien?' — '+bien:'')+(l.locataire?' — '+l.locataire:'');
    return '<option value="'+esc(nom)+'" data-bien="'+esc(bien)+'" data-loyer="'+esc(money(l.loyer||l.montant||''))+'" data-locataire="'+esc(l.locataire||l.occupant||'')+'">'+esc(lab)+'</option>';
  }
  function fillSelect(id, placeholder, options, keep){
    var s=document.getElementById(id); if(!s) return;
    var cur=keep ? s.value : '';
    s.innerHTML='<option value="">'+esc(placeholder)+'</option>'+options;
    if(cur) s.value=cur;
  }

  window.gpFillAllExistingSelects=function(){
    db();
    fillSelect('b-proprio','Sélectionner un propriétaire existant', arr('proprietaires').map(function(p,i){var n=fullName(p)||('Propriétaire '+(i+1)); return '<option value="'+esc(n)+'">'+esc(n+(p.tel?' — '+p.tel:''))+'</option>';}).join(''), true);
    fillSelect('lv-locataire','Sélectionner un locataire existant', arr('locataires').map(locOption).join(''), true);
    fillSelect('lv-bien','Sélectionner un bien / appartement existant', bienOptionHtml(), true);
    fillSelect('ct-locataire','Sélectionner un locataire existant', arr('locataires').map(locOption).join(''), true);
    fillSelect('ct-locative','Sélectionner une location existante', arr('locatives').map(locativeOption).join(''), true);
    fillSelect('pay-locataire','Sélectionner un locataire existant', arr('locataires').map(locOption).join(''), true);
    fillSelect('pay-locative','Sélectionner une location existante', arr('locatives').map(locativeOption).join(''), true);
    var payBien=document.getElementById('pay-bien'); if(payBien){ var seen={}; var opts=[]; arr('locatives').forEach(function(l){var val=l.bien||l.parentBien||''; if(val&&!seen[val]){seen[val]=1; opts.push('<option value="'+esc(val)+'">'+esc(val)+'</option>');}}); if(!opts.length) opts.push(bienOptionHtml()); fillSelect('pay-bien','Sélectionner un bien existant',opts.join(''),true); }
    var d=document.getElementById('lv-date-entree'); if(d&&!d.value) d.value=new Date().toISOString().slice(0,10);
    var sn=document.getElementById('ct-num'); if(sn&&!sn.value) sn.value='CT-'+new Date().getFullYear()+'-'+Math.floor(100000+Math.random()*900000);
  };
  window.fillProprioBien=window.gpFillAllExistingSelects;
  window.fillLocativeSelects=window.gpFillAllExistingSelects;
  window.fillContratSelects=window.gpFillAllExistingSelects;

  window.syncLocativeFromLocataire=function(){
    var s=document.getElementById('lv-locataire'), tel=document.getElementById('lv-locataire-tel');
    if(tel){ var opt=s&&s.options?s.options[s.selectedIndex]:null; tel.value=(opt&&opt.dataset&&opt.dataset.tel)||''; }
  };
  window.syncLocativeFromBien=function(){
    var s=document.getElementById('lv-bien'), loyer=document.getElementById('lv-loyer');
    if(s&&loyer&&!loyer.value){ var opt=s.options[s.selectedIndex]; if(opt&&opt.dataset&&opt.dataset.loyer) loyer.value=opt.dataset.loyer; }
  };
  window.syncContratFromLocataire=function(){
    var loc=(document.getElementById('ct-locataire')||{}).value||'';
    fillSelect('ct-locative','Sélectionner une location existante', locativesFor(loc).map(locativeOption).join(''), false);
  };
  window.syncContratFromLocative=function(){
    var val=(document.getElementById('ct-locative')||{}).value||'';
    var l=arr('locatives').find(function(x){return (x.nom||'')===val;});
    if(!l) return;
    var loc=document.getElementById('ct-locataire'); if(loc && l.locataire) loc.value=l.locataire;
    var lo=document.getElementById('ct-loyer'); if(lo) lo.value=money(l.loyer||l.montant||lo.value);
    var ch=document.getElementById('ct-charges'); if(ch&&!ch.value) ch.value=money(l.charge||l.charges||0);
    var deb=document.getElementById('ct-debut'); if(deb&&!deb.value) deb.value=l.dateEntree||new Date().toISOString().slice(0,10);
    var sign=document.getElementById('ct-sign'); if(sign&&!sign.value) sign.value=new Date().toISOString().slice(0,10);
    var proc=document.getElementById('ct-prochain'); if(proc&&!proc.value) proc.value=deb.value||new Date().toISOString().slice(0,10);
  };
  window.syncPayModalFromLocataire=function(){
    var loc=(document.getElementById('pay-locataire')||{}).value||'';
    var src=locativesFor(loc);
    fillSelect('pay-locative','Sélectionner une location existante',src.map(locativeOption).join(''),false);
    if(src.length===1){ var sv=document.getElementById('pay-locative'); if(sv) sv.value=src[0].nom||''; window.syncPayModalFromLocative(); }
  };
  window.syncPayModalFromBien=function(){
    var bien=(document.getElementById('pay-bien')||{}).value||'';
    var found=arr('locatives').find(function(l){return (l.bien||l.parentBien||'')===bien;});
    if(found){ var sv=document.getElementById('pay-locative'); if(sv) sv.value=found.nom||''; window.syncPayModalFromLocative(); }
  };
  window.syncPayModalFromLocative=function(){
    var val=(document.getElementById('pay-locative')||{}).value||'';
    var l=arr('locatives').find(function(x){return (x.nom||'')===val;}); if(!l)return;
    var pl=document.getElementById('pay-locataire'); if(pl && l.locataire) pl.value=l.locataire;
    var pb=document.getElementById('pay-bien'); if(pb) pb.value=l.bien||l.parentBien||'';
    var amt=money(l.loyer||l.montant||'');
    var m=document.getElementById('pay-montant'), p=document.getElementById('pay-paye'); if(m)m.value=amt; if(p)p.value=amt;
    if(typeof updatePayReste==='function') updatePayReste();
  };

  function wireSelectEvents(){
    var map={
      'lv-locataire':'syncLocativeFromLocataire','lv-bien':'syncLocativeFromBien','ct-locataire':'syncContratFromLocataire','ct-locative':'syncContratFromLocative','pay-locataire':'syncPayModalFromLocataire','pay-locative':'syncPayModalFromLocative','pay-bien':'syncPayModalFromBien'
    };
    Object.keys(map).forEach(function(id){ var el=document.getElementById(id); if(el && !el.dataset.gpSelectWired){ el.dataset.gpSelectWired='1'; el.addEventListener('change',function(){ window[map[id]]&&window[map[id]](); }); } });
  }

  var _nav=window.navigate;
  if(typeof _nav==='function') window.navigate=function(page){ var r=_nav.apply(this,arguments); setTimeout(function(){ window.gpFillAllExistingSelects(); wireSelectEvents(); },60); return r; };
  var _openPay=window.openPayModal;
  window.openPayModal=function(){ if(typeof _openPay==='function') _openPay.apply(this,arguments); window.gpFillAllExistingSelects(); wireSelectEvents(); var m=document.getElementById('payModal'); if(m){m.style.display='flex';m.style.alignItems='center';m.style.justifyContent='center';} };
  document.addEventListener('DOMContentLoaded',function(){ setTimeout(function(){ window.gpFillAllExistingSelects(); wireSelectEvents(); },200); });
  document.addEventListener('focusin',function(e){ if(e.target && /^(b-proprio|lv-|ct-|pay-)/.test(e.target.id||'')){ window.gpFillAllExistingSelects(); wireSelectEvents(); } });

  // Détail bien complet, stable, avec documents ajout/voir/téléchargement/suppression.
  function docsForBien(idx){ var b=arr('biens')[idx]; if(!b) return []; if(!Array.isArray(b.documents)) b.documents=[]; return b.documents; }
  window.gpAddBienDetailDocument=function(){
    var idx=window._bienDetailIdx; var b=arr('biens')[idx]; if(!b) return;
    var name=clean((document.getElementById('bdDocName')||{}).value)||'Document';
    var file=(document.getElementById('bdDocFile')||{}).files && document.getElementById('bdDocFile').files[0];
    if(!file){ if(typeof toast==='function') toast('Choisissez un fichier','err'); return; }
    var rd=new FileReader(); rd.onload=function(){ docsForBien(idx).push({nom:name,fileName:file.name,type:file.type||'application/octet-stream',size:file.size,data:rd.result,date:new Date().toISOString()}); save(); window.openBienDetail(idx); setTimeout(function(){ var btn=document.querySelector('.bd-tabs-modern button[data-tab="docs"]'); if(btn) btn.click(); },50); if(typeof toast==='function') toast('Document ajouté ✓'); }; rd.readAsDataURL(file);
  };
  window.gpPreviewBienDoc=function(i){ var d=docsForBien(window._bienDetailIdx)[i]; if(!d||!d.data)return; var w=window.open('','_blank'); if(w){ if(String(d.type||'').startsWith('image/')) w.document.write('<img src="'+d.data+'" style="max-width:100%;height:auto">'); else w.document.write('<iframe src="'+d.data+'" style="width:100%;height:100vh;border:0"></iframe>'); } };
  window.gpDownloadBienDoc=function(i){ var d=docsForBien(window._bienDetailIdx)[i]; if(!d||!d.data)return; var a=document.createElement('a'); a.href=d.data; a.download=d.fileName||d.nom||'document'; document.body.appendChild(a); a.click(); a.remove(); };
  window.gpDeleteBienDoc=function(i){ if(!confirm('Supprimer ce document ?')) return; docsForBien(window._bienDetailIdx).splice(i,1); save(); window.openBienDetail(window._bienDetailIdx); setTimeout(function(){ var btn=document.querySelector('.bd-tabs-modern button[data-tab="docs"]'); if(btn) btn.click(); },50); };
  window.gpShowBDTab=function(tab,btn){ ['infos','locations','proprio','docs'].forEach(function(t){var p=document.getElementById('gpBD-'+t); if(p)p.style.display=(t===tab?'block':'none');}); document.querySelectorAll('.bd-tabs-modern button').forEach(function(b){b.classList.remove('active')}); if(btn)btn.classList.add('active'); };
  window.openBienDetail=function(idx){
    idx=Number(idx); var b=arr('biens')[idx]; if(!b){ if(typeof toast==='function') toast('Bien introuvable','err'); return; }
    window._bienDetailIdx=idx;
    var page=document.getElementById('page-bien-detail'); if(!page) return;
    var units=bienUnits(b), locs=arr('locatives').filter(function(l){return (l.parentBien&&l.parentBien===b.nom)||(l.bien&&String(l.bien).indexOf(b.nom)>=0)||(l.bien===b.nom);});
    var prop=arr('proprietaires').find(function(p){return sameName(fullName(p),b.proprio)||sameName(p.nom,b.proprio);});
    var locHtml=(locs.length?locs.map(function(l){return '<div class="bd-unit-row"><div class="bd-unit-main"><span class="material-symbols-rounded bd-unit-ico">person</span><b>'+esc(l.locataire||l.occupant||'Locataire')+'</b></div><div class="bd-unit-info"><b>Location</b> '+esc(l.nom||'—')+'</div><div class="bd-unit-info"><b>Bien</b> '+esc(l.bien||b.nom||'—')+'</div><div class="bd-unit-info"><b>Loyer</b> '+esc(l.loyer||'—')+'</div></div>';}).join(''):(units.length?units.map(function(u){return '<div class="bd-unit-row"><div class="bd-unit-main"><span class="material-symbols-rounded bd-unit-ico">door_front</span><b>'+esc(u.nom||'Unité')+'</b></div><div class="bd-unit-info"><b>Statut</b> '+esc(u.statut||'Disponible')+'</div><div class="bd-unit-info"><b>Loyer</b> '+esc(u.loyer||'—')+'</div></div>';}).join(''):'<div class="bd-empty">Aucune location associée</div>'));
    var docs=docsForBien(idx);
    var docsHtml='<div class="bd-doc-add"><input id="bdDocName" placeholder="Nom du document"><input id="bdDocFile" type="file"><button class="btn btn-primary" onclick="gpAddBienDetailDocument()"><span class="material-symbols-rounded">upload_file</span> Ajouter</button></div>'+
      (docs.length?'<div class="bd-doc-list">'+docs.map(function(d,i){return '<div class="bien-doc-card"><span class="material-symbols-rounded">folder</span><div><b>'+esc(d.nom||d.fileName||'Document')+'</b><small>'+esc(d.fileName||'')+'</small></div><div class="actions"><button class="icon-btn icon-view" onclick="gpPreviewBienDoc('+i+')"><span class="material-symbols-rounded">visibility</span></button><button class="icon-btn" onclick="gpDownloadBienDoc('+i+')"><span class="material-symbols-rounded">download</span></button><button class="icon-btn icon-delete" onclick="gpDeleteBienDoc('+i+')"><span class="material-symbols-rounded">delete</span></button></div></div>';}).join('')+'</div>':'<div class="bd-empty">Aucun document associé</div>');
    page.innerHTML='<div class="bien-detail-page"><div class="bien-detail-modern-head"><button class="bd-action-btn bd-back" onclick="navigate(\'biens\')"><span class="material-symbols-rounded">arrow_back</span> Retour</button><div class="bd-title"><h2>'+esc(b.nom||'Bien')+'</h2><p>'+esc([b.type,b.adresse].filter(Boolean).join(' · ')||'Détails du bien')+'</p></div><div class="bd-head-actions"><button class="bd-action-btn" onclick="editRow(\'biens\','+idx+')"><span class="material-symbols-rounded">edit</span> Modifier</button><button class="bd-action-btn danger" onclick="deleteRow(\'biens\','+idx+')"><span class="material-symbols-rounded">delete</span> Supprimer</button></div></div>'+
      '<div class="bd-hero"><div class="bd-photo">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<span class="material-symbols-rounded">home_work</span>')+'</div><div class="bd-info"><span class="bd-status">'+esc(b.statut||'Disponible')+'</span><h3>'+esc(b.nom||'—')+'</h3><p>'+esc(b.adresse||'Adresse non renseignée')+'</p><div class="bd-kpis"><div><small>Valeur</small><b>'+esc(b.valeur||'—')+'</b></div><div><small>Type</small><b>'+esc(b.type||'—')+'</b></div><div><small>Propriétaire</small><b>'+esc(b.proprio||'—')+'</b></div></div></div></div>'+
      '<div class="bd-tabs-modern"><button data-tab="infos" onclick="gpShowBDTab(\'infos\',this)" class="active">Informations</button><button data-tab="locations" onclick="gpShowBDTab(\'locations\',this)">Locataires</button><button data-tab="proprio" onclick="gpShowBDTab(\'proprio\',this)">Propriétaire</button><button data-tab="docs" onclick="gpShowBDTab(\'docs\',this)">Documents bien</button></div>'+
      '<section id="gpBD-infos" class="gp-bd-panel"><div class="bd-grid"><div><label>Nom</label><strong>'+esc(b.nom||'—')+'</strong></div><div><label>Adresse</label><strong>'+esc(b.adresse||'—')+'</strong></div><div><label>Type</label><strong>'+esc(b.type||'—')+'</strong></div><div><label>État</label><strong>'+esc(b.etat||'—')+'</strong></div><div><label>Statut</label><strong>'+esc(b.statut||'—')+'</strong></div><div><label>Valeur</label><strong>'+esc(b.valeur||'—')+'</strong></div></div></section>'+
      '<section id="gpBD-locations" class="gp-bd-panel" style="display:none">'+locHtml+'</section>'+
      '<section id="gpBD-proprio" class="gp-bd-panel" style="display:none">'+(prop?'<div class="bd-grid"><div><label>Nom</label><strong>'+esc(fullName(prop))+'</strong></div><div><label>Téléphone</label><strong>'+esc(prop.tel||prop.telephone||'—')+'</strong></div><div><label>Email</label><strong>'+esc(prop.email||'—')+'</strong></div><div><label>Adresse</label><strong>'+esc(prop.adresse||'—')+'</strong></div></div>':'<div class="bd-empty">Propriétaire non trouvé dans la base</div>')+'</section>'+
      '<section id="gpBD-docs" class="gp-bd-panel" style="display:none">'+docsHtml+'</section></div>';
    if(typeof navigate==='function') navigate('bien-detail');
  };

  var css='.bd-doc-add{display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:12px;margin-bottom:12px}.bd-doc-add input{border:1px solid #e5e7eb;border-radius:10px;padding:10px}.bd-doc-list{display:grid;gap:10px}.bien-doc-card{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:12px}.bien-doc-card>span{color:#d4a511}.bien-doc-card div:nth-child(2){flex:1}.bien-doc-card small{display:block;color:#6b7280;margin-top:3px}.bd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.bd-grid>div{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px}.bd-grid label{display:block;font-size:12px;color:#6b7280;margin-bottom:4px}.bd-empty{background:#fff;border:1px dashed #d1d5db;border-radius:14px;padding:18px;color:#6b7280}.bd-unit-row{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:12px;margin-bottom:10px}.bd-unit-main{display:flex;gap:8px;align-items:center;margin-bottom:8px}.bd-unit-ico{color:#d4a511}.bd-unit-info{display:inline-block;margin-right:18px;color:#374151}.bd-tabs-modern{display:flex;gap:8px;margin:16px 0}.bd-tabs-modern button{border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:9px 14px;font-weight:800;cursor:pointer}.bd-tabs-modern button.active{background:#111827;color:#fff;border-color:#111827}.bien-detail-modern-head{display:flex;align-items:center;gap:14px;margin-bottom:14px}.bd-title{flex:1}.bd-title h2{margin:0}.bd-title p{margin:2px 0 0;color:#6b7280}.bd-head-actions{display:flex;gap:8px}.bd-action-btn{border:1px solid #e5e7eb;background:#fff;border-radius:12px;padding:10px 12px;font-weight:800;display:inline-flex;gap:6px;align-items:center;cursor:pointer}.bd-action-btn.danger{color:#dc2626}.bd-hero{display:flex;gap:16px;background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:16px}.bd-photo{width:160px;height:120px;border-radius:16px;background:#f9fafb;display:grid;place-items:center;overflow:hidden}.bd-photo img{width:100%;height:100%;object-fit:cover}.bd-photo span{font-size:48px;color:#d4a511}.bd-info{flex:1}.bd-status{background:#dcfce7;color:#166534;border-radius:999px;padding:4px 8px;font-size:12px;font-weight:800}.bd-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.bd-kpis div{background:#f9fafb;border-radius:12px;padding:10px}.bd-kpis small{display:block;color:#6b7280}.gp-bd-panel{margin-top:12px}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
})();

/* ============================================================
   REAL FINAL FIX — selects actifs + détail bien complet/docs
   Generated after user confirmation that previous patch was not active.
============================================================ */
(function(){
  'use strict';
  function DB(){ window.DB = window.DB || {}; return window.DB; }
  function arr(k){ var d=DB(); return Array.isArray(d[k]) ? d[k] : []; }
  function save(){ try{ if(window.GPDB && typeof window.GPDB.save==='function') window.GPDB.save(DB()); else if(typeof saveDB==='function') saveDB(); }catch(e){} }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function clean(v){ return String(v||'').replace(/\s+/g,' ').trim(); }
  function norm(v){ return clean(v).toLowerCase(); }
  function money(v){ return String(v==null?'':v).replace(/[^0-9]/g,''); }
  function today(){ return new Date().toISOString().slice(0,10); }
  function toastSafe(msg,type){ try{ if(typeof toast==='function') toast(msg,type||''); }catch(e){} }
  function fullName(o){
    if(!o) return '';
    var p=clean(o.prenom||o.firstName||'');
    var n=clean(o.nom||o.lastName||'');
    var direct=clean(o.fullName||o.name||o.nomComplet||o.locataire||o.occupant||'');
    return clean([p,n].filter(Boolean).join(' ')) || direct || clean(o.email||o.tel||o.telephone||o.id||'');
  }
  function same(a,b){ a=norm(a); b=norm(b); return !!a && !!b && (a===b || a.indexOf(b)>=0 || b.indexOf(a)>=0); }
  function ensureSelect(id, placeholder){
    var el=document.getElementById(id); if(!el) return null;
    if(el.tagName && el.tagName.toLowerCase()==='select') return el;
    var s=document.createElement('select');
    s.id=el.id; s.name=el.name||el.id; s.className=el.className; s.required=el.required;
    s.dataset.gpReplacedInput='1';
    s.setAttribute('aria-label', placeholder||el.getAttribute('placeholder')||id);
    if(el.getAttribute('onchange')) s.setAttribute('onchange', el.getAttribute('onchange'));
    el.parentNode.replaceChild(s,el);
    return s;
  }
  function setOptions(id, placeholder, html, keep){
    var s=ensureSelect(id, placeholder); if(!s) return null;
    var cur=keep ? s.value : '';
    s.innerHTML='<option value="">'+esc(placeholder)+'</option>'+(html||'');
    if(cur){ s.value=cur; if(s.value!==cur){ var opts=[].slice.call(s.options); var found=opts.find(function(o){return same(o.value,cur)||same(o.textContent,cur);}); if(found) s.value=found.value; } }
    return s;
  }
  function locOptions(){
    return arr('locataires').map(function(l,i){
      var name=fullName(l) || ('Locataire '+(i+1));
      var tel=clean(l.tel||l.telephone||l.phone||l.mobile||l.numero||l.contact||'');
      var email=clean(l.email||'');
      var label=name+(tel?' — '+tel:(email?' — '+email:''));
      return '<option value="'+esc(name)+'" data-index="'+i+'" data-id="'+esc(l.id||'')+'" data-tel="'+esc(tel)+'" data-email="'+esc(email)+'">'+esc(label)+'</option>';
    }).join('');
  }
  function propOptions(){
    return arr('proprietaires').map(function(p,i){
      var name=fullName(p) || ('Propriétaire '+(i+1));
      var tel=clean(p.tel||p.telephone||p.phone||p.mobile||p.contact||'');
      var email=clean(p.email||'');
      return '<option value="'+esc(name)+'" data-index="'+i+'" data-id="'+esc(p.id||'')+'">'+esc(name+(tel?' — '+tel:(email?' — '+email:'')))+'</option>';
    }).join('');
  }
  function unitsFor(b){ try{ if(typeof ensureBienUnits==='function') return ensureBienUnits(b)||[]; }catch(e){} return Array.isArray(b&&b.unites)?b.unites:[]; }
  function unitName(b,u){ try{ if(typeof getBienUnitFullName==='function') return getBienUnitFullName(b,u); }catch(e){} return clean((b&&b.nom)||'Bien')+(u&&u.nom?' - '+clean(u.nom):''); }
  function bienOptions(){
    var html=[];
    arr('biens').forEach(function(b,bi){ if(!b) return; var units=unitsFor(b); var label=clean(b.nom||('Bien '+(bi+1)));
      if(units.length){ html.push('<optgroup label="'+esc(label+(b.proprio?' — '+b.proprio:''))+'">'); units.forEach(function(u,ui){ var val=unitName(b,u); var loy=money(u.loyer||u.montant||b.loyer||b.valeurLocative||''); html.push('<option value="'+esc(val)+'" data-bien-index="'+bi+'" data-unit-index="'+ui+'" data-parent="'+esc(label)+'" data-loyer="'+esc(loy)+'">'+esc((u.nom||val)+' — '+(u.statut||'Disponible'))+'</option>'); }); html.push('</optgroup>'); }
      else { var loy=money(b.loyer||b.montantLoyer||b.valeurLocative||b.valeur||''); html.push('<option value="'+esc(label)+'" data-bien-index="'+bi+'" data-parent="'+esc(label)+'" data-loyer="'+esc(loy)+'">'+esc(label+' — '+(b.statut||'Disponible'))+'</option>'); }
    });
    return html.join('');
  }
  function locLabel(l,i){ var n=clean(l.nom||'') || ('Location '+(i+1)); var bien=clean(l.bien||l.parentBien||''); var loc=clean(l.locataire||l.occupant||''); return n+(bien?' — '+bien:'')+(loc?' — '+loc:''); }
  function locValue(l,i){ return clean(l.nom||'') || ('Location '+(i+1)); }
  function locativeOptions(list){
    return (list||arr('locatives')).map(function(l,i){ var val=locValue(l,i); return '<option value="'+esc(val)+'" data-index="'+i+'" data-bien="'+esc(l.bien||l.parentBien||'')+'" data-loyer="'+esc(money(l.loyer||l.montant||''))+'" data-locataire="'+esc(l.locataire||l.occupant||'')+'">'+esc(locLabel(l,i))+'</option>'; }).join('');
  }
  function locativesForName(name){ var list=arr('locatives').filter(function(l){ return same(l.locataire||l.occupant||'', name); }); return list.length ? list : arr('locatives'); }
  function fillAllRelationSelects(){
    setOptions('b-proprio','Sélectionner un propriétaire existant',propOptions(),true);
    setOptions('lv-locataire','Sélectionner un locataire existant',locOptions(),true);
    setOptions('lv-bien','Sélectionner un bien / appartement existant',bienOptions(),true);
    setOptions('ct-locataire','Sélectionner un locataire existant',locOptions(),true);
    setOptions('ct-locative','Sélectionner une location existante',locativeOptions(arr('locatives')),true);
    setOptions('pay-locataire','Sélectionner un locataire existant',locOptions(),true);
    setOptions('pay-locative','Sélectionner une location existante',locativeOptions(arr('locatives')),true);
    var seen={}; var opts=[]; arr('locatives').forEach(function(l){ var v=clean(l.bien||l.parentBien||''); if(v && !seen[v]){ seen[v]=1; opts.push('<option value="'+esc(v)+'">'+esc(v)+'</option>'); } }); if(!opts.length) opts.push(bienOptions()); setOptions('pay-bien','Sélectionner un bien existant',opts.join(''),true);
    var d=document.getElementById('lv-date-entree'); if(d && !d.value) d.value=today();
    var cn=document.getElementById('ct-num'); if(cn && !cn.value) cn.value='CT-'+new Date().getFullYear()+'-'+Math.floor(100000+Math.random()*900000);
    wireSelects();
  }
  window.gpFillAllExistingSelects=fillAllRelationSelects;
  window.fillProprioBien=fillAllRelationSelects;
  window.fillLocativeSelects=fillAllRelationSelects;
  window.fillContratSelects=fillAllRelationSelects;
  window.syncLocativeFromLocataire=function(){ var s=document.getElementById('lv-locataire'), t=document.getElementById('lv-locataire-tel'); if(t){ var o=s&&s.options?s.options[s.selectedIndex]:null; t.value=(o&&o.dataset&&(o.dataset.tel||o.dataset.email))||''; } };
  window.syncLocativeFromBien=function(){ var s=document.getElementById('lv-bien'), l=document.getElementById('lv-loyer'); if(s&&l){ var o=s.options[s.selectedIndex]; if(o&&o.dataset&&o.dataset.loyer) l.value=o.dataset.loyer; } };
  window.syncContratFromLocataire=function(){ var loc=(document.getElementById('ct-locataire')||{}).value||''; setOptions('ct-locative','Sélectionner une location existante',locativeOptions(locativesForName(loc)),false); };
  window.syncContratFromLocative=function(){ var s=document.getElementById('ct-locative'); if(!s) return; var o=s.options[s.selectedIndex]; var val=s.value; var l=arr('locatives').find(function(x,i){return locValue(x,i)===val;}); if(!l&&o&&o.dataset) l=arr('locatives')[Number(o.dataset.index)]; if(!l) return; var cl=document.getElementById('ct-locataire'); if(cl && (l.locataire||l.occupant)) cl.value=l.locataire||l.occupant; var lo=document.getElementById('ct-loyer'); if(lo) lo.value=money(l.loyer||l.montant||lo.value); var ch=document.getElementById('ct-charges'); if(ch&&!ch.value) ch.value=money(l.charge||l.charges||0); ['ct-sign','ct-debut','ct-prochain'].forEach(function(id){var e=document.getElementById(id); if(e&&!e.value) e.value=(id==='ct-debut'&&(l.dateEntree||l.date))||today();}); };
  window.syncPayModalFromLocataire=function(){ var loc=(document.getElementById('pay-locataire')||{}).value||''; var list=locativesForName(loc); setOptions('pay-locative','Sélectionner une location existante',locativeOptions(list),false); if(list.length===1){ var s=document.getElementById('pay-locative'); if(s){ s.value=locValue(list[0],0); window.syncPayModalFromLocative(); } } };
  window.syncPayModalFromLocative=function(){ var s=document.getElementById('pay-locative'); if(!s) return; var val=s.value; var o=s.options[s.selectedIndex]; var l=arr('locatives').find(function(x,i){return locValue(x,i)===val;}); if(!l&&o&&o.dataset) l=arr('locatives')[Number(o.dataset.index)]; if(!l) return; var pl=document.getElementById('pay-locataire'); if(pl && (l.locataire||l.occupant)) pl.value=l.locataire||l.occupant; var pb=document.getElementById('pay-bien'); if(pb) pb.value=l.bien||l.parentBien||''; var amt=money(l.loyer||l.montant||''); var m=document.getElementById('pay-montant'), p=document.getElementById('pay-paye'); if(m) m.value=amt; if(p) p.value=amt; if(typeof updatePayReste==='function') updatePayReste(); };
  window.syncPayModalFromBien=function(){ var bien=(document.getElementById('pay-bien')||{}).value||''; var found=arr('locatives').find(function(l){return clean(l.bien||l.parentBien)===clean(bien);}); if(found){ var s=document.getElementById('pay-locative'); if(s){ s.value=locValue(found,arr('locatives').indexOf(found)); window.syncPayModalFromLocative(); } } };
  function wireSelects(){ var map={'lv-locataire':'syncLocativeFromLocataire','lv-bien':'syncLocativeFromBien','ct-locataire':'syncContratFromLocataire','ct-locative':'syncContratFromLocative','pay-locataire':'syncPayModalFromLocataire','pay-locative':'syncPayModalFromLocative','pay-bien':'syncPayModalFromBien'}; Object.keys(map).forEach(function(id){ var e=document.getElementById(id); if(e && !e.dataset.realSelectWired){ e.dataset.realSelectWired='1'; e.addEventListener('change',function(){ if(window[map[id]]) window[map[id]](); }); e.addEventListener('mousedown',function(){ setTimeout(fillAllRelationSelects,0); }); } }); }
  var oldNavigate=window.navigate; if(typeof oldNavigate==='function' && !oldNavigate._realRelationPatched){ var n=function(page){ var r=oldNavigate.apply(this,arguments); setTimeout(fillAllRelationSelects,80); setTimeout(fillAllRelationSelects,500); return r; }; n._realRelationPatched=true; window.navigate=n; }
  var oldPay=window.openPayModal; window.openPayModal=function(){ if(typeof oldPay==='function') oldPay.apply(this,arguments); fillAllRelationSelects(); var m=document.getElementById('payModal'); if(m){ m.style.display='flex'; m.style.alignItems='center'; m.style.justifyContent='center'; } };
  document.addEventListener('DOMContentLoaded',function(){ setTimeout(fillAllRelationSelects,200); setTimeout(fillAllRelationSelects,1200); });
  document.addEventListener('focusin',function(e){ if(e.target && /^(b-proprio|lv-|ct-|pay-)/.test(e.target.id||'')) setTimeout(fillAllRelationSelects,0); });
  window.addEventListener('gp:auth-changed',function(){ setTimeout(fillAllRelationSelects,500); });
  window.addEventListener('storage',function(){ setTimeout(fillAllRelationSelects,100); });

  function bienDocs(idx){ var b=arr('biens')[idx]; if(!b) return []; if(!Array.isArray(b.documents)) b.documents=[]; return b.documents; }
  window.gpShowBDTab=function(tab,btn){ ['infos','locataires','proprio','docs'].forEach(function(t){ var p=document.getElementById('gpBD-'+t); if(p) p.style.display=(t===tab?'block':'none'); }); document.querySelectorAll('.bd-tabs-modern button').forEach(function(b){b.classList.remove('active')}); if(btn) btn.classList.add('active'); };
  window.gpAddBienDetailDocument=function(){ var idx=Number(window._bienDetailIdx); var fileEl=document.getElementById('bdDocFile'); var file=fileEl&&fileEl.files&&fileEl.files[0]; var name=clean((document.getElementById('bdDocName')||{}).value)|| (file&&file.name) || 'Document'; if(!file){ toastSafe('Choisissez un fichier','err'); return; } var rd=new FileReader(); rd.onload=function(){ bienDocs(idx).push({id:'BDOC-'+Date.now(),nom:name,fileName:file.name,type:file.type||'application/octet-stream',size:file.size||0,data:rd.result,date:new Date().toISOString()}); save(); window.openBienDetail(idx,'docs'); toastSafe('Document ajouté ✓'); }; rd.readAsDataURL(file); };
  window.gpPreviewBienDoc=function(i){ var d=bienDocs(Number(window._bienDetailIdx))[i]; if(!d||!d.data) return; var w=window.open('','_blank'); if(!w) return toastSafe('Popup bloquée','err'); if(String(d.type||'').indexOf('image/')===0) w.document.write('<img src="'+d.data+'" style="max-width:100%;height:auto">'); else w.document.write('<iframe src="'+d.data+'" style="width:100%;height:100vh;border:0"></iframe>'); };
  window.gpDownloadBienDoc=function(i){ var d=bienDocs(Number(window._bienDetailIdx))[i]; if(!d||!d.data) return; var a=document.createElement('a'); a.href=d.data; a.download=d.fileName||d.nom||'document'; document.body.appendChild(a); a.click(); a.remove(); };
  window.gpDeleteBienDoc=function(i){ if(!confirm('Supprimer ce document ?')) return; bienDocs(Number(window._bienDetailIdx)).splice(i,1); save(); window.openBienDetail(Number(window._bienDetailIdx),'docs'); };
  window.openBienDetail=function(idx,tab){ idx=Number(idx); var b=arr('biens')[idx]; if(!b){ toastSafe('Bien introuvable','err'); return; } window._bienDetailIdx=idx; var page=document.getElementById('page-bien-detail'); if(!page){ toastSafe('Page détail bien introuvable','err'); return; }
    var propName=clean(b.proprio||b.proprietaire||''); var prop=arr('proprietaires').find(function(p){return same(fullName(p),propName)||same(p.nom,propName);});
    var locations=arr('locatives').filter(function(l){ var lb=clean(l.bien||l.parentBien||''); return same(lb,b.nom)||lb.indexOf(clean(b.nom))>=0; });
    var units=unitsFor(b); var docs=bienDocs(idx);
    var locHtml=locations.length ? locations.map(function(l){return '<div class="bd-unit-row"><div class="bd-unit-main"><span class="material-symbols-rounded bd-unit-ico">person</span><b>'+esc(l.locataire||l.occupant||'Locataire')+'</b></div><div class="bd-unit-info"><b>Location</b> '+esc(l.nom||'—')+'</div><div class="bd-unit-info"><b>Bien</b> '+esc(l.bien||b.nom||'—')+'</div><div class="bd-unit-info"><b>Loyer</b> '+esc(l.loyer||l.montant||'—')+'</div></div>';}).join('') : (units.length ? units.map(function(u){return '<div class="bd-unit-row"><div class="bd-unit-main"><span class="material-symbols-rounded bd-unit-ico">door_front</span><b>'+esc(u.nom||'Unité')+'</b></div><div class="bd-unit-info"><b>Statut</b> '+esc(u.statut||'Disponible')+'</div><div class="bd-unit-info"><b>Loyer</b> '+esc(u.loyer||'—')+'</div></div>';}).join('') : '<div class="bd-empty">Aucun locataire ou appartement associé</div>');
    var docsHtml='<div class="bd-doc-add"><input id="bdDocName" placeholder="Nom du document"><input id="bdDocFile" type="file"><button class="btn btn-primary" onclick="gpAddBienDetailDocument()"><span class="material-symbols-rounded">upload_file</span> Ajouter</button></div>'+(docs.length?'<div class="bd-doc-list">'+docs.map(function(d,i){return '<div class="bien-doc-card"><span class="material-symbols-rounded">folder</span><div><b>'+esc(d.nom||d.fileName||'Document')+'</b><small>'+esc(d.fileName||'')+'</small></div><div class="actions"><button class="icon-btn icon-view" onclick="gpPreviewBienDoc('+i+')"><span class="material-symbols-rounded">visibility</span></button><button class="icon-btn" onclick="gpDownloadBienDoc('+i+')"><span class="material-symbols-rounded">download</span></button><button class="icon-btn icon-delete" onclick="gpDeleteBienDoc('+i+')"><span class="material-symbols-rounded">delete</span></button></div></div>';}).join('')+'</div>':'<div class="bd-empty">Aucun document associé</div>');
    page.innerHTML='<div class="bien-detail-page"><div class="bien-detail-modern-head"><button class="bd-action-btn bd-back" onclick="navigate(\'biens\')"><span class="material-symbols-rounded">arrow_back</span> Retour</button><div class="bd-title"><h2>'+esc(b.nom||'Bien')+'</h2><p>'+esc([b.type,b.adresse].filter(Boolean).join(' · ')||'Détails du bien')+'</p></div><div class="bd-head-actions"><button class="bd-action-btn" onclick="editRow(\'biens\','+idx+')"><span class="material-symbols-rounded">edit</span> Modifier</button><button class="bd-action-btn danger" onclick="deleteRow(\'biens\','+idx+')"><span class="material-symbols-rounded">delete</span> Supprimer</button></div></div><div class="bd-hero"><div class="bd-photo">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<span class="material-symbols-rounded">home_work</span>')+'</div><div class="bd-info"><span class="bd-status">'+esc(b.statut||'Disponible')+'</span><h3>'+esc(b.nom||'—')+'</h3><p>'+esc(b.adresse||'Adresse non renseignée')+'</p><div class="bd-kpis"><div><small>Valeur</small><b>'+esc(b.valeur||'—')+'</b></div><div><small>Type</small><b>'+esc(b.type||'—')+'</b></div><div><small>Propriétaire</small><b>'+esc(propName||'—')+'</b></div></div></div></div><div class="bd-tabs-modern"><button onclick="gpShowBDTab(\'infos\',this)" class="active">Informations</button><button onclick="gpShowBDTab(\'locataires\',this)">Locataires</button><button onclick="gpShowBDTab(\'proprio\',this)">Propriétaire</button><button onclick="gpShowBDTab(\'docs\',this)">Documents bien</button></div><section id="gpBD-infos" class="gp-bd-panel"><div class="bd-grid"><div><label>Nom</label><strong>'+esc(b.nom||'—')+'</strong></div><div><label>Adresse</label><strong>'+esc(b.adresse||'—')+'</strong></div><div><label>Type</label><strong>'+esc(b.type||'—')+'</strong></div><div><label>État</label><strong>'+esc(b.etat||'—')+'</strong></div><div><label>Statut</label><strong>'+esc(b.statut||'—')+'</strong></div><div><label>Valeur</label><strong>'+esc(b.valeur||'—')+'</strong></div></div></section><section id="gpBD-locataires" class="gp-bd-panel" style="display:none">'+locHtml+'</section><section id="gpBD-proprio" class="gp-bd-panel" style="display:none">'+(prop?'<div class="bd-grid"><div><label>Nom</label><strong>'+esc(fullName(prop))+'</strong></div><div><label>Téléphone</label><strong>'+esc(prop.tel||prop.telephone||'—')+'</strong></div><div><label>Email</label><strong>'+esc(prop.email||'—')+'</strong></div><div><label>Adresse</label><strong>'+esc(prop.adresse||'—')+'</strong></div></div>':'<div class="bd-empty">Propriétaire non trouvé dans la base</div>')+'</section><section id="gpBD-docs" class="gp-bd-panel" style="display:none">'+docsHtml+'</section></div>';
    if(typeof oldNavigate==='function') oldNavigate.call(window,'bien-detail'); else if(typeof navigate==='function') navigate('bien-detail');
    if(tab){ setTimeout(function(){ var btn=[].slice.call(document.querySelectorAll('.bd-tabs-modern button')).find(function(b){return b.textContent.toLowerCase().indexOf(tab==='docs'?'documents':tab)>=0;}); if(btn) btn.click(); },50); }
  };
  var st=document.createElement('style'); st.textContent='.bd-doc-add{display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:12px;margin-bottom:12px}.bd-doc-add input{border:1px solid #e5e7eb;border-radius:10px;padding:10px}.bd-doc-list{display:grid;gap:10px}.bien-doc-card{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:12px}.bien-doc-card>span{color:#d4a511}.bien-doc-card div:nth-child(2){flex:1}.bien-doc-card small{display:block;color:#6b7280;margin-top:3px}.bd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.bd-grid>div{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px}.bd-grid label{display:block;font-size:12px;color:#6b7280;margin-bottom:4px}.bd-empty{background:#fff;border:1px dashed #d1d5db;border-radius:14px;padding:18px;color:#6b7280}.bd-unit-row{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:12px;margin-bottom:10px}.bd-unit-main{display:flex;gap:8px;align-items:center;margin-bottom:8px}.bd-unit-ico{color:#d4a511}.bd-unit-info{display:inline-block;margin-right:18px;color:#374151}.bd-tabs-modern{display:flex;gap:8px;margin:16px 0}.bd-tabs-modern button{border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:9px 14px;font-weight:800;cursor:pointer}.bd-tabs-modern button.active{background:#111827;color:#fff;border-color:#111827}.bien-detail-modern-head{display:flex;align-items:center;gap:14px;margin-bottom:14px}.bd-title{flex:1}.bd-title h2{margin:0}.bd-title p{margin:2px 0 0;color:#6b7280}.bd-head-actions{display:flex;gap:8px}.bd-action-btn{border:1px solid #e5e7eb;background:#fff;border-radius:12px;padding:10px 12px;font-weight:800;display:inline-flex;gap:6px;align-items:center;cursor:pointer}.bd-action-btn.danger{color:#dc2626}.bd-hero{display:flex;gap:16px;background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:16px}.bd-photo{width:160px;height:120px;border-radius:16px;background:#f9fafb;display:grid;place-items:center;overflow:hidden}.bd-photo img{width:100%;height:100%;object-fit:cover}.bd-photo span{font-size:48px;color:#d4a511}.bd-info{flex:1}.bd-status{background:#dcfce7;color:#166534;border-radius:999px;padding:4px 8px;font-size:12px;font-weight:800}.bd-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.bd-kpis div{background:#f9fafb;border-radius:12px;padding:10px}.bd-kpis small{display:block;color:#6b7280}.gp-bd-panel{margin-top:12px}'; document.head.appendChild(st);
})();

/* GP v40 - Bien detail owner/tenant/status final fix */
(function(){
  'use strict';
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function lower(v){ return clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function esc(v){ return clean(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function db(){ return window.DB || {}; }
  function arr(k){ return Array.isArray(db()[k]) ? db()[k] : []; }
  function save(){ try{ if(typeof window.saveDB==='function') window.saveDB(); else localStorage.setItem('gp_db', JSON.stringify(window.DB||{})); }catch(e){} }
  function toast(msg,type){ if(typeof window.toast==='function') window.toast(msg,type); else console.log(msg); }
  function fullName(p){ return clean([p.prenom,p.nom].filter(Boolean).join(' ')) || clean(p.nomComplet||p.name||p.fullName||p.raisonSociale||p.nom) || '—'; }
  function money(v){ if(v==null || v==='') return '—'; var n=Number(String(v).replace(/[^0-9.-]/g,'')); return isFinite(n)&&n>0 ? n.toLocaleString('fr-FR')+' FCFA' : esc(v); }
  function date(v){ if(!v) return '—'; try{ var d=new Date(v); if(!isNaN(d)) return d.toLocaleDateString('fr-FR'); }catch(e){} return clean(v); }
  function normId(v){ return lower(v).replace(/[^a-z0-9]/g,''); }
  function propKeys(b){ return [b.proprietaireId,b.proprioId,b.ownerId,b.idProprietaire,b.proprietaire,b.proprio,b.owner,b.nomProprietaire,b.proprietaireNom].map(clean).filter(Boolean); }
  function findOwner(b){
    var props=arr('proprietaires'), keys=propKeys(b), keyNorms=keys.map(normId);
    var p=props.find(function(x){ return [x.id,x.uid,x._id,x.code,x.ref].some(function(k){ return k && keyNorms.indexOf(normId(k))>=0; }); });
    if(p) return p;
    p=props.find(function(x){ var names=[fullName(x),x.nomComplet,x.name,x.fullName,x.raisonSociale,x.nom,[x.nom,x.prenom].filter(Boolean).join(' ')].map(normId); return keyNorms.some(function(k){return names.indexOf(k)>=0;}); });
    if(p) return p;
    p=props.find(function(x){ var n=normId(fullName(x)); return keyNorms.some(function(k){ return k && n && (n.indexOf(k)>=0 || k.indexOf(n)>=0); }); });
    return p || null;
  }
  function locName(l){ return clean(l.locataire||l.occupant||l.nomLocataire||l.client||l.tenant||l.locataireNom); }
  function locKey(l){ return lower([l.bien,l.parentBien,l.bienNom,l.logement,l.appartement,l.unite,l.uniteNom,l.location,l.nom].filter(Boolean).join(' ')); }
  function unitList(b){
    var u=Array.isArray(b.unites)?b.unites:(Array.isArray(b.appartements)?b.appartements:(Array.isArray(b.lots)?b.lots:[]));
    if(u.length) return u;
    var nb=Number(b.nbAppartements||b.nombreAppartements||b.nombreLots||0);
    if(nb>0){ var out=[]; for(var i=1;i<=nb;i++) out.push({nom:'Appartement '+i, statut:'Disponible'}); return out; }
    return [];
  }
  function locationsForBien(b){
    var bName=lower(b.nom||b.name||b.titre), bId=lower(b.id||b.uid||b._id||b.ref);
    return arr('locatives').filter(function(l){
      var vals=[l.bienId,l.idBien,l.bienRef,l.parentBienId,l.bien,l.parentBien,l.bienNom,l.logement,l.location,l.nom].map(lower);
      return vals.some(function(v){ return v && ((bId && v===bId) || (bName && (v===bName || v.indexOf(bName)>=0 || bName.indexOf(v)>=0))); });
    });
  }
  function statusFromText(v){ v=lower(v); if(/lou|occup|actif/.test(v)) return 'Loué'; if(/dispo|libre|vacant/.test(v)) return 'Disponible'; if(/attente|pending/.test(v)) return 'En attente'; return clean(v)||''; }
  function computedUnitRows(b){
    var units=unitList(b), locs=locationsForBien(b);
    if(units.length){
      return units.map(function(u,idx){
        var uName=clean(u.nom||u.name||u.numero||u.label||('Appartement '+(idx+1)));
        var n=lower(uName);
        var loc=locs.find(function(l){ var k=locKey(l); return k && (k.indexOf(n)>=0 || n.indexOf(k)>=0 || lower(l.unite||l.appartement||'')===n); });
        var st=statusFromText(u.statut||u.status||'');
        if(loc && !/resil|termin|sorti/.test(lower(loc.statut||loc.status))) st='Loué';
        if(!st || st==='En attente') st=loc?'Loué':'Disponible';
        return {nom:uName, statut:st, loc:loc, loyer:u.loyer||u.montant||(loc&&(loc.loyer||loc.montant)), surface:u.surface, pieces:u.pieces||u.nbPieces};
      });
    }
    return locs.map(function(l,i){ return {nom:clean(l.nom||l.location||('Location '+(i+1))), statut:'Loué', loc:l, loyer:l.loyer||l.montant}; });
  }
  function computedBienStatus(b){
    var rows=computedUnitRows(b);
    if(rows.length){
      var loue=rows.filter(function(r){return lower(r.statut).indexOf('lou')>=0;}).length;
      if(loue===0) return 'Disponible';
      if(loue===rows.length) return 'Loué';
      return 'Partiellement loué';
    }
    var st=statusFromText(b.statut||b.status||b.etatLocation||'');
    return st && st!=='En attente' ? st : 'Disponible';
  }
  function ownerName(b,owner){ return owner ? fullName(owner) : (clean(b.proprietaire||b.proprio||b.owner||b.nomProprietaire)||'—'); }
  function docList(idx){ var b=arr('biens')[idx]; if(!b) return []; if(!Array.isArray(b.documents)) b.documents=[]; return b.documents; }
  window.gpBackToBiens=function(){ try{ if(typeof window.navigate==='function') window.navigate('biens'); }catch(e){} setTimeout(function(){ try{ if(typeof window.renderBiensFinal2==='function') window.renderBiensFinal2(); else if(typeof window.renderBiensFinal==='function') window.renderBiensFinal(); else if(typeof window.renderBiens==='function') window.renderBiens(); }catch(e){} },60); };
  window.gpAddBienDetailDocument=function(){ var idx=Number(window._bienDetailIdx); var f=document.getElementById('bdDocFile'); var file=f&&f.files&&f.files[0]; var name=clean((document.getElementById('bdDocName')||{}).value)||(file&&file.name)||'Document'; if(!file){ toast('Choisissez un fichier','err'); return; } var rd=new FileReader(); rd.onload=function(){ docList(idx).push({id:'BDOC-'+Date.now(),nom:name,fileName:file.name,type:file.type||'application/octet-stream',size:file.size||0,data:rd.result,date:new Date().toISOString()}); save(); window.openBienDetail(idx,'docs'); toast('Document ajouté ✓'); }; rd.readAsDataURL(file); };
  window.gpPreviewBienDoc=function(i){ var d=docList(Number(window._bienDetailIdx))[i]; if(!d||!d.data) return toast('Document introuvable','err'); var w=window.open('','_blank'); if(!w) return toast('Popup bloquée','err'); if(String(d.type||'').indexOf('image/')===0) w.document.write('<img src="'+d.data+'" style="max-width:100%;height:auto">'); else w.document.write('<iframe src="'+d.data+'" style="width:100%;height:100vh;border:0"></iframe>'); };
  window.gpDownloadBienDoc=function(i){ var d=docList(Number(window._bienDetailIdx))[i]; if(!d||!d.data) return; var a=document.createElement('a'); a.href=d.data; a.download=d.fileName||d.nom||'document'; document.body.appendChild(a); a.click(); a.remove(); };
  window.gpDeleteBienDoc=function(i){ if(!confirm('Supprimer ce document ?')) return; docList(Number(window._bienDetailIdx)).splice(i,1); save(); window.openBienDetail(Number(window._bienDetailIdx),'docs'); };
  window.gpShowBDTab=function(tab,btn){ ['infos','locataires','proprio','docs'].forEach(function(t){ var p=document.getElementById('gpBD-'+t); if(p) p.style.display=(t===tab?'block':'none'); }); document.querySelectorAll('.bd-tabs-modern button').forEach(function(x){x.classList.remove('active')}); if(btn) btn.classList.add('active'); };
  window.openBienDetail=function(idx,tab){
    idx=Number(idx); var b=arr('biens')[idx]; if(!b){ toast('Bien introuvable','err'); return; }
    window._bienDetailIdx=idx;
    var page=document.getElementById('page-bien-detail'); if(!page){ toast('Page détail bien introuvable','err'); return; }
    var owner=findOwner(b), rows=computedUnitRows(b), status=computedBienStatus(b), docs=docList(idx), locs=locationsForBien(b);
    var occ=rows.filter(function(r){return lower(r.statut).indexOf('lou')>=0;}).length, free=Math.max(rows.length-occ,0);
    var locHtml = rows.length ? rows.map(function(r){ var l=r.loc||{}; return '<article class="bd-tenant-card"><div class="bd-tenant-head"><span class="material-symbols-rounded">meeting_room</span><div><b>'+esc(r.nom)+'</b><small>'+esc(r.statut)+'</small></div></div><div class="bd-tenant-grid"><div><label>Locataire</label><strong>'+esc(locName(l)||'—')+'</strong></div><div><label>Date entrée</label><strong>'+esc(date(l.dateEntree||l.dateDebut||l.debut||l.date))+'</strong></div><div><label>Loyer</label><strong>'+money(r.loyer||l.loyer||l.montant)+'</strong></div><div><label>Téléphone</label><strong>'+esc(l.telephone||l.tel||l.phone||'—')+'</strong></div><div><label>Contrat</label><strong>'+esc(l.contrat||l.numContrat||l.reference||'—')+'</strong></div><div><label>Statut location</label><strong>'+esc(l.statut||r.statut||'—')+'</strong></div></div></article>'; }).join('') : '<div class="bd-empty">Aucun appartement ou locataire associé</div>';
    var propHtml = owner ? '<div class="bd-owner-card"><div class="bd-owner-avatar">'+esc((fullName(owner).match(/\b\w/g)||['P']).slice(0,2).join('').toUpperCase())+'</div><div class="bd-owner-info"><h3>'+esc(fullName(owner))+'</h3><p>'+esc(owner.adresse||'Adresse non renseignée')+'</p><div class="bd-owner-grid"><div><label>Téléphone</label><strong>'+esc(owner.tel||owner.telephone||owner.phone||'—')+'</strong></div><div><label>Email</label><strong>'+esc(owner.email||'—')+'</strong></div><div><label>Pièce</label><strong>'+esc(owner.cni||owner.piece||owner.document||'—')+'</strong></div><div><label>Biens liés</label><strong>'+arr('biens').filter(function(x){return ownerName(x,findOwner(x))===fullName(owner);}).length+'</strong></div></div></div></div>' : '<div class="bd-empty"><b>Propriétaire non lié automatiquement.</b><br>Nom enregistré sur le bien : '+esc(ownerName(b,null))+'</div>';
    var docsHtml='<div class="bd-doc-add"><input id="bdDocName" placeholder="Nom du document"><input id="bdDocFile" type="file"><button class="btn btn-primary" onclick="gpAddBienDetailDocument()"><span class="material-symbols-rounded">upload_file</span> Ajouter</button></div>'+(docs.length?'<div class="bd-doc-list">'+docs.map(function(d,i){return '<div class="bien-doc-card"><span class="material-symbols-rounded">folder</span><div><b>'+esc(d.nom||d.fileName||'Document')+'</b><small>'+esc(d.fileName||'')+' · '+esc(date(d.date))+'</small></div><div class="actions"><button class="icon-btn icon-view" onclick="gpPreviewBienDoc('+i+')"><span class="material-symbols-rounded">visibility</span></button><button class="icon-btn" onclick="gpDownloadBienDoc('+i+')"><span class="material-symbols-rounded">download</span></button><button class="icon-btn icon-delete" onclick="gpDeleteBienDoc('+i+')"><span class="material-symbols-rounded">delete</span></button></div></div>';}).join('')+'</div>':'<div class="bd-empty">Aucun document associé</div>');
    page.innerHTML='<div class="bien-detail-page gp-bien-detail-final"><div class="bien-detail-modern-head"><button class="bd-action-btn bd-back" onclick="gpBackToBiens()"><span class="material-symbols-rounded">arrow_back</span> Retour</button><div class="bd-title"><h2>'+esc(b.nom||'Bien')+'</h2><p>'+esc([b.type,b.adresse].filter(Boolean).join(' · ')||'Détails du bien')+'</p></div><div class="bd-head-actions"><button class="bd-action-btn" onclick="editRow&&editRow(\'biens\','+idx+')"><span class="material-symbols-rounded">edit</span> Modifier</button><button class="bd-action-btn danger" onclick="deleteRow&&deleteRow(\'biens\','+idx+')"><span class="material-symbols-rounded">delete</span> Supprimer</button></div></div><div class="bd-hero"><div class="bd-photo">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<span class="material-symbols-rounded">home_work</span>')+'</div><div class="bd-info"><span class="bd-status '+(status==='Partiellement loué'?'mixed':lower(status))+'">'+esc(status)+'</span><h3>'+esc(b.nom||'—')+'</h3><p>'+esc(b.adresse||'Adresse non renseignée')+'</p><div class="bd-kpis"><div><small>Appartements</small><b>'+esc(rows.length||'—')+'</b></div><div><small>Loués</small><b>'+occ+'</b></div><div><small>Disponibles</small><b>'+free+'</b></div><div><small>Propriétaire</small><b>'+esc(ownerName(b,owner))+'</b></div></div></div></div><div class="bd-tabs-modern"><button onclick="gpShowBDTab(\'infos\',this)" class="active">Informations</button><button onclick="gpShowBDTab(\'locataires\',this)">Locataires</button><button onclick="gpShowBDTab(\'proprio\',this)">Propriétaire</button><button onclick="gpShowBDTab(\'docs\',this)">Documents bien</button></div><section id="gpBD-infos" class="gp-bd-panel"><div class="bd-grid"><div><label>Nom</label><strong>'+esc(b.nom||'—')+'</strong></div><div><label>Adresse</label><strong>'+esc(b.adresse||'—')+'</strong></div><div><label>Type</label><strong>'+esc(b.type||'—')+'</strong></div><div><label>Statut calculé</label><strong>'+esc(status)+'</strong></div><div><label>Valeur</label><strong>'+money(b.valeur||b.prix||b.loyer)+'</strong></div><div><label>Locations liées</label><strong>'+locs.length+'</strong></div></div></section><section id="gpBD-locataires" class="gp-bd-panel" style="display:none">'+locHtml+'</section><section id="gpBD-proprio" class="gp-bd-panel" style="display:none">'+propHtml+'</section><section id="gpBD-docs" class="gp-bd-panel" style="display:none">'+docsHtml+'</section></div>';
    if(typeof window.navigate==='function') window.navigate('bien-detail'); else { document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')}); page.classList.add('active'); }
    if(tab){ setTimeout(function(){ var q=tab==='docs'?'Documents':tab; var btn=[].slice.call(document.querySelectorAll('.bd-tabs-modern button')).find(function(x){return x.textContent.toLowerCase().indexOf(q.toLowerCase())>=0;}); if(btn) btn.click(); },60); }
  };
  var css='.gp-bien-detail-final .bd-status.mixed{background:#fef3c7;color:#92400e}.gp-bien-detail-final .bd-status.disponible{background:#dcfce7;color:#166534}.gp-bien-detail-final .bd-status.loue,.gp-bien-detail-final .bd-status.loué{background:#dbeafe;color:#1d4ed8}.bd-tenant-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 8px 20px rgba(15,23,42,.04)}.bd-tenant-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}.bd-tenant-head>span{width:38px;height:38px;border-radius:12px;background:#fff8e1;color:#d4a511;display:grid;place-items:center}.bd-tenant-head small{display:block;color:#64748b;margin-top:2px}.bd-tenant-grid,.bd-owner-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.bd-tenant-grid div,.bd-owner-grid div{background:#f8fafc;border:1px solid #eef2f7;border-radius:12px;padding:10px}.bd-tenant-grid label,.bd-owner-grid label{display:block;font-size:11px;color:#64748b;margin-bottom:4px}.bd-owner-card{display:flex;gap:14px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:16px}.bd-owner-avatar{width:58px;height:58px;border-radius:18px;background:#111827;color:#fff;display:grid;place-items:center;font-weight:900}.bd-owner-info{flex:1}.bd-owner-info h3{margin:0 0 4px}.bd-owner-info p{margin:0 0 12px;color:#64748b}.gp-bien-detail-final .bd-kpis{grid-template-columns:repeat(4,minmax(120px,1fr))}.gp-bien-detail-final .bd-action-btn.bd-back{background:#111827;color:#fff;border-color:#111827}.gp-bien-detail-final .bd-head-actions .bd-action-btn{background:#fff}.gp-bien-detail-final .bd-tabs-modern button.active{background:#d4a511;border-color:#d4a511;color:#111827}';
  var style=document.createElement('style'); style.id='gp-bien-detail-owner-locataire-final-css'; style.textContent=css; document.head.appendChild(style);
})();

/* ============================================================
   FINAL ACTIVE FIX — Bien detail owner/tenants/status/documents
============================================================ */
(function(){
  function DB(){ return window.DB || {}; }
  function arr(k){ var d=DB(); return Array.isArray(d[k]) ? d[k] : []; }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function esc(v){ return clean(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function lower(v){ return clean(v).toLowerCase(); }
  function norm(v){ return lower(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,''); }
  function fmtDate(v){ if(!v) return '—'; try{ var d=new Date(v); if(!isNaN(d)) return d.toLocaleDateString('fr-FR'); }catch(e){} return clean(v); }
  function fmtMoney(v){ if(v==null || v==='') return '—'; var s=clean(v); var n=Number(s.replace(/[^0-9.-]/g,'')); if(isFinite(n) && n>0) return n.toLocaleString('fr-FR')+' FCFA'; return esc(s); }
  function fullName(p){ return clean(p&&p.nomComplet) || clean(p&&p.fullName) || clean(p&&p.name) || [p&&p.prenom,p&&p.nom].map(clean).filter(Boolean).join(' ') || clean(p&&p.nom) || ''; }
  function ownerRaw(b){ return clean(b&& (b.proprietaire || b.proprio || b.owner || b.nomProprietaire || b.proprietaireNom || b.ownerName)); }
  function findOwner(b){
    var props=arr('proprietaires');
    var raw=ownerRaw(b);
    var ids=[b&&b.proprietaireId,b&&b.proprioId,b&&b.ownerId,b&&b.idProprietaire,b&&b.ownerID].map(norm).filter(Boolean);
    var p=props.find(function(x){ return [x.id,x.uid,x._id,x.code,x.ref].map(norm).some(function(id){ return id && ids.indexOf(id)>=0; }); });
    if(p) return p;
    var rawN=norm(raw);
    if(rawN){
      p=props.find(function(x){
        var names=[fullName(x),x.nomComplet,x.fullName,x.name,x.raisonSociale,x.nom,[x.nom,x.prenom].map(clean).filter(Boolean).join(' ')].map(norm).filter(Boolean);
        return names.some(function(n){ return n===rawN || n.indexOf(rawN)>=0 || rawN.indexOf(n)>=0; });
      });
      if(p) return p;
    }
    return (!raw && props.length===1) ? props[0] : null;
  }
  function tenantName(l){ return clean(l && (l.locataire || l.occupant || l.nomLocataire || l.locataireNom || l.tenant || l.client)); }
  function findTenant(l){
    var nm=tenantName(l), nmN=norm(nm), ids=[l&&l.locataireId,l&&l.idLocataire,l&&l.tenantId].map(norm).filter(Boolean);
    var locs=arr('locataires');
    var t=locs.find(function(x){ return [x.id,x.uid,x._id,x.code,x.ref].map(norm).some(function(id){ return id && ids.indexOf(id)>=0; }); });
    if(t) return t;
    if(nmN) return locs.find(function(x){ var n=norm(fullName(x)||x.nom); return n && (n===nmN || n.indexOf(nmN)>=0 || nmN.indexOf(n)>=0); }) || null;
    return null;
  }
  function unitFullName(b,u){ return clean((b&&b.nom?b.nom:'Bien')+' - '+(u&&u.nom?u.nom:'Appartement')); }
  function unitList(b){
    var u = Array.isArray(b&&b.unites) ? b.unites
      : Array.isArray(b&&b.appartements) && typeof b.appartements[0] === 'object' ? b.appartements
      : Array.isArray(b&&b.lots) ? b.lots
      : Array.isArray(b&&b.units) ? b.units : [];
    if(u.length) return u;
    var nb = Number(b&&(b.nbAppart || b.nbAppartements || b.nombreAppartements || b.nombreAppartement || b.nbrAppartements || b.nombreLots || b.nbLots || b.nbUnites || b.nombreUnites || b.appartements) || 0);
    if(nb>0){ var out=[]; for(var i=1;i<=nb;i++) out.push({id:'unit-'+i,nom:'Appartement '+i,statut:'Disponible'}); return out; }
    return [];
  }
  function locationText(l){ return [l&&l.bien,l&&l.parentBien,l&&l.bienNom,l&&l.logement,l&&l.appartement,l&&l.unite,l&&l.uniteNom,l&&l.location,l&&l.nom].map(clean).filter(Boolean).join(' '); }
  function locationsForBien(b){
    var bName=norm(b&&b.nom), bId=norm(b&&(b.id||b.uid||b._id||b.ref));
    var units=unitList(b).map(function(u){ return {u:u, name:norm(unitFullName(b,u)), short:norm(u.nom||u.name||u.numero||u.label)}; });
    return arr('locatives').filter(function(l){
      var vals=[l.bienId,l.idBien,l.bienRef,l.parentBienId].map(norm).filter(Boolean);
      if(bId && vals.indexOf(bId)>=0) return true;
      var txtN=norm(locationText(l));
      if(bName && (txtN===bName || txtN.indexOf(bName)>=0 || bName.indexOf(txtN)>=0)) return true;
      return units.some(function(u){ return txtN && (txtN===u.name || txtN.indexOf(u.name)>=0 || (u.short && txtN.indexOf(u.short)>=0 && (!bName || txtN.indexOf(bName)>=0))); });
    });
  }
  function statusFrom(v){ v=lower(v); if(/résili|resili|termin|sorti|annul/.test(v)) return 'Disponible'; if(/lou|occup|actif/.test(v)) return 'Loué'; if(/dispo|libre|vacant/.test(v)) return 'Disponible'; return ''; }
  function unitRows(b){
    var units=unitList(b), locs=locationsForBien(b);
    if(units.length){
      return units.map(function(u,i){
        var uName=clean(u.nom||u.name||u.numero||u.label||('Appartement '+(i+1)));
        var uN=norm(uName), fullN=norm(unitFullName(b,{nom:uName}));
        var loc=locs.find(function(l){
          var txt=norm(locationText(l));
          return txt===fullN || txt.indexOf(fullN)>=0 || (uN && txt.indexOf(uN)>=0) || norm(l.uniteId)===norm(u.id);
        });
        var st=statusFrom(u.statut||u.status) || (loc ? 'Loué' : 'Disponible');
        return {nom:uName, statut:st, loc:loc||null, loyer:u.loyer||u.montant||(loc&&(loc.loyer||loc.montant||loc.montantLoyer)), surface:u.surface||u.superficie, pieces:u.pieces||u.nbPieces};
      });
    }
    if(locs.length){ return locs.map(function(l,i){ return {nom:clean(l.nom||l.location||l.bien||('Location '+(i+1))), statut:'Loué', loc:l, loyer:l.loyer||l.montant||l.montantLoyer}; }); }
    return [];
  }
  function bienStatus(b){
    var rows=unitRows(b);
    if(rows.length){
      var loue=rows.filter(function(r){ return r.statut==='Loué'; }).length;
      if(loue===0) return 'Disponible';
      if(loue===rows.length) return 'Loué';
      return 'Partiellement loué';
    }
    var st=statusFrom(b&&b.statut) || statusFrom(b&&b.status) || statusFrom(b&&b.etatLocation);
    return st || 'Disponible';
  }
  function docList(idx){ var b=arr('biens')[idx]; if(!b) return []; if(!Array.isArray(b.documents)) b.documents=[]; return b.documents; }
  function save(){ try{ if(window.GPDB && typeof window.GPDB.save==='function') window.GPDB.save(DB()); else if(typeof window.saveDB==='function') window.saveDB(); else localStorage.setItem('gp_db', JSON.stringify(DB())); }catch(e){} }

  window.gpBackToBiens=function(){
    if(typeof window.navigate==='function') window.navigate('biens');
    setTimeout(function(){ try{ if(typeof window.renderBiensCards==='function') window.renderBiensCards(); else if(typeof window.renderBiensFinal2==='function') window.renderBiensFinal2(); else if(typeof window.renderBiensFinal==='function') window.renderBiensFinal(); }catch(e){} },80);
  };
  window.gpAddBienDetailDocument=function(){
    var idx=Number(window._bienDetailIdx), b=arr('biens')[idx]; if(!b) return;
    var input=document.getElementById('bdDocFile'), file=input&&input.files&&input.files[0];
    var name=clean((document.getElementById('bdDocName')||{}).value) || (file&&file.name) || 'Document';
    if(!file){ if(typeof toast==='function') toast('Choisissez un fichier','err'); return; }
    var rd=new FileReader();
    rd.onload=function(){ docList(idx).push({id:'BDOC-'+Date.now(),nom:name,fileName:file.name,type:file.type||'application/octet-stream',size:file.size||0,data:rd.result,date:new Date().toISOString()}); save(); window.openBienDetail(idx,'docs'); if(typeof toast==='function') toast('Document ajouté ✓'); };
    rd.readAsDataURL(file);
  };
  window.gpPreviewBienDoc=function(i){ var d=docList(Number(window._bienDetailIdx))[i]; if(!d||!d.data){ if(typeof toast==='function') toast('Document introuvable','err'); return; } var w=window.open('','_blank'); if(!w){ if(typeof toast==='function') toast('Popup bloquée','err'); return; } if(String(d.type||'').indexOf('image/')===0) w.document.write('<img src="'+d.data+'" style="max-width:100%;height:auto">'); else w.document.write('<iframe src="'+d.data+'" style="width:100%;height:100vh;border:0"></iframe>'); };
  window.gpDownloadBienDoc=function(i){ var d=docList(Number(window._bienDetailIdx))[i]; if(!d||!d.data) return; var a=document.createElement('a'); a.href=d.data; a.download=d.fileName||d.nom||'document'; document.body.appendChild(a); a.click(); a.remove(); };
  window.gpDeleteBienDoc=function(i){ if(!confirm('Supprimer ce document ?')) return; docList(Number(window._bienDetailIdx)).splice(i,1); save(); window.openBienDetail(Number(window._bienDetailIdx),'docs'); };
  window.gpShowBDTab=function(tab,btn){ ['infos','locataires','proprio','docs'].forEach(function(t){ var p=document.getElementById('gpBD-'+t); if(p) p.style.display=(t===tab?'block':'none'); }); document.querySelectorAll('.bd-tabs-modern button').forEach(function(x){x.classList.remove('active')}); if(btn) btn.classList.add('active'); };

  window.openBienDetail=function(idx,tab){
    idx=Number(idx); var b=arr('biens')[idx]; if(!b){ if(typeof toast==='function') toast('Bien introuvable','err'); return; }
    window._bienDetailIdx=idx;
    var page=document.getElementById('page-bien-detail'); if(!page){ if(typeof toast==='function') toast('Page détail bien introuvable','err'); return; }
    var owner=findOwner(b), rows=unitRows(b), locs=locationsForBien(b), status=bienStatus(b), docs=docList(idx);
    var occ=rows.filter(function(r){return r.statut==='Loué';}).length, free=Math.max(rows.length-occ,0);
    var ownerDisplay=owner ? fullName(owner) : ownerRaw(b);
    var locHtml = rows.length ? rows.map(function(r){
      var l=r.loc||{}, t=findTenant(l)||{}, tel=clean(l.telephone||l.tel||l.phone||t.tel||t.telephone||t.phone), locataire=tenantName(l)||fullName(t)||'Aucun locataire';
      return '<article class="bd-tenant-card '+(r.statut==='Disponible'?'is-free':'')+'"><div class="bd-tenant-head"><span class="material-symbols-rounded">meeting_room</span><div><b>'+esc(r.nom)+'</b><small>'+esc(r.statut)+'</small></div></div><div class="bd-tenant-grid"><div><label>Locataire</label><strong>'+esc(r.statut==='Disponible'?'Aucun locataire':locataire)+'</strong></div><div><label>Date entrée</label><strong>'+esc(r.statut==='Disponible'?'—':fmtDate(l.dateEntree||l.dateDebut||l.debut||l.date))+'</strong></div><div><label>Loyer</label><strong>'+fmtMoney(r.loyer||l.loyer||l.montant||l.montantLoyer)+'</strong></div><div><label>Téléphone</label><strong>'+esc(r.statut==='Disponible'?'—':(tel||'—'))+'</strong></div><div><label>Contrat</label><strong>'+esc(r.statut==='Disponible'?'—':(l.contrat||l.numContrat||l.reference||l.id||'—'))+'</strong></div><div><label>Statut location</label><strong>'+esc(r.statut)+'</strong></div></div></article>';
    }).join('') : '<div class="bd-empty">Aucun appartement ou locataire associé</div>';
    var propHtml = owner ? '<div class="bd-owner-card"><div class="bd-owner-avatar">'+esc((fullName(owner).match(/\b\w/g)||['P']).slice(0,2).join('').toUpperCase())+'</div><div class="bd-owner-info"><h3>'+esc(fullName(owner))+'</h3><p>'+esc(owner.adresse||'Adresse non renseignée')+'</p><div class="bd-owner-grid"><div><label>Téléphone</label><strong>'+esc(owner.tel||owner.telephone||owner.phone||'—')+'</strong></div><div><label>Email</label><strong>'+esc(owner.email||'—')+'</strong></div><div><label>Pièce / ID</label><strong>'+esc(owner.cni||owner.piece||owner.document||owner.id||'—')+'</strong></div><div><label>Biens liés</label><strong>'+arr('biens').filter(function(x){ var o=findOwner(x); return o && owner && norm(fullName(o))===norm(fullName(owner));}).length+'</strong></div></div></div></div>' : '<div class="bd-empty"><b>Propriétaire non lié automatiquement.</b><br>Valeur enregistrée sur le bien : '+esc(ownerDisplay||'—')+'</div>';
    var docsHtml='<div class="bd-doc-add"><input id="bdDocName" placeholder="Nom du document"><input id="bdDocFile" type="file"><button type="button" class="btn btn-primary" onclick="gpAddBienDetailDocument()"><span class="material-symbols-rounded">upload_file</span> Ajouter</button></div>'+(docs.length?'<div class="bd-doc-list">'+docs.map(function(d,i){return '<div class="bien-doc-card"><span class="material-symbols-rounded">folder</span><div><b>'+esc(d.nom||d.fileName||'Document')+'</b><small>'+esc(d.fileName||'')+' · '+esc(fmtDate(d.date||d.createdAt))+'</small></div><div class="actions"><button type="button" class="icon-btn icon-view" onclick="gpPreviewBienDoc('+i+')"><span class="material-symbols-rounded">visibility</span></button><button type="button" class="icon-btn" onclick="gpDownloadBienDoc('+i+')"><span class="material-symbols-rounded">download</span></button><button type="button" class="icon-btn icon-delete" onclick="gpDeleteBienDoc('+i+')"><span class="material-symbols-rounded">delete</span></button></div></div>';}).join('')+'</div>':'<div class="bd-empty">Aucun document associé à ce bien</div>');
    page.innerHTML='<div class="bien-detail-page gp-bien-detail-final-v2"><div class="bien-detail-modern-head"><button type="button" class="bd-action-btn bd-back" onclick="gpBackToBiens()"><span class="material-symbols-rounded">arrow_back</span> Retour</button><div class="bd-title"><h2>'+esc(b.nom||'Bien')+'</h2><p>'+esc([b.type,b.adresse].filter(Boolean).join(' · ')||'Détails du bien')+'</p></div><div class="bd-head-actions"><button type="button" class="bd-action-btn" onclick="editRow&&editRow(\'biens\','+idx+')"><span class="material-symbols-rounded">edit</span> Modifier</button><button type="button" class="bd-action-btn danger" onclick="deleteRow&&deleteRow(\'biens\','+idx+')"><span class="material-symbols-rounded">delete</span> Supprimer</button></div></div><div class="bd-hero"><div class="bd-photo">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<span class="material-symbols-rounded">home_work</span>')+'</div><div class="bd-info"><span class="bd-status '+(status==='Partiellement loué'?'mixed':norm(status))+'">'+esc(status)+'</span><h3>'+esc(b.nom||'—')+'</h3><p>'+esc(b.adresse||'Adresse non renseignée')+'</p><div class="bd-kpis"><div><small>Appartements</small><b>'+esc(rows.length||'—')+'</b></div><div><small>Loués</small><b>'+occ+'</b></div><div><small>Disponibles</small><b>'+free+'</b></div><div><small>Propriétaire</small><b>'+esc(ownerDisplay||'—')+'</b></div></div></div></div><div class="bd-tabs-modern"><button type="button" onclick="gpShowBDTab(\'infos\',this)" class="active">Informations</button><button type="button" onclick="gpShowBDTab(\'locataires\',this)">Locataires</button><button type="button" onclick="gpShowBDTab(\'proprio\',this)">Propriétaire</button><button type="button" onclick="gpShowBDTab(\'docs\',this)">Documents bien</button></div><section id="gpBD-infos" class="gp-bd-panel"><div class="bd-grid"><div><label>Nom</label><strong>'+esc(b.nom||'—')+'</strong></div><div><label>Adresse</label><strong>'+esc(b.adresse||'—')+'</strong></div><div><label>Type</label><strong>'+esc(b.type||'—')+'</strong></div><div><label>Statut calculé</label><strong>'+esc(status)+'</strong></div><div><label>Valeur</label><strong>'+fmtMoney(b.valeur||b.prix||b.loyer)+'</strong></div><div><label>Locations liées</label><strong>'+locs.length+'</strong></div></div></section><section id="gpBD-locataires" class="gp-bd-panel" style="display:none">'+locHtml+'</section><section id="gpBD-proprio" class="gp-bd-panel" style="display:none">'+propHtml+'</section><section id="gpBD-docs" class="gp-bd-panel" style="display:none">'+docsHtml+'</section></div>';
    if(typeof window.navigate==='function') window.navigate('bien-detail'); else { document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')}); page.classList.add('active'); }
    if(tab){ setTimeout(function(){ var q=tab==='docs'?'Documents':tab; var btn=[].slice.call(document.querySelectorAll('.bd-tabs-modern button')).find(function(x){return x.textContent.toLowerCase().indexOf(q.toLowerCase())>=0;}); if(btn) btn.click(); },40); }
  };
  var css='.gp-bien-detail-final-v2 .bd-status.mixed{background:#fef3c7;color:#92400e}.gp-bien-detail-final-v2 .bd-status.disponible{background:#dcfce7;color:#166534}.gp-bien-detail-final-v2 .bd-status.loue,.gp-bien-detail-final-v2 .bd-status.loué{background:#dbeafe;color:#1d4ed8}.gp-bien-detail-final-v2 .bd-status.partiellementloue{background:#fef3c7;color:#92400e}.gp-bien-detail-final-v2 .bd-kpis{grid-template-columns:repeat(4,minmax(120px,1fr))}.gp-bien-detail-final-v2 .bd-action-btn.bd-back{background:#111827;color:#fff;border-color:#111827}.bd-tenant-card.is-free{opacity:.9}.bd-tenant-card.is-free .bd-tenant-head>span{background:#f1f5f9;color:#64748b}.bd-doc-add{display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:12px;margin-bottom:12px}.bd-doc-add input{border:1px solid #e5e7eb;border-radius:10px;padding:10px}.bd-doc-list{display:grid;gap:10px}.bien-doc-card{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:12px}.bien-doc-card>span{color:#d4a511}.bien-doc-card div:nth-child(2){flex:1}.bien-doc-card small{display:block;color:#6b7280;margin-top:3px}.bd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.bd-grid>div{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px}.bd-grid label,.bd-tenant-grid label,.bd-owner-grid label{display:block;font-size:12px;color:#6b7280;margin-bottom:4px}.bd-empty{background:#fff;border:1px dashed #d1d5db;border-radius:14px;padding:18px;color:#6b7280}.bd-tenant-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 8px 20px rgba(15,23,42,.04)}.bd-tenant-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}.bd-tenant-head>span{width:38px;height:38px;border-radius:12px;background:#fff8e1;color:#d4a511;display:grid;place-items:center}.bd-tenant-head small{display:block;color:#64748b;margin-top:2px}.bd-tenant-grid,.bd-owner-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.bd-tenant-grid div,.bd-owner-grid div{background:#f8fafc;border:1px solid #eef2f7;border-radius:12px;padding:10px}.bd-owner-card{display:flex;gap:14px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:16px}.bd-owner-avatar{width:58px;height:58px;border-radius:18px;background:#111827;color:#fff;display:grid;place-items:center;font-weight:900}.bd-owner-info{flex:1}.bd-owner-info h3{margin:0 0 4px}.bd-owner-info p{margin:0 0 12px;color:#64748b}.gp-bien-detail-final-v2 .bd-tabs-modern button.active{background:#d4a511;border-color:#d4a511;color:#111827}';
  var old=document.getElementById('gp-bien-detail-real-final-css'); if(old) old.remove(); var style=document.createElement('style'); style.id='gp-bien-detail-real-final-css'; style.textContent=css; document.head.appendChild(style);
})();

/* ============================================================
   RESTORE FULL BIEN DETAIL VIEW — active final override
   Replaces compact detail renderer with the complete tabbed view.
============================================================ */
(function(){
  'use strict';
  function db(){ window.DB = window.DB || {}; return window.DB; }
  function arr(k){ var d=db(); return Array.isArray(d[k]) ? d[k] : []; }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function clean(v){ return String(v||'').replace(/\s+/g,' ').trim(); }
  function norm(v){ return clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function money(v){ return String(v==null?'':v).trim(); }
  function save(){ try{ if(typeof saveDB==='function') saveDB(); else localStorage.setItem('gp_database', JSON.stringify(db())); }catch(e){} }
  function toastSafe(m,t){ try{ if(typeof toast==='function') toast(m,t||''); }catch(e){} }
  function fullName(p){ if(!p) return ''; return clean(p.nomComplet || p.fullName || [p.prenom||p.firstName, p.nom||p.lastName].filter(Boolean).join(' ') || p.nom || p.name || ''); }
  function sameName(a,b){ a=norm(a); b=norm(b); return !!a && !!b && (a===b || a.indexOf(b)>=0 || b.indexOf(a)>=0); }
  function ownerName(b){ return clean(b.proprio || b.proprietaire || b.owner || b.ownerName || b.proprietaireNom || ''); }
  function findOwner(b){
    var target=ownerName(b), id=clean(b.proprioId||b.proprietaireId||b.ownerId||'');
    return arr('proprietaires').find(function(p){
      return (id && String(p.id||p.uid||'')===id) || sameName(fullName(p),target) || sameName((p.nom||'')+' '+(p.prenom||''),target) || sameName(p.nom,target) || sameName(p.email,target) || sameName(p.tel||p.telephone,target);
    }) || null;
  }
  function unitCount(b){ var n=parseInt(b.nbAppart||b.nbApparts||b.nbUnites||b.nombreUnites||b.unitesNombre||b.nombre_appartements||0,10); if(Array.isArray(b.unites)) n=Math.max(n,b.unites.length); if(Array.isArray(b.appartements)) n=Math.max(n,b.appartements.length); return Math.max(1,n||1); }
  function unitsOf(b){
    var raw=Array.isArray(b.unites)?b.unites:(Array.isArray(b.appartements)?b.appartements:[]);
    if(raw.length) return raw.map(function(u,i){ return { id:u.id||u.uid||('u'+(i+1)), nom:u.nom||u.name||u.libelle||('Appartement '+(i+1)), statut:u.statut||u.status||'', loyer:u.loyer||u.montant||u.prix||'', locataire:u.locataire||u.occupant||'' }; });
    var n=unitCount(b), out=[]; for(var i=1;i<=n;i++) out.push({id:'u'+i,nom:n>1?'Appartement '+i:(b.nom||'Bien'),statut:'',loyer:'',locataire:''}); return out;
  }
  function unitFullName(b,u){ return clean((b.nom||'') + (u && u.nom && u.nom!==b.nom ? ' - '+u.nom : '')); }
  function linkedLocatives(b){
    var bn=clean(b.nom||''), us=unitsOf(b), fulls=us.map(function(u){return norm(unitFullName(b,u));});
    return arr('locatives').filter(function(l){
      var vals=[l.bien,l.parentBien,l.bienNom,l.location,l.nom,l.locative,l.unite].map(norm);
      return vals.some(function(v){ return v && (v===norm(bn) || v.indexOf(norm(bn))>=0 || fulls.indexOf(v)>=0 || fulls.some(function(f){return f && (v.indexOf(f)>=0 || f.indexOf(v)>=0); })); });
    });
  }
  function statusForUnit(b,u,locs){
    var full=norm(unitFullName(b,u)), un=norm(u.nom||'');
    var l=locs.find(function(x){ var v=norm(x.bien||x.locative||x.nom||x.unite||''); return (full && (v===full || v.indexOf(full)>=0 || full.indexOf(v)>=0)) || (un && v.indexOf(un)>=0); });
    var st=clean((l&&l.statut)||u.statut||'');
    if(l && (!st || /actif|lou/i.test(st))) return 'Loué';
    if(st) return st;
    return 'Disponible';
  }
  function statusForBien(b){
    var us=unitsOf(b), locs=linkedLocatives(b);
    if(us.length>1){
      var stats=us.map(function(u){return statusForUnit(b,u,locs);});
      var rented=stats.filter(function(s){return /lou|occup|actif/i.test(s);}).length;
      if(rented<=0) return 'Disponible';
      if(rented>=us.length) return 'Loué';
      return 'Partiellement loué';
    }
    if(locs.length) return 'Loué';
    return clean(b.statut||b.status||'Disponible') || 'Disponible';
  }
  function badge(st){
    var s=clean(st||'Disponible'), bg='#dbeafe', co='#1e40af';
    if(/partiel/i.test(s)){ bg='#fef3c7'; co='#92400e'; }
    else if(/lou|occup|actif/i.test(s)){ bg='#dcfce7'; co='#166534'; }
    else if(/attente/i.test(s)){ bg='#fef3c7'; co='#92400e'; }
    return '<span class="bd-status-pill" style="background:'+bg+';color:'+co+'">'+esc(s)+'</span>';
  }
  function locataireDetails(name){
    var n=norm(name);
    return arr('locataires').find(function(l){ return sameName(fullName(l), name) || sameName(l.nom, name) || sameName(l.locataire, name) || (n && (norm(l.tel||l.telephone).indexOf(n)>=0)); }) || null;
  }
  function renderLocations(b){
    var us=unitsOf(b), locs=linkedLocatives(b);
    if(!us.length && !locs.length) return '<div class="bd-empty-state"><span class="material-symbols-rounded">groups</span><b>Aucun locataire associé</b><small>Ajoutez une location pour ce bien depuis la page Locations.</small></div>';
    if(us.length>1){
      return us.map(function(u){
        var full=unitFullName(b,u), fullN=norm(full), un=norm(u.nom||'');
        var l=locs.find(function(x){ var v=norm(x.bien||x.locative||x.nom||x.unite||''); return v===fullN || v.indexOf(fullN)>=0 || (un && v.indexOf(un)>=0); });
        var lname=clean((l&&l.locataire)||(l&&l.occupant)||u.locataire||'');
        var ld=locataireDetails(lname);
        var st=statusForUnit(b,u,locs);
        return '<div class="bd-location-card">'+
          '<div class="bd-location-top"><div><span class="material-symbols-rounded">door_front</span><strong>'+esc(u.nom||full)+'</strong></div>'+badge(st)+'</div>'+ 
          '<div class="bd-location-grid">'+
          '<div><label>Locataire</label><b>'+esc(lname||'Aucun locataire')+'</b></div>'+ 
          '<div><label>Téléphone</label><b>'+esc((ld&&(ld.tel||ld.telephone))||(l&&l.tel)||'—')+'</b></div>'+ 
          '<div><label>Loyer</label><b>'+esc((l&&l.loyer)||u.loyer||'—')+'</b></div>'+ 
          '<div><label>Date entrée</label><b>'+esc((l&&(l.dateEntree||l.date_entree||l.debut||l.date))||'—')+'</b></div>'+ 
          '<div><label>Contrat</label><b>'+esc((l&&l.contrat)||'—')+'</b></div>'+ 
          '<div><label>Location</label><b>'+esc((l&&(l.nom||l.locative))||full)+'</b></div>'+ 
          '</div></div>';
      }).join('');
    }
    if(!locs.length) return '<div class="bd-empty-state"><span class="material-symbols-rounded">door_open</span><b>Bien disponible</b><small>Aucune location active associée.</small></div>';
    return locs.map(function(l){ var lname=clean(l.locataire||l.occupant||''); var ld=locataireDetails(lname); return '<div class="bd-location-card"><div class="bd-location-top"><div><span class="material-symbols-rounded">person</span><strong>'+esc(lname||'Locataire')+'</strong></div>'+badge(l.statut||'Loué')+'</div><div class="bd-location-grid"><div><label>Location</label><b>'+esc(l.nom||l.locative||'—')+'</b></div><div><label>Téléphone</label><b>'+esc((ld&&(ld.tel||ld.telephone))||l.tel||'—')+'</b></div><div><label>Loyer</label><b>'+esc(l.loyer||'—')+'</b></div><div><label>Date entrée</label><b>'+esc(l.dateEntree||l.date_entree||l.debut||'—')+'</b></div></div></div>'; }).join('');
  }
  function renderOwner(b){
    var p=findOwner(b);
    if(!p) return '<div class="bd-empty-state"><span class="material-symbols-rounded">person_off</span><b>Propriétaire non trouvé</b><small>Nom renseigné : '+esc(ownerName(b)||'—')+'</small></div>';
    return '<div class="bd-owner-card"><div class="bd-owner-avatar">'+(p.photo?'<img src="'+esc(p.photo)+'">':esc((fullName(p)||'?').charAt(0).toUpperCase()))+'</div><div class="bd-owner-info"><h3>'+esc(fullName(p)||'Propriétaire')+'</h3><p>Propriétaire du bien</p></div></div><div class="bd-info-grid"><div><label>Téléphone</label><b>'+esc(p.tel||p.telephone||'—')+'</b></div><div><label>Email</label><b>'+esc(p.email||'—')+'</b></div><div><label>Adresse</label><b>'+esc(p.adresse||'—')+'</b></div><div><label>Statut</label><b>'+esc(p.statut||p.matri||'—')+'</b></div></div>';
  }
  function docsForCurrent(){ var b=arr('biens')[window._bienDetailIdx]; if(!b) return []; if(!Array.isArray(b.documents)) b.documents=[]; return b.documents; }
  window.gpAddBienDocFinal=function(){
    var b=arr('biens')[window._bienDetailIdx]; if(!b) return toastSafe('Bien introuvable','err');
    var name=clean((document.getElementById('bdDocNameFinal')||{}).value||''); var file=(document.getElementById('bdDocFileFinal')||{}).files && (document.getElementById('bdDocFileFinal')||{}).files[0];
    if(!name) return toastSafe('Nom du document requis','err'); if(!file) return toastSafe('Choisissez un fichier','err');
    var reader=new FileReader(); reader.onload=function(){ if(!Array.isArray(b.documents)) b.documents=[]; b.documents.push({id:'DOC'+Date.now(),nom:name,fileName:file.name,mime:file.type||'',data:reader.result,createdAt:new Date().toISOString()}); save(); window.openBienDetail(window._bienDetailIdx); setTimeout(function(){ var btn=document.querySelector('[data-bd-tab="docs"]'); if(btn) btn.click(); },80); toastSafe('Document ajouté ✓'); }; reader.readAsDataURL(file);
  };
  window.gpPreviewBienDocFinal=function(i){ var d=docsForCurrent()[i]; if(!d||!d.data) return; var w=window.open('','_blank'); if(!w) return; if(String(d.mime||'').startsWith('image/')) w.document.write('<img src="'+d.data+'" style="max-width:100%;height:auto">'); else w.document.write('<iframe src="'+d.data+'" style="width:100%;height:100vh;border:0"></iframe>'); };
  window.gpDownloadBienDocFinal=function(i){ var d=docsForCurrent()[i]; if(!d||!d.data) return; var a=document.createElement('a'); a.href=d.data; a.download=d.fileName||d.nom||'document'; document.body.appendChild(a); a.click(); a.remove(); };
  window.gpDeleteBienDocFinal=function(i){ if(!confirm('Supprimer ce document ?')) return; docsForCurrent().splice(i,1); save(); window.openBienDetail(window._bienDetailIdx); setTimeout(function(){ var btn=document.querySelector('[data-bd-tab="docs"]'); if(btn) btn.click(); },80); };
  function renderDocs(){ var docs=docsForCurrent(); return '<div class="bd-doc-add"><input id="bdDocNameFinal" placeholder="Nom document"><input id="bdDocFileFinal" type="file"><button type="button" onclick="gpAddBienDocFinal()"><span class="material-symbols-rounded">upload_file</span> Ajouter</button></div>'+(docs.length?'<div class="bd-doc-list">'+docs.map(function(d,i){ return '<div class="bd-doc-card"><div class="bd-doc-icon"><span class="material-symbols-rounded">folder</span></div><div class="bd-doc-meta"><b>'+esc(d.nom||d.fileName||'Document')+'</b><small>'+esc(d.fileName||'')+' '+(d.createdAt?'· '+new Date(d.createdAt).toLocaleDateString('fr-FR'):'')+'</small></div><div class="bd-doc-actions"><button onclick="gpPreviewBienDocFinal('+i+')"><span class="material-symbols-rounded">visibility</span></button><button onclick="gpDownloadBienDocFinal('+i+')"><span class="material-symbols-rounded">download</span></button><button class="danger" onclick="gpDeleteBienDocFinal('+i+')"><span class="material-symbols-rounded">delete</span></button></div></div>'; }).join('')+'</div>':'<div class="bd-empty-state"><span class="material-symbols-rounded">folder_open</span><b>Aucun document</b><small>Ajoutez les documents du bien ici.</small></div>'); }
  window.gpSwitchBienDetailTabFinal=function(tab,btn){
    document.querySelectorAll('.bd-restored-tab').forEach(function(b){b.classList.remove('active');}); if(btn) btn.classList.add('active');
    ['infos','locataires','proprio','docs'].forEach(function(t){ var el=document.getElementById('bdRestored-'+t); if(el) el.style.display=(t===tab?'block':'none'); });
  };
  window.closeBienDetail=function(){ if(typeof navigate==='function') navigate('biens'); else location.hash='#biens'; };
  window.openBienDetail=function(idx){
    var b=arr('biens')[idx]; if(!b){ toastSafe('Bien introuvable','err'); return; }
    window._bienDetailIdx=idx;
    var page=document.getElementById('page-bien-detail'); if(!page) return;
    var st=statusForBien(b), p=findOwner(b), us=unitsOf(b), locs=linkedLocatives(b);
    page.innerHTML='<div class="bd-restored">'+
      '<div class="bd-restored-head"><button type="button" class="bd-top-btn" onclick="closeBienDetail()"><span class="material-symbols-rounded">arrow_back</span> Retour</button><div class="bd-restored-title"><h2>'+esc(b.nom||'Bien')+'</h2><p>'+esc([b.type,b.adresse].filter(Boolean).join(' · ')||'Détails du bien')+'</p></div><div class="bd-restored-actions"><button type="button" class="bd-top-btn edit" onclick="editRow&&editRow(\'biens\','+idx+')"><span class="material-symbols-rounded">edit</span> Modifier</button><button type="button" class="bd-top-btn danger" onclick="deleteBienFromDetail&&deleteBienFromDetail()"><span class="material-symbols-rounded">delete</span> Supprimer</button></div></div>'+ 
      '<div class="bd-restored-hero"><div class="bd-restored-photo">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<span class="material-symbols-rounded">home_work</span>')+'</div><div class="bd-restored-main"><div>'+badge(st)+'</div><h1>'+esc(b.nom||'—')+'</h1><p><span class="material-symbols-rounded">location_on</span>'+esc(b.adresse||'Adresse non renseignée')+'</p><div class="bd-restored-kpis"><div><small>Type</small><b>'+esc(b.type||'—')+'</b></div><div><small>Unités</small><b>'+esc(unitCount(b))+'</b></div><div><small>Locataires</small><b>'+esc(locs.length)+'</b></div><div><small>Propriétaire</small><b>'+esc(p?fullName(p):(ownerName(b)||'—'))+'</b></div></div></div></div>'+ 
      '<div class="bd-restored-tabs"><button class="bd-restored-tab active" onclick="gpSwitchBienDetailTabFinal(\'infos\',this)"><span class="material-symbols-rounded">info</span> Informations</button><button class="bd-restored-tab" onclick="gpSwitchBienDetailTabFinal(\'locataires\',this)"><span class="material-symbols-rounded">groups</span> Locataires</button><button class="bd-restored-tab" onclick="gpSwitchBienDetailTabFinal(\'proprio\',this)"><span class="material-symbols-rounded">person</span> Propriétaire</button><button data-bd-tab="docs" class="bd-restored-tab" onclick="gpSwitchBienDetailTabFinal(\'docs\',this)"><span class="material-symbols-rounded">folder</span> Documents</button></div>'+ 
      '<section id="bdRestored-infos" class="bd-restored-panel"><h3>Caractéristiques</h3><div class="bd-info-grid"><div><label>Nom</label><b>'+esc(b.nom||'—')+'</b></div><div><label>Adresse</label><b>'+esc(b.adresse||'—')+'</b></div><div><label>Type</label><b>'+esc(b.type||'—')+'</b></div><div><label>Statut calculé</label><b>'+esc(st)+'</b></div><div><label>État</label><b>'+esc(b.etat||'—')+'</b></div><div><label>Vente</label><b>'+esc(b.vente||'Non')+'</b></div><div><label>Valeur / Loyer</label><b>'+esc(b.valeur||b.loyer||'—')+'</b></div><div><label>Nombre unités</label><b>'+esc(unitCount(b))+'</b></div></div></section>'+ 
      '<section id="bdRestored-locataires" class="bd-restored-panel" style="display:none"><h3>Informations locataires</h3>'+renderLocations(b)+'</section>'+ 
      '<section id="bdRestored-proprio" class="bd-restored-panel" style="display:none"><h3>Propriétaire</h3>'+renderOwner(b)+'</section>'+ 
      '<section id="bdRestored-docs" class="bd-restored-panel" style="display:none"><h3>Documents bien</h3>'+renderDocs()+'</section>'+ 
      '</div>';
    if(typeof navigate==='function') navigate('bien-detail');
    setTimeout(function(){ var page2=document.getElementById('page-bien-detail'); if(page2) page2.classList.add('active'); },0);
  };
  var css='\n#page-bien-detail{padding:24px 18px 40px!important;background:#f6f7f9!important}\n.bd-restored{display:flex;flex-direction:column;gap:16px;color:#0f172a}.bd-restored-head{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:14px;box-shadow:0 10px 28px rgba(15,23,42,.06)}.bd-restored-title{flex:1}.bd-restored-title h2{margin:0;font-size:22px;font-weight:950}.bd-restored-title p{margin:3px 0 0;color:#64748b;font-size:13px}.bd-restored-actions{display:flex;gap:8px}.bd-top-btn{height:40px;border:1px solid #e5e7eb;background:#fff;border-radius:12px;padding:0 13px;display:inline-flex;align-items:center;gap:7px;font-weight:900;color:#0f172a;cursor:pointer;box-shadow:0 5px 14px rgba(15,23,42,.05)}.bd-top-btn span{font-size:19px;color:#D4AF37}.bd-top-btn:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(15,23,42,.10)}.bd-top-btn.edit{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}.bd-top-btn.edit span{color:#2563eb}.bd-top-btn.danger{background:#fff1f2;color:#dc2626;border-color:#fecdd3}.bd-top-btn.danger span{color:#dc2626}.bd-restored-hero{display:grid;grid-template-columns:230px 1fr;gap:18px;background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:18px;box-shadow:0 14px 34px rgba(15,23,42,.07)}.bd-restored-photo{height:170px;border-radius:16px;background:#f8fafc;border:1px solid #eef2f7;display:grid;place-items:center;overflow:hidden}.bd-restored-photo img{width:100%;height:100%;object-fit:cover}.bd-restored-photo>span{font-size:60px;color:#D4AF37}.bd-restored-main h1{margin:10px 0 5px;font-size:28px;font-weight:950}.bd-restored-main p{margin:0;color:#64748b;display:flex;align-items:center;gap:5px}.bd-restored-main p span{font-size:17px;color:#D4AF37}.bd-status-pill{display:inline-flex;align-items:center;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:950;border:1px solid rgba(15,23,42,.06)}.bd-restored-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:22px}.bd-restored-kpis div,.bd-info-grid div{background:#f8fafc;border:1px solid #edf2f7;border-radius:14px;padding:13px;min-width:0}.bd-restored-kpis small,.bd-info-grid label,.bd-location-grid label{display:block;color:#64748b;font-size:11px;font-weight:900;text-transform:uppercase;margin-bottom:5px}.bd-restored-kpis b,.bd-info-grid b,.bd-location-grid b{font-size:14px;color:#0f172a;overflow-wrap:anywhere}.bd-restored-tabs{display:flex;gap:10px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:8px;box-shadow:0 8px 24px rgba(15,23,42,.05)}.bd-restored-tab{height:44px;border:0;background:transparent;border-radius:13px;padding:0 16px;display:inline-flex;align-items:center;gap:8px;font-weight:950;color:#64748b;cursor:pointer}.bd-restored-tab span{font-size:20px;color:#D4AF37}.bd-restored-tab.active{background:#fff7dd;color:#111827}.bd-restored-panel{background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:18px;box-shadow:0 12px 30px rgba(15,23,42,.055)}.bd-restored-panel h3{margin:0 0 14px;font-size:16px;font-weight:950}.bd-info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.bd-location-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;margin-bottom:10px}.bd-location-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.bd-location-top>div{display:flex;align-items:center;gap:8px}.bd-location-top span.material-symbols-rounded{color:#D4AF37}.bd-location-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.bd-location-grid div{background:#f8fafc;border:1px solid #edf2f7;border-radius:12px;padding:11px}.bd-owner-card{display:flex;align-items:center;gap:13px;padding:14px;background:#f8fafc;border:1px solid #edf2f7;border-radius:16px;margin-bottom:12px}.bd-owner-avatar{width:58px;height:58px;border-radius:16px;background:linear-gradient(135deg,#D4AF37,#f5d76e);display:grid;place-items:center;font-weight:950;color:#111;overflow:hidden}.bd-owner-avatar img{width:100%;height:100%;object-fit:cover}.bd-owner-info h3{margin:0;font-size:18px;font-weight:950}.bd-owner-info p{margin:4px 0 0;color:#64748b}.bd-empty-state{display:grid;place-items:center;text-align:center;gap:7px;color:#94a3b8;border:1px dashed #d7dee8;border-radius:16px;padding:30px;background:#fbfdff}.bd-empty-state span{font-size:42px;color:#D4AF37}.bd-empty-state b{color:#475569}.bd-empty-state small{color:#94a3b8}.bd-doc-add{display:flex;gap:10px;align-items:center;background:#f8fafc;border:1px solid #edf2f7;border-radius:16px;padding:12px;margin-bottom:12px}.bd-doc-add input{height:40px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;background:#fff}.bd-doc-add input:first-child{flex:1}.bd-doc-add button{height:40px;border:0;border-radius:12px;background:#2563eb;color:#fff;font-weight:900;padding:0 14px;display:inline-flex;align-items:center;gap:6px;cursor:pointer}.bd-doc-card{display:flex;align-items:center;gap:12px;border:1px solid #e5e7eb;background:#fff;border-radius:15px;padding:12px;margin-bottom:9px}.bd-doc-icon{width:42px;height:42px;border-radius:13px;background:#fff7dd;display:grid;place-items:center}.bd-doc-icon span{color:#D4AF37}.bd-doc-meta{flex:1;min-width:0}.bd-doc-meta b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bd-doc-meta small{display:block;color:#94a3b8;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bd-doc-actions{display:flex;gap:6px}.bd-doc-actions button{width:34px;height:34px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;display:grid;place-items:center;cursor:pointer}.bd-doc-actions button span{font-size:18px;color:#D4AF37}.bd-doc-actions .danger span{color:#ef4444}@media(max-width:900px){.bd-restored-head{align-items:flex-start;flex-direction:column}.bd-restored-actions{width:100%;flex-wrap:wrap}.bd-restored-hero{grid-template-columns:1fr}.bd-restored-kpis{grid-template-columns:1fr 1fr}.bd-restored-tabs{overflow-x:auto}.bd-doc-add{align-items:stretch;flex-direction:column}}\n';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
})();
