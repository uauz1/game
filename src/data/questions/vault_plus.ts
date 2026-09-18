import type { Question } from '@/types';

// Second curated competitive vault: medium/hard, timeless facts, broad category coverage.
export const vaultPlusQuestions: Question[] = [
  // Food
  { id:'vp-food-001', category:'food', difficulty:'medium', type:'multiple', text:'أي صلصة فرنسية كلاسيكية تُحضّر أساسًا من صفار البيض والزبدة المصفاة وعصير الليمون؟', choices:['بشاميل','هولنديز','فيلوتيه','ديمي غلاس'], correctAnswer:1 },
  { id:'vp-food-002', category:'food', difficulty:'hard', type:'multiple', text:'ما الحبوب الأساسية المستخدمة تقليديًا في تحضير البولِنتا الإيطالية؟', choices:['القمح','الذرة','الأرز','الشعير'], correctAnswer:1 },
  { id:'vp-food-003', category:'food', difficulty:'medium', type:'multiple', text:'أي بهار يُستخرج من مياسم زهرة ويُعد من أغلى التوابل؟', choices:['الكمون','الزعفران','الكركم','اليانسون'], correctAnswer:1 },
  { id:'vp-food-004', category:'food', difficulty:'hard', type:'multiple', text:'أي جبن إيطالي يُستخدم تقليديًا في تيراميسو؟', choices:['بارميزان','ماسcarpone','غورغونزولا','موزاريلا'], correctAnswer:1 },
  { id:'vp-food-005', category:'food', difficulty:'medium', type:'multiple', text:'أي تقنية طهي تعني طبخ الطعام ببطء داخل كيس محكم في حمام مائي مضبوط الحرارة؟', choices:['سوتيه','سوفيد','تمبير','غراتان'], correctAnswer:1 },
  { id:'vp-food-006', category:'food', difficulty:'hard', type:'multiple', text:'أي حمض طبيعي مسؤول غالبًا عن الطعم الحامض في الخل؟', choices:['حمض الستريك','حمض الخليك','حمض اللاكتيك','حمض الماليك'], correctAnswer:1 },

  // Medicine / human body
  { id:'vp-med-001', category:'medicine', difficulty:'medium', type:'multiple', text:'أي خلايا دم تنقل الأكسجين أساسًا إلى أنسجة الجسم؟', choices:['كريات الدم الحمراء','الصفائح الدموية','الخلايا العصبية','الخلايا الدهنية'], correctAnswer:0 },
  { id:'vp-med-002', category:'medicine', difficulty:'hard', type:'multiple', text:'في أي جزء من الكلية يحدث الترشيح الأولي للدم داخل النفرون؟', choices:['الكبيبة','الحالب','حوض الكلية','الأنبوب الجامع فقط'], correctAnswer:0 },
  { id:'vp-med-003', category:'medicine', difficulty:'medium', type:'multiple', text:'ما الهرمون الذي يساعد أساسًا على خفض مستوى الغلوكوز في الدم؟', choices:['الأدرينالين','الإنسولين','الكورتيزول','الميلاتونين'], correctAnswer:1 },
  { id:'vp-med-004', category:'medicine', difficulty:'hard', type:'multiple', text:'أي عصب قحفي يتحكم بمعظم حركات اللسان؟', choices:['العصب تحت اللسان','العصب المبهم','العصب البصري','العصب الشمي'], correctAnswer:0 },
  { id:'vp-med-005', category:'medicine', difficulty:'medium', type:'multiple', text:'ما الصبغة الموجودة في كريات الدم الحمراء والمسؤولة عن نقل الأكسجين؟', choices:['الميلانين','الهيموغلوبين','الكيراتين','الإنسولين'], correctAnswer:1 },
  { id:'vp-med-006', category:'medicine', difficulty:'hard', type:'multiple', text:'أي صمام في القلب يقع بين الأذين الأيسر والبطين الأيسر؟', choices:['ثلاثي الشرفات','الميترالي','الرئوي','الأبهري'], correctAnswer:1 },

  // Languages
  { id:'vp-lang-001', category:'languages', difficulty:'medium', type:'multiple', text:'إلى أي عائلة لغوية تنتمي اللغة العربية؟', choices:['الهندو-أوروبية','السامية','الأورالية','السلافية'], correctAnswer:1 },
  { id:'vp-lang-002', category:'languages', difficulty:'hard', type:'multiple', text:'أي لغة من التالية تُعد لغة معزولة لا تُنسب بثقة إلى عائلة لغوية كبرى؟', choices:['الباسكية','الإسبانية','الألمانية','الفارسية'], correctAnswer:0 },
  { id:'vp-lang-003', category:'languages', difficulty:'medium', type:'multiple', text:'أي نظام كتابة تستخدمه اللغة الكورية الحديثة أساسًا؟', choices:['الكانجي','الهانغول','السيريلية','الديفاناغارية'], correctAnswer:1 },
  { id:'vp-lang-004', category:'languages', difficulty:'hard', type:'multiple', text:'أي لغة هندية تُكتب غالبًا بخط الديفاناغاري؟', choices:['الهندية','التاميلية','البنغالية','الأردية'], correctAnswer:0 },
  { id:'vp-lang-005', category:'languages', difficulty:'medium', type:'multiple', text:'ما المصطلح الذي يصف كلمتين لهما معنى متقارب؟', choices:['مترادفتان','متضادتان','متجانستان','مقلوبتان'], correctAnswer:0 },
  { id:'vp-lang-006', category:'languages', difficulty:'hard', type:'multiple', text:'أي لغة من التالية تنتمي إلى الفرع الجرماني؟', choices:['الرومانية','الهولندية','البرتغالية','اليونانية'], correctAnswer:1 },

  // Music
  { id:'vp-music-001', category:'music', difficulty:'medium', type:'multiple', text:'كم نصف نغمة توجد في الأوكتاف ضمن السلم الغربي المتساوي التقسيم؟', choices:['8','10','12','16'], correctAnswer:2 },
  { id:'vp-music-002', category:'music', difficulty:'hard', type:'multiple', text:'أي مفتاح موسيقي يُستخدم غالبًا لكتابة النغمات المنخفضة لآلات مثل التشيلو والباصون؟', choices:['مفتاح صول','مفتاح فا','مفتاح دو فقط','مفتاح لا'], correctAnswer:1 },
  { id:'vp-music-003', category:'music', difficulty:'medium', type:'multiple', text:'أي مصطلح موسيقي إيطالي يعني العزف بصوت خافت؟', choices:['فورتي','بيانو','أليغرو','ليغاتو'], correctAnswer:1 },
  { id:'vp-music-004', category:'music', difficulty:'hard', type:'multiple', text:'أي آلة وترية عربية تقليدية تُعزف غالبًا بريشة ولها صندوق كمثري الشكل؟', choices:['العود','القانون','الربابة','الناي'], correctAnswer:0 },
  { id:'vp-music-005', category:'music', difficulty:'medium', type:'multiple', text:'أي مصطلح يصف الانتقال التدريجي إلى صوت أعلى شدة؟', choices:['كريشندو','ديمينويندو','ستكاتو','أداجيو'], correctAnswer:0 },
  { id:'vp-music-006', category:'music', difficulty:'hard', type:'multiple', text:'أي آلة من التالية تُصنّف ضمن آلات النفخ النحاسية؟', choices:['الأوبوا','الترومبون','الكلارينيت','الفاغوت'], correctAnswer:1 },

  // Economy
  { id:'vp-econ-001', category:'economy', difficulty:'medium', type:'multiple', text:'ما المصطلح الذي يصف إجمالي قيمة السلع والخدمات النهائية المنتجة داخل دولة خلال فترة؟', choices:['الناتج المحلي الإجمالي','الميزان التجاري','الدين العام','السيولة'], correctAnswer:0 },
  { id:'vp-econ-002', category:'economy', difficulty:'hard', type:'multiple', text:'عندما يرفع البنك المركزي سعر الفائدة عادةً، ما الأثر المباشر المتوقع على الاقتراض؟', choices:['يصبح أرخص','يصبح أغلى','ينعدم التضخم فورًا','ترتفع الصادرات تلقائيًا'], correctAnswer:1 },
  { id:'vp-econ-003', category:'economy', difficulty:'medium', type:'multiple', text:'ماذا يعني وجود عجز تجاري؟', choices:['الصادرات أكبر من الواردات','الواردات أكبر من الصادرات','لا توجد تجارة خارجية','العملة بلا قيمة'], correctAnswer:1 },
  { id:'vp-econ-004', category:'economy', difficulty:'hard', type:'multiple', text:'أي مفهوم اقتصادي يصف انخفاض القوة الشرائية للنقود مع ارتفاع المستوى العام للأسعار؟', choices:['الانكماش','التضخم','المقايضة','التنويع'], correctAnswer:1 },
  { id:'vp-econ-005', category:'economy', difficulty:'medium', type:'multiple', text:'ما المقصود بتنويع المحفظة الاستثمارية؟', choices:['وضع المال في أصل واحد','توزيع الاستثمار على أصول متعددة','الاقتراض للاستثمار دائمًا','بيع كل الأصول'], correctAnswer:1 },
  { id:'vp-econ-006', category:'economy', difficulty:'hard', type:'multiple', text:'أي منحنى اقتصادي يوضح عادة العلاقة العكسية بين سعر سلعة والكمية المطلوبة منها؟', choices:['منحنى الطلب','منحنى لافر','منحنى فيليبس','منحنى لورنز'], correctAnswer:0 },

  // Architecture
  { id:'vp-arch-001', category:'architecture', difficulty:'medium', type:'multiple', text:'أي طراز معماري أوروبي اشتهر بالأقواس المدببة والدعامات الطائرة والزجاج المعشق؟', choices:['القوطي','الباروكي','الروكوكو','الكلاسيكي الجديد'], correctAnswer:0 },
  { id:'vp-arch-002', category:'architecture', difficulty:'hard', type:'multiple', text:'من صمم متحف غوغنهايم بلباو؟', choices:['فرانك غيري','فرانك لويد رايت','لو كوربوزييه','تاداو أندو'], correctAnswer:0 },
  { id:'vp-arch-003', category:'architecture', difficulty:'medium', type:'multiple', text:'ما العنصر المعماري المقوس الذي ينقل الأحمال فوق فتحة مثل الباب أو النافذة؟', choices:['العقد','الكرنيش','البهو','الدرابزين'], correctAnswer:0 },
  { id:'vp-arch-004', category:'architecture', difficulty:'hard', type:'multiple', text:'أي معماري ارتبط بتصميم فيلا سافوا في فرنسا؟', choices:['لو كوربوزييه','زها حديد','نورمان فوستر','إيوه مينغ باي'], correctAnswer:0 },
  { id:'vp-arch-005', category:'architecture', difficulty:'medium', type:'multiple', text:'أي مادة إنشائية تنتج أساسًا من الأسمنت والماء والركام؟', choices:['الخرسانة','الجبس','الزجاج','الطين فقط'], correctAnswer:0 },
  { id:'vp-arch-006', category:'architecture', difficulty:'hard', type:'multiple', text:'في العمارة الإسلامية، ماذا يسمى البرج الذي يُرفع منه الأذان عادة؟', choices:['المئذنة','الإيوان','المحراب','الرواق'], correctAnswer:0 },

  // Flags
  { id:'vp-flags-001', category:'flags', difficulty:'medium', type:'multiple', text:'أي دولة يحمل علمها ورقة قيقب حمراء في الوسط؟', choices:['كندا','النمسا','سويسرا','الدنمارك'], correctAnswer:0 },
  { id:'vp-flags-002', category:'flags', difficulty:'hard', type:'multiple', text:'أي دولة هي الوحيدة التي علمها الوطني غير مستطيل الشكل؟', choices:['نيبال','بوتان','الفاتيكان','سويسرا'], correctAnswer:0 },
  { id:'vp-flags-003', category:'flags', difficulty:'medium', type:'multiple', text:'أي لون لا يظهر في علم ألمانيا الحالي؟', choices:['أسود','أحمر','ذهبي','أزرق'], correctAnswer:3 },
  { id:'vp-flags-004', category:'flags', difficulty:'hard', type:'multiple', text:'علم أي دولة يتضمن أرزة خضراء في وسطه؟', choices:['لبنان','الأردن','قبرص','ألبانيا'], correctAnswer:0 },
  { id:'vp-flags-005', category:'flags', difficulty:'medium', type:'multiple', text:'أي دولة يتكون علمها من دائرة حمراء على خلفية بيضاء؟', choices:['اليابان','بنغلاديش','بالاو','إندونيسيا'], correctAnswer:0 },
  { id:'vp-flags-006', category:'flags', difficulty:'hard', type:'multiple', text:'أي دولة يظهر في علمها تنين أبيض؟', choices:['بوتان','ويلز','مالطا','منغوليا'], correctAnswer:0 },

  // Cars
  { id:'vp-cars-001', category:'cars', difficulty:'medium', type:'multiple', text:'ما وظيفة المحول الحفاز Catalytic Converter في السيارة؟', choices:['تقليل ملوثات العادم','زيادة ضغط الإطارات','تبريد الزيت','رفع الجهد الكهربائي'], correctAnswer:0 },
  { id:'vp-cars-002', category:'cars', difficulty:'hard', type:'multiple', text:'في محرك احتراق رباعي الأشواط، ما الشوط الذي يلي شوط الضغط مباشرة؟', choices:['السحب','القدرة/الاحتراق','العادم','التبريد'], correctAnswer:1 },
  { id:'vp-cars-003', category:'cars', difficulty:'medium', type:'multiple', text:'ما الجزء الذي يحول حركة المكبس الخطية إلى حركة دورانية في المحرك؟', choices:['عمود المرفق','الرادياتير','المولد','الثرموستات'], correctAnswer:0 },
  { id:'vp-cars-004', category:'cars', difficulty:'hard', type:'multiple', text:'ما المقصود بنظام الدفع AWD؟', choices:['دفع أمامي فقط','دفع خلفي فقط','دفع لجميع العجلات','نظام مكابح'], correctAnswer:2 },
  { id:'vp-cars-005', category:'cars', difficulty:'medium', type:'multiple', text:'أي سائل ينقل الضغط في نظام المكابح الهيدروليكي؟', choices:['سائل الفرامل','سائل التبريد','زيت المحرك','وقود الديزل'], correctAnswer:0 },
  { id:'vp-cars-006', category:'cars', difficulty:'hard', type:'multiple', text:'أي مكوّن في السيارة يشحن البطارية أثناء دوران المحرك؟', choices:['الستارتر','الدينمو/المولد','المكثف','حساس الأكسجين'], correctAnswer:1 },

  // Space
  { id:'vp-space-001', category:'space', difficulty:'medium', type:'multiple', text:'أي كوكب يملك أكبر عدد معروف من الأقمار بين الكواكب العملاقة وفق الاكتشافات الحديثة المتغيرة؟', choices:['تجنب السؤال المتغير','زحل','المشتري','أورانوس'], correctAnswer:0 },
  { id:'vp-space-002', category:'space', difficulty:'hard', type:'multiple', text:'ما اسم النقاط في نظام جسمين التي يمكن لجسم صغير أن يحافظ قربها على موضع نسبي مستقر؟', choices:['نقاط لاغرانج','نقاط دوبلر','نقاط كبلر','نقاط هابل'], correctAnswer:0 },
  { id:'vp-space-003', category:'space', difficulty:'medium', type:'multiple', text:'أي كوكب له ميل محوري شديد يجعله يبدو وكأنه يدور على جانبه؟', choices:['أورانوس','المريخ','عطارد','المشتري'], correctAnswer:0 },
  { id:'vp-space-004', category:'space', difficulty:'hard', type:'multiple', text:'ما العملية التي تنتج طاقة النجوم الشبيهة بالشمس أساسًا؟', choices:['الانشطار النووي','الاندماج النووي','الاحتراق الكيميائي','التبخر'], correctAnswer:1 },
  { id:'vp-space-005', category:'space', difficulty:'medium', type:'multiple', text:'ما الوحدة الفلكية AU تقريبًا؟', choices:['المسافة بين الأرض والشمس','المسافة بين الأرض والقمر','قطر الشمس','سنة ضوئية'], correctAnswer:0 },
  { id:'vp-space-006', category:'space', difficulty:'hard', type:'multiple', text:'أي نوع نجمي يمثل بقايا نجم منخفض أو متوسط الكتلة بعد نفاد وقوده؟', choices:['قزم أبيض','نجم نيوتروني دائمًا','ثقب أسود دائمًا','نجم أولي'], correctAnswer:0 },

  // Books
  { id:'vp-books-001', category:'books', difficulty:'medium', type:'multiple', text:'من مؤلف رواية الإخوة كارامازوف؟', choices:['فيودور دوستويفسكي','ليو تولستوي','أنطون تشيخوف','إيفان تورغينيف'], correctAnswer:0 },
  { id:'vp-books-002', category:'books', difficulty:'hard', type:'multiple', text:'من مؤلف رواية الحب في زمن الكوليرا؟', choices:['غابرييل غارسيا ماركيز','خورخي لويس بورخيس','بابلو نيرودا','ماريو بارغاس يوسا'], correctAnswer:0 },
  { id:'vp-books-003', category:'books', difficulty:'medium', type:'multiple', text:'أي أديب عربي كتب ثلاثية القاهرة الشهيرة؟', choices:['نجيب محفوظ','توفيق الحكيم','يوسف إدريس','طه حسين'], correctAnswer:0 },
  { id:'vp-books-004', category:'books', difficulty:'hard', type:'multiple', text:'من مؤلف رواية اسم الوردة؟', choices:['أمبرتو إيكو','إيتالو كالفينو','ميلان كونديرا','ألبرتو مورافيا'], correctAnswer:0 },
  { id:'vp-books-005', category:'books', difficulty:'medium', type:'multiple', text:'أي نوع أدبي يعتمد على سرد حياة الشخص بقلمه هو؟', choices:['السيرة الذاتية','المسرحية','الملحمة','المقالة النقدية'], correctAnswer:0 },
  { id:'vp-books-006', category:'books', difficulty:'hard', type:'multiple', text:'من مؤلف رواية دون كيخوته؟', choices:['ميغيل دي ثيربانتس','فيديريكو غارسيا لوركا','دانتي','بوكاشيو'], correctAnswer:0 },

  // Nature
  { id:'vp-nature-001', category:'nature', difficulty:'medium', type:'multiple', text:'أي طبقة من الأرض تقع مباشرة تحت القشرة؟', choices:['الوشاح','اللب الداخلي','اللب الخارجي','الغلاف الجوي'], correctAnswer:0 },
  { id:'vp-nature-002', category:'nature', difficulty:'hard', type:'multiple', text:'ما المصطلح الذي يصف انتقال الماء من أوراق النبات إلى الغلاف الجوي؟', choices:['النتح','التكاثف','الترسيب','التجمد'], correctAnswer:0 },
  { id:'vp-nature-003', category:'nature', difficulty:'medium', type:'multiple', text:'أي نوع من الصخور يتكون من تبرد الصهارة أو الحمم؟', choices:['نارية','رسوبية','متحولة فقط','عضوية فقط'], correctAnswer:0 },
  { id:'vp-nature-004', category:'nature', difficulty:'hard', type:'multiple', text:'أي تيار محيطي دافئ يؤثر بقوة في مناخ غرب أوروبا؟', choices:['تيار الخليج','تيار لابرادور','تيار بنغويلا','تيار همبولت'], correctAnswer:0 },
  { id:'vp-nature-005', category:'nature', difficulty:'medium', type:'multiple', text:'ما المصطلح الذي يصف مجموعة كائنات من النوع نفسه تعيش في منطقة واحدة؟', choices:['جماعة حيوية','مجتمع حيوي','نظام شمسي','سلسلة غذائية'], correctAnswer:0 },
  { id:'vp-nature-006', category:'nature', difficulty:'hard', type:'multiple', text:'أي دورة طبيعية تعتمد عليها بكتيريا تثبيت النيتروجين؟', choices:['دورة النيتروجين','دورة الكربون فقط','دورة الصخور','دورة الأكسجين فقط'], correctAnswer:0 },

  // Inventions
  { id:'vp-inv-001', category:'inventions', difficulty:'medium', type:'multiple', text:'من طوّر أول لقاح ناجح ضد الجدري في أواخر القرن الثامن عشر؟', choices:['إدوارد جينر','لويس باستور','روبرت كوخ','جوزيف ليستر'], correctAnswer:0 },
  { id:'vp-inv-002', category:'inventions', difficulty:'hard', type:'multiple', text:'أي مخترع ارتبط بتطوير المحرك الحثي للتيار المتناوب؟', choices:['نيكولا تسلا','توماس إديسون','ألكسندر بيل','غولييلمو ماركوني'], correctAnswer:0 },
  { id:'vp-inv-003', category:'inventions', difficulty:'medium', type:'multiple', text:'أي جهاز غيّر الملاحة البحرية عبر تحديد خطوط العرض اعتمادًا على الأجرام؟', choices:['السدس','الميكروسكوب','البارومتر','الغراموفون'], correctAnswer:0 },
  { id:'vp-inv-004', category:'inventions', difficulty:'hard', type:'multiple', text:'من طوّر شبكة الويب العالمية World Wide Web؟', choices:['تيم برنرز-لي','آلان تورنغ','فينت سيرف وحده','دينيس ريتشي'], correctAnswer:0 },
  { id:'vp-inv-005', category:'inventions', difficulty:'medium', type:'multiple', text:'أي اختراع مكّن من حفظ الصوت وتشغيله ميكانيكيًا في القرن التاسع عشر؟', choices:['الفونوغراف','التلغراف','التلسكوب','البارومتر'], correctAnswer:0 },
  { id:'vp-inv-006', category:'inventions', difficulty:'hard', type:'multiple', text:'من ابتكر مقياس درجة الحرارة الزئبقي وارتبط باسمه سلم حراري شهير؟', choices:['دانيال فهرنهايت','أندرس سيلسيوس','كلفن','باسكال'], correctAnswer:0 },

  // General knowledge
  { id:'vp-general-001', category:'general', difficulty:'medium', type:'multiple', text:'أي معدن رمزه الكيميائي Ag؟', choices:['الفضة','الذهب','الألومنيوم','الأرجون'], correctAnswer:0 },
  { id:'vp-general-002', category:'general', difficulty:'hard', type:'multiple', text:'أي بحر يفصل بين شبه الجزيرة العربية وشمال شرق أفريقيا؟', choices:['البحر الأحمر','بحر العرب','البحر الأسود','بحر قزوين'], correctAnswer:0 },
  { id:'vp-general-003', category:'general', difficulty:'medium', type:'multiple', text:'كم عدد أضلاع الشكل الاثنا عشري؟', choices:['10','11','12','14'], correctAnswer:2 },
  { id:'vp-general-004', category:'general', difficulty:'hard', type:'multiple', text:'أي عنصر يحمل العدد الذري 26؟', choices:['الحديد','النحاس','الزنك','النيكل'], correctAnswer:0 },
  { id:'vp-general-005', category:'general', difficulty:'medium', type:'multiple', text:'أي دولة تقع فيها مدينة مراكش؟', choices:['المغرب','تونس','الجزائر','موريتانيا'], correctAnswer:0 },
  { id:'vp-general-006', category:'general', difficulty:'hard', type:'multiple', text:'ما اسم العلم الذي يدرس الزلازل؟', choices:['علم الزلازل','علم المناخ','علم الصخور فقط','علم الأحياء الدقيقة'], correctAnswer:0 },

  // Saudi
  { id:'vp-saudi-001', category:'saudi', difficulty:'medium', type:'multiple', text:'أي مدينة سعودية تُعرف تاريخيًا بواحة كبيرة وتشتهر بجبل القارة؟', choices:['الهفوف/الأحساء','تبوك','أبها','حائل'], correctAnswer:0 },
  { id:'vp-saudi-002', category:'saudi', difficulty:'hard', type:'multiple', text:'أي موقع تراثي سعودي يضم حي الطريف التاريخي؟', choices:['الدرعية','العلا','جدة التاريخية','نجران'], correctAnswer:0 },
  { id:'vp-saudi-003', category:'saudi', difficulty:'medium', type:'multiple', text:'أي بحر يحد الساحل الغربي للمملكة العربية السعودية؟', choices:['البحر الأحمر','بحر العرب','الخليج العربي','البحر المتوسط'], correctAnswer:0 },
  { id:'vp-saudi-004', category:'saudi', difficulty:'hard', type:'multiple', text:'أي منطقة سعودية تشتهر بمدرجاتها الزراعية ومناخها الجبلي في الجنوب الغربي؟', choices:['عسير','القصيم','الشرقية','الجوف'], correctAnswer:0 },
  { id:'vp-saudi-005', category:'saudi', difficulty:'medium', type:'multiple', text:'أي سلسلة رملية تربط تقريبًا بين النفود الكبير والربع الخالي؟', choices:['الدهناء','تهامة','السروات','طويق'], correctAnswer:0 },
  { id:'vp-saudi-006', category:'saudi', difficulty:'hard', type:'multiple', text:'أي مدينة أثرية سعودية كانت محطة بارزة على طريق الحج الشامي القديم؟', choices:['تيماء','دومة الجندل','الهفوف','صبيا'], correctAnswer:1 },
];
