/* Genius Property — Bureau desktop V34
   Refonte uniquement de la page Bureau + carte utilisateur topbar.
   Ne modifie pas la navigation gauche, le logo, ni les icônes topbar existantes. */
(function(){
  'use strict';

  function db(){ try{return (window.GPDB&&window.GPDB.load)?window.GPDB.load():(window.DB||{});}catch(e){return window.DB||{};} }
  function esc(v){ return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];}); }
  function num(v){ if(typeof window.gp_num==='function') return window.gp_num(v); var n=Number(String(v||0).replace(/\s/g,'').replace(/[^0-9,.-]/g,'').replace(',','.')); return isFinite(n)?n:0; }
  function money(v){ if(typeof window.gp_money==='function') return window.gp_money(v); return Math.round(num(v)).toLocaleString('fr-FR')+' FCFA'; }
  function uname(){
    // Priorité absolue : nom verrouillé par username-lock.js
    if(window.GP_USER_NAME) return window.GP_USER_NAME;
    var u=window.currentUser||{}; var data=db();
    var emp=(data.employes||[]).find(function(e){return e.email&&u.email&&String(e.email).toLowerCase()===String(u.email).toLowerCase();});
    var full='';
    if(emp){ full=[emp.prenom, emp.nom].map(function(x){return String(x||'').trim();}).filter(Boolean).join(' '); }
    if(!full){
      full=String(localStorage.getItem('gp_session_name')||localStorage.getItem('gp_user_name')||localStorage.getItem('profilDisplayName')||'').trim();
    }
    if(!full && u){ full=[u.prenom||u.firstName, u.nom||u.lastName].map(function(x){return String(x||'').trim();}).filter(Boolean).join(' '); }
    if(!full && u && u.displayName) full=String(u.displayName).trim();
    return full||'Utilisateur';
  }
  function normalize(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
  function firstOf(o, keys){ for(var i=0;i<keys.length;i++){ if(o&&o[keys[i]]!=null&&String(o[keys[i]]).trim()!=='') return o[keys[i]]; } return ''; }
  function dateText(d){ try{return new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'});}catch(e){return d||'—';} }
  function nav(page){ if(typeof window.navigate==='function') window.navigate(page); }
  function setBienTypeFilter(type){ try{ localStorage.setItem('gp_biens_type_filter', type||''); sessionStorage.setItem('gp_biens_type_filter', type||''); }catch(e){} nav('biens'); setTimeout(applyDashboardFilters,80); }
  function setPaymentFilter(kind){ try{ sessionStorage.setItem('gp_paiements_filter', kind||''); }catch(e){} if(kind==='late'){ nav('avenir'); setTimeout(function(){ if(typeof window.filterAvenir==='function') window.filterAvenir('retard'); },90); } else { nav('paiements'); } }
  function applyDashboardFilters(){
    var type=''; try{ type=sessionStorage.getItem('gp_biens_type_filter')||localStorage.getItem('gp_biens_type_filter')||''; }catch(e){}
    if(type){ var input=document.getElementById('biensSearch'); if(input){ input.value=type; if(typeof window.renderBiensCards==='function') window.renderBiensCards(true); else if(typeof window.renderTable==='function') window.renderTable('biens'); } }
  }
  function rentMonths(){ var m=parseInt(localStorage.getItem('gp_dashboard_rent_months')||'6',10); return (m===1||m===12)?m:6; }
  function setRentMonths(m){ m=parseInt(m||6,10); if(!(m===1||m===6||m===12)) m=6; try{localStorage.setItem('gp_dashboard_rent_months', String(m));}catch(e){} setTimeout(function(){ if(document.getElementById('page-dashboard')) render({force:true}); },0); }
  function rentFilterButtons(){ var active=rentMonths(); return '<div class="gd-segment" aria-label="Filtre période loyers"><button class="'+(active===1?'active':'')+'" onclick="window.gdSetRentMonths&&window.gdSetRentMonths(1)">1 mois</button><button class="'+(active===6?'active':'')+'" onclick="window.gdSetRentMonths&&window.gdSetRentMonths(6)">6 mois</button><button class="'+(active===12?'active':'')+'" onclick="window.gdSetRentMonths&&window.gdSetRentMonths(12)">12 mois</button></div>'; }
  function dashboardDateWidget(){ return '<div class="gd-date-widget gd-date-widget-noicon" onclick="window.gdToggleCalendar&&window.gdToggleCalendar()" title="Afficher le calendrier" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();window.gdToggleCalendar&&window.gdToggleCalendar()}"><div><strong id="gdDateText">--</strong><small id="gdTimeText">--:--</small></div></div>'; }
  function monthCalendarHtml(d){
    d=d||new Date();
    var y=d.getFullYear(), m=d.getMonth();
    var first=new Date(y,m,1), start=(first.getDay()+6)%7, days=new Date(y,m+1,0).getDate(), today=new Date();
    var cells='', names=['L','M','M','J','V','S','D'];
    names.forEach(function(n){ cells+='<b>'+n+'</b>'; });
    for(var i=0;i<start;i++) cells+='<em></em>';
    for(var day=1;day<=days;day++){
      var cls=(day===today.getDate()&&m===today.getMonth()&&y===today.getFullYear())?' class="today"':'';
      cells+='<span'+cls+'>'+day+'</span>';
    }
    var label=d.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
    return '<div class="gd-calendar-pop" id="gdCalendarPop"><div class="gd-cal-head"><strong>'+esc(label)+'</strong><button type="button" onclick="event.stopPropagation();window.gdCloseCalendar&&window.gdCloseCalendar()"><span class="material-symbols-rounded">close</span></button></div><div class="gd-cal-grid">'+cells+'</div></div>';
  }
  function ensureCalendarPop(){ var root=document.querySelector('.gd-hero'); if(!root||document.getElementById('gdCalendarPop')) return; root.insertAdjacentHTML('beforeend', monthCalendarHtml(new Date())); }
  function updateDateTime(){
    var d=new Date();
    var dateEl=document.getElementById('gdDateText'), timeEl=document.getElementById('gdTimeText');
    if(dateEl) dateEl.textContent=d.toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    if(timeEl) timeEl.textContent=d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  }
  function toggleCalendar(){ ensureCalendarPop(); var pop=document.getElementById('gdCalendarPop'); if(pop) pop.classList.toggle('show'); }
  function closeCalendar(){ var pop=document.getElementById('gdCalendarPop'); if(pop) pop.classList.remove('show'); }
  function typeSelect(){ return '<select class="gd-type-select" onchange="window.gdOpenBienType&&window.gdOpenBienType(this.value)" aria-label="Choisir un type de bien"><option value="">Choix du type de bien</option>'+typeOrder.map(function(t){return '<option value="'+esc(t)+'">'+esc(t)+'</option>';}).join('')+'</select>'; }

  function period(){
    var data=db(), now=new Date(), y=now.getFullYear(), m=now.getMonth();
    var pays=(data.paiements||[]).filter(function(p){var d=new Date(p.date||p.datePaiement||p.echeance);return !isNaN(d)&&d.getFullYear()===y&&d.getMonth()===m;});
    var deps=(data.depenses||[]).filter(function(p){var d=new Date(p.date);return !isNaN(d)&&d.getFullYear()===y&&d.getMonth()===m;});
    var rev=pays.reduce(function(s,p){return s+num(p.paye||p.montantPaye||p.montant||p.loyer);},0);
    var dep=deps.reduce(function(s,p){return s+num(p.montant);},0);
    var late=typeof window.getPaiementEcheances==='function'
      ? window.getPaiementEcheances().filter(function(r){return r.cat==='retard';}).length
      : (data.paiements||[]).filter(function(p){return num(p.reste||p.impaye||p.solde)>0;}).length;
    return {rev:rev,dep:dep,late:late};
  }

  var typeOrder=['Immeuble','Studio','Appartement','Maison','Villa','Local commercial','Terrain','Bureau'];
  var typeMontants = {}; /* mis à jour dans build() pour usage dans draw() */
  function typeCounts(){
    var counts={}; typeOrder.forEach(function(t){counts[t]=0;});
    (db().biens||[]).forEach(function(b){
      var n=normalize(b.type||b.categorie||'');
      var match=typeOrder.find(function(t){return normalize(t)===n;}) || null;
      if(match) counts[match]++; else if(n) counts['Appartement']++;
    });
    return counts;
  }
  function stats(){ var data=db(), p=period(); return {biens:(data.biens||[]).length, locataires:(data.locataires||[]).length, rev:p.rev, dep:p.dep, late:p.late}; }

  function lastPayments(){
    return (db().paiements||[]).slice().sort(function(a,b){return new Date(b.date||b.datePaiement||b.echeance)-new Date(a.date||a.datePaiement||a.echeance);}).slice(0,3);
  }
  function alertRows(){
    if(typeof window.getPaiementEcheances==='function'){
      return window.getPaiementEcheances().filter(function(r){return r.cat==='retard';}).slice(0,3);
    }
    return (db().paiements||[]).filter(function(p){return num(p.reste||p.impaye||p.solde)>0;}).slice(0,3);
  }

  function build(){
    var s=stats(), counts=typeCounts(), totalTypes=typeOrder.reduce(function(a,t){return a+counts[t];},0)||1;
    /* Calcul montant loyer total par type de bien */
    var typeMontants = {}; typeOrder.forEach(function(t){ typeMontants[t]=0; });
    (db().biens||[]).forEach(function(b){
      var n=normalize(firstOf(b,['type','typeBien','categorie'])||'');
      var match=typeOrder.find(function(t){return normalize(t)===n;})||null;
      if(match) typeMontants[match]+=num(b.loyer||b.montantLoyer||b.loyerMensuel||0);
    });
    var typeList=typeOrder.map(function(t,i){ var c=counts[t], pct=Math.round(c/totalTypes*1000)/10, mnt=typeMontants[t]; var mntStr=mnt>0?' · '+money(mnt):''; return '<button type="button" class="gd-type-row" onclick="window.gdOpenBienType&&window.gdOpenBienType(\''+esc(t).replace(/'/g,'&#39;')+'\')" title="Voir les biens : '+esc(t)+'"><span class="gd-dot d'+i+'"></span><span>'+esc(t)+'</span><strong>'+c+' <em>('+pct+'%)</em>'+esc(mntStr)+'</strong></button>'; }).join('');
    var pays=lastPayments().map(function(p){
      var loc=firstOf(p,['locataire','tenant','nomLocataire'])||'Locataire';
      var bien=firstOf(p,['bien','logement','bienNom'])||'Bien';
      var amount=num(p.paye||p.montantPaye||p.montant||p.loyer);
      return '<tr class="gd-click-row" onclick="window.gdOpenPayments&&window.gdOpenPayments(\'paid\')"><td><span class="gd-avatar">'+esc(String(loc).slice(0,2).toUpperCase())+'</span>'+esc(loc)+'</td><td>'+esc(bien)+'</td><td>'+money(amount)+'</td><td>'+dateText(p.date||p.datePaiement||p.echeance)+'</td><td><span class="gd-paid">Payé</span></td></tr>';
    }).join('') || '<tr><td colspan="5" class="gd-empty-row">Aucun loyer encaissé pour le moment</td></tr>';
    var alerts=alertRows().map(function(p){
      var loc=firstOf(p,['locataire','tenant','nomLocataire'])||'Locataire';
      var bien=firstOf(p,['locative','bien','logement','bienNom'])||'Bien';
      var montant=num(p.loyer||p.reste||p.impaye||p.solde||0);
      var jours=p.diff!=null?Math.abs(p.diff):null;
      var label=jours!=null?'En retard de '+jours+' jour'+(jours>1?'s':''):'Loyer en retard';
      return '<div class="gd-alert" onclick="window.gdOpenPayments&&window.gdOpenPayments(\'late\')"><span></span><div><strong>'+label+'</strong><small>'+esc(loc)+' - '+esc(bien)+'</small></div><em>'+money(montant)+'</em></div>';
    }).join('') || '<div class="gd-empty-alert">Aucune alerte récente</div>';

    return '<div class="genius-desk-v34">'+
      '<section class="gd-hero"><div><h1><em>Bonjour, <span>'+esc(uname())+'</span> 👋</em></h1><p>Voici un aperçu de votre activité.</p></div>'+dashboardDateWidget()+'</section>'+
      '<section class="gd-kpis">'+
        card('home','Biens',s.biens,'biens','Biens')+
        card('groups','Locataires',s.locataires,'locataires','Locataires')+
        card('account_balance_wallet','Loyers (mois)',money(s.rev),'','Loyers')+
        card('payments','Dépenses (mois)',money(s.dep),'','Dépenses')+
        '<article class="gd-kpi gd-alert-kpi" onclick="window.gdOpenPayments&&window.gdOpenPayments(\'late\')"><div class="gd-kpi-icon red"><span class="material-symbols-rounded">notifications</span></div><div><h3>Alertes <b>'+s.late+'</b></h3><p>'+s.late+' loyer'+(s.late>1?'s':'')+' en retard</p></div><span class="material-symbols-rounded gd-arrow">chevron_right</span></article>'+ 
      '</section>'+
      '<section class="gd-grid">'+
        '<article class="gd-panel gd-evolution-panel"><div class="gd-panel-head"><h2>Évolution loyers &amp; dépenses</h2>'+rentFilterButtons()+'</div><div class="gd-chart-legend"><span class="gdl-loyers"><i></i>Loyers encaissés</span><span class="gdl-depenses"><i></i>Dépenses</span></div><div class="gd-chart"><canvas id="gdRentChart"></canvas></div></article>'+ 
        '<article class="gd-panel"><div class="gd-panel-head"><h2>Répartition des biens</h2>'+typeSelect()+'</div><div class="gd-donut-wrap"><div class="gd-donut"><canvas id="gdGoodsChart"></canvas><div class="gd-donut-center"><strong>'+s.biens+'</strong><span>Total</span></div></div><div class="gd-type-list">'+typeList+'</div></div></article>'+ 
        '<article class="gd-panel gd-table-panel"><div class="gd-panel-head"><h2>Derniers loyers encaissés</h2><button onclick="window.gdOpenPayments&&window.gdOpenPayments(\'paid\')">Voir tout</button></div><div class="gd-table-wrap"><table><thead><tr><th>Locataire</th><th>Bien</th><th>Montant</th><th>Date</th><th>Statut</th></tr></thead><tbody>'+pays+'</tbody></table></div></article>'+ 
        '<article class="gd-panel gd-alerts-panel"><div class="gd-panel-head"><h2>Alertes récentes <b>'+s.late+'</b></h2><button onclick="window.gdOpenPayments&&window.gdOpenPayments(\'late\')">Voir tout</button></div>'+alerts+'</article>'+ 
      '</section>'+
    '</div>';
  }
  function card(icon,label,value,sub,page){ var target=String(page||'').toLowerCase(); if(target==='loyers') target='paiements'; if(target==='dépenses'||target==='depenses') target='depenses'; return '<article class="gd-kpi" onclick="if(window.navigate)navigate(\''+target+'\')"><div class="gd-kpi-icon"><span class="material-symbols-rounded">'+icon+'</span></div><div><h3>'+esc(label)+'</h3><strong>'+esc(value)+'</strong><p class="'+(sub?'':'gd-kpi-sub-empty')+'">'+esc(sub)+'</p></div></article>';}

  function chartData(months){
    var labels=[], vals=[], deps=[], dates=[], now=new Date();
    if(months===1){
      /* filtre 1 mois : granularité journalière */
      var year=now.getFullYear(), month=now.getMonth();
      var daysInMonth=new Date(year,month+1,0).getDate();
      for(var i=1;i<=daysInMonth;i++){
        var d=new Date(year,month,i);
        labels.push(i+' '+d.toLocaleDateString('fr-FR',{month:'short'}).replace('.',''));
        vals.push(0); deps.push(0); dates.push(d);
      }
      (db().paiements||[]).forEach(function(p){
        var pd=new Date(p.date||p.datePaiement||p.echeance); if(isNaN(pd)) return;
        if(pd.getMonth()===month&&pd.getFullYear()===year){
          var idx=pd.getDate()-1;
          if(idx>=0&&idx<daysInMonth) vals[idx]+=num(p.paye||p.montantPaye||p.montant||p.loyer);
        }
      });
      (db().depenses||[]).forEach(function(p){
        var pd=new Date(p.date||p.datePaiement); if(isNaN(pd)) return;
        if(pd.getMonth()===month&&pd.getFullYear()===year){
          var idx=pd.getDate()-1;
          if(idx>=0&&idx<daysInMonth) deps[idx]+=num(p.montant||p.amount||0);
        }
      });
    } else {
      /* filtre 6 ou 12 mois : granularité mensuelle */
      for(var i=months-1;i>=0;i--){
        var d=new Date(now.getFullYear(),now.getMonth()-i,1);
        var mStr=d.toLocaleDateString('fr-FR',{month:'short'}).replace('.',''); mStr=mStr.charAt(0).toUpperCase()+mStr.slice(1); var lbl=mStr+' '+String(d.getFullYear()).slice(2);
        labels.push(lbl); vals.push(0); deps.push(0); dates.push(d);
      }
      (db().paiements||[]).forEach(function(p){
        var pd=new Date(p.date||p.datePaiement||p.echeance); if(isNaN(pd)) return;
        for(var j=0;j<months;j++){
          if(pd.getMonth()===dates[j].getMonth()&&pd.getFullYear()===dates[j].getFullYear())
            vals[j]+=num(p.paye||p.montantPaye||p.montant||p.loyer);
        }
      });
      (db().depenses||[]).forEach(function(p){
        var pd=new Date(p.date||p.datePaiement); if(isNaN(pd)) return;
        for(var j=0;j<months;j++){
          if(pd.getMonth()===dates[j].getMonth()&&pd.getFullYear()===dates[j].getFullYear())
            deps[j]+=num(p.montant||p.amount||0);
        }
      });
    }
    return {labels:labels,vals:vals,deps:deps};
  }
  function draw(){
    if(!window.Chart) return;
    var r=document.getElementById('gdRentChart'), g=document.getElementById('gdGoodsChart');
    if(r){
      if(window.gdRentChartObj) window.gdRentChartObj.destroy();
      var d=chartData(rentMonths());
      window.gdRentChartObj=new Chart(r,{
        type:'line',
        data:{
          labels:d.labels,
          datasets:[
            {
              label:'Loyers encaissés',
              data:d.vals,
              borderColor:'#d4af37',
              backgroundColor:'rgba(212,175,55,0.12)',
              fill:true,
              tension:0.4,
              pointRadius:5,
              pointHoverRadius:8,
              pointBackgroundColor:'#d4af37',
              pointBorderColor:'#fff',
              pointBorderWidth:2,
              borderWidth:2.5
            },
            {
              label:'Dépenses',
              data:d.deps,
              borderColor:'#ef4444',
              backgroundColor:'rgba(239,68,68,0.08)',
              fill:true,
              tension:0.4,
              pointRadius:5,
              pointHoverRadius:8,
              pointBackgroundColor:'#ef4444',
              pointBorderColor:'#fff',
              pointBorderWidth:2,
              borderWidth:2.5,
              borderDash:[5,4]
            }
          ]
        },
        options:{
          responsive:true,
          maintainAspectRatio:false,
          interaction:{mode:'index',intersect:false},
          plugins:{
            legend:{display:false},
            tooltip:{
              backgroundColor:'rgba(17,24,39,0.95)',
              titleColor:'rgba(255,255,255,0.9)',
              bodyColor:'rgba(255,255,255,0.75)',
              borderColor:'rgba(255,255,255,0.1)',
              borderWidth:1,
              padding:12,
              callbacks:{
                title:function(items){ return items[0]?items[0].label:''; },
                label:function(x){
                  var prefix=x.datasetIndex===0?'💰 Loyers : ':'📉 Dépenses : ';
                  return prefix+Number(x.raw).toLocaleString('fr-FR')+' FCFA';
                },
                afterBody:function(items){
                  if(items.length>=2){
                    var loyer=items[0]?items[0].raw:0, dep=items[1]?items[1].raw:0;
                    var net=loyer-dep;
                    return ['─────────────','Net : '+(net>=0?'+':'')+Number(net).toLocaleString('fr-FR')+' FCFA'];
                  }
                  return [];
                }
              }
            }
          },
          scales:{
            x:{
              ticks:{
                color: document.body.classList.contains('dark') ? 'rgba(255,255,255,0.80)' : 'rgba(30,30,30,0.80)',
                font:{size:10,weight:'600'},
                maxRotation: rentMonths()===1?45:0,
                minRotation: rentMonths()===1?45:0,
                autoSkip: rentMonths()===1?true:false,
                maxTicksLimit: rentMonths()===1?15:undefined
              },
              grid:{color: document.body.classList.contains('dark') ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
            },
            y:{
              beginAtZero:true,
              ticks:{color: document.body.classList.contains('dark') ? 'rgba(255,255,255,0.70)' : 'rgba(30,30,30,0.75)', font:{size:11},callback:function(v){
                if(v>=1000000) return (v/1000000).toFixed(1)+'M FCFA';
                if(v>=1000) return (v/1000).toFixed(0)+'k';
                return v.toLocaleString('fr-FR');
              }},
              grid:{color:'rgba(255,255,255,0.08)'}
            }
          },
          /* ---- Affichage des valeurs sur les granules ---- */
          elements:{
            point:{radius:5,hoverRadius:8}
          },
          animation:{
            onComplete:function(){
              var chart=this; if(!chart||!chart.ctx) return;
              var ctx=chart.ctx;
              ctx.save();
              chart.data.datasets.forEach(function(dataset,di){
                var meta=chart.getDatasetMeta(di);
                meta.data.forEach(function(pt,idx){
                  var val=dataset.data[idx];
                  if(!val||val===0) return;
                  var label;
                  if(val>=1000000) label=(val/1000000).toFixed(1)+'M';
                  else if(val>=1000) label=(val/1000).toFixed(0)+'k';
                  else label=val.toLocaleString('fr-FR');
                  ctx.font='bold 9px Inter,sans-serif';
                  ctx.textAlign='center';
                  ctx.textBaseline='bottom';
                  var isDark=document.body.classList.contains('dark'); ctx.fillStyle=di===0?(isDark?'#f5d56a':'#b88a00'):(isDark?'#ff6b6b':'#cc2200');
                  ctx.fillText(label, pt.x, pt.y-8);
                });
              });
              ctx.restore();
            }
          }
        }
      });
    }
    if(g){ if(window.gdGoodsChartObj) window.gdGoodsChartObj.destroy(); var counts=typeCounts(); window.gdGoodsChartObj=new Chart(g,{type:'doughnut',data:{labels:typeOrder,datasets:[{data:typeOrder.map(function(t){return counts[t];}),backgroundColor:['#1e88ff','#22c55e','#7c3aed','#f59e0b','#ef4444','#d946ef','#06b6d4','#eab308'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',onClick:function(evt,els){ if(els&&els.length){ var i=els[0].index; setBienTypeFilter(typeOrder[i]||''); } },plugins:{legend:{display:false},tooltip:{callbacks:{label:function(x){ var t=typeOrder[x.dataIndex]||x.label; var mnt=typeMontants&&typeMontants[t]||0; var mntStr=mnt>0?' – '+money(mnt):''; return x.label+': '+x.parsed+' bien'+(x.parsed>1?'s':'')+mntStr; }}}}}}); }
  }
  function enhanceTopbarUser(){
    var box=document.querySelector('.topbar .user-box'); if(!box) return;
    box.classList.add('gd-user-topbar');
    var role=box.querySelector('.user-role'); if(role) role.style.display='none';
    var name=box.querySelector('.user-name');
    if(!name){
      name=document.createElement('span');
      name.className='user-name gd-user-name-injected';
      var info=box.querySelector('.user-info');
      if(info) info.insertBefore(name, info.firstChild);
      else {
        var avatarRef=document.getElementById('topbarAvatar')||box.querySelector('.user-avatar');
        if(avatarRef && avatarRef.parentNode===box) avatarRef.insertAdjacentElement('afterend', name);
        else box.appendChild(name);
      }
    }
    name.textContent=uname(); name.title=uname();
    var avatar=document.getElementById('topbarAvatar')||box.querySelector('.user-avatar');
    if(avatar && !avatar.querySelector('img')) avatar.innerHTML='<span class="material-symbols-rounded">person</span>'; if(avatar){ avatar.style.display='flex'; avatar.style.alignItems='center'; avatar.style.justifyContent='center'; }
    var chev=box.querySelector('.user-chevron');
    if(!chev){ chev=document.createElement('span'); chev.className='material-symbols-rounded user-chevron'; chev.textContent='expand_more'; var menu=box.querySelector('.user-menu'); if(menu) box.insertBefore(chev, menu); else box.appendChild(chev); }
    chev.textContent='expand_more'; chev.style.display='inline-flex'; chev.style.visibility='visible'; chev.style.opacity='.82'; chev.style.alignItems='center'; chev.style.justifyContent='center';
    var settings=document.querySelectorAll('.topbar .tb-icon-btn[title*="Param"], .topbar .tb-icon-btn[aria-label*="Param"], .topbar .icon-btn[title*="Param"], .topbar .icon-btn[aria-label*="Param"], #gpMobileSettingsBtn');
    settings.forEach(function(el){ el.style.display='none'; });
    document.querySelectorAll('.topbar button, .topbar a').forEach(function(el){ var txt=(el.textContent||'').toLowerCase(); if(txt.indexOf('settings')>-1 || txt.indexOf('param')>-1) el.style.display='none'; });
  }
  window.gdOpenBienType=setBienTypeFilter; window.gdOpenPayments=setPaymentFilter; window.gdSetRentMonths=setRentMonths; window.gdToggleCalendar=toggleCalendar; window.gdCloseCalendar=closeCalendar; window.gdToggleRentMonths=function(){setRentMonths(rentMonths()===6?12:6);}; window.gdApplyDashboardFilters=applyDashboardFilters;
  var _lastRenderAt=0, _lastSignature='', _chartPreloadStarted=false;
  function startChartPreload(){ if(_chartPreloadStarted) return; _chartPreloadStarted=true; try{ if(window.ensureChart) window.ensureChart(); }catch(e){} }
  function dashboardSignature(){ var d=db()||{}; return [uname(), (d.biens||[]).length, (d.locataires||[]).length, (d.locatives||[]).length, (d.paiements||[]).length, (d.depenses||[]).length, rentMonths()].join('|'); }
  function render(opts){ opts=opts||{}; var page=document.getElementById('page-dashboard'); if(!page) return; startChartPreload(); var active=page.classList.contains('active') || !document.querySelector('.page.active'); if(!active && !opts.force) return; var now=Date.now(), sig=dashboardSignature(); if(!opts.force && page.querySelector('.genius-desk-v34') && sig===_lastSignature && (now-_lastRenderAt)<900){ enhanceTopbarUser(); updateDateTime(); draw(); return; } _lastRenderAt=now; _lastSignature=sig; page.classList.add('gd-rendering'); page.innerHTML=build(); enhanceTopbarUser(); updateDateTime(); requestAnimationFrame(function(){ draw(); page.classList.remove('gd-rendering'); page.classList.add('no-anim'); }); }
  window.renderDashboard=render;
  document.addEventListener('DOMContentLoaded',function(){ startChartPreload(); enhanceTopbarUser(); if(document.getElementById('page-dashboard')&&document.getElementById('page-dashboard').classList.contains('active')&&!document.querySelector('#page-dashboard .genius-desk-v34')) render(); setTimeout(applyDashboardFilters,120); setInterval(enhanceTopbarUser,1500); setInterval(updateDateTime,1000); document.addEventListener('click',function(e){ var pop=document.getElementById('gdCalendarPop'); if(pop && pop.classList.contains('show') && !e.target.closest('.gd-date-widget') && !e.target.closest('.gd-calendar-pop')) closeCalendar(); }); });
  window.addEventListener('load',function(){ enhanceTopbarUser(); startChartPreload(); if(document.getElementById('page-dashboard')&&document.getElementById('page-dashboard').classList.contains('active')&&!document.querySelector('#page-dashboard .genius-desk-v34')) render(); });
  window.addEventListener('gp:auth-changed',function(){ setTimeout(function(){enhanceTopbarUser(); if(document.getElementById('page-dashboard')&&document.getElementById('page-dashboard').classList.contains('active')) render({force:true});},50); });
})();
