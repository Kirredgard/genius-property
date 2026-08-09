/* Genius Property V11 — module Propriétaires
   Objectif : isoler la création/validation des propriétaires hors du bundle legacy.
   Ce fichier surcharge volontairement saveProprietaire() appelé par le HTML existant.
*/
(function(){
  'use strict';

  const Forms = window.GPForms || {};
  const $ = Forms.$ || ((id) => document.getElementById(id));
  const valueOf = Forms.value || ((id) => {
    const el = $(id);
    return el ? String(el.value || '') : '';
  });
  const db = () => (window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {}));
  const save = () => (window.GPDB && window.GPDB.save ? window.GPDB.save(db()) : (typeof window.saveDB === 'function' ? window.saveDB() : undefined));
  const notify = (message, type) => {
    if (typeof window.toast === 'function') return window.toast(message, type);
    console[type === 'err' ? 'error' : 'log'](message);
  };
  const idOf = (prefix) => {
    if (typeof window.genId === 'function') return window.genId(prefix);
    if (window.GP && typeof window.GP.uid === 'function') return window.GP.uid(prefix);
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  };
  const fieldError = (id, message) => {
    if (typeof window.gp_fieldError === 'function') return window.gp_fieldError(id, message);
    const el = $(id);
    if (el) {
      el.focus();
      el.style.borderColor = '#E24B4A';
      el.addEventListener('input', () => { el.style.borderColor = ''; }, { once:true });
      el.addEventListener('change', () => { el.style.borderColor = ''; }, { once:true });
    }
    notify(message, 'err');
    return false;
  };
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  const fullName = (p) => [p?.nom || '', p?.prenom || ''].filter(Boolean).join(' ').trim();

  function validateProprietaireForm() {
    const data = {
      nom: valueOf('p-nom').trim(),
      prenom: valueOf('p-prenom').trim(),
      naiss: valueOf('p-naiss').trim(),
      adresse: valueOf('p-adresse').trim(),
      tel: valueOf('p-tel').trim(),
      email: valueOf('p-email').trim(),
      matri: valueOf('p-matri').trim()
    };

    if (!data.nom) return { ok:false, field:'p-nom', message:'Le nom du propriétaire est requis' };

    const phone = data.tel.replace(/\s/g, '');
    if (phone && !/^[0-9+]{8,15}$/.test(phone)) {
      return { ok:false, field:'p-tel', message:'Numéro de téléphone invalide' };
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { ok:false, field:'p-email', message:'Adresse email invalide' };
    }

    if (data.naiss) {
      const birth = new Date(data.naiss);
      const today = new Date();
      if (Number.isNaN(birth.getTime()) || birth > today) {
        return { ok:false, field:'p-naiss', message:'Date de naissance invalide' };
      }
    }

    const candidate = normalize(fullName(data) || data.nom);
    const duplicate = (db().proprietaires || []).some(p => normalize(fullName(p) || p.nom) === candidate);
    if (duplicate) {
      return { ok:false, field:'p-nom', message:'Un propriétaire avec ce nom existe déjà' };
    }

    return { ok:true, data };
  }

  async function saveProprietaire() {
    const result = validateProprietaireForm();
    if (!result.ok) return fieldError(result.field, result.message);

    const data = result.data;
    const photo = typeof window.getPhotoData === 'function'
      ? await window.getPhotoData('p-photo-input')
      : '';

    const _db = window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {});
    if (!Array.isArray(_db.proprietaires)) _db.proprietaires = [];

    const proprietaire = {
      id: idOf('PR'),
      nom: data.nom,
      prenom: data.prenom,
      naiss: data.naiss,
      adresse: data.adresse,
      tel: data.tel,
      email: data.email,
      matri: data.matri,
      photo: photo || '',
      createdAt: new Date().toISOString()
    };

    _db.proprietaires.push(proprietaire);

    if (typeof window.auditLog === 'function') {
      window.auditLog('Ajout', 'Propriétaires', 'Nouveau propriétaire : ' + (fullName(proprietaire) || proprietaire.nom));
    }
    window.DB = _db;
    try { localStorage.setItem('geniusproperty_db_clean_v1', JSON.stringify(_db)); } catch(e) {}
    if (window.GPDB && window.GPDB.save) await window.GPDB.save(_db);
    else if (typeof window.saveDB === 'function') { window.DB = _db; window.saveDB(); }
    if (typeof window.resetAfterSave === 'function') window.resetAfterSave('page-nv-proprietaire');
    if (typeof window.renderTable === 'function') window.renderTable('proprietaires');
    if (typeof window.renderProprietairesCards === 'function') window.renderProprietairesCards();
    if (typeof window.fillProprioBien === 'function') window.fillProprioBien();
    if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    if (typeof window.navigate === 'function') window.navigate('proprietaires');
    setTimeout(() => {
      if (typeof window.renderTable === 'function') window.renderTable('proprietaires');
      if (typeof window.renderProprietairesCards === 'function') window.renderProprietairesCards();
    }, 150);
    notify('Propriétaire enregistré avec succès ✓');
  }

  function proprietaireHasBiens(index) {
    const p = (db().proprietaires || [])[index];
    if (!p) return false;
    const targetName = normalize(fullName(p) || p.nom);
    return (db().biens || []).some(b => normalize(b.proprio) === targetName || normalize(b.proprio).includes(targetName));
  }

  async function deleteProprietaireFromDetailSafe() {
    const idx = typeof window._proprietaireDetailIdx === 'number' ? window._proprietaireDetailIdx : -1;
    if (idx < 0) return;
    if (proprietaireHasBiens(idx)) {
      return notify('Impossible de supprimer : ce propriétaire est lié à un ou plusieurs biens', 'err');
    }
    if (await GPForms.confirm('Supprimer ce propriétaire ?', { title:'Suppression', okText:'Supprimer' })) {
      (db().proprietaires || []).splice(idx, 1);
      save();
      if (typeof window.navigate === 'function') window.navigate('proprietaires');
      if (typeof window.renderProprietairesCards === 'function') window.renderProprietairesCards();
      notify('Propriétaire supprimé');
    }
  }

  window.GPModules = window.GPModules || {};
  window.GPModules.proprietaires = {
    validateProprietaireForm,
    saveProprietaire,
    proprietaireHasBiens
  };

  window.saveProprietaire = saveProprietaire;
  // Sécurise la suppression depuis la fiche détail si la fonction legacy est accessible.
  window.deleteProprietaireFromDetail = deleteProprietaireFromDetailSafe;

  // [cleaned] debug console statement removed
})();
