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

const seenIds = new Set();
const seenPrompts = new Set();
const unique = [];
for (const q of all) {
  if (q.id === 'vp-space-001') continue;
  const prompt = normalizeArabic(q.text);
  if (seenIds.has(q.id) || seenPrompts.has(prompt)) continue;
  seenIds.add(q.id);
  seenPrompts.add(prompt);
  unique.push(q);
}

const levels = ['easy', 'medium', 'hard'];
const buckets = Object.fromEntries(levels.map(level => [level, unique.filter(q => q.difficulty === level)]));

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function assertNoDuplicates(items, label) {
  const ids = items.map(q => q.id);
  if (ids.length !== new Set(ids).size) throw new Error(`${label}: duplicate ids inside one session`);
}

function simulateExact(level, sessions = 500, size = 20) {
  const source = buckets[level];
  if (source.length < Math.min(20, size)) throw new Error(`${level}: pool too small (${source.length})`);
  for (let i = 0; i < sessions; i += 1) {
    const picked = shuffle(source).slice(0, Math.min(size, source.length));
    assertNoDuplicates(picked, `${level} session ${i}`);
    const leak = picked.find(q => q.difficulty !== level);
    if (leak) throw new Error(`${level}: leaked ${leak.difficulty} question ${leak.id}`);
  }
}

function simulateMixed(sessions = 1000, size = 20) {
  const distribution = { easy: 0, medium: 0, hard: 0 };
  for (let session = 0; session < sessions; session += 1) {
    const order = shuffle(levels);
    const base = Math.floor(size / 3);
    const remainder = size % 3;
    let picked = [];
    order.forEach((level, index) => {
      const quota = base + (index < remainder ? 1 : 0);
      picked.push(...shuffle(buckets[level]).slice(0, quota));
    });
    const ids = new Set(picked.map(q => q.id));
    if (picked.length < size) {
      picked.push(...shuffle(unique.filter(q => !ids.has(q.id))).slice(0, size - picked.length));
    }
    picked = shuffle(picked).slice(0, size);
    assertNoDuplicates(picked, `mixed session ${session}`);
    const present = new Set(picked.map(q => q.difficulty));
    if (levels.some(level => !present.has(level))) throw new Error(`mixed session ${session}: not all three levels represented`);
    picked.forEach(q => { distribution[q.difficulty] += 1; });
  }
  return distribution;
}

for (const level of levels) simulateExact(level);
const mixedDistribution = simulateMixed();

const categories = new Map();
for (const q of unique) {
  if (!categories.has(q.category)) categories.set(q.category, { easy: 0, medium: 0, hard: 0, total: 0 });
  const row = categories.get(q.category);
  row.total += 1;
  row[q.difficulty] += 1;
}

const shallow = [...categories.entries()]
  .filter(([, row]) => row.total < 12)
  .map(([name, row]) => `${name}:${row.total}`);
const missingLevel = [...categories.entries()]
  .filter(([, row]) => levels.some(level => row[level] === 0))
  .map(([name, row]) => `${name}(e${row.easy}/m${row.medium}/h${row.hard})`);

if (unique.length < 400) throw new Error(`Question pool too small (${unique.length})`);
for (const level of levels) {
  if (buckets[level].length < 60) throw new Error(`${level} pool too small (${buckets[level].length})`);
}

const totalMixed = Object.values(mixedDistribution).reduce((sum, n) => sum + n, 0);
const pct = Object.fromEntries(levels.map(level => [level, Math.round((mixedDistribution[level] / totalMixed) * 100)]));
console.log(`Question simulation OK: ${unique.length} canonical usable entries.`);
console.log(`Difficulty pools: easy=${buckets.easy.length}, medium=${buckets.medium.length}, hard=${buckets.hard.length}.`);
console.log(`Exact-level sessions: 500 each, 0 cross-level leaks, 0 within-session duplicates.`);
console.log(`Random sessions: 1000, mix easy=${pct.easy}% medium=${pct.medium}% hard=${pct.hard}%, all levels represented.`);
if (shallow.length) console.warn(`Shallow pools (<12): ${shallow.join(', ')}`);
if (missingLevel.length) console.warn(`Categories missing at least one level: ${missingLevel.join(', ')}`);
