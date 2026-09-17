import { connectionCards, riddles, speedQuestions } from '../data/newPartyGames';

export type AutoJudgeResult = {
  supported: boolean;
  correct: boolean | null;
  points: number;
  canonical?: string;
  reason?: string;
};

type IntruderKey = { items: string[]; answer: string; points: number };

const INTRUDER_KEYS: IntruderKey[] = [
  {items:['أسد','نمر','فهد','دلفين'],answer:'دلفين',points:100},
  {items:['ويندوز','أندرويد','لينكس','كروم'],answer:'كروم',points:100},
  {items:['كرة القدم','كرة السلة','كرة الطائرة','السباحة'],answer:'السباحة',points:100},
  {items:['تفاح','موز','برتقال','بطاطس'],answer:'بطاطس',points:100},
  {items:['الرياض','جدة','الدمام','دبي'],answer:'دبي',points:100},
  {items:['الأرض','المريخ','المشتري','القمر'],answer:'القمر',points:100},
  {items:['كتاب','قلم','دفتر','سيارة'],answer:'سيارة',points:100},
  {items:['طبيب','مهندس','معلم','مطار'],answer:'مطار',points:100},
  {items:['النيل','الأمازون','الدانوب','إيفرست'],answer:'إيفرست',points:200},
  {items:['الهيدروجين','الأكسجين','النيتروجين','الماء'],answer:'الماء',points:200},
  {items:['نجيب محفوظ','طه حسين','المتنبي','أحمد زويل'],answer:'أحمد زويل',points:200},
  {items:['الأموية','العباسية','العثمانية','الأنديز'],answer:'الأنديز',points:200},
  {items:['تويوتا','هوندا','نيسان','إيرباص'],answer:'إيرباص',points:200},
  {items:['HTML','CSS','JavaScript','Photoshop'],answer:'Photoshop',points:200},
  {items:['ويمبلدون','رولان غاروس','أستراليا المفتوحة','مونزا'],answer:'مونزا',points:200},
  {items:['القاهرة','الرباط','تونس','إسطنبول'],answer:'إسطنبول',points:200},
  {items:['نيوتن','جول','واط','مول'],answer:'مول',points:300},
  {items:['ليسوتو','بوتسوانا','زامبيا','مدغشقر'],answer:'مدغشقر',points:300},
  {items:['الخوارزمي','ابن الهيثم','البيروني','ابن بطوطة'],answer:'ابن بطوطة',points:300},
  {items:['دوستويفسكي','تولستوي','تشيخوف','غابرييل غارسيا ماركيز'],answer:'غابرييل غارسيا ماركيز',points:300},
  {items:['عطارد','الزهرة','الأرض','نبتون'],answer:'نبتون',points:300},
  {items:['موناكو','سيلفرستون','مونزا','ويمبلي'],answer:'ويمبلي',points:300},
  {items:['الإسبانية','الفرنسية','الإيطالية','الألمانية'],answer:'الألمانية',points:300},
  {items:['TCP','UDP','HTTP','JPEG'],answer:'JPEG',points:300},
];

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u064b-\u065f\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/[^\u0621-\u063a\u0641-\u064aA-Za-z0-9]/g, '');
}

function same(a: string, b: string) {
  const left = normalize(a);
  const right = normalize(b);
  return Boolean(left && right && (left === right || left.includes(right) || right.includes(left)));
}

function pageText() {
  return document.body?.innerText || '';
}

function findTuple(rows: [string,string][]) {
  const text = pageText();
  return rows.find(([question]) => text.includes(question));
}

function judgeFast(answer: string): AutoJudgeResult {
  const row = findTuple(speedQuestions);
  if (!row) return { supported:true, correct:null, points:0, reason:'تعذر تحديد السؤال الحالي' };
  return { supported:true, correct:same(answer,row[1]), points:100, canonical:row[1] };
}

function judgeRiddle(answer: string): AutoJudgeResult {
  const row = findTuple(riddles);
  if (!row) return { supported:true, correct:null, points:0, reason:'تعذر تحديد الفزورة الحالية' };
  return { supported:true, correct:same(answer,row[1]), points:100, canonical:row[1] };
}

function judgeConnection(answer: string): AutoJudgeResult {
  const text = pageText();
  const card = connectionCards
    .map(item => ({ item, hits:item.clues.filter(clue => text.includes(clue)).length }))
    .sort((a,b)=>b.hits-a.hits)[0];
  if (!card || card.hits < 1) return { supported:true, correct:null, points:0, reason:'تعذر تحديد بطاقة الرابط الحالية' };
  const accepted = [card.item.answer, ...card.item.aliases];
  return { supported:true, correct:accepted.some(value=>same(answer,value)), points:100, canonical:card.item.answer };
}

function judgeIntruder(answer: string): AutoJudgeResult {
  const text = pageText();
  const key = INTRUDER_KEYS
    .map(item => ({ item, hits:item.items.filter(value=>text.includes(value)).length }))
    .sort((a,b)=>b.hits-a.hits)[0];
  if (!key || key.hits < 3) return { supported:true, correct:null, points:0, reason:'تعذر تحديد جولة الدخيل الحالية' };
  const numeric = Number(answer.trim());
  let submitted = answer;
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 4) submitted = key.item.items[numeric-1];
  return { supported:true, correct:same(submitted,key.item.answer), points:key.item.points, canonical:key.item.answer };
}

export function autoJudgeMultiplayerAnswer(gameId: string, answer: string): AutoJudgeResult {
  if (!answer.trim()) return { supported:false, correct:null, points:0 };
  if (gameId === 'fast') return judgeFast(answer);
  if (gameId === 'riddles') return judgeRiddle(answer);
  if (gameId === 'connection') return judgeConnection(answer);
  if (gameId === 'intruder') return judgeIntruder(answer);
  return { supported:false, correct:null, points:0 };
}
