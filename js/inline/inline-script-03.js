(function(){
  try {
    var cached = (localStorage.getItem('gp_session_name') || localStorage.getItem('gp_session_firstname') || '').trim();
    if (!cached) return;
    function apply(){
      document.querySelectorAll('.user-name,.user-menu-name,#gpUName').forEach(function(el){
        if (el && el.textContent !== cached) el.textContent = cached;
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once:true });
    else apply();
  } catch(e) {}
})();
