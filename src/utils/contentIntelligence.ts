import { readQaddhaPreferences, type QuestionIntensityPreference, type RepeatProtectionPreference } from './sitePreferences';

export type ContentDifficulty = 'medium' | 'medium-hard' | 'hard';

export type ContentMeta = {
  difficulty?: ContentDifficulty | 'easy';
  category?: string;
  topic?: string;
  answer?: string;
};

type HistoryEntry = { id:string; seenAt:number; category?:string; topic?:string; answer?:string };
type HistoryStore = Record<string, HistoryEntry[]>;

const HISTORY_KEY='qaddha.content-history.v3';
const MAX_PER_GAME=1200;
const ONLINE_EMBED = new URLSearchParams(window.location.search).get('onlineEmbed') === '1';

function readHistory():HistoryStore{
  try{
    const parsed=JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}');
    return parsed && typeof parsed==='object' ? parsed : {};
  }catch{return {}}
}

function saveHistory(history:HistoryStore){
  try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history))}catch{/* optional storage */}
}

function randomNoise(){return Math.random()*8}

export function normalizeArabic(value:string){
  return value.normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ').trim().toLowerCase();
}

export function semanticKey(value:string){
  const stop=new Set(['ما','ماذا','من','هو','هي','في','الى','اي','اذكر','يسمى','اسم','الذي','التي','هذه','هذا']);
  return normalizeArabic(value).split(' ').filter(word=>word.length>1&&!stop.has(word)).sort().join(' ');
}

export function difficultyForPosition(index:number,total:number,intensity:QuestionIntensityPreference='competitive'):ContentDifficulty{
  const progress=total<=1?0:index/(total-1);
  if(intensity==='balanced'){
    if(progress<.38)return 'medium';
    if(progress<.88)return 'medium-hard';
    return 'hard';
  }
  if(intensity==='hardcore'){
    if(progress<.18)return 'medium-hard';
    return 'hard';
  }
  if(progress<.2)return 'medium';
  if(progress<.72)return 'medium-hard';
  return 'hard';
}

function repeatConfig(level:RepeatProtectionPreference){
  if(level==='maximum')return {window:60,penalty:1200,recentCategories:8,recentTopics:7,recentAnswers:14};
  if(level==='strict')return {window:28,penalty:420,recentCategories:5,recentTopics:4,recentAnswers:8};
  return {window:12,penalty:140,recentCategories:3,recentTopics:3,recentAnswers:5};
}

function difficultyScore(actual:ContentMeta['difficulty'],target:ContentDifficulty){
  const rank:Record<string,number>={easy:0,medium:1,'medium-hard':2,hard:3};
  if(!actual)return 10;
  return 38-Math.abs(rank[actual]-rank[target])*20;
}

export function selectSmart<T>(game:string,pool:T[],count:number,getId:(item:T)=>string,getMeta:(item:T)=>ContentMeta=()=>({})):T[]{
  const unique=[...new Map(pool.map(item=>[getId(item),item])).values()];
  const prefs=readQaddhaPreferences();
  const repeat=repeatConfig(prefs.repeatProtection);
  const history=ONLINE_EMBED ? {} : readHistory();
  const prior=(ONLINE_EMBED ? [] : (history[game]||[])).filter(entry=>unique.some(item=>getId(item)===entry.id));
  const lastSeen=new Map(prior.map((entry,index)=>[entry.id,index]));
  const recent=prior.slice(-repeat.window);
  const recentlySeenIds=new Set(recent.map(entry=>entry.id));
  const selected:T[]=[];

  while(selected.length<Math.min(count,unique.length)){
    const target=difficultyForPosition(selected.length,Math.min(count,unique.length),prefs.questionIntensity);
    const combined=[...recent,...selected.map(item=>({id:getId(item),seenAt:0,...getMeta(item)}))];
    const recentCategories=new Set(combined.slice(-repeat.recentCategories).map(x=>x.category).filter(Boolean));
    const recentTopics=new Set(combined.slice(-repeat.recentTopics).map(x=>x.topic).filter(Boolean));
    const recentAnswers=new Set(combined.slice(-repeat.recentAnswers).map(x=>normalizeArabic(x.answer||'')).filter(Boolean));
    const candidates=unique.filter(item=>!selected.some(chosen=>getId(chosen)===getId(item)));
    candidates.sort((a,b)=>{
      const score=(item:T)=>{
        const id=getId(item),meta=getMeta(item),seen=lastSeen.get(id);
        let value=seen===undefined?1000:Math.max(0,prior.length-seen)*3;
        if(recentlySeenIds.has(id))value-=repeat.penalty;
        value+=difficultyScore(meta.difficulty,target);
        if(meta.category&&recentCategories.has(meta.category))value-=28;
        if(meta.topic&&recentTopics.has(meta.topic))value-=35;
        if(meta.answer&&recentAnswers.has(normalizeArabic(meta.answer)))value-=55;
        return value+randomNoise();
      };
      return score(b)-score(a);
    });
    selected.push(candidates[0]);
  }

  const now=Date.now();
  if (!ONLINE_EMBED) {
    history[game]=[...prior,...selected.map((item,index)=>({id:getId(item),seenAt:now+index,...getMeta(item)}))].slice(-MAX_PER_GAME);
    saveHistory(history);
  }
  return selected;
}

export function findNearDuplicates<T>(items:T[],getText:(item:T)=>string){
  const groups=new Map<string,number[]>();
  items.forEach((item,index)=>{const key=semanticKey(getText(item));if(!key)return;groups.set(key,[...(groups.get(key)||[]),index])});
  return [...groups.entries()].filter(([,indexes])=>indexes.length>1);
}
