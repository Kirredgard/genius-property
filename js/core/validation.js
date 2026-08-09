/* Genius Property V6 — Validations réutilisables */
(function(){
  'use strict';
  var GP = window.GP = window.GP || {};
  GP.validate = {
    positiveAmount: function(value){ return (GP.num ? GP.num(value) : Number(value)) > 0; },
    nonNegativeAmount: function(value){ return (GP.num ? GP.num(value) : Number(value)) >= 0; },
    phone: function(value){
      var v=String(value||'').replace(/\s/g,'');
      return !v || /^[0-9+]{8,15}$/.test(v);
    },
    email: function(value){
      var v=String(value||'').trim();
      return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    },
    dateAfter: function(end,start){
      if(!end || !start) return true;
      var a=new Date(start), b=new Date(end);
      return !isNaN(a) && !isNaN(b) && b > a;
    }
  };
})();
