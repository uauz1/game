import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Minus, Plus, RotateCcw, Users, Wifi, X, Zap } from 'lucide-react';
import { createPublicLobbyChannel, removeRealtimeChannel } from '../../utils/qaddhaRealtime';
import { buildMultiplayerJoinUrl, clearActiveHostRoom, judgeMultiplayerChallenge, readActiveHostRoom, readMultiplayerChallenge, type MultiplayerChallenge, type MultiplayerInput } from '../../utils/multiplayerSession';
import { autoJudgeMultiplayerAnswer, type AutoJudgeResult } from '../../utils/multiplayerAutoJudge';
import { loadSharedTeams } from '../../utils/sharedTeams';

type Member={id:string;name:string;team:0|1;joinedAt:number};
type ScoreMap=Record<string,number>;
type JudgeMap=Record<string,AutoJudgeResult>;

export default function MultiplayerHostLayer(){
  const [room,setRoom]=useState(readActiveHostRoom);
  const [connected,setConnected]=useState(false);
  const [members,setMembers]=useState<Member[]>([]);
  const [inputs,setInputs]=useState<MultiplayerInput[]>([]);
  const [scores,setScores]=useState<ScoreMap>({});
  const [judged,setJudged]=useState<JudgeMap>({});
  const challengeRef=useRef<MultiplayerChallenge|null>(readMultiplayerChallenge());
  const [collapsed,setCollapsed]=useState(true);
  const [copied,setCopied]=useState(false);
  const channelRef=useRef<ReturnType<typeof createPublicLobbyChannel>|null>(null);
  const gameRef=useRef('');
  const autoScoredRef=useRef(new Set<string>());
  const roundScoredRef=useRef(new Set<string>());
  const joinUrl=useMemo(()=>room?buildMultiplayerJoinUrl(room.code):'',[room]);

  useEffect(()=>{
    const refresh=()=>setRoom(readActiveHostRoom());
    window.addEventListener('qaddha:multiplayer-room-changed',refresh);
    return()=>window.removeEventListener('qaddha:multiplayer-room-changed',refresh);
  },[]);

  const sendScore=(playerId:string,delta:number)=>{
    setScores(current=>{
      const next=Math.max(0,(current[playerId]||0)+delta);
      void channelRef.current?.send({type:'broadcast',event:'score',payload:{playerId,score:next,delta}});
      return {...current,[playerId]:next};
    });
  };

  useEffect(()=>{
    const refreshTeams=(event:Event)=>{const detail=(event as CustomEvent<[string,string]>).detail;if(Array.isArray(detail)&&detail.length===2)void channelRef.current?.send({type:'broadcast',event:'team-info',payload:{teams:detail}});};
    window.addEventListener('qaddha:multiplayer-team-names',refreshTeams);
    return()=>window.removeEventListener('qaddha:multiplayer-team-names',refreshTeams);
  },[]);

  useEffect(()=>{
    const refreshChallenge=()=>{challengeRef.current=readMultiplayerChallenge();const active=challengeRef.current;if(active)void channelRef.current?.send({type:'broadcast',event:'round-ui',payload:{gameId:active.gameId,roundKey:active.roundKey,choices:active.choices||[],mode:active.mode||'single',requiredSelections:active.sequenceAnswers?.length||0}});};
    window.addEventListener('qaddha:multiplayer-challenge',refreshChallenge);
    return()=>window.removeEventListener('qaddha:multiplayer-challenge',refreshChallenge);
  },[]);

  useEffect(()=>{
    const code=room?.code;
    if(!code)return;
    let disposed=false;
    const channel=createPublicLobbyChannel(code);
    channelRef.current=channel;
    const upsert=(member:Member)=>setMembers(current=>{
      const next=[...current.filter(item=>item.id!==member.id),member].sort((a,b)=>a.joinedAt-b.joinedAt);
      return next.slice(0,32);
    });
    channel
      .on('broadcast',{event:'hello'},({payload})=>{
        const member=payload as Partial<Member>;
        if(typeof member.id==='string'&&typeof member.name==='string'){
          upsert({id:member.id,name:member.name.slice(0,18),team:member.team===1?1:0,joinedAt:typeof member.joinedAt==='number'?member.joinedAt:Date.now()});
          void channel.send({type:'broadcast',event:'host-message',payload:{text:'تم الاتصال بالمضيف'}});
          if(gameRef.current)void channel.send({type:'broadcast',event:'game',payload:{gameId:gameRef.current}});
          const teams=loadSharedTeams();if(teams)void channel.send({type:'broadcast',event:'team-info',payload:{teams:teams.map(team=>team.name)}});
          const active=challengeRef.current;if(active)void channel.send({type:'broadcast',event:'round-ui',payload:{gameId:active.gameId,roundKey:active.roundKey,choices:active.choices||[]}});
        }
      })
      .on('broadcast',{event:'team-change'},({payload})=>{const incoming=payload as Partial<Member>;if(typeof incoming.id==='string')setMembers(current=>current.map(member=>member.id===incoming.id?{...member,team:incoming.team===1?1:0}:member));})
      .on('broadcast',{event:'player-input'},({payload})=>{
        const incoming=payload as MultiplayerInput;
        if(!incoming||typeof incoming.id!=='string'||typeof incoming.playerId!=='string'||typeof incoming.playerName!=='string')return;
        setInputs(current=>[incoming,...current.filter(item=>item.id!==incoming.id)].slice(0,20));
        setCollapsed(false);
        if(incoming.kind==='answer'&&incoming.value){
          const activeChallenge=challengeRef.current;
          const direct = activeChallenge && activeChallenge.gameId===gameRef.current ? judgeMultiplayerChallenge(activeChallenge,incoming.value) : null;
          const result: AutoJudgeResult = direct ? { supported:true, correct:direct.correct, points:direct.points, canonical:direct.canonical } : autoJudgeMultiplayerAnswer(gameRef.current,incoming.value);
          setJudged(current=>({...current,[incoming.id]:result}));
          if(result.supported&&result.correct===true&&!autoScoredRef.current.has(incoming.id)){
            autoScoredRef.current.add(incoming.id);
            const roundKey=activeChallenge?.roundKey||`${gameRef.current}:fallback`;
            const firstTeamScore=result.points>0&&!roundScoredRef.current.has(roundKey);
            if(firstTeamScore){roundScoredRef.current.add(roundKey);window.dispatchEvent(new CustomEvent('qaddha:multiplayer-team-score',{detail:{gameId:gameRef.current,team:incoming.team===1?1:0,points:result.points,roundKey,inputId:incoming.id,playerName:incoming.playerName}}));}
            sendScore(incoming.playerId,result.points);
            void channel.send({type:'broadcast',event:'host-message',payload:{text:firstTeamScore?`إجابة صحيحة لفريقك +${result.points}`:'إجابة صحيحة، لكن الجولة حُسمت بالفعل'}});
          }else if(result.supported&&result.correct===false){
            void channel.send({type:'broadcast',event:'host-message',payload:{text:'الإجابة وصلت، لكنها غير صحيحة'}});
          }
        }
      })
      .subscribe(status=>{
        if(disposed)return;
        setConnected(status==='SUBSCRIBED');
      });
    return()=>{disposed=true;channelRef.current=null;void removeRealtimeChannel(channel);};
  },[room?.code]);

  useEffect(()=>{
    if(!room)return;
    const detect=()=>{
      try{
        const player=JSON.parse(localStorage.getItem('qaddha.player.v1')||'{}');
        const latest=Array.isArray(player.recent)?player.recent[0]:null;
        const gameId=typeof latest?.gameId==='string'?latest.gameId:'';
        if(gameId&&gameId!==gameRef.current){
          gameRef.current=gameId;
          setInputs([]);
          setJudged({});
          autoScoredRef.current.clear();
          roundScoredRef.current.clear();
          void channelRef.current?.send({type:'broadcast',event:'game',payload:{gameId}});
          const teams=loadSharedTeams();if(teams)void channelRef.current?.send({type:'broadcast',event:'team-info',payload:{teams:teams.map(team=>team.name)}});
          void channelRef.current?.send({type:'broadcast',event:'round-reset',payload:{gameId}});
        }
      }catch{/* optional */}
    };
    detect(); const timer=window.setInterval(detect,900); return()=>window.clearInterval(timer);
  },[room]);

  if(!room)return null;

  const award=(input:MultiplayerInput,delta:number)=>sendScore(input.playerId,delta);
  const resetRound=()=>{setInputs([]);setJudged({});autoScoredRef.current.clear();roundScoredRef.current.clear();void channelRef.current?.send({type:'broadcast',event:'round-reset',payload:{at:Date.now()}});};
  const copy=async()=>{try{await navigator.clipboard.writeText(joinUrl);setCopied(true);window.setTimeout(()=>setCopied(false),1500);}catch{/* url visible through code */}};
  const close=()=>{clearActiveHostRoom();setRoom(null);setInputs([]);setMembers([]);setScores({});setJudged({});autoScoredRef.current.clear();roundScoredRef.current.clear();};

  return <aside className={`mp-host ${collapsed?'collapsed':''}`} dir="rtl">
    <div className="mp-host-head"><button className="mp-host-toggle" onClick={()=>setCollapsed(value=>!value)}><span className={connected?'live':''}><Wifi/></span><b>{room.code}</b><small>{members.filter(member=>member.team===0).length} / {members.filter(member=>member.team===1).length} فرق</small></button><button onClick={close} aria-label="إغلاق الغرفة"><X/></button></div>
    {!collapsed&&<div className="mp-host-body">
      <div className="mp-host-share"><div><small>دخول اللاعبين</small><strong>{room.code}</strong></div><button onClick={copy}>{copied?<Check/>:<Copy/>}{copied?'تم':'نسخ الرابط'}</button></div>
      <div className="mp-host-actions"><button onClick={resetRound}><RotateCcw/> جولة جديدة</button><span><Users/> {members.length} متصل</span></div>
      <div className="mp-input-feed">{inputs.length?inputs.map((input,index)=>{const verdict=judged[input.id];return <article key={input.id} className={`${input.kind==='buzz'?'is-buzz':''} ${verdict?.correct===true?'is-auto-correct':''} ${verdict?.correct===false?'is-auto-wrong':''}`}><span className="mp-place">{index+1}</span><div><b>{input.playerName} · فريق {input.team===1?'2':'1'}</b><small>{input.kind==='buzz'?<><Zap/> ضغط أول</>:input.value||'إجابة'}</small>{verdict?.supported&&verdict.correct!==null?<em>{verdict.correct?`✓ صحيحة تلقائيًا +${verdict.points}`:`✕ غير صحيحة${verdict.canonical?` · الحل: ${verdict.canonical}`:''}`}</em>:null}</div><strong>{scores[input.playerId]||0}</strong><div className="mp-score-buttons"><button onClick={()=>award(input,100)}><Plus/></button><button onClick={()=>award(input,-100)}><Minus/></button></div></article>}):<div className="mp-feed-empty"><Zap/><p>بانتظار ضغطات وإجابات اللاعبين…</p></div>}</div>
    </div>}
  </aside>;
}
