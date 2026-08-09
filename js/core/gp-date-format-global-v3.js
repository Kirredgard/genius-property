/* Correctif V3 — format date global jj/mm/aaaa */
(function(){
  'use strict';
  function pad(n){ return String(n).padStart(2,'0'); }
  function parseDate(v){
    if(!v) return null;
    if(v instanceof Date && !isNaN(v)) return v;
    var s=String(v).trim();
    var m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if(m){ var y=Number(m[3]); if(y<100)y+=2000; return new Date(y, Number(m[2])-1, Number(m[1])); }
    var d=new Date(s); return isNaN(d)?null:d;
  }
  function formatDateFR(v){ var d=parseDate(v); return d?pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear():(v?String(v):'—'); }
  function toISODate(v){ var d=parseDate(v); return d?d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()):''; }
  window.formatDateFR = formatDateFR;
  window.gpFormatDateFR = formatDateFR;
  window.gpToISODate = toISODate;
  window.formatGPDateShort = formatDateFR;
  window.formatGPDate = function(v){ return toISODate(v) || ''; };
  window.parseGPDate = function(v){ return parseDate(v) || new Date('Invalid Date'); };



  function normalizeVisibleDates(root){
    root = root || document;
    var walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode:function(node){
        if(!node.nodeValue || !/\b\d{4}-\d{2}-\d{2}\b/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p=node.parentElement;
        if(!p || /^(SCRIPT|STYLE|TEXTAREA|INPUT|SELECT)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(n){ n.nodeValue=n.nodeValue.replace(/\b(\d{4}-\d{2}-\d{2})\b/g,function(m){return formatDateFR(m);}); });
  }
  function normalizeDateInputs(){
    document.querySelectorAll('input[type="date"]').forEach(function(el){
      el.setAttribute('placeholder','jj/mm/aaaa');
      el.setAttribute('lang','fr');
      if(!el.dataset.gpDateFixed){
        el.dataset.gpDateFixed='1';
        el.addEventListener('blur', function(){
          if(el.value && /^\d{4}-\d{2}-\d{2}$/.test(el.value)) el.title = formatDateFR(el.value);
        });
      }
    });
  }
  function runDateFixes(){ normalizeDateInputs(); normalizeVisibleDates(document.body || document); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', runDateFixes); else runDateFixes();
  new MutationObserver(function(){ runDateFixes(); }).observe(document.documentElement,{childList:true,subtree:true,characterData:true});

  // Sécurise les sauvegardes si une date est saisie au format jj/mm/aaaa dans un champ custom.
  ['savePaiement','saveFinanceDrawer'].forEach(function(name){
    var fn=window[name];
    if(typeof fn==='function' && !fn.__gpDateWrapped){
      var wrapped=function(){
        document.querySelectorAll('input[id*="date"],input[id*="Date"],input[id*="prochain"],input[id*="debut"],input[id*="fin"]').forEach(function(el){
          if(el && el.value && /\//.test(el.value)){ var iso=toISODate(el.value); if(iso) el.value=iso; }
        });
        return fn.apply(this, arguments);
      };
      wrapped.__gpDateWrapped=true; window[name]=wrapped;
    }
  });
})();
