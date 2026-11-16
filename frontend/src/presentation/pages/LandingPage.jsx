import React, { useState, useEffect, useRef } from 'react';

/* ─── Data ─────────────────────────────────── */
const CO_C={'AstroAI':'#5c35d4','Stripe':'#635BFF','Mistral AI':'#059669','Vercel':'#111827','Deel':'#dc2626','OpenAI':'#059669','HuggingFace':'#d97706','Notion':'#111827','Alan':'#0891b2','Linear':'#5B6AD0','GitHub':'#24292e','Canva':'#7c3aed'};
const COMPANIES=['Stripe','AstroAI','Mistral AI','Vercel','Deel','OpenAI','HuggingFace','Notion','Alan','Linear','GitHub','Canva'];

const ALL_JOBS=[
  {id:1,co:'AstroAI',  title:'AI Engineer',           loc:'San Francisco · Remote', salary:'$140–170k',match:96,type:'Full-time',days:'3d', cat:'Technology',  desc:'Build and deploy production ML models at scale. Work on LLM fine-tuning, RAG pipelines, and AI infrastructure.'},
  {id:2,co:'Stripe',   title:'Product Manager',        loc:'Paris, France',          salary:'€95–120k', match:88,type:'CDI',       days:'5d', cat:'Product',     desc:'Lead product strategy for Stripe\'s payment APIs. Work closely with engineering, design, and growth teams.'},
  {id:3,co:'Mistral AI',title:'ML Researcher',         loc:'Paris, France',          salary:'€130–180k',match:91,type:'Full-time',days:'1w', cat:'Technology',  desc:'Research and develop next-gen language models. Publish papers, run experiments, push the frontier.'},
  {id:4,co:'Vercel',   title:'Frontend Engineer',      loc:'Remote',                 salary:'$130–155k',match:83,type:'Full-time',days:'4d', cat:'Technology',  desc:'Build the future of web development tooling. Work on Next.js, Turbopack, and the Vercel platform.'},
  {id:5,co:'Deel',     title:'Senior Backend Engineer',loc:'Remote',                 salary:'$145–175k',match:79,type:'Full-time',days:'6d', cat:'Engineering', desc:'Scale payments infrastructure for 35,000+ companies across 150 countries. High-impact distributed systems work.'},
  {id:6,co:'OpenAI',   title:'Research Engineer',      loc:'San Francisco',          salary:'$160–200k',match:85,type:'Full-time',days:'2d', cat:'Technology',  desc:'Work at the frontier of AI research. Implement new architectures, run large-scale training runs, analyze results.'},
  {id:7,co:'HuggingFace',title:'Developer Advocate',  loc:'Remote',                 salary:'$110–140k',match:74,type:'Full-time',days:'3d', cat:'Marketing',   desc:'Build the open-source ML community. Write tutorials, give talks, and help developers get value from the Hub.'},
  {id:8,co:'Notion',   title:'Data Scientist',         loc:'San Francisco',          salary:'$130–160k',match:82,type:'Full-time',days:'5d', cat:'Data Science', desc:'Analyze product data to drive growth decisions. Build ML models for personalization and retention.'},
  {id:9,co:'Alan',     title:'Full-Stack Engineer',    loc:'Paris, France',          salary:'€80–110k', match:77,type:'Full-time',days:'1w', cat:'Technology',  desc:'Build health insurance products used by 500k+ members. Work on both frontend (React) and backend (Python).'},
  {id:10,co:'GitHub',  title:'Engineering Manager',    loc:'Remote',                 salary:'$180–220k',match:71,type:'Full-time',days:'4d', cat:'Engineering', desc:'Lead a team of 6–8 engineers building developer collaboration tools used by 100M+ developers.'},
  {id:11,co:'Linear',  title:'Product Designer',       loc:'Remote',                 salary:'$120–150k',match:80,type:'Full-time',days:'2d', cat:'Design',      desc:'Design intuitive product experiences for the fastest issue tracker on the planet. Work directly with co-founders.'},
  {id:12,co:'Canva',   title:'Growth Marketer',        loc:'Sydney · Remote',        salary:'$95–125k', match:69,type:'Full-time',days:'6d', cat:'Marketing',   desc:'Drive user acquisition and retention at Canva scale. Run experiments, manage paid campaigns, analyze funnels.'},
];

const SALARY_DATA=[
  {role:'AI / ML Engineer',     p25:'$125k',median:'$155k',p75:'$195k',yoy:'+18%',trend:[110,118,125,130,138,145,155]},
  {role:'Product Manager',      p25:'€80k', median:'€100k',p75:'€130k',yoy:'+12%',trend:[75,78,82,86,90,95,100]},
  {role:'ML Researcher',        p25:'€100k',median:'€140k',p75:'€180k',yoy:'+22%',trend:[90,96,104,112,122,132,140]},
  {role:'Frontend Engineer',    p25:'$110k',median:'$140k',p75:'$170k',yoy:'+9%', trend:[105,108,112,118,124,132,140]},
  {role:'Data Scientist',       p25:'$105k',median:'$130k',p75:'$165k',yoy:'+15%',trend:[98,103,108,113,119,125,130]},
  {role:'Engineering Manager',  p25:'$150k',median:'$185k',p75:'$230k',yoy:'+11%',trend:[140,146,153,161,170,178,185]},
  {role:'Full-Stack Developer',  p25:'$95k', median:'$125k',p75:'$160k',yoy:'+10%',trend:[88,92,97,103,110,117,125]},
  {role:'UX / Product Designer', p25:'$90k', median:'$115k',p75:'$145k',yoy:'+8%', trend:[84,87,91,96,102,108,115]},
];

const FAQS=[
  {q:'Is Hired free to use?',a:'Yes — job searching, AI matching, and basic CV analysis are completely free. Pro features like unlimited applications, advanced salary AI, and interview coaching are available on the Pro plan at $19/month.'},
  {q:'How does the AI matching work?',a:'Our AI analyzes your skills, experience, salary expectations, and work preferences against 42,000+ live job descriptions. It scores each job 0–100% for fit and explains why. The more profile data you add, the more accurate your matches become.'},
  {q:'What is the ATS score and how do I improve it?',a:'ATS (Applicant Tracking System) score measures how well your CV will pass automated screening filters before a human ever sees it. Our optimizer rewrites sections to include relevant keywords, fix formatting, and improve readability. Most users go from 60% to 90%+ after one optimization.'},
  {q:'Can I practice interviews before the real thing?',a:'Yes. Our AI Interview Coach simulates real interviews in text, voice, or video format. It asks questions tailored to the role and seniority level, scores your answers using STAR methodology, and gives detailed feedback on communication, conciseness, and confidence.'},
  {q:'How accurate is the salary data?',a:'We aggregate data from 500,000+ salary reports, job postings, and offer letters across 150 countries, updated monthly. You can filter by role, location, experience level, and company size to get highly specific benchmarks.'},
  {q:'Is my data private?',a:'Your profile, applications, and CV are completely private by default. We never share your data with employers without your explicit consent. You can export or delete your data at any time from Account Settings.'},
];

const CATS=[
  {n:'Technology', c:'2,341',color:'#6247d4',bg:'#f0ecff',path:'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'},
  {n:'Data Science',c:'987',color:'#0891b2',bg:'#e0f7fa',path:'M18 20V10M12 20V4M6 20v-6'},
  {n:'Design',     c:'1,205',color:'#db2777',bg:'#fce7f3',path:'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z'},
  {n:'Engineering',c:'3,211',color:'#059669',bg:'#d1fae5',path:'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z'},
  {n:'Finance',    c:'876',color:'#d97706',bg:'#fef3c7',path:'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'},
  {n:'Product',    c:'654',color:'#7c3aed',bg:'#ede9fe',path:'M22 12h-4M6 12H2M12 6V2M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83'},
  {n:'Marketing',  c:'1,456',color:'#dc2626',bg:'#fee2e2',path:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'},
  {n:'Operations', c:'432',color:'#0e7490',bg:'#cffafe',path:'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18'},
];

const HOW=[
  {n:'01',t:'Build Your Profile',d:'Set your skills, experience, salary expectations and location preferences in under 3 minutes.',path:'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z'},
  {n:'02',t:'AI Matches You',d:'Our engine scores 42k+ live jobs against your exact profile and ranks them by fit — not just keywords.',path:'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'},
  {n:'03',t:'Apply Confidently',d:'Optimize your CV, generate tailored cover letters, and practice the interview — all before you hit send.',path:'M9 12l2 2 4-4M7 2H4a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2V9z'},
  {n:'04',t:'Land the Offer',d:'Negotiate with live salary benchmarks and AI-generated counter-offer scripts. Know your worth.',path:'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'},
];

const TESTIS=[
  {q:'The AI match score was spot-on. I only applied to 4 jobs — 3 got back to me. Hired as AI Engineer in 3 weeks.',name:'Mehdi L.',role:'AI Engineer, AstroAI',badge:'Hired in 3 weeks',av:'ML',color:'#5c35d4'},
  {q:'90% match score landed me a 40% salary bump. The negotiation script alone was worth every cent.',name:'Camille B.',role:'Product Manager, Stripe',badge:'+40% salary',av:'CB',color:'#635BFF'},
  {q:'Went from 58% ATS score to 94% after one CV optimization pass. Started getting callbacks the same week.',name:'Priya K.',role:'ML Researcher, Mistral AI',badge:'+$22k negotiated',av:'PK',color:'#059669'},
];

/* ─── Tiny helpers ─────────────────────────────────── */
function Co({name,size=42}){
  const c=CO_C[name]||'#6247d4';
  return <div style={{width:size,height:size,borderRadius:Math.round(size*.24),background:c,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--serif)',fontSize:Math.floor(size*.33),fontWeight:800,color:'#fff',flexShrink:0}}>{name.slice(0,2).toUpperCase()}</div>;
}

function Svg({d,size=18,stroke='currentColor',sw=2,fill='none'}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
}

function MiniSparkline({data,color='var(--p400)'}){
  const w=80,h=28;
  const mx=Math.max(...data),mn=Math.min(...data);
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-mn)/(mx-mn||1))*(h-4)-2}`).join(' ');
  return(
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r="3" fill={color}/>
    </svg>
  );
}

/* ─── Robot ─────────────────────────────────── */
function Robot(){
  return(
    <div style={{position:'relative',width:310,height:350,margin:'0 auto'}}>
      <style>{`
        @keyframes rFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-13px)}}
        @keyframes scan{0%{transform:translateY(-55px);opacity:0}20%{opacity:1}80%{opacity:1}100%{transform:translateY(55px);opacity:0}}
        @keyframes aPulse{0%,100%{opacity:.7;r:4}50%{opacity:1;r:7}}
        @keyframes cFlow{0%{stroke-dashoffset:200}100%{stroke-dashoffset:0}}
        @keyframes gPulse{0%,100%{opacity:.25}50%{opacity:.7}}
        .rb{animation:rFloat 4s ease-in-out infinite}
        .sc{animation:scan 3s ease-in-out infinite}
        .ap{animation:aPulse 1.5s ease-in-out infinite}
        .cf{animation:cFlow 3s linear infinite;stroke-dasharray:200}
        .gp{animation:gPulse 2s ease-in-out infinite}
      `}</style>
      <svg width="310" height="350" viewBox="0 0 310 350">
        <ellipse cx="155" cy="332" rx="85" ry="16" fill="rgba(98,71,212,.2)" className="gp"/>
        <g className="rb">
          <line x1="155" y1="38" x2="155" y2="72" stroke="#7c5ce8" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="155" cy="33" r="4" fill="#7c5ce8" className="ap"/>
          <circle cx="155" cy="33" r="9" fill="none" stroke="#7c5ce8" strokeWidth="1.5" opacity=".35" className="ap" style={{animationDelay:'.3s'}}/>
          <rect x="96" y="72" width="118" height="92" rx="22" fill="#1e1040"/>
          <rect x="100" y="76" width="110" height="84" rx="19" fill="#2d1b69"/>
          <rect x="96" y="72" width="118" height="92" rx="22" fill="none" stroke="#6247d4" strokeWidth="1.5" opacity=".55"/>
          <rect x="114" y="96" width="28" height="21" rx="6" fill="#0c0a18"/>
          <rect x="168" y="96" width="28" height="21" rx="6" fill="#0c0a18"/>
          <rect x="116" y="98" width="24" height="17" rx="4" fill="#6247d4" opacity=".9"/>
          <rect x="170" y="98" width="24" height="17" rx="4" fill="#6247d4" opacity=".9"/>
          <rect x="120" y="101" width="7" height="5" rx="2" fill="#c2b0f8" opacity=".9"/>
          <rect x="174" y="101" width="7" height="5" rx="2" fill="#c2b0f8" opacity=".9"/>
          <rect x="112" y="96" width="82" height="3" rx="1" fill="#9b82f0" opacity=".55" className="sc"/>
          <rect x="126" y="135" width="58" height="13" rx="6" fill="#1a1040"/>
          <rect x="128" y="137" width="54" height="9" rx="4" fill="#6247d4" opacity=".45"/>
          {[136,145,155,165,174].map((x,i)=><circle key={i} cx={x} cy="142" r="2" fill="#9b82f0" opacity={.35+i*.12}/>)}
          <rect x="144" y="164" width="22" height="17" rx="5" fill="#2d1b69"/>
          {[149,155,161].map(x=><line key={x} x1={x} y1="167" x2={x} y2="176" stroke="#6247d4" strokeWidth="1.5"/>)}
          <rect x="76" y="181" width="158" height="116" rx="26" fill="#1e1040"/>
          <rect x="80" y="185" width="150" height="108" rx="23" fill="#2d1b69"/>
          <rect x="76" y="181" width="158" height="116" rx="26" fill="none" stroke="#6247d4" strokeWidth="1.5" opacity=".45"/>
          <rect x="100" y="200" width="110" height="68" rx="13" fill="#1a1040"/>
          <rect x="102" y="202" width="106" height="64" rx="11" fill="#0c0a18"/>
          <g opacity=".55">
            <polyline points="112,217 126,217 126,230 146,230" fill="none" stroke="#6247d4" strokeWidth="1.5" strokeLinecap="round" className="cf"/>
            <polyline points="198,217 184,217 184,230 164,230" fill="none" stroke="#9b82f0" strokeWidth="1.5" strokeLinecap="round" className="cf" style={{animationDelay:'1s'}}/>
            <polyline points="112,252 136,252 136,242 158,242" fill="none" stroke="#6247d4" strokeWidth="1.5" strokeLinecap="round" className="cf" style={{animationDelay:'.5s'}}/>
          </g>
          <circle cx="128" cy="224" r="4" fill="#6247d4"/><circle cx="128" cy="224" r="2.5" fill="#c2b0f8"/>
          <circle cx="182" cy="224" r="4" fill="#6247d4"/><circle cx="182" cy="224" r="2.5" fill="#9b82f0" opacity=".8"/>
          <circle cx="155" cy="240" r="14" fill="#6247d4" opacity=".18"/>
          <circle cx="155" cy="240" r="10" fill="#6247d4" opacity=".45"/>
          <circle cx="155" cy="240" r="6" fill="#c2b0f8"/>
          <circle cx="155" cy="240" r="2.5" fill="#fff"/>
          {[0,1,2].map(i=><rect key={i} x="84" y={198+i*15} width="9" height="7" rx="2.5" fill="#6247d4" opacity=".35"/>)}
          {[0,1,2].map(i=><rect key={i} x="217" y={198+i*15} width="9" height="7" rx="2.5" fill="#6247d4" opacity=".35"/>)}
          <rect x="46" y="191" width="32" height="88" rx="15" fill="#2d1b69"/>
          <rect x="48" y="193" width="28" height="84" rx="13" fill="#1e1040"/>
          <rect x="46" y="191" width="32" height="88" rx="15" fill="none" stroke="#6247d4" strokeWidth="1.2" opacity=".35"/>
          <rect x="53" y="263" width="18" height="26" rx="9" fill="#2d1b69"/>
          <rect x="55" y="265" width="14" height="22" rx="7" fill="#6247d4" opacity=".45"/>
          <rect x="232" y="191" width="32" height="88" rx="15" fill="#2d1b69"/>
          <rect x="234" y="193" width="28" height="84" rx="13" fill="#1e1040"/>
          <rect x="232" y="191" width="32" height="88" rx="15" fill="none" stroke="#6247d4" strokeWidth="1.2" opacity=".35"/>
          <rect x="239" y="263" width="18" height="26" rx="9" fill="#2d1b69"/>
          <rect x="241" y="265" width="14" height="22" rx="7" fill="#6247d4" opacity=".45"/>
          <rect x="103" y="297" width="42" height="38" rx="15" fill="#2d1b69"/>
          <rect x="105" y="299" width="38" height="34" rx="13" fill="#1e1040"/>
          <rect x="103" y="297" width="42" height="38" rx="15" fill="none" stroke="#6247d4" strokeWidth="1.2" opacity=".35"/>
          <rect x="165" y="297" width="42" height="38" rx="15" fill="#2d1b69"/>
          <rect x="167" y="299" width="38" height="34" rx="13" fill="#1e1040"/>
          <rect x="165" y="297" width="42" height="38" rx="15" fill="none" stroke="#6247d4" strokeWidth="1.2" opacity=".35"/>
          <rect x="97" y="328" width="54" height="14" rx="7" fill="#2d1b69"/>
          <rect x="99" y="330" width="50" height="10" rx="5" fill="#6247d4" opacity=".38"/>
          <rect x="159" y="328" width="54" height="14" rx="7" fill="#2d1b69"/>
          <rect x="161" y="330" width="50" height="10" rx="5" fill="#6247d4" opacity=".38"/>
        </g>
        {[{x:14,y:105,v:'96%',s:'match',d:'0s'},{x:250,y:90,v:'AI',s:'ready',d:'.6s'},{x:8,y:225,v:'94%',s:'score',d:'1.2s'},{x:256,y:215,v:'42k',s:'jobs',d:'.3s'}].map((c,i)=>(
          <g key={i} style={{animation:'rFloat 4s ease-in-out infinite',animationDelay:c.d}}>
            <rect x={c.x} y={c.y} width="44" height="30" rx="8" fill="#2d1b69" stroke="#6247d4" strokeWidth="1" opacity=".9"/>
            <text x={c.x+22} y={c.y+12} textAnchor="middle" fontSize="11" fontWeight="800" fill="#c2b0f8" fontFamily="'Bricolage Grotesque',sans-serif">{c.v}</text>
            <text x={c.x+22} y={c.y+23} textAnchor="middle" fontSize="8" fill="#6247d4" fontFamily="'DM Sans',sans-serif">{c.s}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ─── Job Modal ─────────────────────────────────── */
function JobModal({job, onClose, onApply}){
  if(!job) return null;
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(15,7,32,.6)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,animation:'fadeIn .2s ease'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:24,padding:32,width:'100%',maxWidth:540,border:'1.5px solid var(--faint)',boxShadow:'0 32px 80px rgba(0,0,0,.3)',animation:'slideUp .25s cubic-bezier(.34,1.56,.64,1)'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:20}}>
          <Co name={job.co} size={52}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:'var(--serif)',fontWeight:800,fontSize:20,color:'var(--ink)',letterSpacing:-.4,marginBottom:4}}>{job.title}</div>
            <div style={{fontSize:13,color:'var(--muted)'}}>{job.co} · {job.loc}</div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:50,background:'var(--faint2)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:18,lineHeight:1}}>×</button>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>
          <span className="badge badge-purple">{job.type}</span>
          <span className="badge badge-green">{job.salary}</span>
          <span className="badge badge-blue">{job.cat}</span>
          <span style={{padding:'3px 9px',borderRadius:50,fontSize:11,fontWeight:700,background:'var(--p100)',color:'var(--p700)'}}>{job.match}% match</span>
        </div>
        <div style={{fontSize:14,color:'var(--muted)',lineHeight:1.8,marginBottom:24,padding:'16px 18px',background:'var(--bg)',borderRadius:14,border:'1px solid var(--faint)'}}>{job.desc}</div>
        <div style={{display:'flex',gap:8,alignItems:'center',fontSize:12,color:'var(--muted)',marginBottom:24}}>
          <Svg d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" size={13} stroke="none" fill="var(--muted)"/>
          {job.loc}
          <span style={{margin:'0 4px',opacity:.4}}>·</span>
          <Svg d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={13} stroke="none" fill="var(--muted)"/>
          Posted {job.days} ago
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onApply} style={{flex:1,padding:'13px',borderRadius:12,border:'none',background:'linear-gradient(135deg,var(--p400),var(--p700))',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 18px rgba(98,71,212,.35)',transition:'all .2s'}}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
            onMouseLeave={e=>e.currentTarget.style.transform='none'}>Apply Now — Create Free Account</button>
          <button onClick={onClose} style={{padding:'13px 18px',borderRadius:12,border:'1.5px solid var(--faint)',background:'transparent',color:'var(--muted)',fontSize:14,fontWeight:600,cursor:'pointer'}}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─────────────────────────────────── */
export default function LandingPage({onSignIn}){
  const [search,  setSearch]  = useState('');
  const [catFilter,setCat]    = useState('All');
  const [scrolled,setScrolled]= useState(false);
  const [theme,   setTheme]   = useState('light');
  const [selJob,  setSelJob]  = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [salRow,  setSalRow]  = useState(0);
  const go = onSignIn;

  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>30);
    window.addEventListener('scroll',h);
    return()=>window.removeEventListener('scroll',h);
  },[]);

  useEffect(()=>{
    document.body.classList.toggle('dark',theme==='dark');
  },[theme]);

  const filteredJobs = ALL_JOBS.filter(j=>{
    const matchCat = catFilter==='All' || j.cat===catFilter;
    const q = search.toLowerCase();
    const matchQ = !q || j.title.toLowerCase().includes(q) || j.co.toLowerCase().includes(q) || j.cat.toLowerCase().includes(q) || j.loc.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const navLinks=[
    {l:'Browse Jobs', action:()=>document.getElementById('jobs-section')?.scrollIntoView({behavior:'smooth'})},
    {l:'Salary Data', action:()=>document.getElementById('salary-section')?.scrollIntoView({behavior:'smooth'})},
    {l:'Blog',        action:()=>document.getElementById('blog-section')?.scrollIntoView({behavior:'smooth'})},
    {l:'How It Works',action:()=>document.getElementById('how-section')?.scrollIntoView({behavior:'smooth'})},
    {l:'FAQ',         action:()=>document.getElementById('faq-section')?.scrollIntoView({behavior:'smooth'})},
  ];

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'var(--sans)',overflowX:'hidden'}}>
      <style>{`
        @keyframes barIn{from{width:0}to{width:var(--bw)}}
        @keyframes cardIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
        @keyframes gradAnim{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes blobF{0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%;transform:translate(0,0)}50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%;transform:translate(14px,-10px)}}
        .hc1{animation:cardIn .65s cubic-bezier(.22,1,.36,1) .05s both}
        .hc2{animation:cardIn .65s cubic-bezier(.22,1,.36,1) .18s both}
        .hc3{animation:cardIn .65s cubic-bezier(.22,1,.36,1) .3s both}
        .hc4{animation:cardIn .65s cubic-bezier(.22,1,.36,1) .42s both}
        .nav-blur{backdrop-filter:blur(20px)!important;background:rgba(250,249,255,.9)!important;box-shadow:0 1px 24px rgba(98,71,212,.09)!important}
        body.dark .nav-blur{background:rgba(12,10,24,.9)!important}
        .jcard{transition:all .18s!important;cursor:pointer}
        .jcard:hover{border-color:var(--p300)!important;transform:translateY(-2px)!important;box-shadow:0 10px 32px rgba(98,71,212,.11)!important}
        .faq-btn:hover{background:var(--p25)!important}
        .sal-row{transition:background .15s;cursor:pointer}
        .sal-row:hover{background:var(--p25)!important}
        .sal-row.active-sal{background:var(--p50)!important}
        .feature-card{transition:all .2s}
        .feature-card:hover{transform:translateY(-3px)!important;box-shadow:0 12px 36px rgba(98,71,212,.11)!important;border-color:var(--p200)!important}
      `}</style>

      {selJob && <JobModal job={selJob} onClose={()=>setSelJob(null)} onApply={()=>{setSelJob(null);go();}}/>}

      {/* ── NAV ── */}
      <nav className={scrolled?'nav-blur':''} style={{height:64,position:'sticky',top:0,zIndex:300,display:'flex',alignItems:'center',padding:'0 52px',background:'rgba(250,249,255,.6)',borderBottom:'1px solid rgba(98,71,212,.08)',justifyContent:'space-between',transition:'all .3s'}}>
        <div style={{fontFamily:'var(--serif)',fontSize:24,fontWeight:800,color:'var(--p600)',letterSpacing:-1.2,userSelect:'none'}}>Hired<span style={{color:'var(--p400)',fontSize:28}}>.</span></div>
        <div style={{display:'flex',gap:2}}>
          {navLinks.map(({l,action})=>(
            <button key={l} onClick={action} style={{padding:'6px 14px',borderRadius:8,fontSize:13,fontWeight:600,color:'var(--muted)',border:'none',background:'none',cursor:'pointer',transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.color='var(--p600)';e.currentTarget.style.background='var(--p50)'}}
              onMouseLeave={e=>{e.currentTarget.style.color='var(--muted)';e.currentTarget.style.background='none'}}>{l}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>setTheme(t=>t==='light'?'dark':'light')} title={theme==='dark'?'Light mode':'Dark mode'} style={{width:36,height:36,borderRadius:10,border:'1.5px solid var(--faint)',background:'var(--surface)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--p300)';e.currentTarget.style.color='var(--p600)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--faint)';e.currentTarget.style.color='var(--muted)'}}>
            {theme==='dark'
              ? <Svg d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 100-10 5 5 0 000 10z" size={15}/>
              : <Svg d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" size={15}/>}
          </button>
          <button onClick={go} style={{padding:'7px 18px',borderRadius:50,border:'1.5px solid var(--faint)',background:'transparent',fontSize:13,fontWeight:600,color:'var(--muted)',cursor:'pointer',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--p300)';e.currentTarget.style.color='var(--p600)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--faint)';e.currentTarget.style.color='var(--muted)'}}>Sign In</button>
          <button onClick={go} style={{padding:'8px 20px',borderRadius:50,border:'none',background:'linear-gradient(135deg,var(--p400),var(--p700))',fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer',boxShadow:'0 4px 18px rgba(98,71,212,.4)',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(98,71,212,.45)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 18px rgba(98,71,212,.4)'}}>Get Started Free</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{position:'relative',padding:'80px 52px 0',overflow:'hidden',minHeight:660,background:'var(--bg)'}}>
        <div style={{position:'absolute',top:-80,right:-60,width:480,height:480,background:'radial-gradient(ellipse,rgba(124,92,232,.18) 0%,transparent 70%)',animation:'blobF 12s ease-in-out infinite',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-40,left:-60,width:360,height:360,background:'radial-gradient(ellipse,rgba(194,176,248,.16) 0%,transparent 70%)',animation:'blobF 16s ease-in-out infinite reverse',pointerEvents:'none'}}/>
        <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'1.1fr 1fr',gap:60,alignItems:'center',position:'relative',zIndex:1}}>
          <div>
            <div className="hc1" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',borderRadius:50,background:'linear-gradient(135deg,var(--p100),var(--p50))',border:'1px solid var(--p200)',color:'var(--p700)',fontSize:12,fontWeight:700,marginBottom:26,boxShadow:'0 2px 12px rgba(98,71,212,.15)'}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:'var(--p500)',animation:'pulse 2s ease-in-out infinite'}}/>
              AI-Powered · 42,391 Live Jobs
            </div>
            <h1 className="hc2" style={{fontFamily:'var(--serif)',fontSize:'clamp(44px,5vw,66px)',fontWeight:800,lineHeight:1.05,letterSpacing:-2.5,marginBottom:22,color:'var(--ink)'}}>
              Land your<br/>dream job —<br/>
              <span style={{backgroundImage:'linear-gradient(135deg,var(--p400) 0%,#a855f7 50%,var(--p600) 100%)',backgroundSize:'200% 200%',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',animation:'gradAnim 5s ease infinite'}}>3× faster.</span>
            </h1>
            <p className="hc3" style={{fontSize:16,color:'var(--muted)',lineHeight:1.85,maxWidth:460,marginBottom:34}}>AI-powered matching, CV optimization, interview coaching, and salary intelligence — all in one platform.</p>
            {/* Search bar */}
            <div className="hc4" style={{background:'var(--surface)',border:'2px solid var(--faint)',borderRadius:20,padding:'8px 8px 8px 22px',display:'flex',alignItems:'center',gap:10,maxWidth:560,boxShadow:'0 8px 48px rgba(98,71,212,.1)',marginBottom:18,transition:'border-color .2s'}}
              onFocusCapture={e=>e.currentTarget.style.borderColor='var(--p300)'}
              onBlurCapture={e=>e.currentTarget.style.borderColor='var(--faint)'}>
              <Svg d="M21 21l-4.35-4.35M11 19A8 8 0 103 11a8 8 0 008 8z" size={17} stroke="var(--p400)"/>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter') document.getElementById('jobs-section')?.scrollIntoView({behavior:'smooth'})}}
                placeholder="Role, skill, or keyword…"
                style={{flex:1,border:'none',outline:'none',fontSize:15,color:'var(--ink)',background:'none'}}/>
              <div style={{width:1,height:26,background:'var(--faint)'}}/>
              <select style={{border:'none',outline:'none',fontSize:13,color:'var(--muted)',background:'none',cursor:'pointer',fontWeight:500,padding:'4px 8px'}}>
                <option>Casablanca</option><option>Remote</option><option>Paris</option><option>San Francisco</option>
              </select>
              <button onClick={()=>document.getElementById('jobs-section')?.scrollIntoView({behavior:'smooth'})} style={{padding:'12px 22px',background:'linear-gradient(135deg,var(--p400),var(--p700))',color:'#fff',border:'none',borderRadius:14,fontSize:14,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',boxShadow:'0 4px 16px rgba(98,71,212,.4)',transition:'all .2s'}}
                onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04)'}
                onMouseLeave={e=>e.currentTarget.style.transform='none'}>Search</button>
            </div>
            <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:28,alignItems:'center'}}>
              <span style={{fontSize:12,fontWeight:600,color:'var(--muted)'}}>Trending:</span>
              {['AI Engineer','Product Manager','Remote','Senior'].map(t=>(
                <button key={t} onClick={()=>{setSearch(t);document.getElementById('jobs-section')?.scrollIntoView({behavior:'smooth'});}} style={{padding:'5px 13px',background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:50,fontSize:12,fontWeight:600,color:'var(--muted)',cursor:'pointer',transition:'all .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--p300)';e.currentTarget.style.color='var(--p600)';e.currentTarget.style.background='var(--p50)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--faint)';e.currentTarget.style.color='var(--muted)';e.currentTarget.style.background='var(--surface)'}}>{t}</button>
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{display:'flex'}}>
                {['ML','CB','PK','YD','AH'].map((init,i)=>(
                  <div key={i} style={{width:34,height:34,borderRadius:'50%',background:`linear-gradient(135deg,hsl(${260+i*15},70%,${50+i*4}%),hsl(${275+i*10},65%,${42+i*4}%))`,border:'2.5px solid var(--surface)',marginLeft:i?-10:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#fff'}}>{init}</div>
                ))}
              </div>
              <div style={{fontSize:13,color:'var(--muted)'}}><b style={{color:'var(--ink)',fontWeight:700}}>12,847</b> professionals hired this year</div>
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'center'}}><Robot/></div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{background:'var(--p900)',padding:'13px 0',overflow:'hidden',marginTop:60}}>
        <div style={{display:'flex',width:'max-content',animation:'ticker 28s linear infinite'}}>
          {[...COMPANIES,...COMPANIES].map((c,i)=>(
            <span key={i} style={{padding:'0 30px',fontSize:11.5,fontWeight:700,color:'rgba(255,255,255,.27)',letterSpacing:'.12em',textTransform:'uppercase',whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',gap:12}}>
              <span style={{width:4,height:4,borderRadius:'50%',background:'rgba(155,130,240,.45)',display:'inline-block'}}/>{c}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{background:'var(--p900)',padding:'32px 52px',borderTop:'1px solid rgba(255,255,255,.05)'}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)'}}>
          {[['42,391','Live Jobs'],['8,200+','Companies'],['94%','Match Accuracy'],['3.2×','Faster Hiring']].map(([v,l],i)=>(
            <div key={l} style={{padding:'0 36px',borderRight:i<3?'1px solid rgba(255,255,255,.07)':'none',textAlign:'center'}}>
              <div style={{fontFamily:'var(--serif)',fontSize:36,fontWeight:800,color:'#fff',letterSpacing:-2,marginBottom:4}}>{v}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.4)',fontWeight:500}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── JOB BROWSER ── */}
      <div id="jobs-section" style={{maxWidth:1200,margin:'0 auto',padding:'80px 52px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:28}}>
          <div>
            <div style={{fontFamily:'var(--serif)',fontSize:32,fontWeight:800,color:'var(--ink)',letterSpacing:-1.2,marginBottom:6}}>Browse Live Jobs</div>
            <div style={{fontSize:14,color:'var(--muted)'}}>Click any job to see full details · {filteredJobs.length} results</div>
          </div>
          <div style={{display:'flex',gap:7,alignItems:'center',fontSize:13,color:'var(--muted)',fontWeight:600}}>
            <Svg d="M3 6h18M7 12h10M11 18h2" size={14} stroke="var(--muted)"/>
            Filter:
            {['All',...[...new Set(ALL_JOBS.map(j=>j.cat))]].map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{padding:'5px 12px',borderRadius:50,fontSize:12,fontWeight:700,border:`1.5px solid ${catFilter===c?'var(--p500)':'var(--faint)'}`,color:catFilter===c?'var(--p600)':'var(--muted)',background:catFilter===c?'var(--p100)':'transparent',cursor:'pointer',transition:'all .15s'}}>{c}</button>
            ))}
          </div>
        </div>
        {filteredJobs.length===0?(
          <div style={{textAlign:'center',padding:'60px 0',color:'var(--muted)'}}>
            <Svg d="M21 21l-4.35-4.35M11 19A8 8 0 103 11a8 8 0 008 8z" size={40} stroke="var(--faint)" sw={1}/>
            <div style={{fontSize:16,fontWeight:600,marginTop:16}}>No jobs match "{search}"</div>
            <button onClick={()=>{setSearch('');setCat('All');}} style={{marginTop:12,padding:'8px 20px',borderRadius:50,border:'1.5px solid var(--faint)',background:'transparent',color:'var(--muted)',cursor:'pointer',fontSize:13,fontWeight:600}}>Clear filters</button>
          </div>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {filteredJobs.map(j=>(
              <div key={j.id} onClick={()=>setSelJob(j)} className="jcard" style={{display:'flex',alignItems:'center',gap:16,padding:'18px 20px',background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:18,textAlign:'left',width:'100%',boxShadow:'0 2px 8px rgba(98,71,212,.04)'}}>
                <Co name={j.co} size={48}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:'var(--serif)',fontWeight:800,fontSize:14,color:'var(--ink)',marginBottom:3}}>{j.title}</div>
                  <div style={{fontSize:12,color:'var(--muted)',marginBottom:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.co} · {j.loc}</div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    <span className="badge badge-purple">{j.type}</span>
                    <span className="badge badge-green">{j.salary}</span>
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontFamily:'var(--serif)',fontSize:20,fontWeight:900,color:'var(--p500)',marginBottom:3}}>{j.match}%</div>
                  <div style={{fontSize:10,color:'var(--muted)'}}>{j.days} ago</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{textAlign:'center',marginTop:32}}>
          <button onClick={go} style={{padding:'12px 30px',borderRadius:50,border:'1.5px solid var(--p300)',background:'var(--p50)',color:'var(--p600)',fontSize:14,fontWeight:700,cursor:'pointer',transition:'all .2s',display:'inline-flex',alignItems:'center',gap:8}}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--p100)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--p50)'}}>
            <Svg d="M21 21l-4.35-4.35M11 19A8 8 0 103 11a8 8 0 008 8z" size={15} stroke="var(--p600)"/>
            Browse all 42,391 jobs — Sign up free
          </button>
        </div>
      </div>

      {/* ── SALARY EXPLORER ── */}
      <div id="salary-section" style={{background:'var(--surface)',borderTop:'1px solid var(--faint)',padding:'80px 0'}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'0 52px'}}>
          <div style={{marginBottom:40}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'5px 14px',borderRadius:50,background:'var(--p100)',color:'var(--p700)',fontSize:11,fontWeight:700,letterSpacing:.5,marginBottom:14}}>LIVE SALARY DATA</div>
            <div style={{fontFamily:'var(--serif)',fontSize:32,fontWeight:800,color:'var(--ink)',letterSpacing:-1.2,marginBottom:6}}>Know your worth before you negotiate</div>
            <div style={{fontSize:14,color:'var(--muted)'}}>Market-rate benchmarks for 500+ roles · Updated monthly · Click a row to see the trend</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:28,alignItems:'start'}}>
            {/* Table */}
            <div style={{background:'var(--bg)',border:'1.5px solid var(--faint)',borderRadius:20,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'var(--p25)'}}>
                    {['Role','25th %ile','Median','75th %ile','YoY'].map(h=>(
                      <th key={h} style={{padding:'12px 16px',fontSize:10,fontWeight:800,letterSpacing:1,textTransform:'uppercase',color:'var(--p500)',textAlign:'left',borderBottom:'1.5px solid var(--faint)'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SALARY_DATA.map((r,i)=>(
                    <tr key={i} className={`sal-row${salRow===i?' active-sal':''}`} onClick={()=>setSalRow(i)}
                      style={{borderBottom:'1px solid var(--faint2)',background:salRow===i?'var(--p50)':'transparent'}}>
                      <td style={{padding:'13px 16px',fontFamily:'var(--serif)',fontWeight:700,fontSize:13.5,color:'var(--ink)'}}>{r.role}</td>
                      <td style={{padding:'13px 16px',fontSize:13,color:'var(--muted)'}}>{r.p25}</td>
                      <td style={{padding:'13px 16px',fontFamily:'var(--serif)',fontWeight:800,fontSize:15,color:'var(--p600)'}}>{r.median}</td>
                      <td style={{padding:'13px 16px',fontSize:13,color:'var(--muted)'}}>{r.p75}</td>
                      <td style={{padding:'13px 16px'}}><span className="badge badge-green">{r.yoy}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Detail card */}
            <div style={{background:'var(--bg)',border:'1.5px solid var(--p200)',borderRadius:20,padding:28,position:'sticky',top:80}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                <div style={{width:40,height:40,borderRadius:12,background:'var(--p100)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Svg d="M18 20V10M12 20V4M6 20v-6" size={20} stroke="var(--p600)"/>
                </div>
                <div>
                  <div style={{fontFamily:'var(--serif)',fontWeight:800,fontSize:15,color:'var(--ink)',letterSpacing:-.3}}>{SALARY_DATA[salRow].role}</div>
                  <div style={{fontSize:11,color:'var(--muted)',marginTop:1}}>12-month trend</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:22}}>
                {[['25th %ile',SALARY_DATA[salRow].p25,'var(--muted)'],['Median',SALARY_DATA[salRow].median,'var(--p600)'],['75th %ile',SALARY_DATA[salRow].p75,'var(--muted)']].map(([l,v,c])=>(
                  <div key={l} style={{padding:'12px',borderRadius:12,background:'var(--surface)',border:'1px solid var(--faint)',textAlign:'center'}}>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{l}</div>
                    <div style={{fontFamily:'var(--serif)',fontWeight:800,fontSize:15,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:16}}>
                <MiniSparkline data={SALARY_DATA[salRow].trend} color="var(--p500)"/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--muted)',marginBottom:20}}>
                <span>12 months ago</span>
                <span style={{color:'var(--green)',fontWeight:700}}>{SALARY_DATA[salRow].yoy} YoY</span>
                <span>Today</span>
              </div>
              <button onClick={go} style={{width:'100%',padding:'11px',borderRadius:12,border:'none',background:'linear-gradient(135deg,var(--p400),var(--p700))',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(98,71,212,.3)',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                <Svg d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" size={14} stroke="#fff"/>
                See full salary report →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{maxWidth:1200,margin:'0 auto',padding:'80px 52px'}}>
        <div style={{textAlign:'center',marginBottom:52}}>
          <div style={{fontFamily:'var(--serif)',fontSize:32,fontWeight:800,color:'var(--ink)',letterSpacing:-1.2,marginBottom:8}}>Everything you need to get hired</div>
          <div style={{fontSize:14,color:'var(--muted)',maxWidth:420,margin:'0 auto',lineHeight:1.7}}>One platform. All the tools. Zero friction.</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18}}>
          {[
            {path:'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',title:'AI Job Matching',desc:'Scans 42k+ jobs and ranks each one by your fit score — accounting for skills, salary, location and culture.',color:'var(--p600)',bg:'var(--p50)'},
            {path:'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',title:'CV Optimizer',desc:'Boost your ATS pass rate from ~60% to 90%+ with keyword optimization and formatting fixes.',color:'#0891b2',bg:'#e0f7fa'},
            {path:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',title:'Interview Coach',desc:'AI simulates real interviews in text, voice, or video. Get STAR scoring and feedback on every answer.',color:'#059669',bg:'#d1fae5'},
            {path:'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',title:'Salary Intelligence',desc:'Live benchmarks for 500+ roles across 150 countries. Know exactly what to ask before you negotiate.',color:'#d97706',bg:'#fef3c7'},
            {path:'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',title:'Application Tracker',desc:'Kanban pipeline for every application. One place for statuses, contacts, notes and next steps.',color:'#7c3aed',bg:'#ede9fe'},
            {path:'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',title:'Job Map',desc:'Visualize your applications on a world map. See salary clusters, remote hubs, and top hiring cities.',color:'#dc2626',bg:'#fee2e2'},
          ].map(f=>(
            <div key={f.title} className="feature-card" style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:22,padding:'26px 24px',boxShadow:'0 2px 10px rgba(98,71,212,.04)',cursor:'default'}}>
              <div style={{width:50,height:50,borderRadius:14,background:f.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
                <Svg d={f.path} size={22} stroke={f.color}/>
              </div>
              <div style={{fontFamily:'var(--serif)',fontSize:15,fontWeight:800,color:'var(--ink)',marginBottom:8,letterSpacing:-.2}}>{f.title}</div>
              <div style={{fontSize:13,color:'var(--muted)',lineHeight:1.75}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="how-section" style={{background:'var(--p900)',padding:'88px 52px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-200,left:'50%',transform:'translateX(-50%)',width:900,height:500,background:'radial-gradient(ellipse,rgba(124,92,232,.2) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <div style={{maxWidth:1100,margin:'0 auto',position:'relative',zIndex:1}}>
          <div style={{textAlign:'center',marginBottom:64}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'5px 16px',borderRadius:50,background:'rgba(155,130,240,.1)',border:'1px solid rgba(155,130,240,.18)',color:'var(--p300)',fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:20}}>HOW IT WORKS</div>
            <div style={{fontFamily:'var(--serif)',fontSize:34,fontWeight:800,color:'#fff',letterSpacing:-1.5,marginBottom:12}}>Get hired in 4 steps</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,position:'relative'}}>
            <div style={{position:'absolute',top:50,left:'12.5%',right:'12.5%',height:1,background:'linear-gradient(90deg,transparent,rgba(155,130,240,.3),transparent)',zIndex:0}}/>
            {HOW.map((h,i)=>(
              <div key={h.n} style={{textAlign:'center',padding:'0 16px',position:'relative',zIndex:1}}>
                <div style={{width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,.04)',border:'1px solid rgba(155,130,240,.15)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 22px',boxShadow:'0 0 0 10px rgba(124,92,232,.04)'}}>
                  <div style={{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,var(--p400),var(--p700))',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 28px rgba(98,71,212,.5)'}}>
                    <Svg d={h.path} size={28} stroke="#fff" sw={1.5}/>
                  </div>
                </div>
                <div style={{fontFamily:'var(--serif)',fontWeight:800,fontSize:15,color:'#fff',marginBottom:6}}>{h.t}</div>
                <div style={{fontSize:12.5,color:'rgba(255,255,255,.38)',lineHeight:1.7}}>{h.d}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:56}}>
            <button onClick={go} style={{padding:'14px 36px',borderRadius:50,border:'1.5px solid rgba(255,255,255,.18)',background:'rgba(255,255,255,.08)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.14)';e.currentTarget.style.borderColor='rgba(255,255,255,.3)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.08)';e.currentTarget.style.borderColor='rgba(255,255,255,.18)'}}>Start for Free — No credit card required</button>
          </div>
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <div style={{background:'var(--surface)',borderTop:'1px solid var(--faint)',padding:'80px 0'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 52px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:32}}>
            <div>
              <div style={{fontFamily:'var(--serif)',fontSize:30,fontWeight:800,color:'var(--ink)',letterSpacing:-1.2,marginBottom:6}}>Browse by Category</div>
              <div style={{fontSize:14,color:'var(--muted)'}}>Every industry, one platform</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
            {CATS.map(c=>(
              <button key={c.n} onClick={()=>{setCat(c.n);document.getElementById('jobs-section')?.scrollIntoView({behavior:'smooth'});}} style={{background:'var(--bg)',border:'1.5px solid var(--faint)',borderRadius:18,padding:'20px 18px',cursor:'pointer',textAlign:'left',width:'100%',transition:'all .2s',boxShadow:'0 2px 8px rgba(98,71,212,.04)'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 10px 30px rgba(98,71,212,.12)';e.currentTarget.style.borderColor=c.color+'55'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 2px 8px rgba(98,71,212,.04)';e.currentTarget.style.borderColor='var(--faint)'}}>
                <div style={{width:48,height:48,borderRadius:14,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>
                  <Svg d={c.path} size={22} stroke={c.color}/>
                </div>
                <div style={{fontFamily:'var(--serif)',fontSize:14,fontWeight:700,color:'var(--ink)',marginBottom:3}}>{c.n}</div>
                <div style={{fontSize:12,color:'var(--muted)'}}>{c.c} open roles</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div style={{maxWidth:1100,margin:'0 auto',padding:'80px 52px'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontFamily:'var(--serif)',fontSize:32,fontWeight:800,color:'var(--ink)',letterSpacing:-1.2,marginBottom:8}}>Real results, real people</div>
          <div style={{fontSize:14,color:'var(--muted)'}}>Join 12,847 professionals who landed their dream roles</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:22}}>
          {TESTIS.map((t,i)=>(
            <div key={i} style={{padding:28,borderRadius:22,border:'1.5px solid var(--faint)',background:'var(--surface)',display:'flex',flexDirection:'column',gap:18,transition:'all .22s',boxShadow:'0 4px 20px rgba(98,71,212,.05)',cursor:'default'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 16px 48px rgba(98,71,212,.1)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 20px rgba(98,71,212,.05)'}}>
              <div style={{display:'flex',gap:2.5}}>{[1,2,3,4,5].map(s=><svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
              <p style={{fontSize:14.5,color:'var(--ink)',lineHeight:1.8,flex:1,fontStyle:'italic'}}>"{t.q}"</p>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:14,borderTop:'1px solid var(--faint)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:38,height:38,borderRadius:'50%',background:`linear-gradient(135deg,${t.color},${t.color}cc)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff'}}>{t.av}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:'var(--ink)'}}>{t.name}</div>
                    <div style={{fontSize:11,color:'var(--muted)',marginTop:1}}>{t.role}</div>
                  </div>
                </div>
                <span className="badge badge-green">{t.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BLOG ── */}
      <div id="blog-section" style={{background:'var(--surface)',borderTop:'1px solid var(--faint)',padding:'80px 0'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 52px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:40}}>
            <div>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'5px 14px',borderRadius:50,background:'var(--p100)',color:'var(--p700)',fontSize:11,fontWeight:700,letterSpacing:.5,marginBottom:14}}>CAREER RESOURCES</div>
              <div style={{fontFamily:'var(--serif)',fontSize:32,fontWeight:800,color:'var(--ink)',letterSpacing:-1.2,marginBottom:6}}>From the Hired. Blog</div>
              <div style={{fontSize:14,color:'var(--muted)'}}>Guides, salary data, and career advice — updated weekly</div>
            </div>
            <button onClick={go} style={{padding:'10px 22px',borderRadius:50,border:'1.5px solid var(--p300)',background:'var(--p50)',color:'var(--p600)',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .2s',whiteSpace:'nowrap'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--p100)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--p50)'}>View all articles →</button>
          </div>

          {/* Featured post */}
          <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:20,marginBottom:20}}>
            <div style={{borderRadius:24,overflow:'hidden',border:'1.5px solid var(--faint)',background:'var(--bg)',cursor:'pointer',transition:'all .22s'}}
              onClick={go}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 16px 48px rgba(98,71,212,.1)';e.currentTarget.style.borderColor='var(--p200)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='var(--faint)';}}>
              {/* Cover */}
              <div style={{height:220,background:'linear-gradient(135deg,#1e1040 0%,#4f31b9 60%,#7c5ce8 100%)',position:'relative',overflow:'hidden',display:'flex',alignItems:'flex-end',padding:28}}>
                <div style={{position:'absolute',top:-40,right:-40,width:200,height:200,background:'rgba(255,255,255,.06)',borderRadius:'50%'}}/>
                <div style={{position:'absolute',bottom:-60,left:-20,width:160,height:160,background:'rgba(255,255,255,.04)',borderRadius:'50%'}}/>
                <div style={{position:'relative',zIndex:1}}>
                  <span style={{display:'inline-flex',padding:'4px 12px',borderRadius:50,background:'rgba(255,255,255,.15)',color:'#fff',fontSize:11,fontWeight:700,marginBottom:10}}>Featured</span>
                  <div style={{fontFamily:'var(--serif)',fontSize:22,fontWeight:800,color:'#fff',lineHeight:1.3,letterSpacing:-.4}}>How to Land a Tech Job in 2026: The Complete Guide</div>
                </div>
              </div>
              <div style={{padding:'22px 26px'}}>
                <div style={{fontSize:14,color:'var(--muted)',lineHeight:1.8,marginBottom:18}}>From optimizing your CV for ATS to nailing the system design round — everything you need to get hired at a top tech company this year. We analyzed 10,000+ successful applications to write this guide.</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--p400),var(--p600))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff'}}>HT</div>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--ink)'}}>Hired. Team</div>
                      <div style={{fontSize:11,color:'var(--muted)'}}>Mar 15, 2026 · 12 min read</div>
                    </div>
                  </div>
                  <span className="badge badge-purple">Career Tips</span>
                </div>
              </div>
            </div>

            {/* Right column — 2 smaller posts */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {[
                {title:'Salary Negotiation: How to Get $20k More Without Losing the Offer',cat:'Salary',color:'#d97706',bg:'linear-gradient(135deg,#92400e,#d97706)',mins:8,date:'Mar 12',desc:'The exact scripts and data you need to negotiate confidently. Includes real counter-offer templates used by our users.'},
                {title:'AI vs Human Recruiters: Who Actually Gets Better Results?',cat:'Trends',color:'#059669',bg:'linear-gradient(135deg,#065f46,#059669)',mins:6,date:'Mar 10',desc:'We analyzed 10,000 hiring decisions to find out whether AI-powered matching outperforms human recruiters — the results were surprising.'},
              ].map((p,i)=>(
                <div key={i} style={{borderRadius:20,overflow:'hidden',border:'1.5px solid var(--faint)',background:'var(--bg)',cursor:'pointer',transition:'all .22s',flex:1,display:'flex',flexDirection:'column'}}
                  onClick={go}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 32px rgba(98,71,212,.09)';e.currentTarget.style.borderColor='var(--p200)';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='var(--faint)';}}>
                  <div style={{height:80,background:p.bg,position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,background:'rgba(255,255,255,.07)',borderRadius:'50%'}}/>
                    <div style={{position:'absolute',bottom:12,left:18}}>
                      <span style={{display:'inline-flex',padding:'3px 10px',borderRadius:50,background:'rgba(255,255,255,.18)',color:'#fff',fontSize:10,fontWeight:700}}>{p.cat}</span>
                    </div>
                  </div>
                  <div style={{padding:'16px 20px',flex:1,display:'flex',flexDirection:'column'}}>
                    <div style={{fontFamily:'var(--serif)',fontWeight:800,fontSize:14,color:'var(--ink)',lineHeight:1.35,marginBottom:8,letterSpacing:-.2}}>{p.title}</div>
                    <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.65,flex:1}}>{p.desc}</div>
                    <div style={{fontSize:11,color:'var(--muted)',marginTop:12}}>{p.date} · {p.mins} min read</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3 more posts */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {[
              {title:'Remote Work in 2026: The 50 Best Companies Still Hiring Remotely',cat:'Remote',color:'#2563eb',bg:'linear-gradient(135deg,#1e3a8a,#2563eb)',mins:7,date:'Mar 8',desc:'Not every company reversed its remote policy. Here are 50 companies still hiring fully remote — with salaries, perks, and application tips for each.'},
              {title:'CV Writing That Gets Callbacks: The ATS-Proof Format for 2026',cat:'CV Tips',color:'#7c3aed',bg:'linear-gradient(135deg,#4c1d95,#7c3aed)',mins:9,date:'Mar 5',desc:'The exact format, keywords, and sections that get your CV past automated screening — with before/after examples showing a jump from 58% to 94% ATS score.'},
              {title:'How to Ace a System Design Interview: A Senior Engineer\'s Playbook',cat:'Interview',color:'#dc2626',bg:'linear-gradient(135deg,#7f1d1d,#dc2626)',mins:14,date:'Mar 1',desc:'From FAANG to startups, system design is where strong engineers separate themselves. Step-by-step framework with real example answers from successful candidates.'},
            ].map((p,i)=>(
              <div key={i} style={{borderRadius:20,overflow:'hidden',border:'1.5px solid var(--faint)',background:'var(--bg)',cursor:'pointer',transition:'all .22s'}}
                onClick={go}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 12px 36px rgba(98,71,212,.1)';e.currentTarget.style.borderColor='var(--p200)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='var(--faint)';}}>
                <div style={{height:100,background:p.bg,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:-30,right:-30,width:120,height:120,background:'rgba(255,255,255,.06)',borderRadius:'50%'}}/>
                  <div style={{position:'absolute',bottom:12,left:16}}>
                    <span style={{display:'inline-flex',padding:'3px 10px',borderRadius:50,background:'rgba(255,255,255,.18)',color:'#fff',fontSize:10,fontWeight:700}}>{p.cat}</span>
                  </div>
                </div>
                <div style={{padding:'18px 20px'}}>
                  <div style={{fontFamily:'var(--serif)',fontWeight:800,fontSize:13.5,color:'var(--ink)',lineHeight:1.35,marginBottom:8,letterSpacing:-.2}}>{p.title}</div>
                  <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.65,marginBottom:12}}>{p.desc}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontSize:11,color:'var(--muted)'}}>{p.date} · {p.mins} min read</div>
                    <Svg d="M5 12h14M12 5l7 7-7 7" size={14} stroke="var(--p400)"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div id="faq-section" style={{background:'var(--surface)',borderTop:'1px solid var(--faint)',padding:'80px 0'}}>
        <div style={{maxWidth:760,margin:'0 auto',padding:'0 52px'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <div style={{fontFamily:'var(--serif)',fontSize:32,fontWeight:800,color:'var(--ink)',letterSpacing:-1.2,marginBottom:8}}>Frequently asked questions</div>
            <div style={{fontSize:14,color:'var(--muted)'}}>Everything you need to know before getting started</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {FAQS.map((f,i)=>(
              <div key={i} style={{borderRadius:16,border:'1.5px solid var(--faint)',overflow:'hidden',transition:'border-color .2s',borderColor:openFaq===i?'var(--p300)':'var(--faint)'}}>
                <button className="faq-btn" onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',border:'none',background:openFaq===i?'var(--p25)':'var(--surface)',cursor:'pointer',textAlign:'left',transition:'background .15s',gap:16}}>
                  <span style={{fontWeight:700,fontSize:14,color:'var(--ink)',lineHeight:1.4}}>{f.q}</span>
                  <div style={{width:24,height:24,borderRadius:50,background:'var(--faint2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .2s',transform:openFaq===i?'rotate(45deg)':'none'}}>
                    <Svg d="M12 5v14M5 12h14" size={13} stroke="var(--p500)" sw={2.5}/>
                  </div>
                </button>
                {openFaq===i&&(
                  <div style={{padding:'4px 22px 20px',fontSize:14,color:'var(--muted)',lineHeight:1.8,background:'var(--p25)',borderTop:'1px solid var(--faint)'}}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:40}}>
            <div style={{fontSize:14,color:'var(--muted)',marginBottom:14}}>Still have questions?</div>
            <button onClick={go} style={{padding:'11px 28px',borderRadius:50,border:'1.5px solid var(--p300)',background:'var(--p50)',color:'var(--p600)',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .2s',display:'inline-flex',alignItems:'center',gap:8}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--p100)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--p50)'}>
              <Svg d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={14} stroke="var(--p600)"/>
              Chat with us
            </button>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{margin:'0 52px 80px',borderRadius:28,background:'linear-gradient(135deg,var(--p600) 0%,var(--p900) 100%)',padding:'56px 64px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-100,right:60,width:300,height:300,background:'radial-gradient(circle,rgba(255,255,255,.07) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <div style={{fontFamily:'var(--serif)',fontSize:'clamp(24px,3vw,36px)',fontWeight:800,color:'#fff',letterSpacing:-1.2,marginBottom:10}}>Ready to land your dream role?</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,.55)',maxWidth:380,lineHeight:1.75}}>Join thousands of professionals who found their ideal jobs in record time using AI.</div>
        </div>
        <div style={{display:'flex',gap:12,flexShrink:0,position:'relative',zIndex:1,flexDirection:'column',alignItems:'flex-end'}}>
          <button onClick={go} style={{padding:'14px 34px',borderRadius:50,border:'none',background:'#fff',color:'var(--p700)',fontSize:15,fontWeight:800,cursor:'pointer',boxShadow:'0 8px 32px rgba(0,0,0,.25)',transition:'all .2s',whiteSpace:'nowrap'}}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e=>e.currentTarget.style.transform='none'}>Create Free Account</button>
          <div style={{fontSize:12,color:'rgba(255,255,255,.35)'}}>No credit card required · Cancel anytime</div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{background:'var(--p900)',padding:'56px 52px 28px'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:48,marginBottom:48}}>
            <div>
              <div style={{fontFamily:'var(--serif)',fontSize:26,fontWeight:800,color:'#fff',letterSpacing:-1.2,marginBottom:12}}>Hired<span style={{color:'var(--p400)'}}>.</span></div>
              <div style={{fontSize:13,color:'rgba(255,255,255,.32)',lineHeight:1.8,maxWidth:250}}>The AI-powered career platform connecting ambitious talent with world-class opportunities.</div>
            </div>
            {[
              ['Platform',[
                {l:'Browse Jobs',      a:()=>document.getElementById('jobs-section')?.scrollIntoView({behavior:'smooth'})},
                {l:'Salary Insights',  a:()=>document.getElementById('salary-section')?.scrollIntoView({behavior:'smooth'})},
                {l:'Blog',             a:()=>document.getElementById('blog-section')?.scrollIntoView({behavior:'smooth'})},
                {l:'How It Works',     a:()=>document.getElementById('how-section')?.scrollIntoView({behavior:'smooth'})},
                {l:'FAQ',              a:()=>document.getElementById('faq-section')?.scrollIntoView({behavior:'smooth'})},
              ]],
              ['Company',[
                {l:'About Us',   a:go},{l:'Careers',    a:go},{l:'Press',      a:go},{l:'Blog',       a:go},
              ]],
              ['Resources',[
                {l:'Interview Guide',    a:go},{l:'CV Templates',       a:go},{l:'Salary Calculator', a:go},{l:'API Docs',           a:go},
              ]],
            ].map(([title,links])=>(
              <div key={title}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:'rgba(255,255,255,.28)',marginBottom:16}}>{title}</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {links.map(({l,a})=>(
                    <button key={l} onClick={a} style={{fontSize:13,color:'rgba(255,255,255,.48)',cursor:'pointer',transition:'color .15s',background:'none',border:'none',textAlign:'left',fontWeight:500,padding:0}}
                      onMouseEnter={e=>e.currentTarget.style.color='#fff'}
                      onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.48)'}>{l}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,.07)',paddingTop:24,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:12,color:'rgba(255,255,255,.22)'}}>© 2026 Hired. All rights reserved.</div>
            <div style={{display:'flex',gap:20}}>
              {['Privacy','Terms','Status'].map(l=>(
                <button key={l} onClick={go} style={{fontSize:12,color:'rgba(255,255,255,.28)',background:'none',border:'none',cursor:'pointer',transition:'color .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.color='#fff'}
                  onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.28)'}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
