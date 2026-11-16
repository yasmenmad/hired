import React, { useState, useEffect, useRef } from 'react';

/* ─── Helpers ─────────────────────────────── */
const S = { fontFamily:'var(--serif)' };

function Card({ style, children }) {
  return <div style={{ background:'var(--surface)', border:'1.5px solid var(--faint)', borderRadius:18, padding:22, ...style }}>{children}</div>;
}
function PanelTitle({ children, style={} }) {
  return <div style={{ fontSize:10, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:'var(--p500)', marginBottom:14, ...style }}>{children}</div>;
}
function StatusDot({ ok=true }) {
  return <span style={{ width:7, height:7, borderRadius:'50%', background:ok?'var(--green)':'var(--amber)', display:'inline-block', flexShrink:0, animation:ok?'pulse 2.5s ease-in-out infinite':'none' }}/>;
}
function Badge({ color='purple', children }) {
  const map = { purple:'badge-purple', green:'badge-green', amber:'badge-amber', red:'badge-red', blue:'badge-blue', cyan:'badge-cyan', pink:'badge-pink' };
  return <span className={`badge ${map[color]||'badge-purple'}`}>{children}</span>;
}
function SBadge({ s }) {
  const m = { Active:'green', Suspended:'red', Pending:'amber', Featured:'purple', Paused:'blue', Pro:'purple', Free:'blue', Business:'green' };
  return <Badge color={m[s]||'purple'}>{s}</Badge>;
}
function Ic({ d, size=14, stroke='currentColor', sw=2 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
}

/* ─── Charts ─────────────────────────────── */
function BarChart({ data, color='var(--p500)', color2=null, height=100, label=true }) {
  const max = Math.max(...data.map(d=>d.v));
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:5, height }}>
      {data.map((d,i)=>(
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background:`linear-gradient(180deg,${color2||color},${color}99)`, height:`${Math.max((d.v/max)*(height-20),3)}px`, transition:'height .8s ease', cursor:'pointer', position:'relative' }} title={`${d.l}: ${d.v}`}/>
          {label&&<div style={{ fontSize:9, color:'var(--muted)', fontWeight:600, whiteSpace:'nowrap' }}>{d.l}</div>}
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, color='var(--p500)', height=80, filled=true }) {
  const max=Math.max(...data), min=Math.min(...data);
  const w=280, h=height;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/(max-min||1))*(h-8)-4}`);
  const fillPts=`0,${h} ${pts.join(' ')} ${w},${h}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      {filled&&<polygon points={fillPts} fill={color} opacity=".1"/>}
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1].split(',')[0]} cy={pts[pts.length-1].split(',')[1]} r="4" fill={color}/>
    </svg>
  );
}

function AreaStack({ data, height=80 }) {
  const w=280, h=height;
  const maxV=Math.max(...data.map(d=>d.a+d.b));
  const ptsA=data.map((d,i)=>`${(i/(data.length-1))*w},${h-((d.a+d.b)/maxV)*(h-6)-3}`);
  const ptsB=data.map((d,i)=>`${(i/(data.length-1))*w},${h-(d.b/maxV)*(h-6)-3}`);
  const fillA=`0,${h} ${ptsA.join(' ')} ${w},${h}`;
  const fillB=`0,${h} ${ptsB.join(' ')} ${w},${h}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <polygon points={fillA} fill="var(--p400)" opacity=".15"/>
      <polygon points={fillB} fill="var(--blue)" opacity=".15"/>
      <polyline points={ptsA.join(' ')} fill="none" stroke="var(--p400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={ptsB.join(' ')} fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function DonutChart({ pct: p, color='var(--p500)', size=72, label=true }) {
  const r=26, cx=size/2, cy=size/2;
  const circ=2*Math.PI*r;
  const dash=(p/100)*circ;
  return (
    <div style={{ position:'relative', width:size, height:size, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)', position:'absolute' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--faint2)" strokeWidth="7"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition:'stroke-dasharray .8s ease' }}/>
      </svg>
      {label&&<span style={{ fontSize:13, fontWeight:800, color:'var(--ink)', fontFamily:'var(--serif)', position:'relative', zIndex:1 }}>{p}%</span>}
    </div>
  );
}

function GaugeChart({ value, max=100, color='var(--p500)', label='' }) {
  const p=value/max, angle=-130+p*260;
  return (
    <div style={{ position:'relative', width:110, height:66, display:'flex', flexDirection:'column', alignItems:'center' }}>
      <svg width="110" height="70" viewBox="0 0 110 70">
        <path d="M12,65 A43,43 0 0,1 98,65" fill="none" stroke="var(--faint2)" strokeWidth="8" strokeLinecap="round"/>
        <path d="M12,65 A43,43 0 0,1 98,65" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${p*138} 138`} style={{ transition:'stroke-dasharray .8s ease' }}/>
        <line x1="55" y1="65" x2={55+32*Math.cos((angle-90)*Math.PI/180)} y2={65+32*Math.sin((angle-90)*Math.PI/180)} stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="55" cy="65" r="4" fill="var(--ink)"/>
        <text x="55" y="56" textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--p600)" fontFamily="'Bricolage Grotesque',sans-serif">{value}%</text>
      </svg>
      {label&&<div style={{ fontSize:10, color:'var(--muted)', fontWeight:700, marginTop:-4 }}>{label}</div>}
    </div>
  );
}

function FunnelChart({ stages }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {stages.map((s,i)=>(
        <div key={s.l} style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:76, fontSize:11, fontWeight:600, color:'var(--muted)', textAlign:'right', flexShrink:0 }}>{s.l}</div>
          <div style={{ flex:1, position:'relative', height:24, background:'var(--faint2)', borderRadius:6, overflow:'hidden' }}>
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${s.p}%`, background:`hsl(${255-i*25},65%,${50+i*4}%)`, borderRadius:6, transition:'width .9s ease' }}/>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', paddingLeft:10, fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,.95)' }}>{s.v}</div>
          </div>
          <div style={{ width:32, fontSize:10.5, fontWeight:700, color:'var(--muted)', flexShrink:0, textAlign:'right' }}>{s.p}%</div>
        </div>
      ))}
    </div>
  );
}

function HeatMap({ data }) {
  const hours=['12a','3a','6a','9a','12p','3p','6p','9p'];
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const max=Math.max(...data.flat());
  return (
    <div>
      <div style={{ display:'flex', gap:2, marginBottom:4, paddingLeft:28 }}>
        {hours.map(h=><div key={h} style={{ flex:1, fontSize:8, color:'var(--muted)', textAlign:'center' }}>{h}</div>)}
      </div>
      {days.map((d,di)=>(
        <div key={d} style={{ display:'flex', alignItems:'center', gap:2, marginBottom:2 }}>
          <div style={{ width:22, fontSize:9, color:'var(--muted)', fontWeight:600, flexShrink:0 }}>{d}</div>
          {data[di].map((v,hi)=>(
            <div key={hi} style={{ flex:1, height:15, borderRadius:3, background:`rgba(98,71,212,${v/max*.85+.05})`, cursor:'pointer', transition:'opacity .15s' }} title={`${d} ${hours[hi]}: ${v} signups`}
              onMouseEnter={e=>e.currentTarget.style.opacity='.65'}
              onMouseLeave={e=>e.currentTarget.style.opacity='1'}/>
          ))}
        </div>
      ))}
      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:8, justifyContent:'flex-end' }}>
        <span style={{ fontSize:9, color:'var(--muted)' }}>Less</span>
        {[.08,.25,.45,.65,.88].map(o=><div key={o} style={{ width:11, height:11, borderRadius:2, background:`rgba(98,71,212,${o})` }}/>)}
        <span style={{ fontSize:9, color:'var(--muted)' }}>More</span>
      </div>
    </div>
  );
}

function MiniLine({ data, color='var(--p400)', h=36 }) {
  const max=Math.max(...data), min=Math.min(...data);
  const w=80;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/(max-min||1))*(h-6)-3}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r="3" fill={color}/>
    </svg>
  );
}

/* ─── Data ─────────────────────────────────── */
const TICKER=['Yasmine D. accepted offer · AstroAI · AI Engineer · $155k','847 AI matches computed in the last 5 minutes','1,204 new jobs indexed from LinkedIn & Glassdoor','Interview session completed: 94% score · Strong Hire','CV optimized: 62% → 91% ATS score · Karim B.','Platform uptime: 99.9% · API 98ms avg response','New employer signup: Anthropic · Business plan','Salary AI used 34 times in the last hour'];

const KPI=[
  { label:'Total Users',   value:'12,847', delta:'+8.4%', sub:'vs last week',  color:'var(--p500)',  grad:'linear-gradient(135deg,var(--p700),var(--p400))', spark:[30,45,38,55,48,62,70,58,66,74,68,82], icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { label:'Active Jobs',   value:'42,391', delta:'+891',  sub:'new today',     color:'var(--green)', grad:'linear-gradient(135deg,#047857,#059669)',            spark:[50,44,60,55,70,65,80,72,88,79,92,86], icon:'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2' },
  { label:'CVs Optimized', value:'8,234',  delta:'+127',  sub:'today',         color:'var(--amber)', grad:'linear-gradient(135deg,#b45309,#d97706)',            spark:[40,50,45,55,50,60,65,58,70,62,75,68], icon:'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
  { label:'MRR',           value:'$24.8k', delta:'+18%',  sub:'vs last month', color:'var(--blue)',  grad:'linear-gradient(135deg,#1e40af,#2563eb)',            spark:[35,40,50,45,55,60,70,65,78,72,85,80], icon:'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
];

const SIGNUPS_WEEK=[{l:'Mon',v:44},{l:'Tue',v:62},{l:'Wed',v:58},{l:'Thu',v:71},{l:'Fri',v:49},{l:'Sat',v:64},{l:'Sun',v:88}];
const REVENUE_TREND=[18.2,19.8,21.4,20.1,22.8,23.5,24.8];
const MATCH_TREND=[82,85,84,88,86,90,91,89,93,92,94,94];
const OFFER_TREND=[55,58,54,62,60,65,67,66,70,68,72,71];
const AREA_DATA=[
  {a:44,b:18},{a:62,b:25},{a:58,b:22},{a:71,b:30},{a:49,b:19},{a:64,b:27},{a:88,b:35},
];

const FUNNEL=[
  {l:'Visitors',  v:'48,200',p:100},
  {l:'Signups',   v:'12,847',p:26.7},
  {l:'CV Upload', v:'8,234', p:17.1},
  {l:'Applied',   v:'4,120', p:8.5},
  {l:'Interviews',v:'1,340', p:2.8},
  {l:'Offers',    v:'892',   p:1.8},
];

const HEATMAP_DATA=[
  [2,1,0,3,8,15,22,18],[1,0,1,2,6,12,18,14],[3,1,0,4,9,17,24,20],
  [2,1,1,3,7,14,21,17],[5,2,1,6,12,20,28,22],[8,4,2,5,6,8,12,10],[6,3,1,4,5,7,9,7],
];

const GEO=[
  {c:'Morocco', flag:'MA',users:3241,pct:25,color:'var(--p500)'},
  {c:'France',  flag:'FR',users:2890,pct:22,color:'#2563eb'},
  {c:'USA',     flag:'US',users:2456,pct:19,color:'var(--green)'},
  {c:'UAE',     flag:'AE',users:1820,pct:14,color:'var(--amber)'},
  {c:'UK',      flag:'GB',users:1340,pct:10,color:'#dc2626'},
  {c:'Other',   flag:'··',users:1100,pct:10,color:'var(--muted)'},
];

const HEALTH=[
  {l:'API Response',    v:'142ms',    pct:96, ok:true},
  {l:'AI Match Engine', v:'99.1% up', pct:99, ok:true},
  {l:'Database Load',   v:'63%',      pct:63, ok:false},
  {l:'CDN Hit Rate',    v:'98.4%',    pct:98, ok:true},
  {l:'Job Scraper',     v:'Running',  pct:100,ok:true},
  {l:'Email Service',   v:'99.8% up', pct:100,ok:true},
];

const ACTIVITY=[
  {icon:'★', text:'Yasmine D. accepted offer at AstroAI',  sub:'AI Engineer · $155k',           time:'2m',  color:'var(--green)'},
  {icon:'CV',text:'Karim B. CV optimized',                 sub:'62% → 91% ATS score',           time:'4m',  color:'var(--p500)'},
  {icon:'AI',text:'847 new AI matches computed',            sub:'Avg match score: 87%',           time:'8m',  color:'var(--amber)'},
  {icon:'+', text:'Nora El Fassi signed up',               sub:'Candidate · Pro plan',            time:'12m', color:'#2563eb'},
  {icon:'JB',text:'Anthropic posted 3 new roles',          sub:'Senior Engineer ×2, PM ×1',      time:'18m', color:'#dc2626'},
  {icon:'★', text:'Platform rated 5★ by Sara T.',         sub:'"Best career tool I have used"',  time:'31m', color:'var(--green)'},
  {icon:'CV',text:'Mehdi L. interview score: 94%',         sub:'Strong Hire verdict',             time:'44m', color:'var(--p500)'},
  {icon:'$', text:'Salary negotiation: +$22k',             sub:'Priya K. accepted counter-offer', time:'58m', color:'var(--green)'},
];

const USERS=[
  {name:'Yasmine Daoudi', email:'yasmine@email.com', role:'Candidate', status:'Active',    plan:'Pro',      joined:'Nov 12', score:94,  apps:5},
  {name:'Karim Benali',   email:'karim@email.com',   role:'Candidate', status:'Active',    plan:'Free',     joined:'Oct 8',  score:88,  apps:3},
  {name:'Sara Tazi',      email:'sara@email.com',     role:'Employer',  status:'Active',    plan:'Business', joined:'Dec 1',  score:null,apps:null},
  {name:'Ali Hassan',     email:'ali@email.com',      role:'Candidate', status:'Suspended', plan:'Free',     joined:'Sep 20', score:72,  apps:1},
  {name:'Nora El Fassi',  email:'nora@email.com',     role:'Candidate', status:'Pending',   plan:'Pro',      joined:'Jan 15', score:null,apps:0},
  {name:'Mehdi Lahlou',   email:'mehdi@email.com',    role:'Employer',  status:'Active',    plan:'Business', joined:'Feb 3',  score:null,apps:null},
  {name:'Priya Kumar',    email:'priya@email.com',    role:'Candidate', status:'Active',    plan:'Pro',      joined:'Mar 1',  score:91,  apps:7},
  {name:'Thomas M.',      email:'thomas@email.com',   role:'Candidate', status:'Active',    plan:'Free',     joined:'Mar 10', score:76,  apps:2},
];

const JOBS_DATA=[
  {title:'AI Engineer',         company:'AstroAI',    location:'SF · Remote',  salary:'$140–170k',  apps:48, views:1204, posted:'2d', status:'Featured', change:'+12%'},
  {title:'Product Manager',     company:'Stripe',     location:'Paris',         salary:'€95–120k',   apps:31, views:887,  posted:'4d', status:'Active',   change:'+5%'},
  {title:'ML Researcher',       company:'Mistral',    location:'Paris',         salary:'€130–180k',  apps:22, views:743,  posted:'6d', status:'Active',   change:'+8%'},
  {title:'Frontend Engineer',   company:'Vercel',     location:'Remote',        salary:'$130–155k',  apps:19, views:692,  posted:'1w', status:'Paused',   change:'-2%'},
  {title:'Data Engineer',       company:'OCP Group',  location:'Casablanca',    salary:'MAD 30–45k', apps:12, views:421,  posted:'3d', status:'Active',   change:'+3%'},
  {title:'Research Engineer',   company:'OpenAI',     location:'San Francisco', salary:'$160–200k',  apps:61, views:2100, posted:'2d', status:'Featured', change:'+22%'},
  {title:'Engineering Manager', company:'GitHub',     location:'Remote',        salary:'$180–220k',  apps:14, views:590,  posted:'5d', status:'Active',   change:'+6%'},
];

const NAV=[
  {id:'dashboard', l:'Dashboard',    g:'OVERVIEW',    icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'},
  {id:'analytics', l:'Analytics',    g:'OVERVIEW',    icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'},
  {id:'users',     l:'Users',        g:'MANAGEMENT',  icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'},
  {id:'jobs',      l:'Jobs',         g:'MANAGEMENT',  icon:'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2'},
  {id:'reports',   l:'Reports',      g:'MANAGEMENT',  icon:'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'},
  {id:'settings',  l:'Settings',     g:'SYSTEM',      icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'},
  {id:'audit',     l:'Audit Logs',   g:'SYSTEM',      icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'},
  {id:'blog',      l:'Blog Manager', g:'SYSTEM',      icon:'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'},
];

const BLOG_POSTS=[
  {id:1,title:'How to Land a Tech Job in 2026',          slug:'land-tech-job-2026',             status:'Published',  author:'Hired. Team',   date:'Mar 15, 2026',category:'Career Tips',views:14203,excerpt:'The definitive guide to getting hired at top tech companies in 2026.'},
  {id:2,title:'AI vs Human Recruiters: Who Wins?',       slug:'ai-vs-human-recruiters',          status:'Published',  author:'Hired. Team',   date:'Mar 10, 2026',category:'Trends',    views:11876,excerpt:'We analyzed 10,000 hiring decisions to find out.'},
  {id:3,title:'Top 10 Tech Companies Hiring Now',         slug:'top-tech-companies-hiring',       status:'Published',  author:'Hired. Team',   date:'Mar 5, 2026', category:'Jobs',      views:9102, excerpt:'The most exciting tech companies actively recruiting in 2026.'},
  {id:4,title:'Salary Negotiation: The Complete Guide',   slug:'salary-negotiation-guide',        status:'Draft',      author:'Content Team',  date:'Mar 18, 2026',category:'Salary',    views:0,    excerpt:'Step-by-step guide to negotiating the salary you deserve.'},
  {id:5,title:'Remote Work: Finding Best Opportunities',  slug:'remote-work-opportunities',       status:'Published',  author:'Hired. Team',   date:'Feb 28, 2026',category:'Remote',    views:7841, excerpt:'How to find and land the best remote jobs in 2026.'},
  {id:6,title:'CV Writing That Gets Callbacks',           slug:'cv-writing-callbacks',            status:'Scheduled',  author:'Content Team',  date:'Mar 22, 2026',category:'CV Tips',   views:0,    excerpt:'The exact format and keywords that get your CV past ATS.'},
];

function BlogManager({ toast }) {
  const [posts, setPosts] = useState(BLOG_POSTS);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('All');
  const statColors = { Published:'green', Draft:'amber', Scheduled:'blue' };
  const cats = ['All','Career Tips','Trends','Jobs','Salary','Remote','CV Tips','Interview'];

  const filtered = filter==='All' ? posts : posts.filter(p=>p.category===filter);

  return (
    <div style={{ padding:'24px 28px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ ...S, fontSize:22, fontWeight:800, letterSpacing:-.5, color:'var(--ink)', marginBottom:3 }}>Blog Manager</div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>{posts.filter(p=>p.status==='Published').length} published · {posts.filter(p=>p.status==='Draft').length} drafts · {posts.filter(p=>p.status==='Scheduled').length} scheduled</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>toast('Opening post editor…')}>+ New Post</button>
      </div>
      {/* Filters */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={{ padding:'5px 13px', borderRadius:50, fontSize:12, fontWeight:700, border:`1.5px solid ${filter===c?'var(--p500)':'var(--faint)'}`, color:filter===c?'var(--p600)':'var(--muted)', background:filter===c?'var(--p100)':'transparent', cursor:'pointer' }}>{c}</button>
        ))}
      </div>
      <Card style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'var(--p25)' }}>
            {['Title','Category','Author','Date','Views','Status','Actions'].map(h=>(
              <th key={h} style={{ padding:'11px 14px', fontSize:10, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--p500)', textAlign:'left', borderBottom:'1px solid var(--faint)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((p)=>(
              <tr key={p.id} style={{ borderBottom:'1px solid var(--faint2)', transition:'background .1s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--p25)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ fontFamily:'var(--serif)', fontWeight:700, fontSize:13, color:'var(--ink)', marginBottom:2 }}>{p.title}</div>
                  <div style={{ fontSize:10.5, color:'var(--muted)', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.excerpt}</div>
                </td>
                <td style={{ padding:'12px 14px' }}><span className="badge badge-purple">{p.category}</span></td>
                <td style={{ padding:'12px 14px', fontSize:12, color:'var(--muted)' }}>{p.author}</td>
                <td style={{ padding:'12px 14px', fontSize:11.5, color:'var(--muted)', whiteSpace:'nowrap' }}>{p.date}</td>
                <td style={{ padding:'12px 14px', fontFamily:'monospace', fontSize:12, fontWeight:700, color:'var(--ink)' }}>{p.views>0?p.views.toLocaleString():'—'}</td>
                <td style={{ padding:'12px 14px' }}><SBadge s={p.status}/></td>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', gap:4 }}>
                    {['Edit','Preview','Delete'].map(a=>(
                      <button key={a} className="btn btn-ghost btn-sm" style={{ padding:'3px 9px', fontSize:11, color:a==='Delete'?'var(--red)':'var(--muted)' }} onClick={()=>toast(`${a}: ${p.title}`)}>{a}</button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default function AdminPage({ toast, onExit }) {
  const [sec,     setSec]     = useState('dashboard');
  const [tick,    setTick]    = useState(0);
  const [dateRange,setDate]   = useState('Last 7 days');
  const [userQ,   setUserQ]   = useState('');
  const tickRef = useRef(null);

  useEffect(()=>{
    tickRef.current=setInterval(()=>setTick(t=>(t+1)%TICKER.length),3500);
    return()=>clearInterval(tickRef.current);
  },[]);

  const groups=[...new Set(NAV.map(n=>n.g))];

  function exportCSV(){
    const rows=[['Metric','Value','Change'],['Total Users','12847','+8.4%'],['Active Jobs','42391','+891'],['CVs Optimized','8234','+127'],['MRR','$24800','+18%'],['Avg Match Score','94%','+2%'],['Interview Sessions','892','+34%'],['Offers Accepted','312','+22%']];
    const csv=rows.map(r=>r.join(',')).join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='hired-dashboard.csv';a.click();
    toast('Dashboard exported as CSV');
  }

  const filteredUsers=USERS.filter(u=>!userQ||u.name.toLowerCase().includes(userQ.toLowerCase())||u.email.toLowerCase().includes(userQ.toLowerCase()));

  return (
    <div style={{ flex:1, display:'grid', gridTemplateColumns:'228px 1fr', overflow:'hidden' }}>

      {/* ── SIDEBAR ── */}
      <div style={{ background:'#0d0b1e', display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid rgba(255,255,255,.06)' }}>
        {/* Logo */}
        <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <div style={{ ...S, fontSize:18, fontWeight:800, color:'#fff', letterSpacing:-.8, marginBottom:12 }}>Hired<span style={{ color:'var(--p400)' }}>.</span> <span style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontWeight:500 }}>Admin</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 11px', borderRadius:9, background:'rgba(15,122,74,.12)', border:'1px solid rgba(15,122,74,.22)' }}>
            <StatusDot ok={true}/>
            <span style={{ fontSize:11, fontWeight:600, color:'#6ee7b7', letterSpacing:.01 }}>All systems operational</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex:1, overflowY:'auto', padding:'10px 8px' }}>
          {groups.map(grp=>(
            <div key={grp} style={{ marginBottom:20 }}>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.18)', padding:'0 10px', marginBottom:5 }}>{grp}</div>
              {NAV.filter(n=>n.g===grp).map(item=>(
                <button key={item.id} onClick={()=>setSec(item.id)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 11px', borderRadius:10, border:'none', background:sec===item.id?'rgba(155,130,240,.15)':'transparent', color:sec===item.id?'var(--p300)':'rgba(255,255,255,.42)', fontFamily:'var(--sans)', fontSize:13, fontWeight:sec===item.id?700:500, cursor:'pointer', textAlign:'left', marginBottom:2, transition:'all .15s' }}
                  onMouseEnter={e=>{if(sec!==item.id){e.currentTarget.style.background='rgba(255,255,255,.06)';e.currentTarget.style.color='rgba(255,255,255,.75)';}}}
                  onMouseLeave={e=>{if(sec!==item.id){e.currentTarget.style.background='transparent';e.currentTarget.style.color='rgba(255,255,255,.42)';}}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><path d={item.icon}/></svg>
                  {item.l}
                  {item.id==='users'&&<span style={{ marginLeft:'auto', fontSize:9.5, fontWeight:800, background:'rgba(98,71,212,.3)', color:'var(--p300)', padding:'2px 6px', borderRadius:50 }}>12k</span>}
                  {item.id==='jobs'&&<span style={{ marginLeft:'auto', fontSize:9.5, fontWeight:800, background:'rgba(5,150,105,.2)', color:'var(--green)', padding:'2px 6px', borderRadius:50 }}>42k</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Admin user */}
        <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,var(--p400),var(--p600))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', fontFamily:'var(--serif)', flexShrink:0 }}>AP</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.8)' }}>Admin Panel</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.28)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>admin@hired.ai</div>
          </div>
          <button onClick={onExit} title="Sign out" style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,.07)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.4)', transition:'all .15s', flexShrink:0 }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(229,62,62,.2)';e.currentTarget.style.color='#fc8181';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.07)';e.currentTarget.style.color='rgba(255,255,255,.4)';}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ overflowY:'auto', background:'var(--bg)' }}>

        {/* ── DASHBOARD ── */}
        {sec==='dashboard'&&<div style={{ padding:'24px 28px' }}>

          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div>
              <div style={{ ...S, fontSize:24, fontWeight:800, letterSpacing:-.5, color:'var(--ink)', marginBottom:3 }}>Dashboard</div>
              <div style={{ fontSize:13, color:'var(--muted)', display:'flex', alignItems:'center', gap:10 }}>
                <span>Thursday, March 19, 2026</span>
                <span style={{ opacity:.4 }}>·</span>
                <span style={{ display:'flex', alignItems:'center', gap:5, color:'var(--green)', fontWeight:600 }}><StatusDot ok={true}/>All systems operational</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <select value={dateRange} onChange={e=>setDate(e.target.value)} className="field-input" style={{ width:'auto', padding:'7px 12px', fontSize:12 }}>
                {['Last 7 days','Last 30 days','Last 90 days','This year'].map(o=><option key={o}>{o}</option>)}
              </select>
              <button className="btn btn-ghost btn-sm" onClick={exportCSV}>Export CSV</button>
              <button className="btn btn-primary btn-sm" onClick={()=>toast('Generating full report…')}>Full Report</button>
            </div>
          </div>

          {/* Live Ticker */}
          <div style={{ background:'#0d0b1e', borderRadius:12, padding:'10px 18px', marginBottom:18, display:'flex', alignItems:'center', gap:14, overflow:'hidden', border:'1px solid rgba(155,130,240,.14)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              <StatusDot ok={true}/>
              <span style={{ fontSize:9.5, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--p300)' }}>LIVE</span>
            </div>
            <div key={tick} style={{ fontSize:12.5, color:'rgba(255,255,255,.58)', fontWeight:500, flex:1, animation:'slideDown .3s ease', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{TICKER[tick]}</div>
            <div style={{ display:'flex', gap:3, flexShrink:0 }}>
              {TICKER.map((_,i)=><div key={i} style={{ width:i===tick?14:4, height:4, borderRadius:4, background:i===tick?'var(--p300)':'rgba(255,255,255,.12)', transition:'all .3s' }}/>)}
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
            {KPI.map(k=>(
              <div key={k.label} style={{ background:'var(--surface)', border:'1.5px solid var(--faint)', borderRadius:18, padding:'18px 20px', position:'relative', overflow:'hidden', transition:'all .2s', cursor:'default' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(98,71,212,.1)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.grad, borderRadius:'18px 18px 0 0' }}/>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--muted)' }}>{k.label}</div>
                  <div style={{ width:28, height:28, borderRadius:8, background:`${k.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Ic d={k.icon} size={14} stroke={k.color} sw={1.8}/>
                  </div>
                </div>
                <div style={{ ...S, fontSize:26, fontWeight:800, letterSpacing:-.8, color:'var(--ink)', marginBottom:8 }}>{k.value}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                  <div>
                    <span style={{ fontSize:11, fontWeight:800, color:'var(--green)' }}>{k.delta}</span>
                    <span style={{ fontSize:10.5, color:'var(--muted)', marginLeft:4 }}>{k.sub}</span>
                  </div>
                  <MiniLine data={k.spark} color={k.color}/>
                </div>
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
            <Card>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div><PanelTitle style={{ margin:0, marginBottom:4 }}>Weekly Signups</PanelTitle><div style={{ ...S, fontSize:24, fontWeight:800, letterSpacing:-.5, color:'var(--ink)' }}>{SIGNUPS_WEEK.reduce((a,d)=>a+d.v,0)}</div></div>
                <Badge color="green">+12.4%</Badge>
              </div>
              <BarChart data={SIGNUPS_WEEK} color="var(--p500)" color2="var(--p300)" height={90}/>
            </Card>
            <Card>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div><PanelTitle style={{ margin:0, marginBottom:4 }}>Revenue MRR</PanelTitle><div style={{ ...S, fontSize:24, fontWeight:800, letterSpacing:-.5, color:'var(--ink)' }}>$24.8k</div></div>
                <Badge color="blue">+18%</Badge>
              </div>
              <LineChart data={REVENUE_TREND} color="#2563eb" height={70} filled/>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                {['W1','W2','W3','W4','W5','W6','W7'].map(w=><span key={w} style={{ fontSize:9, color:'var(--muted)', flex:1, textAlign:'center' }}>{w}</span>)}
              </div>
            </Card>
            <Card>
              <PanelTitle>Conversion Funnel</PanelTitle>
              <FunnelChart stages={FUNNEL}/>
            </Card>
          </div>

          {/* Row 3 */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
            {/* KPI Gauges */}
            <Card>
              <PanelTitle>Platform KPIs</PanelTitle>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['Match Score',94,'var(--p500)'],['Offer Rate',67,'var(--green)'],['Retention',89,'#2563eb'],['Satisfaction',96,'var(--amber)']].map(([l,v,c])=>(
                  <div key={l} style={{ textAlign:'center', padding:'10px 8px', background:'var(--p25)', borderRadius:12 }}>
                    <GaugeChart value={v} color={c} label={l}/>
                  </div>
                ))}
              </div>
            </Card>

            {/* Geo */}
            <Card>
              <PanelTitle>Users by Country</PanelTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {GEO.map((g,i)=>(
                  <div key={g.c} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:i<GEO.length-1?'1px solid var(--faint2)':'none' }}>
                    <div style={{ width:24, height:24, borderRadius:6, background:g.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9.5, fontWeight:800, color:g.color, flexShrink:0 }}>{g.flag}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, fontWeight:600, color:'var(--ink)', marginBottom:3 }}>
                        <span>{g.c}</span>
                        <span style={{ fontFamily:'monospace', fontSize:10.5, color:'var(--muted)' }}>{g.users.toLocaleString()} · {g.pct}%</span>
                      </div>
                      <div style={{ height:4, background:'var(--faint2)', borderRadius:50, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${g.pct}%`, background:g.color, borderRadius:50, transition:'width .8s ease' }}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Live Activity */}
            <Card>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <PanelTitle style={{ margin:0 }}>Live Activity</PanelTitle>
                <span style={{ fontSize:11, fontWeight:700, color:'var(--green)', display:'flex', alignItems:'center', gap:5 }}><StatusDot ok/>47 online</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:0, maxHeight:260, overflowY:'auto' }}>
                {ACTIVITY.map((a,i)=>(
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px 0', borderBottom:i<ACTIVITY.length-1?'1px solid var(--faint2)':'none' }}>
                    <div style={{ width:26, height:26, borderRadius:7, background:a.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:a.color, flexShrink:0 }}>{a.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11.5, fontWeight:600, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.text}</div>
                      <div style={{ fontSize:10.5, color:'var(--muted)' }}>{a.sub}</div>
                    </div>
                    <div style={{ fontSize:10, color:'var(--muted)', flexShrink:0 }}>{a.time}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Row 4 */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Card>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <PanelTitle style={{ margin:0 }}>Signup Activity Heatmap</PanelTitle>
                <span style={{ fontSize:11, color:'var(--muted)' }}>Last 7 days by hour</span>
              </div>
              <HeatMap data={HEATMAP_DATA}/>
            </Card>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <Card>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <PanelTitle style={{ margin:0 }}>Platform Health</PanelTitle>
                  <Badge color="green">99.9% uptime</Badge>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  {HEALTH.map(m=>(
                    <div key={m.l} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <StatusDot ok={m.ok}/>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, fontWeight:600, color:'var(--ink)', marginBottom:3 }}>
                          <span>{m.l}</span><span style={{ fontFamily:'monospace', fontSize:10.5, color:'var(--muted)' }}>{m.v}</span>
                        </div>
                        <div style={{ height:3, background:'var(--faint2)', borderRadius:50, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${m.pct}%`, background:m.ok?'var(--green)':'var(--amber)', borderRadius:50 }}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card style={{ background:'linear-gradient(135deg,var(--p800),var(--p600))', border:'none', color:'#fff' }}>
                <div style={{ fontSize:10, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,.45)', marginBottom:10 }}>Quick Actions</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[['Send Newsletter','M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],['Backup DB','M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z M9 12h6M12 9v6'],['Clear Cache','M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'],['System Logs','M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2']].map(([l,ic])=>(
                    <button key={l} onClick={()=>toast(`${l}…`)} style={{ padding:'10px 12px', borderRadius:10, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.8)', cursor:'pointer', fontSize:11.5, fontWeight:600, display:'flex', alignItems:'center', gap:8, transition:'all .15s', textAlign:'left' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.15)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'}>
                      <Ic d={ic} size={13} stroke="rgba(255,255,255,.7)"/>
                      {l}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>}

        {/* ── ANALYTICS ── */}
        {sec==='analytics'&&<div style={{ padding:'24px 28px' }}>
          <div style={{ ...S, fontSize:22, fontWeight:800, letterSpacing:-.5, color:'var(--ink)', marginBottom:20 }}>Analytics</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            {[
              ['User Growth (7d)', SIGNUPS_WEEK.map(d=>d.v), 'var(--p500)', SIGNUPS_WEEK.map(d=>d.l)],
              ['Revenue Trend (7w)', REVENUE_TREND, '#2563eb', ['W1','W2','W3','W4','W5','W6','W7']],
              ['Match Score Avg (%)', MATCH_TREND, 'var(--green)', ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']],
              ['Interview Scores (%)', [72,78,75,82,79,86,84,88,85,90,88,91], 'var(--amber)', ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']],
            ].map(([label,data,color,labels])=>(
              <Card key={label}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <PanelTitle style={{ margin:0 }}>{label}</PanelTitle>
                  <span style={{ fontSize:13, fontWeight:800, color, fontFamily:'var(--serif)' }}>{data[data.length-1]}{label.includes('%')?'%':''}</span>
                </div>
                <LineChart data={data} color={color} height={80} filled/>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                  {labels.map((l,i)=><span key={i} style={{ fontSize:8.5, color:'var(--muted)', flex:1, textAlign:'center' }}>{l}</span>)}
                </div>
              </Card>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Card>
              <PanelTitle>Signups vs Applications (Stacked)</PanelTitle>
              <AreaStack data={AREA_DATA} height={100}/>
              <div style={{ display:'flex', gap:16, marginTop:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11 }}><div style={{ width:12, height:3, borderRadius:2, background:'var(--p400)' }}/>Signups</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11 }}><div style={{ width:12, height:3, borderRadius:2, background:'#2563eb' }}/>Applications</div>
              </div>
            </Card>
            <Card>
              <PanelTitle>Key Metrics Overview</PanelTitle>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['Avg Session',  '8m 42s','var(--p500)'],['Bounce Rate','24.3%','var(--green)'],['Pages/Visit','6.8','#2563eb'],['Conversion','1.85%','var(--amber)']].map(([l,v,c])=>(
                  <div key={l} style={{ padding:'14px', borderRadius:12, background:'var(--p25)', border:'1px solid var(--faint)' }}>
                    <div style={{ fontSize:10, color:'var(--muted)', fontWeight:700, marginBottom:6 }}>{l}</div>
                    <div style={{ ...S, fontSize:20, fontWeight:800, color:c, letterSpacing:-.5 }}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>}

        {/* ── USERS ── */}
        {sec==='users'&&<div style={{ padding:'24px 28px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div>
              <div style={{ ...S, fontSize:22, fontWeight:800, letterSpacing:-.5, color:'var(--ink)', marginBottom:3 }}>Users</div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>{USERS.length} total · {USERS.filter(u=>u.status==='Active').length} active</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input className="field-input" style={{ width:220, padding:'7px 12px', fontSize:12 }} placeholder="Search by name or email…" value={userQ} onChange={e=>setUserQ(e.target.value)}/>
              <button className="btn btn-primary btn-sm" onClick={()=>toast('Invite user…')}>Invite User</button>
              <button className="btn btn-ghost btn-sm" onClick={exportCSV}>Export</button>
            </div>
          </div>
          <Card style={{ padding:0, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:'var(--p25)' }}>
                {['User','Role','Plan','Status','Match Score','Applications','Joined','Actions'].map(h=>(
                  <th key={h} style={{ padding:'11px 14px', fontSize:10, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--p500)', textAlign:'left', borderBottom:'1px solid var(--faint)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filteredUsers.map((u,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid var(--faint2)', transition:'background .1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--p25)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,var(--p400),var(--p600))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff', fontFamily:'var(--serif)', flexShrink:0 }}>
                          {u.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color:'var(--ink)' }}>{u.name}</div>
                          <div style={{ fontSize:11, color:'var(--muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'11px 14px' }}><Badge color={u.role==='Employer'?'blue':'purple'}>{u.role}</Badge></td>
                    <td style={{ padding:'11px 14px' }}><SBadge s={u.plan}/></td>
                    <td style={{ padding:'11px 14px' }}><SBadge s={u.status}/></td>
                    <td style={{ padding:'11px 14px', fontFamily:'monospace', fontWeight:700, fontSize:13, color:u.score>=90?'var(--green)':u.score>=75?'var(--amber)':'var(--muted)' }}>{u.score??'—'}{u.score?'%':''}</td>
                    <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:12, color:'var(--ink)' }}>{u.apps??'—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:11.5, color:'var(--muted)', whiteSpace:'nowrap' }}>{u.joined}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        {['View','Edit',u.status==='Suspended'?'Restore':'Suspend'].map(a=>(
                          <button key={a} className="btn btn-ghost btn-sm" style={{ padding:'3px 8px', fontSize:11, color:a==='Suspend'?'var(--red)':a==='Restore'?'var(--green)':'var(--muted)' }} onClick={()=>toast(`${a}: ${u.name}`)}>{a}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>}

        {/* ── JOBS ── */}
        {sec==='jobs'&&<div style={{ padding:'24px 28px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div>
              <div style={{ ...S, fontSize:22, fontWeight:800, letterSpacing:-.5, color:'var(--ink)', marginBottom:3 }}>Jobs</div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>{JOBS_DATA.length} indexed · {JOBS_DATA.filter(j=>j.status==='Active'||j.status==='Featured').length} live</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost btn-sm" onClick={()=>toast('Scraping new jobs…')}>Sync Jobs</button>
              <button className="btn btn-primary btn-sm" onClick={()=>toast('Opening job editor…')}>Post Job</button>
            </div>
          </div>
          <Card style={{ padding:0, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:'var(--p25)' }}>
                {['Job','Location','Salary','Applications','Views','24h Change','Posted','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'11px 14px', fontSize:10, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--p500)', textAlign:'left', borderBottom:'1px solid var(--faint)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {JOBS_DATA.map((j,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid var(--faint2)', transition:'background .1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--p25)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontFamily:'var(--serif)', fontWeight:700, fontSize:13, color:'var(--ink)', marginBottom:1 }}>{j.title}</div>
                      <div style={{ fontSize:11, color:'var(--muted)' }}>{j.company}</div>
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--muted)' }}>{j.location}</td>
                    <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:12, fontWeight:700, color:'var(--green)' }}>{j.salary}</td>
                    <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:13, fontWeight:800, color:'var(--ink)' }}>{j.apps}</td>
                    <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:12, color:'var(--muted)' }}>{j.views.toLocaleString()}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:800, color:j.change.startsWith('+')?'var(--green)':'var(--red)' }}>{j.change}</span>
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:11.5, color:'var(--muted)' }}>{j.posted}</td>
                    <td style={{ padding:'11px 14px' }}><SBadge s={j.status}/></td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        {['Edit','Feature','Pause'].map(a=>(
                          <button key={a} className="btn btn-ghost btn-sm" style={{ padding:'3px 8px', fontSize:11 }} onClick={()=>toast(`${a}: ${j.title}`)}>{a}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>}

        {/* ── REPORTS ── */}
        {sec==='reports'&&<div style={{ padding:'24px 28px' }}>
          <div style={{ ...S, fontSize:22, fontWeight:800, letterSpacing:-.5, color:'var(--ink)', marginBottom:20 }}>Reports</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            {[
              {title:'User Acquisition Report',desc:'Signups, sources, conversion rates and drop-off analysis.',badge:'green',icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8'},
              {title:'Revenue & MRR Report',desc:'Monthly recurring revenue, churn, upgrade/downgrade trends.',badge:'blue',icon:'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'},
              {title:'Job Performance Report',desc:'Top performing job listings by applications, views and conversion.',badge:'purple',icon:'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z'},
              {title:'AI Match Quality Report',desc:'Match score accuracy, offer acceptance rates, candidate outcomes.',badge:'amber',icon:'M12 2L2 7l10 5 10-5-10-5z'},
              {title:'CV Optimizer Report',desc:'Before/after ATS scores, callback rates, employer feedback.',badge:'green',icon:'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z'},
              {title:'Interview Coach Report',desc:'Session counts, scores, role-specific performance breakdown.',badge:'blue',icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2'},
            ].map(r=>(
              <Card key={r.title} style={{ cursor:'pointer', transition:'all .2s' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(98,71,212,.1)';e.currentTarget.style.borderColor='var(--p200)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='var(--faint)';}}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'var(--p50)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Ic d={r.icon} size={17} stroke="var(--p500)"/>
                  </div>
                  <Badge color={r.badge}>Ready</Badge>
                </div>
                <div style={{ ...S, fontSize:14, fontWeight:700, color:'var(--ink)', marginBottom:6 }}>{r.title}</div>
                <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.65, marginBottom:14 }}>{r.desc}</div>
                <button className="btn btn-outline btn-sm" onClick={()=>exportCSV()} style={{ fontSize:11 }}>Download CSV</button>
              </Card>
            ))}
          </div>
        </div>}

        {/* ── SETTINGS ── */}
        {sec==='settings'&&<div style={{ padding:'24px 28px' }}>
          <div style={{ ...S, fontSize:22, fontWeight:800, letterSpacing:-.5, color:'var(--ink)', marginBottom:20 }}>Settings</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              ['Platform','Platform Name','Hired.','Support Email','support@hired.ai','Max File Size (MB)','10','Job Cache TTL (min)','30'],
              ['AI Engine','OpenAI Model','gpt-4o','Match Threshold (%)','70','Max Jobs Indexed','50000','Reindex Interval (h)','6'],
            ].map(([section,...fields])=>(
              <Card key={section}>
                <PanelTitle>{section} Settings</PanelTitle>
                {Array.from({length:fields.length/2},(_,i)=>[fields[i*2],fields[i*2+1]]).map(([label,val])=>(
                  <div key={label} style={{ marginBottom:14 }}>
                    <label className="field-lbl">{label}</label>
                    <input className="field-input" defaultValue={val} style={{ fontSize:13 }}/>
                  </div>
                ))}
                <button className="btn btn-primary btn-sm" onClick={()=>toast(`${section} settings saved`)}>Save Changes</button>
              </Card>
            ))}
            <Card>
              <PanelTitle>Notifications</PanelTitle>
              {[['New user signups','Email alerts for each new signup',true],['Daily digest','Summary of platform metrics',true],['Error alerts','Critical system errors',true],['Weekly report','Auto-generated analytics PDF',false]].map(([label,desc,def])=>(
                <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--faint2)' }}>
                  <div><div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>{label}</div><div style={{ fontSize:11, color:'var(--muted)' }}>{desc}</div></div>
                  <button onClick={()=>toast(`Toggled: ${label}`)} style={{ width:40, height:22, borderRadius:50, border:'none', background:def?'var(--p500)':'var(--faint)', cursor:'pointer', position:'relative', transition:'background .2s' }}>
                    <span style={{ position:'absolute', top:3, left:def?20:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
                  </button>
                </div>
              ))}
            </Card>
            <Card>
              <PanelTitle>Security</PanelTitle>
              <div style={{ marginBottom:14 }}><label className="field-lbl">Admin Password</label><input className="field-input" type="password" defaultValue="admin123" style={{ fontSize:13 }}/></div>
              <div style={{ marginBottom:14 }}><label className="field-lbl">Session Timeout (min)</label><input className="field-input" defaultValue="60" style={{ fontSize:13 }}/></div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-primary btn-sm" onClick={()=>toast('Security settings saved')}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>toast('2FA setup email sent')}>Setup 2FA</button>
              </div>
            </Card>
          </div>
        </div>}

        {/* ── AUDIT LOGS ── */}
        {sec==='audit'&&<div style={{ padding:'24px 28px' }}>
          <div style={{ ...S, fontSize:22, fontWeight:800, letterSpacing:-.5, color:'var(--ink)', marginBottom:20 }}>Audit Logs</div>
          <Card style={{ padding:0, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:'var(--p25)' }}>
                {['Timestamp','User','Action','Resource','IP Address','Status'].map(h=>(
                  <th key={h} style={{ padding:'11px 14px', fontSize:10, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--p500)', textAlign:'left', borderBottom:'1px solid var(--faint)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[
                  ['2026-03-19 05:41','admin@hired.ai','LOGIN','Admin Panel','196.68.1.42','Success'],
                  ['2026-03-19 05:38','yasmine@email.com','APPLY','Job #1042','41.202.13.1','Success'],
                  ['2026-03-19 05:35','karim@email.com','CV_OPTIMIZE','CV #8234','196.68.5.10','Success'],
                  ['2026-03-19 05:30','admin@hired.ai','USER_SUSPEND','ali@email.com','196.68.1.42','Success'],
                  ['2026-03-19 05:22','priya@email.com','INTERVIEW','Session #892','73.12.44.1','Success'],
                  ['2026-03-19 05:15','unknown','LOGIN_FAIL','Admin Panel','192.168.0.1','Failed'],
                  ['2026-03-19 05:10','nora@email.com','SIGNUP','Platform','41.200.22.5','Success'],
                  ['2026-03-19 04:58','admin@hired.ai','EXPORT','Users CSV','196.68.1.42','Success'],
                ].map(([ts,user,action,resource,ip,status],i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid var(--faint2)', transition:'background .1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--p25)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:11.5, color:'var(--muted)', whiteSpace:'nowrap' }}>{ts}</td>
                    <td style={{ padding:'10px 14px', fontSize:12, color:'var(--ink)', fontWeight:600 }}>{user}</td>
                    <td style={{ padding:'10px 14px' }}><span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:5, background:'var(--p100)', color:'var(--p700)' }}>{action}</span></td>
                    <td style={{ padding:'10px 14px', fontSize:12, color:'var(--muted)' }}>{resource}</td>
                    <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:11, color:'var(--muted)' }}>{ip}</td>
                    <td style={{ padding:'10px 14px' }}><Badge color={status==='Success'?'green':'red'}>{status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>}

        {/* ── BLOG MANAGER ── */}
        {sec==='blog'&&<BlogManager toast={toast}/>}
      </div>
    </div>
  );
}
