/* Genius Property — Multi-agences
   - Affiche l'agence courante dans la barre du haut.
   - Super administrateur : panneau « Agences » (créer, entrer dans une agence, suspendre).
   L'isolation des données est faite côté Supabase (RLS + fonctions) : ce fichier
   ne fait que de l'interface. */
(function(){
  'use strict';

  var CACHE_KEYS = [
    'geniusproperty_db_clean_v1','geniusproperty_db_authoritative_v1',
    'geniusproperty_last_backup_snapshot','geniusproperty_last_backup_date',
    'gpdb_local_revision','gp_data_dirty_at'
  ];

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function user(){ return window.currentUser || null; }
  function isSuper(){ var u = user(); return !!(u && u.isSuperAdmin); }
  function toast(msg, type){ if(window.toast) window.toast(msg, type); else alert(msg); }
  async function sb(){ return window.GPSupabase.ready(); }

  function clearLocalCache(){
    try {
      CACHE_KEYS.forEach(function(k){ localStorage.removeItem(k); });
      for(var i = localStorage.length - 1; i >= 0; i--){
        var k = localStorage.key(i);
        if(k && k.indexOf('geniusproperty_backup_') === 0) localStorage.removeItem(k);
      }
    } catch(_) {}
  }

  /* ---------- API ---------- */
  async function list(){
    var c = await sb();
    var r = await c.from('gp_agencies').select('id,name,slug,is_active,created_at').order('created_at',{ascending:true});
    if(r.error) throw r.error;
    return r.data || [];
  }

  async function create(name){
    name = String(name || '').trim();
    if(!name) throw new Error('Le nom de l’agence est obligatoire.');
    var slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
                 .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    var c = await sb();
    var r = await c.rpc('gp_create_agency', {p_name: name, p_slug: slug || null});
    if(r.error) throw r.error;
    return r.data;
  }

  async function setActive(id, active){
    var c = await sb();
    var r = await c.rpc('gp_set_agency_active', {p_agency: id, p_active: !!active});
    if(r.error) throw r.error;
  }

  async function switchTo(id){
    var u = user();
    if(u && id === u.agencyId) return;
    var dirty = false;
    try { dirty = !!localStorage.getItem('gp_data_dirty_at'); } catch(_) {}
    if(dirty && !confirm('Des modifications ne sont pas encore synchronisées et seront perdues en changeant d’agence. Continuer ?')) return;

    var c = await sb();
    var r = await c.rpc('gp_switch_agency', {p_agency: id});
    if(r.error) throw r.error;

    // Les données en cache appartiennent à l'ancienne agence : on les remplace.
    clearLocalCache();
    try { await window.GPSupabase.pull({applyToLocal: true}); } catch(e) { console.warn('[GPAgencies] pull:', e && e.message || e); }
    location.reload();
  }

  /* ---------- Badge agence dans la barre du haut ---------- */
  function paintBadge(){
    var u = user();
    if(!u || !u.agencyName) return;
    var chip = document.getElementById('gpAgencyChip');
    if(!chip){
      var host = document.querySelector('.top-icons');
      if(!host) return;
      chip = document.createElement('div');
      chip.id = 'gpAgencyChip';
      chip.style.cssText = 'display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:rgba(212,175,55,.14);color:inherit;font:600 12px Inter,Arial,sans-serif;white-space:nowrap;margin-right:6px';
      var box = host.querySelector('.user-box');
      host.insertBefore(chip, box || null);
    }
    chip.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px">apartment</span>' + esc(u.agencyName);
    chip.style.cursor = isSuper() ? 'pointer' : 'default';
    chip.title = isSuper() ? 'Gérer les agences' : 'Votre agence';
    chip.onclick = isSuper() ? openPanel : null;
  }

  function paintRole(){
    if(!isSuper()) return;
    document.querySelectorAll('.user-role').forEach(function(el){ el.textContent = 'Super administrateur'; });
  }

  /* Entrée « Agences » dans le menu latéral (super admin uniquement) */
  function paintMenu(){
    var existing = document.getElementById('gpAgenciesMenu');
    if(!isSuper()){ if(existing) existing.remove(); return; }
    if(existing) return;
    var menu = document.getElementById('sideMenu');
    if(!menu) return;
    var li = document.createElement('li');
    li.id = 'gpAgenciesMenu';
    li.innerHTML = '<span class="material-symbols-rounded">apartment</span> Agences';
    li.onclick = openPanel;
    menu.appendChild(li);
  }

  /* ---------- Panneau de gestion ---------- */
  function closePanel(){ var m = document.getElementById('gpAgenciesModal'); if(m) m.remove(); }

  async function openPanel(){
    if(!isSuper()) return;
    closePanel();
    var wrap = document.createElement('div');
    wrap.id = 'gpAgenciesModal';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px';
    wrap.innerHTML =
      '<div style="background:var(--card,#fff);color:var(--text,#111);border-radius:16px;width:min(560px,100%);max-height:88vh;overflow:auto;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.35);font-family:Inter,Arial,sans-serif">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
          '<h3 style="margin:0;font-size:18px">Agences</h3>' +
          '<button id="gpAgClose" style="border:0;background:none;font-size:22px;cursor:pointer;color:inherit">×</button>' +
        '</div>' +
        '<div id="gpAgList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">Chargement…</div>' +
        '<div style="display:flex;gap:8px">' +
          '<input id="gpAgNew" placeholder="Nom de la nouvelle agence" style="flex:1;padding:10px 12px;border-radius:10px;border:1px solid rgba(128,128,128,.4);background:transparent;color:inherit">' +
          '<button id="gpAgAdd" style="padding:10px 16px;border:0;border-radius:10px;background:#D4AF37;color:#111;font-weight:700;cursor:pointer">Créer</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function(e){ if(e.target === wrap) closePanel(); });
    document.getElementById('gpAgClose').onclick = closePanel;
    document.getElementById('gpAgAdd').onclick = async function(){
      var input = document.getElementById('gpAgNew');
      try {
        await create(input.value);
        input.value = '';
        toast('Agence créée.');
        render();
      } catch(e){ toast(e.message || 'Création impossible.', 'err'); }
    };
    render();
  }

  async function render(){
    var box = document.getElementById('gpAgList');
    if(!box) return;
    try {
      var rows = await list();
      var current = user() && user().agencyId;
      box.innerHTML = rows.map(function(a){
        var isCur = a.id === current;
        return '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;border:1px solid rgba(128,128,128,.3);' + (a.is_active ? '' : 'opacity:.6;') + '">' +
          '<div style="flex:1;min-width:0"><div style="font-weight:700">' + esc(a.name) + (isCur ? ' <span style="font-size:11px;color:#D4AF37">• agence actuelle</span>' : '') + '</div>' +
          '<div style="font-size:12px;opacity:.7">' + (a.is_active ? 'Active' : 'Suspendue') + '</div></div>' +
          (isCur || !a.is_active ? '' : '<button data-ag-enter="' + esc(a.id) + '" style="padding:7px 12px;border-radius:9px;border:0;background:#111;color:#fff;cursor:pointer;font-weight:600">Entrer</button>') +
          (isCur ? '' : '<button data-ag-toggle="' + esc(a.id) + '" data-active="' + (a.is_active ? '1' : '0') + '" style="padding:7px 12px;border-radius:9px;border:1px solid rgba(128,128,128,.5);background:transparent;color:inherit;cursor:pointer">' + (a.is_active ? 'Suspendre' : 'Réactiver') + '</button>') +
        '</div>';
      }).join('') || 'Aucune agence.';
      box.querySelectorAll('[data-ag-enter]').forEach(function(b){
        b.onclick = async function(){
          try { await switchTo(b.getAttribute('data-ag-enter')); } catch(e){ toast(e.message || 'Changement impossible.', 'err'); }
        };
      });
      box.querySelectorAll('[data-ag-toggle]').forEach(function(b){
        b.onclick = async function(){
          var active = b.getAttribute('data-active') === '1';
          if(active && !confirm('Suspendre cette agence ? Ses utilisateurs ne pourront plus se connecter.')) return;
          try { await setActive(b.getAttribute('data-ag-toggle'), !active); render(); }
          catch(e){ toast(e.message || 'Action impossible.', 'err'); }
        };
      });
    } catch(e){
      box.textContent = 'Erreur : ' + (e && e.message || e);
    }
  }

  function paintAll(){ paintBadge(); paintMenu(); paintRole(); setTimeout(paintRole, 700); }

  window.GPAgencies = {
    list: list, create: create, setActive: setActive, switchTo: switchTo,
    openPanel: openPanel, current: function(){ var u = user(); return u ? {id:u.agencyId, name:u.agencyName} : null; },
    isSuperAdmin: isSuper
  };

  window.addEventListener('gp:auth-changed', function(){ setTimeout(paintAll, 200); });
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(paintAll, 800); });
})();
