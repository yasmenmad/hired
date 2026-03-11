import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { interviewApi } from '../services/api'
import { API_URL } from '../services/api'
import { Mic2, Send, Square, ChevronRight, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const NIVEAUX = ['junior', 'intermediaire', 'senior']

export default function InterviewPage() {
  const { user } = useAuthStore()
  const [phase, setPhase] = useState<'config' | 'session' | 'rapport'>('config')
  const [config, setConfig] = useState({ description_manuelle: '', niveau_expertise: 'junior', mode: 'texte' })
  const [session, setSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [rapport, setRapport] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const startMut = useMutation({
    mutationFn: interviewApi.start,
    onSuccess: (data) => {
      setSession(data)
      setMessages(data.historique || [])
      setPhase('session')
    }
  })

  const endMut = useMutation({
    mutationFn: interviewApi.end,
    onSuccess: (data) => { setRapport(data.rapport); setPhase('rapport') }
  })

  const sendMessage = async () => {
    if (!input.trim() || streaming) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    const token = localStorage.getItem('access_token')
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/interview/${session.id}/message/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: userMsg.content })
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let aiContent = ''

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      const lines = text.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        const chunk = line.replace('data: ', '')
        if (chunk === '[DONE]') break
        aiContent += chunk
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: aiContent }
          return updated
        })
      }
    }
    setStreaming(false)
  }

  if (phase === 'config') return (
    <div style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Simulateur <span style={{ color: '#f472b6' }}>d'entretien IA</span></h1>
      <p style={{ color: '#64748b', marginBottom: 32, fontSize: 14 }}>GPT-4o joue le rôle d'un recruteur professionnel et évalue vos réponses</p>

      <div style={{ background: '#0d1421', border: '1px solid #1a2840', borderRadius: 16, padding: 28 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Description du poste ou offre ciblée</label>
          <textarea value={config.description_manuelle}
            onChange={e => setConfig(p => ({ ...p, description_manuelle: e.target.value }))}
            placeholder="Ex: Développeur Full Stack React/Node.js, 3 ans d'expérience requis, startup fintech..."
            style={{ ...inputStyle, height: 120, resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Niveau d'expertise</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {NIVEAUX.map(n => (
              <button key={n} onClick={() => setConfig(p => ({ ...p, niveau_expertise: n }))}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `2px solid ${config.niveau_expertise === n ? '#f472b6' : '#1a2840'}`, background: config.niveau_expertise === n ? 'rgba(244,114,182,0.1)' : '#111d2e', color: config.niveau_expertise === n ? '#f472b6' : '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Mode</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['texte', 'audio'].map(m => (
              <button key={m} onClick={() => setConfig(p => ({ ...p, mode: m }))}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `2px solid ${config.mode === m ? '#f472b6' : '#1a2840'}`, background: config.mode === m ? 'rgba(244,114,182,0.1)' : '#111d2e', color: config.mode === m ? '#f472b6' : '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>
                {m === 'texte' ? '💬 Texte' : '🎤 Audio (bientôt)'}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => startMut.mutate(config)} disabled={startMut.isPending}
          style={{ width: '100%', background: 'linear-gradient(135deg,#f472b6,#a78bfa)', border: 'none', borderRadius: 10, padding: '14px 0', fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
          {startMut.isPending ? '⏳ Démarrage...' : '🚀 Démarrer la session d\'entretien'}
        </button>
      </div>
    </div>
  )

  if (phase === 'rapport') return (
    <div style={{ padding: 32, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Rapport <span style={{ color: '#00ff88' }}>STAR</span></h1>
      <p style={{ color: '#64748b', marginBottom: 28, fontSize: 14 }}>Analyse de votre performance</p>

      {rapport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Score */}
          <div style={{ background: '#0d1421', border: '1px solid #1a2840', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 64, fontWeight: 800, color: rapport.score_global >= 70 ? '#00ff88' : rapport.score_global >= 50 ? '#fbbf24' : '#f87171' }}>
              {rapport.score_global}<span style={{ fontSize: 24, color: '#64748b' }}>/100</span>
            </div>
            <div style={{ color: '#64748b', fontSize: 14 }}>{rapport.resume}</div>
          </div>

          {/* Compétences */}
          {rapport.evaluation_par_competence && (
            <div style={{ background: '#0d1421', border: '1px solid #1a2840', borderRadius: 16, padding: 24 }}>
              <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Évaluation par compétence</h3>
              {Object.entries(rapport.evaluation_par_competence).map(([k, v]: any) => (
                <div key={k} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#00ff88' }}>{v}%</span>
                  </div>
                  <div style={{ height: 6, background: '#1a2840', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${v}%`, background: 'linear-gradient(90deg,#00ff88,#38bdf8)', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Points forts / axes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: '#0d1421', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 12, padding: 20 }}>
              <h4 style={{ color: '#00ff88', marginBottom: 10, fontSize: 13 }}>✅ Points forts</h4>
              {rapport.points_forts?.map((p: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>• {p}</div>)}
            </div>
            <div style={{ background: '#0d1421', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: 20 }}>
              <h4 style={{ color: '#fbbf24', marginBottom: 10, fontSize: 13 }}>🎯 Axes d'amélioration</h4>
              {rapport.axes_amelioration?.map((p: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>• {p}</div>)}
            </div>
          </div>

          <button onClick={() => { setPhase('config'); setMessages([]); setSession(null) }}
            style={{ background: '#1a2840', border: '1px solid #1a2840', borderRadius: 8, padding: '12px 0', color: '#e2e8f0', cursor: 'pointer', fontWeight: 600 }}>
            🔄 Nouveau entretien
          </button>
        </div>
      )}
    </div>
  )

  // Session active
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid #1a2840', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1421' }}>
        <div>
          <span style={{ color: '#f472b6', fontWeight: 700 }}>🎤 Entretien en cours</span>
          <span style={{ color: '#64748b', fontSize: 13, marginLeft: 12 }}>{config.niveau_expertise} · {config.mode}</span>
        </div>
        <button onClick={() => endMut.mutate(session.id)} disabled={endMut.isPending}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '8px 16px', color: '#f87171', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <Square size={14} /> Terminer
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((m: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '70%', padding: '12px 16px', borderRadius: 12,
              background: m.role === 'user' ? 'rgba(0,255,136,0.1)' : '#111d2e',
              border: `1px solid ${m.role === 'user' ? 'rgba(0,255,136,0.2)' : '#1a2840'}`,
              fontSize: 14, lineHeight: 1.6, color: '#e2e8f0'
            }}>
              {m.role === 'assistant' && <div style={{ fontSize: 11, color: '#f472b6', fontWeight: 700, marginBottom: 6 }}>🤖 Recruteur IA</div>}
              {m.content}
              {m.role === 'assistant' && streaming && i === messages.length - 1 && (
                <span style={{ color: '#f472b6', animation: 'pulse 1s infinite' }}>▊</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 28px', borderTop: '1px solid #1a2840', background: '#0d1421', display: 'flex', gap: 12 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Votre réponse... (Entrée pour envoyer)"
          style={{ flex: 1, background: '#111d2e', border: '1px solid #1a2840', borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', resize: 'none', height: 52 }} />
        <button onClick={sendMessage} disabled={streaming || !input.trim()}
          style={{ background: streaming ? '#1a2840' : '#f472b6', border: 'none', borderRadius: 10, padding: '0 18px', cursor: streaming ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
          <Send size={18} color={streaming ? '#64748b' : '#000'} />
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', background: '#111d2e', border: '1px solid #1a2840', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600 }
