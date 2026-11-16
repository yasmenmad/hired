import React, { useState, useEffect } from 'react';
import { auth } from '../../infrastructure/api/apiClient';

const TABS = ['Profile','Experience','Skills','Settings'];
const STATUS_OPTIONS = ['Open to Work','Not Looking','Open to Freelance','Casually Browsing'];
const STATUS_C = {'Open to Work':'#0f7a4a','Not Looking':'#9a1f1f','Open to Freelance':'var(--p600)','Casually Browsing':'#8a5a0a'};
const STATUS_BG = {'Open to Work':'#e4f7ee','Not Looking':'#fce8e8','Open to Freelance':'var(--p50)','Casually Browsing':'#fdf3e0'};
const JOB_TYPES = ['Full-time','Remote','Freelance','Contract'];
const AVAIL = ['Available now','2 weeks notice','1 month notice','Not looking'];

function Toggle({ on, onChange }) {
 return (
 <button onClick={()=>onChange(!on)} style={{width:46,height:26,borderRadius:50,border:'none',cursor:'pointer',position:'relative',background:on?'var(--p500)':'var(--faint)',transition:'background .22s',padding:0}}>
 <span style={{position:'absolute',top:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left .22s cubic-bezier(.34,1.56,.64,1)',left:on?23:3,boxShadow:'0 2px 6px rgba(0,0,0,.2)'}}/>
 </button>
 );
}

export default function ProfilePage({ toast, user, setUser }) {
 const [tab, setTab] = useState('Profile');
 const [status, setStatus] = useState(0);
 const [saving, setSaving] = useState(false);
 const [saved, setSaved] = useState(false);
 const [profile, setProfile] = useState({
 name: user?.name || '',
 title: user?.title || '',
 location: user?.location || '',
 bio: user?.bio || '',
 });
 const [skills, setSkills] = useState(user?.skills || []);
 const [newSkill, setNewSkill] = useState('');
 const [jobTypes, setJobTypes] = useState(['Full-time','Remote']);
 const [avail, setAvail] = useState('Available now');
 const [notifs, setNotifs] = useState({matches:true,updates:true,reminders:true,platform:false});
 const [twoFA, setTwoFA] = useState(false);

 // Keep local in sync if parent user changes
 useEffect(() => {
 if (user) {
 setProfile({ name:user.name||'', title:user.title||'', location:user.location||'', bio:user.bio||'' });
 setSkills(user.skills||[]);
 }
 }, [user]);

 async function save() {
 setSaving(true);
 try {
 const updated = await auth.updateProfile({ ...profile, skills });
 if (setUser) setUser(updated);
 setSaved(true);
 toast(' Profile saved');
 setTimeout(() => setSaved(false), 2200);
 } catch(e) {
 toast('Save failed — check backend connection');
 }
 setSaving(false);
 }

 function addSkill() {
 if (!newSkill.trim()) return;
 setSkills(s => [...s, newSkill.trim()]);
 setNewSkill('');
 }

 const initials = (profile.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
 const cur = STATUS_OPTIONS[status];

 return (
 <div style={{flex:1,overflowY:'auto'}}>
 <div style={{maxWidth:940,margin:'0 auto',padding:'24px 24px 64px'}}>

 {/* Profile hero */}
 <div style={{borderRadius:28,overflow:'hidden',marginBottom:22,boxShadow:'0 6px 32px rgba(98,71,212,.1)'}}>
 <div style={{height:110,background:'linear-gradient(135deg,var(--p800) 0%,var(--p500) 55%,#a855f7 100%)',position:'relative',overflow:'hidden'}}>
 <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 80% 50%,rgba(255,255,255,.1) 0%,transparent 55%)'}}/>
 </div>
 <div style={{background:'var(--surface)',padding:'0 28px 24px',borderBottom:'1.5px solid var(--faint)'}}>
 <div style={{display:'flex',alignItems:'flex-end',gap:20,marginTop:-38}}>
 <div style={{width:88,height:88,borderRadius:24,background:'linear-gradient(135deg,var(--p400),var(--p700))',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--serif)',fontSize:30,fontWeight:900,color:'#fff',border:'5px solid var(--surface)',flexShrink:0}}>
 {initials}
 </div>
 <div style={{flex:1,paddingBottom:6}}>
 <div style={{fontFamily:'var(--serif)',fontSize:24,fontWeight:800,color:'var(--ink)',letterSpacing:-.6,marginBottom:3}}>{profile.name||'Your Name'}</div>
 <div style={{fontSize:13,color:'var(--muted)',marginBottom:10}}>{profile.title||'Your Title'} {profile.location?'· '+profile.location:''}</div>
 <div style={{display:'flex',alignItems:'center',gap:8}}>
 <button onClick={()=>setStatus(s=>(s+1)%STATUS_OPTIONS.length)} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'6px 16px',borderRadius:50,fontSize:11.5,fontWeight:800,cursor:'pointer',border:`1.5px solid ${STATUS_C[cur]}44`,background:STATUS_BG[cur],color:STATUS_C[cur]}}>
 <span style={{width:7,height:7,borderRadius:'50%',background:STATUS_C[cur]}}/>{cur}
 </button>
 {user?.plan && <span style={{padding:'4px 12px',borderRadius:50,fontSize:11,fontWeight:700,background:'var(--p100)',color:'var(--p600)'}}>{user.plan} plan</span>}
 </div>
 </div>
 <div style={{display:'flex',gap:24,paddingBottom:8}}>
 {[['0','Saved Jobs'],['0','Applied'],['—','Avg Match']].map(([v,l])=>(
 <div key={l} style={{textAlign:'center'}}>
 <div style={{fontFamily:'var(--serif)',fontSize:22,fontWeight:900,color:'var(--ink)',letterSpacing:-1}}>{v}</div>
 <div style={{fontSize:10,color:'var(--muted)',fontWeight:600,marginTop:2}}>{l}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Tab nav */}
 <div style={{display:'flex',gap:3,marginBottom:20,padding:'5px',background:'var(--surface)',borderRadius:16,border:'1.5px solid var(--faint)'}}>
 {TABS.map(t=>(
 <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'10px 14px',borderRadius:12,border:'none',fontWeight:700,fontSize:13,cursor:'pointer',transition:'all .2s',background:tab===t?'var(--p500)':'transparent',color:tab===t?'#fff':'var(--muted)'}}>
 {t}
 </button>
 ))}
 </div>

 {/* PROFILE */}
 {tab==='Profile' && (
 <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:24,padding:'28px 32px'}}>
 <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--p500)',marginBottom:22}}>Personal Information</div>
 <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
 {[['Full Name','name','text'],['Professional Title','title','text'],['Location','location','text'],['Bio (short)','bio','text']].map(([label,key,type])=>(
 <div key={key} style={key==='bio'?{gridColumn:'span 2'}:{}}>
 <label className="field-lbl">{label}</label>
 {key==='bio'
 ? <textarea className="field-input" rows={3} value={profile[key]} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))} style={{resize:'vertical'}}/>
 : <input className="field-input" style={{padding:'12px 14px',fontSize:13.5}} type={type} value={profile[key]} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))}/>
 }
 </div>
 ))}
 </div>
 <div style={{display:'flex',gap:10,alignItems:'center'}}>
 <button onClick={save} disabled={saving} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'12px 28px',borderRadius:50,border:'none',cursor:'pointer',fontWeight:700,fontSize:13.5,transition:'all .25s',background:saved?'#0f7a4a':'linear-gradient(135deg,var(--p400),var(--p700))',color:'#fff',opacity:saving?.7:1}}>
 {saving?'Saving…':saved?' Saved!':'Save to Account'}
 </button>
 {user?.email && <span style={{fontSize:12,color:'var(--muted)'}}>Logged in as {user.email}</span>}
 </div>
 </div>
 )}

 {/* SKILLS */}
 {tab==='Skills' && (
 <div style={{display:'flex',flexDirection:'column',gap:14}}>
 <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:24,padding:'24px 28px'}}>
 <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--p500)',marginBottom:18}}>Your Skills</div>
 <div style={{display:'flex',flexWrap:'wrap',gap:9,marginBottom:20}}>
 {skills.map(sk=>(
 <span key={sk} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:50,fontSize:13,fontWeight:700,background:'var(--p100)',color:'var(--p700)',border:'1.5px solid var(--p200)'}}>
 {sk}
 <button onClick={()=>setSkills(s=>s.filter(x=>x!==sk))} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:16,color:'var(--p400)',lineHeight:1,padding:0}}>×</button>
 </span>
 ))}
 </div>
 <div style={{display:'flex',gap:10}}>
 <input className="field-input" style={{flex:1}} placeholder="Add a skill…" value={newSkill} onChange={e=>setNewSkill(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill()}/>
 <button className="btn btn-primary btn-sm" onClick={addSkill} style={{borderRadius:50,padding:'10px 20px'}}>Add</button>
 </div>
 </div>
 <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:24,padding:'24px 28px'}}>
 <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--p500)',marginBottom:18}}>Job Preferences</div>
 <label className="field-lbl" style={{marginBottom:10}}>Preferred Job Types</label>
 <div style={{display:'flex',gap:9,flexWrap:'wrap',marginBottom:22}}>
 {JOB_TYPES.map(jt=>(
 <button key={jt} onClick={()=>setJobTypes(t=>t.includes(jt)?t.filter(x=>x!==jt):[...t,jt])} style={{padding:'9px 20px',borderRadius:50,fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .18s',border:`2px solid ${jobTypes.includes(jt)?'var(--p500)':'var(--faint)'}`,color:jobTypes.includes(jt)?'var(--p600)':'var(--muted)',background:jobTypes.includes(jt)?'var(--p100)':'transparent'}}>{jt}</button>
 ))}
 </div>
 <label className="field-lbl">Availability</label>
 <select className="field-input" value={avail} onChange={e=>setAvail(e.target.value)}>
 {AVAIL.map(o=><option key={o}>{o}</option>)}
 </select>
 </div>
 <button onClick={save} disabled={saving} className="btn btn-primary" style={{borderRadius:50,width:'fit-content'}}>
 {saving?'Saving…':saved?' Saved!':'Save Skills & Preferences'}
 </button>
 </div>
 )}

 {/* SETTINGS */}
 {tab==='Settings' && (
 <div style={{display:'flex',flexDirection:'column',gap:14}}>
 <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:24,padding:'24px 28px'}}>
 <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--p500)',marginBottom:20}}>Notifications</div>
 {[['matches','New job matches','Get notified when new jobs match your profile'],['updates','Application updates','Status changes on submitted applications'],['reminders','Interview reminders','Reminders before scheduled interviews'],['platform','Platform updates','News and feature updates']].map(([key,lbl,desc])=>(
 <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderBottom:'1px solid var(--faint)'}}>
 <div>
 <div style={{fontSize:14,fontWeight:700,color:'var(--ink)',marginBottom:3}}>{lbl}</div>
 <div style={{fontSize:12,color:'var(--muted)'}}>{desc}</div>
 </div>
 <Toggle on={notifs[key]} onChange={v=>setNotifs(n=>({...n,[key]:v}))}/>
 </div>
 ))}
 </div>
 <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:24,padding:'24px 28px'}}>
 <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--p500)',marginBottom:18}}>Account</div>
 <div style={{fontSize:13,color:'var(--muted)',marginBottom:16}}>Logged in as: <strong style={{color:'var(--ink)'}}>{user?.email}</strong></div>
 <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
 <button className="btn btn-outline btn-sm" style={{borderRadius:50}} onClick={()=>toast('Data export requested')}>Export My Data</button>
 </div>
 </div>
 </div>
 )}

 {/* EXPERIENCE tab */}
 {tab==='Experience' && (
 <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:24,padding:'28px 32px',textAlign:'center',color:'var(--muted)'}}>
 <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>Experience section</div>
 <div style={{fontSize:12}}>Coming soon — for now use the Bio field in Profile tab to describe your experience.</div>
 </div>
 )}
 </div>
 </div>
 );
}
