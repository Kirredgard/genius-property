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


  window.renderAgenda = function(){
    const page = $('page-agenda');
    const mount = $('agendaPageMount');
    const modal = $('gpAgendaModal');

    // La page Agenda réutilise le rendu agenda existant, historiquement porté par la modale.
    // On garde la compatibilité avec les anciens boutons "Voir tout" et on évite un renderer orphelin.
    if(mount && modal && !mount.dataset.mounted){
      const box = modal.querySelector('.gp-agenda-modal-box');
      if(box){
        mount.appendChild(box);
        mount.dataset.mounted = '1';
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }
    }

    if(page) page.classList.add('agenda-page-ready');
    if(typeof window.gpAmRender === 'function') return window.gpAmRender();
    if(typeof window.openFullAgendaModal === 'function') return window.openFullAgendaModal();
    return null;
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
        if (typeof window.gpAmRender === 'function') window.gpAmRender();
        else if (typeof window.renderNewAgenda === 'function') window.renderNewAgenda();
      });
    }
    // [cleaned] debug console statement removed
  });
})();
