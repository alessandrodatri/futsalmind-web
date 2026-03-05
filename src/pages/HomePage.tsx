// src/pages/HomePage.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Match, Training, PlayerStats } from '../lib/supabase'
import { useAuth, useTeam } from '../stores'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function HomePage() {
  const { profile } = useAuth()
  const { team, role } = useTeam()
  const [nextMatch, setNextMatch] = useState<Match | null>(null)
  const [nextTraining, setNextTraining] = useState<Training | null>(null)
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [recentMatches, setRecentMatches] = useState<Match[]>([])

  useEffect(() => {
    if (!team || !profile) return
    const now = new Date().toISOString()

    Promise.all([
      supabase.from('matches').select('*').eq('team_id', team.id).eq('status', 'scheduled').gte('match_date', now).order('match_date').limit(1).single(),
      supabase.from('trainings').select('*').eq('team_id', team.id).gte('training_date', now).order('training_date').limit(1).single(),
      supabase.from('player_stats').select('*').eq('player_id', profile.id).single(),
      supabase.from('matches').select('*').eq('team_id', team.id).eq('status', 'completed').order('match_date', { ascending: false }).limit(5),
    ]).then(([m, t, s, rm]) => {
      setNextMatch(m.data ?? null)
      setNextTraining(t.data ?? null)
      setStats(s.data ?? null)
      setRecentMatches(rm.data ?? [])
    })
  }, [team, profile])

  const fmt = (iso: string) => format(new Date(iso), "EEE d MMM · HH:mm", { locale: it })

  if (!team) return (
    <div className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">Benvenuto, {profile?.full_name?.split(' ')[0] ?? profile?.username}! 👋</h1>
        <p className="page-sub">Inizia creando la tua squadra o unendoti a una esistente</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, maxWidth: 600 }}>
        <Link to="/team" className="card" style={{ textDecoration: 'none', borderColor: 'var(--green)', transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-dim)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff' }}>Crea Squadra</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Diventa manager del tuo team</div>
        </Link>
        <Link to="/team" className="card" style={{ textDecoration: 'none', transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--green)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff' }}>Unisciti</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Usa il codice invito della tua squadra</div>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Ciao, {profile?.full_name?.split(' ')[0] ?? profile?.username}! 👋</h1>
          <p className="page-sub">{team.name} · <span className={`badge badge-${role === 'manager' ? 'orange' : role === 'coach' ? 'blue' : 'green'}`}>{role}</span></p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { icon: '⚽', v: stats?.total_goals ?? 0, l: 'Gol' },
          { icon: '🎯', v: stats?.assists ?? 0, l: 'Assist' },
          { icon: '📅', v: stats?.matches_attended ?? 0, l: 'Presenze' },
          { icon: '🏆', v: stats?.mvp_count ?? 0, l: 'MVP' },
        ].map(({ icon, v, l }) => (
          <div className="stat-card" key={l}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
            <div className="stat-value">{v}</div>
            <div className="stat-label">{l}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* Prossima partita */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff' }}>⚽ Prossima Partita</h2>
            <Link to="/matches" style={{ color: 'var(--green-bright)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Tutte →</Link>
          </div>
          {nextMatch ? (
            <div className="card" style={{ borderColor: 'var(--green-dim)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: '#fff' }}>{team.name}</div>
                <div style={{ color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900 }}>VS</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: '#fff', textAlign: 'right' }}>{nextMatch.opponent_name}</div>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>📅 {fmt(nextMatch.match_date)}</div>
              {nextMatch.venue && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>📍 {nextMatch.venue}</div>}
              <span className={`badge ${nextMatch.is_home ? 'badge-green' : 'badge-gray'}`} style={{ marginTop: 10 }}>
                {nextMatch.is_home ? '🏠 Casa' : '✈️ Trasferta'}
              </span>
            </div>
          ) : (
            <div className="card empty-state" style={{ padding: '30px 20px' }}>
              <span className="empty-icon" style={{ fontSize: 32 }}>⚽</span>
              <div className="empty-title" style={{ fontSize: 16 }}>Nessuna partita</div>
              {(role === 'manager' || role === 'coach') &&
                <Link to="/matches" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>+ Aggiungi</Link>}
            </div>
          )}
        </div>

        {/* Prossimo allenamento */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff' }}>🏃 Prossimo Allenamento</h2>
            <Link to="/trainings" style={{ color: 'var(--green-bright)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Tutti →</Link>
          </div>
          {nextTraining ? (
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
                {fmt(nextTraining.training_date)}
              </div>
              {nextTraining.location && <div style={{ color: 'var(--muted)', fontSize: 13 }}>📍 {nextTraining.location}</div>}
              <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>⏱ {nextTraining.duration_minutes} minuti</div>
              {nextTraining.notes && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 10, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 10 }}>{nextTraining.notes}</div>}
            </div>
          ) : (
            <div className="card empty-state" style={{ padding: '30px 20px' }}>
              <span className="empty-icon" style={{ fontSize: 32 }}>🏃</span>
              <div className="empty-title" style={{ fontSize: 16 }}>Nessun allenamento</div>
              {(role === 'manager' || role === 'coach') &&
                <Link to="/trainings" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>+ Aggiungi</Link>}
            </div>
          )}
        </div>

        {/* Ultimi risultati */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff' }}>📊 Ultimi Risultati</h2>
            <Link to="/matches" style={{ color: 'var(--green-bright)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Storico →</Link>
          </div>
          {recentMatches.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Avversario</th><th>Data</th><th>Campo</th><th>Risultato</th><th>Esito</th></tr></thead>
                <tbody>
                  {recentMatches.map(m => {
                    const ts = m.is_home ? m.score_home : m.score_away
                    const os = m.is_home ? m.score_away : m.score_home
                    const won = ts !== null && os !== null && ts > os
                    const draw = ts !== null && os !== null && ts === os
                    return (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 700 }}>{m.opponent_name}</td>
                        <td style={{ color: 'var(--muted)' }}>{fmt(m.match_date)}</td>
                        <td><span className={`badge ${m.is_home ? 'badge-green' : 'badge-gray'}`}>{m.is_home ? 'Casa' : 'Trasferta'}</span></td>
                        <td style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900 }}>
                          {ts !== null ? `${ts} – ${os}` : '–'}
                        </td>
                        <td>
                          {ts !== null && <span className={`badge ${won ? 'badge-green' : draw ? 'badge-orange' : 'badge-red'}`}>
                            {won ? 'Vittoria' : draw ? 'Pareggio' : 'Sconfitta'}
                          </span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card empty-state" style={{ padding: '24px' }}>
              <div className="empty-title" style={{ fontSize: 15 }}>Nessun risultato ancora</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
