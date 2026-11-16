import React, { useState } from 'react';
import { SkillsTestService } from '../../application/services/SkillsTestService';
import ProgressBar from '../components/common/ProgressBar';

const svc = new SkillsTestService();

const QS=[
  {q:'How do you prefer to work?',opts:['Independently on deep work','In collaborative teams','Mix of both','Depends on the project'],badge:'WORK STYLE'},
  {q:'What type of problems energize you?',opts:['Analytical & logical puzzles','Creative & design challenges','People & communication problems','Strategic & big-picture thinking'],badge:'PROBLEM TYPE'},
  {q:'How do you prefer to communicate?',opts:['Written (docs, email, async)','Verbal (calls, meetings)','Visual (diagrams, slides)','All equally'],badge:'COMMUNICATION'},
  {q:"What's your education background?",opts:['Computer Science / Engineering','Business / Economics','Design / Arts','Self-taught / Bootcamp'],badge:'EDUCATION'},
  {q:'Years of professional experience?',opts:['0–2 years','3–5 years','6–10 years','10+ years'],badge:'EXPERIENCE'},
  {q:'Preferred company size?',opts:['Startup (1–50)','Scale-up (50–500)','Mid-size (500–5k)','Enterprise (5k+)'],badge:'COMPANY SIZE'},
  {q:'What do you value most in work?',opts:['High salary & compensation','Meaningful impact & mission','Work-life balance','Prestige & brand name'],badge:'VALUES'},
  {q:'Technical or people-facing?',opts:['Deeply technical (code, data)','Technical + stakeholder work','People-first (sales, HR, ops)','Creative (design, content)'],badge:'ORIENTATION'},
  {q:'Risk tolerance?',opts:['Love high-risk, high-reward','Moderate risk is fine','Prefer stability','Depends on the context'],badge:'RISK'},
  {q:'Entrepreneurial ambitions?',opts:['Yes — I want to build my own thing','Maybe someday','No, I prefer to build in a team','Already running something'],badge:'ENTREPRENEUR'},
  {q:'How do you learn best?',opts:['Reading docs & books','Building projects hands-on','Watching tutorials & courses','Pair programming & mentorship'],badge:'LEARNING'},
  {q:"Ideal career trajectory?",opts:['Technical IC (Staff, Principal)','Engineering Manager / Director','Founder / CEO','Consultant / Freelancer'],badge:'TRAJECTORY'},
  {q:'Remote or in-office?',opts:['100% remote','Hybrid (2–3 days)','Prefer in-office','No preference'],badge:'LOCATION'},
  {q:'How do you handle ambiguity?',opts:['Thrive in it — love figuring it out','Handle it with clear structure','Prefer clear specs & direction','Depends on stakes'],badge:'AMBIGUITY'},
  {q:"What's your superpower?",opts:['Building fast & shipping','Going deep on hard problems','Bringing people together','Seeing the strategic picture'],badge:'SUPERPOWER'},
];

const RESULTS=[
  {role:'AI/ML Engineer',match:96,desc:"Built for cutting-edge AI work — analytical, technical, drawn to hard problems at the frontier.",color:'var(--p600)',bg:'var(--p50)',path:'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'},
  {role:'Full-Stack Developer',match:91,desc:'Your breadth and builder mentality make you ideal for end-to-end product development at startups.',color:'#0891b2',bg:'#e0f7fa',path:'M16 18l6-6-6-6M8 6l-6 6 6 6'},
  {role:'Product Manager',match:84,desc:'You combine technical depth with strategic thinking — exactly what modern PM roles demand.',color:'#059669',bg:'#d1fae5',path:'M22 12h-4M6 12H2M12 6V2M12 22v-4'},
  {role:'Data Scientist',match:78,desc:'Your analytical mind and comfort with ambiguity suit you well for data-driven decision-making roles.',color:'#8a5a0a',bg:'#fef3c7',path:'M18 20V10M12 20V4M6 20v-6'},
  {role:'Engineering Manager',match:71,desc:'Your leadership instincts and technical background position you well for managing high-performance teams.',color:'#7c3aed',bg:'#ede9fe',path:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'},
];

function RoleIcon({path,color,size=24}){
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path}/>
    </svg>
  );
}

export default function TestPage({toast}){
  const [stage,   setStage]  =useState('start');
  const [idx,     setIdx]    =useState(0);
  const [answers, setAnswers]=useState([]);
  const [selected,setSelected]=useState(null);

  function pick(ans){
    setSelected(ans);
    setTimeout(()=>{
      const next=[...answers,ans];
      setAnswers(next);
      setSelected(null);
      if(idx<QS.length-1) setIdx(i=>i+1);
      else setStage('results');
    },260);
  }
  function reset(){setStage('start');setIdx(0);setAnswers([]);setSelected(null);}

  /* ── START SCREEN ── */
  if(stage==='start') return(
    <div style={{flex:1,overflow:'auto',display:'flex',alignItems:'center',justifyContent:'center',padding:'36px 24px'}}>
      <div style={{maxWidth:600,width:'100%'}}>
        <style>{`@keyframes float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
        {/* Icon visual */}
        <div style={{position:'relative',width:120,height:120,margin:'0 auto 32px'}}>
          <div style={{width:120,height:120,borderRadius:36,background:'linear-gradient(135deg,var(--p100),var(--p50))',border:'2px solid var(--p200)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 12px 40px rgba(98,71,212,.15)',animation:'float2 4s ease-in-out infinite'}}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--p500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          {/* Small orbiting dots */}
          {[0,1,2].map(i=>(
            <div key={i} style={{position:'absolute',width:12,height:12,borderRadius:'50%',background:['var(--p400)','var(--p300)','var(--p200)'][i],top:['0%','70%','35%'][i],left:['80%','75%','-5%'][i],boxShadow:`0 2px 8px rgba(98,71,212,.3)`,animation:`float2 ${3+i}s ease-in-out infinite`,animationDelay:`${i*.6}s`}}/>
          ))}
        </div>

        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontFamily:'var(--serif)',fontSize:'clamp(26px,4vw,36px)',fontWeight:800,color:'var(--ink)',letterSpacing:-1,marginBottom:12}}>Discover your perfect career</div>
          <p style={{fontSize:15,color:'var(--muted)',lineHeight:1.8,maxWidth:440,margin:'0 auto'}}>Answer 15 quick questions and our AI will identify the top career paths where you'll thrive most.</p>
        </div>

        {/* Feature pills — SVG icons, no emojis */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:36}}>
          {[
            {label:'15 questions',icon:'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'},
            {label:'AI analysis',icon:'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'},
            {label:'Top 5 matches',icon:'M22 12h-4M6 12H2M12 6V2M12 22v-4'},
            {label:'Actionable insights',icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'},
          ].map(f=>(
            <div key={f.label} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderRadius:14,background:'var(--surface)',border:'1.5px solid var(--faint)',boxShadow:'0 2px 8px rgba(98,71,212,.04)'}}>
              <div style={{width:36,height:36,borderRadius:10,background:'var(--p50)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--p500)" strokeWidth="2" strokeLinecap="round"><path d={f.icon}/></svg>
              </div>
              <span style={{fontSize:13,fontWeight:700,color:'var(--ink)'}}>{f.label}</span>
            </div>
          ))}
        </div>

        <button onClick={()=>setStage('test')} style={{width:'100%',padding:'15px',borderRadius:16,border:'none',background:'linear-gradient(135deg,var(--p400),var(--p700))',color:'#fff',fontSize:15,fontWeight:800,cursor:'pointer',boxShadow:'0 8px 32px rgba(98,71,212,.35)',transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:14}}
          onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
          onMouseLeave={e=>e.currentTarget.style.transform='none'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start the 15-Question Test
        </button>
        <div style={{textAlign:'center',fontSize:12,color:'var(--muted)'}}>Takes ~4 minutes · No sign-up required · Free forever</div>
      </div>
    </div>
  );

  /* ── RESULTS SCREEN ── */
  if(stage==='results') return(
    <div style={{flex:1,overflow:'auto'}}>
      <div style={{maxWidth:780,margin:'0 auto',padding:'48px 28px 64px'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{width:88,height:88,borderRadius:26,background:'linear-gradient(135deg,var(--p100),var(--p50))',border:'2px solid var(--p200)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 22px',boxShadow:'0 8px 28px rgba(98,71,212,.12)'}}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--p500)" strokeWidth="1.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div style={{fontFamily:'var(--serif)',fontSize:'clamp(24px,3.5vw,32px)',fontWeight:800,color:'var(--ink)',letterSpacing:-.8,marginBottom:8}}>Your Top Career Matches</div>
          <div style={{fontSize:14,color:'var(--muted)'}}>Based on your answers, here are the roles where you'll thrive most.</div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:28}}>
          {RESULTS.map((r,i)=>(
            <div key={r.role} style={{display:'flex',alignItems:'center',gap:20,padding:'22px 26px',background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:20,transition:'all .22s',boxShadow:'0 2px 12px rgba(98,71,212,.04)',cursor:'default'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 36px rgba(98,71,212,.1)';e.currentTarget.style.borderColor='var(--p200)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 2px 12px rgba(98,71,212,.04)';e.currentTarget.style.borderColor='var(--faint)'}}>
              <div style={{width:56,height:56,borderRadius:16,background:r.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <RoleIcon path={r.path} color={r.color} size={24}/>
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div>
                    <div style={{fontFamily:'var(--serif)',fontWeight:800,fontSize:16,color:'var(--ink)',letterSpacing:-.3}}>{r.role}</div>
                    <div style={{fontSize:11,fontWeight:700,color:r.color,marginTop:2}}>#{i+1} match</div>
                  </div>
                  <span style={{fontFamily:'var(--serif)',fontSize:24,fontWeight:900,color:r.color}}>{r.match}%</span>
                </div>
                <div style={{marginBottom:10}}><ProgressBar value={r.match}/></div>
                <div style={{fontSize:12.5,color:'var(--muted)',lineHeight:1.65}}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{padding:'22px 26px',borderRadius:20,background:'var(--p25)',border:'1.5px solid var(--p100)',marginBottom:28}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--p500)',marginBottom:10}}>What this means for you</div>
          <p style={{fontSize:13.5,color:'var(--ink)',lineHeight:1.8}}>Your responses show a strong analytical and technical orientation with an entrepreneurial mindset. You're drawn to hard problems and prefer deep, independent work — aligning strongly with AI/ML and senior engineering roles. Target companies at the intersection of research and product.</p>
        </div>

        <div style={{display:'flex',gap:12}}>
          <button onClick={()=>toast('Navigating to matched jobs…')} style={{padding:'12px 26px',borderRadius:50,border:'none',background:'linear-gradient(135deg,var(--p400),var(--p700))',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 6px 22px rgba(98,71,212,.35)',display:'flex',alignItems:'center',gap:8}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
            Browse Matched Jobs
          </button>
          <button className="btn btn-outline" onClick={reset}>Retake Test</button>
        </div>
      </div>
    </div>
  );

  /* ── QUESTION SCREEN ── */
  const q=QS[idx];
  const pct=(idx/QS.length)*100;
  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Top progress header */}
      <div style={{flexShrink:0,padding:'18px 24px 0',background:'var(--bg)'}}>
        <div style={{maxWidth:680,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{fontSize:12.5,fontWeight:700,color:'var(--muted)'}}>{idx+1} of {QS.length}</div>
            <button onClick={reset} style={{fontSize:11.5,fontWeight:700,color:'var(--muted)',background:'transparent',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:5,transition:'color .15s'}}
              onMouseEnter={e=>e.currentTarget.style.color='var(--p500)'}
              onMouseLeave={e=>e.currentTarget.style.color='var(--muted)'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12a9 9 0 109-9M3 3v6h6"/></svg>
              Start over
            </button>
          </div>
          <ProgressBar value={pct}/>
        </div>
      </div>

      {/* Question content — scrollable */}
      <div style={{flex:1,overflow:'auto',display:'flex',alignItems:'center',justifyContent:'center',padding:'32px 24px'}}>
        <div style={{maxWidth:680,width:'100%'}}>
          {/* Badge */}
          <div style={{marginBottom:14}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 14px',borderRadius:50,fontSize:10,fontWeight:800,letterSpacing:.8,background:'var(--p100)',color:'var(--p700)'}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--p500)" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              {q.badge}
            </span>
          </div>

          <div style={{fontFamily:'var(--serif)',fontSize:'clamp(20px,2.8vw,28px)',fontWeight:800,color:'var(--ink)',letterSpacing:-.6,lineHeight:1.25,marginBottom:32}}>{q.q}</div>

          {/* Answer options */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {q.opts.map((opt,oi)=>{
              const isSel=selected===opt;
              return(
                <button key={opt} onClick={()=>pick(opt)} style={{padding:'20px 22px',borderRadius:18,border:`2px solid ${isSel?'var(--p500)':'var(--faint)'}`,background:isSel?'var(--p50)':'var(--surface)',textAlign:'left',cursor:'pointer',transition:'all .18s',transform:isSel?'scale(.98)':'none',boxShadow:isSel?'0 4px 18px rgba(98,71,212,.18)':'0 2px 8px rgba(98,71,212,.03)',display:'flex',alignItems:'center',gap:14}}
                  onMouseEnter={e=>{if(!isSel){e.currentTarget.style.borderColor='var(--p300)';e.currentTarget.style.background='var(--p25)';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(98,71,212,.1)';}}}
                  onMouseLeave={e=>{if(!isSel){e.currentTarget.style.borderColor='var(--faint)';e.currentTarget.style.background='var(--surface)';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 2px 8px rgba(98,71,212,.03)';}}}
                >
                  {/* Radio indicator */}
                  <div style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${isSel?'var(--p500)':'var(--faint)'}`,background:isSel?'var(--p500)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .18s'}}>
                    {isSel&&<div style={{width:8,height:8,borderRadius:'50%',background:'#fff'}}/>}
                  </div>
                  <span style={{fontSize:13.5,fontWeight:600,color:isSel?'var(--p700)':'var(--ink)',lineHeight:1.4,flex:1}}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
