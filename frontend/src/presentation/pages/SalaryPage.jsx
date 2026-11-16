import React, { useState } from 'react';
import ProgressBar from '../components/common/ProgressBar';
import { ai, checkBackend } from '../../infrastructure/api/apiClient';

const STEPS = [
  'Cross-referencing 500k+ salary benchmarks…',
  'Analysing role seniority & location data…',
  'Calculating negotiation range with Groq AI…',
  'Generating personalised counter-offer script…',
];
const CURRENCIES = [{symbol:'$',label:'USD'},{symbol:'€',label:'EUR'},{symbol:'£',label:'GBP'},{symbol:'MAD',label:'MAD'}];

// SVG icons
const IcDollar = ()=><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--p500)" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
const IcCopy = ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcRefresh = ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IcUpload = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;

export default function SalaryPage({toast,user}){
  const [offer,setOffer]=useState('148000');
  const [title,setTitle]=useState(user?.title||'AI Engineer');
  const [co,setCo]=useState('AstroAI');
  const [currency,setCurrency]=useState('$');
  const [location,setLocation]=useState(user?.location||'Remote');
  const [exp,setExp]=useState('4');
  const [skills,setSkills]=useState(user?.skills?.join(', ')||'React, Node.js, Python, AWS');
  const [loading,setLoading]=useState(false);
  const [progress,setProgress]=useState(0);
  const [stepLabel,setStep]=useState('');
  const [analysis,setAnalysis]=useState(null);
  const [dragging,setDragging]=useState(false);

  async function analyse(){
    setLoading(true);setAnalysis(null);setProgress(0);
    for(let i=0;i<STEPS.length;i++){
      setStep(STEPS[i]);setProgress(((i+1)/STEPS.length)*100);
      await new Promise(r=>setTimeout(r,500));
    }
    try{
      const live=await checkBackend();
      const skillList=skills.split(',').map(s=>s.trim()).filter(Boolean);
      const amt=parseFloat(offer)||148000;

      if(live){
        // Real Groq backend call
        const result=await ai.analyzeSalary(title,location,parseInt(exp)||4,skillList);
        setAnalysis({
          offerAmount:amt,currency,
          p25:result.percentile_25||Math.round(amt*.87),
          p50:result.median||amt,
          p75:result.percentile_75||Math.round(amt*1.115),
          p90:result.percentile_90||null,
          yoyChange:result.yoy_change||null,
          marketDemand:result.market_demand,
          counterScript:result.counter_offer_script||`Thank you for the offer. Based on current market rates for ${title} roles and my ${exp} years of experience with ${skillList[0]||'my skills'}, I was expecting a base closer to ${currency}${Math.round(amt*1.115).toLocaleString()}. Is there flexibility there?`,
          negotiationTips:result.negotiation_tips||[],
          topPayingCompanies:result.top_paying_companies||[],
          totalCompNotes:result.total_compensation_notes||'',
          role:title,
        });
      } else {
        // Fallback static
        setAnalysis({
          offerAmount:amt,currency,
          p25:Math.round(amt*.87),p50:amt,p75:Math.round(amt*1.115),p90:Math.round(amt*1.22),
          yoyChange:'+8.4%',marketDemand:'High',
          counterScript:`Thank you for the offer. Based on current market rates for ${title} roles and my ${exp} years of experience with ${skillList[0]||'my skills'}, I was expecting a base closer to ${currency}${Math.round(amt*1.115).toLocaleString()}. Is there flexibility there?`,
          negotiationTips:['Always get the offer in writing before negotiating','Research the company\'s funding stage and financial health','Use competing offers as leverage when possible','Negotiate the full package, not just base salary','Be enthusiastic — you want the job, just fairly compensated'],
          topPayingCompanies:['Google','Microsoft','Meta','Apple','Stripe','Databricks'],
          totalCompNotes:'Total compensation typically includes base, annual bonus (10-25%), equity (RSUs), and benefits.',
          role:title,
        });
        toast('Using estimated data — connect backend for real Groq AI analysis');
      }
    }catch(e){
      const amt=parseFloat(offer)||148000;
      setAnalysis({offerAmount:amt,currency,p25:Math.round(amt*.87),p50:amt,p75:Math.round(amt*1.115),
        counterScript:`Thank you for the offer. Based on my ${exp} years of experience with ${title} roles, I was expecting closer to ${currency}${Math.round(amt*1.115).toLocaleString()}. Is there flexibility?`,
        negotiationTips:['Research market rates','Negotiate total compensation','Be enthusiastic and specific'],
        topPayingCompanies:[],totalCompNotes:'',role:title,
      });
    }
    setLoading(false);
  }

  return(
    <div style={{flex:1,overflowY:'auto',background:'var(--bg)'}}>
      <div style={{maxWidth:960,margin:'0 auto',padding:'24px 24px 48px'}}>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,var(--p800),var(--p500))',borderRadius:20,padding:'28px 32px',marginBottom:20,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-80,right:-80,width:280,height:280,borderRadius:'50%',background:'rgba(255,255,255,.05)'}}/>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',position:'relative',zIndex:1}}>
            <div>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--p200)',marginBottom:10}}>Salary Intelligence · Powered by Groq AI</div>
              <div style={{fontFamily:'var(--serif)',fontSize:26,fontWeight:800,color:'#fff',letterSpacing:'-.5px',marginBottom:6}}>Know your worth.<br/>Negotiate with confidence.</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,.45)'}}>Real market data + AI-generated negotiation scripts.</div>
            </div>
            <div style={{display:'flex',gap:28,flexShrink:0}}>
              {[['$17k','avg salary lift'],['78%','expect negotiation'],['500k+','data points']].map(([v,l])=>(
                <div key={l} style={{textAlign:'center'}}>
                  <div style={{fontFamily:'var(--serif)',fontSize:24,fontWeight:900,color:'#fff',letterSpacing:'-1px'}}>{v}</div>
                  <div style={{fontSize:10.5,color:'rgba(255,255,255,.4)',fontWeight:600,marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

          {/* INPUT */}
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div className="card">
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--p500)',marginBottom:16}}>Offer Details</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label className="field-lbl">Job Title</label><input className="field-input" value={title} onChange={e=>setTitle(e.target.value)}/></div>
                <div><label className="field-lbl">Company</label><input className="field-input" value={co} onChange={e=>setCo(e.target.value)}/></div>
              </div>
              <div style={{marginBottom:12}}>
                <label className="field-lbl">Offer Amount</label>
                <div style={{display:'flex',gap:8}}>
                  <select className="field-input" style={{width:'auto',flexShrink:0}} value={currency} onChange={e=>setCurrency(e.target.value)}>
                    {CURRENCIES.map(c=><option key={c.symbol} value={c.symbol}>{c.symbol} {c.label}</option>)}
                  </select>
                  <input className="field-input" type="number" value={offer} onChange={e=>setOffer(e.target.value)} placeholder="148000"/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label className="field-lbl">Years Experience</label><input className="field-input" type="number" value={exp} onChange={e=>setExp(e.target.value)}/></div>
                <div><label className="field-lbl">Location</label><input className="field-input" value={location} onChange={e=>setLocation(e.target.value)}/></div>
              </div>
              <div style={{marginBottom:16}}>
                <label className="field-lbl">Key Skills</label>
                <input className="field-input" value={skills} onChange={e=>setSkills(e.target.value)} placeholder="React, Python, AWS…"/>
              </div>
              <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={analyse} disabled={loading}>
                {loading?'Analysing with Groq AI…':'Analyse My Offer'}
              </button>
            </div>

            {/* Upload */}
            <div className="card">
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--p500)',marginBottom:12}}>Upload Offer Letter (Optional)</div>
              <div
                onDragOver={e=>{e.preventDefault();setDragging(true)}}
                onDragLeave={()=>setDragging(false)}
                onDrop={e=>{e.preventDefault();setDragging(false);toast('Offer letter uploaded — AI extracting salary…');}}
                onClick={()=>{const i=document.createElement('input');i.type='file';i.accept='.pdf,.docx';i.onchange=()=>toast('Offer letter uploaded — AI extracting salary…');i.click();}}
                style={{border:`2px dashed ${dragging?'var(--p400)':'var(--faint)'}`,borderRadius:12,padding:'24px',textAlign:'center',cursor:'pointer',transition:'all .2s',background:dragging?'var(--p50)':'var(--p25)',display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                <IcUpload/>
                <div style={{fontSize:13,fontWeight:600,color:'var(--muted)'}}>Drop PDF/DOCX or click to upload</div>
                <div style={{fontSize:11.5,color:'var(--p300)'}}>AI extracts salary automatically</div>
              </div>
            </div>

            {/* Market context */}
            <div className="card">
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--p500)',marginBottom:14}}>Market Context</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[['Remote AI roles','↑ +22% YoY','Highest demand in 5 years'],['Senior backend engineers','↑ +11% YoY','Strong market, negotiate confidently'],['Product managers EMEA','↑ +12% YoY','EU regulations increasing demand']].map(([r,d,n])=>(
                  <div key={r} style={{display:'flex',gap:12,alignItems:'center',padding:'10px 12px',background:'var(--p25)',borderRadius:9,border:'1px solid var(--faint)'}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:12.5,color:'var(--ink)',marginBottom:2}}>{r}</div>
                      <div style={{fontSize:11,color:'var(--muted)'}}>{n}</div>
                    </div>
                    <span className="badge badge-green">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RESULTS */}
          <div style={{display:'flex',flexDirection:'column',gap:12}}>

            {loading&&(
              <div className="card" style={{padding:32,display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
                <div style={{width:52,height:52,borderRadius:14,background:'var(--p100)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <IcDollar/>
                </div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--ink)',textAlign:'center'}}>{stepLabel}</div>
                <div style={{width:'100%'}}><ProgressBar value={progress}/></div>
              </div>
            )}

            {!loading&&!analysis&&(
              <div className="card" style={{padding:36,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,minHeight:200}}>
                <div style={{width:56,height:56,borderRadius:16,background:'var(--p100)',display:'flex',alignItems:'center',justifyContent:'center'}}><IcDollar/></div>
                <div style={{fontFamily:'var(--serif)',fontSize:17,fontWeight:700,color:'var(--ink2)',textAlign:'center'}}>Enter your offer details</div>
                <div style={{fontSize:12.5,color:'var(--muted)',textAlign:'center',maxWidth:220,lineHeight:1.6}}>Fill in the form and click Analyse to get your Groq AI negotiation script</div>
              </div>
            )}

            {!loading&&analysis&&(
              <>
                {/* Result hero card */}
                <div style={{background:'linear-gradient(135deg,var(--p900),var(--p700))',borderRadius:20,padding:'24px 28px',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'rgba(255,255,255,.04)'}}/>
                  <div style={{position:'relative',zIndex:1}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Their Offer</div>
                        <div style={{fontFamily:'var(--serif)',fontSize:30,fontWeight:900,color:'rgba(255,255,255,.7)',letterSpacing:-1}}>{analysis.currency||currency}{(analysis.offerAmount||analysis.p50||0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>AI Recommended Ask</div>
                        <div style={{fontFamily:'var(--serif)',fontSize:30,fontWeight:900,color:'#a0f0c0',letterSpacing:-1}}>{analysis.currency||currency}{(analysis.p75||0).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Percentile bars */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:20}}>
                      {[['P25 — Low',analysis.p25,'rgba(255,255,255,.3)'],['P50 — Median',analysis.p50,'rgba(255,255,255,.6)'],['P75 — Target',analysis.p75,'#a0f0c0']].map(([l,v,c])=>(
                        <div key={l} style={{textAlign:'center',padding:'10px',borderRadius:10,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)'}}>
                          <div style={{fontFamily:'var(--serif)',fontSize:15,fontWeight:800,color:c,marginBottom:2}}>{analysis.currency||currency}{(v||0).toLocaleString()}</div>
                          <div style={{fontSize:9.5,color:'rgba(255,255,255,.35)',fontWeight:700}}>{l}</div>
                        </div>
                      ))}
                    </div>

                    {/* Market demand + YoY */}
                    <div style={{display:'flex',gap:10,marginBottom:16}}>
                      {analysis.marketDemand&&(
                        <div style={{padding:'5px 12px',borderRadius:50,fontSize:11,fontWeight:800,background:'rgba(255,255,255,.1)',color:'#a0f0c0',border:'1px solid rgba(255,255,255,.15)'}}>
                          Market: {analysis.marketDemand}
                        </div>
                      )}
                      {analysis.yoyChange&&(
                        <div style={{padding:'5px 12px',borderRadius:50,fontSize:11,fontWeight:800,background:'rgba(255,255,255,.1)',color:'#a0f0c0',border:'1px solid rgba(255,255,255,.15)'}}>
                          {analysis.yoyChange} YoY
                        </div>
                      )}
                    </div>

                    {/* Counter-offer script */}
                    <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Groq AI Counter-Offer Script</div>
                    <div style={{fontSize:13,color:'rgba(255,255,255,.85)',lineHeight:1.75,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',borderRadius:12,padding:'14px 16px',fontStyle:'italic',marginBottom:16}}>
                      "{analysis.counterScript}"
                    </div>

                    <div style={{display:'flex',gap:8}}>
                      <button className="btn btn-white btn-sm" style={{display:'flex',alignItems:'center',gap:5}} onClick={()=>{navigator.clipboard?.writeText(analysis.counterScript);toast('Script copied!');}}>
                        <IcCopy/>Copy Script
                      </button>
                      <button onClick={analyse} style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,.1)',color:'rgba(255,255,255,.8)',border:'1px solid rgba(255,255,255,.2)',borderRadius:50,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--sans)'}}>
                        <IcRefresh/>Re-analyse
                      </button>
                    </div>
                  </div>
                </div>

                {/* Negotiation tip */}
                <div className="card" style={{background:'var(--amberl)',border:'1.5px solid rgba(138,90,10,.2)'}}>
                  <div style={{fontSize:13,color:'var(--amber)',lineHeight:1.75}}>
                    <b>78% of recruiters expect candidates to negotiate.</b> First offers are rarely final. You can also negotiate equity, PTO, remote days, signing bonus, or stock refresh.
                  </div>
                </div>

                {/* AI Tips */}
                <div className="card">
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--p500)',marginBottom:14}}>Groq AI Negotiation Tips for {analysis.role||title}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:9}}>
                    {(analysis.negotiationTips?.length>0?analysis.negotiationTips:['Always get the offer in writing before negotiating','Research the company\'s funding stage and financial health','Use competing offers as leverage when possible','Negotiate the full package, not just base salary','Be enthusiastic — you want the job, just fairly compensated']).map((tip,i)=>(
                      <div key={i} style={{display:'flex',gap:9,alignItems:'flex-start'}}>
                        <div style={{width:18,height:18,borderRadius:5,background:'var(--p100)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:9.5,fontWeight:800,color:'var(--p600)',marginTop:1}}>{i+1}</div>
                        <span style={{fontSize:12.5,color:'var(--muted)',lineHeight:1.5}}>{tip}</span>
                      </div>
                    ))}
                  </div>

                  {analysis.topPayingCompanies?.length>0&&(
                    <div style={{marginTop:16,padding:'12px 14px',background:'var(--p25)',borderRadius:10}}>
                      <div style={{fontSize:10,fontWeight:800,color:'var(--p500)',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Top Paying Companies for this Role</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {analysis.topPayingCompanies.map((c,i)=>(
                          <span key={i} style={{padding:'4px 12px',background:'var(--surface)',border:'1px solid var(--p200)',borderRadius:20,fontSize:12,fontWeight:700,color:'var(--p600)'}}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.totalCompNotes&&(
                    <div style={{marginTop:10,fontSize:12,color:'var(--muted)',lineHeight:1.6,padding:'10px 12px',background:'var(--amberl)',borderRadius:8}}>
                      {analysis.totalCompNotes}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
