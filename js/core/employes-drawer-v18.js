/* Genius Property V18 — Employés
   Un seul drawer pour création + modification. */
(function(){
  'use strict';
  const RIGHTS=[
    ['dashboard','Tableau de bord'],['employes','Équipe'],['proprietaires','Propriétaires'],
    ['biens','Biens'],['locatives','Locations'],['paiements','Encaissements'],['depenses','Dépenses'],
    ['fichiers','Documents'],['messages','Messages'],['journal','Journal'],['rapports','Rapports']
  ];
  const ROLE_RIGHTS={
    'Administrateur': Object.fromEntries(RIGHTS.map(([k])=>[k,true])),
    'Gestionnaire': Object.fromEntries(RIGHTS.map(([k])=>[k,true])),
    'Agent': Object.fromEntries(RIGHTS.map(([k])=>[k,['dashboard','biens','locatives','messages'].includes(k)])),
    'Comptable': Object.fromEntries(RIGHTS.map(([k])=>[k,['dashboard','paiements','depenses','rapports'].includes(k)])),
    'Assistante': Object.fromEntries(RIGHTS.map(([k])=>[k,['dashboard','proprietaires','biens','locatives','messages'].includes(k)]))
  };
  let editIndex=null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const q=(id)=>document.getElementById(id);
  const val=id=>String(q(id)?.value||'').trim();
  const toast=(m,t='ok')=>window.toast?window.toast(m,t):console.log(m);
  function db(){try{return window.GPDB?.load?window.GPDB.load():(window.DB||{});}catch(e){return window.DB||{};}}
  async function save(d){if(window.GPDB?.save)return window.GPDB.save(d);window.DB=d;if(window.saveDB)return window.saveDB();}
  function roleRights(role){return {...(ROLE_RIGHTS[role]||ROLE_RIGHTS.Agent)};}
  function rightsHtml(r){return RIGHTS.map(([k,label])=>`<label class="emp18-right"><input type="checkbox" data-emp-right="${k}" ${r?.[k]!==false?'checked':''}><span>${label}</span></label>`).join('');}
  function readRights(){const out={};document.querySelectorAll('#emp18Drawer [data-emp-right]').forEach(x=>out[x.dataset.empRight]=x.checked);return out;}
  function applyRoleDefaults(role){const rights=roleRights(role);document.querySelectorAll('#emp18Drawer [data-emp-right]').forEach(x=>{x.checked=rights[x.dataset.empRight]!==false;});}
  function drawerHtml(r={},editing=false){
    const role=r.civ||r.role||'';
    const status=r.statut||'Actif';
    return `<div id="emp18Overlay" class="emp18-overlay"></div>
      <aside id="emp18Drawer" class="emp18-drawer" aria-label="${editing?'Modifier l’employé':'Nouvel employé'}">
        <header class="emp18-head"><div><h2>${editing?'Modifier l’employé':'Nouvel employé'}</h2><p>${editing?'Modifiez les informations sans recréer le compte.':'Ajoutez un nouvel employé à votre équipe.'}</p></div><button type="button" class="emp18-close" id="emp18Close" aria-label="Fermer">×</button></header>
        <main class="emp18-body">
          <section class="emp18-section"><h3>Informations personnelles</h3>
            <div class="emp18-photo-row"><div class="emp18-photo" id="emp18PhotoBox"><img id="emp18PhotoPreview" src="${esc(r.photo||'')}" style="${r.photo?'display:block':'display:none'}"><span id="emp18PhotoIcon" class="material-symbols-rounded" style="${r.photo?'display:none':''}">person</span><b>${r.photo?'Changer la photo':'Ajouter une photo'}</b><small>JPG ou PNG</small><input id="emp18Photo" type="file" accept="image/*"></div>
            <div class="emp18-photo-note">La photo est facultative. Lors d’une modification, elle est conservée si vous n’en choisissez pas une nouvelle.</div></div>
            <div class="emp18-grid"><label>Prénom *<input id="emp18Prenom" value="${esc(r.prenom)}" placeholder="Prénom"></label><label>Nom *<input id="emp18Nom" value="${esc(r.nom)}" placeholder="Nom"></label></div>
            <div class="emp18-grid"><label>Email *<input id="emp18Email" type="email" value="${esc(r.email)}" placeholder="email@exemple.com"></label><label>Téléphone<input id="emp18Tel" value="${esc(r.tel)}" placeholder="77 000 00 00"></label></div>
            <label>Adresse / notes<textarea id="emp18Adresse" placeholder="Adresse ou informations complémentaires">${esc(r.adresse)}</textarea></label>
          </section>
          <section class="emp18-section"><h3>Poste et accès</h3>
            <div class="emp18-grid"><label>Fonction / poste<input id="emp18Fonction" value="${esc(r.fonction)}" placeholder="Ex. Gestionnaire locatif"></label><label>Type de contrat<select id="emp18Contrat"><option ${r.contrat==='CDI'?'selected':''}>CDI</option><option ${r.contrat==='CDD'?'selected':''}>CDD</option><option ${r.contrat==='Stage'?'selected':''}>Stage</option><option ${r.contrat==='Freelance'?'selected':''}>Freelance</option></select></label></div>
            <div class="emp18-grid"><label>Rôle *<select id="emp18Role"><option value="">Sélectionner</option>${['Administrateur','Gestionnaire','Agent','Comptable','Assistante'].map(x=>`<option ${role===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Statut *<select id="emp18Status"><option ${status==='Actif'?'selected':''}>Actif</option><option ${status==='En attente'?'selected':''}>En attente</option><option ${status==='Inactif'?'selected':''}>Inactif</option></select></label></div>
          </section>
          <section class="emp18-section"><h3>${editing?'Compte de connexion':'Accès de connexion'}</h3>
            <div class="emp18-info"><span class="material-symbols-rounded">verified_user</span><div><b>${editing?'Le compte existant est conservé':'Un compte sera créé pour cet employé'}</b><p>${editing?'Laissez le mot de passe vide pour conserver l’actuel.':'L’adresse email servira d’identifiant de connexion.'}</p></div></div>
            <div class="emp18-pass"><label>Mot de passe ${editing?'<small>(facultatif)</small>':'*'}<input id="emp18Password" type="password" placeholder="${editing?'Laisser vide pour conserver':'6 caractères minimum'}"></label><button type="button" id="emp18Generate">Générer</button></div>
            <div class="emp18-perms-head"><b>Permissions</b><button type="button" id="emp18RoleDefaults">Appliquer le rôle</button></div><div class="emp18-rights">${rightsHtml(r.droits||roleRights(role))}</div>
          </section>
          <section class="emp18-section"><h3>Informations complémentaires</h3>
            <div class="emp18-grid"><label>Type de pièce<input id="emp18Piece" value="${esc(r.piece||'CNI')}"></label><label>N° pièce<input id="emp18NumPiece" value="${esc(r.numpiece)}"></label></div>
            <div class="emp18-grid"><label>Date d’embauche<input id="emp18Date" type="date" value="${esc(r.deldeb||r.date)}"></label><label>Date d’expiration<input id="emp18Exp" type="date" value="${esc(r.delexp)}"></label></div>
          </section>
        </main>
        <footer class="emp18-foot"><button type="button" class="emp18-cancel" id="emp18Cancel">Annuler</button><button type="button" class="emp18-save" id="emp18Save">${editing?'Enregistrer les modifications':'Créer l’employé'}</button></footer>
      </aside>`;
  }
  function mount(r={},editing=false){
    document.getElementById('emp18Overlay')?.remove();document.getElementById('emp18Drawer')?.remove();
    document.body.insertAdjacentHTML('beforeend',drawerHtml(r,editing));
    const overlay=q('emp18Overlay'), drawer=q('emp18Drawer');
    overlay.onclick=close;
    q('emp18Close').onclick=close;q('emp18Cancel').onclick=close;
    q('emp18Role').onchange=e=>applyRoleDefaults(e.target.value);
    q('emp18RoleDefaults').onclick=()=>applyRoleDefaults(q('emp18Role').value);
    q('emp18Generate').onclick=()=>{const s='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';let p='';for(let i=0;i<10;i++)p+=s[Math.floor(Math.random()*s.length)];q('emp18Password').value=p;q('emp18Password').type='text';};
    q('emp18PhotoBox').onclick=e=>{if(e.target.id!=='emp18Photo')q('emp18Photo').click();};
    q('emp18Photo').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=ev=>{q('emp18PhotoPreview').src=ev.target.result;q('emp18PhotoPreview').style.display='block';q('emp18PhotoIcon').style.display='none';q('emp18PhotoBox').querySelector('b').textContent='Changer la photo';};rd.readAsDataURL(f);};
    q('emp18Save').onclick=()=>saveForm(editing);
    overlay.style.display='block';drawer.style.display='flex';requestAnimationFrame(()=>{overlay.classList.add('show');drawer.classList.add('show');});
  }
  function close(){const o=q('emp18Overlay'),d=q('emp18Drawer');if(!o||!d)return;o.classList.remove('show');d.classList.remove('show');setTimeout(()=>{o.remove();d.remove();},220);editIndex=null;}
  async function photo(){if(window.GPMedia&&typeof window.GPMedia.readImage==='function')return window.GPMedia.readImage('emp18Photo');const f=q('emp18Photo')?.files?.[0];if(!f)return '';return await new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result||'');r.onerror=()=>res('');r.readAsDataURL(f);});}
  async function saveForm(editing){
    const nom=val('emp18Nom'), prenom=val('emp18Prenom'), email=val('emp18Email'), role=val('emp18Role'), pass=val('emp18Password');
    if(!nom)return toast('Le nom est requis','err');if(!email)return toast("L’email est requis",'err');if(!role)return toast('Le rôle est requis','err');if(!editing&&pass.length<6)return toast('Mot de passe requis (6 caractères minimum)','err');
    const btn=q('emp18Save');btn.disabled=true;btn.textContent='Enregistrement…';
    const d=db();if(!Array.isArray(d.employes))d.employes=[];const old=editing?d.employes[editIndex]:null;let uid=old?.uid||old?.supaUserId||null;
    try{
      if(!editing){
        const mk=window.GPSupabaseAuth?.createEmployeeAccount||window.GPFirebaseAuth?.createEmployeeAccount;if(!mk)throw new Error('Le service de création de compte employé est indisponible.');
        const auth=await mk(email,pass,{fullName:[prenom,nom].filter(Boolean).join(' '),role:role==='Gestionnaire'?'gestionnaire':role==='Comptable'?'comptable':role==='Agent'||role==='Assistante'?'agent':'lecture'});uid=auth.uid;
      }
      const p=await photo();const emp={...(old||{}),id:old?.id||'EP-'+Date.now(),uid,supaUserId:uid,prenom,nom,email,tel:val('emp18Tel'),fonction:val('emp18Fonction'),contrat:val('emp18Contrat'),civ:role,role,statut:val('emp18Status')||'Actif',adresse:val('emp18Adresse'),piece:val('emp18Piece')||'CNI',numpiece:val('emp18NumPiece'),deldeb:val('emp18Date'),delexp:val('emp18Exp'),droits:readRights()};
      if(p)emp.photo=p;delete emp.tempPassword;
      if(editing)d.employes[editIndex]=emp;else d.employes.push(emp);
      const saved=await save(d);if(saved===false) throw new Error('Modification non enregistrée. Rechargez puis réessayez.');window.DB=window.GPDB&&window.GPDB.load?window.GPDB.load():d;
      close();if(window.renderEmployesModern)window.renderEmployesModern();if(window.updateSidebarBadges)window.updateSidebarBadges();toast(editing?'Employé modifié ✓':'Employé créé ✓');
    }catch(e){console.error(e);toast(e?.message||'Impossible d’enregistrer l’employé','err');btn.disabled=false;btn.textContent=editing?'Enregistrer les modifications':'Créer l’employé';}
  }
  window.openNouvelEmployeDrawer=function(){editIndex=null;mount({},false);};
  window.closeNouvelEmployeDrawer=close;
  window.__gpOpenEmployeEdit=function(idx){const d=db();const r=d.employes?.[idx];if(r){editIndex=idx;mount(r,true);}};
  const oldEdit=window.editRow;window.editRow=function(key,idx){if(key==='employes'){return window.__gpOpenEmployeEdit(idx);}return oldEdit?oldEdit.apply(this,arguments):undefined;};
})();
