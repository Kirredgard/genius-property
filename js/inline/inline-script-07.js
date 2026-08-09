// ── Country Picker ──────────────────────────────────────────────────────────
(function(){
  var COUNTRIES = [
    {code:'SN',name:'Sénégal',dial:'+221'},
    {code:'CI',name:'Côte d\'Ivoire',dial:'+225'},
    {code:'ML',name:'Mali',dial:'+223'},
    {code:'GN',name:'Guinée',dial:'+224'},
    {code:'BF',name:'Burkina Faso',dial:'+226'},
    {code:'TG',name:'Togo',dial:'+228'},
    {code:'BJ',name:'Bénin',dial:'+229'},
    {code:'NE',name:'Niger',dial:'+227'},
    {code:'MR',name:'Mauritanie',dial:'+222'},
    {code:'GW',name:'Guinée-Bissau',dial:'+245'},
    {code:'GM',name:'Gambie',dial:'+220'},
    {code:'CV',name:'Cap-Vert',dial:'+238'},
    {code:'SL',name:'Sierra Leone',dial:'+232'},
    {code:'LR',name:'Libéria',dial:'+231'},
    {code:'GH',name:'Ghana',dial:'+233'},
    {code:'NG',name:'Nigéria',dial:'+234'},
    {code:'CM',name:'Cameroun',dial:'+237'},
    {code:'GA',name:'Gabon',dial:'+241'},
    {code:'CG',name:'Congo',dial:'+242'},
    {code:'CD',name:'RD Congo',dial:'+243'},
    {code:'CF',name:'Centrafrique',dial:'+236'},
    {code:'TD',name:'Tchad',dial:'+235'},
    {code:'MG',name:'Madagascar',dial:'+261'},
    {code:'MA',name:'Maroc',dial:'+212'},
    {code:'DZ',name:'Algérie',dial:'+213'},
    {code:'TN',name:'Tunisie',dial:'+216'},
    {code:'LY',name:'Libye',dial:'+218'},
    {code:'EG',name:'Égypte',dial:'+20'},
    {code:'ET',name:'Éthiopie',dial:'+251'},
    {code:'KE',name:'Kenya',dial:'+254'},
    {code:'TZ',name:'Tanzanie',dial:'+255'},
    {code:'UG',name:'Ouganda',dial:'+256'},
    {code:'RW',name:'Rwanda',dial:'+250'},
    {code:'ZA',name:'Afrique du Sud',dial:'+27'},
    {code:'FR',name:'France',dial:'+33'},
    {code:'BE',name:'Belgique',dial:'+32'},
    {code:'CH',name:'Suisse',dial:'+41'},
    {code:'LU',name:'Luxembourg',dial:'+352'},
    {code:'CA',name:'Canada',dial:'+1'},
    {code:'US',name:'États-Unis',dial:'+1'},
    {code:'GB',name:'Royaume-Uni',dial:'+44'},
    {code:'DE',name:'Allemagne',dial:'+49'},
    {code:'ES',name:'Espagne',dial:'+34'},
    {code:'IT',name:'Italie',dial:'+39'},
    {code:'PT',name:'Portugal',dial:'+351'},
    {code:'NL',name:'Pays-Bas',dial:'+31'},
    {code:'CN',name:'Chine',dial:'+86'},
    {code:'IN',name:'Inde',dial:'+91'},
    {code:'JP',name:'Japon',dial:'+81'},
    {code:'BR',name:'Brésil',dial:'+55'},
    {code:'MX',name:'Mexique',dial:'+52'},
    {code:'AR',name:'Argentine',dial:'+54'},
    {code:'SA',name:'Arabie Saoudite',dial:'+966'},
    {code:'AE',name:'Émirats Arabes Unis',dial:'+971'},
  ];
  var selectedCountry = COUNTRIES[0];

  function flagUrl(code){ return 'https://flagcdn.com/w40/'+code.toLowerCase()+'.png'; }

  function renderCountryList(filter){
    var list=document.getElementById('nde-country-list');
    if(!list) return;
    var q=(filter||'').toLowerCase().trim();
    var filtered=q?COUNTRIES.filter(function(c){return c.name.toLowerCase().includes(q)||c.dial.includes(q)||c.code.toLowerCase().includes(q);}):COUNTRIES;
    if(!filtered.length){list.innerHTML='<div class="nde-country-empty">Aucun pays trouvé</div>';return;}
    list.innerHTML=filtered.map(function(c){
      var sel=c.code===selectedCountry.code?' selected':'';
      return '<div class="nde-country-item'+sel+'" onclick="selectCountry(\''+c.code+'\')">'
        +'<span class="ci-flag"><img src="'+flagUrl(c.code)+'" alt="'+c.code+'" loading="lazy"></span>'
        +'<span class="ci-name">'+c.name+'</span>'
        +'<span class="ci-code">'+c.dial+'</span>'
        +'</div>';
    }).join('');
  }

  function toggleCountryDropdown(){
    var btn=document.getElementById('nde-country-btn');
    var dd=document.getElementById('nde-country-dropdown');
    var inp=document.getElementById('nde-country-search-input');
    if(!btn||!dd) return;
    if(dd.classList.contains('open')){closeCountryDropdown();return;}
    dd.classList.add('open'); btn.classList.add('open');
    renderCountryList('');
    if(inp){inp.value='';setTimeout(function(){inp.focus();},50);}
  }

  function closeCountryDropdown(){
    var btn=document.getElementById('nde-country-btn');
    var dd=document.getElementById('nde-country-dropdown');
    if(dd) dd.classList.remove('open');
    if(btn) btn.classList.remove('open');
  }

  function selectCountry(code){
    var c=COUNTRIES.find(function(x){return x.code===code;});
    if(!c) return;
    selectedCountry=c;
    var flagEl=document.getElementById('nde-flag-emoji');
    var dialEl=document.getElementById('nde-dial-code');
    if(flagEl){ flagEl.src=flagUrl(c.code); flagEl.alt=c.code; }
    if(dialEl) dialEl.textContent=c.dial;
    closeCountryDropdown();
  }

  function filterCountries(val){renderCountryList(val);}

  document.addEventListener('click',function(e){
    var wrap=document.getElementById('nde-phone-wrap');
    if(wrap&&!wrap.contains(e.target)) closeCountryDropdown();
  });

  window.toggleCountryDropdown=toggleCountryDropdown;
  window.closeCountryDropdown=closeCountryDropdown;
  window.selectCountry=selectCountry;
  window.filterCountries=filterCountries;
  window.getSelectedDialCode=function(){return selectedCountry.dial;};
  window.COUNTRIES=COUNTRIES;
})();

// ── Drawer Employé ──────────────────────────────────────────────────────────
