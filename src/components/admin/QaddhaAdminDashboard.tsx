import '../../admin.css';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, BadgeCheck, BarChart3, CircleDot, Gamepad2, Gauge, Globe2,
  KeyRound, LockKeyhole, LogIn, Megaphone, Power, QrCode, RefreshCw, Save, Settings2,
  ShieldCheck, Swords, Users, UsersRound, Wifi, Wrench
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ALL_GAME_IDS, DEFAULT_QADDHA_CONFIG, QaddhaRemoteConfig, fetchQaddhaRemoteConfig,
  isCurrentUserQaddhaAdmin, saveQaddhaRemoteConfig, fetchQaddhaAdminOverview,
  fetchQaddhaAdminPlayers, fetchQaddhaAdminAudit, cancelQaddhaOnlineRoom,
  isQaddhaAdminBootstrapAvailable, bootstrapFirstQaddhaAdmin,
  type QaddhaAdminOverview, type QaddhaAdminPlayer, type QaddhaAdminAuditEntry
} from '../../utils/adminConfig';

const GAME_NAMES: Record<string,string> = {
  teams:'قدّها فرق', letters:'حروف مع عزيز', who:'من أنا؟', photo:'تحدي الصور',
  words:'بنك الكلمات', fast:'مين أسرع؟', character:'خمن الشخصية', riddles:'فوازير',
  family:'تحدي العائلة', connection:'وش الرابط؟', auction:'المزاد', order:'رتّبها',
  memory:'ذاكرة البرق', missing:'وش الناقص؟', acting:'مثّلها', secret:'الكلمة السرّية',
  pressure:'تحت الضغط', intruder:'الدخيل'
};

type Health = 'idle'|'checking'|'ok'|'error';

function Toggle({value,onChange}:{value:boolean;onChange:(v:boolean)=>void}){
  return <button type="button" aria-pressed={value} onClick={()=>onChange(!value)}
    className={`relative h-7 w-12 rounded-full border transition ${value?'bg-amber-400 border-amber-300':'bg-zinc-800 border-zinc-700'}`}>
    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${value?'left-1':'left-6'}`}/>
  </button>;
}

function timeAgo(value:string){
  const ms=Date.now()-new Date(value).getTime();
  if(!Number.isFinite(ms)||ms<0)return 'الآن';
  const min=Math.floor(ms/60000);
  if(min<1)return 'الآن';
  if(min<60)return `قبل ${min} د`;
  const h=Math.floor(min/60);
  if(h<24)return `قبل ${h} س`;
  return `قبل ${Math.floor(h/24)} يوم`;
}

export default function QaddhaAdminDashboard(){
  useEffect(()=>{document.documentElement.classList.add('admin-page');document.body.classList.add('admin-page');return()=>{document.documentElement.classList.remove('admin-page');document.body.classList.remove('admin-page');};},[]);
  const auth=useAuth();
  const [config,setConfig]=useState<QaddhaRemoteConfig>(DEFAULT_QADDHA_CONFIG);
  const [saved,setSaved]=useState<QaddhaRemoteConfig>(DEFAULT_QADDHA_CONFIG);
  const [overview,setOverview]=useState<QaddhaAdminOverview|null>(null);
  const [players,setPlayers]=useState<QaddhaAdminPlayer[]>([]);
  const [audit,setAudit]=useState<QaddhaAdminAuditEntry[]>([]);
  const [roomBusy,setRoomBusy]=useState('');
  const [allowed,setAllowed]=useState(false);
  const [checking,setChecking]=useState(true);
  const [message,setMessage]=useState('');
  const [saving,setSaving]=useState(false);
  const [refreshing,setRefreshing]=useState(false);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [displayName,setDisplayName]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [authMode,setAuthMode]=useState<'signin'|'setup'>('signin');
  const [bootstrapAvailable,setBootstrapAvailable]=useState(false);
  const [signingIn,setSigningIn]=useState(false);
  const siteBaseUrl=new URL(import.meta.env.BASE_URL,window.location.origin).href;
  const [health,setHealth]=useState<{site:Health;supabase:Health;content:Health;sessions:Health}>({
    site:'idle',supabase:'idle',content:'idle',sessions:'idle'
  });
  const changed=useMemo(()=>JSON.stringify(config)!==JSON.stringify(saved),[config,saved]);

  const refreshOverview=async()=>{
    setRefreshing(true);
    try{
      const [next,nextPlayers,nextAudit]=await Promise.all([fetchQaddhaAdminOverview(),fetchQaddhaAdminPlayers(50),fetchQaddhaAdminAudit(30)]);
      setOverview(next);setPlayers(nextPlayers);setAudit(nextAudit);
    }catch{
      setMessage('تعذر تحديث إحصائيات الإدارة الآن.');
    }finally{
      setRefreshing(false);
    }
  };

  useEffect(()=>{void (async()=>{
    setChecking(true);
    if(!auth.session){
      setAllowed(false);
      try{
        const available=await isQaddhaAdminBootstrapAvailable();
        setBootstrapAvailable(available);
        if(available)setAuthMode('setup');
      }catch{setBootstrapAvailable(false);}
      setChecking(false);
      return;
    }
    let ok=await isCurrentUserQaddhaAdmin();
    if(!ok){
      try{
        const available=await isQaddhaAdminBootstrapAvailable();
        setBootstrapAvailable(available);
        if(available)ok=await bootstrapFirstQaddhaAdmin();
      }catch{/* Existing non-admin users stay blocked once an owner exists. */}
    }
    setAllowed(ok);
    if(ok){
      const [remote,stats,nextPlayers,nextAudit]=await Promise.all([fetchQaddhaRemoteConfig(),fetchQaddhaAdminOverview().catch(()=>null),fetchQaddhaAdminPlayers(50).catch(()=>[]),fetchQaddhaAdminAudit(30).catch(()=>[])]);
      setConfig(remote);setSaved(remote);if(stats)setOverview(stats);setPlayers(nextPlayers);setAudit(nextAudit);
    }
    setChecking(false);
  })()},[auth.session?.user.id]);

  useEffect(()=>{
    if(!allowed)return;
    const timer=window.setInterval(()=>void refreshOverview(),30000);
    return()=>window.clearInterval(timer);
  },[allowed]);

  const login=async(event:FormEvent)=>{
    event.preventDefault();
    if(!email.trim()||!password){setMessage('اكتب البريد وكلمة المرور.');return;}
    if(authMode==='setup'){
      if(!displayName.trim()){setMessage('اكتب اسمك.');return;}
      if(password.length<8){setMessage('كلمة المرور لازم تكون 8 أحرف على الأقل.');return;}
      if(password!==confirmPassword){setMessage('كلمتا المرور غير متطابقتين.');return;}
      setSigningIn(true);setMessage('');
      const result=await auth.signUp(email.trim(),password,displayName.trim());
      setMessage(result.message);
      setSigningIn(false);
      return;
    }
    setSigningIn(true);setMessage('');
    const result=await auth.signIn(email.trim(),password);
    setMessage(result.message);setSigningIn(false);
  };
  const loginGoogle=async()=>{
    setSigningIn(true);setMessage('');
    const result=await auth.signInWithGoogle();
    setMessage(result.message);setSigningIn(false);
  };

  const save=async()=>{
    setSaving(true);setMessage('');
    try{
      const next=await saveQaddhaRemoteConfig(config);
      setConfig(next);setSaved(next);
      setMessage('تم حفظ التغييرات ونشرها على قدّها ✅');
      void refreshOverview();
    }catch{
      setMessage('تعذر الحفظ. تحقق من اتصال Supabase وصلاحية الإدارة.');
    }finally{setSaving(false)}
  };
  const setBool=(key:keyof QaddhaRemoteConfig,value:boolean)=>setConfig(prev=>({...prev,[key]:value}));
  const toggleGame=(id:string)=>setConfig(prev=>({...prev,enabled_games:prev.enabled_games.includes(id)?prev.enabled_games.filter(x=>x!==id):[...prev.enabled_games,id]}));

  const cancelRoom=async(roomId:string,code:string)=>{
    if(!window.confirm('إنهاء الغرفة '+code+'؟ اللاعبون الموجودون فيها بيطلعون منها.'))return;
    setRoomBusy(roomId);setMessage('');
    try{
      const ok=await cancelQaddhaOnlineRoom(roomId,'cancelled_from_control_center');
      setMessage(ok?'تم إنهاء الغرفة '+code+' ✅':'الغرفة منتهية أصلًا أو غير موجودة.');
      await refreshOverview();
    }catch{setMessage('تعذر إنهاء الغرفة.');}
    finally{setRoomBusy('');}
  };
  const runHealth=async()=>{
    setHealth({site:'checking',supabase:'checking',content:'checking',sessions:'checking'});
    const check=async(url:string):Promise<Health>=>{try{const r=await fetch(url,{cache:'no-store'});return r.ok?'ok':'error'}catch{return'error'}};
    const [site,supabase]=await Promise.all([
      check(siteBaseUrl),
      isCurrentUserQaddhaAdmin().then(v=>v?'ok' as Health:'error' as Health)
    ]);
    setHealth({
      site,
      supabase,
      content:config.content_enabled?'ok':'error',
      sessions:config.sessions_enabled?'ok':'error'
    });
    void refreshOverview();
  };

  if(checking||auth.loading)return <main dir="rtl" className="min-h-screen bg-[#080808] text-white grid place-items-center">
    <div className="text-center"><RefreshCw className="mx-auto mb-3 animate-spin text-amber-300"/><p>جاري تجهيز لوحة قدّها…</p></div>
  </main>;

  if(!auth.session)return <main dir="rtl" className="admin-auth-screen">
    <section className="admin-auth-shell">
      <aside className="admin-auth-brand">
        <div className="admin-auth-wordmark"><span>ق</span><div><b>قدّها</b><small>CONTROL CENTER</small></div></div>
        <div className="admin-auth-brand-copy">
          <span className="admin-auth-kicker"><ShieldCheck size={15}/> مساحة إدارة خاصة</span>
          <h1>كل قدّها<br/><em>من مكان واحد.</em></h1>
          <p>راقب التشغيل، الأونلاين، اللاعبين، الألعاب وسجل الإدارة من لوحة واحدة محمية.</p>
        </div>
        <div className="admin-auth-trust">
          <span><BadgeCheck size={16}/> دخول محمي</span>
          <span><Activity size={16}/> بيانات مباشرة</span>
        </div>
      </aside>
      <section className="admin-auth-card">
        <div className="admin-auth-lock"><LockKeyhole size={24}/></div>
        <div className="admin-auth-heading"><small>{authMode==='setup'?'FIRST OWNER SETUP':'ADMIN ACCESS'}</small><h2>{authMode==='setup'?'إنشاء حساب المالك':'تسجيل دخول الإدارة'}</h2><p>{authMode==='setup'?'ما فيه حساب إدارة حتى الآن. أنشئ حسابك هنا، وبيصير حساب المالك الأول تلقائيًا.':'استخدم حساب الإدارة المصرح له للدخول إلى مركز التحكم.'}</p></div>
        {bootstrapAvailable&&<div className="admin-auth-mode"><button type="button" aria-pressed={authMode==='setup'} onClick={()=>{setAuthMode('setup');setMessage('');}}>إنشاء حساب المالك</button><button type="button" aria-pressed={authMode==='signin'} onClick={()=>{setAuthMode('signin');setMessage('');}}>عندي حساب</button></div>}
        <form onSubmit={login} className="admin-auth-form">
          {authMode==='setup'&&<label>اسم المالك<input value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="name" placeholder="نواف"/></label>}
          <label>البريد الإلكتروني<input dir="ltr" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></label>
          <label>كلمة المرور<input dir="ltr" type="password" autoComplete={authMode==='setup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>
          {authMode==='setup'&&<label>تأكيد كلمة المرور<input dir="ltr" type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="••••••••"/></label>}
          <button disabled={signingIn} className="admin-auth-primary"><LogIn size={18}/>{signingIn?'جاري التنفيذ…':authMode==='setup'?'إنشاء حساب المالك':'دخول لوحة التحكم'}</button>
        </form>
        {authMode==='signin'&&<><div className="admin-auth-divider"><span/>أو<span/></div><button disabled={signingIn} onClick={loginGoogle} className="admin-auth-google"><KeyRound size={17}/>الدخول بحساب Google</button></>}
        {message&&<p className="admin-auth-message">{message}</p>}
        <a href={siteBaseUrl} className="admin-auth-back">العودة إلى قدّها</a>
      </section>
    </section>
  </main>;

  if(!allowed)return <main dir="rtl" className="min-h-screen bg-[#080808] text-white grid place-items-center p-5">
    <section className="w-full max-w-md rounded-[28px] border border-red-500/20 bg-[#111] p-7 text-center">
      <ShieldCheck className="mx-auto mb-4 text-red-300" size={34}/><h1 className="text-2xl font-black mb-2">غير مصرح</h1>
      <p className="text-sm text-zinc-400 mb-4">الحساب الحالي ليس ضمن مديري قدّها.</p>
      <button onClick={()=>void auth.signOut()} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold">تسجيل الخروج وتجربة حساب آخر</button>
    </section>
  </main>;

  const healthCards=[['الموقع',health.site,Globe2],['Supabase',health.supabase,ShieldCheck],['المحتوى',health.content,Swords],['الأونلاين',health.sessions,Wifi]] as const;
  const metrics=[
    ['الحسابات',overview?.users??0,Users],
    ['نشط آخر 24 ساعة',overview?.active_24h??0,Activity],
    ['مباريات أونلاين',overview?.matches_total??0,Swords],
    ['غرف نشطة الآن',overview?.active_rooms??0,Wifi],
  ] as const;

  return <main dir="rtl" className="admin-dashboard-root min-h-screen bg-[#070707] text-white pb-28">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-3">
        <div><p className="text-xs font-bold text-amber-300">QADDHA CONTROL CENTER</p><h1 className="text-xl sm:text-2xl font-black">إدارة قدّها</h1></div>
        <div className="flex gap-2 flex-wrap justify-end">
          <a href={siteBaseUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold">فتح الموقع</a>
          <button onClick={runHealth} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold"><RefreshCw size={16} className={refreshing?'animate-spin':''}/> تحديث</button>
          <button disabled={!changed||saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-black disabled:opacity-40"><Save size={16}/>{saving?'حفظ…':'حفظ ونشر'}</button>
        </div>
      </div>
    </header>

    <div className="mx-auto max-w-7xl px-4 py-6 space-y-5">
      <section className="rounded-[30px] border border-amber-400/20 bg-[radial-gradient(circle_at_85%_0%,rgba(217,169,59,.16),transparent_35%),linear-gradient(145deg,#15120c,#0d0d0d)] p-6">
        <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
          <div>
            <div className="flex gap-2 flex-wrap mb-3">
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300"><CircleDot size={10} className="inline ml-1"/>Live</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold border ${changed?'bg-amber-500/10 border-amber-500/20 text-amber-300':'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>{changed?'تغييرات غير محفوظة':'الإعدادات متزامنة'}</span>
            </div>
            <h2 className="text-3xl font-black">مركز تشغيل قدّها</h2>
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl">راقب الاستخدام، تحكم في الألعاب والأونلاين، وانشر أي تغيير مباشرة بدون تعديل الكود.</p>
          </div>
          <div className="text-left lg:text-right text-xs text-zinc-500">{config.updated_at?<>آخر إعداد محفوظ: {timeAgo(config.updated_at)}</>:<>الإعدادات الافتراضية</>}</div>
        </div>
      </section>

      {message&&<div className="rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-sm">{message}</div>}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(([label,value,Icon])=><article key={label} className="rounded-[22px] border border-white/10 bg-[#111] p-4">
          <div className="flex items-center justify-between"><Icon size={20} className="text-amber-300"/><span className="h-2 w-2 rounded-full bg-emerald-400"/></div>
          <strong className="mt-5 block text-3xl font-black">{value}</strong><small className="text-zinc-500">{label}</small>
        </article>)}
      </section>

      <section className="grid lg:grid-cols-[1.2fr_.8fr] gap-4">
        <div className="rounded-[26px] border border-white/10 bg-[#111] p-5">
          <div className="flex items-center justify-between gap-3 mb-4"><div className="flex items-center gap-3"><Activity className="text-amber-300"/><div><h3 className="font-black">الحالة التشغيلية</h3><p className="text-xs text-zinc-500">فحص مباشر لأجزاء قدّها الأساسية.</p></div></div><button onClick={runHealth} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold">فحص الآن</button></div>
          <div className="grid grid-cols-2 gap-2">{healthCards.map(([label,state,Icon])=><article key={label} className="rounded-2xl bg-black/30 border border-white/8 p-4"><div className="flex items-center justify-between"><Icon size={18} className="text-zinc-300"/><span className={`h-2 w-2 rounded-full ${state==='ok'?'bg-emerald-400':state==='error'?'bg-red-400':state==='checking'?'bg-amber-300 animate-pulse':'bg-zinc-600'}`}/></div><b className="block mt-3 text-sm">{label}</b><small className="text-zinc-500">{state==='ok'?'سليم':state==='error'?'متوقف/مغلق':state==='checking'?'جاري الفحص':'بانتظار الفحص'}</small></article>)}</div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#111] p-5">
          <div className="flex items-center gap-3 mb-4"><BarChart3 className="text-amber-300"/><div><h3 className="font-black">أكثر الألعاب أونلاين</h3><p className="text-xs text-zinc-500">حسب المباريات المحفوظة.</p></div></div>
          <div className="space-y-2">
            {(overview?.top_games||[]).length?(overview?.top_games||[]).map((game,index)=><div key={game.game_id} className="flex items-center gap-3 rounded-xl bg-black/30 px-3 py-2.5"><span className="w-6 text-xs font-black text-amber-300">{index+1}</span><div className="min-w-0 flex-1"><b className="block truncate text-sm">{GAME_NAMES[game.game_id]||game.game_id}</b><small className="text-zinc-500">{game.played} مشاركة</small></div></div>):<div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">تظهر البيانات بعد أول مباريات أونلاين.</div>}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-[26px] border border-white/10 bg-[#111] p-5">
          <div className="flex items-center gap-3 mb-4"><Megaphone className="text-amber-300"/><div><h3 className="font-black">رسالة أعلى الموقع</h3><p className="text-xs text-zinc-500">إعلان يظهر للمستخدمين مباشرة.</p></div></div>
          <div className="flex justify-between items-center rounded-2xl bg-black/30 p-3 mb-3"><span className="font-bold">إظهار الرسالة</span><Toggle value={config.announcement_enabled} onChange={v=>setBool('announcement_enabled',v)}/></div>
          <textarea value={config.announcement_text} onChange={e=>setConfig({...config,announcement_text:e.target.value})} className="w-full min-h-28 rounded-2xl border border-white/10 bg-black/30 p-3 outline-none focus:border-amber-400/40"/>
        </div>
        <div className="rounded-[26px] border border-white/10 bg-[#111] p-5">
          <div className="flex items-center gap-3 mb-4"><Wrench className="text-amber-300"/><div><h3 className="font-black">وضع الصيانة</h3><p className="text-xs text-zinc-500">إيقاف الموقع مؤقتًا برسالة واضحة.</p></div></div>
          <div className="flex justify-between items-center rounded-2xl bg-black/30 p-3 mb-3"><span className="font-bold">تفعيل الصيانة</span><Toggle value={config.maintenance_mode} onChange={v=>setBool('maintenance_mode',v)}/></div>
          <textarea value={config.maintenance_message} onChange={e=>setConfig({...config,maintenance_message:e.target.value})} className="w-full min-h-28 rounded-2xl border border-white/10 bg-black/30 p-3 outline-none focus:border-amber-400/40"/>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {[['المحتوى',config.content_enabled,'content_enabled',Power],['الأونلاين والجلسات',config.sessions_enabled,'sessions_enabled',UsersRound],['QR والمضيف',config.qr_enabled,'qr_enabled',QrCode]].map(([label,value,key,Icon])=>{const I=Icon as typeof Power;return <div key={String(key)} className="rounded-[24px] border border-white/10 bg-[#111] p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><I className="text-amber-300"/><span className="font-black">{String(label)}</span></div><Toggle value={Boolean(value)} onChange={v=>setBool(key as keyof QaddhaRemoteConfig,v)}/></div><p className="mt-3 text-xs text-zinc-500">{Boolean(value)?'مفعّل الآن':'متوقف بعد الحفظ والنشر'}</p></div>})}
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#111] p-5">
        <div className="flex items-center gap-3 mb-5"><Gauge className="text-amber-300"/><div><h3 className="font-black">مستوى الصعوبة العام</h3><p className="text-xs text-zinc-500">الافتراضي لمحتوى وأسئلة قدّها.</p></div></div>
        <div className="grid sm:grid-cols-3 gap-2">{[['medium','متوسط'],['medium-hard','متوسط → صعب'],['hard','صعب']].map(([value,label])=><button key={value} onClick={()=>setConfig({...config,difficulty:value as QaddhaRemoteConfig['difficulty']})} className={`rounded-2xl border p-3 font-black ${config.difficulty===value?'bg-amber-400 text-black border-amber-300':'bg-black/30 border-white/10 text-zinc-300'}`}>{label}</button>)}</div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#111] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3"><Gamepad2 className="text-amber-300"/><div><h3 className="font-black">إدارة الألعاب</h3><p className="text-xs text-zinc-500">إظهار أو إخفاء أي لعبة من تجربة المستخدم.</p></div></div>
          <div className="flex items-center gap-2"><span className="text-xs text-zinc-500">{config.enabled_games.length}/{ALL_GAME_IDS.length} مفعلة</span><button onClick={()=>setConfig({...config,enabled_games:[...ALL_GAME_IDS]})} className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] font-bold">تفعيل الكل</button></div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">{ALL_GAME_IDS.map(id=>{const on=config.enabled_games.includes(id);return <button key={id} onClick={()=>toggleGame(id)} className={`rounded-2xl border p-4 text-right transition ${on?'border-amber-400/30 bg-amber-400/10':'border-white/10 bg-black/30 opacity-55'}`}><div className="flex items-center justify-between gap-2"><span className="font-black text-sm">{GAME_NAMES[id]}</span>{on?<BadgeCheck className="text-emerald-300" size={18}/>:<AlertTriangle className="text-zinc-500" size={18}/>}</div><p className="mt-2 text-[11px] text-zinc-500">{on?'مفعلة وتظهر للمستخدمين':'موقوفة ومخفية'}</p></button>})}</div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#111] p-5">
        <div className="flex items-center justify-between gap-3 mb-4"><div className="flex items-center gap-3"><Wifi className="text-amber-300"/><div><h3 className="font-black">آخر غرف الأونلاين</h3><p className="text-xs text-zinc-500">آخر نشاط محفوظ في نظام اللعب المباشر.</p></div></div><span className="text-xs text-zinc-500">{overview?.online_players??0} لاعب دخل الأونلاين</span></div>
        {(overview?.recent_rooms||[]).length?<div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead className="text-zinc-500"><tr className="border-b border-white/10"><th className="py-3 text-right">الكود</th><th className="text-right">اللعبة</th><th className="text-right">النوع</th><th className="text-right">الحالة</th><th className="text-right">اللاعبون</th><th className="text-right">آخر تحديث</th><th className="text-right">إجراء</th></tr></thead><tbody>{overview?.recent_rooms.map(room=><tr key={room.id} className="border-b border-white/5"><td className="py-3 font-mono font-black text-amber-300">{room.code}</td><td>{GAME_NAMES[room.game_id]||room.game_id}</td><td>{room.mode==='quick'?'مطابقة سريعة':'خاصة'}</td><td><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${room.status==='playing'?'bg-emerald-500/10 text-emerald-300':room.status==='ready'?'bg-blue-500/10 text-blue-300':room.status==='waiting'?'bg-amber-500/10 text-amber-300':'bg-zinc-800 text-zinc-400'}`}>{room.status}</span></td><td>{room.members}</td><td className="text-zinc-500">{timeAgo(room.updated_at)}</td><td>{['waiting','ready','playing'].includes(room.status)?<button disabled={roomBusy===room.id} onClick={()=>void cancelRoom(room.id,room.code)} className="rounded-lg border border-red-400/20 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-bold text-red-200 disabled:opacity-40">{roomBusy===room.id?'إنهاء…':'إنهاء الروم'}</button>:<span className="text-zinc-600">—</span>}</td></tr>)}</tbody></table></div>:<div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500">ما فيه غرف أونلاين محفوظة إلى الآن.</div>}
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-[28px] border border-white/10 bg-[#111] p-5">
          <div className="flex items-center justify-between gap-3 mb-4"><div className="flex items-center gap-3"><Users className="text-amber-300"/><div><h3 className="font-black">آخر اللاعبين</h3><p className="text-xs text-zinc-500">الحسابات الأحدث نشاطًا داخل قدّها.</p></div></div><span className="text-xs text-zinc-500">{players.length} ظاهر</span></div>
          <div className="max-h-[430px] overflow-auto space-y-2">{players.length?players.map(player=><article key={player.user_id} className="rounded-2xl border border-white/8 bg-black/25 p-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><b className="block truncate">{player.display_name||'لاعب'}</b><small dir="ltr" className="block truncate text-zinc-500">{player.email||'بدون بريد ظاهر'}</small></div><span className="text-[10px] text-zinc-500">{timeAgo(player.last_seen)}</span></div><div className="mt-3 flex gap-2 text-[10px] text-zinc-400"><span>{player.games_played} مباراة</span><span>•</span><span>{player.wins} فوز</span><span>•</span><span>{player.xp} XP</span></div></article>):<div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500">ما فيه حسابات حتى الآن.</div>}</div>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-[#111] p-5">
          <div className="flex items-center justify-between gap-3 mb-4"><div className="flex items-center gap-3"><ShieldCheck className="text-amber-300"/><div><h3 className="font-black">سجل الإدارة</h3><p className="text-xs text-zinc-500">كل تغيير حساس ينحفظ هنا.</p></div></div><span className="text-xs text-zinc-500">{audit.length} حدث</span></div>
          <div className="max-h-[430px] overflow-auto space-y-2">{audit.length?audit.map(entry=><article key={entry.id} className="rounded-2xl border border-white/8 bg-black/25 p-3"><div className="flex items-center justify-between gap-3"><b className="text-sm">{entry.action==='config.update'?'تحديث إعدادات':entry.action==='room.cancel'?'إنهاء روم':entry.action}</b><span className="text-[10px] text-zinc-500">{timeAgo(entry.created_at)}</span></div><small className="mt-1 block text-zinc-500">{entry.admin_name}{entry.target_id?' · '+entry.target_id.slice(0,18):''}</small></article>):<div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500">أول تغيير إداري بيظهر هنا.</div>}</div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#111] p-5">
        <div className="flex items-center gap-3 mb-4"><Settings2 className="text-amber-300"/><h3 className="font-black">أدوات سريعة</h3></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <a href={siteBaseUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-black/30 p-4 font-bold">فتح قدّها</a>
          <a href="https://github.com/uauz1/game" target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-black/30 p-4 font-bold">GitHub</a>
          <a href="https://supabase.com/dashboard/project/uhbtcjlapgpsohbkotpd" target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-black/30 p-4 font-bold">Supabase</a>
          <button onClick={()=>void auth.signOut()} className="rounded-2xl border border-red-400/10 bg-red-500/5 p-4 text-right font-bold text-red-200">تسجيل خروج الإدارة</button>
        </div>
      </section>
    </div>
  </main>;
}
