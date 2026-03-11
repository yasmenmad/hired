import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { candidaturesApi } from '../services/api'
import { Plus, Download, Search, GripVertical, Edit2, Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const COLUMNS = [
  { id: 'sauvegardee',  label: '🔖 Sauvegardée',        color: '#38bdf8' },
  { id: 'envoyee',      label: '📤 Envoyée',             color: '#a78bfa' },
  { id: 'entretien',    label: '🎯 Entretien',           color: '#fbbf24' },
  { id: 'offre_recue',  label: '🎉 Offre reçue',         color: '#00ff88' },
  { id: 'refusee',      label: '❌ Refusée',             color: '#f87171' },
]

const PRIORITY_COLORS: Record<string, string> = {
  faible:   '#64748b',
  moyen:    '#38bdf8',
  eleve:    '#fbbf24',
  critique: '#f87171',
}

export default function TrackerPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ entreprise_manuelle: '', poste_manuel: '', statut: 'sauvegardee', priorite: 'moyen', notes: '', contact: '' })

  const { data: candidatures = [], isLoading } = useQuery({ queryKey: ['candidatures'], queryFn: candidaturesApi.getAll })

  const createMut = useMutation({
    mutationFn: candidaturesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidatures'] }); setShowModal(false); toast.success('Candidature ajoutée') }
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => candidaturesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidatures'] }); setShowModal(false); toast.success('Mise à jour') }
  })

  const deleteMut = useMutation({
    mutationFn: candidaturesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidatures'] }); toast.success('Supprimée') }
  })

  const filtered = candidatures.filter((c: any) =>
    (c.entreprise_manuelle || c.poste_manuel || '')
      .toLowerCase().includes(search.toLowerCase())
  )

  const getCol = (status: string) => filtered.filter((c: any) => c.statut === status)

  const openEdit = (c: any) => {
    setEditing(c)
    setForm({ entreprise_manuelle: c.entreprise_manuelle || '', poste_manuel: c.poste_manuel || '', statut: c.statut, priorite: c.priorite, notes: c.notes || '', contact: c.contact || '' })
    setShowModal(true)
  }

  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, data: form })
    else createMut.mutate(form)
  }

  const handleExport = async () => {
    const blob = await candidaturesApi.export('xlsx')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'candidatures.xlsx'; a.click()
  }

  return (
    <div style={{ padding: 32, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Tracker <span style={{ color: '#00ff88' }}>Kanban</span></h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>{candidatures.length} candidature{candidatures.length > 1 ? 's' : ''} suivie{candidatures.length > 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleExport} style={outlineBtn}>
            <Download size={15} /> Export Excel
          </button>
          <button onClick={() => { setEditing(null); setForm({ entreprise_manuelle: '', poste_manuel: '', statut: 'sauvegardee', priorite: 'moyen', notes: '', contact: '' }); setShowModal(true) }} style={primaryBtn}>
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24, maxWidth: 340 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          style={{ width: '100%', paddingLeft: 36, ...inputStyle }}
        />
      </div>

      {/* Kanban */}
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16 }}>
        {COLUMNS.map(col => {
          const cards = getCol(col.id)
          return (
            <div key={col.id} style={{ minWidth: 240, width: 240, flexShrink: 0 }}>
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '8px 12px', background: '#0d1421', borderRadius: 8, border: `1px solid ${col.color}33` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: col.color }}>{col.label}</span>
                <span style={{ background: `${col.color}22`, color: col.color, borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{cards.length}</span>
              </div>
              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cards.map((c: any) => (
                  <div key={c.id} style={{ background: '#0d1421', border: '1px solid #1a2840', borderRadius: 10, padding: 14, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{c.poste_manuel || c.offre?.titre_poste || 'Poste'}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{c.entreprise_manuelle || c.offre?.entreprise}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(c)} style={iconBtn}><Edit2 size={12}/></button>
                        <button onClick={() => deleteMut.mutate(c.id)} style={{ ...iconBtn, color: '#f87171' }}><Trash2 size={12}/></button>
                      </div>
                    </div>
                    {c.contact && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>👤 {c.contact}</div>}
                    {c.notes && <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginBottom: 8, borderLeft: '2px solid #1a2840', paddingLeft: 8 }}>{c.notes.slice(0, 60)}{c.notes.length > 60 ? '...' : ''}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: PRIORITY_COLORS[c.priorite] || '#64748b', background: `${PRIORITY_COLORS[c.priorite]}22`, padding: '2px 8px', borderRadius: 10 }}>
                        {c.priorite.toUpperCase()}
                      </span>
                      {c.score_compatibilite && (
                        <span style={{ fontSize: 11, color: '#00ff88', fontWeight: 700 }}>{c.score_compatibilite}% match</span>
                      )}
                    </div>
                    {/* Move to column */}
                    <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {COLUMNS.filter(x => x.id !== col.id).map(x => (
                        <button key={x.id} onClick={() => updateMut.mutate({ id: c.id, data: { statut: x.id } })}
                          style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, border: `1px solid ${x.color}44`, background: `${x.color}11`, color: x.color, cursor: 'pointer', fontWeight: 600 }}>
                          → {x.label.split(' ')[1]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#1a2840', fontSize: 12, border: '2px dashed #1a2840', borderRadius: 8 }}>
                    Vide
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#0d1421', border: '1px solid #1a2840', borderRadius: 16, padding: 32, width: 460 }}>
            <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 700 }}>{editing ? 'Modifier' : 'Ajouter'} une candidature</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Entreprise</label><input value={form.entreprise_manuelle} onChange={e => setForm(p => ({ ...p, entreprise_manuelle: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Poste</label><input value={form.poste_manuel} onChange={e => setForm(p => ({ ...p, poste_manuel: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Contact</label><input value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Statut</label>
                  <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))} style={inputStyle}>
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Priorité</label>
                  <select value={form.priorite} onChange={e => setForm(p => ({ ...p, priorite: e.target.value }))} style={inputStyle}>
                    {['faible','moyen','eleve','critique'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={labelStyle}>Notes</label><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, height: 80, resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={outlineBtn}>Annuler</button>
              <button onClick={submit} style={primaryBtn}>{editing ? 'Mettre à jour' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', background: '#111d2e', border: '1px solid #1a2840', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }
const primaryBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: '#00ff88', color: '#000', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }
const outlineBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: '#64748b', border: '1px solid #1a2840', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const iconBtn: React.CSSProperties = { background: '#111d2e', border: '1px solid #1a2840', borderRadius: 4, padding: '3px 5px', cursor: 'pointer', color: '#64748b', display: 'flex' }
