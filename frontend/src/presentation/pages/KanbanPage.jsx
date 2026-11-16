import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/common/Modal';
import { applications as appsApi, checkBackend } from '../../infrastructure/api/apiClient';

const COLS = [
  {id:'saved',    label:'Saved',     dot:'#7c5ce8', bg:'rgba(124,92,232,.08)'},
  {id:'applied',  label:'Applied',   dot:'#1a4a99', bg:'rgba(26,74,153,.08)'},
  {id:'interview',label:'Interview', dot:'#8a5a0a', bg:'rgba(138,90,10,.08)'},
  {id:'offer',    label:'Offer',     dot:'#0f7a4a', bg:'rgba(15,122,74,.08)'},
  {id:'rejected', label:'Rejected',  dot:'#9a1f1f', bg:'rgba(154,31,31,.08)'},
];

const IcPlus = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcEdit = ()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcTrash = ()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcBookmark = ()=><svg width="11" height="11" viewBox="0 0 24 24" fill="var(--p500)" stroke="var(--p500)" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;

function CoLogo({name=''}){
  const colors={AstroAI:'#5c35d4',Stripe:'#635BFF',Mistral:'#059669',Vercel:'#111827',Deel:'#dc2626',OpenAI:'#059669'};
  const c=colors[name]||'#6247d4';
  return <div style={{width:32,height:32,borderRadius:8,background:c,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--serif)',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>{(name||'?').slice(0,2).toUpperCase()}</div>;
}

function MatchBadge({score}){
  if(!score)return null;
  const color=score>=90?'var(--green)':score>=80?'var(--p500)':'var(--amber)';
  const bg=score>=90?'var(--greenl)':score>=80?'var(--p100)':'var(--amberl)';
  return <span style={{padding:'2px 8px',borderRadius:50,fontSize:11,fontWeight:800,color,background:bg}}>{score}%</span>;
}

function statusToCol(s){return{applied:'applied',interview:'interview',offer:'offer',rejected:'rejected',saved:'saved',shortlisted:'interview'}[s]||'applied';}

function getSavedJobs(){try{return JSON.parse(localStorage.getItem('hired_saved_jobs')||'[]');}catch{return[];}}

export default function KanbanPage({toast}){
  const [cards,setCards]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({title:'',company:'',col:'applied',notes:'',salary:''});
  const [dragging,setDragging]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  const [editCard,setEditCard]=useState(null);
  const [viewCard,setViewCard]=useState(null);
  const [backendOk,setBackendOk]=useState(false);

  // Load saved jobs from localStorage (set by JobsPage bookmark)
  function loadSavedLocalJobs(){
    const saved = getSavedJobs();
    return saved.map(j=>({
      id: 'saved_'+j.id,
      col: 'saved',
      title: j.title,
      company: j.company,
      match: j.match_score||80,
      date: new Date(j.savedAt||Date.now()).toLocaleDateString('en-US',{month:'short',day:'numeric'}),
      notes: '',
      salary: j.salary||'',
      appId: null,
      source: j.source||'',
      fromSave: true,
    }));
  }

  const loadCards = useCallback(async()=>{
    setLoading(true);
    let backendCards=[];
    try{
      const data=await appsApi.list();
      const list=Array.isArray(data)?data:(data?.applications||[]);
      backendCards=list.map(app=>({
        id:app.id,col:statusToCol(app.status),
        title:app.job?.title||`Job #${app.job_id?.slice(0,8)||'?'}`,
        company:app.job?.company||app.job_id||'',
        match:app.match_score?Math.round(app.match_score):null,
        date:app.applied_at?new Date(app.applied_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'Today',
        notes:app.notes||'',salary:app.job?.salary||'',appId:app.id,source:'',fromSave:false,
      }));
    }catch(e){console.error('loadCards error:',e);}

    // Merge saved local jobs (deduplicate by job id)
    const savedLocal=loadSavedLocalJobs();
    const backendTitles=new Set(backendCards.map(c=>c.title+c.company));
    const uniqueSaved=savedLocal.filter(s=>!backendTitles.has(s.title+s.company));
    setCards([...backendCards,...uniqueSaved]);
    setLoading(false);
  },[]);

  useEffect(()=>{
    checkBackend().then(ok=>{
      setBackendOk(ok);
      if(ok) loadCards();
      else{
        // Backend offline — only show local saved
        setCards(loadSavedLocalJobs());
        setLoading(false);
      }
    });
  },[]);

  // Listen for save events from JobsPage
  useEffect(()=>{
    function handleSaveChange(e){
      const saved=e.detail||[];
      setCards(prev=>{
        // Remove old saved cards, re-add from event
        const nonSaved=prev.filter(c=>!c.fromSave);
        const newSaved=saved.map(j=>({
          id:'saved_'+j.id,col:'saved',title:j.title,company:j.company,
          match:j.match_score||80,
          date:new Date(j.savedAt||Date.now()).toLocaleDateString('en-US',{month:'short',day:'numeric'}),
          notes:'',salary:j.salary||'',appId:null,source:j.source||'',fromSave:true,
        }));
        const nonSavedTitles=new Set(nonSaved.map(c=>c.title+c.company));
        const uniqueNew=newSaved.filter(s=>!nonSavedTitles.has(s.title+s.company));
        return [...nonSaved,...uniqueNew];
      });
    }
    window.addEventListener('hired_saved_jobs_changed',handleSaveChange);
    return()=>window.removeEventListener('hired_saved_jobs_changed',handleSaveChange);
  },[]);

  const stats={
    total:cards.length,
    offers:cards.filter(c=>c.col==='offer').length,
    interviews:cards.filter(c=>c.col==='interview').length,
    applied:cards.filter(c=>c.col==='applied').length,
  };

  async function addCard(){
    if(!form.title.trim()||!form.company.trim()){toast('Fill in title and company');return;}
    const newCard={id:Date.now(),col:form.col,...form,match:Math.floor(Math.random()*20+70),date:'Today',fromSave:false};
    setCards(p=>[...p,newCard]);
    setForm({title:'',company:'',col:'applied',notes:'',salary:''});
    setModal(null);
    toast('Application added');
    if(backendOk){try{await appsApi.create({jobId:'manual-'+Date.now(),status:form.col,notes:form.notes});}catch{}}
  }

  async function saveEdit(){
    setCards(p=>p.map(c=>c.id===editCard.id?{...c,...editCard}:c));
    setModal(null);setEditCard(null);
    toast('Card updated');
    if(backendOk&&editCard.appId){
      try{await appsApi.update(editCard.appId,{status:editCard.col,notes:editCard.notes});}catch{}
    }
  }

  async function deleteCard(card){
    setCards(p=>p.filter(c=>c.id!==card.id));
    toast('Removed');
    if(backendOk&&card.appId){try{await appsApi.remove(card.appId);}catch{}}
    if(card.fromSave){
      const saved=getSavedJobs().filter(j=>j.title!==card.title||j.company!==card.company);
      localStorage.setItem('hired_saved_jobs',JSON.stringify(saved));
    }
  }

  function onDragStart(e,card){setDragging(card);}
  function onDragOver(e,colId){e.preventDefault();setDragOver(colId);}
  function onDrop(e,colId){
    e.preventDefault();
    if(!dragging||dragging.col===colId)return;
    setCards(p=>p.map(c=>c.id===dragging.id?{...c,col:colId}:c));
    if(backendOk&&dragging.appId){try{appsApi.update(dragging.appId,{status:colId});}catch{}}
    setDragging(null);setDragOver(null);
    toast(`Moved to ${COLS.find(c=>c.id===colId)?.label}`);
  }

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* Stats header */}
      <div style={{padding:'14px 20px',borderBottom:'1.5px solid var(--faint)',background:'var(--surface)',display:'flex',alignItems:'center',gap:20,flexShrink:0}}>
        <div style={{fontFamily:'var(--serif)',fontSize:17,fontWeight:800,color:'var(--ink)',letterSpacing:-.4}}>Application Tracker</div>
        <div style={{display:'flex',gap:12,flex:1}}>
          {[['Total',stats.total,'var(--ink)'],['Applied',stats.applied,'var(--p500)'],['Interviews',stats.interviews,'#8a5a0a'],['Offers',stats.offers,'#0f7a4a']].map(([l,v,c])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontFamily:'var(--serif)',fontSize:18,fontWeight:900,color:c}}>{v}</span>
              <span style={{fontSize:11,color:'var(--muted)',fontWeight:600}}>{l}</span>
            </div>
          ))}
        </div>
        <button onClick={()=>{setForm({title:'',company:'',col:'applied',notes:'',salary:''});setModal('add');}}
          style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:50,border:'none',background:'var(--p500)',color:'#fff',fontSize:12.5,fontWeight:800,cursor:'pointer'}}>
          <IcPlus/>Add Application
        </button>
      </div>

      {/* Kanban board */}
      <div style={{flex:1,overflowX:'auto',overflowY:'hidden',padding:'16px 16px 20px',display:'flex',gap:12}}>
        {COLS.map(col=>{
          const colCards=cards.filter(c=>c.col===col.id);
          return(
            <div key={col.id}
              onDragOver={e=>onDragOver(e,col.id)}
              onDrop={e=>onDrop(e,col.id)}
              style={{width:240,flexShrink:0,display:'flex',flexDirection:'column',borderRadius:16,background:col.bg,border:`1.5px solid ${dragOver===col.id?col.dot:'transparent'}`,transition:'border-color .15s',padding:'12px 10px'}}>

              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,padding:'0 2px'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:col.dot,flexShrink:0}}/>
                <div style={{fontWeight:800,fontSize:13,color:'var(--ink)',flex:1}}>{col.label}</div>
                <div style={{fontFamily:'var(--serif)',fontSize:16,fontWeight:900,color:col.dot}}>{colCards.length}</div>
              </div>

              <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:8}}>
                {colCards.map(card=>(
                  <div key={card.id} draggable
                    onDragStart={e=>onDragStart(e,card)}
                    style={{background:'var(--surface)',borderRadius:12,padding:'12px 13px',border:'1.5px solid var(--faint)',cursor:'grab',transition:'all .15s',boxShadow:'0 2px 8px rgba(0,0,0,.05)'}}>

                    <div style={{display:'flex',gap:9,alignItems:'flex-start',marginBottom:8}}>
                      <CoLogo name={card.company}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:800,fontSize:12.5,color:'var(--ink)',lineHeight:1.3,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.title}</div>
                        <div style={{fontSize:11,color:'var(--p500)',fontWeight:700}}>{card.company}</div>
                      </div>
                    </div>

                    <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:8}}>
                      {card.match&&<MatchBadge score={card.match}/>}
                      {card.salary&&<span style={{padding:'2px 7px',borderRadius:50,fontSize:10,fontWeight:700,background:'#e4f7ee',color:'#0f7a4a'}}>{card.salary}</span>}
                      {card.fromSave&&<span style={{padding:'2px 7px',borderRadius:50,fontSize:9.5,fontWeight:800,background:'var(--p50)',color:'var(--p500)',display:'flex',alignItems:'center',gap:3}}><IcBookmark/>Saved</span>}
                      {card.source&&<span style={{padding:'2px 7px',borderRadius:50,fontSize:9,fontWeight:700,background:'var(--faint2)',color:'var(--muted)'}}>{card.source}</span>}
                    </div>

                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontSize:10,color:'var(--muted)',fontWeight:600}}>{card.date}</span>
                      <div style={{display:'flex',gap:5}}>
                        <button onClick={()=>{setEditCard({...card});setModal('edit');}} title="Edit"
                          style={{width:24,height:24,borderRadius:7,border:'1px solid var(--faint)',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)'}}>
                          <IcEdit/>
                        </button>
                        <button onClick={()=>deleteCard(card)} title="Remove"
                          style={{width:24,height:24,borderRadius:7,border:'1px solid var(--faint)',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)'}}>
                          <IcTrash/>
                        </button>
                      </div>
                    </div>
                    {card.notes&&<div style={{marginTop:7,fontSize:11,color:'var(--muted)',lineHeight:1.5,padding:'7px 9px',background:'var(--p25)',borderRadius:8,borderLeft:'2px solid var(--p300)'}}>{card.notes}</div>}
                  </div>
                ))}

                {colCards.length===0&&(
                  <div style={{padding:'20px 10px',textAlign:'center',color:'var(--muted)',fontSize:11,fontWeight:600,opacity:.5}}>
                    {col.id==='saved'?'Save jobs from the feed':'Drop cards here'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {modal==='add'&&(
        <Modal title="Add Application" onClose={()=>setModal(null)}
          footer={<><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={addCard}>Add</button></>}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div><label className="field-lbl">Job Title *</label><input className="field-input" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Senior Engineer"/></div>
            <div><label className="field-lbl">Company *</label><input className="field-input" value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))} placeholder="e.g. Stripe"/></div>
            <div><label className="field-lbl">Salary (optional)</label><input className="field-input" value={form.salary} onChange={e=>setForm(p=>({...p,salary:e.target.value}))} placeholder="e.g. $120–150k"/></div>
            <div>
              <label className="field-lbl">Status</label>
              <select className="field-input" value={form.col} onChange={e=>setForm(p=>({...p,col:e.target.value}))}>
                {COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div><label className="field-lbl">Notes</label><textarea className="field-input" rows={3} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Recruiter name, next steps…" style={{resize:'vertical'}}/></div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {modal==='edit'&&editCard&&(
        <Modal title="Edit Application" onClose={()=>{setModal(null);setEditCard(null);}}
          footer={<><button className="btn btn-ghost" onClick={()=>{setModal(null);setEditCard(null);}}>Cancel</button><button className="btn btn-primary" onClick={saveEdit}>Save</button></>}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div><label className="field-lbl">Job Title</label><input className="field-input" value={editCard.title} onChange={e=>setEditCard(p=>({...p,title:e.target.value}))}/></div>
            <div><label className="field-lbl">Company</label><input className="field-input" value={editCard.company} onChange={e=>setEditCard(p=>({...p,company:e.target.value}))}/></div>
            <div><label className="field-lbl">Salary</label><input className="field-input" value={editCard.salary||''} onChange={e=>setEditCard(p=>({...p,salary:e.target.value}))}/></div>
            <div>
              <label className="field-lbl">Status</label>
              <select className="field-input" value={editCard.col} onChange={e=>setEditCard(p=>({...p,col:e.target.value}))}>
                {COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div><label className="field-lbl">Notes</label><textarea className="field-input" rows={3} value={editCard.notes||''} onChange={e=>setEditCard(p=>({...p,notes:e.target.value}))} style={{resize:'vertical'}}/></div>
          </div>
        </Modal>
      )}

      {loading&&(
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(var(--bg-rgb,255,255,255),.8)',zIndex:50}}>
          <div style={{fontSize:13,color:'var(--muted)',fontWeight:600,animation:'pulse 1.5s ease-in-out infinite'}}>Loading applications…</div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
