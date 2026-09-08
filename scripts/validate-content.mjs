import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

function loadDataFile(relativePath) {
  const filePath = path.resolve(relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', output)(module, module.exports);
  return module.exports;
}

const errors = [];
const seen = new Map();
const register = (id, label) => {
  if (!id) errors.push(`${label}: معرّف مفقود`);
  if (seen.has(id)) errors.push(`${label}: المعرّف مكرر مع ${seen.get(id)} (${id})`);
  else seen.set(id, label);
};

const party = loadDataFile('src/data/party.ts');
party.questions.forEach((question, index) => {
  register(`teams:${question.id}`, `قدّها فرق #${index + 1}`);
  if (!question.category?.trim() || !question.q?.trim()) errors.push(`قدّها فرق #${index + 1}: فئة أو سؤال مفقود`);
  if (!Array.isArray(question.answers) || question.answers.length < 2) errors.push(`قدّها فرق #${index + 1}: خيارات غير كافية`);
  if (!Number.isInteger(question.correct) || !question.answers[question.correct]) errors.push(`قدّها فرق #${index + 1}: إجابة صحيحة غير صالحة`);
});

const huroof = loadDataFile('src/data/huroofQuestions.ts');
huroof.huroofQuestions.forEach((question, index) => {
  register(`letters:${question.id}`, `حروف #${index + 1}`);
  if (!question.letter?.trim() || !question.prompt?.trim() || !question.answer?.trim()) errors.push(`حروف #${index + 1}: بيانات ناقصة`);
});

const who = loadDataFile('src/data/whoAmIQuestions.ts');
who.WHO_AM_I_CARDS.forEach((card, index) => {
  register(`who:${card.id}`, `من أنا #${index + 1}`);
  if (!card.answer?.trim() || !card.category?.trim()) errors.push(`من أنا #${index + 1}: إجابة أو فئة مفقودة`);
  if (!Array.isArray(card.clues) || card.clues.length < 3 || card.clues.some(clue => !clue.trim())) errors.push(`من أنا #${index + 1}: التلميحات ناقصة`);
});

const newGames = loadDataFile('src/data/newPartyGames.ts');
newGames.characterCards.forEach((card, index) => {
  register(`character:${card.id}`, `خمن الشخصية #${index + 1}`);
  if (!card.answer?.trim() || !card.category?.trim() || !card.difficulty) errors.push(`خمن الشخصية #${index + 1}: بيانات أساسية ناقصة`);
  if (!Array.isArray(card.hints) || card.hints.length < 3 || card.hints.some(hint => !hint.trim())) errors.push(`خمن الشخصية #${index + 1}: التلميحات ناقصة`);
  if (!Array.isArray(card.options) || card.options.length < 3 || !card.options.includes(card.answer)) errors.push(`خمن الشخصية #${index + 1}: الخيارات لا تحتوي الإجابة الصحيحة`);
});
newGames.photoCards.forEach((card, index) => {
  register(`photo:${card.id}`, `تحدي الصورة #${index + 1}`);
  if (!card.answer?.trim() || !card.category?.trim() || !card.position?.trim()) errors.push(`تحدي الصورة #${index + 1}: بيانات ناقصة`);
});
newGames.wordCards.forEach((card, index) => {
  register(`word:${card.id}`, `بنك الكلمات #${index + 1}`);
  if (!card.word?.trim() || !card.category?.trim()) errors.push(`بنك الكلمات #${index + 1}: كلمة أو فئة مفقودة`);
  if (!Array.isArray(card.taboo) || card.taboo.length < 3 || card.taboo.some(word => !word.trim())) errors.push(`بنك الكلمات #${index + 1}: الكلمات الممنوعة ناقصة`);
});
newGames.feudRounds.forEach((item, index) => {
  register(`feud:${item.id}`, `تحدي العائلة #${index + 1}`);
  if (!item.question?.trim() || !Array.isArray(item.answers) || item.answers.length < 4) errors.push(`تحدي العائلة #${index + 1}: السؤال أو الإجابات ناقصة`);
  if (item.answers.some(([answer, points]) => !answer?.trim() || !Number.isFinite(points) || points <= 0)) errors.push(`تحدي العائلة #${index + 1}: إجابة أو نقاط غير صالحة`);
});
[...newGames.riddles, ...newGames.speedQuestions].forEach((item, index) => {
  if (!Array.isArray(item) || item.length !== 2 || item.some(value => !String(value).trim())) errors.push(`سؤال سريع/فزورة #${index + 1}: سؤال أو إجابة مفقودة`);
});

const normalizedQuestions = party.questions.map(question => question.q.trim().toLowerCase());
const duplicates = normalizedQuestions.filter((question, index) => normalizedQuestions.indexOf(question) !== index);
if (duplicates.length) errors.push(`قدّها فرق: ${new Set(duplicates).size} سؤال مكرر نصيًا في المصدر الأساسي`);

const newQuestionTexts = [...newGames.riddles, ...newGames.speedQuestions].map(item => item[0].trim().toLowerCase());
const newDuplicates = newQuestionTexts.filter((question, index) => newQuestionTexts.indexOf(question) !== index);
if (newDuplicates.length) errors.push(`الألعاب الجديدة: ${new Set(newDuplicates).size} سؤال مكرر نصيًا`);

if (errors.length) {
  console.error(`فشل فحص المحتوى (${errors.length} مشكلة):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

const newCount = newGames.characterCards.length + newGames.riddles.length + newGames.photoCards.length + newGames.speedQuestions.length + newGames.wordCards.length + newGames.feudRounds.length;
console.log(`فحص المحتوى ناجح: ${party.questions.length} سؤال فرق، ${huroof.huroofQuestions.length} سؤال حروف، ${who.WHO_AM_I_CARDS.length} بطاقة من أنا، و${newCount} بطاقة في الألعاب الجديدة.`);
