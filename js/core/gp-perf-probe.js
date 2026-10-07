/* Genius Property — sonde de performance (DÉSACTIVÉE par défaut).
   Activation : ajouter ?perfprobe=1 à l'URL, ou taper GPPerfProbe.enable() dans la console.
   Utilisation : reproduire le blocage (ouvrir/fermer un formulaire), puis taper GPPerfProbe.report().
   Désactivation : GPPerfProbe.disable() */
(function(){
  'use strict';
  var on=false;
  try{ on=/[?&]perfprobe=1/.test(location.search)||localStorage.getItem('gp_perf_probe')==='1'; }catch(e){}
  var api={enabled:on,
    enable:function(){ try{localStorage.setItem('gp_perf_probe','1');}catch(e){} location.reload(); },
    disable:function(){ try{localStorage.removeItem('gp_perf_probe');}catch(e){} location.reload(); }};
  window.GPPerfProbe=api;
  if(!on) return;

  var log=[], counters={};
  function push(e){ e.t=Math.round(performance.now()); log.push(e); if(log.length>300) log.shift(); }

  try{ new PerformanceObserver(function(l){ l.getEntries().forEach(function(en){
    push({type:'tâche longue',ms:Math.round(en.duration)});
  }); }).observe({type:'longtask',buffered:true}); }catch(e){}

  try{ new PerformanceObserver(function(l){ l.getEntries().forEach(function(en){
    var t=en.target, id=t?(t.id?'#'+t.id:(t.className&&String(t.className).split(' ')[0]?'.'+String(t.className).split(' ')[0]:t.tagName)):'';
    push({type:'événement lent',name:en.name+' '+id,ms:Math.round(en.duration)});
  }); }).observe({type:'event',durationThreshold:100,buffered:true}); }catch(e){}

  function wrap(obj,name,label){
    var fn=obj&&obj[name]; if(typeof fn!=='function'||fn.__gpProbe) return;
    var w=function(){
      var t0=performance.now();
      try{ return fn.apply(this,arguments); }
      finally{
        var dt=performance.now()-t0, c=counters[label]||(counters[label]={appels:0,total_ms:0,max_ms:0});
        c.appels++; c.total_ms+=dt; if(dt>c.max_ms) c.max_ms=dt;
        if(dt>30) push({type:'fonction lente',name:label,ms:Math.round(dt)});
      }
    };
    w.__gpProbe=true; obj[name]=w;
  }
  function install(){
    wrap(window.GPDB,'load','GPDB.load'); wrap(window.GPDB,'save','GPDB.save');
    ['openFinanceDrawer','openPayModal','openGpDrawer','navigate','renderPage','renderPaiements','renderDepenses','renderBiensFinal','closeFinanceDrawer','closeGpDrawer']
      .forEach(function(n){ wrap(window,n,n); });
    if(window.GPFinanceV16) ['open','close','save'].forEach(function(n){ wrap(window.GPFinanceV16,n,'GPFinanceV16.'+n); });
    if(window.GPEncV2) ['openPay','saveEncaissement','render'].forEach(function(n){ wrap(window.GPEncV2,n,'GPEncV2.'+n); });
  }
  window.addEventListener('load',function(){ setTimeout(install,1500); });

  api.log=log; api.counters=counters;
  api.reset=function(){ log.length=0; Object.keys(counters).forEach(function(k){ delete counters[k]; }); console.info('[GPPerfProbe] compteurs remis à zéro'); };
  api.report=function(){
    var rows=Object.keys(counters).map(function(k){ var c=counters[k]; return {fonction:k,appels:c.appels,total_ms:Math.round(c.total_ms),max_ms:Math.round(c.max_ms)}; })
      .sort(function(a,b){ return b.total_ms-a.total_ms; });
    console.info('[GPPerfProbe] Fonctions (triées par temps total)'); console.table(rows);
    console.info('[GPPerfProbe] Derniers incidents (t = ms depuis le chargement)'); console.table(log.slice(-40));
    return {fonctions:rows,incidents:log.slice(-40)};
  };
  console.info('[GPPerfProbe] actif — reproduisez le blocage puis tapez GPPerfProbe.report()');
})();
