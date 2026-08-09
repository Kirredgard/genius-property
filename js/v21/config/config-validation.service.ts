export function validateRuntimeConfig() {
  const checks = {
    firebaseApiKey: Boolean(import.meta.env.VITE_FIREBASE_API_KEY),
    firebaseProjectId: Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    billingApiUrl: Boolean(import.meta.env.VITE_BILLING_API_URL || '/api/billing'),
    emailApiUrl: Boolean(import.meta.env.VITE_EMAIL_API_URL || '/api/emails'),
    opsApiUrl: Boolean(import.meta.env.VITE_OPS_API_URL || '/api/ops')
  };

  return {
    ok: Object.values(checks).every(Boolean),
    checks
  };
}
