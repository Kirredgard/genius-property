export function buildBetaWeeklyReport(input: any = {}) {
      const feedback = input.feedback || [];
      const incidents = input.incidents || [];
      const betaAgencies = input.betaAgencies || [];

      return {
        generatedAt: new Date().toISOString(),
        betaAgenciesCount: betaAgencies.length,
        activeBetaAgencies: betaAgencies.filter((a: any) => a.status === 'active').length,
        feedbackCount: feedback.length,
        criticalFeedback: feedback.filter((f: any) => f.severity === 'critical').length,
        incidentsCount: incidents.length,
        openIncidents: incidents.filter((i: any) => i.status !== 'closed').length,
        summary: `Beta: ${betaAgencies.length} agences, ${feedback.length} feedbacks, ${incidents.length} incidents.`
      };
    }

    export function exportBetaWeeklyReportMarkdown(report: any) {
      return `# Rapport beta hebdo

Date: ${report.generatedAt}

- Agences beta: ${report.betaAgenciesCount}
- Agences actives: ${report.activeBetaAgencies}
- Feedbacks: ${report.feedbackCount}
- Feedbacks critiques: ${report.criticalFeedback}
- Incidents: ${report.incidentsCount}
- Incidents ouverts: ${report.openIncidents}

${report.summary}
`;
    }
