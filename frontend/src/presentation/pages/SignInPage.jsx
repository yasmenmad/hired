import React, { useState } from 'react';
import { auth } from '../../infrastructure/api/apiClient';

function StrengthBar({ pw }) {
  const checks = [pw.length>=8,/[A-Z]/.test(pw),/[0-9]/.test(pw),/[^a-zA-Z0-9]/.test(pw)];
  const score  = checks.filter(Boolean).length;
  const labels = ['','Too weak','Fair','Good','Strong'];
  const colors = ['','var(--red)','var(--amber)','var(--blue)','var(--green)'];
  return (
    <div style={{marginTop:6}}>
      <div style={{display:'flex',gap:3,marginBottom:4}}>
        {[0,1,2,3].map(i=><div key={i} style={{flex:1,height:3,borderRadius:3,transition:'background .3s',background:i<score?colors[score]:'var(--faint)'}}/>)}
      </div>
      {pw && <div style={{fontSize:10.5,fontWeight:700,color:colors[score]}}>{labels[score]}</div>}
    </div>
  );
}

export default function SignInPage({ onSignIn, onBack }) {
  const [mode,  setMode]  = useState('in');
  const [email, setEmail] = useState('');
  const [pw,    setPw]    = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [err,   setErr]   = useState('');
  const [loading,setLoad] = useState(false);

  async function doSignIn() {
    if (!email||!pw) { setErr('Please fill in all fields.'); return; }
    setLoad(true); setErr('');
    try {
      const data = await auth.login({ email, password: pw });
      onSignIn(data.user);
    } catch(e) {
      setErr(e.message || 'Invalid email or password');
    }
    setLoad(false);
  }

  async function doSignUp() {
    if (!fname||!lname||!email||!pw) { setErr('Please fill in all fields.'); return; }
    if (pw.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    setLoad(true); setErr('');
    try {
      const data = await auth.register({ email, password: pw, name: `${fname} ${lname}` });
      onSignIn(data.user);
    } catch(e) {
      setErr(e.message || 'Registration failed');
    }
    setLoad(false);
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',minHeight:'100vh'}}>
      {/* Left panel */}
      <div style={{background:'linear-gradient(145deg,#0f0826 0%,#1a0f4a 40%,#2d1069 100%)',display:'flex',flexDirection:'column',justifyContent:'center',padding:'60px 72px',position:'relative',overflow:'hidden',minHeight:'100vh'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M40 40c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm20 0c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <div style={{fontFamily:'var(--serif)',fontSize:24,fontWeight:800,color:'rgba(255,255,255,.95)',marginBottom:60,letterSpacing:-1}}>Hired.</div>
          <div style={{fontFamily:'var(--serif)',fontSize:'clamp(36px,4vw,52px)',fontWeight:800,color:'#fff',lineHeight:1.08,letterSpacing:-1.5,marginBottom:18}}>
            Your career,<br/><em style={{color:'var(--p200)',fontStyle:'normal'}}>accelerated.</em>
          </div>
          <p style={{fontSize:14,color:'rgba(255,255,255,.5)',lineHeight:1.75,maxWidth:340,marginBottom:36}}>AI-powered matching across 42,000+ roles. CV optimizer, interview coach, salary intelligence.</p>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {['AI Match Engine — ranks 42k+ jobs for your exact fit','CV Optimizer — boost ATS score from 62% to 91%','Salary Negotiation — $17k average salary increase','Interview Coach — real Groq AI questions + scoring'].map(f=>(
              <div key={f} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'rgba(255,255,255,.8)',fontWeight:500}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:'rgba(167,139,250,.9)',flexShrink:0}}/>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{background:'var(--surface)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'60px 64px',overflowY:'auto',minHeight:'100vh'}}>
        <div style={{width:'100%',maxWidth:420}}>
          <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,fontWeight:700,color:'var(--p500)',background:'none',border:'none',cursor:'pointer',marginBottom:32,padding:0,fontFamily:'var(--sans)'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Hired.
          </button>

          <div style={{fontFamily:'var(--serif)',fontSize:32,fontWeight:800,letterSpacing:-.5,marginBottom:5,color:'var(--ink)'}}>
            {mode==='in'?'Welcome back':'Create account'}
          </div>
          <div style={{fontSize:14,color:'var(--muted)',marginBottom:28}}>
            {mode==='in'?'Sign in to your Hired. dashboard':'Join thousands of professionals already hired'}
          </div>

          {/* Tab */}
          <div style={{display:'flex',background:'var(--faint2)',borderRadius:50,padding:3,marginBottom:28}}>
            {['in','up'].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr('');}} style={{flex:1,padding:'9px',borderRadius:50,border:'none',fontFamily:'var(--sans)',fontWeight:700,fontSize:13.5,cursor:'pointer',transition:'all .2s',background:mode===m?'var(--surface)':'transparent',color:mode===m?'var(--ink)':'var(--muted)',boxShadow:mode===m?'0 1px 4px rgba(0,0,0,.08)':'none'}}>
                {m==='in'?'Sign In':'Sign Up'}
              </button>
            ))}
          </div>

          {mode==='in' && (
            <div>
              <div style={{marginBottom:14}}>
                <label className="field-lbl">Email address</label>
                <input className="field-input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSignIn()}/>
              </div>
              <div style={{marginBottom:18}}>
                <label className="field-lbl">Password</label>
                <input className="field-input" type="password" placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSignIn()}/>
              </div>
              {err && <div style={{fontSize:12.5,fontWeight:600,marginBottom:14,padding:'10px 14px',borderRadius:9,color:'var(--red)',background:'var(--redl)'}}>{err}</div>}
              <button onClick={doSignIn} disabled={loading} style={{width:'100%',padding:14,background:'var(--p500)',color:'#fff',border:'none',borderRadius:50,fontSize:15,fontWeight:700,cursor:'pointer',transition:'all .18s',fontFamily:'var(--sans)',opacity:loading?.7:1}}>
                {loading?'Signing in…':'Sign in'}
              </button>
              <div style={{textAlign:'center',marginTop:18,fontSize:12,color:'var(--muted)',padding:'10px',background:'var(--p25)',borderRadius:8,border:'1px solid var(--faint)'}}>
                Admin: <strong style={{color:'var(--p600)'}}>admin@hired.ai</strong> / <strong style={{color:'var(--p600)'}}>admin123</strong>
              </div>
            </div>
          )}

          {mode==='up' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label className="field-lbl">First Name</label><input className="field-input" placeholder="Yasmine" value={fname} onChange={e=>setFname(e.target.value)}/></div>
                <div><label className="field-lbl">Last Name</label><input className="field-input" placeholder="Daoudi" value={lname} onChange={e=>setLname(e.target.value)}/></div>
              </div>
              <div style={{marginBottom:12}}><label className="field-lbl">Email</label><input className="field-input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
              <div style={{marginBottom:18}}>
                <label className="field-lbl">Password</label>
                <input className="field-input" type="password" placeholder="8+ characters" value={pw} onChange={e=>setPw(e.target.value)}/>
                <StrengthBar pw={pw}/>
              </div>
              {err && <div style={{fontSize:12.5,fontWeight:600,marginBottom:14,padding:'10px 14px',borderRadius:9,color:'var(--red)',background:'var(--redl)'}}>{err}</div>}
              <button onClick={doSignUp} disabled={loading} style={{width:'100%',padding:14,background:'var(--p500)',color:'#fff',border:'none',borderRadius:50,fontSize:15,fontWeight:700,cursor:'pointer',transition:'all .18s',fontFamily:'var(--sans)',marginBottom:12,opacity:loading?.7:1}}>
                {loading?'Creating account…':'Create Account'}
              </button>
              <div style={{textAlign:'center',fontSize:11,color:'var(--muted)'}}>By signing up you agree to our Terms & Privacy Policy</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
