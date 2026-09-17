import type { Question } from '@/types';

// Curated timeless expansion: each category deliberately includes easy, medium,
// and hard entries so visible difficulty labels have enough real content behind them.
export const difficultyExpansionQuestions: Question[] = [
  { id:'dx-gen-e1', category:'general', difficulty:'easy', type:'multiple', text:'أي أداة تُستخدم لقياس درجة الحرارة؟', choices:['البارومتر','الترمومتر','البوصلة','المجهر'], correctAnswer:1 },
  { id:'dx-gen-m1', category:'general', difficulty:'medium', type:'multiple', text:'ما وحدة قياس شدة التيار الكهربائي؟', choices:['الفولت','الأمبير','الواط','الأوم'], correctAnswer:1 },
  { id:'dx-gen-h1', category:'general', difficulty:'hard', type:'multiple', text:'أي فرع من الرياضيات يدرس خواص الأشكال التي لا تتغير عند المط أو الثني المستمر؟', choices:['الطوبولوجيا','الإحصاء','الحساب التفاضلي','نظرية الأعداد'], correctAnswer:0 },

  { id:'dx-saudi-e1', category:'saudi', difficulty:'easy', type:'multiple', text:'على أي بحر تقع مدينة جدة؟', choices:['البحر الأحمر','بحر العرب','البحر المتوسط','الخليج العربي'], correctAnswer:0 },
  { id:'dx-saudi-m1', category:'saudi', difficulty:'medium', type:'multiple', text:'في أي منطقة إدارية تقع محافظة العلا؟', choices:['تبوك','المدينة المنورة','حائل','القصيم'], correctAnswer:1 },
  { id:'dx-saudi-h1', category:'saudi', difficulty:'hard', type:'multiple', text:'ما اسم الموقع الأثري النبطي في العلا والمسجل ضمن قائمة التراث العالمي؟', choices:['الحِجر','ذي عين','رجال ألمع','الفاو'], correctAnswer:0 },

  { id:'dx-sports-e1', category:'sports', difficulty:'easy', type:'multiple', text:'كم لاعبًا من كل فريق يكون داخل ملعب كرة السلة في الوقت نفسه؟', choices:['4','5','6','7'], correctAnswer:1 },
  { id:'dx-sports-m1', category:'sports', difficulty:'medium', type:'multiple', text:'كم حلقة يتكوّن منها الرمز الأولمبي؟', choices:['4','5','6','7'], correctAnswer:1 },
  { id:'dx-sports-h1', category:'sports', difficulty:'hard', type:'multiple', text:'ما المسافة الرسمية لسباق الماراثون؟', choices:['40 كم','41.5 كم','42.195 كم','43 كم'], correctAnswer:2 },

  { id:'dx-foot-e1', category:'football', difficulty:'easy', type:'multiple', text:'كم لاعبًا يبدأ به فريق كرة القدم المباراة داخل الملعب؟', choices:['9','10','11','12'], correctAnswer:2 },
  { id:'dx-foot-m1', category:'football', difficulty:'medium', type:'multiple', text:'كم تبعد نقطة ركلة الجزاء عن خط المرمى؟', choices:['9 أمتار','10 أمتار','11 مترًا','12 مترًا'], correctAnswer:2 },
  { id:'dx-foot-h1', category:'football', difficulty:'hard', type:'multiple', text:'أي قانون يحدد متى يكون المهاجم في موقف تسلل؟', choices:['القانون 9','القانون 10','القانون 11','القانون 12'], correctAnswer:2 },

  { id:'dx-hist-e1', category:'history', difficulty:'easy', type:'multiple', text:'في أي حضارة شُيّدت أهرامات الجيزة؟', choices:['الرومانية','المصرية القديمة','الفارسية','المايا'], correctAnswer:1 },
  { id:'dx-hist-m1', category:'history', difficulty:'medium', type:'multiple', text:'من ارتبط اسمه بتطوير الطباعة بالحروف المتحركة في أوروبا؟', choices:['غوتنبرغ','غاليليو','نيوتن','مورس'], correctAnswer:0 },
  { id:'dx-hist-h1', category:'history', difficulty:'hard', type:'multiple', text:'في أي عام وُقّعت معاهدات صلح وستفاليا التي أنهت حرب الثلاثين عامًا؟', choices:['1618','1648','1688','1713'], correctAnswer:1 },

  { id:'dx-geo-e1', category:'geography', difficulty:'easy', type:'multiple', text:'ما أعلى جبل فوق مستوى سطح البحر؟', choices:['كي 2','إيفرست','كليمنجارو','إلبروس'], correctAnswer:1 },
  { id:'dx-geo-m1', category:'geography', difficulty:'medium', type:'multiple', text:'أي مضيق يصل البحر المتوسط بالمحيط الأطلسي؟', choices:['هرمز','ملقا','جبل طارق','باب المندب'], correctAnswer:2 },
  { id:'dx-geo-h1', category:'geography', difficulty:'hard', type:'multiple', text:'ما أعمق بحيرة في العالم؟', choices:['سوبيريور','بايكال','فيكتوريا','تيتيكاكا'], correctAnswer:1 },

  { id:'dx-sci-e1', category:'science', difficulty:'easy', type:'multiple', text:'ما الرمز الكيميائي للماء؟', choices:['CO2','H2O','O2','NaCl'], correctAnswer:1 },
  { id:'dx-sci-m1', category:'science', difficulty:'medium', type:'multiple', text:'أي عضية تُعرف بأنها مصدر الطاقة في الخلية؟', choices:['النواة','الميتوكوندريا','الريبوسوم','جهاز غولجي'], correctAnswer:1 },
  { id:'dx-sci-h1', category:'science', difficulty:'hard', type:'multiple', text:'ما قيمة عدد أفوجادرو تقريبًا؟', choices:['6.022×10²³','9.81×10²','3.00×10⁸','1.602×10⁻¹⁹'], correctAnswer:0 },

  { id:'dx-tech-e1', category:'tech', difficulty:'easy', type:'multiple', text:'ماذا تعني CPU في الحاسوب؟', choices:['وحدة المعالجة المركزية','وحدة التخزين السحابي','واجهة المستخدم','ذاكرة القراءة فقط'], correctAnswer:0 },
  { id:'dx-tech-m1', category:'tech', difficulty:'medium', type:'multiple', text:'ما البروتوكول المشفر المستخدم عادة لتصفح مواقع الويب بأمان؟', choices:['HTTP','HTTPS','FTP','SMTP'], correctAnswer:1 },
  { id:'dx-tech-h1', category:'tech', difficulty:'hard', type:'multiple', text:'كم خطوة أساسية يتكون منها إنشاء اتصال TCP التقليدي؟', choices:['خطوتان','ثلاث خطوات','أربع خطوات','خمس خطوات'], correctAnswer:1 },

  { id:'dx-games-e1', category:'games', difficulty:'easy', type:'multiple', text:'في الشطرنج، أي قطعة تتحرك على شكل حرف L؟', choices:['الفيل','الحصان','القلعة','الوزير'], correctAnswer:1 },
  { id:'dx-games-m1', category:'games', difficulty:'medium', type:'multiple', text:'كم مربعًا توجد في رقعة الشطرنج القياسية؟', choices:['56','64','72','81'], correctAnswer:1 },
  { id:'dx-games-h1', category:'games', difficulty:'hard', type:'multiple', text:'ما المصطلح في الشطرنج لحالة تهديد الملك دون وجود نقلة قانونية تنقذه؟', choices:['كش','كش مات','تعادل','تبييت'], correctAnswer:1 },

  { id:'dx-animals-e1', category:'animals', difficulty:'easy', type:'multiple', text:'أي من هذه الحيوانات من الثدييات؟', choices:['الدلفين','القرش','الأخطبوط','البطريق'], correctAnswer:0 },
  { id:'dx-animals-m1', category:'animals', difficulty:'medium', type:'multiple', text:'كم قلبًا لدى الأخطبوط؟', choices:['واحد','اثنان','ثلاثة','أربعة'], correctAnswer:2 },
  { id:'dx-animals-h1', category:'animals', difficulty:'hard', type:'multiple', text:'أي ثديي من التالي يضع البيض؟', choices:['خلد الماء','الكوالا','الدلفين','الكسلان'], correctAnswer:0 },

  { id:'dx-space-e1', category:'space', difficulty:'easy', type:'multiple', text:'أي كوكب يُعرف بالكوكب الأحمر؟', choices:['الزهرة','المريخ','المشتري','عطارد'], correctAnswer:1 },
  { id:'dx-space-m1', category:'space', difficulty:'medium', type:'multiple', text:'ما أكبر كواكب المجموعة الشمسية؟', choices:['زحل','المشتري','نبتون','الأرض'], correctAnswer:1 },
  { id:'dx-space-h1', category:'space', difficulty:'hard', type:'multiple', text:'كم عدد نقاط لاغرانج في نظام مكوّن من جسمين رئيسيين؟', choices:['3','4','5','6'], correctAnswer:2 },

  { id:'dx-food-e1', category:'food', difficulty:'easy', type:'multiple', text:'من أي دولة اشتهر طبق السوشي؟', choices:['الصين','اليابان','تايلند','كوريا'], correctAnswer:1 },
  { id:'dx-food-m1', category:'food', difficulty:'medium', type:'multiple', text:'أي نوع أرز يُستخدم كثيرًا في تحضير الريزوتو؟', choices:['أربوريو','بسمتي','ياسمين','أسود'], correctAnswer:0 },
  { id:'dx-food-h1', category:'food', difficulty:'hard', type:'multiple', text:'ما اسم التفاعل المسؤول عن تحمير كثير من الأطعمة عند تسخين البروتينات والسكريات؟', choices:['مايار','الأسموزية','التحلل المائي','البسترة'], correctAnswer:0 },

  { id:'dx-cars-e1', category:'cars', difficulty:'easy', type:'multiple', text:'ما وظيفة حزام الأمان الأساسية؟', choices:['زيادة السرعة','تقليل حركة الراكب عند التصادم','تبريد المحرك','تقليل استهلاك الوقود'], correctAnswer:1 },
  { id:'dx-cars-m1', category:'cars', difficulty:'medium', type:'multiple', text:'ماذا يعني اختصار ABS في السيارات؟', choices:['نظام منع انغلاق المكابح','نظام رفع ضغط الوقود','نظام تبريد البطارية','نظام ضبط الإضاءة'], correctAnswer:0 },
  { id:'dx-cars-h1', category:'cars', difficulty:'hard', type:'multiple', text:'ما وظيفة الترس التفاضلي في السيارة؟', choices:['السماح للعجلات بالدوران بسرعات مختلفة عند المنعطف','رفع ضغط الزيت','تشغيل المكيف','زيادة جهد البطارية'], correctAnswer:0 },

  { id:'dx-lang-e1', category:'languages', difficulty:'easy', type:'multiple', text:'أي لغة تُكتب عادة من اليمين إلى اليسار؟', choices:['العربية','الفرنسية','الإسبانية','الألمانية'], correctAnswer:0 },
  { id:'dx-lang-m1', category:'languages', difficulty:'medium', type:'multiple', text:'ما النظام الكتابي الأساسي للغة الكورية الحديثة؟', choices:['الهانغول','الكانجي','السيريلية','اللاتينية فقط'], correctAnswer:0 },
  { id:'dx-lang-h1', category:'languages', difficulty:'hard', type:'multiple', text:'أي لغة أوروبية تُعد غالبًا لغة معزولة لا تنتمي لعائلة لغوية معروفة؟', choices:['الباسكية','الإيطالية','الهولندية','السويدية'], correctAnswer:0 },

  { id:'dx-music-e1', category:'music', difficulty:'easy', type:'multiple', text:'أي آلة لها مفاتيح سوداء وبيضاء؟', choices:['البيانو','العود','الناي','الكمان'], correctAnswer:0 },
  { id:'dx-music-m1', category:'music', difficulty:'medium', type:'multiple', text:'كم نصف نغمة في الأوكتاف ضمن النظام الغربي المتساوي؟', choices:['8','10','12','14'], correctAnswer:2 },
  { id:'dx-music-h1', category:'music', difficulty:'hard', type:'multiple', text:'أي مفتاح موسيقي يُستخدم غالبًا للنغمات المنخفضة مثل التشيلو والباص؟', choices:['مفتاح صول','مفتاح فا','مفتاح دو فقط','مفتاح لا'], correctAnswer:1 },

  { id:'dx-econ-e1', category:'economy', difficulty:'easy', type:'multiple', text:'ما المقصود بالتضخم بصورة عامة؟', choices:['ارتفاع عام في الأسعار','انخفاض عدد السكان','زيادة ساعات اليوم','ثبات الأسعار دائمًا'], correctAnswer:0 },
  { id:'dx-econ-m1', category:'economy', difficulty:'medium', type:'multiple', text:'ماذا يعني تنويع المحفظة الاستثمارية؟', choices:['توزيع الاستثمار على أصول متعددة','شراء أصل واحد فقط','الاقتراض دائمًا','البيع اليومي فقط'], correctAnswer:0 },
  { id:'dx-econ-h1', category:'economy', difficulty:'hard', type:'multiple', text:'أي منحنى يوضح عادة العلاقة بين عدم المساواة في الدخل والتوزيع التراكمي؟', choices:['منحنى لورنز','منحنى لافر','منحنى فيليبس','منحنى الطلب'], correctAnswer:0 },

  { id:'dx-med-e1', category:'medicine', difficulty:'easy', type:'multiple', text:'أي عضو يضخ الدم إلى أنحاء الجسم؟', choices:['الرئة','القلب','الكبد','المعدة'], correctAnswer:1 },
  { id:'dx-med-m1', category:'medicine', difficulty:'medium', type:'multiple', text:'أي مكوّن من الدم يساعد أساسًا في عملية التجلط؟', choices:['الصفائح الدموية','الخلايا العصبية','الميلانين','الغضروف'], correctAnswer:0 },
  { id:'dx-med-h1', category:'medicine', difficulty:'hard', type:'multiple', text:'ما اسم الصمام الواقع بين الأذين الأيسر والبطين الأيسر؟', choices:['الميترالي','ثلاثي الشرفات','الرئوي','الأبهري'], correctAnswer:0 },
];
