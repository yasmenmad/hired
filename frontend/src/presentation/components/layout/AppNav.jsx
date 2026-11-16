import React, { useState, useEffect } from 'react';
import { checkBackend } from '../../../infrastructure/api/apiClient';

const TABS = [
  {id:'jobs',      label:'Feed'},
  {id:'cv',        label:'CV'},
  {id:'tracker',   label:'Tracker'},
  {id:'map',       label:'Map'},
  {id:'interview', label:'Interview'},
  {id:'chat',      label:'Chat'},
  {id:'test',      label:'Test'},
  {id:'salary',    label:'Salary'},
  {id:'network',   label:'Network'},
  {id:'roadmap',   label:'Roadmap'},
];

const NOTIFS = [
  {t:'Strong match found',  d:'AstroAI — AI Engineer · 96% match',    time:'2m',  dot:'var(--green)', unread:true},
  {t:'Application update',  d:'Stripe PM moved to Interview stage',    time:'1h',  dot:'var(--amber)', unread:true},
  {t:'Interview reminder',  d:'Mistral AI session tomorrow 10am',      time:'3h',  dot:'var(--blue)',  unread:false},
  {t:'New feature',         d:'Salary AI v2 now available',            time:'1d',  dot:'var(--p500)',  unread:false},
];

export default function AppNav({ activeTab, onTabChange, onExit, isAdmin=false, adminMode=true, onToggleAdminMode=null, userName='Yasmine Daoudi', dark, onToggleDark }) {
  const [dropdown,  setDropdown]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [read,      setRead]      = useState(false);
  const [backendLive, setBackendLive] = useState(false);

  useEffect(() => {
    checkBackend().then(setBackendLive);
    const interval = setInterval(() => checkBackend().then(setBackendLive), 30000);
    return () => clearInterval(interval);
  }, []);

  const initials  = userName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const firstName = userName.split(' ')[0];
  const unread    = NOTIFS.filter(n=>n.unread).length;

  return (
    <nav style={{
      height:56, flexShrink:0,
      display:'flex', alignItems:'center',
      padding:'0 20px',
      background:'var(--surface)',
      borderBottom:'1.5px solid var(--faint)',
      boxShadow:'0 1px 0 var(--faint)',
      gap:2, position:'relative', zIndex:100,
    }}>

      {/* Logo */}
      <div onClick={()=>onTabChange(isAdmin?'admin':'jobs')}
        style={{fontFamily:'var(--serif)',fontSize:21,fontWeight:800,color:'var(--p600)',marginRight:10,cursor:'pointer',letterSpacing:-1,userSelect:'none',flexShrink:0}}>
        Hired.
      </div>

      {/* Divider */}
      <div style={{width:1,height:22,background:'var(--faint)',margin:'0 8px',flexShrink:0}}/>

      {/* Backend status badge */}
      <div title={backendLive ? 'API connected — live jobs & AI active' : 'Client-side interactive demo engine active'}
        style={{display:'flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:50,fontSize:10.5,fontWeight:700,background:'var(--greenl)',color:'var(--green)',flexShrink:0,cursor:'default',border:`1px solid ${backendLive?'rgba(15,122,74,.2)':'rgba(138,90,10,.2)'}`}}>
        <span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block',animation:'pulse 2s ease-in-out infinite'}}/>
        {backendLive ? 'API Live' : 'Interactive Demo'}
      </div>

      {/* Tabs */}
      {(!isAdmin || !adminMode) ? (
        TABS.map(t=>(
          <button key={t.id} onClick={()=>onTabChange(t.id)}
            className={`a-tab${activeTab===t.id?' on':''}`}
            style={{
              padding:'7px 13px', borderRadius:9, border:'none',
              fontSize:13, fontWeight:activeTab===t.id?700:600,
              color:activeTab===t.id?'var(--p600)':'var(--muted)',
              background:activeTab===t.id?'var(--p100)':'transparent',
              cursor:'pointer', transition:'all .15s',
              fontFamily:'var(--sans)', whiteSpace:'nowrap',
            }}
            onMouseEnter={e=>{if(activeTab!==t.id){e.currentTarget.style.color='var(--p600)';e.currentTarget.style.background='var(--p50)';}}}
            onMouseLeave={e=>{if(activeTab!==t.id){e.currentTarget.style.color='var(--muted)';e.currentTarget.style.background='transparent';}}}>
            {t.label}
          </button>
        ))
      ) : (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:7,padding:'5px 14px',borderRadius:9,background:'var(--p100)',border:'1.5px solid var(--p200)'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block',animation:'pulse 2s ease-in-out infinite'}}/>
            <span style={{fontSize:12.5,fontWeight:700,color:'var(--p600)',letterSpacing:'.01em'}}>Admin Console</span>
          </div>
          {onToggleAdminMode && (
            <button onClick={onToggleAdminMode}
              title={adminMode ? 'Preview user interface' : 'Back to Admin Console'}
              style={{padding:'5px 11px',borderRadius:9,border:'1.5px solid var(--faint)',background:adminMode?'transparent':'var(--p100)',cursor:'pointer',fontSize:11.5,fontWeight:700,color:adminMode?'var(--muted)':'var(--p600)',fontFamily:'var(--sans)',display:'flex',alignItems:'center',gap:5,transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--p300)';e.currentTarget.style.color='var(--p600)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--faint)';e.currentTarget.style.color=adminMode?'var(--muted)':'var(--p600)';}}>
              {adminMode ? (
                <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Preview User View</>
              ) : (
                <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Back to Admin</>
              )}
            </button>
          )}
        </div>
      )}

      <div style={{flex:1}}/>

      {/* Right controls */}
      <div style={{display:'flex',alignItems:'center',gap:5}}>

        {/* Dark mode toggle */}
        <button onClick={onToggleDark}
          style={{width:34,height:34,borderRadius:9,border:'1.5px solid var(--faint)',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',transition:'all .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--p50)';e.currentTarget.style.borderColor='var(--p300)';e.currentTarget.style.color='var(--p500)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='var(--faint)';e.currentTarget.style.color='var(--muted)';}}>
          {dark
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
        </button>

        {/* Notifications */}
        <div style={{position:'relative'}}>
          <button onClick={()=>{setNotifOpen(v=>!v);setRead(true);setDropdown(false);}}
            style={{width:34,height:34,borderRadius:9,border:`1.5px solid ${notifOpen?'var(--p300)':'var(--faint)'}`,background:notifOpen?'var(--p50)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:notifOpen?'var(--p500)':'var(--muted)',position:'relative',transition:'all .15s'}}
            onMouseEnter={e=>{if(!notifOpen){e.currentTarget.style.background='var(--p50)';e.currentTarget.style.borderColor='var(--p300)';e.currentTarget.style.color='var(--p500)';}}}
            onMouseLeave={e=>{if(!notifOpen){e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='var(--faint)';e.currentTarget.style.color='var(--muted)';}}}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {!read && unread>0 && (
              <span style={{position:'absolute',top:4,right:4,width:16,height:16,borderRadius:'50%',background:'var(--red)',color:'#fff',fontSize:8.5,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid var(--surface)'}}>{unread}</span>
            )}
          </button>

          {notifOpen && <>
            <div style={{position:'fixed',inset:0,zIndex:150}} onClick={()=>setNotifOpen(false)}/>
            <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,width:340,background:'var(--surface)',borderRadius:18,border:'1.5px solid var(--faint)',boxShadow:'var(--sh-lg)',zIndex:200,overflow:'hidden',animation:'slideDown .2s ease'}}>
              <div style={{padding:'13px 16px',borderBottom:'1.5px solid var(--faint)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--p25)'}}>
                <span style={{fontFamily:'var(--serif)',fontWeight:800,fontSize:14,color:'var(--ink)'}}>Notifications</span>
                <span style={{fontSize:11.5,color:'var(--p500)',fontWeight:700,cursor:'pointer'}} onClick={()=>setRead(true)}>Mark all read</span>
              </div>
              {NOTIFS.map((n,i)=>(
                <div key={i} style={{padding:'12px 16px',borderBottom:'1px solid var(--faint2)',display:'flex',gap:11,alignItems:'flex-start',cursor:'pointer',background:(n.unread&&!read)?'var(--p25)':'var(--surface)',transition:'background .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--p25)'}
                  onMouseLeave={e=>e.currentTarget.style.background=(n.unread&&!read)?'var(--p25)':'var(--surface)'}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:n.dot,flexShrink:0,marginTop:5}}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:12.5,color:'var(--ink)',marginBottom:2}}>{n.t}</div>
                    <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.5}}>{n.d}</div>
                  </div>
                  <div style={{fontSize:10.5,color:'var(--muted)',whiteSpace:'nowrap',marginTop:2}}>{n.time} ago</div>
                </div>
              ))}
              <div style={{padding:'10px 16px',textAlign:'center',fontSize:12.5,color:'var(--p500)',fontWeight:700,cursor:'pointer',background:'var(--p25)',borderTop:'1px solid var(--faint)'}}>View all notifications</div>
            </div>
          </>}
        </div>

        {/* Profile avatar */}
        <div style={{position:'relative'}}>
          <div onClick={()=>{setDropdown(v=>!v);setNotifOpen(false);}}
            style={{display:'flex',alignItems:'center',gap:8,padding:'5px 10px 5px 5px',borderRadius:10,cursor:'pointer',transition:'background .15s',border:'1.5px solid var(--faint)',background:dropdown?'var(--p50)':'transparent'}}
            onMouseEnter={e=>{if(!dropdown){e.currentTarget.style.background='var(--p50)';e.currentTarget.style.borderColor='var(--p300)';}}}
            onMouseLeave={e=>{if(!dropdown){e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='var(--faint)';}}}
          >
            <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,var(--p400),var(--p600))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',fontFamily:'var(--serif)',flexShrink:0}}>
              {initials}
            </div>
            <span style={{fontSize:13,fontWeight:700,color:'var(--ink)'}}>{firstName}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" style={{transition:'transform .15s',transform:dropdown?'rotate(180deg)':'none'}}><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          {dropdown && <>
            <div style={{position:'fixed',inset:0,zIndex:150}} onClick={()=>setDropdown(false)}/>
            <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,width:220,background:'var(--surface)',borderRadius:14,border:'1.5px solid var(--faint)',boxShadow:'var(--sh-lg)',zIndex:200,overflow:'hidden',animation:'slideDown .2s ease'}}>
              <div style={{padding:'13px 16px 11px',borderBottom:'1px solid var(--faint)',background:'var(--p25)'}}>
                <div style={{fontWeight:700,fontSize:13.5,color:'var(--ink)',marginBottom:1}}>{userName}</div>
                <div style={{fontSize:11.5,color:'var(--muted)'}}>yasmine@hired.ai</div>
              </div>
              {[['My Profile','profile'],['My CV','cv'],['My Applications','tracker'],['Settings','profile']].map(([l,t])=>(
                <button key={l} onClick={()=>{onTabChange(t);setDropdown(false);}}
                  style={{width:'100%',display:'flex',alignItems:'center',padding:'10px 16px',border:'none',background:'transparent',fontSize:13,fontWeight:500,color:'var(--ink)',textAlign:'left',cursor:'pointer',fontFamily:'var(--sans)',transition:'background .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--p25)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  {l}
                </button>
              ))}
              <div style={{borderTop:'1px solid var(--faint)'}}>
                <button onClick={onExit}
                  style={{width:'100%',display:'flex',alignItems:'center',padding:'10px 16px',border:'none',background:'transparent',fontSize:13,fontWeight:700,color:'var(--red)',textAlign:'left',cursor:'pointer',fontFamily:'var(--sans)',transition:'background .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--redl)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  Sign Out
                </button>
              </div>
            </div>
          </>}
        </div>
      </div>
    </nav>
  );
}
