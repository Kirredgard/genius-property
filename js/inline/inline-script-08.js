// ── Phone widget — Nouvel Propriétaire ────────────────────────────────────
(function(){
  var nvpSelectedCountry={code:'SN',dial:'+221'};
  function nvpRenderCountryList(filter){
    var list=document.getElementById('nvp-country-list');
    if(!list||typeof window.COUNTRIES==='undefined') return;
    var f=(filter||'').toLowerCase();
    var items=window.COUNTRIES.filter(function(c){return !f||c.name.toLowerCase().includes(f)||c.dial.includes(f)||c.code.toLowerCase().includes(f);});
    if(!items.length){list.innerHTML='<div class="nde-country-empty">Aucun pays trouvé</div>';return;}
    list.innerHTML=items.map(function(c){var sel=c.code===nvpSelectedCountry.code?'selected':'';return '<div class="nde-country-item '+sel+'" onclick="nvpSelectCountry(\''+c.code+'\',\''+c.name+'\',\''+c.dial+'\')"><div class="ci-flag"><img src="https://flagcdn.com/w40/'+c.code.toLowerCase()+'.png" alt="'+c.code+'"></div><span class="ci-name">'+c.name+'</span><span class="ci-code">'+c.dial+'</span></div>';}).join('');
  }
  function nvpToggleCountryDropdown(){
    var btn=document.getElementById('nvp-country-btn');
    var dd=document.getElementById('nvp-country-dropdown');
    if(!btn||!dd) return;
    if(dd.classList.contains('open')){nvpCloseCountryDropdown();return;}
    dd.classList.add('open');btn.classList.add('open');
    nvpRenderCountryList('');
    setTimeout(function(){var inp=document.getElementById('nvp-country-search-input');if(inp)inp.focus();},80);
  }
  function nvpCloseCountryDropdown(){
    var btn=document.getElementById('nvp-country-btn');
    var dd=document.getElementById('nvp-country-dropdown');
    if(btn) btn.classList.remove('open');
    if(dd) dd.classList.remove('open');
    var inp=document.getElementById('nvp-country-search-input');if(inp)inp.value='';
  }
  function nvpSelectCountry(code,name,dial){
    nvpSelectedCountry={code:code,dial:dial};
    var flagEl=document.getElementById('nvp-flag-emoji');
    var dialEl=document.getElementById('nvp-dial-code');
    if(flagEl){flagEl.src='https://flagcdn.com/w40/'+code.toLowerCase()+'.png';flagEl.alt=code.toUpperCase();}
    if(dialEl) dialEl.textContent=dial;
    nvpCloseCountryDropdown();
  }
  function nvpFilterCountries(val){nvpRenderCountryList(val);}
  document.addEventListener('click',function(e){
    var wrap=document.getElementById('nvp-phone-wrap');
    if(wrap&&!wrap.contains(e.target)) nvpCloseCountryDropdown();
  });
  window.nvpToggleCountryDropdown=nvpToggleCountryDropdown;
  window.nvpCloseCountryDropdown=nvpCloseCountryDropdown;
  window.nvpSelectCountry=nvpSelectCountry;
  window.nvpFilterCountries=nvpFilterCountries;
})();
