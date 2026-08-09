/* Genius Property — Flicker/modal stabilizer 2026-05-24 */
(function(){
  'use strict';
  function by(id){ return document.getElementById(id); }
  function showModal(id){
    var m=by(id); if(!m) return;
    m.style.display='flex';
    m.style.alignItems='center';
    m.style.justifyContent='center';
    m.style.opacity='1';
    m.setAttribute('aria-hidden','false');
    document.body.classList.add('gp-modal-open');
  }
  function hideModal(id){
    var m=by(id); if(!m) return;
    m.style.display='none';
    m.setAttribute('aria-hidden','true');
    document.body.classList.remove('gp-modal-open');
  }
  function stableWrap(openName, closeName, id){
    var oldOpen=window[openName], oldClose=window[closeName];
    window[openName]=function(){
      var r;
      try{ if(typeof oldOpen==='function') r=oldOpen.apply(this,arguments); }catch(e){ console.warn('[flicker-fix]', openName, e); }
      requestAnimationFrame(function(){ showModal(id); });
      return r;
    };
    window[closeName]=function(){
      var r;
      try{ if(typeof oldClose==='function') r=oldClose.apply(this,arguments); }catch(e){ console.warn('[flicker-fix]', closeName, e); }
      hideModal(id);
      return r;
    };
  }
  function install(){
    stableWrap('openPayModal','closePayModal','payModal');
    stableWrap('openDepModal','closeDepModal','depModal');
    try{ if(window.ensureChart) window.ensureChart(); }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
