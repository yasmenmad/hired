import React, { useState, useEffect, useRef } from 'react';

/* ─── Mock Data ─────────────────────────────────────────────── */
const MOCK_PEERS = [
 { id:1, name:'Sara El Amrani', role:'Frontend Developer', company:'Contentsquare', location:'Paris', field:'Frontend', level:'Junior', avatar:'SE', color:'#7c3aed', mutual:3, open:true, skills:['React','TypeScript','CSS'], bio:'2nd year grad, building cool UIs. Open to remote roles in Europe.', posts:12, connections:84 },
 { id:2, name:'Karim Benali', role:'Data Analyst Intern', company:'Spotify', location:'Stockholm', field:'Data', level:'Student', avatar:'KB', color:'#0ea5e9', mutual:1, open:true, skills:['Python','SQL','Tableau'], bio:'Statistics grad student obsessed with music data. Looking for full-time in 6 months.', posts:7, connections:42 },
 { id:3, name:'Lina Rousseau', role:'Product Manager', company:'Notion', location:'San Francisco', field:'Product', level:'Junior', avatar:'LR', color:'#f59e0b', mutual:5, open:false, skills:['Figma','Jira','Analytics'], bio:'CS + business dual degree. Built 3 products at Notion as PM intern.', posts:21, connections:156 },
 { id:4, name:'Omar Tazi', role:'ML Engineer', company:'Mistral AI', location:'Paris', field:'AI/ML', level:'Mid', avatar:'OT', color:'#10b981', mutual:2, open:true, skills:['PyTorch','LLMs','Python'], bio:'NLP research background, now shipping prod AI at Mistral. Happy to review CVs.', posts:34, connections:203 },
 { id:5, name:'Jade Moreau', role:'UX Designer', company:'Figma', location:'Remote', field:'Design', level:'Junior', avatar:'JM', color:'#ec4899', mutual:0, open:true, skills:['Figma','Prototyping','Research'], bio:'Design systems nerd. Looking to connect with devs for collab projects.', posts:18, connections:99 },
 { id:6, name:'Youssef Idrissi',role:'Backend Intern', company:'Stripe', location:'Dublin', field:'Backend', level:'Student', avatar:'YI', color:'#8b5cf6', mutual:4, open:true, skills:['Go','Postgres','Docker'], bio:'Final year CS student at TCD. Stripe intern this summer. Looking for full-time.', posts:5, connections:31 },
 { id:7, name:'Amina Doukkali', role:'DevOps Engineer', company:'OVHcloud', location:'Casablanca', field:'DevOps', level:'Junior', avatar:'AD', color:'#14b8a6', mutual:1, open:false, skills:['Kubernetes','Terraform','AWS'], bio:'Infrastructure enthusiast. CKAD certified. Happy to give referrals at OVH.', posts:9, connections:67 },
 { id:8, name:'Lucas Bernard', role:'iOS Developer', company:'BlaBlaCar', location:'Paris', field:'Mobile', level:'Mid', avatar:'LB', color:'#f97316', mutual:2, open:true, skills:['Swift','SwiftUI','Xcode'], bio:'SwiftUI evangelist. Looking for side-project collaborators.', posts:15, connections:112 },
];

const MOCK_JOBS = [
 { id:1, poster:'Sara El Amrani', posterAvatar:'SE', posterColor:'#7c3aed', role:'Frontend Developer', company:'Contentsquare', location:'Paris · Hybrid', posted:'2h ago', referral:true, note:'I know the eng team — happy to refer strong candidates.' },
 { id:2, poster:'Omar Tazi', posterAvatar:'OT', posterColor:'#10b981', role:'ML Engineer', company:'Mistral AI', location:'Paris · On-site', posted:'1d ago', referral:true, note:'Team is growing fast. DM me your CV and I\'ll pass it on.' },
 { id:3, poster:'Amina Doukkali', posterAvatar:'AD', posterColor:'#14b8a6', role:'DevOps Engineer', company:'OVHcloud', location:'Casablanca · Remote ok', posted:'3d ago', referral:true, note:'Looking for junior DevOps. Ping me if you have K8s experience.' },
];

const INITIAL_FEED = [
 { id:1, user:'Omar Tazi', avatar:'OT', color:'#10b981', time:'45m', text:"Just shipped our new open-source embeddings model If you're building RAG apps, check it out. Happy to answer questions about our infra.", likes:47, comments:12, type:'post' },
 { id:2, user:'Lina Rousseau', avatar:'LR', color:'#f59e0b', time:'2h', text:"Hot take: PMs who can code have a massive edge in early-stage startups. Not because you'll write prod code — but because you can prototype, unblock yourself, and communicate clearly with eng. Agree?", likes:132, comments:38, type:'discussion' },
 { id:3, user:'Sara El Amrani', avatar:'SE', color:'#7c3aed', time:'4h', text:"Got my first full-time offer! 6 months of applications, 40+ rejections, and now Contentsquare is flying me to Paris next month. To everyone still grinding — it's coming ", likes:284, comments:61, type:'milestone' },
 { id:4, user:'Youssef Idrissi', avatar:'YI', color:'#8b5cf6', time:'1d', text:"Asked Stripe interviewers what they look for in interns. Answer: curiosity > polish. They'd rather see someone excited to dig into a hard problem than someone who rehearsed perfect answers. Good news for us ", likes:89, comments:24, type:'tip' },
 { id:5, user:'Jade Moreau', avatar:'JM', color:'#ec4899', time:'2d', text:"Looking for a dev to collaborate on a side project — a tool that auto-generates design tokens from brand guidelines. I'll handle the UX, you handle the logic. Reach out if interested!", likes:56, comments:17, type:'collab' },
];

const FIELDS = ['All Fields','Frontend','Backend','AI/ML','Data','Product','Design','DevOps','Mobile'];
const LEVELS = ['All Levels','Student','Junior','Mid','Senior'];

/* ─── DM Modal ─────────────────────────────────────────────── */
function DMModal({ peer, onClose }) {
 const [messages, setMessages] = useState([
 { from:'them', text:`Hey! I'm ${peer.name.split(' ')[0]}. What's up?`, time:'now' }
 ]);
 const [draft, setDraft] = useState('');
 const bottomRef = useRef(null);

 useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

 function send() {
 if (!draft.trim()) return;
 setMessages(m => [...m,
 { from:'me', text:draft, time:'now' },
 ]);
 setDraft('');
 // Simulate reply
 setTimeout(() => {
 const replies = [
 `Thanks for reaching out! I'd love to connect.`,
 `That's a great question! Let me think about it.`,
 `Sure, happy to help. Send me your CV and I'll take a look.`,
 `Totally agree! Let's set up a call sometime.`,
 ];
 setMessages(m => [...m, { from:'them', text:replies[Math.floor(Math.random()*replies.length)], time:'now' }]);
 }, 1200);
 }

 return (
 <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.5)',backdropFilter:'blur(4px)'}}>
 <div style={{background:'var(--surface)',borderRadius:20,width:460,maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 25px 60px rgba(0,0,0,.3)',border:'1.5px solid var(--faint)'}}>
 {/* Header */}
 <div style={{padding:'16px 20px',borderBottom:'1.5px solid var(--faint)',display:'flex',alignItems:'center',gap:12}}>
 <div style={{width:38,height:38,borderRadius:'50%',background:peer.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff'}}>{peer.avatar}</div>
 <div>
 <div style={{fontWeight:700,fontSize:14,color:'var(--ink)'}}>{peer.name}</div>
 <div style={{fontSize:11.5,color:'var(--muted)'}}>{peer.role} @ {peer.company}</div>
 </div>
 <button onClick={onClose} style={{marginLeft:'auto',width:30,height:30,borderRadius:8,border:'1.5px solid var(--faint)',background:'transparent',cursor:'pointer',fontSize:14,color:'var(--muted)',display:'flex',alignItems:'center',justifyContent:'center'}}>x</button>
 </div>
 {/* Messages */}
 <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
 {messages.map((msg,i) => (
 <div key={i} style={{display:'flex',justifyContent:msg.from==='me'?'flex-end':'flex-start'}}>
 <div style={{maxWidth:'75%',padding:'9px 13px',borderRadius:msg.from==='me'?'14px 14px 4px 14px':'14px 14px 14px 4px',background:msg.from==='me'?'var(--p500)':'var(--bg)',color:msg.from==='me'?'#fff':'var(--ink)',fontSize:13,lineHeight:1.5,border:msg.from==='me'?'none':'1.5px solid var(--faint)'}}>
 {msg.text}
 </div>
 </div>
 ))}
 <div ref={bottomRef}/>
 </div>
 {/* Input */}
 <div style={{padding:'12px 16px',borderTop:'1.5px solid var(--faint)',display:'flex',gap:8}}>
 <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
 placeholder="Type a message…"
 style={{flex:1,padding:'9px 13px',borderRadius:10,border:'1.5px solid var(--faint)',background:'var(--bg)',color:'var(--ink)',fontSize:13,outline:'none',fontFamily:'var(--sans)'}}
 />
 <button onClick={send} style={{padding:'9px 16px',borderRadius:10,background:'var(--p500)',color:'#fff',border:'none',cursor:'pointer',fontWeight:700,fontSize:13,fontFamily:'var(--sans)'}}>Send</button>
 </div>
 </div>
 </div>
 );
}

/* ─── Peer Card ─────────────────────────────────────────────── */
function PeerCard({ peer, connected, onConnect, onDM }) {
 return (
 <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:16,padding:'18px 18px 14px',display:'flex',flexDirection:'column',gap:12,transition:'box-shadow .2s',cursor:'default'}}
 onMouseEnter={e=>e.currentTarget.style.boxShadow='0 8px 24px rgba(124,58,237,.1)'}
 onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
 <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
 <div style={{width:44,height:44,borderRadius:'50%',background:peer.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#fff',flexShrink:0}}>{peer.avatar}</div>
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontWeight:700,fontSize:14,color:'var(--ink)',marginBottom:1}}>{peer.name}</div>
 <div style={{fontSize:12,color:'var(--muted)',marginBottom:4}}>{peer.role} · <span style={{color:'var(--p500)'}}>{peer.company}</span></div>
 <div style={{fontSize:11,color:'var(--muted)',display:'flex',alignItems:'center',gap:4}}>
 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
 {peer.location}
 </div>
 </div>
 {peer.open && <div style={{padding:'3px 8px',borderRadius:20,background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.3)',fontSize:10,fontWeight:700,color:'var(--green)',whiteSpace:'nowrap',flexShrink:0}}>Open to connect</div>}
 </div>
 <p style={{fontSize:12.5,color:'var(--muted)',lineHeight:1.6,margin:0}}>{peer.bio}</p>
 <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
 {peer.skills.map(s=>(
 <span key={s} style={{padding:'3px 8px',borderRadius:20,background:'var(--p50)',border:'1px solid var(--p200)',fontSize:11,fontWeight:600,color:'var(--p600)'}}>{s}</span>
 ))}
 </div>
 <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
 {peer.mutual>0 && <span style={{fontSize:11.5,color:'var(--muted)',flex:1}}>{peer.mutual} mutual connections</span>}
 <button onClick={()=>onDM(peer)} style={{padding:'6px 12px',borderRadius:9,border:'1.5px solid var(--faint)',background:'transparent',cursor:'pointer',fontSize:12,fontWeight:700,color:'var(--muted)',fontFamily:'var(--sans)',transition:'all .15s'}}
 onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--p300)';e.currentTarget.style.color='var(--p500)';}}
 onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--faint)';e.currentTarget.style.color='var(--muted)';}}>
 Message
 </button>
 <button onClick={()=>onConnect(peer.id)} style={{padding:'6px 12px',borderRadius:9,border:'none',background:connected?'var(--green)':' var(--p500)',cursor:'pointer',fontSize:12,fontWeight:700,color:'#fff',fontFamily:'var(--sans)',transition:'all .15s'}}>
 {connected ? ' Connected' : 'Connect'}
 </button>
 </div>
 </div>
 );
}

/* ─── Feed Post ─────────────────────────────────────────────── */
function FeedPost({ post, onLike, liked }) {
 const typeColors = { post:'var(--p500)', discussion:'var(--blue)', milestone:'var(--green)', tip:'var(--amber)', collab:'var(--pink)' };
 const typeLabels = { post:'Post', discussion:'Discussion', milestone:' Milestone', tip:' Tip', collab:' Collab' };
 return (
 <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:16,padding:'16px 18px',display:'flex',flexDirection:'column',gap:12}}>
 <div style={{display:'flex',alignItems:'center',gap:10}}>
 <div style={{width:38,height:38,borderRadius:'50%',background:post.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff',flexShrink:0}}>{post.avatar}</div>
 <div style={{flex:1}}>
 <div style={{fontWeight:700,fontSize:13.5,color:'var(--ink)'}}>{post.user}</div>
 <div style={{fontSize:11.5,color:'var(--muted)'}}>{post.time}</div>
 </div>
 <span style={{padding:'3px 9px',borderRadius:20,background:`${typeColors[post.type]}18`,border:`1px solid ${typeColors[post.type]}44`,fontSize:10.5,fontWeight:700,color:typeColors[post.type]}}>{typeLabels[post.type]}</span>
 </div>
 <p style={{fontSize:13.5,color:'var(--ink)',lineHeight:1.65,margin:0}}>{post.text}</p>
 <div style={{display:'flex',alignItems:'center',gap:16,paddingTop:4,borderTop:'1px solid var(--faint2)'}}>
 <button onClick={()=>onLike(post.id)} style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',fontSize:12.5,fontWeight:600,color:liked?'var(--red)':'var(--muted)',padding:0,fontFamily:'var(--sans)'}}>
 <svg width="14" height="14" viewBox="0 0 24 24" fill={liked?'currentColor':'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
 {post.likes + (liked?1:0)}
 </button>
 <button style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',fontSize:12.5,fontWeight:600,color:'var(--muted)',padding:0,fontFamily:'var(--sans)'}}>
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
 {post.comments}
 </button>
 <button style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',fontSize:12.5,fontWeight:600,color:'var(--muted)',padding:0,fontFamily:'var(--sans)',marginLeft:'auto'}}>
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
 Share
 </button>
 </div>
 </div>
 );
}

/* ─── Referral Card ─────────────────────────────────────────── */
function ReferralCard({ job, onDM, onApply }) {
 const peers = MOCK_PEERS;
 const poster = peers.find(p=>p.name===job.poster)||{};
 return (
 <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:16,padding:'16px 18px',display:'flex',flexDirection:'column',gap:12}}>
 <div style={{display:'flex',alignItems:'center',gap:3}}>
 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
 <span style={{fontSize:11,fontWeight:700,color:'var(--green)',letterSpacing:.5}}>REFERRAL AVAILABLE</span>
 </div>
 <div style={{display:'flex',gap:12,alignItems:'center'}}>
 <div>
 <div style={{fontWeight:700,fontSize:14.5,color:'var(--ink)',marginBottom:2}}>{job.role}</div>
 <div style={{fontSize:12.5,color:'var(--muted)'}}>{job.company} · {job.location}</div>
 </div>
 </div>
 <div style={{display:'flex',gap:10,alignItems:'flex-start',padding:'10px 12px',borderRadius:10,background:'var(--p25)',border:'1px solid var(--p100)'}}>
 <div style={{width:30,height:30,borderRadius:'50%',background:job.posterColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>{job.posterAvatar}</div>
 <div>
 <div style={{fontSize:12,fontWeight:700,color:'var(--ink)',marginBottom:3}}>{job.poster}</div>
 <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.5,fontStyle:'italic'}}>"{job.note}"</div>
 </div>
 </div>
 <div style={{fontSize:11,color:'var(--muted)'}}>{job.posted}</div>
 <div style={{display:'flex',gap:8}}>
 <button onClick={()=>onDM({...poster,name:job.poster,avatar:job.posterAvatar,color:job.posterColor,role:'',company:''})} style={{flex:1,padding:'8px',borderRadius:9,border:'1.5px solid var(--faint)',background:'transparent',cursor:'pointer',fontSize:12.5,fontWeight:700,color:'var(--muted)',fontFamily:'var(--sans)'}}>Ask for Referral</button>
 <button onClick={onApply} style={{flex:1,padding:'8px',borderRadius:9,border:'none',background:'var(--p500)',cursor:'pointer',fontSize:12.5,fontWeight:700,color:'#fff',fontFamily:'var(--sans)'}}>View Job →</button>
 </div>
 </div>
 );
}

/* ─── Main NetworkPage ──────────────────────────────────────── */
export default function NetworkPage({ toast, user }) {
 const [tab, setTab] = useState('discover');
 const [fieldFilter, setFieldFilter] = useState('All Fields');
 const [levelFilter, setLevelFilter] = useState('All Levels');
 const [search, setSearch] = useState('');
 const [connected, setConnected] = useState(new Set());
 const [dmPeer, setDmPeer] = useState(null);
 const [feed, setFeed] = useState(INITIAL_FEED);
 const [liked, setLiked] = useState(new Set());
 const [newPost, setNewPost] = useState('');

 function handleConnect(id) {
 setConnected(s => {
 const next = new Set(s);
 if (next.has(id)) next.delete(id); else next.add(id);
 return next;
 });
 const peer = MOCK_PEERS.find(p=>p.id===id);
 if (!connected.has(id)) toast?.(`Connected with ${peer?.name?.split(' ')[0]} `);
 }

 function handleLike(id) {
 setLiked(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
 }

 function handlePost() {
 if (!newPost.trim()) return;
 setFeed(f=>[{ id:Date.now(), user:user?.name||'You', avatar:(user?.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), color:'var(--p500)', time:'now', text:newPost, likes:0, comments:0, type:'post' }, ...f]);
 setNewPost('');
 toast?.('Post shared with your network!');
 }

 const filtered = MOCK_PEERS.filter(p => {
 const matchField = fieldFilter==='All Fields' || p.field===fieldFilter;
 const matchLevel = levelFilter==='All Levels' || p.level===levelFilter;
 const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.role.toLowerCase().includes(search.toLowerCase()) || p.company.toLowerCase().includes(search.toLowerCase());
 return matchField && matchLevel && matchSearch;
 });

 const TAB_STYLE = (active) => ({
 padding:'8px 18px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'var(--sans)',
 fontSize:13, fontWeight:active?700:600,
 background:active?'var(--p100)':'transparent',
 color:active?'var(--p600)':'var(--muted)',
 transition:'all .15s',
 });

 return (
 <div style={{height:'100%',overflow:'auto',background:'var(--bg)',padding:'24px 28px',fontFamily:'var(--sans)'}}>
 <div style={{maxWidth:1100,margin:'0 auto'}}>

 {/* Header */}
 <div style={{marginBottom:24}}>
 <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
 <div style={{width:42,height:42,borderRadius:13,background:'linear-gradient(135deg,var(--p400),var(--p600))',display:'flex',alignItems:'center',justifyContent:'center'}}>
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
 </div>
 <div>
 <h1 style={{fontFamily:'var(--serif)',fontSize:24,fontWeight:800,color:'var(--ink)',margin:0,letterSpacing:-.5}}>Network</h1>
 <p style={{fontSize:13,color:'var(--muted)',margin:0}}>Connect with peers, get referrals, share opportunities</p>
 </div>
 <div style={{marginLeft:'auto',display:'flex',gap:8}}>
 <div style={{padding:'6px 14px',borderRadius:10,background:'var(--greenl)',border:'1px solid rgba(16,185,129,.2)',fontSize:12,fontWeight:700,color:'var(--green)'}}>{connected.size + 84} connections</div>
 </div>
 </div>
 </div>

 {/* Tabs */}
 <div style={{display:'flex',gap:4,marginBottom:22,borderBottom:'1.5px solid var(--faint)',paddingBottom:1}}>
 {[['discover','Discover People'],['referrals','Referrals & Jobs'],['feed','Feed'],['my','My Connections']].map(([id,label])=>(
 <button key={id} onClick={()=>setTab(id)} style={TAB_STYLE(tab===id)}>{label}</button>
 ))}
 </div>

 {/* ── Discover ── */}
 {tab==='discover' && (
 <div>
 {/* Filters */}
 <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
 <input value={search} onChange={e=>setSearch(e.target.value)}
 placeholder="Search by name, role, company…"
 style={{flex:1,minWidth:220,padding:'9px 13px',borderRadius:10,border:'1.5px solid var(--faint)',background:'var(--surface)',color:'var(--ink)',fontSize:13,outline:'none',fontFamily:'var(--sans)'}}
 />
 <select value={fieldFilter} onChange={e=>setFieldFilter(e.target.value)}
 style={{padding:'9px 13px',borderRadius:10,border:'1.5px solid var(--faint)',background:'var(--surface)',color:'var(--ink)',fontSize:13,outline:'none',fontFamily:'var(--sans)',cursor:'pointer'}}>
 {FIELDS.map(f=><option key={f}>{f}</option>)}
 </select>
 <select value={levelFilter} onChange={e=>setLevelFilter(e.target.value)}
 style={{padding:'9px 13px',borderRadius:10,border:'1.5px solid var(--faint)',background:'var(--surface)',color:'var(--ink)',fontSize:13,outline:'none',fontFamily:'var(--sans)',cursor:'pointer'}}>
 {LEVELS.map(l=><option key={l}>{l}</option>)}
 </select>
 </div>
 {filtered.length === 0 ? (
 <div style={{textAlign:'center',padding:'60px 20px',color:'var(--muted)'}}>No peers match your filters</div>
 ) : (
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
 {filtered.map(p=>(
 <PeerCard key={p.id} peer={p} connected={connected.has(p.id)} onConnect={handleConnect} onDM={setDmPeer}/>
 ))}
 </div>
 )}
 </div>
 )}

 {/* ── Referrals ── */}
 {tab==='referrals' && (
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
 {MOCK_JOBS.map(j=>(
 <ReferralCard key={j.id} job={j} onDM={setDmPeer} onApply={()=>toast?.('Opening job listing…')}/>
 ))}
 <div style={{background:'var(--p25)',border:'2px dashed var(--p200)',borderRadius:16,padding:'30px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:10,cursor:'pointer'}}
 onClick={()=>toast?.('Post a job opening to your network')}>
 <div style={{width:40,height:40,borderRadius:10,background:'var(--p100)',display:'flex',alignItems:'center',justifyContent:'center'}}>
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--p500)" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
 </div>
 <div style={{fontWeight:700,fontSize:13.5,color:'var(--p600)'}}>Post a referral opening</div>
 <div style={{fontSize:12,color:'var(--muted)',textAlign:'center'}}>Know of a role? Share it with your network and offer a referral.</div>
 </div>
 </div>
 )}

 {/* ── Feed ── */}
 {tab==='feed' && (
 <div style={{maxWidth:620,margin:'0 auto',display:'flex',flexDirection:'column',gap:14}}>
 {/* Compose */}
 <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:16,padding:'14px 16px'}}>
 <textarea value={newPost} onChange={e=>setNewPost(e.target.value)}
 placeholder="Share an update, tip, or opportunity with your network…"
 style={{width:'100%',minHeight:72,resize:'none',border:'none',background:'transparent',color:'var(--ink)',fontSize:13.5,lineHeight:1.6,outline:'none',fontFamily:'var(--sans)',boxSizing:'border-box'}}
 />
 <div style={{display:'flex',justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid var(--faint2)'}}>
 <button onClick={handlePost} disabled={!newPost.trim()} style={{padding:'7px 18px',borderRadius:9,border:'none',background:newPost.trim()?'var(--p500)':'var(--faint)',cursor:newPost.trim()?'pointer':'default',fontSize:13,fontWeight:700,color:newPost.trim()?'#fff':'var(--muted)',fontFamily:'var(--sans)'}}>Post</button>
 </div>
 </div>
 {feed.map(p=><FeedPost key={p.id} post={p} liked={liked.has(p.id)} onLike={handleLike}/>)}
 </div>
 )}

 {/* ── My Connections ── */}
 {tab==='my' && (
 <div>
 {connected.size === 0 ? (
 <div style={{textAlign:'center',padding:'60px 20px'}}>
 <div style={{fontSize:40,marginBottom:12}}></div>
 <div style={{fontFamily:'var(--serif)',fontSize:20,fontWeight:700,color:'var(--ink)',marginBottom:8}}>No connections yet</div>
 <div style={{fontSize:13.5,color:'var(--muted)',marginBottom:20}}>Go to Discover to connect with peers in your field</div>
 <button onClick={()=>setTab('discover')} style={{padding:'10px 22px',borderRadius:10,background:'var(--p500)',border:'none',cursor:'pointer',color:'#fff',fontWeight:700,fontFamily:'var(--sans)'}}>Discover People</button>
 </div>
 ) : (
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
 {MOCK_PEERS.filter(p=>connected.has(p.id)).map(p=>(
 <PeerCard key={p.id} peer={p} connected={true} onConnect={handleConnect} onDM={setDmPeer}/>
 ))}
 </div>
 )}
 </div>
 )}

 </div>

 {/* DM Modal */}
 {dmPeer && <DMModal peer={dmPeer} onClose={()=>setDmPeer(null)}/>}
 </div>
 );
}
