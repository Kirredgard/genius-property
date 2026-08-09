export interface RuntimeErrorLog {
  type: string;
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  createdAt: string;
}

const logs: RuntimeErrorLog[] = [];

export function initErrorMonitor(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    captureError({
      type: 'error',
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    captureError({
      type: 'unhandledrejection',
      message: reason?.message || String(reason || 'Unhandled rejection'),
      stack: reason?.stack
    });
  });
}

export function captureError(input: Partial<RuntimeErrorLog>): RuntimeErrorLog {
  const log: RuntimeErrorLog = {
    type: input.type || 'manual',
    message: input.message || 'Unknown error',
    source: input.source,
    lineno: input.lineno,
    colno: input.colno,
    stack: input.stack,
    createdAt: new Date().toISOString()
  };

  logs.push(log);

  try {
    sessionStorage.setItem('gp:v21:error-logs', JSON.stringify(logs.slice(-50)));
  } catch (_) {
    // ignore storage failure
  }

  return log;
}

export function getErrorLogs(): RuntimeErrorLog[] {
  return [...logs];
}

export function clearErrorLogs(): void {
  logs.length = 0;
  try {
    sessionStorage.removeItem('gp:v21:error-logs');
  } catch (_) {
    // ignore
  }
}

if (typeof window !== 'undefined') {
  (window as any).GPV21Errors = {
    capture: captureError,
    list: getErrorLogs,
    clear: clearErrorLogs
  };
}
