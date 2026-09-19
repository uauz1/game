import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Minus, Plus, RotateCcw, Users, Wifi, X, Zap } from 'lucide-react';
import QRCode from 'qrcode';
import { createPublicLobbyPresenceChannel, removeRealtimeChannel } from '../../utils/qaddhaRealtime';
import { buildMultiplayerJoinUrl, clearActiveHostRoom, judgeMultiplayerChallenge, readActiveHostRoom, readMultiplayerChallenge, readMultiplayerRoomScores, saveMultiplayerRoomScores, type MultiplayerChallenge, type MultiplayerInput } from '../../utils/multiplayerSession';
import { autoJudgeMultiplayerAnswer, type AutoJudgeResult } from '../../utils/multiplayerAutoJudge';
import { loadSharedTeams } from '../../utils/sharedTeams';

type Member={id:string;name:string;team:0|1;ready:boolean;joinedAt:number};
type ScoreMap=Record<string,number>;
type JudgeMap=Record<string,AutoJudgeResult>;

export default function MultiplayerHostLayer(){
  const [room,setRoom]=useState(readActiveHostRoom);
  const [connected,setConnected]=useState(false);
  const [members,setMembers]=useState<Member[]>([]);
  const [inputs,setInputs]=useState<MultiplayerInput[]>([]);
  const [scores,setScores]=useState<ScoreMap>(()=>readActiveHostRoom()?.code?readMultiplayerRoomScores(readActiveHostRoom()!.code):{});
  const scoresRef=useRef<ScoreMap>(scores);
  const [judged,setJudged]=useState<JudgeMap>({});
  const challengeRef=useRef<MultiplayerChallenge|null>(readMultiplayerChallenge());
  const [collapsed,setCollapsed]=useState(true);
  const [copied,setCopied]=useState(false);
  const [qrDataUrl,setQrDataUrl]=useState('');
  const channelRef=useRef<ReturnType<typeof createPublicLobbyPresenceChannel>|null>(null);
  const hostPresenceId=useRef(`host-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`);
  const gameRef=useRef('');
  const autoScoredRef=useRef(new Set<string>());
  const roundScoredRef=useRef(new Set<string>());
  const buzzedRoundsRef=useRef(new Set<string>());
  const joinUrl=useMemo(()=>room?buildMultiplayerJoinUrl(room.code):'',[room]);

  useEffect(()=>{let active=true;if(!joinUrl){setQrDataUrl('');return;}void QRCode.toDataURL(joinUrl,{width:280,margin:1}).then(url=>{if(active)setQrDataUrl(url);}).catch(()=>{if(active)setQrDataUrl('');});return()=>{active=false;};},[joinUrl]);
  useEffect(()=>{if(room)setCollapsed(false);},[room?.code]);

  useEffect(()=>{
    const refresh=()=>setRoom(readActiveHostRoom());
    window.addEventListener('qaddha:multiplayer-room-changed',refresh);
    return()=>window.removeEventListener('qaddha:multiplayer-room-changed',refresh);
  },[]);

  const sendScore=(playerId:string,delta:number)=>{
    setScores(current=>{
      const next=Math.max(0,(current[playerId]||0)+delta);
      void channelRef.current?.send({type:'broadcast',event:'score',payload:{playerId,score:next,delta}});
      const updated={...current,[playerId]:next};scoresRef.current=updated;if(room?.code)saveMultiplayerRoomScores(room.code,updated);return updated;
    });
  };

  useEffect(()=>{
    const refreshTeams=(event:Event)=>{const detail=(event as CustomEvent<[string,string]>).detail;if(Array.isArray(detail)&&detail.length===2)void channelRef.current?.send({type:'broadcast',event:'team-info',payload:{teams:detail}});};
    window.addEventListener('qaddha:multiplayer-team-names',refreshTeams);
    return()=>window.removeEventListener('qaddha:multiplayer-team-names',refreshTeams);
  },[]);

  useEffect(()=>{
    const refreshChallenge=()=>{challengeRef.current=readMultiplayerChallenge();const active=challengeRef.current;if(active)void channelRef.current?.send({type:'broadcast',event:'round-ui',payload:{gameId:active.gameId,roundKey:active.roundKey,choices:active.choices||[],mode:active.mode||'single',requiredSelections:active.requiredSelections||active.sequenceAnswers?.length||0}});};
    window.addEventListener('qaddha:multiplayer-challenge',refreshChallenge);
    return()=>window.removeEventListener('qaddha:multiplayer-challenge',refreshChallenge);
  },[]);

  useEffect(()=>{
    const code=room?.code;
    if(!code)return;
    const savedScores=readMultiplayerRoomScores(code);scoresRef.current=savedScores;setScores(savedScores);
    let disposed=false;
    const channel=createPublicLobbyPresenceChannel(code,hostPresenceId.current);
    channelRef.current=channel;
    const syncPresence=()=>{
      const state=channel.presenceState<{id:string;name:string;team?:number;ready?:boolean;joinedAt?:number;role?:string}>();
      const players=Object.values(state).flat().filter(p=>p?.role==='player'&&typeof p.id==='string'&&typeof p.name==='string').map(p=>({id:p.id,name:p.name.slice(0,18),team:p.team===1?1:0,ready:p.ready===true,joinedAt:typeof p.joinedAt==='number'?p.joinedAt:Date.now()} as Member)).sort((a,b)=>a.joinedAt-b.joinedAt).slice(0,32);
      setMembers(players);
      window.dispatchEvent(new CustomEvent('qaddha:room-readiness',{detail:{code,players}}));
    };
    const syncNewPlayers=(newPresences: unknown[])=>{
      for(const raw of newPresences){
        const member=raw as Partial<Member>&{role?:string};
        if(member.role!=='player'||typeof member.id!=='string')continue;
        void channel.send({type:'broadcast',event:'host-message',payload:{text:'تم الاتصال بالمضيف'}});
        void channel.send({type:'broadcast',event:'score',payload:{playerId:member.id,score:scoresRef.current[member.id]||0,delta:0}});
        if(gameRef.current)void channel.send({type:'broadcast',event:'game',payload:{gameId:gameRef.current}});
        const teams=loadSharedTeams();if(teams)void channel.send({type:'broadcast',event:'team-info',payload:{teams:teams.map(team=>team.name)}});
        const active=challengeRef.current;if(active)void channel.send({type:'broadcast',event:'round-ui',payload:{gameId:active.gameId,roundKey:active.roundKey,choices:active.choices||[],mode:active.mode||'single',requiredSelections:active.requiredSelections||active.sequenceAnswers?.length||0}});
      }
    };
    channel
      .on('presence',{event:'sync'},syncPresence)
      .on('presence',{event:'join'},({newPresences})=>{syncPresence();syncNewPlayers(newPresences);})
      .on('presence',{event:'leave'},syncPresence)
      .on('broadcast',{event:'player-input'},({payload})=>{
        const incoming=payload as MultiplayerInput;
        if(!incoming||typeof incoming.id!=='string'||typeof incoming.playerId!=='string'||typeof incoming.playerName!=='string')return;
        setInputs(current=>[incoming,...current.filter(item=>item.id!==incoming.id)].slice(0,20));
        setCollapsed(false);
        if(incoming.kind==='buzz'){
          const active=challengeRef.current;
          const roundKey=active?.roundKey||`${gameRef.current}:buzz`;
          if(active?.gameId===gameRef.current&&!buzzedRoundsRef.current.has(roundKey)){
            buzzedRoundsRef.current.add(roundKey);
            window.dispatchEvent(new CustomEvent('qaddha:multiplayer-buzz',{detail:{gameId:gameRef.current,team:incoming.team===1?1:0,playerId:incoming.playerId,playerName:incoming.playerName,roundKey}}));
            void channel.send({type:'broadcast',event:'buzz-lock',payload:{roundKey,playerId:incoming.playerId,playerName:incoming.playerName,team:incoming.team===1?1:0}});
            void channel.send({type:'broadcast',event:'host-message',payload:{text:`${incoming.playerName} ضغط أول · ${incoming.team===1?'الفريق 2':'الفريق 1'}`}});
          }
        }
        if(incoming.kind==='answer'&&incoming.value){
          const activeChallenge=challengeRef.current;
          const direct = activeChallenge && activeChallenge.gameId===gameRef.current && (activeChallenge.eligibleTeam===undefined||activeChallenge.eligibleTeam===incoming.team) ? judgeMultiplayerChallenge(activeChallenge,incoming.value) : null;
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
            if(activeChallenge?.gameId==='fast'){
              buzzedRoundsRef.current.delete(activeChallenge.roundKey);
              void channel.send({type:'broadcast',event:'buzz-unlock',payload:{roundKey:activeChallenge.roundKey}});
              window.dispatchEvent(new CustomEvent('qaddha:multiplayer-wrong',{detail:{gameId:'fast',team:incoming.team===1?1:0,playerId:incoming.playerId,roundKey:activeChallenge.roundKey}}));
            }
            void channel.send({type:'broadcast',event:'host-message',payload:{text:'الإجابة وصلت، لكنها غير صحيحة'}});
          }
        }
      })
      .subscribe(status=>{
        if(disposed)return;
        setConnected(status==='SUBSCRIBED');if(status==='SUBSCRIBED')void channel.track({id:hostPresenceId.current,name:'المضيف',role:'host',joinedAt:Date.now()});
      });
    return()=>{disposed=true;channelRef.current=null;void channel.untrack().catch(()=>undefined);void removeRealtimeChannel(channel);};
  },[room?.code]);

  useEffect(()=>{
    if(!room)return;
    const syncGame=(gameId:string)=>{if(!gameId||gameId===gameRef.current)return;gameRef.current=gameId;setInputs([]);setJudged({});autoScoredRef.current.clear();roundScoredRef.current.clear();buzzedRoundsRef.current.clear();void channelRef.current?.send({type:'broadcast',event:'game',payload:{gameId}});const teams=loadSharedTeams();if(teams)void channelRef.current?.send({type:'broadcast',event:'team-info',payload:{teams:teams.map(team=>team.name)}});void channelRef.current?.send({type:'broadcast',event:'round-reset',payload:{gameId}});};
    const onGame=(event:Event)=>{const detail=(event as CustomEvent<{gameId?:string}>).detail;if(detail?.gameId)syncGame(detail.gameId);};
    window.addEventListener('qaddha:game-changed',onGame);
    const detect=()=>{
      try{
        const player=JSON.parse(localStorage.getItem('qaddha.player.v1')||'{}');
        const latest=Array.isArray(player.recent)?player.recent[0]:null;
        const gameId=typeof latest?.gameId==='string'?latest.gameId:'';
        syncGame(gameId);
      }catch{/* optional */}
    };
    detect(); const timer=window.setInterval(detect,3000); return()=>{window.clearInterval(timer);window.removeEventListener('qaddha:game-changed',onGame);};
  },[room]);

  if(!room)return null;

  const award=(input:MultiplayerInput,delta:number)=>sendScore(input.playerId,delta);
  const balanceTeams=()=>{const assignments=Object.fromEntries(members.map((member,index)=>[member.id,index%2]));void channelRef.current?.send({type:'broadcast',event:'team-assign',payload:{assignments}});void channelRef.current?.send({type:'broadcast',event:'host-message',payload:{text:'تم توزيع الفرق بالتساوي · اضغط جاهز مرة ثانية'}});};
  const resetRound=()=>{setInputs([]);setJudged({});autoScoredRef.current.clear();roundScoredRef.current.clear();buzzedRoundsRef.current.clear();void channelRef.current?.send({type:'broadcast',event:'buzz-unlock',payload:{}});void channelRef.current?.send({type:'broadcast',event:'round-reset',payload:{at:Date.now()}});};
  const copy=async()=>{try{await navigator.clipboard.writeText(joinUrl);setCopied(true);window.setTimeout(()=>setCopied(false),1500);}catch{/* url visible through code */}};
  const close=()=>{clearActiveHostRoom();setRoom(null);setInputs([]);setMembers([]);setScores({});scoresRef.current={};setJudged({});autoScoredRef.current.clear();roundScoredRef.current.clear();buzzedRoundsRef.current.clear();};

  const readyCount=members.filter(member=>member.ready).length;
  const allReady=members.length>0&&readyCount===members.length;
  return <aside className={`mp-host ${collapsed?'collapsed':''}`} dir="rtl">
    <div className="mp-host-head"><button className="mp-host-toggle" onClick={()=>setCollapsed(value=>!value)}><span className={connected?'live':''}><Wifi/></span><b>{room.code}</b><small>{readyCount}/{members.length} جاهز · {members.filter(member=>member.team===0).length}/{members.filter(member=>member.team===1).length} فرق</small></button><button onClick={close} aria-label="إغلاق الغرفة"><X/></button></div>
    {!collapsed&&<div className="mp-host-body">
      <div className="mp-host-share"><div><small>دخول اللاعبين</small><strong>{room.code}</strong><span className={allReady?'mp-ready-state all-ready':'mp-ready-state'}>{members.length?`${readyCount} من ${members.length} جاهزين`:'بانتظار اللاعبين'}</span></div><button onClick={copy}>{copied?<Check/>:<Copy/>}{copied?'تم':'نسخ الرابط'}</button>{qrDataUrl&&<div className="mp-host-qr"><img src={qrDataUrl} alt="QR لدخول غرفة قدّها"/><small>امسح للدخول مباشرة</small></div>}</div>
      <div className="mp-host-actions"><button onClick={resetRound}><RotateCcw/> إعادة الجولة</button><button disabled={members.length<2} onClick={balanceTeams}><Users/> موازنة الفرق</button><span><Users/> {members.length} متصل</span></div>
      {members.length>0&&<div className="mp-member-grid">{members.map(member=><div key={member.id} className={member.ready?'ready':''}><span><i/>{member.name}</span><small>{member.team===1?'الفريق 2':'الفريق 1'}</small><b>{member.ready?'جاهز ✓':'مو جاهز'}</b></div>)}</div>}
      <div className="mp-input-feed">{inputs.length?inputs.map((input,index)=>{const verdict=judged[input.id];return <article key={input.id} className={`${input.kind==='buzz'?'is-buzz':''} ${verdict?.correct===true?'is-auto-correct':''} ${verdict?.correct===false?'is-auto-wrong':''}`}><span className="mp-place">{index+1}</span><div><b>{input.playerName} · فريق {input.team===1?'2':'1'}</b><small>{input.kind==='buzz'?<><Zap/> ضغط أول</>:input.value||'إجابة'}</small>{verdict?.supported&&verdict.correct!==null?<em>{verdict.correct?`✓ صحيحة تلقائيًا +${verdict.points}`:`✕ غير صحيحة${verdict.canonical?` · الحل: ${verdict.canonical}`:''}`}</em>:null}</div><strong>{scores[input.playerId]||0}</strong><div className="mp-score-buttons"><button onClick={()=>award(input,100)}><Plus/></button><button onClick={()=>award(input,-100)}><Minus/></button></div></article>}):<div className="mp-feed-empty"><Zap/><p>بانتظار ضغطات وإجابات اللاعبين…</p></div>}</div>
    </div>}
  </aside>;
}
