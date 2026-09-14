import type { Question } from '@/types';

// Second curated expansion focused on previously shallow categories.
// All entries are stable facts and intentionally medium/hard.
export const vaultExpansionQuestions: Question[] = [
  { id:'vx-food-001', category:'food', text:'أي جبن إيطالي يُستخدم تقليديًا في التيراميسو؟', choices:['موزاريلا','ماسكاربوني','بارميزان','ريكوتا'], correctAnswer:1, difficulty:'medium', type:'multiple' },
  { id:'vx-food-002', category:'food', text:'ما اسم تقنية الطهي الفرنسية التي تعني طهي الطعام ببطء في دهنه؟', choices:['كونفي','سوتيه','بلانش','فلومبيه'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-food-003', category:'food', text:'أي نوع من المعكرونة اسمه يعني حرفيًا «فراشات» بالإيطالية؟', choices:['فارفالي','بيني','لينغويني','ريغاتوني'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-food-004', category:'food', text:'أي بهار يعطي كثيرًا من أطباق الكاري لونها الأصفر المميز؟', choices:['الكركم','القرنفل','جوزة الطيب','اليانسون'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-food-005', category:'food', text:'من أي حبوب يُصنع البرغل تقليديًا؟', choices:['القمح','الأرز','الشعير','الذرة'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-food-006', category:'food', text:'ما الاسم الياباني لفول الصويا الأخضر الذي يقدم غالبًا كطبق جانبي؟', choices:['إدامامي','تمبيه','ميسو','نوري'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-food-007', category:'food', text:'أي صلصة فرنسية كلاسيكية أساسها صفار البيض والزبدة المصفاة؟', choices:['هولنديز','بشاميل','فيليوتيه','ديمي غلاس'], correctAnswer:0, difficulty:'hard', type:'multiple' },

  { id:'vx-medicine-001', category:'medicine', text:'أي جزء من الدم مسؤول أساسًا عن التجلط؟', choices:['الصفائح الدموية','كريات الدم الحمراء','البلازما فقط','الخلايا العصبية'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-medicine-002', category:'medicine', text:'أي عظم هو الأطول في جسم الإنسان؟', choices:['عظم الفخذ','العضد','الظنبوب','الكعبرة'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-medicine-003', category:'medicine', text:'أي حجرة قلبية تضخ الدم المؤكسج إلى أنحاء الجسم؟', choices:['البطين الأيسر','البطين الأيمن','الأذين الأيمن','الأذين الأيسر'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-medicine-004', category:'medicine', text:'في أي عضو يتم إنتاج الصفراء أساسًا؟', choices:['الكبد','المرارة','المعدة','البنكرياس'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-medicine-005', category:'medicine', text:'ما الاسم الطبي للعظم المعروف بصابونة الركبة؟', choices:['الرضفة','الزند','الشظية','القص'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-medicine-006', category:'medicine', text:'أي عصب قحفي يرتبط أساسًا بحاسة الشم؟', choices:['العصب الشمي','العصب البصري','العصب الوجهي','العصب المبهم'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-medicine-007', category:'medicine', text:'ما الوحدة الوظيفية الأساسية في الكلية؟', choices:['النيفرون','الحويصلة الهوائية','المحور العصبي','الزغابة'], correctAnswer:0, difficulty:'hard', type:'multiple' },

  { id:'vx-languages-001', category:'languages', text:'إلى أي عائلة لغوية تنتمي العربية؟', choices:['السامية','الرومانسية','السلافية','الجرمانية'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-languages-002', category:'languages', text:'أي لغة أوروبية ليست من اللغات الهندوأوروبية؟', choices:['الفنلندية','الإسبانية','الألمانية','اليونانية'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-languages-003', category:'languages', text:'ما اسم نظام الكتابة المستخدم في اللغة الكورية؟', choices:['هانغول','هيراغانا','ديفاناغاري','سيريلية'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-languages-004', category:'languages', text:'أي لغة هي الأقرب إلى الإسبانية من حيث الأصل ضمن اللغات الرومانسية؟', choices:['البرتغالية','الروسية','التركية','الفنلندية'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-languages-005', category:'languages', text:'ما المقصود بالمورفيم في علم اللغة؟', choices:['أصغر وحدة لغوية تحمل معنى أو وظيفة','صوت منفرد دائمًا','جملة كاملة','نوع من الخط'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-languages-006', category:'languages', text:'أي لغة تستخدم خط الديفاناغاري على نطاق واسع؟', choices:['الهندية','اليابانية','العبرية','الجورجية'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-languages-007', category:'languages', text:'ما المصطلح الذي يصف كلمتين لهما نطق متشابه ومعنيان مختلفان؟', choices:['الجناس الصوتي','الترادف','التضاد','الاشتقاق'], correctAnswer:0, difficulty:'hard', type:'multiple' },

  { id:'vx-music-001', category:'music', text:'أي مفتاح موسيقي يستخدم غالبًا لكتابة النغمات الأعلى مثل الكمان؟', choices:['مفتاح صول','مفتاح فا','مفتاح دو فقط','مفتاح إيقاعي'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-music-002', category:'music', text:'أي مصطلح موسيقي يعني الزيادة التدريجية في شدة الصوت؟', choices:['كريشندو','ديمينويندو','ليغاتو','ستكاتو'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-music-003', category:'music', text:'أي آلة أوركسترالية تنتمي إلى عائلة النفخ الخشبية رغم أنها تصنع غالبًا من المعدن؟', choices:['الفلوت','الترومبيت','الترومبون','التوبا'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-music-004', category:'music', text:'ما المسافة الموسيقية بين نغمتين لهما الاسم نفسه وتفصل بينهما ثماني درجات؟', choices:['أوكتاف','خامسة','ثالثة','ثانية'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-music-005', category:'music', text:'أي مصطلح يعني عزف النغمات بصورة منفصلة وقصيرة؟', choices:['ستكاتو','ليغاتو','أداجيو','فورتي'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-music-006', category:'music', text:'أي آلة وترية عربية تُعزف عادة بالريشة ولا تحتوي على دساتين؟', choices:['العود','الكمان','القانون فقط','التشيللو'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-music-007', category:'music', text:'في السلم الغربي التقليدي، كم نصف درجة يحتوي الأوكتاف؟', choices:['12','8','10','14'], correctAnswer:0, difficulty:'hard', type:'multiple' },

  { id:'vx-economy-001', category:'economy', text:'ماذا يقيس الناتج المحلي الإجمالي GDP أساسًا؟', choices:['قيمة السلع والخدمات النهائية المنتجة داخل اقتصاد خلال فترة','عدد السكان فقط','إجمالي الذهب لدى البنوك','حجم الصادرات فقط'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-economy-002', category:'economy', text:'ما السياسة التي يستخدم فيها البنك المركزي أسعار الفائدة وعرض النقود؟', choices:['السياسة النقدية','السياسة الجمركية','السياسة السكانية','السياسة الزراعية'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-economy-003', category:'economy', text:'ماذا يعني مصطلح «سوق احتكار القلة»؟', choices:['سوق تهيمن عليه شركات قليلة','سوق فيه بائع واحد فقط','سوق بلا بائعين','سوق حكومي فقط'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-economy-004', category:'economy', text:'أي مؤشر يقيس عادة تغير أسعار سلة من السلع والخدمات التي يشتريها المستهلك؟', choices:['مؤشر أسعار المستهلك','مؤشر كتلة الجسم','مؤشر التنمية البشرية فقط','مؤشر داو جونز فقط'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-economy-005', category:'economy', text:'ما معنى «تكلفة الفرصة البديلة»؟', choices:['قيمة أفضل بديل تم التخلي عنه','السعر بعد الضريبة فقط','تكلفة الشحن','تكلفة الاقتراض فقط'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-economy-006', category:'economy', text:'ما المصطلح الذي يصف انخفاضًا عامًا ومستمرًا في مستوى الأسعار؟', choices:['الانكماش السعري','التضخم','الركود فقط','التوسع النقدي'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-economy-007', category:'economy', text:'في التجارة الدولية، ماذا يعني وجود فائض تجاري؟', choices:['الصادرات أكبر من الواردات','الواردات أكبر من الصادرات','الصادرات تساوي صفرًا','لا توجد عملة محلية'], correctAnswer:0, difficulty:'medium', type:'multiple' },

  { id:'vx-architecture-001', category:'architecture', text:'أي عنصر معماري استخدمه الرومان بكثرة لتوزيع الأحمال فوق الفتحات؟', choices:['القوس','الهرم','المئذنة','المسلة'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-architecture-002', category:'architecture', text:'أي طراز أوروبي اشتهر بالأقواس المدببة والدعامات الطائرة؟', choices:['القوطي','الباروكي','الرومانسكي فقط','الحداثي'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-architecture-003', category:'architecture', text:'من صمم مبنى Fallingwater الشهير؟', choices:['فرانك لويد رايت','لو كوربوزييه','فرانك غيري','إيرو سارينن'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-architecture-004', category:'architecture', text:'أي مادة إنشائية تتميز بقوة عالية في الضغط وضعف نسبي في الشد ما لم تُسلّح؟', choices:['الخرسانة','الفولاذ','الخشب الرقائقي','الألمنيوم'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-architecture-005', category:'architecture', text:'ما اسم الفناء الداخلي المفتوح الذي يعد عنصرًا شائعًا في العمارة العربية التقليدية؟', choices:['الحوش أو الفناء','الرواق الخارجي فقط','القبوة','المنارة'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-architecture-006', category:'architecture', text:'ما وظيفة الدعامة الطائرة في الكاتدرائيات القوطية؟', choices:['نقل دفع القبو والسقف إلى دعامات خارجية','إضاءة المبنى','تهوية القبو','تزيين الأرضية فقط'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-architecture-007', category:'architecture', text:'أي مهندس معماري ارتبط بمتحف غوغنهايم بلباو؟', choices:['فرانك غيري','نورمان فوستر','زاها حديد','رينزو بيانو'], correctAnswer:0, difficulty:'hard', type:'multiple' },

  { id:'vx-flags-001', category:'flags', text:'أي علم وطني غير مستطيل الشكل؟', choices:['نيبال','اليابان','سويسرا','البرازيل'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-flags-002', category:'flags', text:'أي دولة يحمل علمها ورقة قيقب حمراء؟', choices:['كندا','النمسا','الدنمارك','بيرو'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-flags-003', category:'flags', text:'أي علم وطني يحمل تنينًا أبيض كبيرًا؟', choices:['بوتان','منغوليا','نيبال','سريلانكا'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-flags-004', category:'flags', text:'أي دولة يحمل علمها دائرة حمراء على خلفية بيضاء؟', choices:['اليابان','بنغلاديش','بالاو','إندونيسيا'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-flags-005', category:'flags', text:'أي دولة يتوسط علمها أرز أخضر؟', choices:['لبنان','قبرص','الأردن','تونس'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-flags-006', category:'flags', text:'أي دولة يحمل علمها صليبًا أبيض على خلفية حمراء؟', choices:['سويسرا','السويد','فنلندا','النرويج'], correctAnswer:0, difficulty:'medium', type:'multiple' },
  { id:'vx-flags-007', category:'flags', text:'أي دولة أفريقية يحمل علمها نجمة سوداء في شريط أصفر بين الأحمر والأخضر؟', choices:['غانا','السنغال','الكاميرون','إثيوبيا'], correctAnswer:0, difficulty:'hard', type:'multiple' },

  { id:'vx-cars-001', category:'cars', text:'ما الاسم الشائع للمكوّن الذي يحول غازات العادم الضارة إلى مواد أقل ضررًا؟', choices:['المحول الحفاز','المبرد','المولد','القابض'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-space-001', category:'space', text:'أي نقطة لاغرانج يستخدمها تلسكوب جيمس ويب تقريبًا للعمل حول الشمس والأرض؟', choices:['L2','L1','L4','L5'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-books-001', category:'books', text:'من مؤلف رواية «مئة عام من العزلة»؟', choices:['غابرييل غارسيا ماركيز','خورخي لويس بورخيس','ماريو بارغاس يوسا','بابلو نيرودا'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-nature-001', category:'nature', text:'أي منطقة حيوية تتميز بتربة دائمة التجمد تُعرف بالبيرمافروست؟', choices:['التندرا','السافانا','الغابات المطيرة','البحر المتوسط'], correctAnswer:0, difficulty:'hard', type:'multiple' },
  { id:'vx-inventions-001', category:'inventions', text:'من طوّر أول بطارية كهربائية عملية معروفة باسم الكومة الفولتية؟', choices:['أليساندرو فولتا','مايكل فاراداي','جيمس واط','نيكولا تسلا'], correctAnswer:0, difficulty:'hard', type:'multiple' },
];
