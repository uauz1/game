import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve('src/data/questions');
const files = fs.readdirSync(root).filter((name) => name.endsWith('.ts') && name !== 'index.ts');

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

const all = [];
for (const file of files) {
  const exports = load(file);
  for (const value of Object.values(exports)) {
    if (!Array.isArray(value)) continue;
    for (const q of value) {
      if (q && typeof q === 'object' && q.id && q.text && Array.isArray(q.choices)) all.push(q);
    }
  }
}

// Runtime-like canonicalization: keep one normalized prompt and one stable id.
const seenIds = new Set();
const seenPrompts = new Set();
const unique = [];
for (const q of all) {
  if (q.id === 'vp-space-001') continue; // retired changing-fact entry
  const prompt = normalizeArabic(q.text);
  if (seenIds.has(q.id) || seenPrompts.has(prompt)) continue;
  seenIds.add(q.id);
  seenPrompts.add(prompt);
  unique.push(q);
}

const competitive = unique.filter((q) => q.difficulty === 'medium' || q.difficulty === 'hard');
const categories = new Map();
for (const q of competitive) {
  if (!categories.has(q.category)) categories.set(q.category, []);
  categories.get(q.category).push(q);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let withinSessionDuplicates = 0;
let easyLeak = 0;
let hardShare = 0;
let totalSelected = 0;
const history = new Map();

for (let session = 0; session < 1000; session += 1) {
  const medium = shuffle(competitive.filter((q) => q.difficulty === 'medium'));
  const hard = shuffle(competitive.filter((q) => q.difficulty === 'hard'));
  const desired = 20;
  const candidates = [...medium.slice(0, 9), ...hard.slice(0, 11)]
    .sort((a, b) => (history.get(a.id) ?? -1) - (history.get(b.id) ?? -1));
  const picked = candidates.slice(0, desired);
  const ids = picked.map((q) => q.id);
  withinSessionDuplicates += ids.length - new Set(ids).size;
  easyLeak += picked.filter((q) => q.difficulty === 'easy').length;
  hardShare += picked.filter((q) => q.difficulty === 'hard').length;
  totalSelected += picked.length;
  picked.forEach((q) => history.set(q.id, session));
}

const hardPct = totalSelected ? Math.round((hardShare / totalSelected) * 100) : 0;
const shallow = [...categories.entries()].filter(([, items]) => items.length < 8).map(([name, items]) => `${name}:${items.length}`);

if (withinSessionDuplicates > 0) {
  console.error(`Simulation failed: ${withinSessionDuplicates} duplicate picks inside sessions.`);
  process.exit(1);
}
if (easyLeak > 0) {
  console.error(`Simulation failed: ${easyLeak} easy questions leaked into competitive mixed sessions.`);
  process.exit(1);
}
if (competitive.length < 350) {
  console.error(`Simulation failed: competitive pool too small (${competitive.length}).`);
  process.exit(1);
}

console.log(`Question simulation OK: ${unique.length} canonical usable entries, ${competitive.length} medium/hard.`);
console.log(`1000 simulated sessions / ${totalSelected} selections / 0 within-session duplicates / ${hardPct}% hard.`);
if (shallow.length) console.warn(`Competitive pools still shallow (<8): ${shallow.join(', ')}`);
