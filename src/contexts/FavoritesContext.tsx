import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { loadFromStorage, saveToStorage } from '@/utils/storage';

interface FavoritesContextValue {
  favorites: string[];
  toggleFavorite: (categoryId: string) => void;
  isFavorite: (categoryId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() =>
    loadFromStorage('favorites', [])
  );

  const toggleFavorite = useCallback((categoryId: string) => {
    setFavorites((prev) => {
      const newFavs = prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];
      saveToStorage('favorites', newFavs);
      return newFavs;
    });
  }, []);

  const isFavorite = useCallback(
    (categoryId: string) => favorites.includes(categoryId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
