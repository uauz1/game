import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CATEGORIES } from '@/data/categories';
import { DIFFICULTIES, type Difficulty } from '@/types';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/utils/helpers';

export function Categories() {
  const navigate = useNavigate();
  const { playSound } = useSettings();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');

  const filtered = useMemo(() => {
    return CATEGORIES.filter((cat) => {
      const matchesSearch = cat.name.includes(search) || cat.description.includes(search);
      return matchesSearch;
    });
  }, [search]);

  return (
    <div className="min-h-screen px-4 py-6 lg:py-10 max-w-5xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-cairo font-black mb-2">تصنيفات الأسئلة</h1>
      <p className="text-sm text-off-white/60 mb-6">اختر التصنيف الذي تريد اللعب فيه</p>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-off-white/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن تصنيف..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-3 text-lg focus:outline-none focus:border-purple transition-colors"
        />
      </div>

      {/* Categories grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-off-white/20 mx-auto mb-4" />
          <p className="text-off-white/60">لا توجد نتائج لبحثك</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {filtered.map((cat, i) => {
            const fav = isFavorite(cat.id);
            return (
              <Card
                key={cat.id}
                hoverable
                className={cn('p-5 animate-slide-up')}
                onClick={() => { playSound('select'); navigate('/play'); }}
              >
                <div className="flex items-start gap-3">
                  <CategoryIcon category={cat} size={28} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg">{cat.name}</h3>
                    <p className="text-sm text-off-white/50 mb-2">{cat.description}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: cat.color + '20', color: cat.color }}
                      >
                        {cat.questionCount} سؤال
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); playSound('click'); toggleFavorite(cat.id); }}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
                    aria-label="إضافة للمفضلة"
                  >
                    <Heart className={cn('w-5 h-5', fav ? 'fill-coral text-coral' : 'text-off-white/40')} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
