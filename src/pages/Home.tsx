import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BadgeCheck, Bolt, Brain, CheckCircle2, Crown, Flag,
  Gamepad2, Goal, LayoutGrid, ListChecks, Play, Sparkles, Timer,
  Trophy, Users, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CATEGORIES } from '@/data/categories';
import { loadFromStorage } from '@/utils/storage';
import type { GameResult } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';

const games = [
  { title: 'قدّها فرق', description: 'فريق ضد فريق، فئات متنوعة ونقاط حتى آخر سؤال.', icon: Users, accent: '#7056E8', badge: 'الأكثر لعباً' },
  { title: 'مين أسرع؟', description: 'جولات قصيرة، مؤقت سريع وإجابات تحسمها الثواني.', icon: Timer, accent: '#FFC83D', badge: 'سريع' },
  { title: 'صح أو خطأ', description: 'قرار واحد فقط: صح أو خطأ. بس لا تستعجل.', icon: CheckCircle2, accent: '#35D1C5', badge: 'خفيف' },
  { title: 'اختيار من متعدد', description: 'أربع إجابات ومعلومة وحدة تحسم الجولة.', icon: ListChecks, accent: '#FF625F', badge: 'كلاسيكي' },
  { title: 'معلومات عامة', description: 'ثقافة، علوم، تاريخ، جغرافيا وأسئلة من كل مكان.', icon: Brain, accent: '#8B7CF6', badge: 'متنوع' },
  { title: 'كورة وبس', description: 'أسئلة كروية للأشخاص اللي يقولون يعرفون كل شيء.', icon: Goal, accent: '#6BCB77', badge: 'رياضة' },
  { title: 'السعودية', description: 'مدن، تاريخ، ثقافة ومعالم سعودية في تحدي سريع.', icon: Flag, accent: '#35D1C5', badge: 'محلي' },
  { title: 'تحدي الأصدقاء', description: 'مرّر الجهاز، اختاروا أسماءكم، وخلو النتيجة تتكلم.', icon: Trophy, accent: '#FFC83D', badge: 'جمعة' },
];

export function Home() {
  const navigate = useNavigate();
  const { playSound } = useSettings();
  const history = loadFromStorage<GameResult[]>('gameHistory', []);

  const goPlay = () => {
    playSound('click');
    navigate('/play');
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <section className="relative px-4 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-140px] right-[-80px] h-80 w-80 rounded-full bg-purple/20 blur-3xl" />
          <div className="absolute top-28 left-[-120px] h-72 w-72 rounded-full bg-turquoise/10 blur-3xl" />
          <div className="absolute bottom-[-100px] left-1/3 h-64 w-64 rounded-full bg-yellow/10 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.15fr_.85fr] gap-10 items-center">
          <div className="text-center lg:text-right animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-off-white/75 mb-6">
              <Sparkles className="w-4 h-4 text-yellow" />
              ألعاب جماعية عربية — بدون تعقيد
            </div>

            <h1 className="font-cairo font-black leading-[1.05] text-5xl sm:text-6xl lg:text-8xl tracking-tight mb-5">
              قدّها؟
              <span className="block text-gradient text-3xl sm:text-4xl lg:text-5xl mt-4">ورّنا شطارتك.</span>
            </h1>

            <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-off-white/65 leading-8 mb-8">
              افتح اللعبة، اختار جماعتك، وابدأ. أسئلة كثيرة، أنماط مختلفة، ونفس الجهاز يكفي للجميع.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button variant="primary" size="xl" onClick={goPlay}>
                <Play className="w-5 h-5" />
                ابدأ لعبة
              </Button>
              <Button variant="outline" size="xl" onClick={() => navigate('/categories')}>
                <LayoutGrid className="w-5 h-5" />
                شوف الفئات
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start text-xs sm:text-sm text-off-white/55">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-turquoise" /> بدون تسجيل إجباري</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-turquoise" /> يعمل على نفس الجهاز</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-turquoise" /> الأسئلة ما تتكرر بسهولة</span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative mx-auto w-[390px] h-[390px] rounded-[44px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple/10 via-transparent to-turquoise/10" />
              <div className="relative h-full grid grid-cols-2 gap-4">
                {games.slice(0, 4).map((game, index) => {
                  const Icon = game.icon;
                  return (
                    <div key={game.title} className="rounded-3xl border border-white/10 bg-navy/80 p-5 flex flex-col justify-between animate-float" style={{ animationDelay: `${index * .35}s` }}>
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: game.accent + '20', color: game.accent }}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-lg">{game.title}</p>
                        <span className="text-xs text-off-white/40">{game.badge}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-3 lg:gap-5">
          <MiniStat value="8" label="أنماط لعب" icon={<Gamepad2 className="w-5 h-5" />} />
          <MiniStat value={`${CATEGORIES.length}+`} label="فئة" icon={<LayoutGrid className="w-5 h-5" />} />
          <MiniStat value={String(history.length)} label="لعبة محفوظة" icon={<Crown className="w-5 h-5" />} />
        </div>
      </section>

      <section className="px-4 py-14 max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-sm text-turquoise font-bold mb-2">اختار جوّكم</p>
            <h2 className="text-3xl lg:text-4xl font-cairo font-black">ثمان ألعاب، وكل وحدة لها مودها</h2>
          </div>
          <button onClick={goPlay} className="hidden sm:flex items-center gap-2 text-sm font-bold text-off-white/65 hover:text-white transition-colors">
            كل خيارات اللعب <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {games.map((game, index) => {
            const Icon = game.icon;
            return (
              <button key={game.title} onClick={goPlay} className="text-right group rounded-3xl border border-white/10 bg-white/[0.035] p-5 min-h-[220px] relative overflow-hidden hover:-translate-y-1 hover:border-white/20 transition-all duration-300">
                <div className="absolute -left-12 -bottom-12 w-36 h-36 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: game.accent }} />
                <div className="relative h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: game.accent + '18', color: game.accent }}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-off-white/50">{game.badge}</span>
                  </div>
                  <div className="mt-auto pt-8">
                    <h3 className="text-xl font-black mb-2 group-hover:text-white">{game.title}</h3>
                    <p className="text-sm text-off-white/50 leading-6">{game.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-4 py-14 max-w-6xl mx-auto">
        <div className="rounded-[36px] border border-white/10 bg-gradient-to-l from-purple/15 via-white/[0.035] to-turquoise/10 p-6 sm:p-10 grid lg:grid-cols-3 gap-7">
          <Feature icon={<Users className="w-6 h-6" />} title="فريقين على طول" text="سمّوا الفرق، اختاروا الفئات، وخلو النقاط تحسم الجلسة." />
          <Feature icon={<Zap className="w-6 h-6" />} title="بدون لف ودوران" text="الإعداد سريع واللعبة واضحة حتى لو أول مرة تدخلون." />
          <Feature icon={<Bolt className="w-6 h-6" />} title="أوفلاين أولاً" text="الأساس مصمم عشان اللعب الجماعي على نفس الجهاز بدون اعتماد دائم على الإنترنت." />
        </div>
      </section>

      <section className="px-4 pt-8 pb-20 max-w-4xl mx-auto text-center">
        <Card className="py-12 px-5 bg-white/[0.035] border-white/10">
          <Trophy className="w-12 h-12 text-yellow mx-auto mb-4" />
          <h2 className="text-3xl font-cairo font-black mb-3">السؤال بسيط: قدّها؟</h2>
          <p className="text-off-white/55 mb-7">كوّن فريقك وابدأ أول جولة الآن.</p>
          <Button variant="primary" size="xl" onClick={goPlay}>
            <Play className="w-5 h-5" /> ابدأ التحدي
          </Button>
        </Card>
      </section>
    </div>
  );
}

function MiniStat({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-4 sm:p-5 text-center">
      <div className="text-turquoise flex justify-center mb-2">{icon}</div>
      <div className="text-2xl sm:text-3xl font-black">{value}</div>
      <div className="text-[11px] sm:text-sm text-off-white/45 mt-1">{label}</div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div>
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-yellow mb-4">{icon}</div>
      <h3 className="font-black text-xl mb-2">{title}</h3>
      <p className="text-sm text-off-white/55 leading-7">{text}</p>
    </div>
  );
}
