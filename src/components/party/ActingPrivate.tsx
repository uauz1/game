import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import QRCode from 'qrcode';
import { ArrowRight, Check, Copy, Eye, Flag, Gamepad2, RefreshCw, RotateCcw, Smartphone, Sparkles, Theater, Trophy, Users, Wifi, WifiOff, X } from 'lucide-react';
import Countdown from './Countdown';
import { loadSharedTeams, saveSharedTeams } from '../../utils/sharedTeams';
import { loadHuroofPreferences } from '../../utils/huroofStorage';

type Team={name:string;color:string;score:number};
type Phase='setup'|'play'|'result';
type RoomStatus='starting'|'ready'|'connecting'|'connected'|'disconnected'|'error';
type ActingCommand={type:'correct'}|{type:'skip'};
type ActingPrivateState={type:'acting-private-state';phase:Phase;round:number;totalRounds:number;seconds:number;activeTeam:number;teams:Team[];prompt:string|null};

const palette=['#45b6ff','#ff70b5','#a77bff','#ffd45a'];
const charades=['يصوّر سيلفي','يطبخ كبسة','يلعب كرة قدم','يبحث عن جواله','يركب طائرة','يفتح هدية','يخاف من حشرة','يتأخر عن الدوام','يشاهد مباراة','يطلب قهوة','يقود سيارة','ينام في اجتماع','يرقص في عرس','يحاول فتح مظلة','يصور غروب الشمس','يلعب بلايستيشن','يركب دراجة','يتسوق بسرعة','ينفخ بالونًا','يصلح جهازًا'];
const shuffle=<T,>(values:T[])=>[...values].sort(()=>Math.random()-.5);

function initialTeams():Team[]{
 const shared=loadSharedTeams();
 if(shared)return shared.map(team=>({...team,score:0}));
 const saved=loadHuroofPreferences();
 return [{name:saved.teamNames[0],color:saved.teamColors[0],score:0},{name:saved.teamNames[1],color:saved.teamColors[1],score:0}];
}

function useActingRoom(state:ActingPrivateState,onCommand:(command:ActingCommand)=>void){
 const [status,setStatus]=useState<RoomStatus>('starting');
 const [hostUrl,setHostUrl]=useState('');
 const [qrCode,setQrCode]=useState('');
 const connectionRef=useRef<DataConnection|null>(null);
 const stateRef=useRef(state); const commandRef=useRef(onCommand);
 stateRef.current=state; commandRef.current=onCommand;
 useEffect(()=>{
  const token=crypto.randomUUID().replace(/-/g,'');
  const peerId=`qaddha-acting-${crypto.randomUUID()}`;
  const peer=new Peer(peerId);
  peer.on('open',()=>{
   const url=new URL(window.location.href); url.search=''; url.hash='';
   url.searchParams.set('host','acting'); url.searchParams.set('room',peerId); url.searchParams.set('token',token);
   const nextUrl=url.toString(); setHostUrl(nextUrl); setStatus('ready');
   QRCode.toDataURL(nextUrl,{width:320,margin:2,errorCorrectionLevel:'M',color:{dark:'#080b1b',light:'#fff8df'}}).then(setQrCode).catch(()=>setStatus('error'));
  });
  peer.on('connection',connection=>{
   const metadata=connection.metadata as {token?:string;game?:string}|undefined;
   if(metadata?.token!==token||metadata?.game!=='acting'){connection.close();return;}
   connectionRef.current?.close(); connectionRef.current=connection; setStatus('connecting');
   connection.on('open',()=>{setStatus('connected');connection.send(stateRef.current)});
   connection.on('data',payload=>{if(!payload||typeof payload!=='object')return;const command=payload as Partial<ActingCommand>;if(command.type==='correct'||command.type==='skip')commandRef.current({type:command.type});});
   connection.on('close',()=>{if(connectionRef.current===connection)connectionRef.current=null;setStatus('disconnected')});
   connection.on('error',()=>setStatus('error'));
  });
  peer.on('error',()=>setStatus('error'));
  return()=>{connectionRef.current?.close();peer.destroy()};
 },[]);
 useEffect(()=>{if(connectionRef.current?.open)connectionRef.current.send(state)},[state]);
 return{status,hostUrl,qrCode};
}

function Pairing({status,hostUrl,qrCode,compact=false}:{status:RoomStatus;hostUrl:string;qrCode:string;compact?:boolean}){
 const [copied,setCopied]=useState(false);const connected=status==='connected';
 const copy=async()=>{if(!hostUrl)return;try{await navigator.clipboard?.writeText(hostUrl);setCopied(true);window.setTimeout(()=>setCopied(false),1600)}catch{/* QR remains available. */}};
 if(compact)return <div className={`host-link-compact ${connected?'connected':''}`}>{connected?<Wifi/>:<WifiOff/>}<div><b>{connected?'جوال الممثل متصل':'جوال الممثل غير متصل'}</b><small>{connected?'العبارة السرية تظهر على الجوال فقط':'ارجع للإعدادات وامسح QR مجددًا'}</small></div></div>;
 return <section className="host-pairing" aria-live="polite"><div className="host-pairing-copy"><span><Smartphone/> شاشة الممثل السرية</span><h3>امسح الرمز بالجوال</h3><p>العبارة تظهر للممثل على جواله فقط، بينما الشاشة الكبيرة تعرض الوقت والنقاط من غير أي تسريب.</p><div className={`host-connection ${connected?'connected':''}`}>{connected?<Wifi/>:<RefreshCw className={status==='starting'||status==='connecting'?'spin':''}/>}<b>{connected?'تم اتصال جوال الممثل':status==='error'?'تعذر إنشاء الغرفة':status==='disconnected'?'انقطع الاتصال · امسح الرمز مجددًا':'بانتظار اتصال الجوال'}</b></div><button className="quiet host-copy" disabled={!hostUrl} onClick={copy}>{copied?<Check/>:<Copy/>}{copied?'تم نسخ الرابط':'نسخ رابط الجوال'}</button></div><div className="host-qr">{qrCode?<img src={qrCode} alt="رمز QR لشاشة ممثل مثّلها"/>:<div className="qr-loading"><RefreshCw className="spin"/><span>نجهز الغرفة…</span></div>}</div></section>;
}

export default function ActingPrivate({onHome}:{onHome:()=>void}){
 const [teams,setTeams]=useState<Team[]>(initialTeams);const [rounds,setRounds]=useState(8);const [seconds,setSeconds]=useState(45);const [round,setRound]=useState(0);const [deck,setDeck]=useState<string[]>(charades);const [phase,setPhase]=useState<Phase>('setup');const [timedOut,setTimedOut]=useState(false);
 const active=round%2;const prompt=deck[round]??null;const valid=teams.every(team=>team.name.trim())&&teams[0].name.trim()!==teams[1].name.trim();
 const finish=(won:boolean)=>{if(phase!=='play')return;if(won&&!timedOut)setTeams(value=>value.map((team,index)=>index===active?{...team,score:team.score+100}:team));if(round+1>=deck.length){setPhase('result');return}setRound(value=>value+1);setTimedOut(false)};
 const state:ActingPrivateState={type:'acting-private-state',phase,round,totalRounds:deck.length,seconds,activeTeam:active,teams,prompt:phase==='play'?prompt:null};
 const room=useActingRoom(state,command=>finish(command.type==='correct'));
 const start=()=>{if(!valid||room.status!=='connected')return;const prepared=teams.map(team=>({...team,name:team.name.trim(),score:0}));saveSharedTeams(prepared);setTeams(prepared);setDeck(shuffle(charades).slice(0,rounds));setRound(0);setTimedOut(false);setPhase('play')};
 const replay=()=>{setDeck(shuffle(charades).slice(0,rounds));setTeams(value=>value.map(team=>({...team,score:0})));setRound(0);setTimedOut(false);setPhase('play')};
 const winner=teams[0].score===teams[1].score?null:teams[0].score>teams[1].score?0:1;
 const update=(index:number,patch:Partial<Team>)=>setTeams(value=>value.map((team,i)=>i===index?{...team,...patch}:team));
 return <section className="final-game acting-game" dir="rtl"><header className="final-head"><button className="quiet" onClick={onHome}><ArrowRight/> الألعاب</button><div><span><Sparkles/></span><small>لعبة أصلية من قدّها</small><h1>مثّلها</h1><p>الممثل يشوف العبارة على جواله فقط، وفريقه يحاول يلقطها قبل الوقت.</p></div></header>{phase==='setup'?<article className="final-panel setup-panel"><h2>جهّزوا الفريقين والجوال السري</h2><div className="final-teams">{teams.map((team,index)=><label key={index} style={{'--team':team.color} as CSSProperties}><Users/><span>الفريق {index+1}</span><input maxLength={18} value={team.name} onChange={event=>update(index,{name:event.target.value})}/><div className="color-choices">{palette.map(color=><button type="button" key={color} aria-pressed={team.color===color} disabled={teams[1-index].color===color} style={{background:color}} onClick={()=>update(index,{color})}>{team.color===color?<Check size={15}/>:null}</button>)}</div></label>)}</div><label className="round-select">عدد الجولات<select value={rounds} onChange={event=>setRounds(Number(event.target.value))}><option value={6}>6</option><option value={8}>8</option><option value={10}>10</option></select></label><label className="round-select">وقت الجولة<select value={seconds} onChange={event=>setSeconds(Number(event.target.value))}><option value={30}>30 ثانية</option><option value={45}>45 ثانية</option><option value={60}>60 ثانية</option></select></label><Pairing {...room}/>{!valid?<p className="validation">اكتبوا اسمين مختلفين وغير فارغين.</p>:room.status!=='connected'?<p className="validation">وصّل جوال الممثل أولًا حتى ما تنكشف العبارة على الشاشة.</p>:null}<button className="primary" disabled={!valid||room.status!=='connected'} onClick={start}>ابدأ التحدي <Flag/></button></article>:phase==='result'?<article className="final-panel final-result"><Trophy/><small>انتهى التحدي</small><h2>{winner===null?'تعادل قوي!':`${teams[winner].name}… قدّها!`}</h2><div>{teams.map(team=><b key={team.name} style={{color:team.color}}>{team.name}<strong>{team.score}</strong></b>)}</div><button className="primary" onClick={replay}><RotateCcw/> إعادة بنفس الإعدادات</button><button className="quiet" onClick={()=>setPhase('setup')}>تغيير الإعدادات</button></article>:<><Pairing {...room} compact/><div className="final-score"><b style={{color:teams[0].color}}>{teams[0].name} <strong>{teams[0].score}</strong></b><span>الجولة {round+1} / {deck.length}</span><b style={{color:teams[1].color}}>{teams[1].name} <strong>{teams[1].score}</strong></b></div><article className="final-panel play-panel"><Theater className="feature-icon"/><span className="turn-chip" style={{'--team':teams[active].color} as CSSProperties}>دور {teams[active].name}</span><h2>العبارة مخفية عن الشاشة</h2><p>الممثل يشوف المطلوب على جواله فقط. ممنوع الكلام أو إصدار أصوات أو تهجئة الحروف.</p><Countdown key={`${round}-${prompt}`} seconds={seconds} stopped={timedOut} onExpire={()=>{setTimedOut(true);window.setTimeout(()=>finish(false),500)}}/><div className="play-actions" style={{justifyContent:'center'}}><span><b>{room.status==='connected'?'الجوال متصل':'الجوال غير متصل'}</b></span><span><b>{round+1}</b> / {deck.length}</span></div></article></>}</section>;
}

export function ActingPhone({roomId,token}:{roomId:string;token:string}){
 const [status,setStatus]=useState<'connecting'|'connected'|'disconnected'|'error'>('connecting');const [game,setGame]=useState<ActingPrivateState|null>(null);const connectionRef=useRef<DataConnection|null>(null);
 useEffect(()=>{if(!/^qaddha-acting-[\w-]{20,}$/.test(roomId)||!/^[a-f\d]{32}$/i.test(token)){setStatus('error');return}const peer=new Peer();let stopped=false;let retry=0;const connect=()=>{if(stopped)return;setStatus('connecting');const connection=peer.connect(roomId,{reliable:true,serialization:'json',metadata:{token,game:'acting'}});connectionRef.current=connection;connection.on('open',()=>setStatus('connected'));connection.on('data',payload=>{if(payload&&typeof payload==='object'&&(payload as ActingPrivateState).type==='acting-private-state')setGame(payload as ActingPrivateState)});connection.on('close',()=>{if(stopped)return;setStatus('disconnected');retry=window.setTimeout(connect,2200)});connection.on('error',()=>setStatus('disconnected'))};peer.on('open',connect);peer.on('error',error=>{if(error.type==='peer-unavailable')retry=window.setTimeout(connect,2200);else setStatus('error')});return()=>{stopped=true;window.clearTimeout(retry);connectionRef.current?.close();peer.destroy()}},[roomId,token]);
 const send=(command:ActingCommand)=>{if(connectionRef.current?.open)connectionRef.current.send(command)};
 const active=game?.teams[game.activeTeam];
 return <main className="mobile-host" dir="rtl"><header><span className="host-brand"><Gamepad2/> قدّها</span><span className={`mobile-host-status ${status}`}>{status==='connected'?<Wifi/>:<WifiOff/>}{status==='connected'?'متصل بالشاشة':status==='error'?'الرابط غير صالح':'جاري الاتصال…'}</span></header>{!game?<section className="host-wait"><Smartphone/><h1>{status==='error'?'تعذر فتح شاشة الممثل':'نربطك بشاشة اللعب…'}</h1><p>خل الصفحة مفتوحة، والعبارة السرية تظهر هنا فور بدء الجولة.</p></section>:game.phase==='setup'?<section className="host-wait"><Smartphone/><h1>الجوال جاهز</h1><p>ابدأ التحدي من الشاشة الكبيرة.</p></section>:game.phase==='result'?<section className="host-wait"><Trophy/><h1>اكتمل التحدي</h1><p>النتيجة النهائية على الشاشة الكبيرة.</p></section>:<section className="host-round-head"><small>الجولة {game.round+1} من {game.totalRounds}</small><h1>{game.prompt}</h1><div className="host-team-turn" style={{'--team':active?.color} as CSSProperties}><Users/><span>مثّل لـ <b>{active?.name}</b></span><strong>{game.seconds}ث</strong></div><p style={{marginTop:16}}>ممنوع الكلام، الأصوات، أو تهجئة الحروف.</p><div className="host-mobile-actions"><button className="primary" onClick={()=>send({type:'correct'})}><Check/> عرفوها · صح</button><button onClick={()=>send({type:'skip'})}><X/> تخطي</button></div></section>}</main>;
}
