/* Genius Property V22 — License Guard
   V22 beta: licensing is not yet migrated. Keep the application usable while
   Supabase Auth/RLS is tested. V23 will add a real license table + Edge Function.
*/
(function(){
  'use strict';
  var LICENSE_TYPES={trial:{label:'Trial',maxUsers:1,maxProperties:20},solo:{label:'Solo',maxUsers:1,maxProperties:50},agency:{label:'Agence',maxUsers:5,maxProperties:300},enterprise:{label:'Enterprise',maxUsers:10,maxProperties:null},lifetime:{label:'Lifetime',maxUsers:10,maxProperties:null}};
  var state={agency:null,license:{type:'trial',status:'active',plan:LICENSE_TYPES.trial},daysLeft:null,locked:false,reason:null,lastCheck:null};
  function refresh(){state.lastCheck=new Date().toISOString();applyWriteLock();return Promise.resolve(state);}
  function canWrite(){return true;}
  function beforeWrite(){return true;}
  function canAddProperty(){return {ok:true};}
  function canAddUser(){return {ok:true};}
  function applyWriteLock(){}
  function status(){return {license:state.license,agency:state.agency,locked:false,daysLeft:null,reason:null,plans:LICENSE_TYPES,beta:true};}
  window.GPLicenseGuard={refresh:refresh,status:status,canWrite:canWrite,beforeWrite:beforeWrite,canAddProperty:canAddProperty,canAddUser:canAddUser,LICENSE_TYPES:LICENSE_TYPES};
  document.addEventListener('DOMContentLoaded',function(){setTimeout(refresh,400);});
})();
