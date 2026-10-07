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
  function normalizeDateInputs(root){
    root = root || document;
    var list = [];
    if(root.nodeType===1 && root.matches && root.matches('input[type="date"]')) list.push(root);
    if(root.querySelectorAll) Array.prototype.push.apply(list, root.querySelectorAll('input[type="date"]'));
    list.forEach(function(el){
      if(el.dataset.gpDateFixed) return;
      el.setAttribute('placeholder','jj/mm/aaaa');
      el.setAttribute('lang','fr');
      el.dataset.gpDateFixed='1';
      el.addEventListener('blur', function(){
        if(el.value && /^\d{4}-\d{2}-\d{2}$/.test(el.value)) el.title = formatDateFR(el.value);
      });
    });
  }
  function runDateFixes(){ normalizeDateInputs(document); normalizeVisibleDates(document.body || document); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', runDateFixes); else runDateFixes();

  // Perf : l'observateur ne retraite plus toute la page à chaque mutation.
  // Les mutations sont regroupées (100 ms) et seuls les nœuds ajoutés/modifiés sont analysés.
  var pending = new Set(), timer = null, mo = null;
  function enqueue(node){
    if(!node) return;
    var el = node.nodeType===1 ? node : node.parentElement;
    if(el) pending.add(el);
  }
  function flush(){
    timer = null;
    var roots = Array.from(pending); pending.clear();
    roots = roots.filter(function(r){
      return r.isConnected && !roots.some(function(o){ return o!==r && o.contains(r); });
    });
    roots.forEach(function(r){ normalizeDateInputs(r); normalizeVisibleDates(r); });
    if(mo) mo.takeRecords(); // ignore nos propres modifications (évite la boucle)
  }
  mo = new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){
      var m=muts[i];
      if(m.type==='childList'){ for(var j=0;j<m.addedNodes.length;j++) enqueue(m.addedNodes[j]); }
      else if(m.type==='characterData'){ enqueue(m.target); }
    }
    if(pending.size && !timer) timer = setTimeout(flush, 100);
  });
  mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true});

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
