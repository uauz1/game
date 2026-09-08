import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import './huroof.css';
import './whoami.css';
import './teams.css';
import './settings.css';
import './responsive.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><AuthProvider><App /></AuthProvider></ErrorBoundary>
  </StrictMode>
);
