export function generateAiInsights(metrics: any = {}) {
  const insights = [];

  if ((metrics.activationRate || 0) < 50) {
    insights.push('Activation faible: améliorer onboarding.');
  }

  if ((metrics.failedPayments || 0) > 0) {
    insights.push('Paiements échoués détectés.');
  }

  return insights;
}
