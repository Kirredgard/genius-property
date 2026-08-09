/* Firebase auth final guard — neutralise tout ancien handler Firebase */
(function(){
  function err(msg){ var el=document.getElementById('authError'); if(el) el.textContent=msg||''; }
  async function firebaseLoginGuard(ev){
    if(ev && ev.preventDefault) ev.preventDefault();
    if(ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    if(window._firebaseAuthLoginHandler){ return window._firebaseAuthLoginHandler(); }
    if(window.GPFirebaseAuth && window.GPFirebaseAuth.signIn){
      var email=(document.getElementById('lu')||{}).value||'';
      var pwd=(document.getElementById('lp')||{}).value||'';
      email=email.trim();
      if(!email || !pwd){ err('Veuillez saisir vos identifiants.'); return; }
      try{
        var u=await window.GPFirebaseAuth.signIn(email,pwd);
        if(window.GPFirebaseAuth.hydrateCurrentUser) await window.GPFirebaseAuth.hydrateCurrentUser(u);
        if(typeof window._showApp==='function') await window._showApp();
      }catch(e){ err((e && (e.message||e.code)) || 'Connexion Firebase impossible.'); }
      return;
    }
    err('Firebase Auth est en cours de chargement. Rechargez la page si le message persiste.');
  }
  window.gpFirebaseLoginFromButton = firebaseLoginGuard;
  window.doLogin = firebaseLoginGuard;
  document.addEventListener('click', function(e){
    var b=e.target && e.target.closest && e.target.closest('#loginBtn');
    if(b) firebaseLoginGuard(e);
  }, true);
  document.addEventListener('DOMContentLoaded', function(){
    var el=document.getElementById('authError');
    if(el && /Firebase|Supabase/i.test(el.textContent||'')) el.textContent='';
    var btn=document.getElementById('loginBtn');
    if(btn){
      btn.onclick = firebaseLoginGuard;
      btn.addEventListener('click', firebaseLoginGuard, true);
    }
  });
  window.addEventListener('firebase:ready', function(){
    window.doLogin = window._firebaseAuthLoginHandler || firebaseLoginGuard;
    var el=document.getElementById('authError');
    if(el && /Firebase|Supabase/i.test(el.textContent||'')) el.textContent='';
  });
  setInterval(function(){
    if(window._firebaseAuthLoginHandler && window.doLogin !== window._firebaseAuthLoginHandler){
      window.doLogin = window._firebaseAuthLoginHandler;
    }
  }, 300);
})();
