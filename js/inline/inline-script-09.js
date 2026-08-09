(function(){
  function openNouvelEmployeDrawer(){
    var overlay=document.getElementById('nvEmpOverlay');
    var drawer=document.getElementById('nvEmpDrawer');
    if(!overlay||!drawer) return;
    overlay.style.display='block';
    drawer.style.display='flex';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        overlay.style.opacity='1';
        drawer.style.transform='translateX(0)';
      });
    });
    // Reset form fields
    ['e-prenom','e-nom','e-email','e-tel','e-fonction','e-adresse','e-pass'].forEach(function(id){
      var el=document.getElementById(id); if(el&&el.tagName!=='INPUT'||el) if(el) el.value='';
    });
    var civ=document.getElementById('e-civ'); if(civ) civ.selectedIndex=0;
    var stat=document.getElementById('e-statut-drawer'); if(stat) stat.selectedIndex=0;
    var ps=document.getElementById('e-pass-strength'); if(ps) ps.textContent='';
    var sugg=document.getElementById('e-pass-suggestion'); if(sugg) sugg.style.display='none';
    var prev=document.getElementById('e-photo-preview'); if(prev){prev.src='';prev.style.display='none';}
    var inp=document.getElementById('e-photo-input'); if(inp) inp.value='';
    var eyeIcon=document.getElementById('e-pass-eye'); if(eyeIcon) eyeIcon.textContent='visibility';
    var passField=document.getElementById('e-pass'); if(passField) passField.type='password';
  }
  function closeNouvelEmployeDrawer(){
    var overlay=document.getElementById('nvEmpOverlay');
    var drawer=document.getElementById('nvEmpDrawer');
    if(!overlay||!drawer) return;
    overlay.style.opacity='0';
    drawer.style.transform='translateX(100%)';
    setTimeout(function(){
      overlay.style.display='none';
      drawer.style.display='none';
    }, 350);
  }
  async function saveEmployeFromDrawer(){
    var nom=(document.getElementById('e-nom')||{}).value||'';
    var email=(document.getElementById('e-email')||{}).value||'';
    var pass=(document.getElementById('e-pass')||{}).value||'';
    nom=nom.trim(); email=email.trim(); pass=pass.trim();
    if(!nom) return window.toast&&window.toast('Le nom est requis','err');
    if(!email) return window.toast&&window.toast("L'email est requis pour créer un accès",'err');
    if(!pass||pass.length<6) return window.toast&&window.toast('Mot de passe requis (6 caractères min.)','err');
    var btn=document.getElementById('nde-save-btn');
    if(btn){btn.disabled=true;btn.textContent='Enregistrement…';}
    // Use the existing saveEmploye but patch navigation
    var origNavigate=window.navigate;
    window.navigate=function(p){ if(p==='employes'){ closeNouvelEmployeDrawer(); if(window.renderEmployesModern) window.renderEmployesModern(); } else if(origNavigate) origNavigate(p); };
    try{
      await window.saveEmploye();
    }catch(e){ console.error(e); }
    window.navigate=origNavigate;
    if(btn){btn.disabled=false;btn.textContent='Enregistrer';}
  }
  window.openNouvelEmployeDrawer=openNouvelEmployeDrawer;
  window.closeNouvelEmployeDrawer=closeNouvelEmployeDrawer;
  window.saveEmployeFromDrawer=saveEmployeFromDrawer;
})();
