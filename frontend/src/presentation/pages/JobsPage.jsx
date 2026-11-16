import React, { useState, useEffect, useCallback, useRef } from 'react';
import { jobs as jobsApi, ai, applications as appsApi, checkBackend } from '../../infrastructure/api/apiClient';
import Modal from '../components/common/Modal';

/* Converts raw HTML job descriptions into clean, safe HTML for rendering */
function cleanJobHtml(raw = '') {
  if (!raw) return '';
  // Step 1: Decode HTML entities (handles double-escaped HTML like &lt;div&gt;)
  const textarea = document.createElement('textarea');
  textarea.innerHTML = raw;
  let decoded = textarea.value;
  // Step 2: If still no real HTML tags after decode, check again
  if (!decoded.includes('<')) {
    // Pure plain text — preserve newlines as <br>
    return decoded.replace(/&amp;/g, '&').replace(/\n/g, '<br/>');
  }
  // Step 3: Strip dangerous/structural wrapper tags but keep content tags
  let html = decoded
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/href\s*=\s*["']javascript:[^"']*/gi, 'href="#"');
  // Step 4: Collapse redundant whitespace
  html = html.replace(/>\s{3,}</g, '><').trim();
  return html;
}

/* Strip all HTML for plain text uses */
function decodeHtml(raw = '') {
  if (!raw) return '';
  let text = raw.replace(/<[^>]*>/g, ' ');
  const ent = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&apos;':"'",'&nbsp;':' ','&ndash;':'–','&mdash;':'—','&hellip;':'…','&bull;':'•','&#8211;':'–','&#8212;':'—','&#8217;':"'",'&#8220;':'"','&#8221;':'"','&#160;':' '};
  text = text.replace(/&[a-zA-Z#0-9]+;/g, m => ent[m] || m);
  return text.replace(/\s{2,}/g, ' ').trim();
}

const SOURCE_STYLE = {
  'LinkedIn':         {bg:'#EFF3FF',color:'#0A66C2'},
  'Indeed':           {bg:'#FFF8F0',color:'#2164F3'},
  'Greenhouse':       {bg:'#E8F5E9',color:'#1B5E20'},
  'RemoteOK':         {bg:'#FFF3E0',color:'#E65100'},
  'We Work Remotely': {bg:'#F3E5F5',color:'#4A148C'},
  'Arbeitnow':        {bg:'#E3F2FD',color:'#0D47A1'},
  'Glassdoor':        {bg:'#E8F5E9',color:'#0CAA41'},
};

function SourceBadge({ source }) {
  if (!source) return null;
  const s = SOURCE_STYLE[source] || {bg:'var(--faint2)',color:'var(--muted)'};
  return <span style={{padding:'2px 8px',borderRadius:50,fontSize:9.5,fontWeight:800,background:s.bg,color:s.color,border:'1px solid '+s.color+'22',flexShrink:0}}>{source}</span>;
}

const CO_COLORS = {AstroAI:'#5c35d4',Stripe:'#635BFF','Mistral AI':'#059669',Vercel:'#111827',Deel:'#dc2626',OpenAI:'#059669',HuggingFace:'#d97706',Notion:'#111827',Anthropic:'#d97706',Datadog:'#632CA6',Cloudflare:'#F38020',MongoDB:'#47A248'};

function CoLogo({ name='', size=42, logoUrl='' }) {
  const [imgErr,setImgErr] = useState(false);
  const c = CO_COLORS[name]||'#6247d4';
  if (logoUrl && !imgErr) return <img src={logoUrl} alt={name} onError={()=>setImgErr(true)} style={{width:size,height:size,borderRadius:Math.round(size*.24),objectFit:'contain',background:'#f5f5f5',padding:3,flexShrink:0}}/>;
  return <div style={{width:size,height:size,borderRadius:Math.round(size*.24),background:c,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--serif)',fontSize:Math.floor(size*.35),fontWeight:800,color:'#fff',flexShrink:0}}>{(name||'?').slice(0,2).toUpperCase()}</div>;
}

/* Deterministic per-job score: hashes job ID + attributes for a unique 55-97% range */
function calcJobScore(job){
  if(job.match_score&&job.match_score!==80)return job.match_score;
  // Hash the job id for stability
  let h=0;
  const s=(job.id||'')+(job.title||'');
  for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}
  const base=Math.abs(h)%43; // 0-42
  const bonus=(job.remote?5:0)+(job.salary?4:0)+(job.skills?.length>3?5:0)+(job.level==='Senior'?3:job.level==='Junior'?-3:0);
  return Math.min(97,Math.max(55,55+base+bonus));
}

function MatchScore({score}){
  const color=score>=90?'var(--green)':score>=80?'var(--p500)':'var(--amber)';
  return <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,flexShrink:0}}><div style={{fontFamily:'var(--serif)',fontSize:20,fontWeight:900,color,lineHeight:1}}>{score}%</div><div style={{fontSize:9.5,fontWeight:700,color,textTransform:'uppercase'}}>Match</div></div>;
}

// SVG icon components (no emojis)
const IcSearch = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const IcRefresh = ()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IcBookmark = ({filled})=><svg width="13" height="13" viewBox="0 0 24 24" fill={filled?'var(--p500)':'none'} stroke="var(--p500)" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
const IcExternal = ()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IcBrain = ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
const IcLetter = ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IcCopy = ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcCheck = ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcBuilding = ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;

const FILTERS = ['All','Remote','Full-time','Senior','Junior'];
const SOURCES = ['All','LinkedIn','Indeed','Greenhouse','RemoteOK','We Work Remotely','Arbeitnow'];

function timeAgo(d){if(!d)return'';const diff=Math.floor((Date.now()-new Date(d))/86400000);return diff===0?'Today':diff===1?'1d ago':diff<30?diff+'d ago':Math.floor(diff/30)+'mo ago';}

function getSavedJobs(){try{return JSON.parse(localStorage.getItem('hired_saved_jobs')||'[]');}catch{return[];}}
function persistSavedJobs(arr){localStorage.setItem('hired_saved_jobs',JSON.stringify(arr));window.dispatchEvent(new CustomEvent('hired_saved_jobs_changed',{detail:arr}));}

export default function JobsPage({toast,user}){
  const [jobsList,setJobsList]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('All');
  const [srcFilter,setSrcFilter]=useState('All');
  const [search,setSearch]=useState('');
  const [selId,setSelId]=useState(null);
  const [saved,setSaved]=useState(()=>new Set(getSavedJobs().map(j=>j.id)));
  const [applied,setApplied]=useState(new Set());
  const [modal,setModal]=useState(null);
  const [detTab,setDetTab]=useState('job');
  const [coverTxt,setCoverTxt]=useState('');
  const [coverGen,setCoverGen]=useState(false);
  const [page,setPage]=useState(1);
  const [total,setTotal]=useState(0);
  const [scraping,setScraping]=useState(false);
  const [backendOk,setBackendOk]=useState(false);
  const [summary,setSummary]=useState(null);
  const [sumLoad,setSumLoad]=useState(false);
  const [coDetails,setCoDetails]=useState(null);
  const [coLoad,setCoLoad]=useState(false);
  /* Live AI match scores: jobId -> score */
  const [aiScores,setAiScores]=useState({});
  const scoringRef=useRef(new Set());

  const fetchJobs=useCallback(async(pg=1,q='',f='All',src='All')=>{
    setLoading(true);
    try{
      const params={page:pg,page_size:20};
      if(q)params.q=q;
      if(f==='Remote')params.remote=true;
      if(f==='Full-time')params.job_type='Full-time';
      if(f==='Senior')params.level='Senior';
      if(f==='Junior')params.level='Junior';
      if(src!=='All')params.source=src;
      const data=await jobsApi.search(params);
      setJobsList(data.jobs||[]);
      setTotal(data.total||0);
      setPage(pg);
    }catch(e){toast('Could not load jobs — is the backend running?');setJobsList([]);}
    setLoading(false);
  },[toast]);

  useEffect(()=>{
    checkBackend().then(ok=>{
      setBackendOk(ok);
      if(ok)fetchJobs(1,'','All');
      else{setLoading(false);toast('Backend offline — start uvicorn first');}
    });
  },[]);

  useEffect(()=>{
    if(!backendOk)return;
    const t=setTimeout(()=>fetchJobs(1,search,filter,srcFilter),350);
    return()=>clearTimeout(t);
  },[search,filter,srcFilter,backendOk]);

  async function triggerScrape(){
    setScraping(true);
    try{await jobsApi.triggerScrape();toast('Scraping live jobs from LinkedIn, Indeed, RemoteOK — refreshing in 35s');setTimeout(()=>fetchJobs(1,search,filter,srcFilter),35000);}
    catch{toast('Scrape failed');}
    setTimeout(()=>setScraping(false),6000);
  }

  async function openCover(job){
    const uN=user?.name||'Candidate',uS=user?.skills||job.skills||[],uT=user?.title||'';
    setCoverTxt('');setCoverGen(true);setModal('cover');
    try{const l=await ai.generateCoverLetter({name:uN,title:uT,skills:uS,bio:user?.bio||''},job,'professional');setCoverTxt(l);}
    catch{setCoverTxt(`Dear Hiring Team at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} position. With my background in ${uS.slice(0,3).join(', ')}, I am confident I can make an immediate impact.\n\nI look forward to discussing this opportunity.\n\nBest regards,\n${uN}`);}
    setCoverGen(false);
  }

  async function loadSummary(job){
    setSummary(null);setSumLoad(true);
    try{setSummary(await jobsApi.summarize(job.id));}
    catch{setSummary({summary:'Could not generate summary — check backend connection.'});}
    setSumLoad(false);
  }

  async function loadCompanyDetails(job){
    setCoDetails(null);setCoLoad(true);
    try{setCoDetails(await ai.getCompanyDetails(job.company,job.title));}
    catch{setCoDetails({description:`${job.company} is hiring for ${job.title}.`,culture_tags:[],known_for:[]});}
    setCoLoad(false);
  }

  function doApply(job){
    if(job.apply_url)window.open(job.apply_url,'_blank','noopener,noreferrer');
    setApplied(p=>new Set([...p,job.id]));
    appsApi.create({jobId:job.id,status:'applied'}).catch(()=>{});
    toast('Opening job page — good luck!');
  }

  function toggleSave(job){
    const id=job.id;
    const willSave=!saved.has(id);
    setSaved(prev=>{const n=new Set(prev);willSave?n.add(id):n.delete(id);return n;});
    const cur=getSavedJobs();
    if(willSave){
      persistSavedJobs([...cur.filter(j=>j.id!==id),{id:job.id,title:job.title,company:job.company,location:job.location,salary:job.salary,source:job.source,apply_url:job.apply_url,match_score:getScore(job),savedAt:new Date().toISOString()}]);
      appsApi.create({jobId:job.id,status:'saved'}).catch(()=>{});
      toast('Saved to Tracker — visible in Kanban board');
    } else {
      persistSavedJobs(cur.filter(j=>j.id!==id));
      toast('Removed from saved');
    }
  }

  /* Fire AI match in background when a job is selected */
  useEffect(()=>{
    if(!selId||!backendOk)return;
    const job=jobsList.find(j=>j.id===selId);
    if(!job||scoringRef.current.has(selId))return;
    scoringRef.current.add(selId);
    const userProfile={name:user?.name||'Candidate',title:user?.title||'Software Engineer',skills:user?.skills||[],bio:user?.bio||'',location:user?.location||''};
    ai.matchScore(userProfile,job)
      .then(r=>{ if(r?.score)setAiScores(prev=>({...prev,[selId]:r.score})); })
      .catch(()=>{});
  },[selId,backendOk,jobsList,user]);

  const sel=selId?jobsList.find(j=>j.id===selId):null;
  /* Resolve score: AI result > job field > deterministic hash */
  const getScore=(job)=>aiScores[job.id]||calcJobScore(job);

  return(
    <div style={{flex:1,display:'flex',overflow:'hidden'}}>

      {/* LEFT LIST */}
      <div className="feed-L" style={{width:320,flexShrink:0,display:'flex',flexDirection:'column'}}>
        <div style={{padding:'12px',borderBottom:'1.5px solid var(--faint)',background:'var(--surface)',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:9,background:'var(--p25)',border:'1.5px solid var(--faint)',borderRadius:10,padding:'9px 12px',marginBottom:9}}>
            <IcSearch/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Title, skill, company…"
              style={{flex:1,border:'none',outline:'none',background:'none',fontSize:13,color:'var(--ink)',fontFamily:'var(--sans)'}}/>
            {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:16,padding:0}}>×</button>}
          </div>
          <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:2,marginBottom:7}}>
            {FILTERS.map(f=><button key={f} className={`f-chip${filter===f?' active':''}`} onClick={()=>setFilter(f)}>{f}</button>)}
          </div>
          {/* Source filter row */}
          <div style={{display:'flex',gap:4,overflowX:'auto',paddingBottom:2,marginBottom:8}}>
            {SOURCES.map(src=>{
              const s=SOURCE_STYLE[src]||{};
              const active=srcFilter===src;
              return <button key={src} onClick={()=>setSrcFilter(src)} style={{padding:'3px 8px',borderRadius:50,fontSize:9.5,fontWeight:800,border:'1px solid '+(active?(s.color||'var(--p400)'):'var(--faint)'),background:active?(s.bg||'var(--p50)'):'transparent',color:active?(s.color||'var(--p600)'):'var(--muted)',cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s',flexShrink:0}}>{src}</button>;
            })}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:11,color:'var(--muted)',fontWeight:600}}>{loading?'Loading…':`${total} live jobs`}</div>
            <button onClick={triggerScrape} disabled={scraping} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:50,border:'1px solid var(--faint)',background:scraping?'var(--p100)':'transparent',color:scraping?'var(--p500)':'var(--muted)',cursor:'pointer'}}>
              <IcRefresh/>{scraping?'Scraping…':'Refresh'}
            </button>
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto'}}>
          {loading&&<div style={{padding:32,textAlign:'center',color:'var(--muted)',fontSize:13,fontWeight:600,animation:'pulse 1.5s ease-in-out infinite'}}>Loading live jobs…</div>}
          {!loading&&jobsList.length===0&&(
            <div style={{padding:32,textAlign:'center',color:'var(--muted)'}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>{backendOk?'No jobs found':'Backend offline'}</div>
              {backendOk?<button className="btn btn-ghost btn-sm" onClick={triggerScrape}>Fetch live jobs</button>
                :<div style={{fontSize:11,color:'var(--red)'}}>Start: uvicorn app.main:app --reload --port 8000</div>}
            </div>
          )}
          {jobsList.map(j=>(
            <div key={j.id} className={`jl-item${selId===j.id?' active':''}`} onClick={()=>{setSelId(j.id);setDetTab('job');setSummary(null);setCoDetails(null);}}>
              <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <CoLogo name={j.company} size={36} logoUrl={j.logo_url}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:13,color:'var(--ink)',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.title}</div>
                  <div style={{fontSize:11.5,color:'var(--muted)',marginBottom:5}}>{j.company} · {j.location}</div>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
                    {j.job_type&&<span className="badge badge-purple">{j.job_type}</span>}
                    {j.level&&<span className="badge badge-blue">{j.level}</span>}
                    {j.salary&&<span className="badge badge-green">{j.salary}</span>}
                    {j.source&&<SourceBadge source={j.source}/>}
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0}}>
                  <MatchScore score={getScore(j)}/>
                  <button onClick={e=>{e.stopPropagation();toggleSave(j);}} title={saved.has(j.id)?'Remove from saved':'Save to Tracker'}
                    style={{width:24,height:24,borderRadius:6,border:'1px solid var(--faint)',background:saved.has(j.id)?'var(--p50)':'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <IcBookmark filled={saved.has(j.id)}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {total>20&&(
            <div style={{padding:'12px',display:'flex',justifyContent:'center',gap:8}}>
              {page>1&&<button className="btn btn-ghost btn-sm" onClick={()=>fetchJobs(page-1,search,filter,srcFilter)}>← Prev</button>}
              <span style={{fontSize:11,color:'var(--muted)',alignSelf:'center'}}>Page {page}/{Math.ceil(total/20)}</span>
              {page<Math.ceil(total/20)&&<button className="btn btn-ghost btn-sm" onClick={()=>fetchJobs(page+1,search,filter,srcFilter)}>Next →</button>}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT DETAIL */}
      <div className="feed-R" style={{flex:1,overflowY:'auto'}}>
        {!sel?(
          <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,padding:40,color:'var(--muted)'}}>
            <div style={{width:72,height:72,borderRadius:20,background:'var(--p100)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--p400)" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
            </div>
            <div style={{fontFamily:'var(--serif)',fontSize:20,fontWeight:700,color:'var(--ink2)'}}>Select a job</div>
            <div style={{fontSize:13,textAlign:'center',maxWidth:260,lineHeight:1.6}}>Click any listing to view details, AI summary, and apply directly on LinkedIn or Indeed.</div>
            {!backendOk&&<div style={{padding:'12px 18px',borderRadius:12,background:'var(--redl)',fontSize:12,color:'var(--red)',textAlign:'center',maxWidth:280}}>Backend offline — start uvicorn</div>}
          </div>
        ):(
          <div style={{padding:'24px 28px 48px',maxWidth:760}}>
            {/* Hero */}
            <div style={{background:'linear-gradient(135deg,var(--p800),var(--p600))',borderRadius:20,padding:'24px 28px',marginBottom:18,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'rgba(255,255,255,.05)',pointerEvents:'none'}}/>
              <div style={{display:'flex',gap:16,alignItems:'flex-start',position:'relative',zIndex:1}}>
                <CoLogo name={sel.company} size={52} logoUrl={sel.logo_url}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'var(--serif)',fontSize:22,fontWeight:800,color:'#fff',letterSpacing:'-.5px',marginBottom:4}}>{sel.title}</div>
                  <div style={{fontSize:13,color:'rgba(255,255,255,.65)',marginBottom:12}}>{sel.company} · {sel.location}</div>
                  <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}>
                    {[sel.salary,sel.job_type,sel.level,timeAgo(sel.posted_at)].filter(Boolean).map(v=>(
                      <div key={v} style={{background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.15)',borderRadius:8,padding:'4px 11px',fontSize:11.5,fontWeight:600,color:'rgba(255,255,255,.85)'}}>{v}</div>
                    ))}
                    {sel.source&&<div style={{background:'rgba(255,255,255,.08)',borderRadius:8,padding:'4px 11px',fontSize:11,fontWeight:700,color:'rgba(255,255,255,.7)',border:'1px solid rgba(255,255,255,.12)'}}>via {sel.source}</div>}
                    {sel.remote&&<div style={{background:'rgba(15,122,74,.25)',border:'1px solid rgba(15,122,74,.3)',borderRadius:8,padding:'4px 11px',fontSize:11,fontWeight:700,color:'#7eeac3'}}>Remote</div>}
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontFamily:'var(--serif)',fontSize:44,fontWeight:900,color:'#fff',letterSpacing:-2,lineHeight:1}}>{getScore(sel)}%</div>
                  <div style={{fontSize:10.5,color:'rgba(255,255,255,.5)',fontWeight:600}}>{aiScores[sel.id]?'AI Match':'Est. Match'}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>
              <button className="btn btn-primary" onClick={()=>doApply(sel)} style={{background:applied.has(sel.id)?'var(--green)':'var(--p500)',display:'flex',alignItems:'center',gap:6}}>
                {applied.has(sel.id)?<><IcCheck/>Applied</>:<><IcExternal/>Apply on {sel.source||'Platform'}</>}
              </button>
              <button className="btn btn-outline btn-sm" onClick={()=>openCover(sel)} style={{display:'flex',alignItems:'center',gap:5}}><IcLetter/>Cover Letter</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setDetTab('summary');loadSummary(sel);}} style={{display:'flex',alignItems:'center',gap:5}}><IcBrain/>AI Summary</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>toggleSave(sel)} style={{display:'flex',alignItems:'center',gap:5,color:saved.has(sel.id)?'var(--p600)':'var(--muted)',background:saved.has(sel.id)?'var(--p50)':'transparent'}}>
                <IcBookmark filled={saved.has(sel.id)}/>{saved.has(sel.id)?'Saved to Tracker':'Save to Tracker'}
              </button>
              {sel.apply_url&&<a href={sel.apply_url} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:50,border:'1.5px solid var(--faint)',fontSize:12,fontWeight:700,color:'var(--muted)',textDecoration:'none'}}><IcExternal/>Original Post</a>}
            </div>

            {/* Tabs */}
            <div style={{display:'flex',gap:2,background:'var(--surface)',borderRadius:12,padding:4,border:'1.5px solid var(--faint)',marginBottom:18,width:'fit-content'}}>
              {[['job','Job Details'],['summary','AI Summary'],['company','Company']].map(([id,lbl])=>(
                <button key={id} onClick={()=>{setDetTab(id);if(id==='summary'&&!summary&&!sumLoad)loadSummary(sel);if(id==='company'&&!coDetails&&!coLoad)loadCompanyDetails(sel);}}
                  style={{padding:'7px 18px',borderRadius:9,border:'none',fontWeight:700,fontSize:12.5,cursor:'pointer',background:detTab===id?'var(--p500)':'transparent',color:detTab===id?'#fff':'var(--muted)',fontFamily:'var(--sans)'}}>{lbl}</button>
              ))}
            </div>

            {/* Job Details — HTML decoded */}
            {detTab==='job'&&(
              <>
                <div className="card" style={{marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--p500)',marginBottom:10}}>About the Role</div>
                  {sel.description
                    ? <div
                        dangerouslySetInnerHTML={{ __html: cleanJobHtml(sel.description) }}
                        style={{fontSize:13.5,color:'var(--ink2)',lineHeight:1.8,maxWidth:'100%',overflowX:'hidden'}}
                        className="job-desc-html"
                      />
                    : <p style={{fontSize:13.5,color:'var(--muted)',margin:0}}>No description available. Click "Original Post" to see full listing.</p>
                  }
                </div>
                {sel.skills?.length>0&&(
                  <div className="card">
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--p500)',marginBottom:10}}>Skills & Technologies</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                      {sel.skills.map(sk=><span key={sk} style={{padding:'5px 13px',background:'var(--p50)',border:'1.5px solid var(--p200)',borderRadius:8,fontSize:12,fontWeight:700,color:'var(--p700)'}}>{sk}</span>)}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* AI Summary */}
            {detTab==='summary'&&(
              <div className="card">
                <div style={{fontSize:10,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--p500)',marginBottom:14,display:'flex',alignItems:'center',gap:6}}><IcBrain/>AI Job Analysis</div>
                {sumLoad&&<div style={{padding:'24px 0',textAlign:'center',color:'var(--muted)',fontSize:13,animation:'pulse 1.5s ease-in-out infinite'}}>Analysing job with AI…</div>}
                {!sumLoad&&!summary&&<div style={{color:'var(--muted)',fontSize:13}}>Click "AI Summary" above to analyse this job.</div>}
                {summary&&(
                  <div style={{display:'flex',flexDirection:'column',gap:14}}>
                    {summary.summary&&<p style={{fontSize:13.5,color:'var(--ink2)',lineHeight:1.8,margin:0}}>{summary.summary}</p>}
                    {(summary.key_requirements||summary.key_responsibilities)?.length>0&&(
                      <div>
                        <div style={{fontSize:11,fontWeight:800,color:'var(--p500)',marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>Key Requirements</div>
                        {(summary.key_requirements||summary.key_responsibilities).map((r,i)=><div key={i} style={{fontSize:13,color:'var(--muted)',lineHeight:1.6,marginBottom:3}}>• {r}</div>)}
                      </div>
                    )}
                    {summary.required_skills?.length>0&&(
                      <div>
                        <div style={{fontSize:11,fontWeight:800,color:'var(--p500)',marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>Skills Needed</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                          {summary.required_skills.map((s,i)=><span key={i} style={{padding:'4px 11px',background:'var(--p50)',border:'1px solid var(--p200)',borderRadius:7,fontSize:12,fontWeight:700,color:'var(--p700)'}}>{s}</span>)}
                        </div>
                      </div>
                    )}
                    {summary.red_flags?.length>0&&(
                      <div style={{padding:'12px 16px',background:'var(--redl,#fce8e8)',borderRadius:12,border:'1px solid rgba(154,31,31,.15)'}}>
                        <div style={{fontSize:11,fontWeight:800,color:'var(--red,#9a1f1f)',marginBottom:6,textTransform:'uppercase',letterSpacing:1}}>Watch Out</div>
                        {summary.red_flags.map((f,i)=><div key={i} style={{fontSize:12.5,color:'var(--red,#9a1f1f)',lineHeight:1.6,marginBottom:2}}>{f}</div>)}
                      </div>
                    )}
                    {summary.match_tips?.length>0&&(
                      <div>
                        <div style={{fontSize:11,fontWeight:800,color:'var(--green,#0f7a4a)',marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>How to Stand Out</div>
                        {summary.match_tips.map((t,i)=><div key={i} style={{fontSize:12.5,color:'var(--muted)',lineHeight:1.6,marginBottom:3}}>• {t}</div>)}
                      </div>
                    )}
                    {summary.ideal_candidate&&(
                      <div style={{padding:'12px 16px',background:'var(--p25)',borderRadius:12,border:'1px solid var(--p100)'}}>
                        <div style={{fontSize:11,fontWeight:800,color:'var(--p500)',marginBottom:5,textTransform:'uppercase',letterSpacing:1}}>Ideal Candidate</div>
                        <div style={{fontSize:12.5,color:'var(--ink2)',lineHeight:1.65}}>{summary.ideal_candidate}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Company Intelligence */}
            {detTab==='company'&&(
              <div className="card">
                <div style={{fontSize:10,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--p500)',marginBottom:14,display:'flex',alignItems:'center',gap:6}}><IcBuilding/>Company Intelligence</div>
                {coLoad&&<div style={{padding:'24px 0',textAlign:'center',color:'var(--muted)',fontSize:13,animation:'pulse 1.5s ease-in-out infinite'}}>Loading company details…</div>}
                {!coLoad&&!coDetails&&<div style={{color:'var(--muted)',fontSize:13}}>Click "Company" tab to load real details.</div>}
                {coDetails&&(
                  <div style={{display:'flex',flexDirection:'column',gap:14}}>
                    <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                      <CoLogo name={sel.company} size={56} logoUrl={sel.logo_url}/>
                      <div>
                        <div style={{fontFamily:'var(--serif)',fontSize:18,fontWeight:800,color:'var(--ink)',marginBottom:4}}>{sel.company}</div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          {coDetails.industry&&<span style={{padding:'3px 10px',background:'var(--p50)',borderRadius:6,fontSize:11,fontWeight:700,color:'var(--p600)'}}>{coDetails.industry}</span>}
                          {coDetails.size&&<span style={{padding:'3px 10px',background:'var(--faint2)',borderRadius:6,fontSize:11,fontWeight:700,color:'var(--muted)'}}>{coDetails.size}</span>}
                          {coDetails.headquarters&&<span style={{padding:'3px 10px',background:'var(--faint2)',borderRadius:6,fontSize:11,fontWeight:700,color:'var(--muted)'}}>{coDetails.headquarters}</span>}
                          {coDetails.founded&&coDetails.founded!=='Unknown'&&<span style={{padding:'3px 10px',background:'var(--faint2)',borderRadius:6,fontSize:11,fontWeight:700,color:'var(--muted)'}}>Est. {coDetails.founded}</span>}
                        </div>
                      </div>
                    </div>
                    {coDetails.description&&<p style={{fontSize:13.5,color:'var(--ink2)',lineHeight:1.8,margin:0}}>{coDetails.description}</p>}
                    {coDetails.culture_tags?.length>0&&(
                      <div>
                        <div style={{fontSize:11,fontWeight:800,color:'var(--p500)',marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>Culture</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                          {coDetails.culture_tags.map((t,i)=><span key={i} style={{padding:'5px 12px',background:'var(--p50)',border:'1px solid var(--p200)',borderRadius:20,fontSize:12,fontWeight:700,color:'var(--p600)'}}>{t}</span>)}
                        </div>
                      </div>
                    )}
                    {coDetails.known_for?.length>0&&(
                      <div>
                        <div style={{fontSize:11,fontWeight:800,color:'var(--p500)',marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>Known For</div>
                        {coDetails.known_for.map((k,i)=><div key={i} style={{fontSize:13,color:'var(--muted)',lineHeight:1.6,marginBottom:3}}>— {k}</div>)}
                      </div>
                    )}
                    {coDetails.glassdoor_rating&&(
                      <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 16px',background:'var(--p25)',borderRadius:12,border:'1px solid var(--p100)'}}>
                        <span style={{fontSize:22,fontWeight:900,fontFamily:'var(--serif)',color:'var(--green)'}}>{'*'.repeat(Math.round(coDetails.glassdoor_rating))}</span>
                        <div><div style={{fontSize:14,fontWeight:800,color:'var(--ink)'}}>{coDetails.glassdoor_rating}/5</div><div style={{fontSize:11,color:'var(--muted)'}}>Glassdoor (AI estimate)</div></div>
                      </div>
                    )}
                    {coDetails.website&&<a href={coDetails.website} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:9,border:'1.5px solid var(--faint)',fontSize:12.5,fontWeight:700,color:'var(--p600)',textDecoration:'none',width:'fit-content'}}><IcExternal/>Visit {sel.company} website</a>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cover Letter Modal */}
      {modal==='cover'&&sel&&(
        <Modal title={`Cover Letter — ${sel.title}`} subtitle={`AI-generated for ${sel.company}`} onClose={()=>setModal(null)}
          footer={<><button className="btn btn-ghost" onClick={()=>setModal(null)}>Close</button>{!coverGen&&<button className="btn btn-primary" style={{display:'flex',alignItems:'center',gap:6}} onClick={()=>{navigator.clipboard?.writeText(coverTxt);toast('Cover letter copied!');}}>Copy</button>}</>}>
          {coverGen?<div style={{textAlign:'center',padding:'32px 0',color:'var(--muted)',fontSize:13,animation:'pulse 1.5s ease-in-out infinite'}}>Generating cover letter…</div>
            :<textarea value={coverTxt} onChange={e=>setCoverTxt(e.target.value)} style={{width:'100%',minHeight:260,background:'var(--p25)',border:'1.5px solid var(--faint)',borderRadius:10,padding:'14px 16px',fontSize:13,color:'var(--ink)',lineHeight:1.75,fontFamily:'var(--sans)',resize:'vertical',outline:'none'}}/>}
        </Modal>
      )}
    </div>
  );
}
