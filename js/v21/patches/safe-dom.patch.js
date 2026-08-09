/**
 * Patch DOM sécurisé V21.
 * Remplace une partie des hotfixes globaux par des helpers explicites.
 */

export function qs(selector, root = document) {
  if (!selector || !root?.querySelector) return null;
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  if (!selector || !root?.querySelectorAll) return [];
  return Array.from(root.querySelectorAll(selector));
}

export function setSafeHTML(element, html = '') {
  if (!element) return;
  element.innerHTML = String(html);
}

export function setSafeText(element, text = '') {
  if (!element) return;
  element.textContent = String(text ?? '');
}

export function onSafe(element, eventName, handler, options) {
  if (!element || !eventName || typeof handler !== 'function') {
    return () => {};
  }

  element.addEventListener(eventName, handler, options);
  return () => element.removeEventListener(eventName, handler, options);
}
