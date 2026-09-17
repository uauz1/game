import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, Check, Flag, Lightbulb, RotateCcw, Sparkles, Trophy, Users, X } from 'lucide-react';
import { realCharacterCards, type RealCharacterCard } from '../../data/realCharacterCards';
import { loadHuroofPreferences } from '../../utils/huroofStorage';
import { drawWithoutRepeats } from '../../utils/newGameRotation';
import { useNewGameNumber } from '../../utils/newGameSettings';
import { loadSharedTeams, saveSharedTeams } from '../../utils/sharedTeams';
import { clearMultiplayerChallenge, publishMultiplayerChallenge, publishMultiplayerTeamNames } from '../../utils/multiplayerSession';
import Countdown from './Countdown';
import WhoAnswerReveal from './WhoAnswerReveal';

type Team = { name: string; color: string; score: number };
type Phase = 'setup' | 'play' | 'result';
const colors = ['#45b6ff', '#ff70b5', '#a77bff', '#ffd45a'];

function initialTeams(): Team[] {
  const shared = loadSharedTeams();
  if (shared) return shared.map(team => ({ ...team, score: 0 }));
  const saved = loadHuroofPreferences();
  return [
    { name: saved.teamNames[0], color: saved.teamColors[0], score: 0 },
    { name: saved.teamNames[1], color: saved.teamColors[1], score: 0 },
  ];
}

export default function RealCharacterGuess({ onHome }: { onHome: () => void }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [seconds, setSeconds] = useNewGameNumber('character', 'seconds', 30);
  const [rounds, setRounds] = useNewGameNumber('character', 'rounds', 6);
  const [deck, setDeck] = useState<RealCharacterCard[]>(realCharacterCards);
  const [round, setRound] = useState(0);
  const [hint, setHint] = useState(1);
  const [choice, setChoice] = useState('');
  const [phase, setPhase] = useState<Phase>('setup');
  const [portraitReveal, setPortraitReveal] = useState<{ card: RealCharacterCard; teamName: string } | null>(null);

  useEffect(()=>{publishMultiplayerTeamNames([teams[0].name,teams[1].name]);},[teams]);

  const card = deck[round];
  const turn = round % 2;
  const validNames = teams.every(team => team.name.trim()) && teams[0].name.trim() !== teams[1].name.trim();
  const winner = useMemo(() => teams[0].score === teams[1].score ? null : teams[0].score > teams[1].score ? 0 : 1, [teams]);
  const points = Math.max(100, (4 - hint) * 100) + (card?.difficulty === 'hard' ? 100 : 0);

  useEffect(() => {
    if (!portraitReveal) return;
    const timer = window.setTimeout(() => setPortraitReveal(null), 4500);
    return () => window.clearTimeout(timer);
  }, [portraitReveal]);

  const updateTeam = (index: number, patch: Partial<Team>) => {
    setTeams(current => current.map((team, teamIndex) => teamIndex === index ? { ...team, ...patch } : team));
  };

  const start = () => {
    if (!validNames) return;
    const selected = drawWithoutRepeats('real-characters', realCharacterCards, rounds, item => item.id);
    if (!selected.length) return;
    const prepared = teams.map(team => ({ ...team, name: team.name.trim(), score: 0 }));
    saveSharedTeams(prepared);
    setTeams(prepared);
    setDeck(selected);
    setRound(0);
    setHint(1);
    setChoice('');
    setPortraitReveal(null);
    setPhase('play');
  };

  useEffect(()=>{if(phase==='play'&&card&&!choice){publishMultiplayerChallenge({gameId:'character',roundKey:card.id,answers:[card.answer],choices:card.options,points});return()=>clearMultiplayerChallenge('character');}clearMultiplayerChallenge('character');},[card,choice,phase,points]);

  const choose = (answer: string) => {
    if (choice || !card) return;
    setChoice(answer);
    if (answer === card.answer) {
      setTeams(current => current.map((team, index) => index === turn ? { ...team, score: team.score + points } : team));
      setPortraitReveal({ card, teamName: teams[turn].name });
    }
  };

  useEffect(()=>{const receive=(event:Event)=>{const detail=(event as CustomEvent<{gameId?:string;team?:number;points?:number}>).detail;if(detail?.gameId!=='character'||phase!=='play'||choice||!card)return;const team=detail.team===1?1:0;const awarded=typeof detail.points==='number'?detail.points:points;setTeams(current=>current.map((item,index)=>index===team?{...item,score:item.score+awarded}:item));setChoice(card.answer);setPortraitReveal({card,teamName:teams[team].name});};window.addEventListener('qaddha:multiplayer-team-score',receive);return()=>window.removeEventListener('qaddha:multiplayer-team-score',receive);},[card,choice,phase,points,teams]);

  const next = () => {
    setPortraitReveal(null);
    if (round + 1 >= deck.length) { setPhase('result'); return; }
    setRound(value => value + 1);
    setHint(1);
    setChoice('');
  };

  return <section className="arena new-game character-game" dir="rtl">
    <div className="arena-heading"><div><span className="eyebrow"><Sparkles size={15}/> خمن الشخصية</span><h1>{phase === 'setup' ? 'شخصيات حقيقية فقط.' : phase === 'result' ? 'انكشفت الشخصيات!' : `شخصية ${round + 1} من ${deck.length}`}</h1></div><button className="quiet" onClick={onHome}>الألعاب <ArrowLeft size={17}/></button></div>

    {phase === 'setup' ? <div className="new-game-setup"><div className="section-heading"><h2>مشاهير حقيقيون ومعروفون</h2><p>رياضة، علوم، تاريخ، تقنية، فن وأدب. لا شخصيات خيالية، ومستوى التحدي من متوسط إلى صعب.</p></div><div className="team-setup">{teams.map((team,index)=><div className="team-editor compact-team" key={index} style={{'--team':team.color} as CSSProperties}><div className="team-emblem"><Users/><span>0{index+1}</span></div><label htmlFor={`real-character-team-${index}`}>اسم الفريق {index===0?'الأول':'الثاني'}</label><input id={`real-character-team-${index}`} maxLength={22} value={team.name} onChange={event=>updateTeam(index,{name:event.target.value})}/><div className="color-choices">{colors.map(color=><button key={color} aria-label={`اختيار لون ${color}`} aria-pressed={team.color===color} disabled={teams[1-index].color===color} style={{background:color}} onClick={()=>updateTeam(index,{color})}>{team.color===color?<Check size={16}/>:null}</button>)}</div></div>)}</div><div className="match-settings new-game-settings"><div><Flag/><b>إعدادات الجولة</b></div><label>مدة الشخصية<select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}><option value={20}>20 ثانية</option><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><label>عدد الشخصيات<select value={rounds} onChange={event=>setRounds(Number(event.target.value))}><option value={4}>4 شخصيات</option><option value={6}>6 شخصيات</option><option value={8}>8 شخصيات</option></select></label></div>{!validNames?<p className="validation">اكتبوا اسمين مختلفين وغير فارغين.</p>:null}<div className="arena-actions"><span>عند الإجابة الصحيحة نحاول عرض صورة حقيقية للشخصية من ويكيبيديا/ويكيميديا.</span><button className="primary" disabled={!validNames} onClick={start}>ابدأوا التحدّي <Flag size={18}/></button></div></div> : null}

    {phase === 'play' && card ? <><div className="new-scorebar">{teams.map((team,index)=><div key={team.name} className={turn===index?'active':''} style={{'--team':team.color} as CSSProperties}><span>{team.name}</span><strong>{team.score}</strong></div>)}<p>الجولة <b>{round+1}</b> / {deck.length}</p></div><div className="new-stage"><div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}><span className="game-chip">{card.category}</span><span className="game-chip">{card.difficulty === 'hard' ? 'صعب' : 'متوسط'}</span><span className="game-chip">{points} نقطة</span></div><div className="character-silhouette">?</div><div className="progressive-hints">{card.hints.slice(0,hint).map((text,index)=><p key={text}><b>{index+1}</b>{text}</p>)}</div><Countdown key={card.id} seconds={seconds} stopped={Boolean(choice)} onExpire={()=>setChoice('__timeout__')}/>{!choice?<><div className="choice-grid">{card.options.map(option=><button key={option} onClick={()=>choose(option)}>{option}</button>)}</div><button className="quiet centered" disabled={hint===card.hints.length} onClick={()=>setHint(Math.min(card.hints.length,hint+1))}><Lightbulb size={17}/> تلميح إضافي · نقاط أقل</button></>:<div className={`answer-feedback ${choice===card.answer?'correct':'wrong'}`}><h2>{choice===card.answer?'إجابة صحيحة!':choice==='__timeout__'?'انتهى الوقت!':'مو هي…'}</h2><p>الإجابة: <b>{card.answer}</b></p><button className="primary" onClick={next}>{round+1===deck.length?'عرض النتيجة':'الشخصية التالية'}</button></div>}</div></> : null}

    {phase === 'result' ? <div className="new-result"><Trophy/><span className="eyebrow">أبطال التخمين</span><h2>{winner===null?'تعادل… كلكم قدّها!':`${teams[winner].name}… قدّها!`}</h2><div className="new-result-scores">{teams.map(team=><span key={team.name} style={{'--team':team.color} as CSSProperties}><b>{team.name}</b><strong>{team.score}</strong></span>)}</div><div className="result-actions"><button className="primary" onClick={start}><RotateCcw/> إعادة بنفس الإعدادات</button><button className="secondary" onClick={()=>setPhase('setup')}>تعديل الإعدادات</button></div></div> : null}

    {portraitReveal ? <WhoAnswerReveal card={portraitReveal.card} teamName={portraitReveal.teamName} onClose={()=>setPortraitReveal(null)}/> : null}
  </section>;
}
