import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { GameProvider } from '@/contexts/GameContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { Layout } from '@/components/layout/Layout';
import { usePWA } from '@/hooks/usePWA';
import { Home } from '@/pages/Home';
import { Play } from '@/pages/Play';
import { GameScreen } from '@/pages/GameScreen';
import { Results } from '@/pages/Results';
import { Categories } from '@/pages/Categories';
import { Leaderboard } from '@/pages/Leaderboard';
import { Favorites } from '@/pages/Favorites';
import { HowToPlay } from '@/pages/HowToPlay';
import { Profile } from '@/pages/Profile';
import { Settings } from '@/pages/Settings';
import { NotFound } from '@/pages/NotFound';

export default function App() {
  usePWA();

  return (
    <SettingsProvider>
      <ToastProvider>
        <FavoritesProvider>
          <GameProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/play" element={<Play />} />
                  <Route path="/game" element={<GameScreen />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/how-to-play" element={<HowToPlay />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </GameProvider>
        </FavoritesProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
