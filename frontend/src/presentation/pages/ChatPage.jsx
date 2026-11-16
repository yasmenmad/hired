import React, { useState, useEffect, useRef } from 'react';
import { ai, auth } from '../../infrastructure/api/apiClient';

const SUGGESTIONS = [
  "How do I negotiate my salary offer?",
  "Review my career trajectory and suggest next steps",
  "I have a FAANG interview in 2 weeks — what should I focus on?",
  "Help me pivot from backend to AI/ML engineering",
  "What skills should I add to get a 30% salary bump?",
  "How do I answer 'Why are you leaving your current job?'",
  "Write me a cold outreach message to a hiring manager on LinkedIn",
  "I got rejected from 20 companies — what am I doing wrong?",
];

function TypingDots() {
  return (
    <div style={{display:'flex',gap:4,alignItems:'center',padding:'14px 18px'}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{
          width:8,height:8,borderRadius:'50%',background:'var(--p400)',
          animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`,
        }}/>
      ))}
    </div>
  );
}

function Message({ msg, isLast }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display:'flex', gap:12, marginBottom:20,
      flexDirection: isUser ? 'row-reverse' : 'row',
      animation:'fadeIn .2s ease',
    }}>
      {/* Avatar */}
      <div style={{
        width:36, height:36, borderRadius:12, flexShrink:0,
        background: isUser ? 'var(--p500)' : 'linear-gradient(135deg,var(--p700),var(--p500))',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'var(--serif)', fontSize:14, fontWeight:800, color:'#fff',
        boxShadow: isUser ? 'none' : '0 4px 12px rgba(98,71,212,.3)',
      }}>
        {isUser ? (auth.getUser()?.name?.[0]?.toUpperCase() || 'U') : 'A'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth:'72%',
        background: isUser ? 'var(--p500)' : 'var(--surface)',
        border: isUser ? 'none' : '1.5px solid var(--faint)',
        borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
        padding:'13px 17px',
        boxShadow: isUser ? '0 4px 16px rgba(98,71,212,.25)' : '0 2px 8px rgba(0,0,0,.04)',
      }}>
        {!isUser && (
          <div style={{fontSize:11,fontWeight:800,color:'var(--p500)',marginBottom:6,letterSpacing:.5}}>
            Alex · Career Coach
          </div>
        )}
        <div style={{
          fontSize:13.5,
          color: isUser ? '#fff' : 'var(--ink)',
          lineHeight:1.75,
          whiteSpace:'pre-wrap',
        }}>
          {msg.content}
        </div>
        <div style={{
          fontSize:10, marginTop:6, opacity:.6,
          color: isUser ? 'rgba(255,255,255,.7)' : 'var(--muted)',
          textAlign: isUser ? 'right' : 'left',
        }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage({ toast, user }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showSugg,  setShowSugg]  = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const userName = user?.name || 'there';

  // Welcome message
  useEffect(() => {
    setMessages([{
      role:    'assistant',
      content: `Hey ${userName}! 👋 I'm Alex, your AI career coach.\n\nI know your profile — ${user?.title || 'you'} with skills in ${(user?.skills||[]).slice(0,3).join(', ') || 'your field'}. I'm here to give you brutally honest, specific career advice.\n\nWhat's on your mind? Salary negotiation, interview prep, career pivot, CV review — I've got you.`,
      time: now(),
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function now() {
    return new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  }

  async function send(text) {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');
    setShowSugg(false);

    const userMsg = { role:'user', content, time: now() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setLoading(true);

    try {
      // Build API messages (no 'time' field)
      const apiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }));
      const reply = await ai.chat(apiMsgs, {
        name:     user?.name     || '',
        title:    user?.title    || '',
        skills:   user?.skills   || [],
        location: user?.location || '',
        bio:      user?.bio      || '',
      });
      setMessages(prev => [...prev, { role:'assistant', content: reply, time: now() }]);
    } catch(e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting to the AI service right now. Make sure your GROQ_API_KEY is set in the backend .env file and the server is running.",
        time: now(),
      }]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function clearChat() {
    setMessages([{
      role:    'assistant',
      content: `Fresh start! What would you like to work on, ${userName}?`,
      time: now(),
    }]);
    setShowSugg(true);
  }

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)'}}>

      {/* Header */}
      <div style={{
        padding:'14px 24px', background:'var(--surface)',
        borderBottom:'1.5px solid var(--faint)',
        display:'flex', alignItems:'center', gap:14, flexShrink:0,
      }}>
        <div style={{
          width:44, height:44, borderRadius:14,
          background:'linear-gradient(135deg,var(--p700),var(--p400))',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 14px rgba(98,71,212,.35)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
        <div>
          <div style={{fontFamily:'var(--serif)',fontSize:16,fontWeight:800,color:'var(--ink)',letterSpacing:-.4}}>Alex — Career Coach</div>
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--muted)'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block'}}/>
            Powered by Groq · llama-3.3-70b · Always available
          </div>
        </div>
        <button onClick={clearChat} style={{marginLeft:'auto',padding:'6px 14px',borderRadius:8,border:'1.5px solid var(--faint)',background:'transparent',fontSize:11.5,fontWeight:700,color:'var(--muted)',cursor:'pointer'}}>
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:'24px 20px',maxWidth:800,width:'100%',margin:'0 auto',boxSizing:'border-box'}}>

        {messages.map((msg, i) => (
          <Message key={i} msg={msg} isLast={i === messages.length - 1} />
        ))}

        {loading && (
          <div style={{display:'flex',gap:12,marginBottom:20,animation:'fadeIn .2s ease'}}>
            <div style={{width:36,height:36,borderRadius:12,background:'linear-gradient(135deg,var(--p700),var(--p500))',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--serif)',fontSize:14,fontWeight:800,color:'#fff',boxShadow:'0 4px 12px rgba(98,71,212,.3)',flexShrink:0}}>A</div>
            <div style={{background:'var(--surface)',border:'1.5px solid var(--faint)',borderRadius:'4px 18px 18px 18px',boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
              <TypingDots/>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {showSugg && messages.length <= 1 && (
          <div style={{marginTop:8}}>
            <div style={{fontSize:11,fontWeight:800,color:'var(--muted)',letterSpacing:1,textTransform:'uppercase',marginBottom:12}}>
              Try asking
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{
                  textAlign:'left', padding:'11px 16px',
                  background:'var(--surface)', border:'1.5px solid var(--faint)',
                  borderRadius:12, fontSize:13, color:'var(--ink2)',
                  cursor:'pointer', fontFamily:'var(--sans)', fontWeight:500,
                  transition:'all .15s', lineHeight:1.4,
                }} onMouseEnter={e=>{e.target.style.borderColor='var(--p300)';e.target.style.background='var(--p25)'}}
                   onMouseLeave={e=>{e.target.style.borderColor='var(--faint)';e.target.style.background='var(--surface)'}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{
        padding:'14px 20px', background:'var(--surface)',
        borderTop:'1.5px solid var(--faint)', flexShrink:0,
      }}>
        <div style={{
          maxWidth:800, margin:'0 auto',
          display:'flex', gap:10, alignItems:'flex-end',
        }}>
          <div style={{
            flex:1, background:'var(--bg)',
            border:'1.5px solid var(--faint)', borderRadius:16,
            padding:'11px 16px', display:'flex', alignItems:'flex-end', gap:8,
            transition:'border-color .15s',
          }} onFocus={e=>e.currentTarget.style.borderColor='var(--p400)'}
             onBlur={e=>e.currentTarget.style.borderColor='var(--faint)'}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKey}
              placeholder="Ask Alex anything about your career…"
              rows={1}
              style={{
                flex:1, border:'none', outline:'none',
                background:'transparent', fontSize:13.5,
                color:'var(--ink)', fontFamily:'var(--sans)',
                resize:'none', lineHeight:1.6, maxHeight:120,
                overflow:'auto',
              }}
            />
            <div style={{fontSize:10,color:'var(--muted)',opacity:.5,flexShrink:0,paddingBottom:2}}>
              Enter ↵
            </div>
          </div>
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width:44, height:44, borderRadius:13, border:'none',
              background: input.trim() && !loading
                ? 'linear-gradient(135deg,var(--p400),var(--p700))'
                : 'var(--faint)',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, transition:'all .2s',
              boxShadow: input.trim() && !loading ? '0 4px 14px rgba(98,71,212,.35)' : 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div style={{maxWidth:800,margin:'8px auto 0',fontSize:10.5,color:'var(--muted)',textAlign:'center',opacity:.6}}>
          Alex has context about your profile. All conversations are private.
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%,80%,100%{transform:translateY(0)}
          40%{transform:translateY(-6px)}
        }
        @keyframes fadeIn {
          from{opacity:0;transform:translateY(6px)}
          to{opacity:1;transform:translateY(0)}
        }
      `}</style>
    </div>
  );
}
