import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve('src/data/questions');
const files = fs.readdirSync(root).filter(name => name.endsWith('.ts') && name !== 'index.ts');
const errors = [];
const warnings = [];
const ids = new Map();
const prompts = new Map();
const counts = { easy: 0, medium: 0, hard: 0 };
const categories = new Map();

function load(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', output)(module, module.exports);
  return module.exports;
}

function normalizeArabic(value) {
  return String(value ?? '')
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
    .replace(/[^\u0621-\u063a\u0641-\u064a0-9a-z]/g, '');
}

function looksLikeQuestion(value) {
  return value && typeof value === 'object' && 'id' in value && 'text' in value && 'choices' in value && 'correctAnswer' in value;
}

let total = 0;
for (const file of files) {
  const exports = load(file);
  for (const [exportName, value] of Object.entries(exports)) {
    if (!Array.isArray(value)) continue;
    value.forEach((question, index) => {
      if (!looksLikeQuestion(question)) return;
      total += 1;
      const label = `${file}:${exportName}[${index}]`;
      const id = String(question.id ?? '').trim();
      const text = String(question.text ?? '').trim();
      const category = String(question.category ?? '').trim();
      const difficulty = question.difficulty;
      const choices = question.choices;

      if (!id) errors.push(`${label}: missing id`);
      else if (ids.has(id)) errors.push(`${label}: duplicate id ${id} (also ${ids.get(id)})`);
      else ids.set(id, label);

      if (!text) errors.push(`${label}: missing question text`);
      const promptKey = normalizeArabic(text);
      if (promptKey) {
        // Legacy banks contain a few equivalent prompts across categories. The
        // runtime selector now removes them semantically, so keep CI informative
        // without blocking deployment while the old bank is cleaned gradually.
        if (prompts.has(promptKey)) warnings.push(`${label}: duplicate prompt (also ${prompts.get(promptKey)})`);
        else prompts.set(promptKey, label);
      }

      if (!category) errors.push(`${label}: missing category`);
      else categories.set(category, (categories.get(category) ?? 0) + 1);

      if (!['easy', 'medium', 'hard'].includes(difficulty)) errors.push(`${label}: invalid difficulty ${difficulty}`);
      else counts[difficulty] += 1;

      if (!Array.isArray(choices) || choices.length < 2) errors.push(`${label}: insufficient choices`);
      else {
        const normalizedChoices = choices.map(normalizeArabic);
        if (new Set(normalizedChoices).size !== normalizedChoices.length) errors.push(`${label}: duplicate choices`);
        if (!Number.isInteger(question.correctAnswer) || question.correctAnswer < 0 || question.correctAnswer >= choices.length) {
          errors.push(`${label}: correctAnswer is out of range`);
        }
      }
    });
  }
}

for (const [category, count] of [...categories.entries()].sort((a, b) => a[1] - b[1])) {
  if (count < 12) warnings.push(`${category}: shallow pool (${count} questions)`);
}

const competitive = counts.medium + counts.hard;
if (total && competitive / total < 0.75) warnings.push(`Only ${Math.round((competitive / total) * 100)}% of the bank is medium/hard.`);

if (errors.length) {
  console.error(`Question-bank validation failed (${errors.length} errors):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Question bank OK: ${total} usable questions across ${categories.size} categories.`);
console.log(`Difficulty: easy=${counts.easy}, medium=${counts.medium}, hard=${counts.hard}.`);
if (warnings.length) console.warn(`Warnings (${warnings.length}):\n- ${warnings.join('\n- ')}`);
