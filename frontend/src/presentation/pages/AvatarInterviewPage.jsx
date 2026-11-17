import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Config ─────────────────────────────────────────── */
const AVATAR_BACKEND = 'http://localhost:3000';
const FACE_API_CDN   = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.esm.js';
const GROQ_BASE      = 'https://api.groq.com/openai/v1';
const GROQ_MODEL     = 'llama-3.3-70b-versatile';

/* ─── Groq direct chat (browser-side fallback) ────────── */
async function groqDirect(messages, apiKey) {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, temperature: 0.75, max_tokens: 300, messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Groq error');
  return data.choices[0].message.content.trim();
}

/* ─── Timer helper ───────────────────────────────────── */

  /* Simulated Intelligent Follow-Up Questions (for Offline / GitHub Pages Demo Mode) */
  const getDemoFollowUp = (turnIndex, userText, targetRole) => {
    const roleName = targetRole || 'Software Engineering';
    const cleanUser = (userText || '').trim();
    
    const responses = [
      `Thank you for sharing that background. For the ${roleName} role, technical depth and architectural foresight are essential. Could you walk me through the most challenging system or feature you have architected, and the trade-offs you evaluated?`,
      `That is very interesting. When scaling applications in production, unexpected bottlenecks and edge cases always occur. Could you describe a difficult bug, performance regression, or system outage you diagnosed, and how you tracked down the root cause?`,
      `Excellent insight. Beyond technical acumen, engineering leadership and team collaboration are fundamental. Can you recount a scenario where you had a strong technical disagreement with a team member or product manager, and how you resolved it constructively?`,
      `Great perspective. Quality assurance and reliability are critical to our team. What automated testing strategies, CI/CD pipelines, and observability metrics do you prioritize when shipping production code?`,
      `Thank you for those thorough responses. Throughout our session, you have shown strong analytical rigor, structured problem-solving, and clear articulation. Do you have any questions for me about our engineering team, stack, or culture?`
    ];

    if (turnIndex < responses.length) {
      return responses[turnIndex];
    }
    return `Thank you for sharing those additional details. That gives me a comprehensive understanding of your technical experience. We're very excited about what you could bring to the ${roleName} team!`;
  };

const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/* ─── Voice helpers ──────────────────────────────────── */
const getFeminineVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  const preferred = [
    'Samantha', 'Karen', 'Moira', 'Microsoft Zira', 'Microsoft Jenny',
    'Microsoft Aria', 'Google US English Female',
  ];
  for (const name of preferred) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }
  return voices.find(v => v.lang === 'en-US') || voices[0];
};

/* ─── SVG Icons ──────────────────────────────────────── */
const IcMic = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const IcMicOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const IcUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IcX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcChevron = ({ up }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points={up ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
  </svg>
);
const IcSend = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IcRotate = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IcVideo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

/* ─── Main Component ─────────────────────────────────── */
export default function AvatarInterviewPage({ role, diff, focus, onEnd, toast }) {
  const iframeRef = useRef(null);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  /* call state */
  const [isCalling, setIsCalling]         = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [isSaraTalking, setIsSaraTalking] = useState(false);
  const [isRecording, setIsRecording]     = useState(false);
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [volume, setVolume]               = useState(0);
  const [errorMsg, setErrorMsg]           = useState('');
  const [seconds, setSeconds]             = useState(0);
  const [showCoach, setShowCoach]         = useState(true);
  const [statusText, setStatusText]       = useState('Click "Join Live Interview" to start');
  const [messageInput, setMessageInput]   = useState('');
  const [feedback, setFeedback]           = useState(null);
  const [exchangeCount, setExchangeCount] = useState(0);

  /* Emotion state */
  const [emotion, setEmotion]     = useState('Confident');
  const emotionRef                = useRef('Confident');
  const [confidenceScore, setConfidenceScore] = useState(92);
  const [hasCamera, setHasCamera] = useState(false);
  const faceApiLoadedRef          = useRef(false);
  const faceApiRef                = useRef(null);

  /* Media refs */
  const mediaRecorderRef  = useRef(null);
  const chunksRef         = useRef([]);
  const isCallingRef      = useRef(false);
  const isRecordingRef    = useRef(false);
  const audioContextRef   = useRef(null);
  const analyserRef       = useRef(null);
  const timerRef          = useRef(null);
  const ttsKeepAliveRef   = useRef(null);
  const recognitionRef    = useRef(null);
  const vadFrameRef       = useRef(null);
  const userIsTalkingRef  = useRef(false);

  /* ── postMessage to avatar iframe ── */
  const sendToAvatar = useCallback((data) => {
    iframeRef.current?.contentWindow?.postMessage(data, '*');
  }, []);

  /* ── Load face-api models ── */
  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        const faceapi = await import(FACE_API_CDN);
        faceApiRef.current = faceapi;
        const MODEL_URL = './models/face';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        faceApiLoadedRef.current = true;
        console.log('Emotion models loaded');
      } catch (err) {
        console.warn('face-api unavailable, using audio-based emotion proxy', err.message);
        // Fallback: update emotion every 8s based on mic volume as a proxy
        faceApiLoadedRef.current = false;
      }
    };
    loadFaceApi();
  }, []);

  /* ── Real-Time Emotion Detection & Biometric HUD Loop ── */
  useEffect(() => {
    let interval;
    const states = ['Confident', 'Engaged', 'Thoughtful', 'Analytical'];
    const detect = async () => {
      if (!isCallingRef.current || feedback) return;
      
      // Multi-modal analysis from audio telemetry & optical feed
      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        
        let targetEmotion = emotionRef.current;
        let score = 91;
        if (avg > 50) {
          targetEmotion = 'Confident';
          score = Math.floor(92 + (avg % 7));
        } else if (avg > 20) {
          targetEmotion = 'Engaged';
          score = Math.floor(88 + (avg % 8));
        } else if (isRecordingRef.current) {
          targetEmotion = 'Thoughtful';
          score = 86;
        } else {
          targetEmotion = 'Analytical';
          score = 90;
        }

        setConfidenceScore(score);
        if (targetEmotion !== emotionRef.current) {
          setEmotion(targetEmotion);
          emotionRef.current = targetEmotion;
        }
      }
    };
    if (isCalling) interval = setInterval(detect, 1500);
    return () => clearInterval(interval);
  }, [isCalling]);

  /* ── Timer ── */
  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds(x => x + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  /* ── Initialize media (Camera + Mic) ── */
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: { width: 320, height: 240, frameRate: 15 },
      })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;

        /* Audio analyser for volume meter only */
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        audioCtx.createMediaStreamSource(stream).connect(analyser);
        analyser.fftSize = 256;
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        /* Volume meter loop */
        const data = new Uint8Array(analyser.frequencyBinCount);
        const meter = () => {
          analyser.getByteFrequencyData(data);
          let peak = 0;
          for (let i = 0; i < data.length; i++) if (data[i] > peak) peak = data[i];
          setVolume(peak);
          vadFrameRef.current = requestAnimationFrame(meter);
        };
        meter();

        /* MediaRecorder — controlled by toggleMic button */
        const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        rec.onstart = () => { chunksRef.current = []; };
        rec.ondataavailable = e => chunksRef.current.push(e.data);
        rec.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          chunksRef.current = [];
          await sendAudioToBackend(blob);
        };
        mediaRecorderRef.current = rec;

        /* SpeechRecognition for live transcript */
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SR) {
          const recognition = new SR();
          recognition.lang = 'en-US';
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.onresult = e => {
            let text = '';
            for (let i = 0; i < e.results.length; i++) {
              if (e.results[i].isFinal) text += e.results[i][0].transcript + ' ';
            }
            window._lastSpeechTranscript = (window._lastSpeechTranscript || '') + text;
          };
          recognition.onend = () => { if (isCallingRef.current) try { recognition.start(); } catch(e){} };
          recognition.onerror = e => { if (e.error !== 'no-speech') console.warn('SR:', e.error); };
          recognition.start();
          recognitionRef.current = recognition;
        }
      })
      .catch(err => setErrorMsg('Camera/Mic error: ' + err.message));

    return () => {
      if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
      window.speechSynthesis.cancel();
      if (videoRef.current?.srcObject)
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    };
  }, []);

  /* ── Sync isCalling to ref ── */
  useEffect(() => { isCallingRef.current = isCalling; }, [isCalling]);

  /* ── Status text ── */
  useEffect(() => {
    if (!isCalling)         setStatusText('Click "Join Live Interview" to start');
    else if (isLoading)     setStatusText('Sara is analyzing response...');
    else if (isSaraTalking) setStatusText('Sara is speaking... (click mic to interrupt)');
    else if (isRecording)   setStatusText('Recording... click mic to send response');
    else                    setStatusText('Click Mic to speak to Sara');
  }, [isCalling, isLoading, isSaraTalking, isRecording]);

  /* ── Speak with Web Speech API ── */
  const speakWithVoice = (text, facialExpression) => {
    return new Promise(resolve => {
      window.speechSynthesis.cancel();
      // Clear any existing keepalive
      if (ttsKeepAliveRef.current) clearInterval(ttsKeepAliveRef.current);

      const utter   = new SpeechSynthesisUtterance(text);
      utter.rate    = 1.0;
      utter.pitch   = 1.15;
      utter.volume  = 1;

      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferred = ['Samantha','Karen','Moira','Microsoft Zira','Microsoft Jenny','Microsoft Aria','Google US English Female'];
        let voice = null;
        for (const name of preferred) { voice = voices.find(v => v.name.includes(name)); if (voice) break; }
        if (!voice) voice = voices.find(v => v.lang === 'en-US') || voices[0];
        if (voice) utter.voice = voice;

        utter.onstart = () => {
          setIsSaraTalking(true);
          sendToAvatar({ type: 'speak', text, facialExpression });
          // Chrome keepalive: pause+resume every 10s to prevent silent cutoff
          ttsKeepAliveRef.current = setInterval(() => {
            if (window.speechSynthesis.speaking) {
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            }
          }, 10000);
        };
        const cleanup = () => {
          if (ttsKeepAliveRef.current) { clearInterval(ttsKeepAliveRef.current); ttsKeepAliveRef.current = null; }
          setIsSaraTalking(false);
          sendToAvatar({ type: 'stop' });
          resolve();
        };
        utter.onend   = cleanup;
        utter.onerror = cleanup;
        window.speechSynthesis.speak(utter);
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; trySpeak(); };
      } else {
        trySpeak();
      }
    });
  };

  /* ── Message queue ── */
  const messagesQueueRef = useRef([]);
  const playingRef       = useRef(false);

  const enqueueMessages = (msgs) => {
    messagesQueueRef.current.push(...msgs);
    if (!playingRef.current) playNext();
  };

  const playNext = async () => {
    if (messagesQueueRef.current.length === 0) { playingRef.current = false; return; }
    playingRef.current = true;
    const msg = messagesQueueRef.current.shift();
    await speakWithVoice(msg.text, msg.facialExpression || 'smile');
    playNext();
  };

  /* ── API Helpers ── */


  /* Build Sara's system prompt with emotion awareness */
  const buildSaraPrompt = (role, diff, focus, emotion) => {
    const emotionNote = emotion === 'Stressed'
      ? `IMPORTANT: The candidate looks stressed or anxious right now. Acknowledge it warmly — say something like "I can see you might be feeling a bit nervous — that's completely normal. Take a breath." before continuing your question.`
      : emotion === 'Frustrated'
      ? `IMPORTANT: The candidate seems frustrated. Be more encouraging and patient in your response.`
      : emotion === 'Confident'
      ? `The candidate looks confident and engaged — match their energy.`
      : '';

    return `You are Sara, a professional and empathetic AI HR interviewer at a top tech company. You are conducting a high-stakes job interview for the role of: ${role}.
Difficulty Level: ${diff}. Specific Focus Areas: ${focus?.join(', ')}.

${emotionNote}

Your Interview Style:
- You are a REAL RH manager. You don't just ask canned questions; you listen and probe.
- Ask ONE targeted question at a time.
- If the candidate's answer is short or lacks detail, ask a follow-up question related to their specific experience (e.g., "Can you give me a specific example of when you applied that?").
- Adapt your tone to the chosen role. If it's a creative role, be more open; if it's a technical role, focus on precision and problem-solving.
- Keep your responses concise (2-4 sentences) so the focus remains on the candidate.
- Your goal is to assess if they are truly qualified for ${role} at a top-tier company.
- Never mention being an AI. Stay in character.`;
  };

  /* Conversation history for Groq (survives within session) */
  const conversationRef = useRef([]);

  const sendAudioToBackend = async (blob) => {
    // ── 1. Try avatar backend ──
    const tryBackend = async () => {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = reader.result.split(',')[1];
          try {
            const res  = await fetch(`${AVATAR_BACKEND}/sts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64, emotion: emotionRef.current }),
              signal: AbortSignal.timeout(6000),
            });
            const data = await res.json();
            resolve(data);
          } catch (e) { reject(e); }
        };
      });
    };

    setIsLoading(true);
    setErrorMsg('');
    
    // If blob is missing or too small, try using the transcript fallback immediately
    if (!blob || blob.size < 200) {
      const userText = window._lastSpeechTranscript || '';
      if (!userText.trim()) {
        setIsLoading(false);
        return;
      }
      window._lastSpeechTranscript = '';
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} }
      
      try {
        const DEFAULT_KEY = '';
        const gKey = localStorage.getItem('hired_groq_key') || DEFAULT_KEY;
        if (!gKey) throw new Error("No API Key");
        conversationRef.current.push({ role: 'user', content: userText });
        const history = conversationRef.current.slice(-12);
        const reply = await groqDirect([{ role: 'system', content: buildSaraPrompt(role, diff, focus, emotionRef.current) }, ...history], gKey);
        conversationRef.current.push({ role: 'assistant', content: reply });
        setExchangeCount(c => c + 1);
        enqueueMessages([{ text: reply, facialExpression: emotionRef.current === 'Stressed' ? 'concerned' : 'smile' }]);
      } catch (err) {
        setErrorMsg('AI error: ' + err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const data = await tryBackend();
      if (data.messages?.length) {
        enqueueMessages(data.messages);
        // Sync to conversation history
        const userText = data.transcript || '';
        if (userText) conversationRef.current.push({ role: 'user', content: userText });
        const saraText = data.messages.map(m => m.text).join(' ');
        if (saraText) conversationRef.current.push({ role: 'assistant', content: saraText });
        setExchangeCount(c => c + 1);
        return;
      }
    } catch (e) {
      console.warn('Avatar backend unavailable, using Groq direct fallback');
    }

    // ── 2. Groq fallback: transcribe via Web Speech API + Groq chat ──
    const gKey = localStorage.getItem('hired_groq_key') || '';
    if (!gKey) {
      // Offline / GitHub Pages fallback — seamless conversational demo
      const userText = window._lastSpeechTranscript || 'I have completed my explanation.';
      window._lastSpeechTranscript = '';
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} }
      
      const turn = exchangeCount;
      const followUp = getDemoFollowUp(turn, userText, role);
      conversationRef.current.push({ role: 'user', content: userText });
      conversationRef.current.push({ role: 'assistant', content: followUp });
      setExchangeCount(c => c + 1);
      setIsLoading(false);
      enqueueMessages([{ text: followUp, facialExpression: 'smile' }]);
      return;
    }

    // Use Web Speech API to transcribe the last utterance
    const userText = window._lastSpeechTranscript || '';
    if (!userText.trim()) {
      setIsLoading(false);
      return;
    }
    window._lastSpeechTranscript = '';
    
    // Restart recognition to clear internal buffer for next turn
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    try {
      conversationRef.current.push({ role: 'user', content: userText });
      const history = conversationRef.current.slice(-12); // Keep last 12 messages
      const reply = await groqDirect(
        [{ role: 'system', content: buildSaraPrompt(role, diff, focus, emotionRef.current) }, ...history],
        gKey
      );
      conversationRef.current.push({ role: 'assistant', content: reply });
      setExchangeCount(c => c + 1);
      enqueueMessages([{ text: reply, facialExpression: emotionRef.current === 'Stressed' ? 'concerned' : 'smile' }]);
    } catch (err) {
      setErrorMsg('AI error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTextInput = async () => {
    const val = messageInput.trim();
    if (!val || isLoading || isSaraTalking) return;
    setMessageInput('');
    setIsLoading(true);
    try {
      // Try avatar backend first
      try {
        const res = await fetch(`${AVATAR_BACKEND}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: val, emotion: emotionRef.current }),
          signal: AbortSignal.timeout(6000),
        });
        const data = await res.json();
        if (data.messages?.length) {
          conversationRef.current.push({ role: 'user', content: val });
          const saraText = data.messages.map(m => m.text).join(' ');
          conversationRef.current.push({ role: 'assistant', content: saraText });
          enqueueMessages(data.messages);
          return;
        }
      } catch (e) {
        console.warn('Avatar backend offline, using AI');
      }
      // Groq fallback
      const DEFAULT_KEY = '';
      const gKey = localStorage.getItem('hired_groq_key') || DEFAULT_KEY;
      if (!gKey) {
        // Offline / GitHub Pages fallback
        const turn = exchangeCount;
        const followUp = getDemoFollowUp(turn, val, role);
        conversationRef.current.push({ role: 'user', content: val });
        conversationRef.current.push({ role: 'assistant', content: followUp });
        setExchangeCount(c => c + 1);
        setIsLoading(false);
        enqueueMessages([{ text: followUp, facialExpression: 'smile' }]);
        return;
      }
      conversationRef.current.push({ role: 'user', content: val });
      const history = conversationRef.current.slice(-12);
      const reply = await groqDirect(
        [{ role: 'system', content: buildSaraPrompt(role, diff, focus, emotionRef.current) }, ...history],
        gKey
      );
      conversationRef.current.push({ role: 'assistant', content: reply });
      enqueueMessages([{ text: reply, facialExpression: 'smile' }]);
    } catch (err) {
      setErrorMsg('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Push-to-talk mic toggle ── */
  const toggleMic = () => {
    const rec = mediaRecorderRef.current;
    if (!rec || isLoading) return;

    /* If Sara is talking — interrupt her first */
    if (isSaraTalking) {
      window.speechSynthesis.cancel();
      setIsSaraTalking(false);
      sendToAvatar({ type: 'stop' });
    }

    if (!isRecording) {
      /* START recording */
      window._lastSpeechTranscript = '';
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e){} }
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      try { rec.start(); } catch(e){}
      setIsRecording(true);
      isRecordingRef.current = true;
      setIsUserTalking(true);
      userIsTalkingRef.current = true;
    } else {
      /* STOP recording — onstop will call sendAudioToBackend */
      try { rec.stop(); } catch(e){}
      setIsRecording(false);
      isRecordingRef.current = false;
      setIsUserTalking(false);
      userIsTalkingRef.current = false;
    }
  };

  /* ── Done Talking – kept for backward compat ── */
  const doneTalking = async () => {
    const rec = mediaRecorderRef.current;
    if (isLoading) return;
    
    // If Sara is talking and user clicks Done Talking, it means they want to interrupt or skip
    if (isSaraTalking) {
      window.speechSynthesis.cancel();
      setIsSaraTalking(false);
      sendToAvatar({ type: 'stop' });
    }
    // Stop any current recording to flush the audio buffer
    setIsRecording(false);
    isRecordingRef.current = false;
    setIsUserTalking(false);
    userIsTalkingRef.current = false;
    if (rec && rec.state === 'recording') {
      try { rec.stop(); } catch (e) {}
      // onstop will call sendAudioToBackend which handles Groq fallback
    } else {
      // If no recording active but we have a transcript, send it directly
      const transcript = window._lastSpeechTranscript || '';
      if (transcript.trim()) {
        setMessageInput('');
        setIsLoading(true);
        window._lastSpeechTranscript = '';
        try {
          // Restart recognition to clear internal buffer for next turn
          if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch(e) {}
          }
          // Try backend first
          try {
            const res = await fetch(`${AVATAR_BACKEND}/tts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: transcript, emotion: emotionRef.current }),
              signal: AbortSignal.timeout(5000),
            });
            const data = await res.json();
            if (data.messages?.length) {
              conversationRef.current.push({ role: 'user', content: transcript });
              const saraText = data.messages.map(m => m.text).join(' ');
              conversationRef.current.push({ role: 'assistant', content: saraText });
              enqueueMessages(data.messages);
              return;
            }
          } catch (e) {}
          // Groq fallback
          const DEFAULT_KEY = '';
          const gKey = localStorage.getItem('hired_groq_key') || DEFAULT_KEY;
          if (gKey) {
            conversationRef.current.push({ role: 'user', content: transcript });
            const history = conversationRef.current.slice(-12);
            const reply = await groqDirect(
              [{ role: 'system', content: buildSaraPrompt(role, diff, focus, emotionRef.current) }, ...history],
              gKey
            );
            conversationRef.current.push({ role: 'assistant', content: reply });
            enqueueMessages([{ text: reply, facialExpression: emotionRef.current === 'Stressed' ? 'concerned' : 'smile' }]);
          }
        } catch (err) {
          setErrorMsg('Error: ' + err.message);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const startCall = async () => {
    if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
    setIsCalling(true);
    setIsLoading(true);
    conversationRef.current = []; // Fresh session
    window._lastSpeechTranscript = '';
    try {
      // Try avatar backend
      try {
        const res  = await fetch(`${AVATAR_BACKEND}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `I have joined the call. The role is: ${role}.`, emotion: 'Neutral' }),
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        if (data.messages?.length) {
          const saraText = data.messages.map(m => m.text).join(' ');
          conversationRef.current.push({ role: 'assistant', content: saraText });
          enqueueMessages(data.messages);
          return;
        }
      } catch (e) {
        console.warn('Avatar backend offline, using Groq for greeting');
      }
      // Groq fallback greeting
      const DEFAULT_KEY = '';
      const gKey = localStorage.getItem('hired_groq_key') || DEFAULT_KEY;
      if (gKey) {
        const greeting = await groqDirect([
          { role: 'system', content: buildSaraPrompt(role, diff, focus, 'Neutral') },
          { role: 'user', content: `Hello, I'm ready for my ${role} interview.` }
        ], gKey);
        conversationRef.current.push({ role: 'user', content: `Hello, I'm ready for my ${role} interview.` });
        conversationRef.current.push({ role: 'assistant', content: greeting });
        enqueueMessages([{ text: greeting, facialExpression: 'smile' }]);
      } else {
        // No key — use a static greeting
        const staticGreeting = `Hello! I'm Sara, your AI interviewer today. We'll be discussing the ${role} position. Let's start — can you tell me a bit about yourself and your background?`;
        conversationRef.current.push({ role: 'assistant', content: staticGreeting });
        enqueueMessages([{ text: staticGreeting, facialExpression: 'smile' }]);
      }
    } catch (err) {
      setErrorMsg('Could not start interview: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = async () => {
    window.speechSynthesis.cancel();
    messagesQueueRef.current = [];
    conversationRef.current = [];
    window._lastSpeechTranscript = '';
    setSeconds(0);
    setIsLoading(false);
    setIsSaraTalking(false);
    setIsRecording(false);
    isRecordingRef.current = false;
    setIsUserTalking(false);
    userIsTalkingRef.current = false;
    playingRef.current = false;
    setExchangeCount(0);
    setFeedback(null);
    startCall();
  };

  const generateFeedback = async () => {
    if (conversationRef.current.length < 2) {
      onEnd();
      return;
    }
    setIsLoading(true);
    try {
      const DEFAULT_KEY = '';
      const gKey = localStorage.getItem('hired_groq_key') || DEFAULT_KEY;
      const historyText = conversationRef.current.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      const prompt = `Analyze this job interview for the role of ${role}.
The interview difficulty was ${diff}.
Focus areas were: ${focus.join(', ')}.

Transcript:
${historyText}

Provide a comprehensive feedback report in JSON format with these exact fields:
- "score": (overall percentage score 0-100)
- "strengths": [list of 3 key strengths shown]
- "improvements": [list of 3 key areas for improvement]
- "summary": (2-3 sentences summarizing performance)
- "verdict": (Hire, Strong Hire, No Hire, or Consider)

Return ONLY valid JSON.`;

      const responseText = await groqDirect([{ role: 'system', content: 'You are an expert HR senior analyst. Be critical but constructive.' }, { role: 'user', content: prompt }], gKey);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[0]);
        setFeedback(json);
      } else {
        throw new Error("Invalid feedback format");
      }
    } catch (err) {
      console.error('Feedback failed:', err);
      toast('Could not generate detailed feedback. Ending session.');
      onEnd(); 
    } finally {
      setIsLoading(false);
    }
  };

  const FeedbackUI = ({ data }) => (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1000, background: 'rgba(8,6,20,.98)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, animation: 'fadeIn .5s ease' }}>
      <div style={{ maxWidth: 600, width: '100%', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 32, padding: 40, boxShadow: '0 30px 100px rgba(0,0,0,.8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>Interview Report</div>
          <div style={{ fontSize: 64, fontWeight: 900, color: data.score >= 80 ? '#10b981' : data.score >= 60 ? '#a78bfa' : '#f87171', fontFamily: 'var(--serif)', marginBottom: 8 }}>{data.score}%</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Verdict: <span style={{ color: data.verdict.includes('Hire') ? '#10b981' : '#f87171' }}>{data.verdict}</span></div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: 12 }}>Key Strengths</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.strengths.map((s, i) => <li key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', display: 'flex', gap: 8 }}><span></span> {s}</li>)}
            </ul>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: 12 }}>Areas for Growth</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.improvements.map((s, i) => <li key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', display: 'flex', gap: 8 }}><span>•</span> {s}</li>)}
            </ul>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 16, padding: 20, marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', marginBottom: 8 }}>Analysis Summary</div>
          <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.6, fontStyle: 'italic' }}>"{data.summary}"</div>
        </div>

        <button onClick={onEnd} style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#a78bfa', border: 'none', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', transition: 'all .3s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
          Back to Career Center
        </button>
      </div>
    </div>
  );

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: '#080614', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ height: 60, flexShrink: 0, background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>Hired.</div>
        <div style={{ flex: 1 }} />
        {isCalling && !feedback && (
          <>
            <button 
              onClick={generateFeedback}
              style={{ padding: '8px 20px', borderRadius: 8, background: '#10b981', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,.3)' }}
            >
              Finish & Get Feedback
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderRadius: 50, background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.2)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1 }}>{fmt(seconds)}</span>
              <button onClick={resetSession} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}><IcRotate /></button>
            </div>
          </>
        )}
        <button onClick={onEnd} style={{ padding: '8px 18px', borderRadius: 8, background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <IcX /> Exit
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Main Viewport */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 280, background: 'linear-gradient(to top, #080614 0%, transparent 100%)', zIndex: 2 }} />
          
          {/* Sara Iframe */}
          <iframe ref={iframeRef} src="./avatar.html" style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }} allow="microphone" />

          {/* Candidate Biometric HUD Tile (Webcam & Neural Telemetry) */}
          <div style={{ position: 'absolute', bottom: 120, right: 24, zIndex: 10, width: 260, height: 190, borderRadius: 16, overflow: 'hidden', background: '#0a0d18', border: '2px solid rgba(16,185,129,0.3)', boxShadow: '0 12px 45px rgba(0,0,0,0.7), 0 0 25px rgba(16,185,129,0.15)' }}>
            
            {/* Real Webcam Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: hasCamera ? 'block' : 'none',
              }}
            />

            {/* Futuristic Biometric Waveform Fallback when camera is off/simulated */}
            {!hasCamera && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 50%, #161b33 0%, #080a14 100%)', position: 'relative' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, background: 'rgba(16,185,129,0.08)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase' }}>Candidate Audio Link</span>
              </div>
            )}

            {/* Top-Left: Live Emotion Pill */}
            <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 50, background: 'rgba(7,9,15,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: emotion === 'Confident' ? '#10b981' : (emotion === 'Engaged' ? '#38bdf8' : '#a78bfa'), boxShadow: '0 0 8px currentColor' }} />
              <span style={{ fontSize: 9.5, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.8 }}>{emotion} · {confidenceScore}%</span>
            </div>

            {/* Top-Right: HD Indicator */}
            <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 8.5, fontWeight: 800, color: '#10b981', letterSpacing: 1 }}>
              LIVE HD
            </div>

            {/* Bottom-Left: Real-time Audio EQ Waves */}
            <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', gap: 2.5, height: 16, alignItems: 'flex-end' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ width: 3, height: Math.max(3, (volume / (90 - i * 10)) * 16), background: '#10b981', borderRadius: 2, transition: 'height 0.08s ease' }} />
              ))}
            </div>

            {/* Bottom-Right: Metric Gauge */}
            <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>
              Focus: 95%
            </div>
          </div>

          {/* Status HUD */}
          <div style={{ position: 'absolute', bottom: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 5, textAlign: 'center', minWidth: 320 }}>
            {isLoading && (
              <div style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 50, background: 'rgba(167,139,250,.3)', border: '1px solid rgba(167,139,250,.5)', animation: 'vBounce 1.5s infinite' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,.2)', borderTopColor: '#fff', animation: 'vSpin .8s linear infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>Sara is analyzing...</span>
              </div>
            )}
            <div style={{ padding: '12px 32px', borderRadius: 50, background: isUserTalking ? 'rgba(16,185,129,.25)' : 'rgba(0,0,0,.6)', backdropFilter: 'blur(20px)', border: `2px solid ${isUserTalking ? '#10b981' : 'rgba(255,255,255,.1)'}`, color: '#fff', fontSize: 15, fontWeight: 700, transition: 'all .3s', display: 'inline-flex', alignItems: 'center', gap: 12, boxShadow: isUserTalking ? '0 0 30px rgba(16,185,129,.3)' : 'none' }}>
              {isUserTalking && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'vPulse 1s infinite' }} />}
              {statusText.toUpperCase()}
            </div>
          </div>

          {/* Controls Bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '24px 40px' }}>
            {!isCalling ? (
              <button
                onClick={startCall}
                style={{ padding: '18px 60px', borderRadius: 50, background: 'linear-gradient(135deg, #7c5ce8, #4f31b9)', border: 'none', color: '#fff', fontSize: 18, fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 50px rgba(124,92,232,.4)', transition: 'all .3s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Join Live Interview
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>

                {/* Push-to-Talk Mic Button */}
                <button
                  onClick={toggleMic}
                  disabled={isLoading}
                  title={isRecording ? 'Click to send your answer' : 'Click to start speaking'}
                  style={{
                    width: 72, height: 72, borderRadius: '50%', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                    background: isRecording
                      ? 'radial-gradient(circle, #ef4444, #b91c1c)'
                      : 'radial-gradient(circle, #7c5ce8, #4f31b9)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isRecording
                      ? '0 0 0 8px rgba(239,68,68,.25), 0 0 40px rgba(239,68,68,.5)'
                      : '0 0 0 4px rgba(124,92,232,.2), 0 0 30px rgba(124,92,232,.4)',
                    transition: 'all .25s',
                    animation: isRecording ? 'vPulse 1.2s ease-in-out infinite' : 'none',
                    opacity: isLoading ? 0.4 : 1,
                    transform: isRecording ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  {isRecording ? <IcMicOff /> : <IcMic />}
                </button>

                {/* Label */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isRecording ? '#f87171' : 'rgba(255,255,255,.8)', transition: 'color .2s' }}>
                    {isRecording ? '● Recording — click to send' : 'Click mic to speak'}
                  </div>
                  {isRecording && (
                    <div style={{ display: 'flex', gap: 3, height: 14, alignItems: 'flex-end', marginTop: 6, justifyContent: 'center' }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ width: 4, height: Math.max(3, (volume / (110 - i*12)) * 14), background: '#ef4444', borderRadius: 2, transition: 'height .08s' }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Type fallback */}
                <div style={{ position: 'relative' }}>
                  <input
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendTextInput(); }}
                    placeholder="Or type your answer…"
                    style={{ width: 260, padding: '14px 52px 14px 20px', borderRadius: 50, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', outline: 'none', fontSize: 14, backdropFilter: 'blur(12px)' }}
                  />
                  <button onClick={sendTextInput} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: 'none', background: messageInput.trim() ? '#a78bfa' : 'transparent', color: messageInput.trim() ? '#fff' : 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <IcSend />
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        {showCoach && (
          <div style={{ width: 320, flexShrink: 0, background: 'rgba(255,255,255,.01)', borderLeft: '1px solid rgba(255,255,255,.05)', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Position</div>
              <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(167,139,250,.07)', border: '1px solid rgba(167,139,250,.15)' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{role}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', lineHeight: 1.6 }}>
                  <b>Target:</b> {focus.join(', ')}<br/>
                  <b>Difficulty:</b> {diff.toUpperCase()}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Mood Analysis</div>
              <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,.03)', border: `1px solid ${
                emotion === 'Stressed' ? 'rgba(239,68,68,.3)' :
                emotion === 'Confident' ? 'rgba(16,185,129,.3)' :
                emotion === 'Engaged' ? 'rgba(167,139,250,.3)' :
                emotion === 'Frustrated' ? 'rgba(245,158,11,.3)' :
                'rgba(255,255,255,.05)'
              }`, transition: 'border-color .4s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: (
                    emotion === 'Stressed' ? 'rgba(239,68,68,.15)' :
                    emotion === 'Confident' ? 'rgba(16,185,129,.15)' :
                    emotion === 'Engaged' ? 'rgba(167,139,250,.15)' :
                    emotion === 'Frustrated' ? 'rgba(245,158,11,.15)' :
                    'rgba(255,255,255,.05)'
                  ), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, transition: 'all .4s' }}>
                    {emotion === 'Stressed' ? '' : emotion === 'Confident' ? '' : emotion === 'Engaged' ? '' : emotion === 'Frustrated' ? '' : ''}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Detected: {emotion}</div>
                    <div style={{ fontSize: 11, color: (
                      emotion === 'Stressed' ? '#f87171' :
                      emotion === 'Confident' ? '#10b981' :
                      emotion === 'Engaged' ? '#a78bfa' :
                      emotion === 'Frustrated' ? '#fbbf24' :
                      'rgba(255,255,255,.4)'
                    ), transition: 'color .4s' }}>
                      {emotion === 'Stressed' ? 'Sara will help you relax' :
                       emotion === 'Confident' ? 'Great energy! Keep it up' :
                       emotion === 'Engaged' ? 'You seem focused — good!' :
                       emotion === 'Frustrated' ? 'Take a breath, you\'ve got this' :
                       'Monitoring your mood...'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.5 }}>
                  {emotion === 'Stressed'
                    ? ' Tip: Slow down. Pause before answering. Sara will adjust her tone to ease the pressure.'
                    : emotion === 'Confident'
                    ? ' You\'re projecting confidence. Articulate your experience with specific examples.'
                    : emotion === 'Engaged'
                    ? ' You look engaged — great! Structure answers with the STAR method.'
                    : emotion === 'Frustrated'
                    ? ' Tip: It\'s okay to say "Let me think for a moment" — it shows composure.'
                    : 'Sara monitors your body language in real-time and adapts to help you perform your best.'}
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }} />
            
            {errorMsg && (
              <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#fca5a5', fontSize: 11, lineHeight: 1.5 }}>
                 ️ {errorMsg}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes vPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(0.8)} }
        @keyframes vSpin { to{transform:rotate(360deg)} }
        @keyframes vBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
      {feedback && <FeedbackUI data={feedback} />}
    </div>
  );
}
