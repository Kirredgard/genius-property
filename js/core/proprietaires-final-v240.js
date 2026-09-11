/* Genius Property V24.0 — Propriétaires: single authoritative CRUD controller.
   No legacy form IDs are used for create/edit/delete. Local persistence is
   committed first, then Supabase is pushed. A failed cloud push never rolls
   back a successful local write.
*/
(function(){
  'use strict';
  var KEY='proprietaires';
  var LS_KEY='geniusproperty_db_clean_v1';
  var DIRTY_KEY='gp_data_dirty_at';

  function clone(v){ try{return JSON.parse(JSON.stringify(v));}catch(e){return v;} }
  function db(){
    try{ if(window.GPDB && GPDB.load) return GPDB.load(); }catch(e){}
    try{return JSON.parse(localStorage.getItem(LS_KEY)||'{}');}catch(e){return window.DB||{};}
  }
  function toast(m,t){try{if(window.toast)window.toast(m,t||'ok');}catch(e){} }
  function uid(){
    if(window.GP&&typeof GP.uid==='function') return GP.uid('PR');
    return 'PR-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
  }
  function val(id){var e=document.getElementById(id);return e?String(e.value==null?'':e.value).trim():'';}
  function valid(p){
    if(!p.nom) return 'Le nom du propriétaire est requis';
    if(!p.tel) return 'Le téléphone est requis';
    if(!p.email) return "L'email est requis";
    if(!/^[0-9+\s()\-.]{8,25}$/.test(p.tel)) return 'Numéro de téléphone invalide';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return 'Adresse email invalide';
    return null;
  }
  function markDirty(){
    try{localStorage.setItem(DIRTY_KEY,new Date().toISOString());}catch(e){}
  }
  function commitLocal(data){
    data=clone(data||{}); data.meta=data.meta||{}; data.meta.updatedAt=new Date().toISOString();
    markDirty();
    // GPDB.save is the only local/cloud persistence pipeline. Do not write the
    // raw localStorage keys here: doing so bypasses revisions and creates races.
    if(window.GPDB && typeof window.GPDB.save==='function'){
      var ok=window.GPDB.save(data,{skipLicenseGuard:true,skipCloud:true});
      return ok ? window.GPDB.load() : window.GPDB.load();
    }
    if(window.DB && typeof window.DB==='object'){
      Object.keys(window.DB).forEach(function(k){delete window.DB[k];});
      Object.assign(window.DB,data);
    }else window.DB=data;
    try{window.dispatchEvent(new CustomEvent('gp:db:saved',{detail:{db:data}}));}catch(e){}
    return data;
  }
  async function pushCloud(data){
    if(!window.GPSupabase || !GPSupabase.available || !GPSupabase.available()) return {ok:false,skipped:true};
    if(!GPSupabase.currentUid || !GPSupabase.currentUid()) return {ok:false,skipped:true};
    await GPSupabase.push(window.GPDB && window.GPDB.load ? window.GPDB.load() : data);
    return {ok:true};
  }
  async function saveAndSync(data,successText){
    commitLocal(data);
    try{
      var c=await pushCloud(data);
      if(c.ok){ try{localStorage.removeItem(DIRTY_KEY);}catch(e){}; toast(successText+' et synchronisé ✓','ok'); }
      else if(c.skipped) toast(successText+' localement ✓','ok');
      return true;
    }catch(e){
      console.error('[GP V24] Supabase CRUD:',e);
      toast(successText+' localement ✓ — synchronisation Supabase en attente','warn');
      return true;
    }
  }
  function render(){
    try{window.DB=db();}catch(e){}
    try{if(window.renderProprietairesModern)window.renderProprietairesModern();}catch(e){}
    try{if(window.renderProprietairesCards)window.renderProprietairesCards();}catch(e){}
    try{if(window.updateSidebarBadges)window.updateSidebarBadges();}catch(e){}
  }

  async function readPhoto(id){
    var input=document.getElementById(id), file=input&&input.files&&input.files[0];
    if(!file)return '';
    return await new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(e){resolve(e.target.result||'');};r.onerror=reject;r.readAsDataURL(file);});
  }

  async function createFromDrawer(){
    var btn=document.getElementById('nvp-save-btn');
    if(btn && btn.dataset.gpSaving==='1') return false;
    var p={
      id:uid(), prenom:val('nvp-prenom'), nom:val('nvp-nom'),
      naiss:val('nvp-naiss'), matri:val('nvp-matri'), tel:val('nvp-tel'),
      email:val('nvp-email'), adresse:val('nvp-adresse'), photo:await readPhoto('nvp-photo-input'),
      createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()
    };
    var err=valid(p); if(err){toast(err,'err');return false;}
    if(btn){btn.dataset.gpSaving='1';btn.disabled=true;btn.textContent='Enregistrement…';}
    try{
      var data=db(); if(!Array.isArray(data[KEY]))data[KEY]=[];
      data[KEY].push(p);
      await saveAndSync(data,'Propriétaire enregistré');
      render();
      if(window.closeNouvelProprietaireDrawer)window.closeNouvelProprietaireDrawer();
      return true;
    }catch(e){console.error('[GP V24] create owner',e);toast('Enregistrement impossible : '+(e.message||e),'err');return false;}
    finally{if(btn){btn.dataset.gpSaving='0';btn.disabled=false;btn.textContent='Enregistrer';}}
  }

  function ensureEditDrawer(p,idx){
    var ov=document.getElementById('gpOwnerEditOverlay'), dr=document.getElementById('gpOwnerEditDrawer');
    if(ov)ov.remove(); if(dr)dr.remove();
    var esc=function(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
    var html='<div id="gpOwnerEditOverlay" style="position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:1600"></div>'+
      '<div id="gpOwnerEditDrawer" style="position:fixed;top:0;right:0;width:520px;max-width:100vw;height:100vh;background:#fff;z-index:1601;box-shadow:-8px 0 32px rgba(0,0,0,.18);display:flex;flex-direction:column">'+
      '<div style="padding:20px 24px;border-bottom:1px solid #eee;display:flex;justify-content:space-between"><div><b style="font-size:19px">Modifier le propriétaire</b><div style="font-size:12px;color:#6b7280">'+esc([p.prenom,p.nom].filter(Boolean).join(' '))+'</div></div><button id="gpOwnerEditClose" style="border:0;background:#f3f4f6;border-radius:8px;width:34px;height:34px">×</button></div>'+
      '<div style="padding:22px;overflow:auto;flex:1"><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'+
      field('Prénom','gp-owner-prenom',p.prenom,false,esc)+field('Nom','gp-owner-nom',p.nom,true,esc)+
      field('Date de naissance','gp-owner-naiss',p.naiss,false,esc,'date')+field('Situation matrimoniale','gp-owner-matri',p.matri,false,esc)+
      field('Téléphone','gp-owner-tel',p.tel,true,esc)+field('Email','gp-owner-email',p.email,true,esc)+
      '<div style="grid-column:1/-1">'+field('Adresse','gp-owner-adresse',p.adresse,false,esc)+'</div>'+
      '</div></div><div style="padding:16px 22px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:8px"><button id="gpOwnerEditCancel">Annuler</button><button id="gpOwnerEditSave" style="background:#d4af37;border:0;border-radius:8px;padding:10px 18px;font-weight:700">Enregistrer</button></div></div>';
    document.body.insertAdjacentHTML('beforeend',html);
    document.getElementById('gpOwnerEditOverlay').onclick=closeEdit;
    document.getElementById('gpOwnerEditClose').onclick=closeEdit;
    document.getElementById('gpOwnerEditCancel').onclick=closeEdit;
    document.getElementById('gpOwnerEditSave').onclick=function(){saveEdit(idx);};
  }
  function field(label,id,value,required,esc,type){return '<label style="display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:700;color:#374151">'+label+(required?' *':'')+'<input id="'+id+'" type="'+(type||'text')+'" value="'+esc(value||'')+'" style="height:40px;border:1px solid #e5e7eb;border-radius:8px;padding:0 11px"></label>';}
  function closeEdit(){var a=document.getElementById('gpOwnerEditOverlay'),b=document.getElementById('gpOwnerEditDrawer');if(a)a.remove();if(b)b.remove();}
  async function saveEdit(idx){
    var data=db(), list=Array.isArray(data[KEY])?data[KEY]:[], p=list[idx]; if(!p)return;
    var n={...p,prenom:val('gp-owner-prenom'),nom:val('gp-owner-nom'),naiss:val('gp-owner-naiss'),matri:val('gp-owner-matri'),tel:val('gp-owner-tel'),email:val('gp-owner-email'),adresse:val('gp-owner-adresse'),updatedAt:new Date().toISOString()};
    var err=valid(n);if(err){toast(err,'err');return;}
    var btn=document.getElementById('gpOwnerEditSave');if(btn){btn.disabled=true;btn.textContent='Enregistrement…';}
    list[idx]=n; data[KEY]=list;
    await saveAndSync(data,'Modification enregistrée');
    render();closeEdit();
  }
  async function deleteOwner(idx){
    var data=db(),list=Array.isArray(data[KEY])?data[KEY]:[],p=list[idx];if(!p)return false;
    var name=[p.prenom,p.nom].filter(Boolean).join(' ')||'ce propriétaire';
    if(!window.confirm('Supprimer '+name+' ?'))return false;
    var id=p.id;data[KEY]=id?list.filter(function(x){return String(x&&x.id)!==String(id);}):list.filter(function(_,i){return i!==idx;});
    await saveAndSync(data,'Propriétaire supprimé');render();return true;
  }
  function editRow(key,idx){if(key==='proprietaires'){var list=db()[KEY]||[],p=list[idx];if(p)ensureEditDrawer(p,idx);return true;}return false;}

  window.saveProprietaireFromDrawer=createFromDrawer;
  window.saveProprietaire=function(source){
    // Legacy page compatibility: map p-* source into the authoritative drawer fields and create directly.
    if(source){['prenom','nom','naiss','matri','tel','email','adresse'].forEach(function(f){var el=document.getElementById('nvp-'+f);if(el&&source['p-'+f]!=null)el.value=source['p-'+f];});}
    return createFromDrawer();
  };
  window.editRow=(function(old){return function(key,idx){if(key==='proprietaires')return editRow(key,idx);return old?old.apply(this,arguments):false;};})(window.editRow);
  window.delRow=(function(old){return async function(key,idx){if(key==='proprietaires')return deleteOwner(idx);return old?old.apply(this,arguments):false;};})(window.delRow);
  window.GPProprietairesCRUD={create:createFromDrawer,edit:function(_,idx){var p=(db()[KEY]||[])[idx];if(p)ensureEditDrawer(p,idx);},del:deleteOwner};
  window.addEventListener('load',function(){setTimeout(render,50);});
})();
