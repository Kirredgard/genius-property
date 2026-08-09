export function setupSessionTimeout(minutes = 30) {
  const timeout = minutes * 60 * 1000;

  setTimeout(() => {
    localStorage.setItem('gp:v21:sessionExpired', '1');
  }, timeout);

  return timeout;
}
