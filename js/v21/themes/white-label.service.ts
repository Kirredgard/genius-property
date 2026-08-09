const STORAGE_KEY = 'gp:v21:theme';

export function applyTheme(theme: Record<string, string>) {
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
}

export function loadSavedTheme() {
  try {
    const theme = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    applyTheme(theme);
    return theme;
  } catch (_) {
    return {};
  }
}

export const DEFAULT_THEME = {
  'brand-color': '#2563eb',
  'brand-background': '#f8fafc'
};
