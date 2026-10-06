/* =====================================================================
   Genius Property — Modale de confirmation de suppression
   ---------------------------------------------------------------------
   - Intercepte (phase capture) tous les clics sur les boutons / icônes
     « Supprimer » de l'application, quel que soit le module.
   - Affiche un petit modale fin et stylé. Si l'utilisateur confirme, le
     clic d'origine est rejoué tel quel (les handlers existants
     s'exécutent normalement).
   - Évite le double message : les confirm() natifs et GPForms.confirm()
     déclenchés par l'action confirmée sont validés automatiquement.
   - Remplace aussi GPForms.confirm() par ce modale (même apparence).
   API publique :
     GPConfirmDelete(message, {title, okText, cancelText, detail}) -> Promise<boolean>
   Options sur un bouton (attributs HTML) :
     data-confirm-message="Supprimer « X » ?"   message personnalisé
     data-no-confirm                            désactive la confirmation
   ===================================================================== */
(function () {
  'use strict';
  if (window.__gpDeleteConfirmLoaded) return;
  window.__gpDeleteConfirmLoaded = true;

  /* ---------- Styles ---------- */
  var CSS = [
    '.gpdc-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.38);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);opacity:0;transition:opacity .16s ease;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}',
    '.gpdc-overlay.gpdc-in{opacity:1}',
    '.gpdc-card{width:min(300px,100%);box-sizing:border-box;background:var(--color-background-primary,#fff);color:var(--color-text-primary,#0f172a);border:1px solid var(--color-border-tertiary,rgba(15,23,42,.08));border-radius:16px;padding:20px 18px 16px;text-align:center;box-shadow:0 20px 50px -12px rgba(15,23,42,.35),0 4px 12px rgba(15,23,42,.08);transform:translateY(8px) scale(.96);transition:transform .18s cubic-bezier(.2,.9,.3,1.2)}',
    '.gpdc-overlay.gpdc-in .gpdc-card{transform:none}',
    '.gpdc-icon{width:40px;height:40px;margin:0 auto 12px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(226,75,74,.10);color:#e24b4a}',
    '.gpdc-icon .material-symbols-rounded{font-size:21px;line-height:1;font-variation-settings:"FILL" 0,"wght" 400,"GRAD" 0,"opsz" 24}',
    '.gpdc-title{margin:0 0 4px;font-size:15px;font-weight:650;letter-spacing:-.01em}',
    '.gpdc-msg{margin:0;font-size:13px;line-height:1.45;color:var(--color-text-secondary,#64748b);word-break:break-word;white-space:pre-line}',
    '.gpdc-detail{margin:6px 0 0;font-size:11.5px;color:var(--color-text-tertiary,#94a3b8)}',
    '.gpdc-actions{display:flex;gap:8px;margin-top:16px}',
    '.gpdc-btn{flex:1;height:34px;border-radius:9px;border:1px solid transparent;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .12s,transform .06s,box-shadow .12s}',
    '.gpdc-btn:active{transform:scale(.97)}',
    '.gpdc-btn:focus-visible{outline:2px solid rgba(226,75,74,.45);outline-offset:2px}',
    '.gpdc-cancel{background:var(--color-background-secondary,#f1f5f9);color:var(--color-text-primary,#334155);border-color:var(--color-border-tertiary,rgba(15,23,42,.08))}',
    '.gpdc-cancel:hover{background:var(--color-background-tertiary,#e2e8f0)}',
    '.gpdc-ok{background:#e24b4a;color:#fff;box-shadow:0 2px 8px -2px rgba(226,75,74,.55)}',
    '.gpdc-ok:hover{background:#d13b3a}',
    '@media (prefers-color-scheme:dark){.gpdc-card{background:var(--color-background-primary,#1e293b);color:var(--color-text-primary,#f1f5f9)}}',
    '@media (prefers-reduced-motion:reduce){.gpdc-overlay,.gpdc-card{transition:none}}'
  ].join('');

  function ensureStyles() {
    if (document.getElementById('gpdc-styles')) return;
    var s = document.createElement('style');
    s.id = 'gpdc-styles';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ---------- Modale ---------- */
  var opened = false;

  function openModal(message, opts) {
    opts = opts || {};
    if (message && typeof message === 'object') { opts = message; message = opts.message; }
    ensureStyles();
    return new Promise(function (resolve) {
      if (opened) { resolve(false); return; }
      opened = true;
      var prevFocus = document.activeElement;

      var overlay = document.createElement('div');
      overlay.className = 'gpdc-overlay';
      overlay.setAttribute('data-gpdc', '1');
      overlay.setAttribute('role', 'alertdialog');
      overlay.setAttribute('aria-modal', 'true');

      var card = document.createElement('div');
      card.className = 'gpdc-card';

      var icon = document.createElement('div');
      icon.className = 'gpdc-icon';
      var ic = document.createElement('span');
      ic.className = 'material-symbols-rounded';
      ic.setAttribute('aria-hidden', 'true');
      ic.textContent = opts.icon || 'delete';
      icon.appendChild(ic);

      var title = document.createElement('h3');
      title.className = 'gpdc-title';
      title.textContent = opts.title || 'Supprimer ?';

      var msg = document.createElement('p');
      msg.className = 'gpdc-msg';
      msg.textContent = message || 'Cet élément sera supprimé.';

      var detail = document.createElement('p');
      detail.className = 'gpdc-detail';
      detail.textContent = opts.detail === undefined ? 'Cette action est irréversible.' : opts.detail;

      var actions = document.createElement('div');
      actions.className = 'gpdc-actions';

      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'gpdc-btn gpdc-cancel';
      cancel.textContent = opts.cancelText || 'Annuler';

      var ok = document.createElement('button');
      ok.type = 'button';
      ok.className = 'gpdc-btn gpdc-ok';
      ok.textContent = opts.okText || 'Supprimer';

      function done(val) {
        document.removeEventListener('keydown', onKey, true);
        overlay.classList.remove('gpdc-in');
        setTimeout(function () { overlay.remove(); }, 150);
        opened = false;
        try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (e) {}
        resolve(!!val);
      }
      function onKey(ev) {
        if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); done(false); }
        else if (ev.key === 'Tab') {
          ev.preventDefault();
          (document.activeElement === ok ? cancel : ok).focus();
        }
      }

      cancel.addEventListener('click', function (e) { e.stopPropagation(); done(false); });
      ok.addEventListener('click', function (e) { e.stopPropagation(); done(true); });
      overlay.addEventListener('click', function (e) { e.stopPropagation(); if (e.target === overlay) done(false); });
      document.addEventListener('keydown', onKey, true);

      actions.appendChild(cancel);
      actions.appendChild(ok);
      card.appendChild(icon);
      card.appendChild(title);
      card.appendChild(msg);
      if (detail.textContent) card.appendChild(detail);
      card.appendChild(actions);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      requestAnimationFrame(function () { overlay.classList.add('gpdc-in'); });
      setTimeout(function () { cancel.focus(); }, 30); /* focus sur Annuler : plus sûr */
    });
  }

  window.GPConfirmDelete = openModal;

  /* ---------- Bypass des confirmations déjà existantes ---------- */
  var bypassUntil = 0;
  function bypassActive() { return Date.now() < bypassUntil; }
  function consumeBypass() { bypassUntil = 0; }

  var nativeConfirm = window.confirm ? window.confirm.bind(window) : function () { return true; };
  window.confirm = function (m) {
    if (bypassActive()) { consumeBypass(); return true; }
    return nativeConfirm(m);
  };

  /* GPForms.confirm -> même modale ; auto-validé si l'action vient d'être confirmée */
  function patchForms() {
    var F = window.GPForms;
    if (!F || F.__gpdcPatched) return !!(F && F.__gpdcPatched);
    var wrapped = function (message, opts) {
      if (bypassActive()) { consumeBypass(); return Promise.resolve(true); }
      opts = opts || {};
      if (message && typeof message === 'object') { opts = message; message = opts.message; }
      var isDelete = /suppr|delete/i.test((opts.title || '') + ' ' + (opts.okText || '') + ' ' + (message || ''));
      return openModal(message, {
        title: opts.title && !isDelete ? opts.title : (isDelete ? 'Supprimer ?' : (opts.title || 'Confirmer ?')),
        okText: opts.okText || (isDelete ? 'Supprimer' : 'Confirmer'),
        cancelText: opts.cancelText,
        icon: isDelete ? 'delete' : 'help',
        detail: isDelete ? undefined : ''
      });
    };
    F.confirm = wrapped;
    F.confirmAction = wrapped;
    F.__gpdcPatched = true;
    return true;
  }
  (function waitForms(n) {
    if (patchForms() || n > 100) return;
    setTimeout(function () { waitForms(n + 1); }, 100);
  })(0);

  /* ---------- Détection des boutons « supprimer » ---------- */
  var DEL_ICONS = /^(delete|delete_forever|delete_outline|delete_sweep|auto_delete|remove_circle|remove_circle_outline|do_not_disturb_on)$/;
  var ONCLICK_RE = /(delete|suppr|delrow|del[A-Z_]|_del\b|trash|removelogo|removedoc|removefile|removephoto)/i;
  var TEXT_RE = /^\s*(supprimer|delete|retirer le document|effacer)\b/i;
  var CLASS_RE = /(^|[\s_-])(delete|icon-delete|trash)([\s_-]|$)|btn-delete|delete-btn/i;
  var DANGER_RE = /(^|\s)([a-z0-9-]*danger[a-z0-9-]*)(\s|$)/i;
  var ATTR_RE = /^data-(del|delete|remove|suppr)/i;
  var HINT_RE = /(supprim|delete|effacer|trash)/i;

  function iconText(el) {
    var found = '';
    var nodes = el.querySelectorAll ? el.querySelectorAll('.material-symbols-rounded,.material-symbols-outlined,.material-icons,i,span') : [];
    for (var i = 0; i < nodes.length && i < 6; i++) {
      var t = (nodes[i].textContent || '').trim();
      if (DEL_ICONS.test(t)) { found = t; break; }
    }
    if (!found && DEL_ICONS.test((el.textContent || '').trim())) found = (el.textContent || '').trim();
    return found;
  }

  function stripDomRemoves(code) {
    return String(code || '').replace(/\.remove(Child|Attribute|EventListener|Property|Item)?\(/g, '(');
  }

  function isDeleteTrigger(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.closest('[data-gpdc]') || el.hasAttribute('data-no-confirm')) return false;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;

    var title = (el.getAttribute('title') || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('data-tooltip') || '');
    var onclick = stripDomRemoves(el.getAttribute('onclick'));
    var cls = typeof el.className === 'string' ? el.className : '';
    var text = (el.value && /^(button|submit)$/i.test(el.type || '') ? el.value : el.textContent || '').replace(/\s+/g, ' ').trim();
    var icon = iconText(el);

    /* Menus « Modifier ou supprimer » : ce n'est pas la suppression elle-même */
    if (/modifier/i.test(title) || /^modifier\b/i.test(text)) return false;

    if (onclick && ONCLICK_RE.test(onclick)) return true;
    if (el.attributes) {
      for (var i = 0; i < el.attributes.length; i++) if (ATTR_RE.test(el.attributes[i].name)) return true;
    }
    if (CLASS_RE.test(cls)) return true;
    if (HINT_RE.test(title)) return true;
    if (icon && text.length <= icon.length + 24) return true;
    if (TEXT_RE.test(text) && text.length <= 40) return true;
    if (DANGER_RE.test(cls) && (HINT_RE.test(text) || icon)) return true;
    return false;
  }

  var TRIGGER_SEL = 'button,a,[role="button"],[onclick],input[type="button"],input[type="submit"],[data-del],[data-delr],[data-delp],[data-delm],[data-delf],[data-deldoc],[data-delact],.icon-btn,[class*="delete"],[class*="danger"]';

  function findTrigger(target) {
    var el = target && target.nodeType === 1 ? target : target && target.parentElement;
    var depth = 0;
    while (el && el !== document.body && depth++ < 6) {
      if (el.matches && el.matches(TRIGGER_SEL) && isDeleteTrigger(el)) return el;
      /* Un bouton non-supprimer englobant stoppe la remontée */
      if (el.matches && el.matches('button,a[href],input[type="button"],input[type="submit"]')) return null;
      el = el.parentElement;
    }
    return null;
  }

  function buildMessage(el) {
    var custom = el.getAttribute('data-confirm-message');
    if (custom) return custom;
    var t = (el.getAttribute('title') || el.getAttribute('aria-label') || '').trim();
    if (/photo/i.test(t)) return 'Cette photo sera supprimée.';
    if (/document|fichier/i.test(t)) return 'Ce document sera supprimé.';
    var row = el.closest('tr,[data-id],.row,.card,li');
    var label = row && (row.getAttribute('data-label') || row.getAttribute('data-name'));
    if (label) return '« ' + label + ' » sera supprimé.';
    return 'Cet élément sera supprimé.';
  }

  /* ---------- Interception des clics (phase capture) ---------- */
  var replaying = false;

  function onClick(ev) {
    /* clics rejoués ou programmatiques : on laisse passer */
    if (replaying || !ev.isTrusted) return;
    var trigger = findTrigger(ev.target);
    if (!trigger) return;

    ev.preventDefault();
    ev.stopImmediatePropagation();
    ev.stopPropagation();

    openModal(buildMessage(trigger)).then(function (yes) {
      if (!yes) return;
      bypassUntil = Date.now() + 400;      /* valide le confirm() existant éventuel */
      replaying = true;
      try { trigger.click(); } finally { replaying = false; }
      setTimeout(function () { if (bypassActive()) consumeBypass(); }, 420);
    });
  }

  window.addEventListener('click', onClick, true);
})();
