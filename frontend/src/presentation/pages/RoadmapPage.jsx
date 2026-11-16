import React, { useState } from 'react';

/* ─── Groq ──────────────────────────────────────────────────── */
const GROQ_BASE  = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const PHASE_COLORS = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981'];

async function groqComplete(prompt, apiKey) {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      max_tokens: 2400,
      messages: [
        {
          role: 'system',
          content: 'You are a senior career coach. You respond ONLY with valid JSON. No markdown fences, no prose, no explanation. Pure raw JSON only. No emojis anywhere in the output.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Groq API error');
  return data.choices[0].message.content.trim();
}

/* ─── Preset Paths ──────────────────────────────────────────── */
const PRESET_PATHS = {
  'Junior Dev to Staff Engineer': {
    role: 'Staff Engineer', timeline: '3 years',
    steps: [
      { phase:'Phase 1', label:'Foundation (Months 1-6)', color:'#7c3aed',
        goals:['Master your primary stack end to end','Learn system design fundamentals','Contribute to code reviews consistently','Ship 2-3 significant features independently'],
        skills:['Data structures and algorithms','Git and CI/CD pipelines','Unit and integration testing','REST API design'],
        certs:['AWS Cloud Practitioner','Meta React Developer Certificate'],
        roles:['Junior Software Engineer','Software Developer I'],
        resources:['Designing Data-Intensive Applications','Neetcode.io for DSA practice','Frontend Masters courses'] },
      { phase:'Phase 2', label:'Growth (Months 7-18)', color:'#0ea5e9',
        goals:['Own a feature from design to production','Mentor 1-2 junior developers','Lead one cross-functional project','Build deep expertise in one specialization'],
        skills:['System design high and low level','Performance optimization','Database design and indexing','Observability and monitoring'],
        certs:['AWS Solutions Architect Associate','Google Cloud Professional Developer'],
        roles:['Software Engineer II','Mid-Level Engineer'],
        resources:['System Design Interview vol 1 and 2','Pragmatic Programmer','Architecture Patterns with Python'] },
      { phase:'Phase 3', label:'Senior Level (Months 19-28)', color:'#f59e0b',
        goals:['Define technical direction for a team','Drive an org-wide technical initiative','Write design documents adopted by other teams','Become the domain expert others rely on'],
        skills:['Technical leadership','Cross-team alignment','Production incident response','Architecture decision records'],
        certs:['AWS Solutions Architect Professional','Kubernetes Administrator CKA'],
        roles:['Senior Software Engineer','Tech Lead'],
        resources:['Staff Engineer by Will Larson','The Managers Path','LeadDev articles and talks'] },
      { phase:'Phase 4', label:'Staff Level (Months 29-36)', color:'#10b981',
        goals:['Define the technical roadmap for a product area','Influence hiring and team structure decisions','Ship projects that span multiple teams','Build external visibility through talks or writing'],
        skills:['Strategic technical planning','Stakeholder management','Engineering metrics and OKRs','Org design fundamentals'],
        certs:['Focus on experience over certifications at this level'],
        roles:['Staff Engineer','Principal Engineer'],
        resources:['Being Glue by Tanya Reilly','Increment Magazine','StaffEng.com case studies'] },
    ],
  },
  'Data Analyst to Head of Data': {
    role: 'Head of Data', timeline: '4 years',
    steps: [
      { phase:'Phase 1', label:'Analyst Foundation (Months 1-8)', color:'#7c3aed',
        goals:['Master advanced SQL including CTEs and window functions','Build dashboards stakeholders genuinely use','Deeply understand the core business metrics','Automate your own reporting workflows'],
        skills:['Advanced SQL','Python with pandas and matplotlib','Tableau or Looker','A/B testing basics'],
        certs:['Google Data Analytics Certificate','dbt Analytics Engineer Certification'],
        roles:['Data Analyst','Business Intelligence Analyst'],
        resources:['Mode Analytics SQL Tutorial','Kaggle free courses','Storytelling with Data by Cole Nussbaumer'] },
      { phase:'Phase 2', label:'Senior Analyst (Months 9-20)', color:'#0ea5e9',
        goals:['Own an analytics domain such as product or growth','Build self-serve dashboards used by 50 or more people','Run statistically valid experiments','Start writing data strategy documents'],
        skills:['Statistics and experimentation','Data modeling','ML fundamentals','Data governance'],
        certs:['Databricks Data Analyst Certification','Tableau Certified Analyst'],
        roles:['Senior Data Analyst','Analytics Lead'],
        resources:['Practical Statistics for Data Scientists','dbt Learn platform','Locally Optimistic blog'] },
      { phase:'Phase 3', label:'Data Science and Management (Months 21-34)', color:'#f59e0b',
        goals:['Build and manage a small data team','Ship predictive models to production','Align data roadmap with company OKRs','Make your first data hire'],
        skills:['People management','MLOps basics','Data architecture','Executive communication'],
        certs:['AWS Machine Learning Specialty','Databricks ML Professional'],
        roles:['Data Scientist','Analytics Manager'],
        resources:['Analytics Engineering Guide','Reliable Machine Learning book','DataTalks.Club community'] },
      { phase:'Phase 4', label:'Head of Data (Months 35-48)', color:'#10b981',
        goals:['Own the full data stack strategy','Present data insights to board and executives','Build a data-driven culture company-wide','Create a center of excellence for analytics'],
        skills:['Data platform strategy','Vendor evaluation','Budget ownership','Organizational leadership'],
        certs:['Focus on leadership credentials and executive presence'],
        roles:['Head of Data','VP of Analytics'],
        resources:['Reforge Data Strategy program','Chief Data Officer community','Benn Stancil newsletter'] },
    ],
  },
  'Design Intern to Design Director': {
    role: 'Design Director', timeline: '5 years',
    steps: [
      { phase:'Phase 1', label:'Craft Foundation (Months 1-10)', color:'#7c3aed',
        goals:['Build a portfolio with 3 strong case studies','Master Figma components and auto-layout','Contribute to a design system','Get feedback from 5 or more senior designers'],
        skills:['Visual design fundamentals','Figma mastery','Typography and color theory','Basic user research methods'],
        certs:['Google UX Design Certificate','Figma Advanced Certification'],
        roles:['Design Intern','Junior Product Designer'],
        resources:['Refactoring UI book','Figma official tutorials','Muzli design inspiration'] },
      { phase:'Phase 2', label:'Product Designer (Months 11-24)', color:'#0ea5e9',
        goals:['Own the design of a full product feature','Run user interviews and usability tests','Collaborate closely with PMs and engineers','Ship something used by 100k or more users'],
        skills:['UX research methods','Interaction design','Design critique skills','Accessibility WCAG standards'],
        certs:['Nielsen Norman UX Certificate','NN/g Interaction Design Specialist'],
        roles:['Product Designer','UX Designer'],
        resources:['Do not Make Me Think by Steve Krug','Sprint by Jake Knapp','Laws of UX website'] },
      { phase:'Phase 3', label:'Senior and Lead Designer (Months 25-42)', color:'#f59e0b',
        goals:['Lead design on a major product launch','Mentor 2-3 junior designers','Define design principles for a product area','Present design strategy to product leadership'],
        skills:['Design systems ownership','Cross-functional leadership','Design operations','Storytelling and presentation'],
        certs:['Portfolio and shipped work speaks louder than certifications at this level'],
        roles:['Senior Product Designer','Lead Designer'],
        resources:['The Shape of Design by Frank Chimero','Org Design for Design Orgs','Figma Community resources'] },
      { phase:'Phase 4', label:'Design Director (Months 43-60)', color:'#10b981',
        goals:['Set the design vision across the organization','Hire and grow a team of 5-15 designers','Establish design as a strategic business function','Influence product and business strategy at the executive level'],
        skills:['People leadership','Design org scaling','Executive presence','Brand strategy'],
        certs:['Focus on executive leadership development programs'],
        roles:['Design Director','VP of Design'],
        resources:['Creative Confidence by Tom and David Kelley','Design Leadership Handbook','Artefact Group published resources'] },
    ],
  },
};

/* ─── Groq Key Banner ───────────────────────────────────────── */
function GroqKeyBanner({ onSave }) {
  const [draft, setDraft] = useState('');
  const [show,  setShow]  = useState(false);
  return (
    <div style={{background:'var(--amberl)',border:'1.5px solid rgba(138,90,10,.25)',borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span style={{fontSize:12.5,fontWeight:600,color:'var(--amber)',flex:1}}>
        Groq API key required. Get a free key at <strong>console.groq.com</strong> — it takes 30 seconds.
      </span>
      {show ? (
        <div style={{display:'flex',gap:8,width:'100%',marginTop:6}}>
          <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Enter API key..." type="password"
            style={{flex:1,padding:'8px 12px',borderRadius:9,border:'1.5px solid var(--faint)',background:'var(--surface)',color:'var(--ink)',fontSize:13,outline:'none',fontFamily:'var(--sans)'}}/>
          <button onClick={()=>{onSave(draft.trim());setShow(false);}} disabled={!draft.trim()}
            style={{padding:'8px 16px',borderRadius:9,border:'none',background:'var(--p500)',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'var(--sans)'}}>
            Save Key
          </button>
        </div>
      ) : (
        <button onClick={()=>setShow(true)}
          style={{padding:'6px 14px',borderRadius:9,border:'1.5px solid rgba(138,90,10,.3)',background:'transparent',color:'var(--amber)',fontWeight:700,fontSize:12.5,cursor:'pointer',fontFamily:'var(--sans)'}}>
          Add Key
        </button>
      )}
    </div>
  );
}

/* ─── Generator Form ────────────────────────────────────────── */
function AIGenerator({ onGenerate, loading, hasKey }) {
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole,  setTargetRole]  = useState('');
  const [years,       setYears]       = useState('3');
  const [context,     setContext]     = useState('');
  const canSubmit = !loading && currentRole.trim() && targetRole.trim() && hasKey;

  return (
    <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:18,padding:'22px 24px'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
        <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,var(--p400),var(--p600))',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div>
          <div style={{fontFamily:'var(--serif)',fontWeight:800,fontSize:16,color:'var(--ink)'}}>AI Career Roadmap Generator</div>
          <div style={{fontSize:12,color:'var(--muted)'}}>Powered by Groq — generates a full roadmap in seconds</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div>
          <label style={{fontSize:11,fontWeight:800,letterSpacing:1.2,textTransform:'uppercase',color:'var(--muted)',display:'block',marginBottom:5}}>Current Role</label>
          <input value={currentRole} onChange={e=>setCurrentRole(e.target.value)}
            placeholder="e.g. Junior Developer, Data Analyst Intern"
            style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1.5px solid var(--faint)',background:'var(--bg)',color:'var(--ink)',fontSize:13,outline:'none',fontFamily:'var(--sans)',boxSizing:'border-box'}}/>
        </div>
        <div>
          <label style={{fontSize:11,fontWeight:800,letterSpacing:1.2,textTransform:'uppercase',color:'var(--muted)',display:'block',marginBottom:5}}>Target Role</label>
          <input value={targetRole} onChange={e=>setTargetRole(e.target.value)}
            placeholder="e.g. Staff Engineer, Head of Product"
            style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1.5px solid var(--faint)',background:'var(--bg)',color:'var(--ink)',fontSize:13,outline:'none',fontFamily:'var(--sans)',boxSizing:'border-box'}}/>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'130px 1fr',gap:14,marginBottom:18}}>
        <div>
          <label style={{fontSize:11,fontWeight:800,letterSpacing:1.2,textTransform:'uppercase',color:'var(--muted)',display:'block',marginBottom:5}}>Timeline</label>
          <select value={years} onChange={e=>setYears(e.target.value)}
            style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1.5px solid var(--faint)',background:'var(--bg)',color:'var(--ink)',fontSize:13,outline:'none',fontFamily:'var(--sans)',cursor:'pointer'}}>
            {['1','2','3','4','5'].map(y=><option key={y} value={y}>{y} {y==='1'?'year':'years'}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:11,fontWeight:800,letterSpacing:1.2,textTransform:'uppercase',color:'var(--muted)',display:'block',marginBottom:5}}>Background (optional)</label>
          <input value={context} onChange={e=>setContext(e.target.value)}
            placeholder="e.g. CS degree, startup experience, interested in AI"
            style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1.5px solid var(--faint)',background:'var(--bg)',color:'var(--ink)',fontSize:13,outline:'none',fontFamily:'var(--sans)',boxSizing:'border-box'}}/>
        </div>
      </div>
      <button onClick={()=>onGenerate({currentRole,targetRole,years,context})} disabled={!canSubmit}
        style={{width:'100%',padding:'12px',borderRadius:11,border:'none',background:canSubmit?'linear-gradient(135deg,var(--p500),var(--p600))':'var(--faint)',cursor:canSubmit?'pointer':'not-allowed',fontSize:14,fontWeight:700,color:canSubmit?'#fff':'var(--muted)',fontFamily:'var(--serif)',letterSpacing:-.3,transition:'all .2s'}}>
        {loading
          ? <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
              <span style={{width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'rmspin 1s linear infinite',display:'inline-block'}}/>
              Groq is building your roadmap...
            </span>
          : !hasKey ? 'Add Groq API Key to Generate' : 'Generate My Roadmap'}
      </button>
    </div>
  );
}

/* ─── Step Card ─────────────────────────────────────────────── */
function StepCard({ step, index, total, expanded, onToggle }) {
  const isLast = index === total - 1;
  return (
    <div style={{display:'flex',gap:16,position:'relative'}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0,width:36}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:step.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff',flexShrink:0,boxShadow:`0 0 0 5px ${step.color}20`,zIndex:1}}>
          {index+1}
        </div>
        {!isLast && <div style={{flex:1,width:2,background:step.color,opacity:.2,marginTop:4,minHeight:20}}/>}
      </div>
      <div style={{flex:1,marginBottom:isLast?0:20}}>
        <button onClick={onToggle}
          style={{width:'100%',textAlign:'left',background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:14,padding:'14px 18px',cursor:'pointer',fontFamily:'var(--sans)',transition:'border-color .2s,box-shadow .2s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=step.color;e.currentTarget.style.boxShadow=`0 4px 16px ${step.color}20`;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--faint)';e.currentTarget.style.boxShadow='none';}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:step.color,marginBottom:3}}>{step.phase}</div>
              <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:17,color:'var(--ink)',lineHeight:1.3}}>{step.label}</div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>{step.goals.length} goals · {step.skills.length} skills · {step.roles.length} target roles</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{transform:expanded?'rotate(180deg)':'none',transition:'transform .2s',flexShrink:0,marginLeft:12}}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </button>
        {expanded && (
          <div style={{background:'var(--surface)',border:`1.5px solid ${step.color}44`,borderTop:'none',borderRadius:'0 0 14px 14px',padding:'18px 18px 20px',marginTop:-2}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
              <div>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--muted)',marginBottom:10}}>Goals</div>
                {step.goals.map((g,i)=>(
                  <div key={i} style={{display:'flex',gap:9,marginBottom:8,alignItems:'flex-start'}}>
                    <div style={{width:18,height:18,borderRadius:6,background:`${step.color}18`,border:`1.5px solid ${step.color}55`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={step.color} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{fontSize:13,color:'var(--ink)',lineHeight:1.55}}>{g}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--muted)',marginBottom:10}}>Skills to Build</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:18}}>
                  {step.skills.map(s=>(
                    <span key={s} style={{padding:'4px 10px',borderRadius:20,background:`${step.color}15`,border:`1px solid ${step.color}40`,fontSize:12,fontWeight:600,color:step.color}}>{s}</span>
                  ))}
                </div>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--muted)',marginBottom:10}}>Certifications</div>
                {step.certs.map((c,i)=>(
                  <div key={i} style={{fontSize:12.5,color:'var(--muted)',marginBottom:6,paddingLeft:10,borderLeft:`2px solid ${step.color}55`,lineHeight:1.5}}>{c}</div>
                ))}
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--muted)',marginBottom:10}}>Roles to Target</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {step.roles.map(r=>(
                    <span key={r} style={{padding:'5px 11px',borderRadius:20,background:'var(--p50)',border:'1px solid var(--p200)',fontSize:12,fontWeight:600,color:'var(--p600)'}}>{r}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--muted)',marginBottom:10}}>Resources</div>
                {step.resources.map((r,i)=>(
                  <div key={i} style={{display:'flex',gap:8,marginBottom:7,alignItems:'flex-start'}}>
                    <div style={{width:5,height:5,borderRadius:'50%',background:step.color,flexShrink:0,marginTop:7,opacity:.7}}/>
                    <span style={{fontSize:12.5,color:'var(--muted)',lineHeight:1.55}}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Progress Tracker ──────────────────────────────────────── */
function ProgressTracker({ roadmap, progress, onToggle }) {
  const totalGoals = roadmap.steps.reduce((s,st)=>s+st.goals.length,0);
  const doneGoals  = [...progress].filter(k=>k.startsWith('goal_')).length;
  const pct        = totalGoals ? Math.round((doneGoals/totalGoals)*100) : 0;
  return (
    <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:16,padding:'18px 20px'}}>
      <div style={{fontFamily:'var(--serif)',fontWeight:800,fontSize:15,color:'var(--ink)',marginBottom:3}}>Progress Tracker</div>
      <div style={{fontSize:12.5,color:'var(--muted)',marginBottom:12}}>{doneGoals} of {totalGoals} goals completed</div>
      <div style={{height:7,borderRadius:20,background:'var(--faint)',marginBottom:6,overflow:'hidden'}}>
        <div style={{height:'100%',borderRadius:20,background:'linear-gradient(90deg,var(--p400),var(--p600))',width:`${pct}%`,transition:'width .5s ease'}}/>
      </div>
      <div style={{fontSize:22,fontWeight:800,fontFamily:'var(--serif)',color:'var(--p600)',marginBottom:20}}>{pct}%</div>
      {roadmap.steps.map((step,si)=>(
        <div key={si} style={{marginBottom:18}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:1,textTransform:'uppercase',color:step.color,marginBottom:8}}>{step.phase}</div>
          {step.goals.map((g,gi)=>{
            const key  = `goal_${si}_${gi}`;
            const done = progress.has(key);
            return (
              <div key={gi} onClick={()=>onToggle(key)}
                style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:7,cursor:'pointer',padding:'5px 6px',borderRadius:7,transition:'background .1s'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--p25)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{width:16,height:16,borderRadius:5,background:done?step.color:'transparent',border:`1.5px solid ${done?step.color:'var(--faint)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1,transition:'all .2s'}}>
                  {done&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span style={{fontSize:11.5,color:done?'var(--muted)':'var(--ink)',textDecoration:done?'line-through':'none',lineHeight:1.5}}>{g}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ─── Loading Skeleton ──────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {[1,0.85,0.7,0.55].map((op,i)=>(
        <div key={i} style={{display:'flex',gap:16}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:'var(--faint)',animation:'rmpulse 1.5s ease-in-out infinite',opacity:op}}/>
          <div style={{flex:1,height:76,borderRadius:14,background:'var(--faint)',animation:'rmpulse 1.5s ease-in-out infinite',opacity:op}}/>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function RoadmapPage({ toast, user }) {
  const [apiKey,       setApiKey]       = useState(()=>localStorage.getItem('hired_groq_key')||'');
  const [activePreset, setActivePreset] = useState(null);
  const [aiRoadmap,    setAiRoadmap]    = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [expanded,     setExpanded]     = useState(new Set([0]));
  const [progress,     setProgress]     = useState(new Set());

  const roadmap = aiRoadmap || (activePreset ? PRESET_PATHS[activePreset] : null);

  function saveKey(k) { setApiKey(k); localStorage.setItem('hired_groq_key',k); }
  function toggleStep(i) { setExpanded(s=>{const n=new Set(s);n.has(i)?n.delete(i):n.add(i);return n;}); }
  function toggleProgress(key) { setProgress(s=>{const n=new Set(s);n.has(key)?n.delete(key):n.add(key);return n;}); }
  function reset() { setAiRoadmap(null);setActivePreset(null);setProgress(new Set());setExpanded(new Set([0]));setError(''); }

  async function generateRoadmap({ currentRole, targetRole, years, context }) {
    if (!apiKey) { setError('Please add your Groq API key first.'); return; }
    setLoading(true); setAiRoadmap(null); setActivePreset(null);
    setExpanded(new Set([0])); setProgress(new Set()); setError('');

    const numPhases = Math.min(4, Math.max(2, parseInt(years)));
    const colors    = PHASE_COLORS.slice(0, numPhases).join(', ');

    const prompt = `Generate a ${years}-year career roadmap for someone going from "${currentRole}" to "${targetRole}".${context ? ` Context: ${context}.` : ''}

Return ONLY raw JSON — no markdown, no fences, no commentary, no emojis.
Create exactly ${numPhases} phases. Assign these colors in order: ${colors}.
Each phase covers a proportional slice of the ${years}-year timeline.

{
  "role": "${targetRole}",
  "timeline": "${years} year${years==='1'?'':'s'}",
  "steps": [
    {
      "phase": "Phase 1",
      "label": "Phase name (Months X-Y)",
      "color": "#7c3aed",
      "goals": ["specific measurable goal", "specific measurable goal", "specific measurable goal", "specific measurable goal"],
      "skills": ["concrete tool or skill", "concrete tool or skill", "concrete tool or skill", "concrete tool or skill"],
      "certs": ["real certification name", "real certification name"],
      "roles": ["real job title found on job boards", "real job title found on job boards"],
      "resources": ["specific book title or course name", "specific book title or course name", "specific website or community"]
    }
  ]
}

Requirements: Be highly specific. Name real tools, real certification programs, real book titles. Goals must be concrete and measurable. Roles must be real job titles. No generic filler.`;

    try {
      const raw     = await groqComplete(prompt, apiKey);
      const cleaned = raw.replace(/```json|```/g,'').trim();
      const start   = cleaned.indexOf('{');
      const end     = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('Groq returned an unexpected response. Please try again.');
      const parsed  = JSON.parse(cleaned.slice(start, end+1));
      if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) throw new Error('Roadmap data is incomplete. Please try again.');
      parsed.steps  = parsed.steps.map((s,i)=>({ ...s, color: PHASE_COLORS[i] || PHASE_COLORS[PHASE_COLORS.length-1] }));
      setAiRoadmap(parsed);
      toast?.('Roadmap generated');
    } catch(e) {
      setError(e.message || 'Generation failed. Check your Groq API key and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{height:'100%',overflow:'auto',background:'var(--bg)',padding:'24px 28px',fontFamily:'var(--sans)'}}>
      <style>{`
        @keyframes rmspin  { to { transform:rotate(360deg); } }
        @keyframes rmpulse { 0%,100%{opacity:.4}50%{opacity:.9} }
      `}</style>

      <div style={{maxWidth:1120,margin:'0 auto'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
          <div style={{width:42,height:42,borderRadius:13,background:'linear-gradient(135deg,var(--p500),#0ea5e9)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div>
            <h1 style={{fontFamily:'var(--serif)',fontSize:24,fontWeight:800,color:'var(--ink)',margin:0,letterSpacing:-.5}}>Career Roadmap</h1>
            <p style={{fontSize:13,color:'var(--muted)',margin:0}}>AI-generated step-by-step path from where you are to where you want to be</p>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:roadmap?'1fr 300px':'1fr',gap:24,alignItems:'start'}}>
          <div style={{display:'flex',flexDirection:'column',gap:18}}>

            {/* Groq key warning */}
            {!apiKey && <GroqKeyBanner onSave={saveKey}/>}

            {/* Generator form — hide when roadmap is showing */}
            {!roadmap && <AIGenerator onGenerate={generateRoadmap} loading={loading} hasKey={!!apiKey}/>}

            {/* Error */}
            {error && (
              <div style={{background:'rgba(239,68,68,.08)',border:'1.5px solid rgba(239,68,68,.25)',borderRadius:12,padding:'12px 16px',fontSize:13,color:'var(--red)',display:'flex',alignItems:'center',gap:10}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            {/* Loading skeleton */}
            {loading && <LoadingSkeleton/>}

            {/* Preset picker */}
            {!roadmap && !loading && (
              <div>
                <div style={{fontSize:11,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--muted)',marginBottom:12}}>Or pick a preset path</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
                  {Object.keys(PRESET_PATHS).map(key=>(
                    <button key={key}
                      onClick={()=>{setActivePreset(key);setAiRoadmap(null);setExpanded(new Set([0]));setProgress(new Set());setError('');}}
                      style={{textAlign:'left',padding:'16px 18px',borderRadius:14,border:'1.5px solid var(--faint)',background:'var(--surface)',cursor:'pointer',fontFamily:'var(--sans)',transition:'border-color .2s,box-shadow .2s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--p400)';e.currentTarget.style.boxShadow='0 4px 16px rgba(124,58,237,.12)';}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--faint)';e.currentTarget.style.boxShadow='none';}}>
                      <div style={{fontWeight:700,fontSize:14,color:'var(--ink)',marginBottom:5}}>{key}</div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>{PRESET_PATHS[key].timeline} · {PRESET_PATHS[key].steps.length} phases · {PRESET_PATHS[key].steps.reduce((s,st)=>s+st.goals.length,0)} goals</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Roadmap display */}
            {roadmap && !loading && (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:22,padding:'16px 20px',background:'linear-gradient(135deg,var(--p25),var(--surface))',borderRadius:14,border:'1.5px solid var(--p100)'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'var(--p500)',marginBottom:3}}>Your Roadmap</div>
                    <div style={{fontFamily:'var(--serif)',fontWeight:800,fontSize:21,color:'var(--ink)',letterSpacing:-.3}}>{roadmap.role}</div>
                    <div style={{fontSize:12.5,color:'var(--muted)',marginTop:3}}>
                      {roadmap.timeline} · {roadmap.steps.length} phases · {roadmap.steps.reduce((s,st)=>s+st.goals.length,0)} goals
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    {aiRoadmap && (
                      <button onClick={()=>{ const r=aiRoadmap; reset(); setTimeout(()=>generateRoadmap({currentRole:'',targetRole:r.role,years:r.timeline.split(' ')[0],context:''}),100); }}
                        style={{padding:'7px 13px',borderRadius:9,border:'1.5px solid var(--p200)',background:'var(--p50)',cursor:'pointer',fontSize:12,fontWeight:700,color:'var(--p600)',fontFamily:'var(--sans)'}}>
                        Regenerate
                      </button>
                    )}
                    <button onClick={reset}
                      style={{padding:'7px 13px',borderRadius:9,border:'1.5px solid var(--faint)',background:'transparent',cursor:'pointer',fontSize:12,fontWeight:700,color:'var(--muted)',fontFamily:'var(--sans)'}}>
                      New Roadmap
                    </button>
                  </div>
                </div>
                <div>
                  {roadmap.steps.map((step,i)=>(
                    <StepCard key={i} step={step} index={i} total={roadmap.steps.length} expanded={expanded.has(i)} onToggle={()=>toggleStep(i)}/>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Progress sidebar */}
          {roadmap && !loading && (
            <div style={{position:'sticky',top:24}}>
              <ProgressTracker roadmap={roadmap} progress={progress} onToggle={toggleProgress}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
