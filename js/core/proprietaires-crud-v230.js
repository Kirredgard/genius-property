/* Genius Property V23.0 — Propriétaires authoritative CRUD
   One authoritative path for create/edit/delete. Avoids legacy wrappers and
   keeps local persistence independent from cloud confirmation.
*/
(function(){
  'use strict';
  const KEY='proprietaires';
  const db=()=>window.GPDB&&GPDB.load?GPDB.load():(window.DB||{});
  const clone=o=>JSON.parse(JSON.stringify(o||{}));
  const toast=(m,t)=>{try{if(window.toast)window.toast(m,t||'info');}catch(e){}};
  const uid=()=>window.GP&&GP.uid?GP.uid('PR'):'PR_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  const full=p=>[p&&p.prenom,p&&p.nom].filter(Boolean).join(' ').trim()||'Propriétaire';
  function val(id){const e=document.getElementById(id);return e?String(e.value||'').trim():'';}
  function fieldsFromDrawer(){
    return {prenom:val('nvp-prenom'),nom:val('nvp-nom'),naiss:val('nvp-naiss'),matri:val('nvp-matri'),tel:val('nvp-tel'),email:val('nvp-email'),adresse:val('nvp-adresse')};
  }
  function validate(d){
    if(!d.nom) return 'Le nom est requis';
    if(!d.tel) return 'Le téléphone est requis';
    if(!d.email) return "L'email est requis";
    if(!/^[0-9+\s()-]{8,20}$/.test(d.tel)) return 'Numéro de téléphone invalide';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return 'Adresse email invalide';
    return null;
  }
  async function localSave(data){
    if(!window.GPDB||!GPDB.save) throw new Error('GPDB indisponible');
    // Do not let an async cloud adapter decide whether the local CRUD succeeds.
    await GPDB.save(data,{skipLicenseGuard:true,skipCloud:true});
    window.DB=data;
  }
  async function cloudPush(data){
    if(!window.GPSupabase||!GPSupabase.available||!GPSupabase.available()) return {ok:false,skipped:true};
    if(!GPSupabase.currentUid||!GPSupabase.currentUid()) return {ok:false,skipped:true};
    let last;
    for(let i=0;i<3;i++){
      try{ await GPSupabase.push(window.GPDB&&GPDB.load?GPDB.load():data); return {ok:true}; }
      catch(e){ last=e; await new Promise(r=>setTimeout(r,300*(i+1))); }
    }
    return {ok:false,error:last};
  }
  function render(){
    try{if(window.renderProprietairesCards)window.renderProprietairesCards();}catch(e){}
    try{if(window.renderProprietairesModern)window.renderProprietairesModern();}catch(e){}
    try{if(window.updateSidebarBadges)window.updateSidebarBadges();}catch(e){}
  }
  async function create(){
    const d=fieldsFromDrawer(); const err=validate(d); if(err){toast(err,'err');return false;}
    const photoInput=document.getElementById('nvp-photo-input');
    let photo='';
    if(photoInput&&photoInput.files&&photoInput.files[0]) photo=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(photoInput.files[0]);});
    const data=clone(db()); if(!Array.isArray(data[KEY]))data[KEY]=[];
    const p={id:uid(),prenom:d.prenom,nom:d.nom,naiss:d.naiss,matri:d.matri,tel:d.tel,email:d.email,adresse:d.adresse,photo,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    data[KEY].push(p);
    try{
      await localSave(data);
      render();
      const cloud=await cloudPush(data);
      if(cloud.ok) toast('Propriétaire enregistré et synchronisé ✓','ok');
      else if(cloud.skipped) toast('Propriétaire enregistré localement ✓','ok');
      else toast('Propriétaire enregistré localement ; synchronisation Supabase à vérifier.','err');
      if(window.closeNouvelProprietaireDrawer)window.closeNouvelProprietaireDrawer();
      return true;
    }catch(e){console.error('[GP V23] création propriétaire',e);toast('Enregistrement impossible : '+(e.message||e),'err');return false;}
  }
  async function edit(key,idx){
    if(key!=='proprietaires') return null;
    const data=clone(db()); const p=data.proprietaires&&data.proprietaires[idx]; if(!p)return false;
    const drawer=document.getElementById('gpActionsDrawer'); if(!drawer)return false;
    const get=f=>{const e=drawer.querySelector('[data-gp-field="'+f+'"] input, [data-gp-field="'+f+'"] select, [data-gp-field="'+f+'"] textarea')||drawer.querySelector('#e-'+f);return e?String(e.value||'').trim():p[f]||''};
    ['nom','prenom','naiss','matri','adresse','tel','email'].forEach(f=>{p[f]=get(f)});
    p.updatedAt=new Date().toISOString();
    const err=validate({nom:p.nom,tel:p.tel,email:p.email}); if(err){toast(err,'err');return false;}
    try{await localSave(data);render();const cloud=await cloudPush(data);if(!cloud.ok&&!cloud.skipped)toast('Modification locale enregistrée ; synchronisation Supabase à vérifier.','err');else toast('Modification enregistrée ✓','ok');if(window.gpCloseActionsDrawer)window.gpCloseActionsDrawer();return true;}catch(e){toast('Modification impossible : '+(e.message||e),'err');return false;}
  }
  async function del(key,idx){
    if(key!=='proprietaires') return null;
    const data=clone(db()); const list=data.proprietaires||[]; const p=list[idx]; if(!p)return false;
    if(window.confirm&&!window.confirm('Supprimer '+full(p)+' ?'))return false;
    const id=p.id; data.proprietaires=id?list.filter(x=>String(x&&x.id)!==String(id)):list.filter((_,i)=>i!==idx);
    try{await localSave(data);render();const cloud=await cloudPush(data);if(!cloud.ok&&!cloud.skipped){toast('Suppression locale effectuée ; synchronisation Supabase à vérifier.','err');}else toast('Propriétaire supprimé ✓','ok');return true;}catch(e){toast('Suppression impossible : '+(e.message||e),'err');return false;}
  }
  // Authoritative drawer create
  window.saveProprietaireFromDrawer=create;
  // Authoritative list actions, preserving legacy behavior for other collections.
  const oldEdit=window.editRow; window.editRow=function(key,idx){return oldEdit&&oldEdit.apply(this,arguments);};
  const oldDel=window.delRow; window.delRow=async function(key,idx){if(key==='proprietaires')return del(key,idx);return oldDel&&oldDel.apply(this,arguments);};
  // The legacy drawer remains responsible for rendering. We replace only its save path.
  const oldSaveEdit=window.gpSaveEdit;
  window.gpSaveEdit=async function(key,idx){
    if(key!=='proprietaires') return oldSaveEdit&&oldSaveEdit.apply(this,arguments);
    return edit(key,idx);
  };
  window.GPProprietairesCRUD={create,edit,del};
  window.addEventListener('load',()=>{try{render();}catch(e){}});
})();
