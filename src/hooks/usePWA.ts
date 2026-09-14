import { useEffect } from 'react';

export function usePWA() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
        .then(registration => registration.update())
        .catch(() => {
          // Offline support is optional; the online game remains available.
        });
    }
  }, []);
}
