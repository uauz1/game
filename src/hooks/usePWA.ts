import { useEffect } from 'react';

export function usePWA() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
        .then((registration) => {
          void registration.update();
          registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                window.dispatchEvent(new CustomEvent('qaddha:update-ready'));
              }
            });
          });
        })
        .catch(() => {
          // Offline support is optional; the online game remains available.
        });
    }
  }, []);
}
