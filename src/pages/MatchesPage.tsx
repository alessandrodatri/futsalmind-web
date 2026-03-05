// src/pages/MatchesPage.tsx
import { useEffect, useState } from 'react'
import { supabase, Match } from '../lib/supabase'
import { useAuth, useTeam } from '../stores'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

type Tab = 'upcoming' | 'past'

export default function MatchesPage() {
  const { profile } = useAuth()
  const { team, role } = useTeam()
  const [matches, setMatches] = useState<Match[]>([])
  const [tab, setTab] = useState<Tab>('upcoming')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  // form
  const [opponent, setOpponent] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [venue, setVenue] = useState('')
  const [isHome, setIsHome] = useState(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetch = async () => {
    if (!team) return
    setLoading(true)
    const now = new Date().toISOString()
    const q = supabase.from('matches').select('*').eq('team_id', team.id)
    const { data } = tab === 'upcoming'
      ? await q.gte('match_date', now).order('match_date')
      : await q.lt('match_date', now).order('match_date', { ascending: false })
    setMatches(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [team, tab])

  const fmt = (iso: string) => format(new Date(iso), "EEE d MMM · HH:mm", { locale: it })

  const saveMatch = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!opponent || !matchDate) { setError('Avversario e data sono obbligatori'); return }
    setSaving(true)
    const { error } = await supabase.from('matches').insert({
      team_id: team!.id, opponent_name: opponent,
      match_date: new Date(matchDate).toISOString(),
      venue: venue || null, is_home: isHome, notes: notes || null,
      created_by: profile!.id
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setShowForm(false); setOpponent(''); setMatchDate(''); setVenue(''); setNotes('')
    fetch()
  }

  const setResult = async (id: string, sh: number, sa: number) => {
    await supabase.from('matches').update({ score_home: sh, score_away: sa, status: 'completed' }).eq('id', id)
    fetch()
  }

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h1 className="page-title">⚽ Partite</h1><p className="page-sub">{team?.name}</p></div>
        {(role === 'manager' || role === 'coach') && (
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Chiudi' : '+ Nuova Partita'}
          </button>
        )}
      </div>

      {/* New match form */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: 24, borderColor: 'var(--green)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Nuova Partita</h3>
          <form onSubmit={saveMatch}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Avversario *</label>
                <input className="form-input" placeholder="Nome squadra" value={opponent} onChange={e => setOpponent(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Data e ora *</label>
                <input className="form-input" type="datetime-local" value={matchDate} onChange={e => setMatchDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Campo</label>
                <input className="form-input" placeholder="es. Palestra Comunale" value={venue} onChange={e => setVenue(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Note</label>
                <input className="form-input" placeholder="Informazioni aggiuntive" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>
                <input type="checkbox" checked={isHome} onChange={e => setIsHome(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--green)' }} />
                🏠 Partita in casa
              </label>
              {error && <span className="alert-box alert-error" style={{ padding: '6px 12px' }}>{error}</span>}
              <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginLeft: 'auto' }}>
                {saving ? '...' : 'Salva Partita'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--card)', borderRadius: 'var(--radius-sm)', padding: 4, marginBottom: 20, border: '1px solid var(--border)', width: 'fit-content' }}>
        {(['upcoming', 'past'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
              background: tab === t ? 'var(--green)' : 'transparent', color: tab === t ? '#fff' : 'var(--muted)' }}>
            {t === 'upcoming' ? 'Prossime' : 'Giocate'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? <div style={{ color: 'var(--muted)', padding: 20 }}>Caricamento...</div> : (
        matches.length === 0
          ? <div className="empty-state"><span className="empty-icon">⚽</span><div className="empty-title">Nessuna partita</div></div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {matches.map(m => {
                const ts = m.is_home ? m.score_home : m.score_away
                const os = m.is_home ? m.score_away : m.score_home
                const won = ts !== null && os !== null && ts > os
                const draw = ts !== null && os !== null && ts === os
                return (
                  <div className="card" key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: '#fff' }}>{team?.name}</span>
                        <span style={{ color: 'var(--orange)', fontWeight: 900 }}>VS</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: '#fff' }}>{m.opponent_name}</span>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>📅 {fmt(m.match_date)}{m.venue ? ` · 📍 ${m.venue}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`badge ${m.is_home ? 'badge-green' : 'badge-gray'}`}>{m.is_home ? 'Casa' : 'Trasferta'}</span>
                      {ts !== null
                        ? <div style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: '#fff' }}>{ts} – {os}</div>
                            <span className={`badge ${won ? 'badge-green' : draw ? 'badge-orange' : 'badge-red'}`} style={{ fontSize: 10 }}>
                              {won ? 'V' : draw ? 'P' : 'S'}
                            </span>
                          </div>
                        : (role === 'manager' || role === 'coach') && tab === 'upcoming'
                          ? null
                          : <span style={{ color: 'var(--muted2)', fontSize: 13 }}>–</span>
                      }
                      {(role === 'manager' || role === 'coach') && ts === null && (
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                          const sh = prompt('Gol segnati (noi):')
                          const sa = prompt('Gol subiti (avversario):')
                          if (sh !== null && sa !== null) setResult(m.id, +sh, +sa)
                        }}>📝 Risultato</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
      )}
    </div>
  )
}
