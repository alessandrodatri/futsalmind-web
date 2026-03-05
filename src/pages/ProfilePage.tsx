// src/pages/ProfilePage.tsx
import { useEffect, useState } from 'react'
import { supabase, PlayerStats, Position } from '../lib/supabase'
import { useAuth } from '../stores'

const POSITIONS: Position[] = ['portiere', 'terzino', 'pivot', 'ala', 'universale']
const FEET = ['destro', 'sinistro', 'ambidestro'] as const

export default function ProfilePage() {
  const { profile, fetchProfile } = useAuth()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [position, setPosition] = useState<Position | null>(profile?.position ?? null)
  const [foot, setFoot] = useState<string | null>(profile?.foot ?? null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? ''); setBio(profile.bio ?? '')
    setPosition(profile.position ?? null); setFoot(profile.foot ?? null)
    supabase.from('player_stats').select('*').eq('player_id', profile.id).single().then(({ data }) => setStats(data))
  }, [profile])

  const save = async () => {
    if (!profile) return; setSaving(true)
    await supabase.from('profiles').update({ full_name: fullName, bio, position, foot }).eq('id', profile.id)
    await fetchProfile(profile.id)
    setSaving(false); setEditing(false); setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  const StatCard = ({ icon, label, value }: { icon: string; label: string; value: number }) => (
    <div className="stat-card">
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )

  return (
    <div className="page fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
        <div className="avatar avatar-xl">{(profile?.full_name || profile?.username || '?')[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          {editing
            ? <input className="form-input" style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nome completo" />
            : <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: '#fff' }}>{profile?.full_name || profile?.username}</h1>
          }
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>@{profile?.username}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing
            ? <><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '...' : '💾 Salva'}</button>
               <button className="btn btn-secondary" onClick={() => setEditing(false)}>Annulla</button></>
            : <button className="btn btn-secondary" onClick={() => setEditing(true)}>✏️ Modifica</button>
          }
        </div>
      </div>

      {success && <div className="alert-box alert-success" style={{ marginBottom: 20 }}>✅ Profilo aggiornato!</div>}

      {/* Stats */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 14 }}>📊 Le tue Statistiche</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, marginBottom: 32 }}>
        <StatCard icon="⚽" label="Gol" value={stats?.total_goals ?? 0} />
        <StatCard icon="🎯" label="Assist" value={stats?.assists ?? 0} />
        <StatCard icon="📅" label="Presenze" value={stats?.matches_attended ?? 0} />
        <StatCard icon="🏆" label="MVP" value={stats?.mvp_count ?? 0} />
        <StatCard icon="🟨" label="Gialli" value={stats?.yellow_cards ?? 0} />
        <StatCard icon="🟥" label="Rossi" value={stats?.red_cards ?? 0} />
      </div>

      {/* Bio */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 14 }}>👤 Profilo</h2>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Bio</label>
          {editing
            ? <textarea className="form-input" value={bio} onChange={e => setBio(e.target.value)} placeholder="Scrivi qualcosa su di te..." maxLength={200} />
            : <p style={{ color: bio ? 'var(--text)' : 'var(--muted2)', fontSize: 15, fontStyle: bio ? 'normal' : 'italic' }}>{bio || 'Nessuna bio inserita'}</p>
          }
        </div>
        <div className="form-group">
          <label className="form-label">Ruolo in campo</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {POSITIONS.map(p => (
              <button key={p} onClick={() => editing && setPosition(p)} disabled={!editing}
                style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${position === p ? 'var(--green)' : 'var(--border2)'}`,
                  background: position === p ? 'var(--green-dim)' : 'var(--card2)',
                  color: position === p ? 'var(--green-bright)' : 'var(--muted)', fontWeight: 700, fontSize: 14, cursor: editing ? 'pointer' : 'default' }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Piede preferito</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {FEET.map(f => (
              <button key={f} onClick={() => editing && setFoot(f)} disabled={!editing}
                style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${foot === f ? 'var(--green)' : 'var(--border2)'}`,
                  background: foot === f ? 'var(--green-dim)' : 'var(--card2)',
                  color: foot === f ? 'var(--green-bright)' : 'var(--muted)', fontWeight: 700, fontSize: 14, cursor: editing ? 'pointer' : 'default' }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
