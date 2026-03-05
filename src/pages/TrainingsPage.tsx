// src/pages/TrainingsPage.tsx
import { useEffect, useState } from 'react'
import { supabase, Training } from '../lib/supabase'
import { useAuth, useTeam } from '../stores'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function TrainingsPage() {
  const { profile } = useAuth()
  const { team, role } = useTeam()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [trainingDate, setTrainingDate] = useState('')
  const [location, setLocation] = useState('')
  const [duration, setDuration] = useState('90')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch = async () => {
    if (!team) return; setLoading(true)
    const { data } = await supabase.from('trainings').select('*').eq('team_id', team.id).order('training_date', { ascending: false })
    setTrainings(data ?? []); setLoading(false)
  }

  useEffect(() => { fetch() }, [team])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!trainingDate) return; setSaving(true)
    await supabase.from('trainings').insert({
      team_id: team!.id, training_date: new Date(trainingDate).toISOString(),
      location: location || null, duration_minutes: +duration, notes: notes || null, coach_id: profile!.id
    })
    setSaving(false); setShowForm(false); setTrainingDate(''); setLocation(''); setNotes('')
    fetch()
  }

  const fmt = (iso: string) => format(new Date(iso), "EEE d MMM · HH:mm", { locale: it })
  const isPast = (iso: string) => new Date(iso) < new Date()

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h1 className="page-title">🏃 Allenamenti</h1><p className="page-sub">{team?.name}</p></div>
        {(role === 'manager' || role === 'coach') && (
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? '✕ Chiudi' : '+ Nuovo'}</button>
        )}
      </div>

      {showForm && (
        <div className="card fade-in" style={{ marginBottom: 24, borderColor: 'var(--green)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Nuovo Allenamento</h3>
          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Data e ora *</label>
                <input className="form-input" type="datetime-local" value={trainingDate} onChange={e => setTrainingDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Luogo</label>
                <input className="form-input" placeholder="es. Campo da gioco" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Durata (minuti)</label>
                <input className="form-input" type="number" value={duration} onChange={e => setDuration(e.target.value)} min="30" max="240" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Note per i giocatori</label>
                <input className="form-input" placeholder="Cosa faremo..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? '...' : 'Salva'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div style={{ color: 'var(--muted)', padding: 20 }}>Caricamento...</div> :
        trainings.length === 0
          ? <div className="empty-state"><span className="empty-icon">🏃</span><div className="empty-title">Nessun allenamento</div></div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trainings.map(t => (
                <div className="card" key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', opacity: isPast(t.training_date) ? 0.7 : 1 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{fmt(t.training_date)}</div>
                    {t.location && <div style={{ color: 'var(--muted)', fontSize: 13 }}>📍 {t.location}</div>}
                    {t.notes && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>{t.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge ${isPast(t.training_date) ? 'badge-gray' : 'badge-green'}`}>{isPast(t.training_date) ? 'Concluso' : 'Programmato'}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>⏱ {t.duration_minutes} min</span>
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  )
}
