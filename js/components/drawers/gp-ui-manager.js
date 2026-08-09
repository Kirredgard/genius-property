/**
 * GP UI Manager — V20
 * Centralise ouverture/fermeture des drawers et modales.
 * Objectif : éviter les conflits entre anciennes modales, nouveaux drawers et overlays.
 */
(function () {
  if (window.GPUIManager) return;

  const BODY_LOCK_CLASSES = [
    'modal-open',
    'drawer-open',
    'gp-modal-open',
    'overflow-hidden'
  ];

  function unlockBody() {
    BODY_LOCK_CLASSES.forEach(cls => document.body.classList.remove(cls));
    BODY_LOCK_CLASSES.forEach(cls => document.documentElement.classList.remove(cls));
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
  }

  function removeNode(node) {
    if (!node) return;
    try {
      node.remove();
    } catch (e) {
      if (node.parentNode) node.parentNode.removeChild(node);
    }
  }

  function closeBySelector(selector) {
    document.querySelectorAll(selector).forEach(removeNode);
  }

  function closeAll() {
    [
      '#gpFinanceOverlay',
      '#gpFinanceDrawer',
      '#gpadOverlay',
      '#gpadDrawer',
      '.modal-backdrop',
      '.drawer-backdrop',
      '.offcanvas-backdrop',
      '.gp-modal',
      '.gp-drawer.is-temp',
      '.drawer.is-temp',
      '.modal.show',
      '.offcanvas.show'
    ].forEach(closeBySelector);

    unlockBody();
  }

  function closeFinanceDrawer() {
    removeNode(document.getElementById('gpFinanceOverlay'));
    removeNode(document.getElementById('gpFinanceDrawer'));
    unlockBody();
  }

  function closeActionsDrawer() {
    removeNode(document.getElementById('gpadOverlay'));
    removeNode(document.getElementById('gpadDrawer'));
    unlockBody();
  }

  function bindGlobalCloseEvents() {
    if (window.__gpUiCloseEventsBoundV20) return;
    window.__gpUiCloseEventsBoundV20 = true;

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeAll();
    });

    document.addEventListener('click', function (event) {
      const closeBtn = event.target.closest(
        '[data-gp-close], .gp-drawer-close, .gp-cancel, .modal-close, .drawer-close, .btn-cancel'
      );

      if (!closeBtn) return;

      const insideManagedForm = closeBtn.closest(
        '#gpFinanceDrawer, #gpadDrawer, .gp-modal, .modal, .drawer, .offcanvas'
      );

      if (!insideManagedForm) return;

      requestAnimationFrame(closeAll);
    }, true);
  }

  window.GPUIManager = {
    closeAll,
    closeFinanceDrawer,
    closeActionsDrawer,
    unlockBody,
    removeNode
  };

  // Compatibilité ancienne API
  window.closeFinanceDrawer = closeFinanceDrawer;
  window.gpCloseAllFormsFast = closeAll;

  bindGlobalCloseEvents();
})();
