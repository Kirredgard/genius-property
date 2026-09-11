/* Genius Property V21 — Fallback renderers
   Évite les pages blanches quand des renderers legacy ont été retirés au nettoyage.
   Ces fonctions restent sobres et n'écrasent pas les renderers métier déjà présents. */
(function(){
  'use strict';

  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function getArray(name){
    try {
      if (window.GPDB && typeof window.GPDB.getAll === 'function') {
        const data = window.GPDB.getAll(name);
        if (Array.isArray(data)) return data;
      }
    } catch(_) {}
    try {
      const raw = localStorage.getItem('gp_' + name) || localStorage.getItem(name);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch(_) { return []; }
  }

  function initials(item){
    const first = item.prenom || item.firstName || item.firstname || '';
    const last = item.nom || item.name || item.lastName || item.lastname || '';
    const txt = (first + ' ' + last).trim() || item.email || 'GP';
    return txt.split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join('').toUpperCase() || 'GP';
  }

  function employeeName(item){
    return [item.prenom || item.firstName || '', item.nom || item.name || item.lastName || ''].join(' ').trim() || item.email || 'Employé';
  }

  function emptyState(title, text, actionHtml){
    return `<div class="gp-empty-state" style="min-height:280px;display:flex;align-items:center;justify-content:center;padding:24px">
      <div style="max-width:520px;text-align:center;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:28px;box-shadow:0 12px 30px rgba(15,23,42,.06)">
        <div style="width:54px;height:54px;border-radius:16px;background:#fff7d6;color:#b88900;display:flex;align-items:center;justify-content:center;margin:0 auto 14px">
          <span class="material-symbols-rounded">info</span>
        </div>
        <h3 style="margin:0 0 8px;font-size:18px;color:#111827">${esc(title)}</h3>
        <p style="margin:0 0 16px;color:#6b7280;font-size:13px;line-height:1.5">${esc(text)}</p>
        ${actionHtml || ''}
      </div>
    </div>`;
  }

  window.renderEmployesModern ||= function(){
    const mount = document.getElementById('gpEmployesModern') || document.getElementById('page-employes');
    if(!mount) return null;
    const employees = getArray('employes').concat(getArray('employees')).filter((v,i,a) => v && a.findIndex(x => (x.id||x.email||JSON.stringify(x)) === (v.id||v.email||JSON.stringify(v))) === i);
    if(!employees.length){
      mount.innerHTML = emptyState('Aucun employé pour le moment', 'Ajoutez votre premier employé pour gérer les accès, rôles et missions.', '<button class="btn btn-primary" data-gp-nav="nv-employe"><span class="material-symbols-rounded" style="font-size:16px">person_add</span> Ajouter un employé</button>');
      return mount;
    }
    mount.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px">
        <div><h2 style="margin:0;font-size:20px;color:#111827">Équipe & Employés</h2><p style="margin:4px 0 0;color:#6b7280;font-size:13px">${employees.length} employé(s) enregistré(s)</p></div>
        <button class="btn btn-primary" data-gp-nav="nv-employe"><span class="material-symbols-rounded" style="font-size:16px">person_add</span> Ajouter</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">
        ${employees.map(e => `<article style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px;box-shadow:0 10px 24px rgba(15,23,42,.05)">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#d4af37,#f7d774);display:flex;align-items:center;justify-content:center;font-weight:900;color:#111">${esc(initials(e))}</div>
            <div style="min-width:0"><div style="font-weight:800;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(employeeName(e))}</div><div style="font-size:12px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.fonction || e.role || 'Employé')}</div></div>
          </div>
          <div style="margin-top:12px;font-size:12px;color:#4b5563;display:grid;gap:5px">
            <span>${esc(e.email || 'Email non renseigné')}</span><span>${esc(e.tel || e.phone || 'Téléphone non renseigné')}</span>
          </div>
        </article>`).join('')}
      </div>`;
    return mount;
  };

  window.renderEmployeeAgenda ||= function(){
    const employees = getArray('employes').concat(getArray('employees')).filter(Boolean);
    const list = document.getElementById('empAgendaEmployeeList');
    const name = document.getElementById('empAgendaName');
    const role = document.getElementById('empAgendaRole');
    const avatar = document.getElementById('empAgendaAvatar');
    const missions = document.getElementById('empAgendaMissions');
    const month = document.getElementById('empAgendaMonthLabel');
    const weekdays = document.getElementById('empAgendaWeekdays');
    const grid = document.getElementById('empAgendaGrid');
    const dayTitle = document.getElementById('empAgendaDayTitle');
    const dayDate = document.getElementById('empAgendaDayDate');
    const search = (document.getElementById('empAgendaSearch')?.value || '').toLowerCase();
    const filtered = employees.filter(e => employeeName(e).toLowerCase().includes(search) || String(e.email||'').toLowerCase().includes(search));
    if(list){
      list.innerHTML = filtered.length ? filtered.map((e,idx) => `<button type="button" class="emp-agenda-employee-item ${idx===0?'active':''}" style="width:100%;display:flex;align-items:center;gap:10px;text-align:left;border:1px solid #e5e7eb;background:#fff;border-radius:12px;padding:10px;margin-bottom:8px;cursor:pointer" onclick="window.GP_SELECTED_EMPLOYEE=${idx}; renderEmployeeAgenda();">
        <span style="width:34px;height:34px;border-radius:10px;background:#fff7d6;color:#b88900;display:flex;align-items:center;justify-content:center;font-weight:900">${esc(initials(e))}</span>
        <span style="min-width:0"><b style="display:block;font-size:13px;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(employeeName(e))}</b><small style="color:#6b7280">${esc(e.fonction || e.role || 'Employé')}</small></span>
      </button>`).join('') : `<div style="padding:18px;text-align:center;color:#6b7280;font-size:13px">Aucun employé trouvé.</div>`;
    }
    const selected = filtered[window.GP_SELECTED_EMPLOYEE || 0] || filtered[0];
    if(selected){
      if(name) name.textContent = employeeName(selected);
      if(role) role.textContent = selected.fonction || selected.role || 'Employé';
      if(avatar) avatar.textContent = initials(selected);
    } else {
      if(name) name.textContent = 'Aucun employé';
      if(role) role.textContent = 'Ajoutez un employé pour planifier des missions';
      if(avatar) avatar.textContent = '--';
    }
    const now = new Date();
    if(month) month.textContent = now.toLocaleDateString('fr-FR', { month:'long', year:'numeric' });
    if(weekdays) weekdays.innerHTML = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => `<div style="font-size:11px;color:#6b7280;text-align:center;font-weight:700">${d}</div>`).join('');
    if(grid){
      const days = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
      grid.innerHTML = Array.from({length:days}, (_,i) => `<button type="button" style="min-height:34px;border:1px solid #eef2f7;background:${i+1===now.getDate()?'#fff7d6':'#fff'};border-radius:9px;font-size:12px;color:#111827">${i+1}</button>`).join('');
    }
    if(dayTitle) dayTitle.textContent = 'Missions du jour';
    if(dayDate) dayDate.textContent = now.toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' });
    if(missions) missions.innerHTML = `<div style="padding:18px;text-align:center;color:#6b7280;font-size:13px">Aucune mission planifiée aujourd'hui.</div>`;
    if(typeof window.renderMissionDoneInbox === 'function') window.renderMissionDoneInbox();
  };

  window.renderMissionDoneInbox ||= function(){
    const box = document.getElementById('missionDoneList');
    const count = document.getElementById('missionDoneCount');
    if(count){ count.style.display = 'none'; count.textContent = ''; }
    if(box) box.innerHTML = `<div style="margin-top:10px;border-top:1px solid #eef2f7;padding-top:10px;color:#6b7280;font-size:12px;text-align:center">Aucune mission terminée à valider.</div>`;
  };

  function renderSettings(){
    const mount = document.getElementById('page-parametres') || document.querySelector('.page.active');
    if(!mount) return null;
    mount.innerHTML = `<div style="padding:24px"><div style="background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:22px;box-shadow:0 12px 30px rgba(15,23,42,.05)">
      <h2 style="margin:0 0 8px;color:#111827">Paramètres</h2>
      <p style="margin:0 0 18px;color:#6b7280;font-size:13px">Configuration de votre compte et de la plateforme.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
        <div style="border:1px solid #eef2f7;border-radius:14px;padding:14px"><b>Profil</b><p style="margin:6px 0 0;color:#6b7280;font-size:12px">Nom, email et préférences.</p></div>
        <div style="border:1px solid #eef2f7;border-radius:14px;padding:14px"><b>Sécurité</b><p style="margin:6px 0 0;color:#6b7280;font-size:12px">Accès et permissions.</p></div>
        <div style="border:1px solid #eef2f7;border-radius:14px;padding:14px"><b>Entreprise</b><p style="margin:6px 0 0;color:#6b7280;font-size:12px">Informations de l'agence.</p></div>
      </div>
    </div></div>`;
    return mount;
  }
  window.renderParametres ||= renderSettings;
  window.renderParameters ||= renderSettings;

  window.renderTable ||= function(kind){
    const page = document.getElementById('page-' + kind) || document.querySelector('.page.active');
    if(!page) return null;
    const labels = {employes:'Employés', proprietaires:'Propriétaires', locataires:'Locataires', biens:'Biens', locatives:'Locations', contrats:'Contrats', paiements:'Paiements', depenses:'Dépenses'};
    page.innerHTML = `<div style="padding:24px">${emptyState(labels[kind] || 'Section', 'Aucune donnée disponible pour le moment.', '')}</div>`;
    return page;
  };
})();
