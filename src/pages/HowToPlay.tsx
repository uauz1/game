import { useNavigate } from 'react-router-dom';
import {
  Gamepad2, Users, LayoutGrid, Clock, Trophy, Zap, Scissors, Star,
  HelpCircle, ChevronLeft, CheckCircle, ListChecks,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/contexts/SettingsContext';

export function HowToPlay() {
  const navigate = useNavigate();
  const { playSound } = useSettings();

  const steps = [
    { icon: <Gamepad2 className="w-8 h-8" />, color: '#7056E8', title: '1. اختر نمط اللعب', desc: 'حدد كيف تريد أن تلعب: فردي، فريق ضد فريق، تحدي أصدقاء، أو تحدي سريع.' },
    { icon: <Users className="w-8 h-8" />, color: '#35D1C5', title: '2. أضف اللاعبين', desc: 'أدخل أسماء اللاعبين أو الفرق، واختر لوناً وصورة رمزية لكل لاعب.' },
    { icon: <LayoutGrid className="w-8 h-8" />, color: '#FFC83D', title: '3. اختر التصنيفات', desc: 'حدد تصنيفاً واحداً أو أكثر من بين 16 تصنيفاً مختلفاً.' },
    { icon: <HelpCircle className="w-8 h-8" />, color: '#FF625F', title: '4. حدد الصعوبة والعدد', desc: 'اختر مستوى الصعوبة (سهل، متوسط، صعب، مختلط) وعدد الأسئلة (10-30).' },
    { icon: <Clock className="w-8 h-8" />, color: '#35D1C5', title: '5. اضبط المؤقت', desc: 'اختر الوقت المتاح لكل سؤال: بدون مؤقت، 15، 30، أو 60 ثانية.' },
    { icon: <Trophy className="w-8 h-8" />, color: '#FFC83D', title: '6. ابدأ التحدي!', desc: 'أجب على الأسئلة، استخدم القوى الخاصة بذكاء، وتنافس على أعلى نقاط.' },
  ];

  const powers = [
    { icon: <Scissors className="w-6 h-6" />, color: '#7056E8', title: 'حذف إجابتين', desc: 'يحذف إجابتين خاطئتين من الخيارات الأربعة لتسهيل الاختيار.' },
    { icon: <Clock className="w-6 h-6" />, color: '#35D1C5', title: 'وقت إضافي', desc: 'يضيف 15 ثانية إضافية إلى المؤقت الحالي للسؤال.' },
    { icon: <Star className="w-6 h-6" />, color: '#FFC83D', title: 'مضاعفة النقاط', desc: 'يضاعف النقاط التي تحصل عليها عند الإجابة الصحيحة على السؤال.' },
  ];

  const tips = [
    'كل لاعب يمكنه استخدام كل قوة خاصة مرة واحدة فقط في اللعبة.',
    'النقاط تُحسب بناءً على الصعوبة والوقت المتبقي - أجب بسرعة لنقاط أكثر!',
    'في الألعاب الجماعية، يتناوب اللاعبون على الإجابة تلقائياً.',
    'يمكنك استخدام لوحة المفاتيح (1-4) لاختيار الإجابة على الكمبيوتر.',
    'يمكنك الخروج من اللعبة في أي وقت بالضغط على زر الخروج.',
  ];

  return (
    <div className="min-h-screen px-4 py-6 lg:py-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <HelpCircle className="w-8 h-8 text-purple" />
        <h1 className="text-2xl lg:text-3xl font-cairo font-black">كيف تلعب؟</h1>
      </div>
      <p className="text-sm text-off-white/60 mb-8">دليلك الشامل للعب والمتعة مع تحدّي</p>

      {/* Steps */}
      <h2 className="text-xl font-bold mb-4">خطوات اللعب</h2>
      <div className="space-y-3 mb-8">
        {steps.map((step) => (
          <Card key={step.title} className="p-4 flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: step.color + '20', color: step.color }}
            >
              {step.icon}
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">{step.title}</h3>
              <p className="text-sm text-off-white/60 leading-relaxed">{step.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Power-ups */}
      <h2 className="text-xl font-bold mb-4">القوى الخاصة</h2>
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {powers.map((power) => (
          <Card key={power.title} className="p-5 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: power.color + '20', color: power.color }}
            >
              {power.icon}
            </div>
            <h3 className="font-bold mb-2">{power.title}</h3>
            <p className="text-xs text-off-white/60">{power.desc}</p>
          </Card>
        ))}
      </div>

      {/* Tips */}
      <h2 className="text-xl font-bold mb-4">نصائح مفيدة</h2>
      <Card className="p-5 mb-8">
        <ul className="space-y-3">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-turquoise shrink-0 mt-0.5" />
              <span className="text-sm text-off-white/80 leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Game modes explanation */}
      <h2 className="text-xl font-bold mb-4">أنماط اللعب</h2>
      <div className="space-y-3 mb-8">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple/20 text-purple flex items-center justify-center shrink-0">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold">لعب فردي</p>
            <p className="text-sm text-off-white/60">العب بمفردك وتحدّ نفسك لتحقيق أعلى نتيجة.</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-turquoise/20 text-turquoise flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold">فريق ضد فريق</p>
            <p className="text-sm text-off-white/60">تنافس بين فريقين أو أكثر، ويتناوب اللاعبون على الإجابة.</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral/20 text-coral flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold">تحدي سريع</p>
            <p className="text-sm text-off-white/60">5 أسئلة سريعة بإعدادات مسبقة، مثالي للعب السريع.</p>
          </div>
        </Card>
      </div>

      {/* CTA */}
      <div className="text-center py-6">
        <Button variant="primary" size="xl" onClick={() => { playSound('click'); navigate('/play'); }}>
          <Gamepad2 className="w-5 h-5" />
          جاهز للعب!
        </Button>
      </div>
    </div>
  );
}
