/* Genius Property V12 — module Dépenses
   Objectif : isoler la création/validation des dépenses hors du bundle legacy.
   Ce fichier surcharge volontairement saveDepense() appelé par le HTML existant.
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
  const parseAmount = (value) => {
    if (window.GP && typeof window.GP.num === 'function') return window.GP.num(value);
    if (typeof window.num === 'function') return window.num(value);
    return Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0;
  };
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  const todayKey = () => new Date().toISOString().split('T')[0];

  function resolveDepenseType(rawType, category) {
    const type = rawType || '';
    if (type === 'bien' || type === 'agence') return type;
    return ['Entretien', 'Réparation', 'Reparation', 'Travaux'].includes(category) ? 'bien' : 'agence';
  }

  function getDepenseProprietaireName(bienLabel) {
    if (!bienLabel) return '';
    if (typeof window.getProprietaireForDepenseBien === 'function' && typeof window.getProprietaireFullName === 'function') {
      const p = window.getProprietaireForDepenseBien(bienLabel);
      return p ? (window.getProprietaireFullName(p) || p.nom || '') : '';
    }
    return '';
  }

  function hasSimilarDepense(data) {
    const key = [data.type, data.date, normalize(data.libelle), normalize(data.bien), Math.round(data.montant)].join('|');
    return (db().depenses || []).some(d => {
      const other = [
        resolveDepenseType(d.type, d.cat),
        d.date || '',
        normalize(d.libelle),
        normalize(d.bien),
        Math.round(parseAmount(d.montant))
      ].join('|');
      return other === key;
    });
  }

  function validateDepenseForm() {
    const type = resolveDepenseType(valueOf('d-type'), valueOf('d-cat'));
    const data = {
      libelle: valueOf('d-lib').trim(),
      type,
      cat: valueOf('d-cat').trim(),
      montantRaw: valueOf('d-mnt').trim(),
      montant: parseAmount(valueOf('d-mnt')),
      date: valueOf('d-date').trim() || todayKey(),
      bien: valueOf('d-bien').trim(),
      facturable: valueOf('d-facturable') || (type === 'bien' ? 'oui' : 'non')
    };

    if (!data.libelle) return { ok:false, field:'d-lib', message:'Le libellé de la dépense est requis' };
    if (data.libelle.length < 3) return { ok:false, field:'d-lib', message:'Le libellé doit contenir au moins 3 caractères' };
    if (!data.cat) return { ok:false, field:'d-cat', message:'La catégorie est requise' };
    if (!data.montantRaw) return { ok:false, field:'d-mnt', message:'Le montant est requis' };
    if (!Number.isFinite(data.montant) || data.montant <= 0) {
      return { ok:false, field:'d-mnt', message:'Le montant doit être supérieur à 0' };
    }
    if (data.montant > 1000000000) {
      return { ok:false, field:'d-mnt', message:'Le montant semble anormalement élevé' };
    }

    const dt = new Date(data.date);
    if (!data.date || Number.isNaN(dt.getTime())) {
      return { ok:false, field:'d-date', message:'La date de dépense est invalide' };
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    if (dt > tomorrow) {
      return { ok:false, field:'d-date', message:'La date de dépense ne peut pas être dans le futur' };
    }

    if (data.type === 'bien') {
      if (!data.bien) return { ok:false, field:'d-bien', message:'Sélectionnez le bien concerné' };
      if (typeof window.findBienForDepense === 'function') {
        const found = window.findBienForDepense(data.bien);
        if (!found || !found.bien) return { ok:false, field:'d-bien', message:'Le bien sélectionné est introuvable' };
      }
    } else {
      data.bien = '';
      data.facturable = 'non';
    }

    if (hasSimilarDepense(data)) {
      return { ok:false, field:'d-lib', message:'Une dépense similaire existe déjà pour cette date et ce montant' };
    }

    return { ok:true, data };
  }

  async function saveDepense() {
    const result = validateDepenseForm();
    if (!result.ok) return fieldError(result.field, result.message);

    const _db = window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {});
    if (!Array.isArray(_db.depenses)) _db.depenses = [];
    const data = result.data;
    const depense = {
      libelle: data.libelle,
      type: data.type,
      cat: data.cat,
      montant: String(Math.round(data.montant)),
      date: data.date,
      bien: data.type === 'bien' ? data.bien : '',
      proprietaire: data.type === 'bien' ? getDepenseProprietaireName(data.bien) : '',
      facturable: data.facturable,
      factureData: window.depFactureData || null,
      createdAt: new Date().toISOString()
    };

    _db.depenses.unshift(depense);

    if (typeof window.auditLog === 'function') {
      window.auditLog('Ajout', 'Dépenses', `${depense.libelle} — ${depense.montant} FCFA`);
    }
    if (window.GPDB && window.GPDB.save) await window.GPDB.save(_db);
    else if (typeof window.saveDB === 'function') { window.DB = _db; window.saveDB(); }
    if (typeof window.closeDepModal === 'function') window.closeDepModal();
    if (typeof window.renderDepenses === 'function') window.renderDepenses();
    if (typeof window.renderRapports === 'function') window.renderRapports();
    if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    notify('Dépense ajoutée ✓');
  }

  async function safeDeleteDepense(index) {
    const _db2 = window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {});
    const row = (_db2.depenses || [])[index];
    if (!row) return notify('Dépense introuvable', 'err');
    if (!(await GPForms.confirm('Supprimer cette dépense ?', { title:'Suppression', okText:'Supprimer' }))) return;
    _db2.depenses.splice(index, 1);
    if (typeof window.auditLog === 'function') window.auditLog('Suppression', 'Dépenses', row.libelle || 'Dépense');
    if (window.GPDB && window.GPDB.save) await window.GPDB.save(_db2);
    else if (typeof window.saveDB === 'function') { window.DB = _db; window.saveDB(); }
    if (typeof window.renderDepenses === 'function') window.renderDepenses();
    if (typeof window.renderRapports === 'function') window.renderRapports();
    notify('Dépense supprimée');
  }

  window.GPModules = window.GPModules || {};
  window.GPModules.depenses = {
    validateDepenseForm,
    saveDepense,
    safeDeleteDepense
  };
  window.saveDepense = saveDepense;

  // [cleaned] debug console statement removed
})();
