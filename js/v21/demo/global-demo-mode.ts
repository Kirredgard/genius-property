export function enableGlobalDemoMode() {
  localStorage.setItem('gp:v21:demo', '1');
  localStorage.setItem('gp:v21:role', 'admin');
  localStorage.setItem('gp:v21:agencyId', 'agency-beta-demo');
  return true;
}

export function disableGlobalDemoMode() {
  localStorage.removeItem('gp:v21:demo');
  return true;
}
