export function inviteTemplate({ inviteUrl, agencyName = 'Genius Property', role = 'viewer' }) {
  return {
    subject: `Invitation ${agencyName}`,
    text: `Vous êtes invité comme ${role}. Ouvrir: ${inviteUrl}`,
    html: `
      <h1>Invitation ${escapeHtml(agencyName)}</h1>
      <p>Vous êtes invité comme <strong>${escapeHtml(role)}</strong>.</p>
      <p><a href="${escapeHtml(inviteUrl)}">Accepter l’invitation</a></p>
    `
  };
}

export function welcomeTemplate({ agencyName = 'Genius Property' }) {
  return {
    subject: `Bienvenue sur ${agencyName}`,
    text: `Bienvenue sur ${agencyName}.`,
    html: `<h1>Bienvenue sur ${escapeHtml(agencyName)}</h1><p>Votre espace est prêt.</p>`
  };
}

export function betaWelcomeTemplate({ agencyName = 'Genius Property', guideUrl = '' }) {
      return {
        subject: `Bienvenue dans la beta ${agencyName}`,
        text: `Bienvenue dans la beta. Guide: ${guideUrl}`,
        html: `
          <h1>Bienvenue dans la beta ${escapeHtml(agencyName)}</h1>
          <p>Merci de tester Genius Property V21.</p>
          <p><a href="${escapeHtml(guideUrl)}">Ouvrir le guide utilisateur</a></p>
        `
      };
    }

    export function billingStatusTemplate({ agencyName = 'Genius Property', status, plan = 'free' }) {
  return {
    subject: `Abonnement ${agencyName}: ${status}`,
    text: `Votre abonnement ${plan} est maintenant: ${status}`,
    html: `
      <h1>Statut abonnement</h1>
      <p>Agence: ${escapeHtml(agencyName)}</p>
      <p>Plan: ${escapeHtml(plan)}</p>
      <p>Statut: <strong>${escapeHtml(status)}</strong></p>
    `
  };
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
