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

const normalizedQuestions = party.questions.map(question => question.q.trim().toLowerCase());
const duplicates = normalizedQuestions.filter((question, index) => normalizedQuestions.indexOf(question) !== index);
if (duplicates.length) errors.push(`قدّها فرق: ${new Set(duplicates).size} سؤال مكرر نصيًا في المصدر الأساسي`);

if (errors.length) {
  console.error(`فشل فحص المحتوى (${errors.length} مشكلة):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`فحص المحتوى ناجح: ${party.questions.length} سؤال فرق، ${huroof.huroofQuestions.length} سؤال حروف، ${who.WHO_AM_I_CARDS.length} بطاقة من أنا.`);
