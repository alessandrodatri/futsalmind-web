// src/pages/TeamPage.tsx
import { useEffect, useState } from 'react'
import { useTeam } from '../stores'
import { TeamMember } from '../lib/supabase'

export default function TeamPage() {
  const { team, role, members, fetchMembers, createTeam, joinTeam } = useTeam()
  const { profile } = require('../stores').useAuth()
  const [mode, setMode] = useState<'none'|'create'|'join'>('none')
  const [name, setName] = useState(''); const [city, setCity] = useState('')
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => { if (team) fetchMembers(team.id) }, [team])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!name.trim()) { setError('Inserisci il nome'); return }
    setSaving(true)
    const t = await createTeam(name.trim(), city.trim(), profile.id)
    setSaving(false)
    if (!t) setError('Errore nella creazione')
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!code.trim()) { setError('Inserisci il codice'); return }
    setSaving(true)
    const ok = await joinTeam(code.trim(), profile.id)
    setSaving(false)
    if (!ok) setError('Codice non valido')
  }

  const copyCode = () => {
    if (!team) return
    navigator.clipboard.writeText(team.invite_code)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const getRoleBadge = (r: string) => r === 'manager' ? 'badge-orange' : r === 'coach' ? 'badge-blue' : 'badge-green'
  const getRoleLabel = (r: string) => r === 'manager' ? '👑 Manager' : r === 'coach' ? '📋 Coach' : '⚽ Giocatore'

  if (!team) return (
    <div className="page fade-in">
      <div className="page-header"><h1 className="page-title">👥 Squadra</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, maxWidth: 640, marginBottom: 24 }}>
        <button className="card" onClick={() => setMode('create')}
          style={{ cursor: 'pointer', border: mode === 'create' ? '1px solid var(--green)' : '1px solid var(--border)', background: mode === 'create' ? 'var(--green-dim)' : 'var(--card)', textAlign: 'left' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🏆</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff' }}>Crea Squadra</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Diventa il manager del tuo team</div>
        </button>
        <button className="card" onClick={() => setMode('join')}
          style={{ cursor: 'pointer', border: mode === 'join' ? '1px solid var(--green)' : '1px solid var(--border)', background: mode === 'join' ? 'var(--green-dim)' : 'var(--card)', textAlign: 'left' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔑</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff' }}>Unisciti</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Usa il codice invito della tua squadra</div>
        </button>
      </div>

      {mode === 'create' && (
        <div className="card fade-in" style={{ maxWidth: 420, borderColor: 'var(--green)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Crea la tua Squadra</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group"><label className="form-label">Nome Squadra *</label><input className="form-input" placeholder="es. Gli Invincibili FC" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Città</label><input className="form-input" placeholder="es. Milano" value={city} onChange={e => setCity(e.target.value)} /></div>
            {error && <div className="alert-box alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: '100%' }}>{saving ? '...' : 'Crea Squadra'}</button>
          </form>
        </div>
      )}
      {mode === 'join' && (
        <div className="card fade-in" style={{ maxWidth: 420, borderColor: 'var(--green)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Unisciti con Codice</h3>
          <form onSubmit={handleJoin}>
            <div className="form-group"><label className="form-label">Codice Invito *</label>
              <input className="form-input" placeholder="es. AB3F7C2D" value={code} onChange={e => setCode(e.target.value.toUpperCase())} style={{ letterSpacing: 6, fontSize: 20, fontWeight: 800, textAlign: 'center' }} />
            </div>
            {error && <div className="alert-box alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: '100%' }}>{saving ? '...' : 'Entra nel Team'}</button>
          </form>
        </div>
      )}
    </div>
  )

  const managers = members.filter((m: TeamMember) => m.role === 'manager')
  const coaches = members.filter((m: TeamMember) => m.role === 'coach')
  const players = members.filter((m: TeamMember) => m.role === 'player')

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
        <div className="avatar avatar-xl">{team.name[0]}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: '#fff' }}>{team.name}</h1>
          {team.city && <div style={{ color: 'var(--muted)', fontSize: 15, marginTop: 4 }}>📍 {team.city}</div>}
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 2 }}>👥 {members.length} membri</div>
        </div>
        {/* Invite code */}
        <div className="card" style={{ borderColor: 'var(--green)', minWidth: 200, textAlign: 'center' }}>
          <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Codice Invito</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 6, margin: '6px 0' }}>{team.invite_code}</div>
          <button className="btn btn-secondary btn-sm" onClick={copyCode} style={{ width: '100%' }}>
            {copied ? '✅ Copiato!' : '📋 Copia codice'}
          </button>
        </div>
      </div>

      {/* Roster */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Rosa Completa</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Giocatore</th><th>Username</th><th>Ruolo</th><th>#</th></tr></thead>
          <tbody>
            {[...managers, ...coaches, ...players].map((m: TeamMember) => (
              <tr key={m.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar avatar-sm">{(m.profiles?.full_name || m.profiles?.username || '?')[0].toUpperCase()}</div>
                    <span style={{ fontWeight: 700 }}>{m.profiles?.full_name || m.profiles?.username}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--muted)' }}>@{m.profiles?.username}</td>
                <td><span className={`badge ${getRoleBadge(m.role)}`}>{getRoleLabel(m.role)}</span></td>
                <td style={{ color: 'var(--muted)' }}>{m.jersey_number ? `#${m.jersey_number}` : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
