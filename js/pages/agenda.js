/* Genius Property V16 — Module Agenda / Agenda employés
   Objectif: isoler les règles agenda hors du bundle legacy, sans casser les anciens écrans. */
(function(){
  'use strict';
  const MODULE='agenda';
  const $ = id => document.getElementById(id);
  const esc = v => (window.gp_esc ? window.gp_esc(v) : String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])));
  const uid = p => (window.gp_uid ? window.gp_uid(p||'ev') : `${p||'ev'}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
  const todayKey = () => (window.gp_todayKey ? window.gp_todayKey() : new Date().toISOString().slice(0,10));
  const toast = (m,t) => typeof window.toast === 'function' ? window.toast(m,t) : console.log(`[${MODULE}]`, m);
  const save = () => window.GPDB && window.GPDB.save ? window.GPDB.save(db()) : (typeof window.saveDB === 'function' ? window.saveDB() : undefined);

  function db(){
    const data = window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {});
    if(!Array.isArray(data.agenda)) data.agenda=[];
    if(!Array.isArray(data.employeeAgenda)) data.employeeAgenda=[];
    window.DB = data;
    return data;
  }

  function validateAgendaEvent(ev){
    const errors=[];
    if(!String(ev.title||'').trim()) errors.push('Le titre est obligatoire');
    if(!ev.date) errors.push('La date est obligatoire');
    if(ev.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(ev.time)) errors.push('Heure invalide');
    if(ev.date && Number.isNaN(new Date(ev.date+'T00:00:00').getTime())) errors.push('Date invalide');
    if(!['rdv','tache','rappel','autre'].includes(ev.type||'rdv')) errors.push('Type agenda invalide');
    if(!['basse','normale','haute'].includes(ev.priority||'normale')) errors.push('Priorité invalide');
    return errors;
  }

  function validateEmployeeMission(m){
    const errors=[];
    if(!String(m.title||'').trim()) errors.push('Le titre de mission est obligatoire');
    if(!m.employeeId) errors.push('Employé obligatoire');
    if(!m.date) errors.push('Date obligatoire');
    if(m.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(m.time)) errors.push('Heure invalide');
    if(!['a_faire','en_cours','termine'].includes(m.status||'a_faire')) errors.push('Statut invalide');
    if(!['basse','normale','haute'].includes(m.priority||'normale')) errors.push('Priorité invalide');
    return errors;
  }

  function normalizeAgendaEvent(raw){
    return {
      id: raw.id || uid('ev'),
      title: String(raw.title||'').trim(),
      type: raw.type || 'rdv',
      priority: raw.priority || 'normale',
      date: raw.date || todayKey(),
      time: raw.time || '',
      lieu: String(raw.lieu||'').trim(),
      note: String(raw.note||'').trim(),
      done: !!raw.done,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function upsertAgendaEvent(raw){
    const store=db().agenda;
    const ev=normalizeAgendaEvent(raw);
    const errors=validateAgendaEvent(ev);
    if(errors.length){ toast(errors[0], 'err'); return null; }
    const idx=store.findIndex(x=>x.id===ev.id);
    if(idx>=0){ ev.done=!!store[idx].done; ev.createdAt=store[idx].createdAt||ev.createdAt; store[idx]=ev; }
    else store.unshift(ev);
    save();
    if(typeof window.gpAmRender==='function') window.gpAmRender();
    if(typeof window.renderDashboard==='function') setTimeout(window.renderDashboard, 20);
    return ev;
  }

  function removeAgendaEvent(id){
    const store=db().agenda;
    const before=store.length;
    const data = db();
    data.agenda=store.filter(x=>x.id!==id);
    if(data.agenda.length!==before){ save(); toast('Événement supprimé'); }
    if(typeof window.gpAmRender==='function') window.gpAmRender();
    if(typeof window.renderDashboard==='function') setTimeout(window.renderDashboard, 20);
  }

  function getAgendaStats(){
    const d=db();
    const today=todayKey();
    const tomorrow=new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const tk=tomorrow.toISOString().slice(0,10);
    const active=d.agenda.filter(a=>!a.done);
    return {
      total:d.agenda.length,
      actifs:active.length,
      aujourdhui:active.filter(a=>a.date===today).length,
      demain:active.filter(a=>a.date===tk).length,
      missions:d.employeeAgenda.length,
      missionsOuvertes:d.employeeAgenda.filter(m=>m.status!=='termine').length
    };
  }

  // Remplace l'ancien saveAgendaEvent par une version validée, tout en gardant les mêmes IDs HTML.
  window.saveAgendaEvent = function(){
    const existingId=$('gpEfId')?.value || '';
    const old=existingId ? db().agenda.find(a=>a.id===existingId) : null;
    const ev=upsertAgendaEvent({
      id: existingId || undefined,
      title: $('gpEfTitre')?.value || '',
      type: $('gpEfType')?.value || 'rdv',
      priority: $('gpEfPriority')?.value || 'normale',
      date: $('gpEfDate')?.value || todayKey(),
      time: $('gpEfTime')?.value || '',
      lieu: $('gpEfLieu')?.value || '',
      note: $('gpEfNote')?.value || '',
      done: old?.done || false,
      createdAt: old?.createdAt
    });
    if(!ev) return;
    if(typeof window.closeEventForm==='function') window.closeEventForm();
    toast(existingId ? 'Événement modifié ✓' : 'Événement ajouté ✓');
  };

  const legacyDelete = window.deleteAgendaEventById;
  window.deleteAgendaEventById = function(id){
    if(legacyDelete && !window.GPAgenda?.forceModuleDelete){ try{ legacyDelete(id); return; }catch(e){ console.warn('deleteAgendaEventById legacy:', e); } }
    removeAgendaEvent(id);
  };

  function completeMission(id){
    const mission=db().employeeAgenda.find(m=>m.id===id);
    if(!mission) return toast('Mission introuvable','err');
    mission.status='termine'; mission.doneAt=new Date().toISOString(); mission.updatedAt=new Date().toISOString();
    save();
    if(typeof window.renderEmployeeAgenda==='function') window.renderEmployeeAgenda();
    if(typeof window.renderMissionDoneInbox==='function') window.renderMissionDoneInbox();
    toast('Mission marquée comme faite ✓');
  }


  let agendaViewDate = new Date();
  let agendaEditingId = null;

  function agendaEsc(v){ return esc(v); }
  function agendaTypeLabel(t){ return ({rdv:'Rendez-vous',tache:'Tâche',rappel:'Rappel',autre:'Autre'})[t] || 'Autre'; }
  function agendaPriorityLabel(p){ return ({haute:'Haute',normale:'Normale',basse:'Basse'})[p] || 'Normale'; }
  function agendaDateLabel(k){ try{return new Date(k+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'short'});}catch(e){return k||'—';} }
  function agendaPageCss(){
    if(document.getElementById('gp-agenda-compact-css')) return;
    const st=document.createElement('style'); st.id='gp-agenda-compact-css'; st.textContent=`
      .gpa-page{padding:12px 18px 22px}.gpa-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.gpa-title{display:flex;align-items:center;gap:9px}.gpa-title-icon{width:32px;height:32px;border-radius:9px;background:#fff7d6;color:#c79b18;display:flex;align-items:center;justify-content:center}.gpa-title h2{margin:0;font-size:16px}.gpa-title p{margin:2px 0 0;font-size:11px;color:#7b8190}.gpa-add{height:34px;padding:0 12px;border:0;border-radius:8px;background:#5630df;color:#fff;font-weight:800;font-size:11px;cursor:pointer}.gpa-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:10px}.gpa-stat{background:#fffef0;border:1px solid #eee8d5;border-radius:10px;padding:9px 12px}.gpa-stat b{display:block;font-size:18px;line-height:1.1}.gpa-stat span{font-size:10px;color:#7b8190}.gpa-toolbar{display:flex;gap:8px;align-items:center;background:#fffef5;border:1px solid #eee8d5;border-radius:10px;padding:8px;margin-bottom:10px}.gpa-search{flex:1;min-width:180px;height:32px;border:1px solid #e7e2d3;border-radius:8px;padding:0 10px;font-size:11px;background:#fff}.gpa-select{height:32px;border:1px solid #e7e2d3;border-radius:8px;padding:0 8px;font-size:11px;background:#fff}.gpa-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(300px,.75fr);gap:10px}.gpa-panel{background:#fffef5;border:1px solid #eee8d5;border-radius:10px;overflow:hidden}.gpa-panel-head{padding:9px 11px;border-bottom:1px solid #eee8d5;display:flex;align-items:center;justify-content:space-between}.gpa-panel-head b{font-size:12px}.gpa-list{padding:6px}.gpa-event{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px;border-bottom:1px solid #f1ede2}.gpa-event:last-child{border-bottom:0}.gpa-date{font-size:10px;font-weight:800;color:#8a6400}.gpa-event-title{font-size:11px;font-weight:800}.gpa-event-meta{font-size:10px;color:#7b8190;margin-top:2px}.gpa-actions{display:flex;gap:4px}.gpa-icon{width:26px;height:26px;border:1px solid #e6e1d5;border-radius:7px;background:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.gpa-icon .material-symbols-rounded{font-size:15px}.gpa-empty{padding:28px 10px;text-align:center;color:#8b91a0;font-size:11px}.gpa-cal-head{display:flex;align-items:center;justify-content:space-between;padding:8px 10px}.gpa-cal-head b{font-size:12px}.gpa-cal-nav{width:26px;height:26px;border:1px solid #e6e1d5;background:#fff;border-radius:7px;cursor:pointer}.gpa-week,.gpa-days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;padding:0 7px 7px}.gpa-week span{text-align:center;font-size:9px;font-weight:800;color:#8b91a0;padding:4px 0}.gpa-day{min-height:38px;border:1px solid #eee8d5;border-radius:6px;background:#fff;padding:4px;cursor:pointer;font-size:10px}.gpa-day.muted{opacity:.35}.gpa-day.today{border-color:#d4af37;background:#fff9d8}.gpa-day.sel{box-shadow:inset 0 0 0 1.5px #5630df}.gpa-day strong{display:block}.gpa-dots{font-size:8px;color:#5630df;white-space:nowrap;overflow:hidden}.gpa-day-events{border-top:1px solid #eee8d5;padding:8px 10px}.gpa-day-events b{font-size:10px}.gpa-modal-back{position:fixed;inset:0;background:rgba(15,23,42,.35);z-index:10050;display:flex;align-items:flex-start;justify-content:flex-end}.gpa-modal{width:min(430px,96vw);height:100%;background:#fff;box-shadow:-15px 0 40px rgba(15,23,42,.15);padding:16px;overflow:auto}.gpa-modal h3{margin:0;font-size:15px}.gpa-field{margin-top:10px}.gpa-field label{display:block;font-size:10px;font-weight:800;margin-bottom:4px;color:#475569}.gpa-field input,.gpa-field select,.gpa-field textarea{width:100%;box-sizing:border-box;border:1px solid #dfe4ea;border-radius:8px;padding:8px;font-size:11px}.gpa-form-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:14px;padding-top:10px;border-top:1px solid #eef1f4}.gpa-btn{height:32px;padding:0 11px;border:1px solid #e1e5ea;border-radius:8px;background:#fff;font-size:11px;font-weight:800;cursor:pointer}.gpa-btn.primary{background:#5630df;color:#fff;border-color:#5630df}@media(max-width:800px){.gpa-grid{grid-template-columns:1fr}.gpa-stats{grid-template-columns:1fr}.gpa-toolbar{flex-wrap:wrap}}
    `; document.head.appendChild(st);
  }

  function openAgendaEventForm(id){
    const d=db(); const old=id ? d.agenda.find(x=>x.id===id) : null; agendaEditingId=old?.id||null;
    const root=document.createElement('div'); root.id='gpaEventModal'; root.className='gpa-modal-back';
    root.innerHTML='<div class="gpa-modal"><div style="display:flex;justify-content:space-between;align-items:center"><div><h3>'+(old?'Modifier l’événement':'Nouvel événement')+'</h3><small style="color:#8b91a0">Agenda</small></div><button class="gpa-icon" type="button" onclick="closeAgendaEventForm()"><span class="material-symbols-rounded">close</span></button></div>'+
      '<div class="gpa-field"><label>Titre *</label><input id="gpaTitle" value="'+agendaEsc(old?.title||'')+'"></div>'+
      '<div class="gpa-field"><label>Type</label><select id="gpaType"><option value="rdv">Rendez-vous</option><option value="tache">Tâche</option><option value="rappel">Rappel</option><option value="autre">Autre</option></select></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="gpa-field"><label>Date *</label><input id="gpaDate" type="date" value="'+agendaEsc(old?.date||todayKey())+'"></div><div class="gpa-field"><label>Heure</label><input id="gpaTime" type="time" value="'+agendaEsc(old?.time||'')+'"></div></div>'+
      '<div class="gpa-field"><label>Priorité</label><select id="gpaPriority"><option value="normale">Normale</option><option value="haute">Haute</option><option value="basse">Basse</option></select></div>'+
      '<div class="gpa-field"><label>Lieu</label><input id="gpaLieu" value="'+agendaEsc(old?.lieu||'')+'"></div>'+
      '<div class="gpa-field"><label>Note</label><textarea id="gpaNote" rows="4">'+agendaEsc(old?.note||'')+'</textarea></div>'+
      '<div class="gpa-form-actions"><button class="gpa-btn" type="button" onclick="closeAgendaEventForm()">Annuler</button><button class="gpa-btn primary" type="button" onclick="saveCompactAgendaEvent()">Enregistrer</button></div></div>';
    document.body.appendChild(root);
    document.getElementById('gpaType').value=old?.type||'rdv'; document.getElementById('gpaPriority').value=old?.priority||'normale';
    root.addEventListener('click',e=>{if(e.target===root)closeAgendaEventForm();});
  }
  function closeAgendaEventForm(){document.getElementById('gpaEventModal')?.remove();agendaEditingId=null;}
  function saveCompactAgendaEvent(){
    const ev=upsertAgendaEvent({id:agendaEditingId||undefined,title:document.getElementById('gpaTitle')?.value||'',type:document.getElementById('gpaType')?.value||'rdv',date:document.getElementById('gpaDate')?.value||'',time:document.getElementById('gpaTime')?.value||'',priority:document.getElementById('gpaPriority')?.value||'normale',lieu:document.getElementById('gpaLieu')?.value||'',note:document.getElementById('gpaNote')?.value||''});
    if(ev) closeAgendaEventForm();
  }
  function toggleAgendaDone(id){ const d=db(),e=d.agenda.find(x=>x.id===id); if(!e)return; e.done=!e.done; save(); renderAgenda(); }
  function agendaMonthGrid(){
    const y=agendaViewDate.getFullYear(),m=agendaViewDate.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),start=(first.getDay()+6)%7, today=todayKey();
    const names=['L','M','M','J','V','S','D']; let html='<div class="gpa-week">'+names.map(x=>'<span>'+x+'</span>').join('')+'</div><div class="gpa-days">';
    for(let i=0;i<start;i++) html+='<div class="gpa-day muted"></div>';
    for(let day=1;day<=last.getDate();day++){
      const key=y+'-'+String(m+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
      const count=db().agenda.filter(e=>e.date===key).length; const cls='gpa-day '+(key===today?'today ':'')+(key===window.__gpaSelectedDay?'sel':'');
      html+='<div class="'+cls+'" onclick="window.__gpaSelectedDay=\''+key+'\';renderAgenda()"><strong>'+day+'</strong>'+(count?'<div class="gpa-dots">'+count+' événement'+(count>1?'s':'')+'</div>':'')+'</div>';
    }
    return html+'</div>';
  }

  window.openAgendaEventForm=openAgendaEventForm;
  window.closeAgendaEventForm=closeAgendaEventForm;
  window.saveCompactAgendaEvent=saveCompactAgendaEvent;
  window.gpaPrevMonth=function(){agendaViewDate.setMonth(agendaViewDate.getMonth()-1);renderAgenda();};
  window.gpaNextMonth=function(){agendaViewDate.setMonth(agendaViewDate.getMonth()+1);renderAgenda();};
  window.gpaEdit=function(id){openAgendaEventForm(id);};
  window.gpaDelete=function(id){if(confirm('Supprimer cet événement ?')){removeAgendaEvent(id);renderAgenda();}};
  window.gpaDone=toggleAgendaDone;

  window.renderAgenda = function(){
    agendaPageCss();
    const page=$('page-agenda'),mount=$('agendaPageMount'); if(!page||!mount)return;
    const d=db(), all=[...d.agenda].sort((a,b)=>String(a.date+a.time).localeCompare(String(b.date+b.time)));
    const q=(document.getElementById('gpaSearch')?.value||'').toLowerCase().trim();
    const type=document.getElementById('gpaTypeFilter')?.value||''; const status=document.getElementById('gpaStatusFilter')?.value||'';
    const filtered=all.filter(e=>(!q||[e.title,e.lieu,e.note].join(' ').toLowerCase().includes(q))&&(!type||e.type===type)&&(!status||(status==='done'?e.done:!e.done)));
    const active=all.filter(e=>!e.done).length, today=all.filter(e=>!e.done&&e.date===todayKey()).length, tomorrowKey=(()=>{const x=new Date();x.setDate(x.getDate()+1);return x.toISOString().slice(0,10)})(), tomorrow=all.filter(e=>!e.done&&e.date===tomorrowKey).length;
    const selected=window.__gpaSelectedDay||todayKey(); const dayEvents=all.filter(e=>e.date===selected);
    mount.innerHTML='<div class="gpa-page"><div class="gpa-head"><div class="gpa-title"><div class="gpa-title-icon"><span class="material-symbols-rounded">calendar_month</span></div><div><h2>Agenda</h2><p>Organisez vos rendez-vous et événements</p></div></div><button class="gpa-add" onclick="openAgendaEventForm()"><span class="material-symbols-rounded" style="font-size:14px;vertical-align:-3px">add</span> Nouvel événement</button></div>'+
      '<div class="gpa-stats"><div class="gpa-stat"><b>'+all.length+'</b><span>Événements</span></div><div class="gpa-stat"><b>'+active+'</b><span>À venir</span></div><div class="gpa-stat"><b>'+today+'</b><span>Aujourd’hui</span></div></div>'+ 
      '<div class="gpa-toolbar"><input id="gpaSearch" class="gpa-search" placeholder="Rechercher un événement…" value="'+agendaEsc(q)+'" oninput="renderAgenda()"><select id="gpaTypeFilter" class="gpa-select" onchange="renderAgenda()"><option value="">Tous les types</option><option value="rdv" '+(type==='rdv'?'selected':'')+'>Rendez-vous</option><option value="tache" '+(type==='tache'?'selected':'')+'>Tâche</option><option value="rappel" '+(type==='rappel'?'selected':'')+'>Rappel</option><option value="autre" '+(type==='autre'?'selected':'')+'>Autre</option></select><select id="gpaStatusFilter" class="gpa-select" onchange="renderAgenda()"><option value="">Tous</option><option value="open" '+(status==='open'?'selected':'')+'>À venir</option><option value="done" '+(status==='done'?'selected':'')+'>Terminés</option></select></div>'+ 
      '<div class="gpa-grid"><section class="gpa-panel"><div class="gpa-panel-head"><b>Prochains événements</b><span style="font-size:10px;color:#8b91a0">'+filtered.length+' résultat'+(filtered.length>1?'s':'')+'</span></div><div class="gpa-list">'+(filtered.length?filtered.slice(0,30).map(e=>'<div class="gpa-event"><div class="gpa-date">'+agendaDateLabel(e.date)+(e.time?' · '+agendaEsc(e.time):'')+'</div><div><div class="gpa-event-title">'+agendaEsc(e.title)+'</div><div class="gpa-event-meta">'+agendaTypeLabel(e.type)+(e.lieu?' · '+agendaEsc(e.lieu):'')+(e.done?' · Terminé':'')+'</div></div><div class="gpa-actions"><button class="gpa-icon" title="Terminer" onclick="gpaDone(\''+agendaEsc(e.id)+'\')"><span class="material-symbols-rounded">'+(e.done?'undo':'check')+'</span></button><button class="gpa-icon" title="Modifier" onclick="gpaEdit(\''+agendaEsc(e.id)+'\')"><span class="material-symbols-rounded">edit</span></button><button class="gpa-icon" title="Supprimer" onclick="gpaDelete(\''+agendaEsc(e.id)+'\')"><span class="material-symbols-rounded">delete</span></button></div></div>').join(''):'<div class="gpa-empty">Aucun événement trouvé.</div>')+'</div></section>'+ 
      '<section class="gpa-panel"><div class="gpa-cal-head"><button class="gpa-cal-nav" onclick="gpaPrevMonth()"><span class="material-symbols-rounded" style="font-size:15px">chevron_left</span></button><b>'+agendaEsc(agendaViewDate.toLocaleDateString('fr-FR',{month:'long',year:'numeric'}))+'</b><button class="gpa-cal-nav" onclick="gpaNextMonth()"><span class="material-symbols-rounded" style="font-size:15px">chevron_right</span></button></div>'+agendaMonthGrid()+'<div class="gpa-day-events"><b>'+agendaDateLabel(selected)+'</b>'+(dayEvents.length?'<div style="margin-top:6px">'+dayEvents.map(e=>'<div style="font-size:10px;padding:4px 0">'+(e.time?'<b>'+agendaEsc(e.time)+'</b> ':'')+agendaEsc(e.title)+'</div>').join('')+'</div>':'<div style="font-size:10px;color:#8b91a0;margin-top:4px">Aucun événement ce jour.</div>')+'</div></section></div></div>';
  };

  window.GPAgenda={
    version:'16.0.0',
    db,
    validateAgendaEvent,
    validateEmployeeMission,
    upsertAgendaEvent,
    removeAgendaEvent,
    completeMission,
    getAgendaStats,
    forceModuleDelete:false
  };

  document.addEventListener('DOMContentLoaded', () => {
    db();
    // Enregistrement auprès du routeur moderne pour la page 'agenda'
    if (window.GPNavigation && typeof window.GPNavigation.registerRenderer === 'function') {
      window.GPNavigation.registerRenderer('agenda', function() {
        if (typeof window.renderAgenda === 'function') window.renderAgenda();
      });
    }
    // [cleaned] debug console statement removed
  });
})();
