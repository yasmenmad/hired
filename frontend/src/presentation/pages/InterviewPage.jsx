import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ai } from '../../infrastructure/api/apiClient';

const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/* ── SVG Icons ── */
const IcMic = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const IcMicOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const IcPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.68 10a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 7.91a16 16 0 0 0 6.1 6.1l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IcPhoneOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.18-2.91" />
    <path d="M6.34 6.34A19.5 19.5 0 0 0 4.68 10a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 7.91" />
    <line x1="23" y1="1" x2="1" y2="23" />
  </svg>
);
const IcSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IcStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const DIFFS = [
  { id: 'warmup', label: 'Warm-up', desc: 'Easy, friendly', c: '#0f7a4a', bg: '#e4f7ee' },
  { id: 'standard', label: 'Standard', desc: 'Real interview feel', c: 'var(--p600)', bg: 'var(--p50)' },
  { id: 'tough', label: 'Tough', desc: 'Deep behavioral probing', c: '#8a5a0a', bg: '#fdf3e0' },
  { id: 'brutal', label: 'Brutal', desc: 'FAANG-level difficulty', c: '#9a1f1f', bg: '#fce8e8' },
];
const FOCUS_OPTIONS = ['Behavioral', 'Technical', 'Leadership', 'System Design', 'Case Study', 'Culture Fit'];

/* ── Groq API direct call (for interview chat) ── */
const GROQ_BASE = 'https://api.groq.com/openai/v1';

async function groqChat(messages, apiKey) {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.7, max_tokens: 600 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Groq error');
  return data.choices[0].message.content.trim();
}

/* ── Voice utilities ── */
const synth = window.speechSynthesis;

function speak(text, rate = 0.95, pitch = 1.0) {
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate; u.pitch = pitch;
  // Try to pick a professional voice
  const voices = synth.getVoices();
  const preferred = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK') || v.name.includes('Microsoft Aria'));
  if (preferred) u.voice = preferred;
  synth.speak(u);
}

function stopSpeaking() { synth.cancel(); }

/* ── RH Chat Interview ── */
function RHChatInterview({ role, diff, focus, onEnd, toast }) {
  const GROQ_KEY = localStorage.getItem('hired_groq_key') || '';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speakOn, setSpeakOn] = useState(false);
  const timerRef = useRef(null);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Build RH system prompt
  const systemPrompt = `You are Sophie Martin, a senior HR Manager at a top tech company conducting a real job interview for: ${role}.

Your personality:
- Professional but warm. You're genuinely interested in the candidate.
- Ask one question at a time. Never dump multiple questions.
- Listen carefully to answers — follow up naturally if they are vague or impressive.
- React to what the candidate says — if they give a great answer, acknowledge it briefly before moving on.
- After every 2-3 answers, naturally transition to the next topic area.
- You are conducting a ${diff} difficulty interview focused on: ${focus.join(', ')}.
- Mix behavioral (STAR), technical, situational, and culture fit questions naturally.
- Occasionally ask follow-up questions like "Can you tell me more about that?" or "What was the outcome?"
- Keep your messages concise — 1-3 sentences maximum unless explaining something complex.
- Start with a brief friendly introduction and the first question.
- After 6-8 exchanges, offer to wrap up and give brief verbal feedback.
- Never break character. You ARE Sophie Martin, HR Manager.
- Do not say "As an AI" or mention this is simulated. Stay in character.

Start by introducing yourself and asking the first interview question.`;

  // Init interview
  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds(x => x + 1), 1000);
    startInterview();
    return () => { clearInterval(timerRef.current); stopSpeaking(); };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function startInterview() {
    setThinking(true);
    try {
      let reply;
      if (GROQ_KEY) {
        reply = await groqChat([{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Please begin the interview.' }], GROQ_KEY);
      } else {
        reply = await ai.chat([{ role: 'user', content: systemPrompt + '\n\nPlease begin the interview by introducing yourself and asking the first question.' }], { title: role });
      }
      setMessages([{ role: 'assistant', content: reply }]);
      if (speakOn) speak(reply);
    } catch (e) {
      const fallback = `Hello! I'm Sophie Martin, Senior HR Manager. Thank you for joining us today for the ${role} position. I've reviewed your background and I'm looking forward to our conversation. Could you start by telling me a bit about yourself and what draws you to this role?`;
      setMessages([{ role: 'assistant', content: fallback }]);
      if (speakOn) speak(fallback);
    }
    setThinking(false);
  }

  async function sendMessage(text = input.trim()) {
    if (!text || thinking) return;
    setInput('');
    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setThinking(true);
    try {
      const history = [{ role: 'system', content: systemPrompt }, ...newMessages.map(m => ({ role: m.role, content: m.content }))];
      let reply;
      if (GROQ_KEY) {
        reply = await groqChat(history, GROQ_KEY);
      } else {
        reply = await ai.chat(newMessages.map(m => ({ role: m.role, content: m.content })), { title: role });
      }
      const updated = [...newMessages, { role: 'assistant', content: reply }];
      setMessages(updated);
      if (speakOn) speak(reply);
    } catch {
      const fallback = 'Thank you for sharing that. Could you elaborate a bit more on that point?';
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
    }
    setThinking(false);
  }

  // Speech recognition (Web Speech API)
  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast('Speech recognition not supported in this browser'); return; }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput(t);
      setTranscript(t);
    };
    rec.onend = () => { setRecording(false); };
    rec.onerror = () => { setRecording(false); toast('Microphone error — check browser permissions'); };
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  function toggleVoiceCall() {
    if (callActive) {
      stopSpeaking();
      stopRecording();
      setCallActive(false);
      setSpeakOn(false);
      toast('Voice call ended');
    } else {
      setCallActive(true);
      setSpeakOn(true);
      // Speak last assistant message
      const lastAI = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAI) speak(lastAI.content);
      toast('Voice call started — interviewer will speak responses aloud');
    }
  }

  function toggleMic() {
    if (recording) {
      stopRecording();
      // Auto-send after short delay if there's transcribed text
      setTimeout(() => {
        if (input.trim()) sendMessage(input.trim());
      }, 300);
    } else {
      startRecording();
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ height: 56, background: 'var(--surface)', borderBottom: '1.5px solid var(--faint)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14, flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 800, color: 'var(--p600)', letterSpacing: -.5 }}>Hired.</div>
        <div style={{ width: 1, height: 18, background: 'var(--faint)' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          {/* RH avatar */}
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--p400),var(--p700))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>SM</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>Sophie Martin · HR Manager</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role}</div>
          </div>
          {thinking && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--p500)', animation: 'pulse 1s ease-in-out infinite', flexShrink: 0 }} />}
        </div>
        {/* Voice call button */}
        <button onClick={toggleVoiceCall}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 50, border: '1.5px solid', borderColor: callActive ? '#9a1f1f' : 'var(--faint)', background: callActive ? '#fce8e8' : 'transparent', color: callActive ? '#9a1f1f' : 'var(--muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}>
          {callActive ? <><IcPhoneOff /> End Call</> : <><IcPhone /> Voice Call</>}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 8, background: 'var(--faint2)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0f7a4a', animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{fmt(seconds)}</span>
        </div>
        <button onClick={() => { stopSpeaking(); stopRecording(); onEnd(); }}
          style={{ padding: '5px 14px', borderRadius: 8, border: '1.5px solid var(--faint)', background: 'transparent', fontSize: 12, fontWeight: 700, color: 'var(--muted)', cursor: 'pointer' }}>End</button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', overflow: 'hidden' }}>

        {/* Chat area */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Interview info strip */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', background: 'var(--p25)', borderRadius: 12, border: '1px solid var(--faint)', flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0f7a4a', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 11.5, color: 'var(--p600)', fontWeight: 700 }}>Live Interview</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{diff.charAt(0).toUpperCase() + diff.slice(1)} difficulty</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{focus.join(', ')}</span>
              {callActive && <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 50, background: '#fce8e8', color: '#9a1f1f', fontSize: 10, fontWeight: 800 }}>VOICE ON</span>}
            </div>

            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--p400),var(--p700))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0, marginTop: 2 }}>SM</div>
                )}
                <div style={{
                  maxWidth: '72%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg,var(--p500),var(--p700))' : 'var(--surface)',
                  color: msg.role === 'user' ? '#fff' : 'var(--ink)',
                  border: msg.role === 'user' ? 'none' : '1.5px solid var(--faint)',
                  fontSize: 13.5, lineHeight: 1.7, fontFamily: 'var(--sans)',
                  boxShadow: msg.role === 'assistant' ? '0 2px 12px rgba(0,0,0,.06)' : 'none',
                  animation: 'fadeIn .25s ease',
                }}>
                  {msg.content}
                  {msg.role === 'assistant' && callActive && (
                    <button onClick={() => speak(msg.content)} style={{ display: 'block', marginTop: 6, background: 'none', border: 'none', color: 'var(--p400)', fontSize: 11, cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                      Replay audio
                    </button>
                  )}
                </div>
              </div>
            ))}

            {thinking && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--p400),var(--p700))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>SM</div>
                <div style={{ padding: '14px 18px', borderRadius: '16px 16px 16px 4px', background: 'var(--surface)', border: '1.5px solid var(--faint)', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--p400)', animation: `pulse 1.2s ease-in-out ${i * .2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ borderTop: '1.5px solid var(--faint)', padding: '14px 24px', background: 'var(--surface)', flexShrink: 0 }}>
            {recording && (
              <div style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 9, background: '#fce8e8', border: '1px solid rgba(154,31,31,.15)', fontSize: 12, color: '#9a1f1f', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9a1f1f', animation: 'pulse 1s ease-in-out infinite' }} />
                Recording… {transcript && `"${transcript}"`}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={callActive ? 'Type or use mic to answer…' : 'Type your answer… (Enter to send)'}
                rows={2}
                style={{ flex: 1, padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--faint)', background: 'var(--bg)', fontSize: 13.5, color: 'var(--ink)', outline: 'none', resize: 'none', lineHeight: 1.6, fontFamily: 'var(--sans)', transition: 'border-color .15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--p400)'}
                onBlur={e => e.target.style.borderColor = 'var(--faint)'}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Mic button */}
                <button onClick={toggleMic}
                  title={recording ? 'Stop recording & send' : 'Start voice input'}
                  style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: recording ? '#9a1f1f' : 'var(--p100)', color: recording ? '#fff' : 'var(--p600)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                  {recording ? <IcMicOff /> : <IcMic active={false} />}
                </button>
                {/* Send button */}
                <button onClick={() => sendMessage()}
                  disabled={!input.trim() || thinking}
                  style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: input.trim() && !thinking ? 'linear-gradient(135deg,var(--p400),var(--p700))' : 'var(--faint)', color: input.trim() && !thinking ? '#fff' : 'var(--muted)', cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                  <IcSend />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Enter to send · Shift+Enter for new line</span>
              {callActive && <span style={{ fontSize: 11, color: 'var(--p500)', fontWeight: 600 }}>Voice mode active — Sophie will speak responses</span>}
            </div>
          </div>
        </div>

        {/* Coaching sidebar */}
        <div style={{ borderLeft: '1.5px solid var(--faint)', display: 'flex', flexDirection: 'column', background: 'var(--surface)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--faint)', fontSize: 10, fontWeight: 800, letterSpacing: 1.6, textTransform: 'uppercase', color: 'var(--p400)' }}>Live Coaching</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
            {[
              { t: 'STAR Framework', b: 'Situation → Task → Action → Result. Always quantify your Result.' },
              { t: 'Be Specific', b: '"I led 5 engineers" beats "I have leadership experience." Use real numbers.' },
              { t: 'Stay Concise', b: 'Target 90s–2 min per answer. Clarity over length.' },
              { t: 'Show Curiosity', b: 'Mention what you learned or would do differently. Growth mindset matters.' },
              { t: 'Quantify Impact', b: '"Reduced load time by 40%" is 10x stronger than "improved performance".' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'var(--p25)', borderRadius: 10, padding: '11px 12px', border: '1px solid var(--faint)', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--ink)', marginBottom: 3 }}><IcStar />{f.t}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>{f.b}</div>
              </div>
            ))}

            {/* Voice setup */}
            <div style={{ marginTop: 8, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--faint)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--p500)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Voice Setup</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 10 }}>
                Enable <b>Voice Call</b> to hear Sophie speak responses aloud. Use the mic button to answer by voice.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: callActive ? '#0f7a4a' : 'var(--faint)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: callActive ? 'var(--green)' : 'var(--muted)' }}>{callActive ? 'Voice active' : 'Voice off'}</span>
              </div>
              {!localStorage.getItem('hired_groq_key') && (
                <div style={{ fontSize: 10.5, color: 'var(--amber)', lineHeight: 1.5, padding: '8px 10px', background: 'var(--amberl)', borderRadius: 8 }}>
                  For the best AI responses, add your Groq API key in Profile settings.
                </div>
              )}
            </div>

            {/* Message count */}
            <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--p25)', borderRadius: 10, border: '1px solid var(--faint)' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, marginBottom: 4 }}>Session Progress</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--serif)' }}>
                {Math.floor(messages.filter(m => m.role === 'user').length)} answers given
              </div>
              <div style={{ height: 4, background: 'var(--faint)', borderRadius: 50, overflow: 'hidden', marginTop: 6 }}>
                <div style={{ height: '100%', width: `${Math.min(100, messages.filter(m => m.role === 'user').length * 12)}%`, background: 'linear-gradient(90deg,var(--p400),var(--p600))', borderRadius: 50, transition: 'width .4s ease' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

/* ── Setup Screen ── */
export default function InterviewPage({ toast, user }) {
  const [stage, setStage] = useState('setup');
  const [role, setRole] = useState(user?.title ? `${user.title}` : 'Software Engineer at a Tech Company');
  const [diff, setDiff] = useState('standard');
  const [focus, setFocus] = useState(['Behavioral', 'Technical']);

  function handleEnd() {
    setStage('setup');
  }

  if (stage === 'interview') {
    return <RHChatInterview role={role} diff={diff} focus={focus} onEnd={handleEnd} toast={toast} />;
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,var(--p800),var(--p600))', borderRadius: 24, padding: '32px 40px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: 'rgba(255,255,255,.05)', borderRadius: '50%' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--p200)', marginBottom: 10 }}>AI Interview Coach · Powered by Groq</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: -.6, lineHeight: 1.2, marginBottom: 8 }}>
              Real RH interview. Real scoring. Get hired.
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 16 }}>
              Sophie Martin (AI HR Manager) conducts a live conversational interview — with voice call support.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[<><IcMic active={false} />&nbsp;Voice call</>, 'Groq AI', 'Real-time feedback'].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 50, background: 'rgba(255,255,255,.1)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>{f}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1.5px solid var(--faint)', borderRadius: 20, padding: '26px 30px' }}>

          {/* Role input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Role you are interviewing for</label>
            <input value={role} onChange={e => setRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer at Google"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--faint)', background: 'var(--bg)', fontSize: 14, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--sans)', boxSizing: 'border-box', transition: 'border-color .15s' }}
              onFocus={e => e.target.style.borderColor = 'var(--p400)'}
              onBlur={e => e.target.style.borderColor = 'var(--faint)'} />
          </div>

          {/* Difficulty */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Difficulty</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {DIFFS.map(d => (
                <button key={d.id} onClick={() => setDiff(d.id)} style={{ padding: '11px 8px', borderRadius: 11, cursor: 'pointer', textAlign: 'center', border: `2px solid ${diff === d.id ? d.c : 'var(--faint)'}`, background: diff === d.id ? d.bg : 'transparent', transition: 'all .18s' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: diff === d.id ? d.c : 'var(--muted)', marginBottom: 2 }}>{d.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Focus */}
          <div style={{ marginBottom: 26 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Focus Areas</label>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {FOCUS_OPTIONS.map(f => (
                <button key={f} onClick={() => setFocus(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f])} style={{ padding: '7px 16px', borderRadius: 50, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: `2px solid ${focus.includes(f) ? 'var(--p500)' : 'var(--faint)'}`, color: focus.includes(f) ? 'var(--p600)' : 'var(--muted)', background: focus.includes(f) ? 'var(--p100)' : 'transparent', transition: 'all .18s' }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Voice notice */}
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'var(--p25)', border: '1px solid var(--p100)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <IcPhone />
            <div style={{ fontSize: 12, color: 'var(--p600)', lineHeight: 1.6 }}>
              <b>Voice Call mode available</b> — click "Voice Call" during the interview to hear Sophie speak and answer using your microphone. Requires a browser with Web Speech API support (Chrome recommended).
            </div>
          </div>

          <button onClick={() => setStage('interview')} disabled={!role.trim()} style={{ width: '100%', padding: '14px', borderRadius: 13, border: 'none', background: role.trim() ? 'linear-gradient(135deg,var(--p400),var(--p700))' : 'var(--faint)', color: role.trim() ? '#fff' : 'var(--muted)', fontSize: 15, fontWeight: 800, cursor: role.trim() ? 'pointer' : 'not-allowed', boxShadow: role.trim() ? '0 6px 22px rgba(98,71,212,.35)' : 'none', transition: 'all .2s' }}>
            Start Interview with Sophie
          </button>
        </div>
      </div>
    </div>
  );
}
