import type { Category } from '@/types';

export const CATEGORIES: Category[] = [
  { id:'general', name:'معلومات عامة', icon:'Globe', color:'#7056E8', bgColor:'#7056E820', description:'أسئلة متنوعة في كل المجالات', questionCount:15 },
  { id:'islamic', name:'إسلاميات', icon:'Moon', color:'#35D1C5', bgColor:'#35D1C520', description:'أسئلة دينية وأمور إسلامية', questionCount:15 },
  { id:'sports', name:'رياضة', icon:'Trophy', color:'#FFC83D', bgColor:'#FFC83D20', description:'أسئلة رياضية متنوعة', questionCount:15 },
  { id:'football', name:'كرة القدم', icon:'Volleyball', color:'#FF625F', bgColor:'#FF625F20', description:'أسئلة عن كرة القدم العالمية', questionCount:15 },
  { id:'history', name:'تاريخ', icon:'Scroll', color:'#FFB347', bgColor:'#FFB34720', description:'أحداث تاريخية وحضارات', questionCount:15 },
  { id:'geography', name:'جغرافيا', icon:'Map', color:'#5B8DEF', bgColor:'#5B8DEF20', description:'دول، عواصم، ومعالم جغرافية', questionCount:15 },
  { id:'science', name:'علوم', icon:'FlaskConical', color:'#35D1C5', bgColor:'#35D1C520', description:'فيزياء، كيمياء، وأحياء', questionCount:15 },
  { id:'tech', name:'تقنية', icon:'Cpu', color:'#7056E8', bgColor:'#7056E820', description:'تكنولوجيا وبرمجة', questionCount:15 },
  { id:'movies', name:'أفلام ومسلسلات', icon:'Film', color:'#FF625F', bgColor:'#FF625F20', description:'أفلام عربية وعالمية', questionCount:15 },
  { id:'games', name:'ألعاب إلكترونية', icon:'Gamepad2', color:'#FFC83D', bgColor:'#FFC83D20', description:'ألعاب فيديو شهيرة', questionCount:15 },
  { id:'puzzles', name:'ألغاز وذكاء', icon:'Puzzle', color:'#FF8FA3', bgColor:'#FF8FA320', description:'ألغاز ذكاء ومنطق', questionCount:15 },
  { id:'animals', name:'حيوانات', icon:'PawPrint', color:'#6BCB77', bgColor:'#6BCB7720', description:'عالم الحيوانات', questionCount:15 },
  { id:'famous', name:'شخصيات مشهورة', icon:'Star', color:'#FFB347', bgColor:'#FFB34720', description:'شخصيات تاريخية ومعاصرة', questionCount:15 },
  { id:'saudi', name:'السعودية', icon:'Building2', color:'#35D1C5', bgColor:'#35D1C520', description:'معلومات عن المملكة العربية السعودية', questionCount:15 },
  { id:'world', name:'حول العالم', icon:'Compass', color:'#5B8DEF', bgColor:'#5B8DEF20', description:'ثقافات ودول حول العالم', questionCount:15 },
  { id:'truefalse', name:'صح أو خطأ', icon:'CheckCircle', color:'#FF625F', bgColor:'#FF625F20', description:'أسئلة صح أو خطأ متنوعة', questionCount:15 },

  { id:'food', name:'أكل ومطابخ', icon:'Utensils', color:'#F97316', bgColor:'#F9731620', description:'أطباق ومكونات ومطابخ العالم', questionCount:5 },
  { id:'cars', name:'سيارات', icon:'Car', color:'#38BDF8', bgColor:'#38BDF820', description:'شركات سيارات وتقنيات ومعلومات', questionCount:5 },
  { id:'space', name:'فضاء وفلك', icon:'Rocket', color:'#A78BFA', bgColor:'#A78BFA20', description:'كواكب ونجوم ومجرات', questionCount:5 },
  { id:'medicine', name:'طب وجسم الإنسان', icon:'Stethoscope', color:'#FB7185', bgColor:'#FB718520', description:'الجسم والصحة والمعلومات الطبية العامة', questionCount:5 },
  { id:'languages', name:'لغات وكلمات', icon:'Languages', color:'#2DD4BF', bgColor:'#2DD4BF20', description:'لغات العالم وأصولها', questionCount:5 },
  { id:'books', name:'كتب وأدب', icon:'BookOpen', color:'#C084FC', bgColor:'#C084FC20', description:'روايات وكتّاب وأعمال أدبية', questionCount:5 },
  { id:'music', name:'موسيقى وآلات', icon:'Music2', color:'#F472B6', bgColor:'#F472B620', description:'آلات ومصطلحات موسيقية', questionCount:5 },
  { id:'nature', name:'طبيعة وبيئة', icon:'Leaf', color:'#4ADE80', bgColor:'#4ADE8020', description:'النباتات والبيئة والظواهر الطبيعية', questionCount:5 },
  { id:'inventions', name:'اختراعات ومخترعون', icon:'Lightbulb', color:'#FACC15', bgColor:'#FACC1520', description:'اختراعات غيرت العالم', questionCount:5 },
  { id:'economy', name:'اقتصاد ومال', icon:'Landmark', color:'#22C55E', bgColor:'#22C55E20', description:'مصطلحات اقتصادية ومالية', questionCount:5 },
  { id:'architecture', name:'معالم وعمارة', icon:'Building', color:'#F59E0B', bgColor:'#F59E0B20', description:'مبانٍ شهيرة ومعالم حول العالم', questionCount:5 },
  { id:'flags', name:'أعلام ودول', icon:'Flag', color:'#60A5FA', bgColor:'#60A5FA20', description:'ألوان ورموز أعلام الدول', questionCount:5 },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
