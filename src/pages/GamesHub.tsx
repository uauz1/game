import { useNavigate } from 'react-router-dom';
import {
  Brain, CheckCircle2, Flag, Goal, ListChecks, Timer, Trophy, Users,
  ArrowRight, Play,
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useSettings } from '@/contexts/SettingsContext';
import { PLAYER_AVATARS, PLAYER_COLORS, type GameMode, type Player } from '@/types';

const PRESETS: Array<{
  id: string;
  title: string;
  description: string;
  icon: typeof Users;
  color: string;
  mode: GameMode;
  categories: string[];
  count: number;
  timer: number;
  players: number;
}> = [
  { id: 'teams', title: 'قدّها فرق', description: 'فريقين، فئات متنوعة ونقاط حتى آخر سؤال.', icon: Users, color: '#7056E8', mode: 'team', categories: ['general','saudi','sports','history','science','movies'], count: 20, timer: 30, players: 2 },
  { id: 'speed', title: 'مين أسرع؟', description: 'خمس أسئلة سريعة ومؤقت قصير.', icon: Timer, color: '#FFC83D', mode: 'quick', categories: [], count: 5, timer: 15, players: 1 },
  { id: 'truefalse', title: 'صح أو خطأ', description: 'قرار واحد فقط: صح أو خطأ.', icon: CheckCircle2, color: '#35D1C5', mode: 'truefalse', categories: ['truefalse'], count: 15, timer: 20, players: 1 },
  { id: 'multiple', title: 'اختيار من متعدد', description: 'أربع إجابات ومعلومة وحدة تحسم الجولة.', icon: ListChecks, color: '#FF625F', mode: 'multiple', categories: [], count: 15, timer: 30, players: 1 },
  { id: 'general', title: 'معلومات عامة', description: 'ثقافة، علوم، تاريخ وجغرافيا.', icon: Brain, color: '#8B7CF6', mode: 'single', categories: ['general','history','geography','science','world'], count: 20, timer: 30, players: 1 },
  { id: 'football', title: 'كورة وبس', description: 'أسئلة كروية للجمهور اللي يقول يعرف كل شيء.', icon: Goal, color: '#6BCB77', mode: 'friends', categories: ['football','sports'], count: 20, timer: 30, players: 2 },
  { id: 'saudi', title: 'السعودية', description: 'مدن، تاريخ، ثقافة ومعالم سعودية.', icon: Flag, color: '#35D1C5', mode: 'friends', categories: ['saudi'], count: 20, timer: 30, players: 2 },
  { id: 'friends', title: 'تحدي الأصدقاء', description: 'مرّروا الجهاز وخلو النتيجة تتكلم.', icon: Trophy, color: '#FFC83D', mode: 'friends', categories: [], count: 20, timer: 30, players: 4 },
];

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i}`,
    name: count === 1 ? 'أنا' : i < 2 ? `الفريق ${i + 1}` : `اللاعب ${i + 1}`,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    avatar: PLAYER_AVATARS[i % PLAYER_AVATARS.length],
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    powersUsed: { eliminate: false, extraTime: false, doublePoints: false },
    categoryStats: {},
  }));
}

export function GamesHub() {
  const navigate = useNavigate();
  const { startGame } = useGame();
  const { playSound } = useSettings();

  const launch = (preset: (typeof PRESETS)[number]) => {
    playSound('whoosh');
    startGame({
      mode: preset.mode,
      players: makePlayers(preset.players),
      categories: preset.categories,
      difficulty: 'mixed',
      questionCount: preset.count,
      timerSeconds: preset.timer,
    });
    navigate('/game');
  };

  return (
    <div className="min-h-screen px-4 py-8 lg:py-12 max-w-6xl mx-auto">
      <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-sm text-off-white/55 hover:text-white mb-7">
        <ArrowRight className="w-4 h-4" /> الرئيسية
      </button>

      <div className="mb-8">
        <p className="text-sm font-bold text-turquoise mb-2">اختار جوّكم</p>
        <h1 className="text-3xl sm:text-4xl font-cairo font-black">ألعاب قدّها</h1>
        <p className="text-off-white/55 mt-3">ثمان تجارب جاهزة تبدأ مباشرة، أو تقدر تدخل إعداد اللعبة وتضبط كل شيء بنفسك.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRESETS.map((game) => {
          const Icon = game.icon;
          return (
            <button key={game.id} onClick={() => launch(game)} className="text-right group rounded-3xl border border-white/10 bg-white/[0.035] p-5 min-h-[225px] hover:-translate-y-1 hover:border-white/20 transition-all duration-300 relative overflow-hidden">
              <div className="absolute -left-14 -bottom-14 w-40 h-40 rounded-full blur-3xl opacity-10 group-hover:opacity-20" style={{ backgroundColor: game.color }} />
              <div className="relative h-full flex flex-col">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: game.color + '18', color: game.color }}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="mt-auto pt-8">
                  <h2 className="font-black text-xl mb-2">{game.title}</h2>
                  <p className="text-sm text-off-white/50 leading-6 mb-4">{game.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: game.color }}>
                    <Play className="w-4 h-4" /> ابدأ الآن
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button onClick={() => navigate('/play')} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-bold hover:bg-white/10 transition-colors">
          إعداد لعبة مخصصة
        </button>
      </div>
    </div>
  );
}
