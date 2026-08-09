/* GP — owner auto details + edit selects final patch */
(function(){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function clean(v){return String(v==null?'':v).trim();}
  function norm(v){return clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
  function tokens(v){return norm(v).split(' ').filter(function(x){return x.length>1;});}
  function db(){ try{ if(window.GPDB&&GPDB.load){ var d=GPDB.load(); if(d){ window.DB=d; return d; } } }catch(e){} window.DB=window.DB||{}; return window.DB; }
  function arr(k){ var d=db(); return Array.isArray(d[k])?d[k]:[]; }
  function fullName(p){return clean([p&&p.prenom,p&&p.nom].filter(Boolean).join(' ')) || clean(p&&p.nom) || clean(p&&p.name) || clean(p&&p.fullName) || clean(p&&p.raisonSociale);}
  function ownerLabel(p){ var n=fullName(p); return n || p.email || p.tel || p.id || ''; }
  function ownerKeys(b){ return [b&&b.proprietaireId,b&&b.ownerId,b&&b.proprioId,b&&b.proprio,b&&b.proprietaire,b&&b.owner,b&&b.nomProprietaire,b&&b.proprietaireNom,b&&b.ownerName].map(clean).filter(Boolean); }
  function scoreOwner(p, keys){
    var vals=[p.id,p.uid,p.key,p.email,p.tel,p.phone,p.telephone,p.nom,p.prenom,fullName(p),[p.nom,p.prenom].filter(Boolean).join(' '),[p.prenom,p.nom].filter(Boolean).join(' ')].map(clean).filter(Boolean);
    var valsN=vals.map(norm);
    var best=0;
    keys.forEach(function(kRaw){
      var k=norm(kRaw); if(!k) return;
      valsN.forEach(function(v){
        if(!v) return;
        if(v===k) best=Math.max(best,100);
        else if(v.indexOf(k)>-1 || k.indexOf(v)>-1) best=Math.max(best,70);
        var kt=tokens(k), vt=tokens(v); if(kt.length&&vt.length){
          var hit=kt.filter(function(t){return vt.indexOf(t)>-1;}).length;
          var sc=Math.round((hit/Math.max(kt.length,vt.length))*60);
          if(hit>=Math.min(2,kt.length)) sc+=15;
          best=Math.max(best,sc);
        }
      });
    });
    return best;
  }
  function findOwnerForBien(b){
    var owners=arr('proprietaires'), keys=ownerKeys(b);
    if(!owners.length) return null;
    var best=null, bestScore=0;
    owners.forEach(function(p){ var s=scoreOwner(p,keys); if(s>bestScore){best=p; bestScore=s;} });
    return bestScore>=35?best:null;
  }
  function countOwnerBiens(p){
    var keys=[p.id,p.uid,p.key,p.email,p.tel,p.phone,p.telephone,p.nom,fullName(p),[p.prenom,p.nom].filter(Boolean).join(' '),[p.nom,p.prenom].filter(Boolean).join(' ')].map(norm).filter(Boolean);
    return arr('biens').filter(function(b){
      var vals=ownerKeys(b).map(norm);
      return vals.some(function(v){return v && keys.some(function(k){return v===k || v.indexOf(k)>-1 || k.indexOf(v)>-1;});});
    }).length;
  }
  function ownerHtmlFinal(b){
    var p=findOwnerForBien(b);
    if(!p){
      return '<div class="bd-empty-state"><span class="material-symbols-rounded">person_off</span><b>Propriétaire non trouvé</b><small>Nom renseigné : '+esc(ownerKeys(b).join(' / ')||'—')+'</small></div>';
    }
    var n=ownerLabel(p);
    var initials=(n||'?').split(/\s+/).map(function(x){return x[0];}).join('').slice(0,2).toUpperCase();
    return '<div class="bd-owner-card bd-owner-card-final">'
      +'<div class="bd-owner-avatar">'+(p.photo?'<img src="'+esc(p.photo)+'" alt="">':esc(initials))+'</div>'
      +'<div class="bd-owner-info"><h3>'+esc(n||'Propriétaire')+'</h3><p>'+esc(p.adresse||'Adresse non renseignée')+'</p></div>'
      +'</div>'
      +'<div class="bd-info-grid bd-owner-details-final">'
      +'<div><label>Téléphone</label><b>'+esc(p.tel||p.phone||p.telephone||'—')+'</b></div>'
      +'<div><label>Email</label><b>'+esc(p.email||'—')+'</b></div>'
      +'<div><label>Nombre de biens</label><b>'+countOwnerBiens(p)+'</b></div>'
      +'<div><label>Identifiant</label><b>'+esc(p.id||p.uid||'—')+'</b></div>'
      +'<div><label>Situation</label><b>'+esc(p.matri||p.statut||'—')+'</b></div>'
      +'<div><label>Adresse</label><b>'+esc(p.adresse||'—')+'</b></div>'
      +'</div>';
  }
  function patchOwnerPanel(){
    var page=document.getElementById('page-bien-detail'); if(!page || !page.classList.contains('active')) return;
    var idx=Number(window._bienDetailIdx); var b=arr('biens')[idx]; if(!b) return;
    var panel=document.getElementById('bdRestored-proprio') || document.getElementById('gpBD-proprio') || document.getElementById('bienTabProprio');
    if(!panel) return;
    panel.innerHTML='<h3>Propriétaire</h3>'+ownerHtmlFinal(b);
  }
  function installOwnerPatch(){
    if(window.__gpOwnerAutoPatchInstalled) return;
    window.__gpOwnerAutoPatchInstalled=true;
    var old=window.openBienDetail;
    if(typeof old==='function'){
      window.openBienDetail=function(){ var r=old.apply(this,arguments); setTimeout(patchOwnerPanel,30); setTimeout(patchOwnerPanel,180); return r; };
    }
    document.addEventListener('click',function(e){
      var t=e.target&&e.target.closest&&e.target.closest('.bd-restored-tab,.bd-tab,.bien-detail-tab,[onclick*="proprio"]');
      if(t) setTimeout(patchOwnerPanel,20);
    },true);
  }
  function option(value,label,selected){return '<option value="'+esc(value)+'" '+(String(value)===String(selected)?'selected':'')+'>'+esc(label||value)+'</option>';}
  function peopleName(x){return fullName(x)||x.nom||x.name||x.email||x.id||'';}
  function locataireName(x){return fullName(x)||x.nom||x.name||x.email||x.id||'';}
  function bienName(x){return clean(x.nom||x.name||x.designation||x.adresse||x.id);}
  function locativeName(x){return clean(x.nom||x.name||x.location||x.bien||x.id);}
  function replaceFieldWithSelect(field, list, getValue, getLabel){
    var old=document.querySelector('#rowModalBody [data-field="'+field+'"]'); if(!old || old.tagName==='SELECT') return;
    var current=old.value||old.getAttribute('value')||'';
    var sel=document.createElement('select');
    sel.setAttribute('data-field',field); sel.style.cssText=old.style.cssText || 'width:100%';
    sel.innerHTML='<option value="">Sélectionner</option>'+list.map(function(item){ var v=getValue(item), l=getLabel(item); return option(v,l,current); }).join('');
    if(current && !Array.prototype.some.call(sel.options,function(o){return o.value===current;})) sel.insertAdjacentHTML('beforeend', option(current,current,current));
    sel.value=current;
    old.replaceWith(sel);
  }
  function patchEditSelects(key){
    var d=db();
    if(key==='biens') replaceFieldWithSelect('proprio', arr('proprietaires'), ownerLabel, ownerLabel);
    if(key==='locataires') replaceFieldWithSelect('bien', arr('biens'), bienName, bienName);
    if(key==='locatives'){
      replaceFieldWithSelect('bien', arr('biens'), bienName, bienName);
      replaceFieldWithSelect('locataire', arr('locataires'), locataireName, locataireName);
      replaceFieldWithSelect('occupant', arr('locataires'), locataireName, locataireName);
    }
    if(key==='contrats'){
      replaceFieldWithSelect('locataire', arr('locataires'), locataireName, locataireName);
      replaceFieldWithSelect('locative', arr('locatives'), locativeName, function(l){ var bien=l.bien||l.nomBien||''; return locativeName(l)+(bien?' — '+bien:''); });
    }
    if(key==='paiements'){
      replaceFieldWithSelect('locataire', arr('locataires'), locataireName, locataireName);
      replaceFieldWithSelect('locative', arr('locatives'), locativeName, function(l){ var bien=l.bien||l.nomBien||''; return locativeName(l)+(bien?' — '+bien:''); });
    }
    if(key==='depenses') replaceFieldWithSelect('bien', arr('biens'), bienName, bienName);
  }
  function installEditSelectPatch(){
    if(window.__gpEditSelectPatchInstalled) return;
    window.__gpEditSelectPatchInstalled=true;
    var old=window.editRow;
    if(typeof old==='function'){
      window.editRow=function(key,idx){ var r=old.apply(this,arguments); setTimeout(function(){patchEditSelects(key);},20); setTimeout(function(){patchEditSelects(key);},160); return r; };
    }
  }
  function boot(){ installOwnerPatch(); installEditSelectPatch(); patchOwnerPanel(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,0); setTimeout(boot,500);}); else boot();
  setTimeout(boot,1200);
})();
