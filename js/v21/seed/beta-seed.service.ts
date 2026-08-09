export function buildBetaSeedData() {
  return {
    agency: {
      id: 'agency-beta-demo',
      name: 'Agence Beta Demo',
      country: 'Sénégal',
      city: 'Dakar'
    },
    owner: {
      id: 'owner-beta-demo',
      firstName: 'Awa',
      lastName: 'Diop'
    },
    property: {
      id: 'property-beta-demo',
      title: 'Appartement Demo',
      monthlyRent: 350000
    },
    tenant: {
      id: 'tenant-beta-demo',
      firstName: 'Moussa',
      lastName: 'Fall'
    }
  };
}

export function installBetaSeedLocalStorage() {
  const seed = buildBetaSeedData();
  localStorage.setItem('gp:v21:betaSeed', JSON.stringify(seed));
  return seed;
}
