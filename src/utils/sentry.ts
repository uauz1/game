/**
 * Minimal, opt-in Sentry browser error reporting for QADDHA.
 * Enabled only when VITE_SENTRY_DSN is configured in a production build.
 * No session replay, tracing, logging, user identity, or request data.
 *
 * Uses Sentry's pinned, integrity-checked browser bundle instead of adding an
 * npm dependency; the existing React ErrorBoundary forwards render failures.
 * This keeps package-lock.json and the established CI pipeline untouched.
 */
type SentryEvent = {
  user?: unknown;
  request?: unknown;
  breadcrumbs?: unknown[];
  extra?: unknown;
  contexts?: unknown;
  transaction?: string;
  message?: string;
  tags?: Record<string, string>;
  exception?: {
    values?: Array<{
      type?: string;
      value?: string;
      stacktrace?: {
        frames?: Array<{ filename?: string; abs_path?: string }>;
      };
    }>;
  };
};

type SentryClient = {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: Error, hint?: { tags?: Record<string, string> }) => string;
};

type SentryWindow = Window & { Sentry?: SentryClient };
const sentryWindow = window as SentryWindow;
const dsn = String(import.meta.env.VITE_SENTRY_DSN || '').trim();
const enabled = import.meta.env.PROD && /^https:\/\/[a-z0-9]+@[a-z0-9.-]+\/\d+$/i.test(dsn);
const pending: Error[] = [];
let initialized = false;

/** Remove data that is unnecessary to diagnose the originating stack frame. */
function sanitizeEvent(event: SentryEvent): SentryEvent {
  delete event.user;
  delete event.request;
  delete event.extra;
  delete event.contexts;
  delete event.transaction;
  delete event.breadcrumbs;
  event.tags = { app: 'qaddha', capture: 'errors-only' };
  if (event.message) event.message = 'Qaddha frontend exception (message redacted)';
  for (const exception of event.exception?.values || []) {
    exception.value = (exception.type || 'Error') + ' (message redacted)';
    for (const frame of exception.stacktrace?.frames || []) {
      if (frame.filename) frame.filename = frame.filename.split(/[?#]/, 1)[0];
      if (frame.abs_path) frame.abs_path = frame.abs_path.split(/[?#]/, 1)[0];
    }
  }
  return event;
}

function report(error: Error): void {
  if (!initialized || !sentryWindow.Sentry) {
    if (pending.length < 5) pending.push(error);
    return;
  }
  try {
    sentryWindow.Sentry.captureException(error, { tags: { origin: 'react-boundary' } });
  } catch {
    // Monitoring must never interrupt a working game.
  }
}

export function captureQaddhaRenderError(error: Error): void {
  if (enabled) report(error);
}

if (enabled) {
  const script = document.createElement('script');
  script.src = 'https://browser.sentry-cdn.com/10.42.0/bundle.min.js';
  script.integrity = 'sha384-L/HYBH2QCeLyXhcZ0hPTxWMnyMJburPJyVoBmRk4OoilqrOWq5kU4PNTLFYrCYPr';
  script.crossOrigin = 'anonymous';
  script.referrerPolicy = 'no-referrer';
  script.onload = () => {
    try {
      const client = sentryWindow.Sentry;
      if (!client) return;
      client.init({
        dsn,
        environment: 'production',
        sampleRate: 1,
        sendDefaultPii: false,
        autoSessionTracking: false,
        tracesSampleRate: 0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        integrations: (defaults: Array<{ name: string }>) =>
          defaults.filter(item => !['Breadcrumbs', 'BrowserSession', 'Replay', 'HttpClient'].includes(item.name)),
        beforeSend: sanitizeEvent,
      });
      initialized = true;
      for (const error of pending.splice(0)) report(error);
    } catch {
      pending.length = 0;
    }
  };
  script.onerror = () => { pending.length = 0; };
  document.head.appendChild(script);
}
