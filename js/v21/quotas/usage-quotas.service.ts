export interface UsageQuota {
  key: string;
  limit: number;
  used: number;
}

export function calculateQuotaUsage(used: number, limit: number) {
  const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;

  return {
    used,
    limit,
    percent,
    exceeded: used > limit
  };
}

export function buildDefaultQuotas() {
  return [
    calculateQuotaUsage(12, 50),
    calculateQuotaUsage(4, 10),
    calculateQuotaUsage(1500, 5000)
  ];
}
