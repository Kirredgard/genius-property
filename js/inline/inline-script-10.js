(function(){
  // ── Photo helpers ──────────────────────────────────────────────────────────
  window.nvpPreviewPhoto = function(input){
    var file = input.files[0]; if(!file) return;
    var r = new FileReader();
    r.onload = function(e){
      var prev = document.getElementById('nvp-photo-preview');
      var icon = document.getElementById('nvp-photo-icon');
      if(prev){ prev.src = e.target.result; prev.style.display = 'block'; }
      if(icon) icon.style.display = 'none';
    };
    r.readAsDataURL(file);
  };
  window.nvpClearPhoto = function(){
    var prev = document.getElementById('nvp-photo-preview');
    var icon = document.getElementById('nvp-photo-icon');
    var inp  = document.getElementById('nvp-photo-input');
    if(prev){ prev.src=''; prev.style.display='none'; }
    if(icon) icon.style.display = '';
    if(inp)  inp.value = '';
  };

  // ── Open / Close ───────────────────────────────────────────────────────────
  function openNouvelProprietaireDrawer(){
    var overlay = document.getElementById('nvPropOverlay');
    var drawer  = document.getElementById('nvPropDrawer');
    if(!overlay||!drawer) return;
    overlay.style.display = 'block';
    drawer.style.display  = 'flex';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        overlay.style.opacity   = '1';
        drawer.style.transform  = 'translateX(0)';
      });
    });
    // Reset fields
    ['nvp-prenom','nvp-nom','nvp-tel','nvp-email','nvp-adresse'].forEach(function(id){
      var el = document.getElementById(id); if(el) el.value = '';
    });
    var naiss = document.getElementById('nvp-naiss'); if(naiss) naiss.value = '';
    var matri = document.getElementById('nvp-matri'); if(matri) matri.selectedIndex = 0;
    nvpClearPhoto();
    setTimeout(function(){ var el=document.getElementById('nvp-prenom'); if(el) el.focus(); }, 80);
  }

  function closeNouvelProprietaireDrawer(){
    var overlay = document.getElementById('nvPropOverlay');
    var drawer  = document.getElementById('nvPropDrawer');
    if(!overlay||!drawer) return;
    overlay.style.opacity  = '0';
    drawer.style.transform = 'translateX(100%)';
    setTimeout(function(){
      overlay.style.display = 'none';
      drawer.style.display  = 'none';
    }, 350);
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function saveProprietaireFromDrawer(){
    var prenom  = (document.getElementById('nvp-prenom')||{}).value||'';
    var nom     = (document.getElementById('nvp-nom')||{}).value||'';
    var tel     = (document.getElementById('nvp-tel')||{}).value||'';
    var email   = (document.getElementById('nvp-email')||{}).value||'';
    var adresse = (document.getElementById('nvp-adresse')||{}).value||'';
    var naiss   = (document.getElementById('nvp-naiss')||{}).value||'';
    var matri   = (document.getElementById('nvp-matri')||{}).value||'';

    prenom = prenom.trim(); nom = nom.trim(); tel = tel.trim(); email = email.trim(); adresse = adresse.trim();

    if(!nom)  return window.toast&&window.toast('Le nom est requis','err');
    if(!tel)  return window.toast&&window.toast('Le téléphone est requis','err');
    if(!email) return window.toast&&window.toast("L'email est requis",'err');

    // Read photo
    var photoData = '';
    var photoInp = document.getElementById('nvp-photo-input');
    var photoFile = photoInp&&photoInp.files&&photoInp.files[0];
    if(photoFile){
      photoData = await new Promise(function(res,rej){
        var r=new FileReader(); r.onload=function(e){res(e.target.result);}; r.onerror=rej; r.readAsDataURL(photoFile);
      });
    }

    // Patch p- fields used by saveProprietaire()
    function setVal(id,val){ var el=document.getElementById(id); if(el) el.value=val; }
    setVal('p-nom',    nom);
    setVal('p-prenom', prenom);
    setVal('p-tel',    tel);
    setVal('p-email',  email);
    setVal('p-adresse',adresse);
    setVal('p-naiss',  naiss);
    setVal('p-matri',  matri);
    // Photo preview sync
    var pprev = document.getElementById('p-photo-preview');
    if(pprev&&photoData){ pprev.src=photoData; pprev.style.display='block'; }

    var btn = document.getElementById('nvp-save-btn');
    if(btn){ btn.disabled=true; btn.textContent='Enregistrement…'; }

    var origNavigate = window.navigate;
    window.navigate = function(p){
      if(p==='proprietaires'){
        closeNouvelProprietaireDrawer();
        if(window.renderProprietairesModern) window.renderProprietairesModern();
      } else if(origNavigate) origNavigate(p);
    };
    try{ await window.saveProprietaire(); }catch(e){ console.error(e); }
    window.navigate = origNavigate;
    if(btn){ btn.disabled=false; btn.textContent='Enregistrer'; }
  }

  window.openNouvelProprietaireDrawer  = openNouvelProprietaireDrawer;
  window.closeNouvelProprietaireDrawer = closeNouvelProprietaireDrawer;
  window.saveProprietaireFromDrawer    = saveProprietaireFromDrawer;
})();
