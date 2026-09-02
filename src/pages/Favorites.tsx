import { useNavigate } from 'react-router-dom';
import { Heart, Play } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CATEGORIES } from '@/data/categories';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useSettings } from '@/contexts/SettingsContext';

export function Favorites() {
  const navigate = useNavigate();
  const { playSound } = useSettings();
  const { favorites, toggleFavorite } = useFavorites();

  const favCategories = CATEGORIES.filter((c) => favorites.includes(c.id));

  return (
    <div className="min-h-screen px-4 py-6 lg:py-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Heart className="w-8 h-8 text-coral fill-coral" />
        <h1 className="text-2xl lg:text-3xl font-cairo font-black">المفضلة</h1>
      </div>
      <p className="text-sm text-off-white/60 mb-6">تصنيفاتك المفضلة للرجوع إليها بسرعة</p>

      {favCategories.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-off-white/20 mx-auto mb-4" />
          <p className="text-off-white/60 mb-2">لا توجد تصنيفات في المفضلة</p>
          <p className="text-sm text-off-white/40 mb-6">أضف تصنيفاتك المفضلة بالنقر على أيقونة القلب</p>
          <Button variant="primary" onClick={() => navigate('/categories')}>
            استكشف التصنيفات
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {favCategories.map((cat) => (
            <Card key={cat.id} hoverable className="p-5" onClick={() => { playSound('select'); navigate('/play'); }}>
              <div className="flex items-start gap-3">
                <CategoryIcon category={cat} size={28} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg">{cat.name}</h3>
                  <p className="text-sm text-off-white/50 mb-2">{cat.description}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: cat.color + '20', color: cat.color }}
                  >
                    {cat.questionCount} سؤال
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); playSound('click'); toggleFavorite(cat.id); }}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
                >
                  <Heart className="w-5 h-5 fill-coral text-coral" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
