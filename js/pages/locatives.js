/* Genius Property V9 — module Locatives / Locations
   Objectif : isoler la création/validation des locations hors du bundle legacy.
   Ce fichier surcharge volontairement saveLocative() appelé par le HTML existant.
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
  const numberOf = (raw) => {
    if (window.GP && typeof window.GP.num === 'function') return window.GP.num(raw);
    if (typeof window.num === 'function') return window.num(raw);
    const cleaned = String(raw ?? '').replace(/[^0-9,.-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const moneyOf = (raw) => {
    if (window.GP && typeof window.GP.money === 'function') return window.GP.money(raw);
    if (typeof window.gp_money === 'function') return window.gp_money(raw);
    return Math.round(numberOf(raw)).toLocaleString('fr-FR') + ' FCFA';
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
  const todayISO = () => new Date().toISOString().split('T')[0];

  function findUnit(fullName) {
    if (typeof window.findUnitByFullName === 'function') return window.findUnitByFullName(fullName) || {};
    const biens = db().biens || [];
    const direct = biens.find(b => String(b.nom || '') === String(fullName || ''));
    if (direct) return { bien: direct, unite: null };
    for (const bien of biens) {
      const units = bien.unites || [];
      const unit = units.find(u => {
        const composed = [bien.nom, u.nom].filter(Boolean).join(' - ');
        return String(composed) === String(fullName) || String(u.nom || '') === String(fullName);
      });
      if (unit) return { bien, unite: unit };
    }
    return {};
  }

  function unitAlreadyOccupied(bienName, currentLocataire) {
    const wanted = normalize(bienName);
    return (db().locatives || []).some(l => {
      const sameBien = normalize(l.bien) === wanted || normalize(l.nom) === wanted;
      const active = ['loué','loue','occupé','occupe'].includes(normalize(l.statut || 'Loué'));
      const otherTenant = !currentLocataire || normalize(l.locataire || l.occupant) !== normalize(currentLocataire);
      return sameBien && active && otherTenant;
    });
  }

  function validateLocativeForm() {
    const data = {
      locataire: valueOf('lv-locataire').trim(),
      bien: valueOf('lv-bien').trim(),
      loyerRaw: valueOf('lv-loyer').trim(),
      chargeRaw: valueOf('lv-charge').trim(),
      dateEntree: valueOf('lv-date-entree').trim(),
      statut: valueOf('lv-statut').trim() || 'Loué'
    };

    if (!data.locataire) return { ok:false, field:'lv-locataire', message:'Le locataire est requis' };
    if (!data.bien) return { ok:false, field:'lv-bien', message:'Le bien est requis' };
    if (!data.loyerRaw) return { ok:false, field:'lv-loyer', message:'Le loyer est requis' };
    if (!data.dateEntree) return { ok:false, field:'lv-date-entree', message:'La date d’entrée est requise' };

    const locExists = (db().locataires || []).some(l => {
      const full = [l.prenom, l.nom].filter(Boolean).join(' ');
      return normalize(full) === normalize(data.locataire) || normalize(l.nom) === normalize(data.locataire);
    });
    if (!locExists && (db().locataires || []).length) {
      return { ok:false, field:'lv-locataire', message:'Le locataire sélectionné est introuvable' };
    }

    const found = findUnit(data.bien);
    if (!found.bien && (db().biens || []).length) {
      return { ok:false, field:'lv-bien', message:'Le bien sélectionné est introuvable' };
    }

    const loyer = numberOf(data.loyerRaw);
    if (!Number.isFinite(loyer) || loyer <= 0) {
      return { ok:false, field:'lv-loyer', message:'Le loyer doit être supérieur à 0' };
    }

    const charge = data.chargeRaw ? numberOf(data.chargeRaw) : 0;
    if (!Number.isFinite(charge) || charge < 0) {
      return { ok:false, field:'lv-charge', message:'La charge ne peut pas être négative' };
    }

    if (Number.isNaN(new Date(data.dateEntree).getTime())) {
      return { ok:false, field:'lv-date-entree', message:'La date d’entrée est invalide' };
    }

    if (unitAlreadyOccupied(data.bien, data.locataire) && normalize(data.statut) === 'loue') {
      return { ok:false, field:'lv-bien', message:'Ce bien semble déjà occupé par un autre locataire' };
    }

    return { ok:true, data: { ...data, loyer, charge, found } };
  }

  function syncLocataire(data) {
    if (typeof window.syncLocataireBienFromLocations === 'function') {
      window.syncLocataireBienFromLocations(data.locataire, data.bien);
      return;
    }
    const loc = (db().locataires || []).find(l => normalize([l.prenom, l.nom].filter(Boolean).join(' ')) === normalize(data.locataire));
    if (loc) loc.bien = data.bien;
  }

  function syncBien(data) {
    const found = data.found || {};
    const statutLoc = data.statut || 'Loué';
    if (found.bien && found.unite) {
      found.unite.statut = statutLoc;
      found.unite.loyer = moneyOf(data.loyer);
      found.unite.locataire = data.locataire;
      if (typeof window.syncBienStatusFromUnits === 'function') window.syncBienStatusFromUnits(found.bien);
      return;
    }
    const b = (db().biens || []).find(x => String(x.nom || '') === String(data.bien || ''));
    if (b) {
      b.statut = statutLoc;
      b.loyer = b.loyer || moneyOf(data.loyer);
      b.locataire = data.locataire;
    }
  }

  async function saveLocative() {
    const result = validateLocativeForm();
    if (!result.ok) return fieldError(result.field, result.message);

    const data = result.data;
    const photo = typeof window.getPhotoData === 'function'
      ? await window.getPhotoData('lv-photo-input')
      : '';

    const _db = window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {});
    if (!Array.isArray(_db.locatives)) _db.locatives = [];
    const nom = 'Location - ' + data.bien;
    _db.locatives.push({
      id: typeof window.genId === 'function' ? window.genId('LV') : ('LV-' + Date.now()),
      nom,
      locataire: data.locataire,
      bien: data.bien,
      parentBien: data.found?.bien?.nom || data.bien,
      uniteId: data.found?.unite?.id || '',
      occupant: data.locataire,
      loyer: moneyOf(data.loyer),
      charge: moneyOf(data.charge),
      dateEntree: data.dateEntree || todayISO(),
      statut: data.statut,
      photo: photo || ''
    });

    syncLocataire(data);
    syncBien(data);

    if (typeof window.auditLog === 'function') {
      window.auditLog('Ajout', 'Locatives', 'Nouvelle location : ' + data.locataire + ' — ' + data.bien);
    }
    if (window.GPDB && window.GPDB.save) await window.GPDB.save(_db);
    else if (typeof window.saveDB === 'function') { window.DB = _db; window.saveDB(); }
    if (typeof window.resetAfterSave === 'function') window.resetAfterSave('page-nv-locative');
    if (typeof window.renderTable === 'function') window.renderTable('locatives');
    if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    if (typeof window.navigate === 'function') window.navigate('locatives');
    notify('Location enregistrée avec succès ✓');
  }

  window.GPModules = window.GPModules || {};
  window.GPModules.locatives = {
    validateLocativeForm,
    saveLocative,
    findUnit,
    unitAlreadyOccupied
  };

  window.saveLocative = saveLocative;

  // [cleaned] debug console statement removed
})();
