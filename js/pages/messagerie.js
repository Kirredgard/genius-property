/* Genius Property V16 — Module Messagerie
   Objectif: centraliser création, validation et état de lecture des conversations. */
(function(){
  'use strict';
  const MODULE='messagerie';
  const esc = v => (window.gp_esc ? window.gp_esc(v) : String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])));
  const uid = p => (window.gp_uid ? window.gp_uid(p||'msg') : `${p||'msg'}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
  const toast = (m,t) => typeof window.toast === 'function' ? window.toast(m,t) : console.log(`[${MODULE}]`, m);
  const save = () => window.GPDB && window.GPDB.save ? window.GPDB.save(db()) : (typeof window.saveDB === 'function' ? window.saveDB() : undefined);

  function db(){
    const data = window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {});
    if(!Array.isArray(data.messages)) data.messages=[];
    if(!Array.isArray(data.conversations)) data.conversations=[];
    window.DB = data;
    return data;
  }

  function getEmployeeContacts(){
    const d=db();
    return (Array.isArray(d.employes)?d.employes:[]).map((e,idx)=>({
      id:'EP-'+(e.id ?? (e.email ? String(e.email).replace(/[^a-z0-9]/gi,'_') : 'idx'+idx)),
      nom: `${e.prenom||''} ${e.nom||''}`.trim() || e.email || `Employé ${idx+1}`,
      role:e.fonction || e.poste || 'Employé',
      email:e.email || ''
    }));
  }

  function validateMessage(m){
    const errors=[];
    if(!m.convId && !m.vers) errors.push('Destinataire obligatoire');
    if(!String(m.objet||'').trim()) errors.push('Objet obligatoire');
    if(!String(m.corps||'').trim()) errors.push('Message obligatoire');
    if(String(m.corps||'').length>5000) errors.push('Message trop long');
    if(m.type && !['normal','urgent','info','rappel'].includes(m.type)) errors.push('Type de message invalide');
    return errors;
  }

  function ensureConversation(input){
    const d=db();
    const now=new Date().toISOString();
    let conv=null;
    if(input.convId) conv=d.conversations.find(c=>c.id===input.convId);
    if(!conv && input.vers){
      conv=d.conversations.find(c=>c.contactId===input.vers);
    }
    if(!conv){
      const contact=getEmployeeContacts().find(c=>c.id===input.vers) || {id:input.vers,nom:input.vers||'Contact',role:input.versRole||'Employé'};
      conv={
        id:uid('conv'),
        contactId:contact.id,
        contact:contact.nom,
        contactRole:contact.role,
        dernierMsg:'',
        nonLus:0,
        date:now,
        type:input.type||'normal'
      };
      d.conversations.unshift(conv);
    }
    return conv;
  }

  function sendInternalMessage(input){
    const errors=validateMessage(input);
    if(errors.length){ toast(errors[0], 'err'); return null; }
    const d=db();
    const conv=ensureConversation(input);
    const now=new Date().toISOString();
    const msg={
      id:uid('msg'),
      convId:conv.id,
      de:input.de || 'Direction',
      vers:input.vers || conv.contactId,
      versRole:input.versRole || conv.contactRole || 'Employé',
      objet:String(input.objet||'').trim(),
      corps:String(input.corps||'').trim(),
      date:now,
      lu:false,
      type:input.type || 'normal',
      rappel:!!input.rappel
    };
    d.messages.push(msg);
    conv.dernierMsg=msg.corps;
    conv.objet=msg.objet;
    conv.date=now;
    conv.type=msg.type;
    save();
    if(typeof window.renderConvList==='function') window.renderConvList();
    if(typeof window.updateMsgBadge==='function') window.updateMsgBadge();
    return msg;
  }

  function markConversationRead(convId){
    const d=db();
    const conv=d.conversations.find(c=>c.id===convId);
    if(conv) conv.nonLus=0;
    d.messages.filter(m=>m.convId===convId).forEach(m=>m.lu=true);
    save();
  }

  function deleteConversation(convId){
    const d=db();
    d.conversations=d.conversations.filter(c=>c.id!==convId);
    d.messages=d.messages.filter(m=>m.convId!==convId);
    save();
    if(typeof window.renderMessages==='function') window.renderMessages();
    if(typeof window.updateMsgBadge==='function') window.updateMsgBadge();
  }

  function getMessageStats(){
    const d=db();
    return {
      conversations:d.conversations.length,
      messages:d.messages.length,
      nonLus:d.messages.filter(m=>!m.lu).length,
      urgents:d.messages.filter(m=>m.type==='urgent' && !m.lu).length
    };
  }

  // Compatible avec le formulaire existant si les IDs sont présents.
  const legacyEnvoyer = window.envoyerNouveauMsg;
  window.envoyerNouveauMsg = function(){
    const dest=document.getElementById('nm-dest')?.value || document.getElementById('msg-new-dest')?.value || '';
    const objet=document.getElementById('nm-objet')?.value || document.getElementById('msg-new-objet')?.value || '';
    const corps=document.getElementById('nm-corps')?.value || document.getElementById('msg-new-corps')?.value || '';
    const type=document.getElementById('nm-type')?.value || 'normal';
    if(dest || objet || corps){
      const msg=sendInternalMessage({vers:dest,objet,corps,type});
      if(msg){
        if(typeof window.closeNewMsgModal==='function') window.closeNewMsgModal();
        toast('Message envoyé ✓');
      }
      return;
    }
    if(typeof legacyEnvoyer==='function') return legacyEnvoyer();
  };

  window.GPMessagerie={
    version:'16.0.0',
    db,
    getEmployeeContacts,
    validateMessage,
    sendInternalMessage,
    markConversationRead,
    deleteConversation,
    getMessageStats,
    esc
  };

  document.addEventListener('DOMContentLoaded', () => {
    db();
    // Enregistrement auprès du routeur moderne pour la page 'messages'
    if (window.GPNavigation && typeof window.GPNavigation.registerRenderer === 'function') {
      window.GPNavigation.registerRenderer('messages', function() {
        if (typeof window.renderMessages === 'function') window.renderMessages();
      });
    }
  });
})();
