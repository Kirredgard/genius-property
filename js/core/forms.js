/* Genius Property V21 — Form helpers
   Objectif: sortir progressivement la logique formulaires du bundle legacy.
   API globale: window.GPForms */
(function(){
  'use strict';

  var GP = window.GP = window.GP || {};
  var Forms = {};

  function $(idOrEl){
    if (!idOrEl) return null;
    return (typeof idOrEl === 'string') ? document.getElementById(idOrEl) : idOrEl;
  }

  function value(idOrEl){
    var el = $(idOrEl);
    if (!el) return '';
    if (el.type === 'checkbox') return !!el.checked;
    if (el.type === 'radio') {
      var checked = document.querySelector('input[name="' + CSS.escape(el.name) + '"]:checked');
      return checked ? checked.value : '';
    }
    return String(el.value == null ? '' : el.value);
  }

  function setValue(idOrEl, val){
    var el = $(idOrEl);
    if (!el) return false;
    if (el.type === 'checkbox') el.checked = !!val;
    else el.value = val == null ? '' : String(val);
    return true;
  }

  function trim(idOrEl){ return value(idOrEl).trim(); }

  function number(idOrEl){
    var raw = value(idOrEl);
    if (window.GP && typeof GP.num === 'function') return GP.num(raw);
    var n = Number(String(raw || '').replace(/[^0-9.,-]/g,'').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }

  function clearError(idOrEl){
    var el = $(idOrEl);
    if (!el) return;
    el.classList.remove('gp-field-error');
    el.removeAttribute('aria-invalid');
    el.style.borderColor = '';
    var msg = el.parentElement && el.parentElement.querySelector('.gp-field-error-msg[data-for="' + el.id + '"]');
    if (msg) msg.remove();
  }

  function fieldError(idOrEl, msg){
    var el = $(idOrEl);
    if (!el) {
      if (window.toast) window.toast(msg || 'Champ invalide', 'err');
      return false;
    }
    clearError(el);
    el.classList.add('gp-field-error');
    el.setAttribute('aria-invalid', 'true');
    el.style.borderColor = 'var(--red, #E24B4A)';

    if (el.id && el.parentElement) {
      var small = document.createElement('div');
      small.className = 'gp-field-error-msg';
      small.dataset.for = el.id;
      small.textContent = msg || 'Champ invalide';
      small.style.cssText = 'font-size:12px;color:var(--red,#E24B4A);margin-top:4px;';
      el.parentElement.appendChild(small);
    }

    try { el.focus({ preventScroll:false }); } catch(e) { try { el.focus(); } catch(_){} }
    el.addEventListener('input', function(){ clearError(el); }, { once:true });
    if (window.toast) window.toast(msg || 'Champ invalide', 'err');
    return false;
  }

  function requireField(idOrEl, msg){
    if (!trim(idOrEl)) return fieldError(idOrEl, msg || 'Ce champ est requis');
    return true;
  }

  function validateAmount(idOrEl, opts){
    opts = opts || {};
    var n = number(idOrEl);
    if (opts.positive && n <= 0) return fieldError(idOrEl, opts.message || 'Le montant doit être supérieur à 0');
    if (opts.nonNegative && n < 0) return fieldError(idOrEl, opts.message || 'Le montant ne peut pas être négatif');
    return true;
  }

  function validatePhone(idOrEl, msg){
    var v = trim(idOrEl).replace(/\s/g,'');
    if (v && !/^[0-9+]{8,15}$/.test(v)) return fieldError(idOrEl, msg || 'Numéro de téléphone invalide');
    return true;
  }

  function validateEmail(idOrEl, msg){
    var v = trim(idOrEl);
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return fieldError(idOrEl, msg || 'Adresse email invalide');
    return true;
  }

  function validateDateAfter(endId, startId, msg){
    var end = value(endId), start = value(startId);
    if (end && start && new Date(end) <= new Date(start)) {
      return fieldError(endId, msg || 'La date de fin doit être après la date de début');
    }
    return true;
  }

  function collect(map){
    var out = {};
    Object.keys(map || {}).forEach(function(key){
      var def = map[key];
      if (typeof def === 'string') out[key] = trim(def);
      else if (def && def.type === 'number') out[key] = number(def.id);
      else if (def && def.raw) out[key] = value(def.id);
      else if (def && def.id) out[key] = trim(def.id);
    });
    return out;
  }

  function reset(formOrSelector){
    var form = (typeof formOrSelector === 'string') ? document.querySelector(formOrSelector) : formOrSelector;
    if (form && typeof form.reset === 'function') form.reset();
    if (form) form.querySelectorAll('.gp-field-error').forEach(clearError);
  }

  function bindSubmit(formOrSelector, handler){
    var form = (typeof formOrSelector === 'string') ? document.querySelector(formOrSelector) : formOrSelector;
    if (!form || typeof handler !== 'function') return false;
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      handler(ev, form);
    });
    return true;
  }

  function ensureConfirmStyles(){
    if (document.getElementById('gp-confirm-modal-styles')) return;
    var style = document.createElement('style');
    style.id = 'gp-confirm-modal-styles';
    style.textContent = [
      '.gp-confirm-overlay{position:fixed;inset:0;background:rgba(15,23,42,.48);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px;}',
      '.gp-confirm-card{width:min(420px,100%);background:var(--color-background-primary,#fff);color:var(--color-text-primary,#111827);border:1px solid var(--color-border-tertiary,#e5e7eb);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.22);padding:18px;}',
      '.gp-confirm-title{font-size:16px;font-weight:700;margin:0 0 8px;}',
      '.gp-confirm-message{font-size:14px;line-height:1.55;color:var(--color-text-secondary,#475569);white-space:pre-wrap;margin-bottom:18px;}',
      '.gp-confirm-actions{display:flex;gap:10px;justify-content:flex-end;}',
      '.gp-confirm-actions button{min-height:42px;border-radius:10px;padding:0 14px;cursor:pointer;border:1px solid var(--color-border-tertiary,#e5e7eb);}',
      '.gp-confirm-cancel{background:var(--color-background-secondary,#f8fafc);color:var(--color-text-primary,#111827);}',
      '.gp-confirm-ok{background:var(--red,#E24B4A);border-color:var(--red,#E24B4A)!important;color:#fff;}',
      '@media(max-width:640px){.gp-confirm-card{border-radius:14px;padding:16px}.gp-confirm-actions{flex-direction:column-reverse}.gp-confirm-actions button{width:100%;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function confirmAction(message, opts){
    opts = opts || {};
    ensureConfirmStyles();
    return new Promise(function(resolve){
      var overlay = document.createElement('div');
      overlay.className = 'gp-confirm-overlay';
      overlay.setAttribute('role','dialog');
      overlay.setAttribute('aria-modal','true');

      var card = document.createElement('div');
      card.className = 'gp-confirm-card';

      var title = document.createElement('h3');
      title.className = 'gp-confirm-title';
      title.textContent = opts.title || 'Confirmer l’action';

      var body = document.createElement('div');
      body.className = 'gp-confirm-message';
      body.textContent = message || 'Confirmer cette action ?';

      var actions = document.createElement('div');
      actions.className = 'gp-confirm-actions';

      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'gp-confirm-cancel';
      cancel.textContent = opts.cancelText || 'Annuler';

      var ok = document.createElement('button');
      ok.type = 'button';
      ok.className = 'gp-confirm-ok';
      ok.textContent = opts.okText || 'Confirmer';

      function close(val){
        document.removeEventListener('keydown', onKey);
        overlay.remove();
        resolve(!!val);
      }
      function onKey(ev){
        if (ev.key === 'Escape') close(false);
        if (ev.key === 'Enter') close(true);
      }

      cancel.addEventListener('click', function(){ close(false); });
      ok.addEventListener('click', function(){ close(true); });
      overlay.addEventListener('click', function(ev){ if (ev.target === overlay) close(false); });
      document.addEventListener('keydown', onKey);

      actions.appendChild(cancel);
      actions.appendChild(ok);
      card.appendChild(title);
      card.appendChild(body);
      card.appendChild(actions);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      setTimeout(function(){ ok.focus(); }, 0);
    });
  }

  Forms.$ = $;
  Forms.value = value;
  Forms.setValue = setValue;
  Forms.trim = trim;
  Forms.number = number;
  Forms.clearError = clearError;
  Forms.fieldError = fieldError;
  Forms.requireField = requireField;
  Forms.validateAmount = validateAmount;
  Forms.validatePhone = validatePhone;
  Forms.validateEmail = validateEmail;
  Forms.validateDateAfter = validateDateAfter;
  Forms.collect = collect;
  Forms.reset = reset;
  Forms.bindSubmit = bindSubmit;
  Forms.confirmAction = confirmAction;
  Forms.confirm = confirmAction;

  GP.Forms = Forms;
  window.GPForms = Forms;
})();
