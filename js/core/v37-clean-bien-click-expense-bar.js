/* V37 — clean final interaction layer */
(function(){
  'use strict';
  function clean(v){return String(v==null?'':v).trim();}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function norm(v){var s=clean(v).toLowerCase();try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(e){}return s;}
  function db(){try{if(window.GPDB&&typeof window.GPDB.load==='function')return window.GPDB.load()||{};}catch(e){}try{return JSON.parse(localStorage.getItem('geniusproperty_db_clean_v1')||'{}')||{};}catch(e){return window.DB||{};}}
  function arr(k){var d=db();return Array.isArray(d[k])?d[k]:[];}
  function num(v){var n=Number(String(v==null?'':v).replace(/\s/g,'').replace(',','.'));return isFinite(n)?n:0;}
  function parseDate(v){var s=clean(v);if(!s)return null;var m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(m)return new Date(+m[3],+m[2]-1,+m[1]);var d=new Date(s);return isNaN(d.getTime())?null:d;}
  function monthKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}

  /* BIENS: one real click path. */
  function openCard(card){
    if(!card)return false;
    var oc=card.getAttribute('onclick')||'';
    var m=oc.match(/(?:openBienDetail|viewRow\s*\(\s*['"]biens['"]\s*,)\D*(\d+)/);
    var cards=[].slice.call(document.querySelectorAll('#page-biens .gp-bien-card,#page-biens .bien-card'));
    var idx=m?Number(m[1]):cards.indexOf(card);
    if(idx<0)return false;
    if(typeof window.openBienDetail==='function'){window.openBienDetail(idx);return true;}
    return false;
  }
  var oldViewRow=window.viewRow;
  if(!window.__gpV37ViewRow){
    window.__gpV37ViewRow=true;
    window.viewRow=function(key,idx){
      if(String(key||'').toLowerCase()==='biens'&&typeof window.openBienDetail==='function'){window.openBienDetail(Number(idx));return;}
      return typeof oldViewRow==='function'?oldViewRow.apply(this,arguments):undefined;
    };
  }
  document.addEventListener('click',function(e){
    var card=e.target&&e.target.closest?e.target.closest('#page-biens .gp-bien-card,#page-biens .bien-card'):null;
    if(!card)return;
    if(openCard(card)){e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}
  },true);
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' ')return;
    var card=e.target&&e.target.closest?e.target.closest('#page-biens .gp-bien-card,#page-biens .bien-card'):null;
    if(card&&openCard(card)){e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}
  },true);
  function styleBienCards(){
    var page=document.getElementById('page-biens');if(!page||!page.classList.contains('active'))return;
    page.querySelectorAll('.gp-bien-card:not(.gp-v37-bien-clickable),.bien-card:not(.gp-v37-bien-clickable)').forEach(function(card){
      card.classList.add('gp-v37-bien-clickable');
      card.removeAttribute('title');
      card.querySelectorAll('.gp-v35-click-hint,.gp-v36-hover-hint').forEach(function(h){h.remove();});
      card.setAttribute('role','button');card.setAttribute('tabindex','0');
    });
  }
  var style=document.createElement('style');style.id='gp-v37-style';style.textContent=`
    #page-biens .gp-v37-bien-clickable{cursor:pointer!important;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease!important;position:relative}
    #page-biens .gp-v37-bien-clickable:hover{transform:translateY(-3px)!important;box-shadow:0 10px 24px rgba(15,23,42,.13)!important;border-color:rgba(212,175,55,.55)!important}
    #page-biens .gp-v37-bien-clickable:active{transform:translateY(-1px)!important}
    #page-biens .gp-v37-bien-clickable:focus-visible{outline:3px solid rgba(212,175,55,.35);outline-offset:2px}
    .gp-v37-expense-bar{width:min(460px,100%);margin:7px 0 9px auto;box-sizing:border-box}
    .gp-v37-expense-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;font-size:10px;color:#6b7280;justify-content:flex-end;gap:10px}
    .gp-v37-expense-head b{font-size:11px;color:#111827}
    .gp-v37-expense-track{height:54px;width:100%;display:flex;overflow:hidden;border-radius:7px;background:#f2eee5;border:1px solid rgba(0,0,0,.04)}
    .gp-v37-expense-seg{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;line-height:1.05;min-width:0;box-sizing:border-box;border-right:2px solid #fff}
    .gp-v37-expense-seg:last-child{border-right:0}
    .gp-v37-expense-seg.works{background:#a8441a}
    .gp-v37-expense-seg.agency{background:#36529a}
    .gp-v37-expense-seg strong{font-size:10px;font-weight:800;text-align:center;white-space:nowrap}
    .gp-v37-expense-seg b{font-size:12px;margin-top:1px}
    .gp-v37-expense-seg strong,.gp-v37-expense-seg b,.gp-v37-expense-seg small{color:#fff!important}.gp-v37-expense-seg small{font-size:9px;margin-top:1px;white-space:nowrap}
    @media(max-width:700px){.gp-v37-expense-bar{width:min(380px,100%)}.gp-v37-expense-track{height:48px}.gp-v37-expense-seg strong{font-size:11px}.gp-v37-expense-seg b{font-size:13px}.gp-v37-expense-seg strong,.gp-v37-expense-seg b,.gp-v37-expense-seg small{color:#fff!important}.gp-v37-expense-seg small{font-size:9px}}
  `;document.head.appendChild(style);

  function removeOldExpenseIndicators(page){
    page.querySelectorAll('.gp-v34-month-kpis,.gp-v35-expense-indicator,.gp-v36-expense-indicator,.gp-force-finance-aside,.gp-finance-sidecards').forEach(function(x){x.remove();});
  }
  function addExpenseBar(){
    var page=document.getElementById('page-depenses');if(!page||!page.classList.contains('active'))return;
    removeOldExpenseIndicators(page);
    var old=page.querySelector('.gp-v37-expense-bar');
    var now=new Date(),key=monthKey(now);
    var sig=key+'|'+(localStorage.getItem('gpdb_local_revision')||'0');
    if(old&&old.getAttribute('data-gp-sig')===sig)return; // rien n'a changé : pas de relecture de la base ni de reconstruction
    if(old)old.remove();
    var all=arr('depenses');
    var month=all.filter(function(x){var d=parseDate(x.date||x.dateDepense||x.createdAt);return d&&monthKey(d)===key;});
    var total=month.reduce(function(s,x){return s+num(x.montant);},0);
    var agency=month.filter(function(x){var cat=norm(x.cat||x.categorie||x.category||''),type=norm(x.type||x.typeDepense||x.type_depense||''),bien=norm(x.bien||x.bienId||x.parentBien||x.parentBienId||x.affectation||'');return bien==='agence'||bien.indexOf('agence')>=0||cat.indexOf('agence')>=0||cat.indexOf('facture agence')>=0||type==='agence'||type.indexOf('agence')>=0;}).reduce(function(s,x){return s+num(x.montant||x.amount||0);},0);
    var works=month.filter(function(x){var cat=norm(x.cat||x.categorie||x.category||''),type=norm(x.type||x.typeDepense||x.type_depense||''),bien=norm(x.bien||x.bienId||x.parentBien||x.parentBienId||x.affectation||'');var isAgency=bien==='agence'||bien.indexOf('agence')>=0||cat.indexOf('agence')>=0||cat.indexOf('facture agence')>=0||type==='agence'||type.indexOf('agence')>=0; if(isAgency)return false; return cat.indexOf('travaux')>=0||cat.indexOf('reparation')>=0||type.indexOf('travaux')>=0||type.indexOf('reparation')>=0;}).reduce(function(s,x){return s+num(x.montant||x.amount||0);},0);
    var wp=total?Math.min(100,works/total*100):0,ap=total?Math.min(100,agency/total*100):0;
    var label=now.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
    var wrap=document.createElement('div');wrap.className='gp-v37-expense-bar';wrap.setAttribute('data-gp-sig',sig);
    wrap.innerHTML='<div class="gp-v37-expense-head"><span>Dépenses · '+esc(label)+'</span><b>'+total.toLocaleString('fr-FR')+' FCFA</b></div><div class="gp-v37-expense-track" aria-label="Répartition mensuelle des dépenses entre travaux et agence"><div class="gp-v37-expense-seg works" style="width:'+wp+'%"><strong>Travaux / réparations</strong><b>'+Math.round(wp)+' %</b><small>'+works.toLocaleString('fr-FR')+' FCFA</small></div><div class="gp-v37-expense-seg agency" style="width:'+ap+'%"><strong>Agence</strong><b>'+Math.round(ap)+' %</b><small>'+agency.toLocaleString('fr-FR')+' FCFA</small></div></div>';
    var toolbar=page.querySelector('.gpf-toolbar-finance');
    if(toolbar)toolbar.insertAdjacentElement('afterend',wrap);else page.prepend(wrap);
  }
  function refresh(){styleBienCards();addExpenseBar();}
  document.addEventListener('DOMContentLoaded',function(){setTimeout(refresh,250);});
  document.addEventListener('gp:navigation',function(e){if(!e||!e.detail)return;if(e.detail.page==='biens')setTimeout(styleBienCards,30);if(e.detail.page==='depenses')setTimeout(addExpenseBar,30);});
  setInterval(function(){ if(!document.hidden) refresh(); },2500);
})();
