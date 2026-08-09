export function showRealtimeNotification(message = '') {
  const node = document.createElement('div');

  node.textContent = message;
  node.className = 'v21-toast';

  document.body.appendChild(node);

  setTimeout(() => node.remove(), 4000);
}
