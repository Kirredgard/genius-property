const JOBS: any[] = [];

export function enqueueJob(job: any) {
  JOBS.push({
    ...job,
    id: `job_${Date.now()}`,
    status: 'queued',
    createdAt: new Date().toISOString()
  });
}

export function processJobs() {
  return JOBS.map((job) => ({
    ...job,
    status: 'processed'
  }));
}

export function listJobs() {
  return JOBS;
}
