/* Genius Property — Finance forms V16
 * Single drawer for Encaissements + Dépenses.
 * Create and edit use the same form. Legacy finance modals are no longer used.
 */
(function(){
  'use strict';
  const state = { kind:null, index:-1, expenseView:'detail', expenseBienFocus:null };
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const db = () => (window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {}));
  const num = v => {
    if (window.GP && typeof window.GP.num === 'function') return window.GP.num(v);
    if (typeof window.num === 'function') return window.num(v);
    const n = Number(String(v ?? '').replace(/[^0-9,.-]/g,'').replace(',','.'));
    return Number.isFinite(n) ? n : 0;
  };
  const today = () => new Date().toISOString().slice(0,10);
  const saveDb = async d => {
    if (window.GPDB && window.GPDB.save) return window.GPDB.save(d);
    window.DB = d;
    if (typeof window.saveDB === 'function') return window.saveDB();
  };
  const notify = (m,t) => typeof window.toast === 'function' ? window.toast(m,t) : (t==='err' ? alert(m) : console.log(m));
  const set = (id,v) => { const e=$(id); if(e) e.value = v ?? ''; };
  const get = id => { const e=$(id); return e ? String(e.value||'').trim() : ''; };
  const escAttr = esc;

  function locations(){ return Array.isArray(db().locatives) ? db().locatives : []; }
  function biens(){ return Array.isArray(db().biens) ? db().biens : []; }
  function locLabel(l,i){ return l.nom || l.libelle || l.name || l.bien || ('Location '+(i+1)); }
  function bienLabel(b){ return b.nom || b.adresse || b.libelle || ''; }
  function locataireLabel(l){ return l.locataire || l.occupant || ''; }
  function locationForValue(value){
    const list=locations();
    return list.find((l,i)=>String(locLabel(l,i))===String(value)) || list.find(l=>String(l.id||'')===String(value)) || null;
  }
  function locationOptions(selected){
    return '<option value="">Sélectionner une location</option>' + locations().map((l,i)=>{
      const value=locLabel(l,i), tenant=locataireLabel(l), bien=l.bien||l.bienNom||'';
      return '<option value="'+escAttr(value)+'" '+(String(value)===String(selected||'')?'selected':'')+'>'+esc(value+(tenant?' — '+tenant:'')+(bien?' — '+bien:''))+'</option>';
    }).join('');
  }
  function bienOptions(selected){
    return '<option value="">Aucun bien / agence</option>'+biens().map(b=>{
      const value=bienLabel(b); return '<option value="'+escAttr(value)+'" '+(String(value)===String(selected||'')?'selected':'')+'>'+esc(value)+'</option>';
    }).join('');
  }

  function injectStyle(){
    if($('gp-finance-v16-style')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="gp-finance-v16-style">
      #gpFinanceOverlayV16{position:fixed;inset:0;background:rgba(15,23,42,.42);z-index:9998;opacity:0;transition:opacity .18s ease}
      #gpFinanceDrawerV16{position:fixed;top:0;right:0;bottom:0;width:min(560px,94vw);background:#fff;z-index:9999;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .22s ease;box-shadow:-20px 0 45px rgba(15,23,42,.22);border-left:1px solid #e5e7eb}
      #gpFinanceDrawerV16 .gpf-head{display:flex;justify-content:space-between;align-items:flex-start;padding:16px 20px 12px;border-bottom:1px solid #eef2f7;flex-shrink:0}
      #gpFinanceDrawerV16 .gpf-title{font-size:18px;font-weight:900;color:#111827;line-height:1.1}
      #gpFinanceDrawerV16 .gpf-sub{font-size:12px;color:#6b7280;margin-top:5px}
      #gpFinanceDrawerV16 .gpf-close{width:34px;height:34px;border:1px solid #fecaca;background:#fff7f7;color:#dc2626;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer}
      #gpFinanceDrawerV16 .gpf-body{flex:1;overflow:auto;padding:0 20px 18px}
      #gpFinanceDrawerV16 .gpf-section{padding-top:15px}
      #gpFinanceDrawerV16 .gpf-section h3{font-size:12px;margin:0 0 10px;padding-bottom:7px;border-bottom:1px solid #eef2f7;color:#111827;font-weight:900}
      #gpFinanceDrawerV16 .gpf-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      #gpFinanceDrawerV16 .gpf-grid.one{grid-template-columns:1fr}
      #gpFinanceDrawerV16 .gpf-field{min-width:0}
      #gpFinanceDrawerV16 .gpf-field label{display:block;font-size:11px;font-weight:800;color:#374151;margin-bottom:5px}
      #gpFinanceDrawerV16 .gpf-field label b{color:#dc2626}
      #gpFinanceDrawerV16 input,#gpFinanceDrawerV16 select,#gpFinanceDrawerV16 textarea{width:100%;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:9px;background:#fff;color:#111827;font-size:12px;padding:9px 10px;outline:none}
      #gpFinanceDrawerV16 input,#gpFinanceDrawerV16 select{height:38px}
      #gpFinanceDrawerV16 textarea{min-height:78px;resize:vertical}
      #gpFinanceDrawerV16 input:focus,#gpFinanceDrawerV16 select:focus,#gpFinanceDrawerV16 textarea:focus{border-color:#c9b04f;box-shadow:0 0 0 3px rgba(212,175,55,.12)}
      #gpFinanceDrawerV16 .gpf-readonly{background:#f8fafc;color:#64748b}
      #gpFinanceDrawerV16 .gpf-info{font-size:11px;color:#6b7280;background:#f8fafc;border:1px solid #eef2f7;border-radius:9px;padding:8px 10px;margin-top:8px}
      #gpFinanceDrawerV16 .gpf-foot{display:flex;justify-content:space-between;gap:10px;padding:12px 20px 15px;border-top:1px solid #eef2f7;background:#fff;flex-shrink:0}
      #gpFinanceDrawerV16 .gpf-btn{height:38px;border-radius:9px;padding:0 16px;font-size:12px;font-weight:900;cursor:pointer}
      #gpFinanceDrawerV16 .gpf-cancel{background:#fff;border:1px solid #e5e7eb;color:#374151}
      #gpFinanceDrawerV16 .gpf-save{background:#d4af37;border:1px solid #d4af37;color:#111}
      #gpFinanceDrawerV16 .gpf-danger{color:#dc2626}
      @media(max-width:700px){#gpFinanceDrawerV16{width:96vw}#gpFinanceDrawerV16 .gpf-grid{grid-template-columns:1fr}}
    
      /* Dépenses — synthèse compacte et filtres lisibles */
      .gpf-expense-summary-row{display:flex;align-items:stretch;gap:9px;width:100%;margin-bottom:12px}
      .gpf-expense-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;flex:1;min-width:0;margin:0}
      .gpf-expense-cards .gpf-card{min-height:58px;padding:9px 11px;border-radius:10px;display:flex;flex-direction:column;justify-content:center}
      .gpf-expense-cards .gpf-card small{font-size:9px;font-weight:800;letter-spacing:.01em}
      .gpf-expense-cards .gpf-card strong{font-size:15px;line-height:1.15;margin-top:2px;white-space:nowrap}
      .gpf-card-total small,.gpf-card-total strong{color:#7c3aed}
      .gpf-card-biens small,.gpf-card-biens strong{color:#2563eb}
      .gpf-card-agence small,.gpf-card-agence strong{color:#6d28d9}
      .gpf-card-travaux small,.gpf-card-travaux strong{color:#b45309}
      .gpf-expense-add{flex:0 0 142px;height:58px;padding:0 10px;border-radius:10px;font-size:12px;display:inline-flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap}
      .gpf-expense-toolbar{gap:7px;flex-wrap:nowrap}
      .gpf-expense-toolbar #gpf-page-dep-search{flex:1 1 200px;min-width:180px;max-width:230px}
      .gpf-expense-toolbar .gpf-month-filter{flex:0 0 132px;min-width:132px}
      .gpf-expense-toolbar .gpf-select-wrap{position:relative;display:block;flex:0 1 136px;min-width:120px}
      .gpf-expense-toolbar .gpf-select-wrap::after{content:'⌄';position:absolute;right:10px;top:50%;transform:translateY(-55%);font-size:13px;line-height:1;color:#8a6b0a;pointer-events:none;font-weight:900}
      .gpf-expense-toolbar .gpf-select-wrap select{width:100%;min-width:0;flex:1 1 auto;appearance:none;-webkit-appearance:none;padding-right:28px;cursor:pointer}
      .gpf-expense-toolbar .gpf-select-wrap select:focus{outline:none;border-color:#d4af37;box-shadow:0 0 0 2px rgba(212,175,55,.12)}
      .gpf-expense-toolbar .gpf-month-filter{cursor:pointer}
      .gpf-expense-toolbar .gpf-month-filter:disabled{cursor:not-allowed}
      @media(max-width:1100px){.gpf-expense-summary-row{flex-wrap:wrap}.gpf-expense-cards{flex:1 1 100%}.gpf-expense-add{margin-left:auto}.gpf-expense-toolbar{flex-wrap:wrap}.gpf-expense-toolbar #gpf-page-dep-search{flex:1 1 210px;max-width:none}.gpf-expense-toolbar .gpf-select-wrap{flex:1 1 150px}.gpf-expense-toolbar .gpf-month-filter{flex:1 1 140px}}
      @media(max-width:700px){.gpf-expense-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.gpf-expense-add{flex:1 1 100%;height:42px}.gpf-expense-toolbar #gpf-page-dep-search,.gpf-expense-toolbar .gpf-month-filter,.gpf-expense-toolbar .gpf-select-wrap{flex:1 1 100%;max-width:none}}
      /* Dépenses — alignement desktop : cartes + action sur une seule ligne */
      .gpf-expense-summary-row{display:grid;grid-template-columns:minmax(0,1fr) 128px;align-items:stretch;gap:9px;width:100%;margin-bottom:12px}
      .gpf-expense-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;min-width:0;width:100%}
      .gpf-expense-cards .gpf-card{min-width:0;min-height:56px;padding:8px 10px}
      .gpf-expense-cards .gpf-card small{font-size:9px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .gpf-expense-cards .gpf-card strong{font-size:14px;line-height:1.1;white-space:nowrap}
      .gpf-expense-add{width:128px;min-width:128px;height:56px;padding:0 8px;font-size:11px;border-radius:9px}
      /* Barre de filtres : toutes les commandes tiennent sans chevauchement */
      .gpf-expense-toolbar{display:grid !important;grid-template-columns:minmax(175px,1.5fr) 118px 138px 126px 116px 132px auto;gap:6px;align-items:center;width:100%;flex-wrap:nowrap}
      .gpf-expense-toolbar #gpf-page-dep-search{width:100%;min-width:0;max-width:none;box-sizing:border-box}
      .gpf-expense-toolbar .gpf-month-filter{width:100%;min-width:0;box-sizing:border-box}
      .gpf-expense-toolbar .gpf-select-wrap{width:100%;min-width:0;max-width:none;flex:none}
      .gpf-expense-toolbar .gpf-select-wrap select{width:100%;min-width:0;box-sizing:border-box}
      .gpf-expense-toolbar .gpf-toolbar-actions{margin-left:0;display:flex;gap:5px;justify-content:flex-end;min-width:max-content}
      .gpf-expense-toolbar .gpf-import-export{height:34px;padding:0 8px;font-size:10px;white-space:nowrap}
      @media(max-width:1120px){.gpf-expense-summary-row{grid-template-columns:1fr 120px}.gpf-expense-add{width:120px;min-width:120px}.gpf-expense-toolbar{grid-template-columns:minmax(160px,1.4fr) 110px 128px 116px 108px 120px auto}}
      @media(max-width:980px){.gpf-expense-summary-row{grid-template-columns:1fr}.gpf-expense-add{width:150px;min-width:150px;justify-self:end}.gpf-expense-toolbar{grid-template-columns:repeat(3,minmax(0,1fr))}.gpf-expense-toolbar #gpf-page-dep-search{grid-column:span 2}.gpf-expense-toolbar .gpf-toolbar-actions{grid-column:span 1;justify-content:flex-end}}
      @media(max-width:700px){.gpf-expense-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.gpf-expense-add{width:100%;min-width:0;justify-self:stretch}.gpf-expense-toolbar{grid-template-columns:1fr}.gpf-expense-toolbar #gpf-page-dep-search{grid-column:auto}.gpf-expense-toolbar .gpf-toolbar-actions{grid-column:auto;justify-content:flex-start}}
</style>`);
  }

  function paymentForm(row){
    const editing=!!row;
    const selectedLoc = row ? (row.locative || row.location || '') : '';
    const loc = locationForValue(selectedLoc);
    const tenant = row?.locataire || locataireLabel(loc||{});
    const bien = row?.bien || loc?.bien || loc?.bienNom || '';
    const due = row?.montant ?? loc?.loyer ?? '';
    const paid = row?.paye ?? row?.montantPaye ?? (editing ? '' : due);
    return `<div class="gpf-section"><h3>1. Location</h3>
      <div class="gpf-grid one"><div class="gpf-field"><label>Location <b>*</b></label><select id="gpf-p-location" onchange="gpFinanceV16SyncLocation()">${locationOptions(selectedLoc)}</select></div></div>
      <div class="gpf-info" id="gpf-p-derived">Locataire : <b>${esc(tenant||'—')}</b> &nbsp;•&nbsp; Bien : <b>${esc(bien||'—')}</b></div>
    </div>
    <div class="gpf-section"><h3>2. Encaissement</h3>
      <div class="gpf-grid"><div class="gpf-field"><label>Montant dû (FCFA) <b>*</b></label><input id="gpf-p-montant" type="number" value="${escAttr(due)}" oninput="gpFinanceV16UpdateReste()"></div>
      <div class="gpf-field"><label>Montant encaissé (FCFA) <b>*</b></label><input id="gpf-p-paye" type="number" value="${escAttr(paid)}" oninput="gpFinanceV16UpdateReste()"></div>
      <div class="gpf-field"><label>Reste</label><input id="gpf-p-reste" class="gpf-readonly" readonly value="${Math.max(0,num(due)-num(paid))}"></div>
      <div class="gpf-field"><label>Mode de paiement</label><select id="gpf-p-mode">${['Espèces','Virement','Chèque','Mobile Money','Wave','Orange Money'].map(x=>'<option '+(x===(row?.mode||'Espèces')?'selected':'')+'>'+x+'</option>').join('')}</select></div>
      <div class="gpf-field"><label>Date de paiement <b>*</b></label><input id="gpf-p-date" type="date" value="${escAttr(row?.date||today())}"></div></div>
    </div>`;
  }

  function expenseForm(row){
    const type=row?.type==='agence'||row?.type==='Dépense agence'?'agence':'bien';
    const bien=row?.bien||'';
    return `<div class="gpf-section"><h3>1. Dépense</h3>
      <div class="gpf-grid"><div class="gpf-field"><label>Type de dépense <b>*</b></label><select id="gpf-d-type" onchange="gpFinanceV16ToggleExpense()"><option value="bien" ${type==='bien'?'selected':''}>Travaux / réparations d'un bien</option><option value="agence" ${type==='agence'?'selected':''}>Dépense agence</option></select></div>
      <div class="gpf-field"><label>Catégorie <b>*</b></label><select id="gpf-d-cat">${['Travaux','Réparation','Entretien','Transport','Facture agence','Fournitures','Taxe','Assurance','Autre'].map(x=>'<option '+(x===(row?.cat||row?.categorie||'Travaux')?'selected':'')+'>'+x+'</option>').join('')}</select></div>
      <div class="gpf-field" style="grid-column:1/-1"><label>Libellé <b>*</b></label><input id="gpf-d-libelle" value="${escAttr(row?.libelle||row?.titre||'')}" placeholder="Ex. Réparation plomberie"></div>
      <div class="gpf-field"><label>Montant (FCFA) <b>*</b></label><input id="gpf-d-montant" type="number" value="${escAttr(row?.montant||'')}"></div>
      <div class="gpf-field"><label>Date <b>*</b></label><input id="gpf-d-date" type="date" value="${escAttr(row?.date||today())}"></div></div>
    </div>
    <div class="gpf-section"><h3>2. Affectation</h3>
      <div class="gpf-grid"><div class="gpf-field"><label>Bien concerné</label><select id="gpf-d-bien" onchange="gpFinanceV16SyncExpenseOwner()">${bienOptions(bien)}</select></div>
      <div class="gpf-field"><label>Facturable au propriétaire ?</label><select id="gpf-d-facturable"><option value="oui" ${(row?.facturable||'oui')==='oui'?'selected':''}>Oui</option><option value="non" ${row?.facturable==='non'?'selected':''}>Non</option></select></div>
      <div class="gpf-field" style="grid-column:1/-1"><label>Justificatif</label><input id="gpf-d-facture" type="file" accept="image/*,.pdf"></div></div>
      <div class="gpf-info" id="gpf-d-owner">Propriétaire : <b>—</b></div>
    </div>`;
  }

  function ownerForBien(name){
    const d=db(); const b=(d.biens||[]).find(x=>bienLabel(x)===name); if(!b) return '';
    return b.proprio || b.proprietaire || b.owner || '';
  }
  /* Rattachement par identifiant (le libellé du bien peut changer ; l'ID, non). */
  function bienRefForName(name){
    const d=db(); const b=name ? (d.biens||[]).find(x=>bienLabel(x)===name) : null;
    return b ? { bienId: String(b.id||''), proprietaireId: String(b.proprietaireId||b.proprioId||b.ownerId||'') } : { bienId:'', proprietaireId:'' };
  }
  function syncPayment(){
    const value=get('gpf-p-location'); const l=locationForValue(value); if(!l) return;
    const tenant=locataireLabel(l); const bien=l.bien||l.bienNom||'';
    const info=$('gpf-p-derived'); if(info) info.innerHTML='Locataire : <b>'+esc(tenant||'—')+'</b> &nbsp;•&nbsp; Bien : <b>'+esc(bien||'—')+'</b>';
    if(state.index<0){ const due=num(l.loyer||l.montant||''); set('gpf-p-montant',due||''); set('gpf-p-paye',due||''); }
    updateReste();
  }
  function updateReste(){set('gpf-p-reste',Math.max(0,num(get('gpf-p-montant'))-num(get('gpf-p-paye'))));}
  function toggleExpense(){
    const type=get('gpf-d-type'); const bien=$('gpf-d-bien'); if(!bien) return;
    bien.disabled=type==='agence'; if(type==='agence') bien.value=''; syncExpenseOwner();
    const fact=$('gpf-d-facturable'); if(fact) fact.disabled=type==='agence'; if(type==='agence') fact.value='non';
  }
  function syncExpenseOwner(){
    const owner=ownerForBien(get('gpf-d-bien')); const info=$('gpf-d-owner'); if(info) info.innerHTML='Propriétaire : <b>'+esc(owner||'—')+'</b>';
  }
  async function readFile(){ const f=$('gpf-d-facture')?.files?.[0]; if(!f) return null; return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f);}); }

  function open(kind,index=-1){
    injectStyle(); state.kind=kind; state.index=Number.isInteger(index)?index:-1;
    document.getElementById('gpFinanceOverlayV16')?.remove(); document.getElementById('gpFinanceDrawerV16')?.remove();
    const d=db(); const row=kind==='paiement' ? (d.paiements||[])[state.index] : (d.depenses||[])[state.index];
    const edit=!!row;
    const title=kind==='paiement' ? (edit?'Modifier l’encaissement':'Nouvel encaissement') : (edit?'Modifier la dépense':'Nouvelle dépense');
    const sub=kind==='paiement' ? (edit?'Modifiez les informations de l’encaissement.':'Enregistrez un paiement lié à une location.') : (edit?'Modifiez les informations de la dépense.':'Enregistrez une dépense liée à un bien ou à l’agence.');
    const body=kind==='paiement'?paymentForm(row):expenseForm(row);
    document.body.insertAdjacentHTML('beforeend',`<div id="gpFinanceOverlayV16" data-gp-finance-close="1"></div><aside id="gpFinanceDrawerV16" aria-label="${esc(title)}"><div class="gpf-head"><div><div class="gpf-title">${esc(title)}</div><div class="gpf-sub">${esc(sub)}</div></div><button type="button" class="gpf-close" data-gp-finance-close="1" aria-label="Fermer"><span class="material-symbols-rounded">close</span></button></div><div class="gpf-body">${body}</div><div class="gpf-foot"><button type="button" class="gpf-btn gpf-cancel" data-gp-finance-close="1">Annuler</button><button type="button" class="gpf-btn gpf-save" onclick="window.GPFinanceV16&&window.GPFinanceV16.save()"><span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">save</span> ${edit?'Enregistrer les modifications':'Enregistrer'}</button></div></aside>`);
    if(kind==='paiement') syncPayment(); else { toggleExpense(); syncExpenseOwner(); }
    const ov=$('gpFinanceOverlayV16'), dr=$('gpFinanceDrawerV16');
    if(ov) ov.addEventListener('click', close, {once:false});
    if(dr) dr.querySelectorAll('[data-gp-finance-close="1"]').forEach(function(btn){ btn.addEventListener('click', close); });
    requestAnimationFrame(()=>{ if(ov) ov.style.opacity='1'; if(dr) dr.style.transform='translateX(0)'; });
  }
  function close(){ const ov=$('gpFinanceOverlayV16'),dr=$('gpFinanceDrawerV16'); if(!ov && !dr){ state.kind=null; state.index=-1; return; } if(dr)dr.style.transform='translateX(100%)'; if(ov)ov.style.opacity='0'; setTimeout(()=>{ if(ov)ov.remove(); if(dr)dr.remove(); },180); state.kind=null; state.index=-1; }
  function refresh(kind){ window.DB=db(); try{ if(kind==='paiement'&&typeof window.renderPaiements==='function') window.renderPaiements(); if(kind==='depense'&&typeof window.renderDepenses==='function') window.renderDepenses(); if(typeof window.renderAvenir==='function') window.renderAvenir(); if(typeof window.renderRapports==='function') window.renderRapports(); if(typeof window.updateSidebarBadges==='function') window.updateSidebarBadges(); }catch(e){} }
  async function save(){
    const kind=state.kind, idx=state.index; if(!kind) return;
    const d=db();
    if(kind==='paiement'){
      const locValue=get('gpf-p-location'); const l=locationForValue(locValue); if(!l) return notify('Sélectionnez une location','err');
      const montant=num(get('gpf-p-montant')), paye=num(get('gpf-p-paye')); if(montant<=0) return notify('Le montant dû doit être supérieur à 0','err'); if(paye<0||paye>montant) return notify('Le montant encaissé est invalide','err');
      const row={locataire:locataireLabel(l),locative:locValue,bien:l.bien||l.bienNom||'',montant:String(Math.round(montant)),paye:String(Math.round(paye)),reste:String(Math.max(0,Math.round(montant-paye))),date:get('gpf-p-date')||today(),mode:get('gpf-p-mode')||'Espèces'};
      if(!Array.isArray(d.paiements)) d.paiements=[];
      if(idx>=0 && d.paiements[idx]) Object.assign(d.paiements[idx],row); else d.paiements.unshift(row);
      if(num(row.reste)===0 && Array.isArray(d.contrats)){
        const ct=d.contrats.find(c=>c.locataire===row.locataire&&c.locative===row.locative&&c.statut==='Actif');
        if(ct && typeof window.addOneMonthGP==='function'){ let next=window.parseGPDate?window.parseGPDate(ct.prochain):new Date(ct.prochain); const paid=window.parseGPDate?window.parseGPDate(row.date):new Date(row.date); while(next&&paid&&next<=paid) next=window.addOneMonthGP(next); if(next) ct.prochain=window.formatGPDate?window.formatGPDate(next):next.toISOString().slice(0,10); }
      }
      const saved=await saveDb(d); if(saved===false) return notify('Modification non enregistrée. Rechargez puis réessayez.','err'); refresh(kind); close(); notify(idx>=0?'Encaissement modifié ✓':'Encaissement enregistré ✓');
    } else {
      const lib=get('gpf-d-libelle'), montant=num(get('gpf-d-montant')), date=get('gpf-d-date')||today(), type=get('gpf-d-type'), cat=get('gpf-d-cat'), bien=type==='bien'?get('gpf-d-bien'):'';
      if(lib.length<3) return notify('Le libellé doit contenir au moins 3 caractères','err'); if(montant<=0) return notify('Le montant doit être supérieur à 0','err'); if(type==='bien'&&!bien) return notify('Sélectionnez le bien concerné','err');
      if(!Array.isArray(d.depenses)) d.depenses=[]; const old=idx>=0?d.depenses[idx]:null; const file=await readFile();
      const row={...(old||{}),libelle:lib,type,cat,categorie:cat,montant:String(Math.round(montant)),date,bien,proprietaire:ownerForBien(bien),...bienRefForName(bien),facturable:type==='agence'?'non':get('gpf-d-facturable'),factureData:file||old?.factureData||null};
      if(idx>=0&&d.depenses[idx]) d.depenses[idx]=row; else d.depenses.unshift(row);
      const saved=await saveDb(d); if(saved===false) return notify('Modification non enregistrée. Rechargez puis réessayez.','err'); refresh(kind); close(); notify(idx>=0?'Dépense modifiée ✓':'Dépense enregistrée ✓');
    }
  }


  function financeStyle(){
    if($('gp-finance-pages-v16-style')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="gp-finance-pages-v16-style">
      .gpf-page{padding:0}.gpf-top{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}.gpf-title-page{display:flex;align-items:center;gap:10px}.gpf-title-page h3{margin:0;font-size:18px}.gpf-title-page p{margin:3px 0 0;color:#6b7280;font-size:12px}.gpf-add{border:0;background:#d4af37;color:#111;border-radius:9px;height:38px;padding:0 14px;font-weight:900;cursor:pointer}.gpf-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}.gpf-card{background:#fff;border:1px solid #eee;border-radius:12px;padding:12px}.gpf-card small{display:block;color:#6b7280;font-size:10px}.gpf-card strong{display:block;font-size:18px;margin-top:3px}.gpf-toolbar{display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap}.gpf-toolbar input,.gpf-toolbar select{height:36px;border:1px solid #e5e7eb;border-radius:9px;padding:0 10px;background:#fff;font-size:12px}.gpf-toolbar input{min-width:250px}.gpf-table{background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden}.gpf-table table{width:100%;border-collapse:collapse;font-size:12px}.gpf-table th{background:#faf7e8;color:#4b5563;font-size:10px;text-transform:uppercase;padding:10px;text-align:left}.gpf-table td{padding:10px;border-top:1px solid #f1f5f9}.gpf-actions{display:flex;gap:5px;justify-content:flex-end}.gpf-action{width:28px;height:28px;border:1px solid #e5e7eb;background:#fff;border-radius:7px;cursor:pointer}.gpf-action:hover{background:#f8fafc}.gpf-empty{padding:35px;text-align:center;color:#9ca3af}.gpf-pill{display:inline-block;padding:3px 7px;border-radius:999px;background:#dcfce7;color:#15803d;font-weight:800;font-size:10px}.gpf-pill.warn{background:#fef3c7;color:#92400e}.gpf-page-footer{padding:10px;color:#6b7280;font-size:11px}.gpf-red{color:#dc2626;font-weight:900}.gpf-toolbar-finance{width:100%;flex-wrap:nowrap}.gpf-toolbar-finance input{flex:1 1 320px;min-width:220px}.gpf-toolbar-finance select{flex:0 0 190px}.gpf-expense-cards{grid-template-columns:repeat(4,1fr)}.gpf-expense-cards .gpf-card{min-height:66px}.gpf-expense-toolbar .gpf-month-filter{flex:0 0 150px;min-width:150px}.gpf-expense-toolbar #gpf-page-dep-search{flex:1 1 230px;min-width:200px}.gpf-expense-toolbar select{flex:0 1 165px}.gpf-expense-toolbar .gpf-month-filter:disabled{background:#f8fafc;color:#9ca3af}.gpf-expense-viewbar{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 10px}.gpf-expense-tabs{display:inline-flex;border:1px solid #e5e7eb;border-radius:9px;padding:3px;background:#f8fafc}.gpf-expense-tab{border:0;background:transparent;border-radius:7px;padding:7px 11px;font-size:11px;font-weight:800;color:#6b7280;cursor:pointer}.gpf-expense-tab.active{background:#fff;color:#111827;box-shadow:0 1px 3px rgba(15,23,42,.08)}.gpf-analysis{display:grid;grid-template-columns:minmax(0,2fr) minmax(280px,1fr);gap:10px}.gpf-analysis-card{background:#fff;border:1px solid #eee;border-radius:12px;padding:12px}.gpf-analysis-card h4{margin:0 0 10px;font-size:13px;color:#111827}.gpf-analysis-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.gpf-analysis-head h4{margin-bottom:2px}.gpf-analysis-head p{margin:0 0 10px;color:#6b7280;font-size:10px}.gpf-analysis-clickable{cursor:pointer}.gpf-analysis-clickable:hover{background:#fffaf0}.gpf-analysis-view{border:1px solid #e5dfca;background:#fff;border-radius:7px;padding:4px 8px;font-size:10px;font-weight:800;color:#8a6b0a;cursor:pointer}.gpf-analysis-view:hover{background:#faf7e8}.gpf-analysis-total-row td{border-top:1px solid #e5e7eb}.gpf-analysis-table{width:100%;border-collapse:collapse;font-size:12px}.gpf-analysis-table th{font-size:10px;text-transform:uppercase;color:#6b7280;text-align:left;padding:8px;border-bottom:1px solid #eef2f7}.gpf-analysis-table td{padding:9px 8px;border-bottom:1px solid #f1f5f9}.gpf-analysis-table tr:last-child td{border-bottom:0}.gpf-analysis-total{font-weight:900;color:#dc2626}.gpf-analysis-bars{display:grid;gap:9px}.gpf-analysis-bar{display:grid;grid-template-columns:105px 1fr 90px;gap:8px;align-items:center;font-size:11px}.gpf-analysis-track{height:8px;background:#f1f5f9;border-radius:999px;overflow:hidden}.gpf-analysis-fill{height:100%;background:#d4af37;border-radius:999px}.gpf-analysis-empty{padding:25px;text-align:center;color:#9ca3af;font-size:12px}@media(max-width:900px){.gpf-analysis{grid-template-columns:1fr}.gpf-analysis-bar{grid-template-columns:90px 1fr 80px}}.gpf-toolbar-actions{margin-left:auto;display:flex;align-items:center;gap:6px;flex:0 0 auto}.gpf-import-export{height:32px;border:1px solid #e5dfca;background:#fff;border-radius:8px;padding:0 9px;display:inline-flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;font-weight:800;color:#374151;white-space:nowrap}.gpf-import-export .material-symbols-rounded{font-size:14px;color:#a98213}@media(max-width:900px){.gpf-cards{grid-template-columns:1fr}.gpf-toolbar-finance{flex-wrap:wrap}.gpf-toolbar-finance input{min-width:180px;flex:1 1 100%}.gpf-toolbar-finance select{flex:1 1 180px}.gpf-toolbar-actions{margin-left:0}.gpf-table{overflow:auto}}
    </style>`);
  }
  const PAGE={paiements:1,depenses:1}; const PS={paiements:10,depenses:10};
  const currentMonth=()=>new Date().toISOString().slice(0,7);
  const expenseMonth=v=>{ const s=String(v||'').trim(); if(/^\d{4}-\d{2}/.test(s)) return s.slice(0,7); const m=s.match(/^(\d{2})[\/.-](\d{2})[\/.-](\d{4})$/); return m?m[3]+'-'+m[2]:''; };
  const expenseType=x=>String(x?.type||'').toLowerCase().includes('agence')?'agence':'bien';
  function financePagination(key,total){ return window.GPPagination ? GPPagination.pages(key,total,PS[key], key==='paiements'?renderPaiements:renderDepenses) : ''; }
  window.gpFinancePage=function(key,p){ if(key!=='paiements'&&key!=='depenses')return; PAGE[key]=Math.max(1,Number(p)||1); if(window.GPPagination)GPPagination.state[key]=PAGE[key]; return key==='paiements'?renderPaiements():renderDepenses(); };

  function renderPaiements(){
    financeStyle(); const page=$('page-paiements'); if(!page)return;
    const d=db(); const all=Array.isArray(d.paiements)?d.paiements:[];
    const q=(($('gpf-page-pay-search')||{}).value||'').toLowerCase();
    const mode=(($('gpf-page-pay-mode')||{}).value||'');
    const rows=all.filter(p=>(!q||JSON.stringify(p).toLowerCase().includes(q))&&(!mode||String(p.mode||'')===mode));
    const total=all.reduce((s,p)=>s+num(p.montant),0), paid=all.reduce((s,p)=>s+num(p.paye||p.montantPaye),0), reste=all.reduce((s,p)=>s+num(p.reste||Math.max(0,num(p.montant)-num(p.paye||p.montantPaye))),0);
    const pg=window.GPPagination?GPPagination.normalize('paiements',rows.length,PS.paiements):{page:PAGE.paiements,start:(PAGE.paiements-1)*PS.paiements}; PAGE.paiements=pg.page;
    const visible=rows.slice(pg.start,pg.start+PS.paiements);
    page.innerHTML='<div class="gpf-page"><div class="gpf-top"><div class="gpf-title-page"><span class="material-symbols-rounded" style="color:#16a34a">payments</span><div><h3>Encaissements</h3><p>Enregistrez et suivez les paiements liés aux locations.</p></div></div><button class="gpf-add" onclick="openFinanceDrawer(\'paiement\')"><span class="material-symbols-rounded" style="font-size:16px;vertical-align:-3px">add</span> Nouvel encaissement</button></div>'+
      '<div class="gpf-cards"><div class="gpf-card"><small>Montant dû</small><strong>'+num(total).toLocaleString('fr-FR')+' FCFA</strong></div><div class="gpf-card"><small>Total encaissé</small><strong>'+num(paid).toLocaleString('fr-FR')+' FCFA</strong></div><div class="gpf-card"><small>Reste</small><strong class="gpf-red">'+num(reste).toLocaleString('fr-FR')+' FCFA</strong></div></div>'+
      '<div class="gpf-toolbar gpf-toolbar-finance"><input id="gpf-page-pay-search" placeholder="Rechercher un encaissement…" value="'+esc(q)+'" oninput="gpFinancePage(\'paiements\',1)"><select id="gpf-page-pay-mode" onchange="gpFinancePage(\'paiements\',1)"><option value="">Tous les modes</option>'+['Espèces','Virement','Chèque','Mobile Money','Wave','Orange Money'].map(x=>'<option '+(mode===x?'selected':'')+'>'+x+'</option>').join('')+'</select><div class="gpf-toolbar-actions"><button class="gpf-import-export" onclick="window.exportExcel?exportExcel(\'paiements\'):window.exportListePDF&&exportListePDF(\'paiements\')"><span class="material-symbols-rounded">download</span>Exporter</button><button class="gpf-import-export" onclick="window.openImportModal&&openImportModal(\'paiements\')"><span class="material-symbols-rounded">upload</span>Importer</button></div></div>'+
      '<div class="gpf-table"><table><thead><tr><th>Locataire</th><th>Location</th><th>Montant</th><th>Encaissé</th><th>Reste</th><th>Date</th><th>Mode</th><th>Actions</th></tr></thead><tbody>'+
      (visible.length?visible.map((r)=>{const i=all.indexOf(r); const rr=num(r.reste||Math.max(0,num(r.montant)-num(r.paye||r.montantPaye))); return '<tr><td><b>'+esc(r.locataire||'—')+'</b></td><td>'+esc(r.locative||r.bien||'—')+'</td><td>'+num(r.montant).toLocaleString('fr-FR')+' FCFA</td><td>'+num(r.paye||r.montantPaye).toLocaleString('fr-FR')+' FCFA</td><td><span class="gpf-pill '+(rr?'warn':'')+'">'+rr.toLocaleString('fr-FR')+' FCFA</span></td><td>'+esc(r.date||'—')+'</td><td>'+esc(r.mode||'—')+'</td><td><div class="gpf-actions"><button class="gpf-action" onclick="editRow(\'paiements\','+i+')" title="Modifier">✎</button><button class="gpf-action" onclick="gpFinanceV16Delete(\'paiements\','+i+')" title="Supprimer">×</button></div></td></tr>';}).join(''):'<tr><td colspan="8" class="gpf-empty">Aucun encaissement enregistré</td></tr>')+
      '</tbody></table></div><div class="gpf-page-footer gp-common-footer"><span>Affichage de '+(rows.length?pg.start+1:0)+' à '+Math.min(pg.start+PS.paiements,rows.length)+' sur '+rows.length+' encaissement'+(rows.length>1?'s':'')+'</span>'+financePagination('paiements',rows.length)+'</div></div>';
  }

  function renderExpenseAnalysis(rows){
    if(!rows.length) return '<div class="gpf-analysis-empty">Aucune dépense à analyser avec les filtres sélectionnés.</div>';
    const byBien={}; const byCat={};
    rows.forEach(r=>{
      const bien=String(r.bien||'Agence').trim()||'Agence';
      const cat=String(r.cat||r.categorie||'Autre').trim()||'Autre';
      const amount=num(r.montant);
      byBien[bien]=(byBien[bien]||0)+amount;
      byCat[cat]=(byCat[cat]||0)+amount;
    });
    const total=rows.reduce((s,r)=>s+num(r.montant),0);
    const biensRows=Object.entries(byBien).sort((a,b)=>b[1]-a[1]);
    const catsRows=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
    const maxCat=catsRows[0]?.[1]||1;
    return '<div class="gpf-analysis"><div class="gpf-analysis-card"><div class="gpf-analysis-head"><div><h4>Dépenses par bien</h4><p>Cliquez sur un bien pour voir ses dépenses détaillées.</p></div></div><table class="gpf-analysis-table"><thead><tr><th>Bien / affectation</th><th>Nombre</th><th>Total</th><th>Part</th><th></th></tr></thead><tbody>'+
      biensRows.map(([bien,amount])=>{const count=rows.filter(r=>String(r.bien||'Agence').trim()===bien).length; const pct=total?amount/total*100:0; const key=encodeURIComponent(bien); return '<tr class="gpf-analysis-clickable" onclick="gpExpenseOpenBien(decodeURIComponent(\''+key+'\'))" title="Voir les dépenses de '+esc(bien)+'"><td><b>'+esc(bien)+'</b></td><td>'+count+'</td><td class="gpf-analysis-total">'+num(amount).toLocaleString('fr-FR')+' FCFA</td><td>'+pct.toFixed(1)+' %</td><td><button type="button" class="gpf-analysis-view" onclick="event.stopPropagation();gpExpenseOpenBien(decodeURIComponent(\''+key+'\'))">Voir</button></td></tr>';}).join('')+
      '<tr class="gpf-analysis-total-row"><td><b>Total</b></td><td>'+rows.length+'</td><td class="gpf-analysis-total">'+num(total).toLocaleString('fr-FR')+' FCFA</td><td>100 %</td><td></td></tr></tbody></table></div>'+
      '<div class="gpf-analysis-card"><h4>Dépenses par catégorie</h4><div class="gpf-analysis-bars">'+catsRows.map(([cat,amount])=>'<div class="gpf-analysis-bar"><span>'+esc(cat)+'</span><div class="gpf-analysis-track"><div class="gpf-analysis-fill" style="width:'+Math.max(2,amount/maxCat*100).toFixed(1)+'%"></div></div><b>'+num(amount).toLocaleString('fr-FR')+' F</b></div>').join('')+'</div></div></div>';
  }

  window.gpExpenseOpenBien=function(bien){
    state.expenseBienFocus=String(bien||'');
    state.expenseView='detail';
    PAGE.depenses=1;
    if(window.GPPagination)GPPagination.state.depenses=1;
    return renderDepenses();
  };
  window.gpExpenseBackAnalysis=function(){
    state.expenseBienFocus=null;
    state.expenseView='analysis';
    return renderDepenses();
  };
  window.gpExpenseClearBienFocus=function(){ state.expenseBienFocus=null; };

  function renderDepenses(){
    financeStyle(); const page=$('page-depenses'); if(!page)return;
    const d=db(); const all=Array.isArray(d.depenses)?d.depenses:[];
    const q=(($('gpf-page-dep-search')||{}).value||'').toLowerCase();
    const cat=(($('gpf-page-dep-cat')||{}).value||'');
    const type=(($('gpf-page-dep-type')||{}).value||'');
    const bien=state.expenseBienFocus!==null ? state.expenseBienFocus : (($('gpf-page-dep-bien')||{}).value||'');
    const period=(($('gpf-page-dep-period')||{}).value||'month');
    const month=(($('gpf-page-dep-month')||{}).value||currentMonth());
    const rows=all.filter(x=>{
      const hay=!q||JSON.stringify(x).toLowerCase().includes(q);
      const c=!cat||String(x.cat||x.categorie||'')===cat;
      const t=!type||expenseType(x)===type;
      const b=!bien||String(x.bien||'')===bien;
      const m=period!=='month'||expenseMonth(x.date)===month;
      return hay&&c&&t&&b&&m;
    });
    const total=rows.reduce((s,x)=>s+num(x.montant),0);
    const totalBiens=rows.filter(x=>expenseType(x)==='bien'||x.bien).reduce((s,x)=>s+num(x.montant),0);
    const totalAgence=rows.filter(x=>expenseType(x)==='agence'&&!x.bien).reduce((s,x)=>s+num(x.montant),0);
    const totalTravaux=rows.filter(x=>String(x.cat||x.categorie||'').toLowerCase()==='travaux').reduce((s,x)=>s+num(x.montant),0);
    const pg=window.GPPagination?GPPagination.normalize('depenses',rows.length,PS.depenses):{page:PAGE.depenses,start:(PAGE.depenses-1)*PS.depenses}; PAGE.depenses=pg.page;
    const visible=rows.slice(pg.start,pg.start+PS.depenses);
    const monthLabel=period==='month'?month.split('-').reverse().join('/'):'Toutes périodes';
    const bienOptionsHtml='<option value="">Tous les biens</option>'+biens().map(b=>{const v=bienLabel(b);return '<option value="'+escAttr(v)+'" '+(bien===v?'selected':'')+'>'+esc(v)+'</option>';}).join('');
    page.innerHTML='<div class="gpf-page"><div class="gpf-top"><div class="gpf-title-page"><span class="material-symbols-rounded" style="color:#dc2626">account_balance_wallet</span><div><h3>Dépenses</h3><p>Suivez les dépenses de vos biens et les charges de l’agence.</p></div></div></div>'+ 
      '<div class="gpf-expense-summary-row"><div class="gpf-cards gpf-expense-cards"><div class="gpf-card gpf-card-total"><small>Total '+esc(monthLabel)+'</small><strong>'+num(total).toLocaleString('fr-FR')+' FCFA</strong></div><div class="gpf-card gpf-card-biens"><small>Dépenses biens</small><strong>'+num(totalBiens).toLocaleString('fr-FR')+' FCFA</strong></div><div class="gpf-card gpf-card-agence"><small>Dépenses agence</small><strong>'+num(totalAgence).toLocaleString('fr-FR')+' FCFA</strong></div><div class="gpf-card gpf-card-travaux"><small>Travaux</small><strong>'+num(totalTravaux).toLocaleString('fr-FR')+' FCFA</strong></div></div><button class="gpf-add gpf-expense-add" onclick="openFinanceDrawer(\'depense\')"><span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px">add</span> Nouvelle dépense</button></div>'+ 
      '<div class="gpf-toolbar gpf-toolbar-finance gpf-expense-toolbar"><input id="gpf-page-dep-search" placeholder="Rechercher une dépense…" value="'+esc(q)+'" oninput="gpFinancePage(\'depenses\',1)"><span class="gpf-select-wrap"><select id="gpf-page-dep-period" onchange="gpFinancePage(\'depenses\',1)"><option value="month" '+(period==='month'?'selected':'')+'>Mois sélectionné</option><option value="all" '+(period==='all'?'selected':'')+'>Toutes périodes</option></select></span><input id="gpf-page-dep-month" class="gpf-month-filter" type="month" value="'+escAttr(month)+'" onchange="gpFinancePage(\'depenses\',1)" '+(period!=='month'?'disabled':'')+'><span class="gpf-select-wrap"><select id="gpf-page-dep-bien" onchange="gpExpenseClearBienFocus();gpFinancePage(\'depenses\',1)">'+bienOptionsHtml+'</select></span><span class="gpf-select-wrap"><select id="gpf-page-dep-type" onchange="gpFinancePage(\'depenses\',1)"><option value="">Tous les types</option><option value="bien" '+(type==='bien'?'selected':'')+'>Dépenses biens</option><option value="agence" '+(type==='agence'?'selected':'')+'>Dépenses agence</option></select></span><span class="gpf-select-wrap"><select id="gpf-page-dep-cat" onchange="gpFinancePage(\'depenses\',1)"><option value="">Toutes catégories</option>'+['Travaux','Réparation','Entretien','Transport','Facture agence','Fournitures','Taxe','Assurance','Autre'].map(x=>'<option '+(cat===x?'selected':'')+'>'+x+'</option>').join('')+'</select></span><div class="gpf-toolbar-actions"><button class="gpf-import-export" onclick="window.exportExcel?exportExcel(\'depenses\'):window.exportListePDF&&exportListePDF(\'depenses\')"><span class="material-symbols-rounded">download</span>Exporter</button><button class="gpf-import-export" onclick="window.openImportModal&&openImportModal(\'depenses\')"><span class="material-symbols-rounded">upload</span>Importer</button></div></div>'+ 
      '<div class="gpf-expense-viewbar"><div class="gpf-expense-tabs"><button class="gpf-expense-tab '+(state.expenseView==='detail'?'active':'')+'" onclick="gpExpenseView(\'detail\')">Liste détaillée</button><button class="gpf-expense-tab '+(state.expenseView==='analysis'?'active':'')+'" onclick="gpExpenseView(\'analysis\')">Analyse par bien</button></div><div style="display:flex;align-items:center;gap:8px">'+(state.expenseBienFocus?'<button type="button" class="gpf-analysis-view" onclick="gpExpenseBackAnalysis()">← Retour à l’analyse</button>':'')+'<span style="font-size:11px;color:#6b7280">'+rows.length+' dépense'+(rows.length>1?'s':'')+'</span></div></div>'+
      (state.expenseView==='analysis' ? renderExpenseAnalysis(rows) :
        '<div class="gpf-table"><table><thead><tr><th>Dépense</th><th>Catégorie</th><th>Type</th><th>Montant</th><th>Date</th><th>Bien</th><th>Actions</th></tr></thead><tbody>' +
        (visible.length ? visible.map(r=>{const i=all.indexOf(r);const rt=expenseType(r);return '<tr><td><b>'+esc(r.libelle||r.titre||'Dépense')+'</b></td><td>'+esc(r.cat||r.categorie||'—')+'</td><td>'+esc(rt==='agence'?'Agence':'Bien')+'</td><td class="gpf-red">'+num(r.montant).toLocaleString('fr-FR')+' FCFA</td><td>'+esc(r.date||'—')+'</td><td>'+esc(r.bien||'Agence')+'</td><td><div class="gpf-actions"><button class="gpf-action" onclick="editRow(\'depenses\','+i+')" title="Modifier">✎</button><button class="gpf-action" onclick="gpFinanceV16Delete(\'depenses\','+i+')" title="Supprimer">×</button></div></td></tr>';}).join('') : '<tr><td colspan="7" class="gpf-empty">Aucune dépense pour les filtres sélectionnés</td></tr>') +
        '</tbody></table></div><div class="gpf-page-footer gp-common-footer"><span>Affichage de '+(rows.length?pg.start+1:0)+' à '+Math.min(pg.start+PS.depenses,rows.length)+' sur '+rows.length+' dépense'+(rows.length>1?'s':'')+'</span>'+financePagination('depenses',rows.length)+'</div>')+'</div>';
  }

  async function deleteFinanceRow(kind,index){ const d=db(); const list=kind==='paiements'?d.paiements:d.depenses; if(!list||!list[index])return; const ok=window.GPForms&&GPForms.confirm?await GPForms.confirm('Supprimer cet élément ?', {title:'Suppression',okText:'Supprimer'}):confirm('Supprimer cet élément ?'); if(!ok)return; list.splice(index,1); await saveDb(d); refresh(kind==='paiements'?'paiement':'depense'); notify('Suppression effectuée ✓'); }

  const oldEdit=window.editRow;
  window.editRow=function(key,index){ if(key==='paiements') return open('paiement',index); if(key==='depenses') return open('depense',index); return typeof oldEdit==='function'?oldEdit.apply(this,arguments):undefined; };
  window.openFinanceDrawer=function(kind,index=-1){ return open(kind,index); };
  window.openPayModal=function(){ return open('paiement',-1); };
  window.closePayModal=close;
  window.openDepModal=function(){ return open('depense',-1); };
  window.closeDepModal=close;
  window.gpFinanceV16SyncLocation=syncPayment;
  window.gpFinanceV16UpdateReste=updateReste;
  window.gpFinanceV16ToggleExpense=toggleExpense;
  window.gpFinanceV16SyncExpenseOwner=syncExpenseOwner;
  window.gpFinanceV16Save=save;
  window.renderPaiements=renderPaiements;
  window.gpExpenseView=function(view){ state.expenseView=view==='analysis'?'analysis':'detail'; return renderDepenses(); };
  window.renderDepenses=renderDepenses;
  window.gpFinanceV16Delete=deleteFinanceRow;
  window.GPFinanceV16={open,close,save,renderPaiements,renderDepenses};
})();
