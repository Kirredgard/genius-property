/* Genius Property — clean runtime guard. Prevents stale service workers/caches
 * from serving a previous app build during localhost development. */
(function(){
  'use strict';
  window.GP_APP_BUILD = '2026-09-29-clean-runtime-v15';
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs){
        regs.forEach(function(reg){
          /* On garde le service worker PWA (/sw.js) ; on supprime seulement les anciens (ex. sw.v21.js). */
          var url=(reg.active&&reg.active.scriptURL)||(reg.waiting&&reg.waiting.scriptURL)||(reg.installing&&reg.installing.scriptURL)||'';
          if(/\/sw\.js(\?|$)/.test(url)) return;
          try{ reg.unregister(); }catch(_){}
        });
      }).catch(function(){});
    }
    if (window.caches && caches.keys) {
      caches.keys().then(function(keys){
        keys.filter(function(k){ return /^gp-v21-cache/i.test(k) || /genius|gp-/i.test(k); })
          .forEach(function(k){ try{ caches.delete(k); }catch(_){} });
      }).catch(function(){});
    }
  } catch(_) {}
})();
