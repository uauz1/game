import { useEffect } from 'react';

export function usePWA() {
  useEffect(() => {
    const syncConnectivity = () => {
      document.documentElement.dataset.network = navigator.onLine ? 'online' : 'offline';
      window.dispatchEvent(new CustomEvent('qaddha:network-status', { detail: { online: navigator.onLine } }));
    };

    syncConnectivity();
    window.addEventListener('online', syncConnectivity);
    window.addEventListener('offline', syncConnectivity);

    if (!('serviceWorker' in navigator)) {
      return () => {
        window.removeEventListener('online', syncConnectivity);
        window.removeEventListener('offline', syncConnectivity);
      };
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.dispatchEvent(new CustomEvent('qaddha:app-updated'));
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
      .then((registration) => {
        void registration.update();
        const timer = window.setInterval(() => void registration.update(), 60 * 60 * 1000);
        const onVisibility = () => {
          if (document.visibilityState === 'visible') void registration.update();
        };
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('beforeunload', () => window.clearInterval(timer), { once: true });
      })
      .catch(() => {
        // Online play remains available even if service-worker setup fails.
      });

    return () => {
      window.removeEventListener('online', syncConnectivity);
      window.removeEventListener('offline', syncConnectivity);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);
}
