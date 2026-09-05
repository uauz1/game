import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BadgeCheck, Brain, Camera, CheckCircle2, Crown, Gamepad2,
  Image as ImageIcon, LayoutGrid, Lightbulb, Play, Sparkles, Trophy,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CATEGORIES } from '@/data/categories';
import { loadFromStorage } from '@/utils/storage';
import type { GameResult } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';

const loungeImage = 'https://images.unsplash.com/photo-1778731660432-94af6c4c65c5?auto=format&fit=crop&fm=jpg&q=86&w=1800';

const featured = [
  { title: 'خمن الشخصية', description: 'شخصيات وأحداث مشهورة', icon: Brain, accent: '#ff4f8b', badge: 'جماعي' },
  { title: 'حروف مع عزيز', description: 'كلمات وحروف وتحدي', icon: Lightbulb, accent: '#2f8cff', badge: 'جماعي' },
  { title: 'تحدي الصورة', description: 'صورة واحدة، ألف فكرة', icon: Camera, accent: '#2cd3a8', badge: 'جماعي' },
  { title: 'بنك الكلمات', description: 'كم كلمة تقدر تجمع؟', icon: ImageIcon, accent: '#a64dff', badge: 'جماعي' },
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
    <div className="min-h-screen overflow-hidden bg-[#080d20]">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgba(157,45,255,.20),transparent_28%),radial-gradient(circle_at_55%_10%,rgba(0,175,255,.08),transparent_24%)] pointer-events-none" />
        <div className="relative max-w-[1500px] mx-auto grid lg:grid-cols-[1.15fr_.85fr] min-h-[560px]">
          <div className="relative min-h-[390px] lg:min-h-[560px] order-2 lg:order-1 overflow-hidden">
            <img src={loungeImage} alt="جلسة ألعاب نيون" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080d20]/75 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#080d20]" />
            <div className="absolute inset-0 bg-purple/10 mix-blend-screen" />
            <div className="absolute bottom-7 right-7 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md px-5 py-4 shadow-2xl">
              <p className="text-2xl font-black tracking-tight">قدّها</p>
              <p className="text-xs text-off-white/55 mt-1">اللعب يجمعنا</p>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex items-center px-6 sm:px-10 lg:px-14 py-12 lg:py-16 text-center lg:text-right">
            <div className="w-full max-w-xl mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-off-white/70 mb-6">
                <Sparkles className="w-4 h-4 text-yellow" />
                ألعاب جماعية، أجواء أقرب
              </div>

              <h1 className="font-cairo font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.12] mb-4">
                المتعة تبدأ مع <span className="text-gradient">قدّها</span>
              </h1>
              <p className="text-xl sm:text-2xl font-bold text-off-white/85 mb-4">ألعاب جماعية، أجواء أقرب، وذكريات أكثر</p>
              <p className="text-off-white/55 leading-8 mb-8">
                جمّع أصحابك أو العائلة، اختاروا لعبتكم، وابدأوا التحدي. نفس الجهاز يكفي للجميع.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button variant="primary" size="xl" onClick={goPlay}>
                  <Gamepad2 className="w-5 h-5" /> ابدأ اللعب
                </Button>
                <Button variant="outline" size="xl" onClick={() => navigate('/games')}>
                  <Play className="w-5 h-5" /> شاهد جميع الألعاب
                </Button>
              </div>

              <div className="mt-9 grid sm:grid-cols-3 gap-3 text-right">
                <Benefit icon={<Users className="w-4 h-4" />} title="اللعب على نفس الجهاز" text="جلسة حقيقية مع من حولك" />
                <Benefit icon={<Trophy className="w-4 h-4" />} title="مناسب للجميع" text="للأصدقاء والعائلة" />
                <Benefit icon={<BadgeCheck className="w-4 h-4" />} title="بدون تسجيل" text="ادخل والعب فوراً" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-7 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat value="8+" label="ألعاب متنوعة" icon={<Gamepad2 className="w-5 h-5" />} />
          <Stat value="0" label="لاعب مسجل" icon={<Users className="w-5 h-5" />} />
          <Stat value={`${CATEGORIES.length}+`} label="فئة" icon={<LayoutGrid className="w-5 h-5" />} />
          <Stat value={String(history.length)} label="لعبة محفوظة" icon={<Crown className="w-5 h-5" />} />
        </div>
      </section>

      <section className="px-4 py-14 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-sm text-purple font-bold mb-2">ألعاب مميزة</p>
            <h2 className="text-3xl lg:text-4xl font-cairo font-black">اختار جوّكم وابدأوا</h2>
          </div>
          <button onClick={() => navigate('/games')} className="hidden sm:flex items-center gap-2 text-sm font-bold text-off-white/60 hover:text-white transition-colors">
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
                className="group text-right rounded-3xl border border-white/10 bg-white/[0.035] p-5 min-h-[240px] relative overflow-hidden hover:-translate-y-1 hover:border-white/20 transition-all duration-300"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at 20% 100%, ${game.accent}22, transparent 45%)` }} />
                <div className="relative h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: game.accent + '18', color: game.accent }}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-off-white/50">{game.badge}</span>
                  </div>
                  <div className="mt-auto pt-10">
                    <h3 className="text-xl font-black mb-2">{game.title}</h3>
                    <p className="text-sm text-off-white/50 leading-6">{game.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-20 max-w-5xl mx-auto">
        <Card className="py-10 px-5 sm:px-8 bg-gradient-to-l from-purple/15 via-white/[0.03] to-turquoise/10 border-white/10 text-center">
          <CheckCircle2 className="w-11 h-11 text-turquoise mx-auto mb-4" />
          <h2 className="text-3xl font-cairo font-black mb-3">مكان الجلسة؟ قدّها.</h2>
          <p className="text-off-white/55 mb-7">اختار اللعبة، سمّوا الفرق، وخلو المنافسة تبدأ.</p>
          <Button variant="primary" size="xl" onClick={goPlay}>
            <Play className="w-5 h-5" /> ابدأ الآن
          </Button>
        </Card>
      </section>
    </div>
  );
}

function Benefit({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
      <div className="flex items-center gap-2 text-turquoise mb-1.5">{icon}<span className="font-bold text-sm text-off-white">{title}</span></div>
      <p className="text-xs text-off-white/40">{text}</p>
    </div>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center">
      <div className="text-purple flex justify-center mb-2">{icon}</div>
      <div className="text-2xl sm:text-3xl font-black">{value}</div>
      <div className="text-xs sm:text-sm text-off-white/45 mt-1">{label}</div>
    </div>
  );
}
