import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './utils/sessionResultObserver.ts';
import './index.css';
import './huroof.css';
import './whoami.css';
import './teams.css';
import './settings.css';
import './settings-enhanced.css';
import './player-progress.css';
import './team-standings.css';
import './quick-play.css';
import './responsive.css';
import './home-fix.css';
import './private-play.css';
import './qr-game-badges.css';
import './header-polish.css';
import './hero-background-polish.css';
import './site-premium-polish.css';

const WhoAmIPhone = lazy(() => import('./components/party/WhoAmIPrivate.tsx').then(module => ({ default: module.WhoAmIPhone })));
const params = new URLSearchParams(window.location.search);
const isWhoHost = params.get('host') === 'who';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {isWhoHost
        ? <Suspense fallback={<main className="mobile-host" dir="rtl"><section className="host-wait"><h1>نربطك بشاشة اللعبة…</h1></section></main>}><WhoAmIPhone roomId={params.get('room') || ''} token={params.get('token') || ''}/></Suspense>
        : <AuthProvider><App /></AuthProvider>}
    </ErrorBoundary>
  </StrictMode>
);
