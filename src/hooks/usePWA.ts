import { useEffect } from 'react';

export function usePWA() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
        .then((registration) => {
          void registration.update();
          if (registration.waiting && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('qaddha:update-ready'));
          }
          registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                window.dispatchEvent(new CustomEvent('qaddha:update-ready'));
              }
            });
          });
          const refresh = () => {
            if (document.visibilityState === 'visible') void registration.update();
          };
          window.addEventListener('pageshow', refresh);
          document.addEventListener('visibilitychange', refresh);
        })
        .catch(() => {
          // Offline support is optional; the online game remains available.
        });
    }
  }, []);
}
