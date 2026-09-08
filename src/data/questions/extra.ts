import type { Question } from '@/types';

export const extraQuestions: Question[] = [
  { id:'x-gen-1', category:'general', difficulty:'easy', type:'multiple', text:'كم دقيقة في الساعة الواحدة؟', choices:['30','45','60','90'], correctAnswer:2 },
  { id:'x-gen-2', category:'general', difficulty:'medium', type:'multiple', text:'أي كوكب يُعرف بالكوكب الأحمر؟', choices:['الزهرة','المريخ','المشتري','عطارد'], correctAnswer:1 },
  { id:'x-gen-3', category:'general', difficulty:'medium', type:'multiple', text:'ما المعدن السائل في درجة حرارة الغرفة؟', choices:['الحديد','الزئبق','النحاس','الألومنيوم'], correctAnswer:1 },
  { id:'x-gen-4', category:'general', difficulty:'hard', type:'multiple', text:'ما الرمز الكيميائي للفضة؟', choices:['Ag','Au','Fe','Si'], correctAnswer:0 },

  { id:'x-isl-1', category:'islamic', difficulty:'easy', type:'multiple', text:'كم عدد أركان الإسلام؟', choices:['4','5','6','7'], correctAnswer:1 },
  { id:'x-isl-2', category:'islamic', difficulty:'medium', type:'multiple', text:'ما أول شهر في السنة الهجرية؟', choices:['رمضان','محرم','صفر','شوال'], correctAnswer:1 },
  { id:'x-isl-3', category:'islamic', difficulty:'medium', type:'multiple', text:'كم عدد الصلوات المفروضة في اليوم والليلة؟', choices:['3','4','5','6'], correctAnswer:2 },
  { id:'x-isl-4', category:'islamic', difficulty:'hard', type:'multiple', text:'ما السورة التي لا تبدأ بالبسملة؟', choices:['الأنفال','التوبة','يونس','هود'], correctAnswer:1 },

  { id:'x-spo-1', category:'sports', difficulty:'easy', type:'multiple', text:'كم لاعبًا يوجد داخل الملعب في فريق كرة السلة؟', choices:['4','5','6','7'], correctAnswer:1 },
  { id:'x-spo-2', category:'sports', difficulty:'medium', type:'multiple', text:'في أي رياضة تُستخدم الريشة الطائرة؟', choices:['التنس','الريشة الطائرة','الاسكواش','كرة اليد'], correctAnswer:1 },
  { id:'x-spo-3', category:'sports', difficulty:'medium', type:'multiple', text:'كم يبلغ طول سباق الماراثون تقريبًا؟', choices:['21.1 كم','30 كم','42.195 كم','50 كم'], correctAnswer:2 },
  { id:'x-spo-4', category:'sports', difficulty:'hard', type:'multiple', text:'كم حلقة في شعار الألعاب الأولمبية؟', choices:['4','5','6','7'], correctAnswer:1 },

  { id:'x-foot-1', category:'football', difficulty:'easy', type:'multiple', text:'كم لاعبًا يبدأ المباراة لكل فريق في كرة القدم؟', choices:['9','10','11','12'], correctAnswer:2 },
  { id:'x-foot-2', category:'football', difficulty:'medium', type:'multiple', text:'ما مدة الشوط الواحد في كرة القدم؟', choices:['30 دقيقة','40 دقيقة','45 دقيقة','50 دقيقة'], correctAnswer:2 },
  { id:'x-foot-3', category:'football', difficulty:'medium', type:'multiple', text:'كم بطاقة حمراء تعني طرد اللاعب من المباراة؟', choices:['واحدة','اثنتان','ثلاث','أربع'], correctAnswer:0 },
  { id:'x-foot-4', category:'football', difficulty:'hard', type:'multiple', text:'في أي دولة أُقيمت أول بطولة لكأس العالم عام 1930؟', choices:['البرازيل','إيطاليا','الأوروغواي','فرنسا'], correctAnswer:2 },

  { id:'x-his-1', category:'history', difficulty:'easy', type:'multiple', text:'أي حضارة بنت الأهرامات في الجيزة؟', choices:['الرومانية','المصرية القديمة','الإغريقية','الفارسية'], correctAnswer:1 },
  { id:'x-his-2', category:'history', difficulty:'medium', type:'multiple', text:'في أي عام سقطت القسطنطينية على يد العثمانيين؟', choices:['1453','1492','1517','1588'], correctAnswer:0 },
  { id:'x-his-3', category:'history', difficulty:'medium', type:'multiple', text:'من أول إمبراطور روماني؟', choices:['يوليوس قيصر','أغسطس','نيرون','تراجان'], correctAnswer:1 },
  { id:'x-his-4', category:'history', difficulty:'hard', type:'multiple', text:'أي معاهدة أنهت الحرب العالمية الأولى رسميًا مع ألمانيا؟', choices:['فرساي','باريس','روما','فيينا'], correctAnswer:0 },

  { id:'x-geo-1', category:'geography', difficulty:'easy', type:'multiple', text:'في أي قارة تقع البرازيل؟', choices:['آسيا','أفريقيا','أمريكا الجنوبية','أوروبا'], correctAnswer:2 },
  { id:'x-geo-2', category:'geography', difficulty:'medium', type:'multiple', text:'ما عاصمة كندا؟', choices:['تورونتو','فانكوفر','أوتاوا','مونتريال'], correctAnswer:2 },
  { id:'x-geo-3', category:'geography', difficulty:'medium', type:'multiple', text:'أي بحر يفصل بين أوروبا وأفريقيا؟', choices:['بحر العرب','البحر المتوسط','بحر قزوين','البحر الأسود'], correctAnswer:1 },
  { id:'x-geo-4', category:'geography', difficulty:'hard', type:'multiple', text:'ما أعلى جبل في أفريقيا؟', choices:['إيفرست','كليمنجارو','أطلس','كينيا'], correctAnswer:1 },

  { id:'x-sci-1', category:'science', difficulty:'easy', type:'multiple', text:'ما الغاز الذي يحتاجه الإنسان للتنفس؟', choices:['النيتروجين','الأكسجين','الهيدروجين','الهيليوم'], correctAnswer:1 },
  { id:'x-sci-2', category:'science', difficulty:'medium', type:'multiple', text:'ما العضو الذي يضخ الدم في جسم الإنسان؟', choices:['الرئة','الكبد','القلب','الكلية'], correctAnswer:2 },
  { id:'x-sci-3', category:'science', difficulty:'medium', type:'multiple', text:'عند أي درجة مئوية يتجمد الماء النقي تقريبًا؟', choices:['0','10','32','100'], correctAnswer:0 },
  { id:'x-sci-4', category:'science', difficulty:'hard', type:'multiple', text:'ما وحدة قياس القوة في النظام الدولي؟', choices:['الجول','الواط','النيوتن','الباسكال'], correctAnswer:2 },

  { id:'x-tech-1', category:'tech', difficulty:'easy', type:'multiple', text:'ماذا تعني CPU في الحاسب؟', choices:['وحدة المعالجة المركزية','ذاكرة التخزين','بطاقة الشاشة','نظام التشغيل'], correctAnswer:0 },
  { id:'x-tech-2', category:'tech', difficulty:'medium', type:'multiple', text:'أي بروتوكول يُستخدم عادة لتصفح صفحات الويب الآمنة؟', choices:['FTP','HTTPS','SMTP','SSH'], correctAnswer:1 },
  { id:'x-tech-3', category:'tech', difficulty:'medium', type:'multiple', text:'أي شركة طورت نظام أندرويد في بداياته ثم استحوذت عليه جوجل؟', choices:['Android Inc.','Nokia','IBM','Adobe'], correctAnswer:0 },
  { id:'x-tech-4', category:'tech', difficulty:'hard', type:'multiple', text:'ما النظام الثنائي الذي تعتمد عليه الحواسيب أساسًا؟', choices:['0 و1','1 و2','A وB','8 و16'], correctAnswer:0 },

  { id:'x-mov-1', category:'movies', difficulty:'easy', type:'multiple', text:'ما وظيفة المخرج في الفيلم أساسًا؟', choices:['إدارة الأداء والرؤية الفنية','بيع التذاكر','تصميم المبنى','توزيع المقاعد'], correctAnswer:0 },
  { id:'x-mov-2', category:'movies', difficulty:'medium', type:'multiple', text:'ما اسم الجائزة السينمائية الأمريكية الشهيرة التي تمنحها أكاديمية فنون وعلوم الصور المتحركة؟', choices:['إيمي','أوسكار','غرامي','توني'], correctAnswer:1 },
  { id:'x-mov-3', category:'movies', difficulty:'medium', type:'multiple', text:'أي عنصر يحدد ترتيب المشاهد والحوار قبل التصوير؟', choices:['السيناريو','الملصق','شباك التذاكر','الإعلان'], correctAnswer:0 },
  { id:'x-mov-4', category:'movies', difficulty:'hard', type:'multiple', text:'أي مصطلح يعني تصوير المشهد في لقطة واحدة مستمرة دون قطع؟', choices:['مونتاج','لقطة طويلة','دبلجة','مؤثر بصري'], correctAnswer:1 },

  { id:'x-game-1', category:'games', difficulty:'easy', type:'multiple', text:'أي شركة تشتهر بشخصية ماريو؟', choices:['Nintendo','Sony','Valve','Sega'], correctAnswer:0 },
  { id:'x-game-2', category:'games', difficulty:'medium', type:'multiple', text:'ما اسم اللعبة الكلاسيكية التي تعتمد على قطع هندسية تسقط من أعلى الشاشة؟', choices:['Tetris','Pac-Man','Doom','Pong'], correctAnswer:0 },
  { id:'x-game-3', category:'games', difficulty:'medium', type:'multiple', text:'أي جهاز ألعاب تنتجه شركة Sony؟', choices:['Xbox','PlayStation','Switch','Dreamcast'], correctAnswer:1 },
  { id:'x-game-4', category:'games', difficulty:'hard', type:'multiple', text:'من ابتكر لعبة Tetris الأصلية؟', choices:['شغيرو مياموتو','أليكسي باجيتنوف','جون كارماك','غايب نيويل'], correctAnswer:1 },

  { id:'x-puz-1', category:'puzzles', difficulty:'easy', type:'multiple', text:'شيء كلما أخذت منه كبر، ما هو؟', choices:['الحفرة','البحر','الجبل','الظل'], correctAnswer:0 },
  { id:'x-puz-2', category:'puzzles', difficulty:'medium', type:'multiple', text:'ما العدد التالي في النمط: 2، 4، 8، 16؟', choices:['18','24','30','32'], correctAnswer:3 },
  { id:'x-puz-3', category:'puzzles', difficulty:'medium', type:'multiple', text:'إذا كان لديك 3 تفاحات وأخذت تفاحتين، كم تفاحة أصبحت معك؟', choices:['1','2','3','5'], correctAnswer:1 },
  { id:'x-puz-4', category:'puzzles', difficulty:'hard', type:'multiple', text:'ما العدد الناقص: 1، 1، 2، 3، 5، 8، ؟', choices:['10','11','12','13'], correctAnswer:3 },

  { id:'x-ani-1', category:'animals', difficulty:'easy', type:'multiple', text:'أي حيوان يُعرف بأنه أكبر حيوان حي على الأرض؟', choices:['الفيل الأفريقي','الحوت الأزرق','الزرافة','القرش الأبيض'], correctAnswer:1 },
  { id:'x-ani-2', category:'animals', difficulty:'medium', type:'multiple', text:'أي طائر لا يستطيع الطيران ويعيش طبيعيًا في القارة القطبية الجنوبية؟', choices:['البطريق','النسر','البجعة','الصقر'], correctAnswer:0 },
  { id:'x-ani-3', category:'animals', difficulty:'medium', type:'multiple', text:'كم قلبًا للأخطبوط؟', choices:['1','2','3','4'], correctAnswer:2 },
  { id:'x-ani-4', category:'animals', difficulty:'hard', type:'multiple', text:'ما الثديي الوحيد القادر على الطيران الحقيقي المستمر؟', choices:['السنجاب الطائر','الخفاش','الليمور','الكسلان'], correctAnswer:1 },

  { id:'x-fam-1', category:'famous', difficulty:'easy', type:'multiple', text:'من رسم لوحة الموناليزا؟', choices:['بيكاسو','ليوناردو دا فينشي','فان غوخ','ميكيلانجيلو'], correctAnswer:1 },
  { id:'x-fam-2', category:'famous', difficulty:'medium', type:'multiple', text:'من وضع قوانين الحركة الثلاثة الشهيرة؟', choices:['نيوتن','أينشتاين','غاليليو','داروين'], correctAnswer:0 },
  { id:'x-fam-3', category:'famous', difficulty:'medium', type:'multiple', text:'من اشتهر بنظرية النسبية؟', choices:['ألبرت أينشتاين','ماري كوري','لويس باستور','تسلا'], correctAnswer:0 },
  { id:'x-fam-4', category:'famous', difficulty:'hard', type:'multiple', text:'من مؤلف رواية البؤساء؟', choices:['فيكتور هوغو','تولستوي','ديكنز','دوستويفسكي'], correctAnswer:0 },

  { id:'x-sau-1', category:'saudi', difficulty:'easy', type:'multiple', text:'ما البحر الذي يحد السعودية من الغرب؟', choices:['بحر العرب','البحر الأحمر','الخليج العربي','البحر المتوسط'], correctAnswer:1 },
  { id:'x-sau-2', category:'saudi', difficulty:'medium', type:'multiple', text:'في أي مدينة يقع برج المملكة الشهير؟', choices:['جدة','الرياض','الخبر','أبها'], correctAnswer:1 },
  { id:'x-sau-3', category:'saudi', difficulty:'medium', type:'multiple', text:'أي مدينة سعودية تُعرف بعروس البحر الأحمر؟', choices:['الرياض','جدة','الطائف','تبوك'], correctAnswer:1 },
  { id:'x-sau-4', category:'saudi', difficulty:'hard', type:'multiple', text:'ما المنطقة التاريخية المسجلة في اليونسكو والتي تقع قرب العلا؟', choices:['مدائن صالح (الحِجر)','الدرعية فقط','رجال ألمع','جبة'], correctAnswer:0 },

  { id:'x-wor-1', category:'world', difficulty:'easy', type:'multiple', text:'ما عاصمة إيطاليا؟', choices:['ميلانو','روما','نابولي','فلورنسا'], correctAnswer:1 },
  { id:'x-wor-2', category:'world', difficulty:'medium', type:'multiple', text:'أي دولة تستخدم الفرنك السويسري؟', choices:['سويسرا','إسبانيا','البرتغال','اليونان'], correctAnswer:0 },
  { id:'x-wor-3', category:'world', difficulty:'medium', type:'multiple', text:'في أي قارة تقع الأرجنتين؟', choices:['أوروبا','أفريقيا','أمريكا الجنوبية','آسيا'], correctAnswer:2 },
  { id:'x-wor-4', category:'world', difficulty:'hard', type:'multiple', text:'ما عاصمة نيوزيلندا؟', choices:['أوكلاند','ويلينغتون','كرايستشيرش','هاميلتون'], correctAnswer:1 },

  { id:'x-tf-1', category:'truefalse', difficulty:'easy', type:'truefalse', text:'الشمس نجم.', choices:['صح','خطأ'], correctAnswer:0 },
  { id:'x-tf-2', category:'truefalse', difficulty:'medium', type:'truefalse', text:'عدد قلوب الأخطبوط ثلاثة.', choices:['صح','خطأ'], correctAnswer:0 },
  { id:'x-tf-3', category:'truefalse', difficulty:'medium', type:'truefalse', text:'أوتاوا هي عاصمة كندا.', choices:['صح','خطأ'], correctAnswer:0 },
  { id:'x-tf-4', category:'truefalse', difficulty:'hard', type:'truefalse', text:'الزئبق هو أقرب كوكب إلى الشمس.', choices:['صح','خطأ'], correctAnswer:0 },
];
