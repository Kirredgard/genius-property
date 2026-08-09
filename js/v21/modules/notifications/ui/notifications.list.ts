function getRoot(rootSelector = '#notifications-root') {
  if (typeof document === 'undefined') return null;
  return document.querySelector(rootSelector);
}

export function renderNotificationsList(notifications = [], rootSelector) {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-notifications">
      <header class="v21-section-header">
        <h2>Notifications</h2>
        <p>${notifications.filter((item) => !item.read).length} non lue(s)</p>
      </header>
      <div class="v21-list">
        ${notifications.map(renderNotification).join('')}
      </div>
    </section>
  `;
}

export function renderNotificationsEmptyState(rootSelector) {
  const root = getRoot(rootSelector);
  if (!root) return;

  root.innerHTML = `
    <section class="v21-empty-state">
      <h2>Aucune notification</h2>
      <p>Les alertes loyers, contrats et paiements apparaîtront ici.</p>
    </section>
  `;
}

function renderNotification(notification) {
  return `
    <article class="v21-notification v21-notification--${escapeHtml(notification.severity)}" data-notification-id="${escapeHtml(notification.id)}">
      <strong>${escapeHtml(notification.title)}</strong>
      <p>${escapeHtml(notification.message)}</p>
      <small>${escapeHtml(notification.type)}</small>
    </article>
  `;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
