import { useMemo, useState } from 'react';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { loadFromStorage } from '@/utils/storage';
import { getCategoryById } from '@/data/categories';
import { formatDate, cn } from '@/utils/helpers';
import type { LeaderboardEntry } from '@/types';

type SortBy = 'score' | 'accuracy' | 'date';

export function Leaderboard() {
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const entries = useMemo(() => loadFromStorage<LeaderboardEntry[]>('leaderboard', []), []);

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'accuracy') return b.accuracy - a.accuracy;
      return b.date - a.date;
    });
  }, [entries, sortBy]);

  return (
    <div className="min-h-screen px-4 py-6 lg:py-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="w-8 h-8 text-yellow" />
        <h1 className="text-2xl lg:text-3xl font-cairo font-black">لوحة المتصدرين</h1>
      </div>
      <p className="text-sm text-off-white/60 mb-6">أفضل النتائج من جميع الألعاب</p>

      {/* Sort tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { id: 'score' as const, label: 'الأعلى نقاطاً' },
          { id: 'accuracy' as const, label: 'الأعلى دقة' },
          { id: 'date' as const, label: 'الأحدث' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSortBy(tab.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              sortBy === tab.id ? 'bg-purple text-white' : 'bg-white/5 hover:bg-white/10 text-off-white/60'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <Medal className="w-16 h-16 text-off-white/20 mx-auto mb-4" />
          <p className="text-off-white/60 mb-2">لا توجد نتائج بعد</p>
          <p className="text-sm text-off-white/40">العب لعبة لتظهر نتائجك هنا!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.slice(0, 50).map((entry, i) => {
            const cat = getCategoryById(entry.category);
            const isTop3 = i < 3;
            const medalColors = ['#FFC83D', '#C0C0C0', '#CD7F32'];
            return (
              <Card
                key={entry.id}
                className={cn('p-4 flex items-center gap-3', isTop3 && 'border-yellow/20')}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0"
                  style={{
                    backgroundColor: isTop3 ? medalColors[i] + '20' : 'rgba(255,255,255,0.05)',
                    color: isTop3 ? medalColors[i] : '#ffffff60',
                  }}
                >
                  {isTop3 ? <Crown className="w-5 h-5" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{entry.name}</p>
                  <div className="flex items-center gap-2 text-xs text-off-white/50">
                    {cat && <span style={{ color: cat.color }}>{cat.name}</span>}
                    <span>•</span>
                    <span>{formatDate(entry.date)}</span>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-lg font-cairo font-black text-purple">{entry.score}</p>
                  <p className="text-xs text-off-white/40 flex items-center gap-1 justify-end">
                    <TrendingUp className="w-3 h-3" />
                    {entry.accuracy}%
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
