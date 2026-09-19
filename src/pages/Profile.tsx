import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Gamepad2, Star, Target, TrendingUp, Award,
  Calendar, Pencil, Swords,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { loadFromStorage } from '@/utils/storage';
import { CATEGORIES } from '@/data/categories';
import { GAME_MODES } from '@/types';
import { formatDate, cn, getBestCategory } from '@/utils/helpers';
import type { GameResult } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getQaddhaAccountSummary, getMyOnlineMatchHistory, updateOnlineDisplayName, type QaddhaAccountSummary, type QaddhaMatchHistory } from '@/utils/onlinePlay';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  condition: (stats: { totalGames: number; totalCorrect: number; bestScore: number; totalQuestions: number }) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_game', title: 'أول لعبة', description: 'أكمل أول لعبة لك', icon: 'Gamepad2', color: '#7056E8', condition: (s) => s.totalGames >= 1 },
  { id: 'ten_games', title: 'لاعب محترف', description: 'أكمل 10 ألعاب', icon: 'Trophy', color: '#FFC83D', condition: (s) => s.totalGames >= 10 },
  { id: 'fifty_correct', title: 'خبير أسئلة', description: 'أجب 50 إجابة صحيحة', icon: 'Brain', color: '#35D1C5', condition: (s) => s.totalCorrect >= 50 },
  { id: 'high_score', title: 'نجم متألق', description: 'حقق 1000 نقطة في لعبة واحدة', icon: 'Star', color: '#FF625F', condition: (s) => s.bestScore >= 1000 },
  { id: '100_questions', title: 'مجتهد', description: 'أجب على 100 سؤال', icon: 'Target', color: '#FFC83D', condition: (s) => s.totalQuestions >= 100 },
  { id: 'five_games', title: 'لاعب نشط', description: 'أكمل 5 ألعاب', icon: 'Zap', color: '#35D1C5', condition: (s) => s.totalGames >= 5 },
];

export function Profile() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [cloud,setCloud]=useState<QaddhaAccountSummary|null>(null);
  const [onlineHistory,setOnlineHistory]=useState<QaddhaMatchHistory[]>([]);
  const [editingName,setEditingName]=useState(false);
  const [displayName,setDisplayName]=useState('');
  const [savingName,setSavingName]=useState(false);

  useEffect(()=>{
    if(!auth.session){setCloud(null);return;}
    let active=true;
    void Promise.all([getQaddhaAccountSummary(),getMyOnlineMatchHistory(20)]).then(([data,history])=>{if(active){setCloud(data);setDisplayName(data.profile.display_name);setOnlineHistory(history);}}).catch(()=>{});
    return()=>{active=false;};
  },[auth.session?.user.id]);

  const saveName=async()=>{if(!displayName.trim())return;setSavingName(true);try{const name=await updateOnlineDisplayName(displayName);setCloud(prev=>prev?{...prev,profile:{...prev.profile,display_name:name}}:prev);setEditingName(false);}finally{setSavingName(false);}};

  const gameHistory = useMemo(() => loadFromStorage<GameResult[]>('gameHistory', []), []);
  const stats = useMemo(() => {
    const totalGames = gameHistory.length;
    const totalQuestions = gameHistory.reduce((sum, g) => sum + g.totalQuestions, 0);
    const totalCorrect = gameHistory.reduce((sum, g) =>
      sum + g.players.reduce((s, p) => s + p.correctAnswers, 0), 0);
    const totalWrong = gameHistory.reduce((sum, g) =>
      sum + g.players.reduce((s, p) => s + p.wrongAnswers, 0), 0);
    const bestScore = gameHistory.reduce((max, g) =>
      Math.max(max, ...g.players.map((p) => p.score)), 0);

    // Find favorite category
    const catCount: Record<string, number> = {};
    gameHistory.forEach((g) => {
      g.config.categories.forEach((c) => {
        catCount[c] = (catCount[c] || 0) + 1;
      });
    });
    const favCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Aggregate category stats
    const allCatStats: Record<string, { correct: number; wrong: number }> = {};
    gameHistory.forEach((g) => {
      g.players.forEach((p) => {
        for (const [cat, st] of Object.entries(p.categoryStats)) {
          if (!allCatStats[cat]) allCatStats[cat] = { correct: 0, wrong: 0 };
          allCatStats[cat].correct += st.correct;
          allCatStats[cat].wrong += st.wrong;
        }
      });
    });

    const bestCat = getBestCategory(allCatStats);

    return { totalGames, totalQuestions, totalCorrect, totalWrong, bestScore, favCat, bestCat };
  }, [gameHistory]);

  const accuracy = stats.totalCorrect + stats.totalWrong > 0
    ? Math.round((stats.totalCorrect / (stats.totalCorrect + stats.totalWrong)) * 100)
    : 0;

  const favCatInfo = stats.favCat ? CATEGORIES.find((c) => c.id === stats.favCat) : null;
  const bestCatInfo = stats.bestCat ? CATEGORIES.find((c) => c.id === stats.bestCat) : null;

  const unlockedAchievements = ACHIEVEMENTS.filter((a) => a.condition({
    totalGames: stats.totalGames,
    totalCorrect: stats.totalCorrect,
    bestScore: stats.bestScore,
    totalQuestions: stats.totalQuestions,
  }));

  return (
    <div className="min-h-screen px-4 py-6 lg:py-10 max-w-4xl mx-auto">
      {/* Profile header */}
      <Card className="mb-6 p-6 text-center bg-gradient-to-br from-purple/10 to-turquoise/5">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple to-turquoise flex items-center justify-center mx-auto mb-3 shadow-glow-purple">
          <User className="w-10 h-10 text-white" />
        </div>
        {editingName?<div className="flex gap-2 justify-center items-center"><input className="bg-black/30 border border-white/15 rounded-xl px-3 py-2 text-center max-w-52" value={displayName} maxLength={24} onChange={e=>setDisplayName(e.target.value)}/><Button variant="primary" disabled={savingName} onClick={()=>void saveName()}>{savingName?'حفظ…':'حفظ'}</Button></div>:<div className="flex gap-2 justify-center items-center"><h1 className="text-2xl font-cairo font-black">{cloud?.profile.display_name || auth.session?.user.user_metadata?.display_name || 'لاعب تحدّي'}</h1>{cloud&&<button aria-label="تعديل الاسم" className="text-off-white/50 hover:text-white" onClick={()=>setEditingName(true)}><Pencil className="w-4 h-4"/></button>}</div>}
        <p className="text-sm text-off-white/60 mt-1">{auth.session?.user.email || (cloud ? 'حساب قدّها محفوظ' : `${stats.totalGames} لعبة مكتملة`)}</p>
        {cloud && <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div><b>{cloud.profile.xp}</b><small className="block text-off-white/50">XP</small></div><div><b>{cloud.profile.games_played}</b><small className="block text-off-white/50">أونلاين</small></div><div><b>{cloud.profile.wins}</b><small className="block text-off-white/50">فوز</small></div></div>}
      </Card>

      {/* Stats */}
      <h2 className="text-xl font-bold mb-4">إحصائياتي</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatBox icon={<Gamepad2 className="w-6 h-6" />} label="ألعاب" value={stats.totalGames} color="#7056E8" />
        <StatBox icon={<Target className="w-6 h-6" />} label="أسئلة" value={stats.totalQuestions} color="#35D1C5" />
        <StatBox icon={<TrendingUp className="w-6 h-6" />} label="دقة" value={`${accuracy}%`} color="#FFC83D" />
        <StatBox icon={<Star className="w-6 h-6" />} label="أعلى نتيجة" value={stats.bestScore} color="#FF625F" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {favCatInfo && (
          <Card className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: favCatInfo.color + '20' }}>
              ⭐
            </div>
            <div>
              <p className="text-sm text-off-white/60">التصنيف المفضل</p>
              <p className="font-bold" style={{ color: favCatInfo.color }}>{favCatInfo.name}</p>
            </div>
          </Card>
        )}
        {bestCatInfo && (
          <Card className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: bestCatInfo.color + '20', color: bestCatInfo.color }}>
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-off-white/60">أفضل تصنيف بالأداء</p>
              <p className="font-bold" style={{ color: bestCatInfo.color }}>{bestCatInfo.name}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Achievements */}
      <h2 className="text-xl font-bold mb-4">الإنجازات</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {ACHIEVEMENTS.map((ach) => {
          const unlocked = unlockedAchievements.some((a) => a.id === ach.id);
          return (
            <Card
              key={ach.id}
              className={cn('p-4 text-center transition-all', !unlocked && 'opacity-40 grayscale')}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: ach.color + '20', color: ach.color }}
              >
                <AchievementIcon name={ach.icon} />
              </div>
              <p className="font-bold text-sm">{ach.title}</p>
              <p className="text-xs text-off-white/50 mt-1">{ach.description}</p>
              {unlocked && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-turquoise font-semibold">
                  <Award className="w-3 h-3" />
                  مُنجز
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {auth.session && <><h2 className="text-xl font-bold mb-4">سجل الأونلاين</h2>{onlineHistory.length===0?<Card className="text-center py-8 mb-8"><Swords className="w-10 h-10 text-off-white/20 mx-auto mb-2"/><p className="text-off-white/50">مباريات الأونلاين المكتملة بتظهر هنا.</p></Card>:<div className="space-y-2 mb-8">{onlineHistory.map(match=><Card key={match.id} className="p-4 flex items-center gap-3"><div className={cn("w-11 h-11 rounded-2xl grid place-items-center font-black",match.result==='win'?'bg-green-500/10 text-green-400':match.result==='draw'?'bg-yellow-500/10 text-yellow-300':'bg-red-500/10 text-red-400')}>{match.result==='win'?'ف':match.result==='draw'?'ت':'خ'}</div><div className="flex-1"><b className="text-sm">{match.game_id==='fast'?'مين أسرع؟':match.game_id}</b><p className="text-xs text-off-white/45">{formatDate(match.played_at)}</p></div><div className="text-left"><b>{match.score} — {match.opponent_score}</b><small className="block text-turquoise">+{match.xp_earned} XP</small></div></Card>)}</div>}</>}

      {/* Game history */}
      <h2 className="text-xl font-bold mb-4">سجل الألعاب</h2>
      {gameHistory.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar className="w-12 h-12 text-off-white/20 mx-auto mb-3" />
          <p className="text-off-white/60 mb-2">لا توجد ألعاب بعد</p>
          <p className="text-sm text-off-white/40 mb-4">ابدأ أول لعبة لك!</p>
          <Button variant="primary" onClick={() => navigate('/play')}>
            <Gamepad2 className="w-5 h-5" />
            ابدأ اللعب
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {gameHistory.slice(0, 20).map((game, i) => {
            const modeName = GAME_MODES.find((m) => m.id === game.config.mode)?.name || '';
            const topPlayer = game.players[0];
            return (
              <Card key={i} className="p-4 flex items-center gap-3">
                <div className="text-2xl shrink-0">{topPlayer?.avatar || '🎮'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">
                    {game.winner ? `الفائز: ${game.winner.name}` : 'تعادل'}
                  </p>
                  <p className="text-xs text-off-white/50">
                    {modeName} • {formatDate(game.date)}
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <p className="font-cairo font-black text-purple">{topPlayer?.score || 0}</p>
                  <p className="text-xs text-off-white/40">نقطة</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card className="text-center py-4">
      <div className="flex justify-center mb-2" style={{ color }}>{icon}</div>
      <div className="text-xl font-cairo font-black" style={{ color }}>{value}</div>
      <div className="text-xs text-off-white/60 mt-1">{label}</div>
    </Card>
  );
}

import * as Icons from 'lucide-react';
function AchievementIcon({ name }: { name: string }) {
  const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
  if (!IconComponent) return null;
  return <IconComponent className="w-6 h-6" />;
}
