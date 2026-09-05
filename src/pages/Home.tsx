import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BadgeCheck, Brain, Camera, Crown, Gamepad2,
  Image as ImageIcon, LayoutGrid, Lightbulb, Play, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CATEGORIES } from '@/data/categories';
import { loadFromStorage } from '@/utils/storage';
import type { GameResult } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';

const LOUNGE_IMAGE = 'https://images.unsplash.com/photo-1715279240000-9a50953e327d?auto=format&fit=crop&q=88&w=1800';

const featured = [
  { title: 'تحدي الصورة', description: 'كم صورة تقدر تكتشف؟', icon: Camera, accent: '#8b5cf6', badge: 'إبداع وذاكرة' },
  { title: 'بنك الكلمات', description: 'كوّن كلمات.. وكن الأسرع!', icon: Lightbulb, accent: '#3b82f6', badge: 'كلمات ومعلومات' },
  { title: 'صح أو خطأ', description: 'معلومات ممتعة وتحديات قوية', icon: BadgeCheck, accent: '#ec4899', badge: 'معرفة وثقافة' },
  { title: 'مين الأسرع؟', description: 'سرعة بديهة.. وتحدي حقيقي!', icon: Gamepad2, accent: '#f59e0b', badge: 'سرعة وردة فعل' },
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
    <div className="min-h-screen bg-[#07101f] text-off-white overflow-hidden">
      <section className="border-b border-white/10 bg-[#08101f]">
        <div className="max-w-[1600px] mx-auto grid lg:grid-cols-2 min-h-[560px]" dir="ltr">
          <div className="relative min-h-[380px] lg:min-h-[560px] overflow-hidden">
            <img
              src={LOUNGE_IMAGE}
              alt="جلسة ألعاب قدّها"
              className="absolute inset-0 h-full w-full object-cover object-center saturate-150 contrast-110"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,16,31,.08),rgba(63,27,120,.12)),linear-gradient(0deg,rgba(7,16,31,.52),transparent_42%)]" />
            <div className="absolute inset-0 mix-blend-color bg-violet-700/15" />
            <div className="absolute left-6 bottom-6 rounded-2xl border border-fuchsia-400/30 bg-[#0a0f22]/75 px-5 py-3 backdrop-blur-md shadow-[0_0_35px_rgba(217,70,239,.2)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-fuchsia-300" />
                </div>
                <div dir="rtl" className="text-right">
                  <div className="font-black text-lg">قدّها</div>
                  <div className="text-xs text-off-white/45">اللعب يجمعنا</div>
                </div>
              </div>
            </div>
          </div>

          <div dir="rtl" className="relative flex items-center px-6 sm:px-10 lg:px-14 py-12 lg:py-16 bg-[radial-gradient(circle_at_20%_35%,rgba(124,58,237,.18),transparent_35%)]">
            <div className="w-full max-w-2xl mx-auto lg:mx-0 text-center lg:text-right">
              <h1 className="font-cairo font-black text-5xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight mb-5">
                المتعة تبدأ مع <span className="text-transparent bg-clip-text bg-gradient-to-l from-fuchsia-400 via-violet-400 to-cyan-400">قدّها</span>
              </h1>

              <p className="text-2xl sm:text-3xl font-black text-white/90 mb-4">ألعاب جماعية، أجواء أقرب، وذكريات أكثر</p>
              <p className="text-base sm:text-lg text-off-white/55 leading-8 mb-8 max-w-xl mx-auto lg:mx-0">
                مجموعة من الألعاب الجماعية الممتعة اللي تجمعك مع الأصدقاء والعائلة. كل اللي تحتاجه جهاز واحد، والباقي علينا.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-9">
                <Button variant="primary" size="xl" onClick={goPlay}>
                  <Gamepad2 className="w-5 h-5" /> ابدأ اللعب
                </Button>
                <Button variant="outline" size="xl" onClick={() => navigate('/games')}>
                  <Play className="w-5 h-5" /> شاهد جميع الألعاب
                </Button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <Benefit icon={<Users className="w-4 h-4" />} title="اللعب على نفس الجهاز" text="متعة حقيقية مع من حولك" />
                <Benefit icon={<Users className="w-4 h-4" />} title="مناسب للجميع" text="من الأصدقاء إلى العائلة" />
                <Benefit icon={<BadgeCheck className="w-4 h-4" />} title="بدون تسجيل" text="ابدأ اللعب فوراً" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat value="8+" label="ألعاب متنوعة" icon={<Gamepad2 className="w-5 h-5" />} />
          <Stat value="0" label="لاعب مسجل" icon={<Users className="w-5 h-5" />} />
          <Stat value={`${CATEGORIES.length}+`} label="فئة" icon={<LayoutGrid className="w-5 h-5" />} />
          <Stat value={String(history.length)} label="لعبة محفوظة" icon={<Crown className="w-5 h-5" />} />
        </div>
      </section>

      <section className="px-4 pt-4 pb-20 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <h2 className="text-3xl lg:text-4xl font-cairo font-black">ألعاب مميزة</h2>
            <p className="text-off-white/45 mt-2">اختر لعبتك المفضلة وابدأ المتعة الآن</p>
          </div>
          <button onClick={() => navigate('/games')} className="hidden sm:flex items-center gap-2 rounded-full border border-violet-400/30 px-4 py-2 text-sm font-bold text-violet-300 hover:bg-violet-500/10 transition-colors">
            عرض جميع الألعاب <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((game) => {
            const Icon = game.icon;
            return (
              <button
                key={game.title}
                onClick={() => navigate('/games')}
                className="group text-right rounded-3xl border border-white/10 bg-[#0c1730] p-5 min-h-[250px] relative overflow-hidden hover:-translate-y-1 transition-all duration-300"
                style={{ boxShadow: `inset 0 0 0 1px ${game.accent}20` }}
              >
                <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 50% 10%, ${game.accent}22, transparent 40%)` }} />
                <div className="relative h-full flex flex-col">
                  <span className="self-start text-[11px] rounded-full border px-3 py-1 mb-6" style={{ color: game.accent, borderColor: `${game.accent}55`, backgroundColor: `${game.accent}10` }}>{game.badge}</span>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ color: game.accent, backgroundColor: `${game.accent}16`, boxShadow: `0 0 35px ${game.accent}18` }}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="mt-auto">
                    <h3 className="text-2xl font-black mb-2">{game.title}</h3>
                    <p className="text-sm text-off-white/50 leading-6">{game.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Benefit({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-right">
      <div className="flex items-center gap-2 text-cyan-400 mb-1.5">{icon}<span className="font-bold text-sm text-off-white">{title}</span></div>
      <p className="text-xs text-off-white/40">{text}</p>
    </div>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b152a] px-4 py-5 text-center">
      <div className="text-violet-400 flex justify-center mb-2">{icon}</div>
      <div className="text-2xl sm:text-3xl font-black">{value}</div>
      <div className="text-xs sm:text-sm text-off-white/45 mt-1">{label}</div>
    </div>
  );
}
