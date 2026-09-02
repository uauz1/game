import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Check, X, Plus, Minus, User, Users, UserPlus,
  Zap, CheckCircle, ListChecks, Smile, Meh, Frown, Shuffle, Clock,
  Scissors, Star, Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import {
  GAME_MODES, DIFFICULTIES, QUESTION_COUNTS, TIMER_OPTIONS,
  PLAYER_COLORS, PLAYER_AVATARS, POWER_UPS,
  type GameMode, type Difficulty, type Player,
} from '@/types';
import { CATEGORIES } from '@/data/categories';
import { useGame } from '@/contexts/GameContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/utils/helpers';
import * as Icons from 'lucide-react';

const TOTAL_STEPS = 8;

function DynamicIcon({ name, size = 24 }: { name: string; size?: number }) {
  const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
  if (!IconComponent) return null;
  return <IconComponent style={{ width: size, height: size }} />;
}

export function Play() {
  const navigate = useNavigate();
  const { startGame } = useGame();
  const { playSound } = useSettings();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<GameMode>('single');
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<Player[]>(createDefaultPlayers(2));
  const [categories, setCategories] = useState<string[]>(['general']);
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [questionCount, setQuestionCount] = useState(10);
  const [timerSeconds, setTimerSeconds] = useState(30);

  function createDefaultPlayers(count: number): Player[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `player-${i}`,
      name: `اللاعب ${i + 1}`,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      avatar: PLAYER_AVATARS[i % PLAYER_AVATARS.length],
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      powersUsed: { eliminate: false, extraTime: false, doublePoints: false },
      categoryStats: {},
    }));
  }

  function handleModeChange(newMode: GameMode) {
    playSound('select');
    setMode(newMode);
    if (newMode === 'truefalse') {
      setCategories(['truefalse']);
    } else if (newMode === 'quick') {
      setQuestionCount(5);
      setTimerSeconds(15);
      setDifficulty('mixed');
    }
  }

  function handlePlayerCountChange(count: number) {
    playSound('click');
    setPlayerCount(count);
    setPlayers(createDefaultPlayers(count));
  }

  function updatePlayer(index: number, updates: Partial<Player>) {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }

  function toggleCategory(catId: string) {
    playSound('select');
    setCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  }

  function nextStep() {
    if (step === 3 && categories.length === 0) {
      showToast('اختر تصنيفاً واحداً على الأقل', 'warning');
      return;
    }
    if (step === 2) {
      const hasEmptyName = players.some((p) => !p.name.trim());
      if (hasEmptyName) {
        showToast('أدخل أسماء جميع اللاعبين', 'warning');
        return;
      }
    }
    playSound('click');
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function prevStep() {
    playSound('click');
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleStart() {
    playSound('whoosh');
    startGame({
      mode,
      players,
      categories: categories.length > 0 ? categories : ['general'],
      difficulty,
      questionCount: mode === 'quick' ? 5 : questionCount,
      timerSeconds,
    });
    navigate('/game');
  }

  // Quick mode skips setup
  function handleQuickStart() {
    playSound('whoosh');
    const quickPlayers = createDefaultPlayers(1);
    quickPlayers[0].name = 'أنا';
    startGame({
      mode: 'quick',
      players: quickPlayers,
      categories: [],
      difficulty: 'mixed',
      questionCount: 5,
      timerSeconds: 15,
    });
    navigate('/game');
  }

  const stepLabels = ['نمط اللعب', 'عدد اللاعبين', 'الأسماء', 'التصنيفات', 'الصعوبة', 'عدد الأسئلة', 'المؤقت', 'الملخص'];

  return (
    <div className="min-h-screen px-4 py-6 lg:py-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-cairo font-black mb-2">إعداد اللعبة</h1>
        {/* Progress steps */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all',
                  i === step ? 'bg-purple text-white' : i < step ? 'bg-turquoise/20 text-turquoise' : 'bg-white/5 text-off-white/40'
                )}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < stepLabels.length - 1 && <div className="w-2 h-px bg-white/10" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div key={step} className="animate-scale-in">
        {step === 0 && (
          <StepWrapper title="اختر نمط اللعب" subtitle="حدد كيف تريد أن تلعب">
            <div className="grid sm:grid-cols-2 gap-3 lg:gap-4">
              {GAME_MODES.map((m) => (
                <Card
                  key={m.id}
                  hoverable
                  selected={mode === m.id}
                  onClick={() => handleModeChange(m.id)}
                  className="relative overflow-hidden"
                >
                  {mode === m.id && (
                    <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-purple flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: m.color + '20', color: m.color }}
                    >
                      <DynamicIcon name={m.icon} size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{m.name}</h3>
                      <p className="text-sm text-off-white/60">{m.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 1 && (
          <StepWrapper title="اختر عدد اللاعبين" subtitle={mode === 'single' ? 'لعب فردي - لاعب واحد' : 'كم عدد الفرق أو اللاعبين؟'}>
            {mode === 'single' ? (
              <Card className="text-center py-12">
                <User className="w-16 h-16 text-purple mx-auto mb-4" />
                <p className="text-lg font-bold">لعب فردي</p>
                <p className="text-sm text-off-white/60 mt-1">ستلعب بمفردك وتتحدى نفسك</p>
              </Card>
            ) : (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handlePlayerCountChange(Math.max(2, playerCount - 1))}
                    className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <div className="text-center min-w-[100px]">
                    <div className="text-5xl font-cairo font-black text-purple">{playerCount}</div>
                    <div className="text-sm text-off-white/60">{playerCount === 1 ? 'لاعب' : 'لاعبين'}</div>
                  </div>
                  <button
                    onClick={() => handlePlayerCountChange(Math.min(8, playerCount + 1))}
                    className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
                  {[2, 3, 4, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => handlePlayerCountChange(n)}
                      className={cn(
                        'py-3 rounded-xl font-bold transition-all',
                        playerCount === n ? 'bg-purple text-white' : 'bg-white/5 hover:bg-white/10'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </StepWrapper>
        )}

        {step === 2 && (
          <StepWrapper title="أسماء اللاعبين" subtitle="أدخل الأسماء واختر اللون والصورة">
            <div className="space-y-3">
              {players.map((player, i) => (
                <Card key={player.id} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: player.color + '30' }}
                    >
                      {player.avatar}
                    </div>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updatePlayer(i, { name: e.target.value })}
                      maxLength={20}
                      placeholder={`اللاعب ${i + 1}`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-lg font-semibold focus:outline-none focus:border-purple transition-colors"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PLAYER_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => { playSound('select'); updatePlayer(i, { color }); }}
                        className={cn(
                          'w-8 h-8 rounded-full transition-all',
                          player.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-navy scale-110' : 'hover:scale-110'
                        )}
                        style={{ backgroundColor: color }}
                        aria-label="اختر اللون"
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PLAYER_AVATARS.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => { playSound('select'); updatePlayer(i, { avatar }); }}
                        className={cn(
                          'w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all',
                          player.avatar === avatar ? 'bg-purple/30 ring-2 ring-purple' : 'bg-white/5 hover:bg-white/10'
                        )}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 3 && (
          <StepWrapper title="اختر التصنيفات" subtitle="يمكنك اختيار تصنيف واحد أو أكثر">
            {mode === 'truefalse' ? (
              <Card className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-turquoise mx-auto mb-3" />
                <p className="font-bold">تصنيف صح أو خطأ</p>
                <p className="text-sm text-off-white/60 mt-1">ستلعب بأسئلة صح أو خطأ فقط</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <Card
                    key={cat.id}
                    hoverable
                    selected={categories.includes(cat.id)}
                    onClick={() => toggleCategory(cat.id)}
                    className="p-4"
                  >
                    <div className="flex items-center gap-2">
                      <CategoryIcon category={cat} size={24} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{cat.name}</h3>
                        <p className="text-xs text-off-white/50">{cat.questionCount} سؤال</p>
                      </div>
                      {categories.includes(cat.id) && (
                        <div className="w-5 h-5 rounded-full bg-purple flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </StepWrapper>
        )}

        {step === 4 && (
          <StepWrapper title="اختر الصعوبة" subtitle="حدد مستوى صعوبة الأسئلة">
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              {DIFFICULTIES.map((d) => (
                <Card
                  key={d.id}
                  hoverable
                  selected={difficulty === d.id}
                  onClick={() => { playSound('select'); setDifficulty(d.id); }}
                  className="text-center py-6"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: d.color + '20', color: d.color }}
                  >
                    <DynamicIcon name={d.icon} size={32} />
                  </div>
                  <h3 className="font-bold text-lg">{d.name}</h3>
                </Card>
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 5 && (
          <StepWrapper title="عدد الأسئلة" subtitle="كم سؤالاً تريد في اللعبة؟">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUESTION_COUNTS.map((count) => (
                <Card
                  key={count}
                  hoverable
                  selected={questionCount === count}
                  onClick={() => { playSound('select'); setQuestionCount(count); }}
                  className="text-center py-8"
                >
                  <div className="text-4xl font-cairo font-black text-purple mb-1">{count}</div>
                  <div className="text-sm text-off-white/60">سؤال</div>
                </Card>
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 6 && (
          <StepWrapper title="مؤقت الأسئلة" subtitle="اختر الوقت المتاح لكل سؤال">
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              {TIMER_OPTIONS.map((timer) => (
                <Card
                  key={timer.value}
                  hoverable
                  selected={timerSeconds === timer.value}
                  onClick={() => { playSound('select'); setTimerSeconds(timer.value); }}
                  className="text-center py-6"
                >
                  <Clock className="w-10 h-10 mx-auto mb-2 text-turquoise" />
                  <h3 className="font-bold text-lg">{timer.label}</h3>
                </Card>
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 7 && (
          <StepWrapper title="ملخص اللعبة" subtitle="تأكد من الإعدادات قبل البدء">
            <div className="space-y-3">
              <SummaryRow label="نمط اللعب" value={GAME_MODES.find((m) => m.id === mode)?.name || ''} />
              <SummaryRow label="عدد اللاعبين" value={`${players.length} لاعبين`} />
              <SummaryRow
                label="اللاعبون"
                value={players.map((p) => `${p.avatar} ${p.name}`).join(' • ')}
              />
              <SummaryRow
                label="التصنيفات"
                value={mode === 'truefalse' ? 'صح أو خطأ' : categories.length > 0
                  ? categories.map((c) => CATEGORIES.find((cat) => cat.id === c)?.name).join('، ')
                  : 'مختلط'}
              />
              <SummaryRow label="الصعوبة" value={DIFFICULTIES.find((d) => d.id === difficulty)?.name || ''} />
              <SummaryRow label="عدد الأسئلة" value={`${mode === 'quick' ? 5 : questionCount} سؤال`} />
              <SummaryRow label="المؤقت" value={TIMER_OPTIONS.find((t) => t.value === timerSeconds)?.label || ''} />

              {/* Power-ups preview */}
              <Card className="bg-purple/5 border-purple/20">
                <p className="text-sm font-semibold mb-3 text-off-white/80">القوى الخاصة المتاحة (مرة واحدة لكل لاعب):</p>
                <div className="grid grid-cols-3 gap-2">
                  {POWER_UPS.map((power) => (
                    <div key={power.id} className="text-center p-2">
                      <div className="w-10 h-10 rounded-xl bg-purple/20 text-purple flex items-center justify-center mx-auto mb-1">
                        <DynamicIcon name={power.icon} size={20} />
                      </div>
                      <p className="text-xs font-semibold">{power.name}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </StepWrapper>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8 gap-3">
        <Button
          variant="ghost"
          onClick={() => step === 0 ? navigate('/') : prevStep()}
          className="flex-row-reverse"
        >
          {step === 0 ? (
            <>الرئيسية <X className="w-4 h-4" /></>
          ) : (
            <>السابق <ChevronRight className="w-4 h-4" /></>
          )}
        </Button>

        {step < TOTAL_STEPS - 1 ? (
          <Button variant="primary" size="lg" onClick={nextStep}>
            التالي
            <ChevronLeft className="w-5 h-5" />
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={handleStart} className="text-xl">
            <Trophy className="w-5 h-5" />
            ابدأ التحدي
          </Button>
        )}
      </div>

      {/* Quick start floating button */}
      {step === 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-4 z-40">
          <Button
            variant="danger"
            size="lg"
            onClick={handleQuickStart}
            className="shadow-glow-coral animate-pulse-ring"
          >
            <Zap className="w-5 h-5" />
            تحدي سريع
          </Button>
        </div>
      )}
    </div>
  );
}

function StepWrapper({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl lg:text-2xl font-cairo font-bold mb-1">{title}</h2>
      <p className="text-sm text-off-white/50 mb-5">{subtitle}</p>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5">
      <span className="text-sm text-off-white/60 shrink-0">{label}</span>
      <span className="font-semibold text-sm text-left">{value}</span>
    </div>
  );
}
