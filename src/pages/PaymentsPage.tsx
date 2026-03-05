// src/pages/PaymentsPage.tsx
import { useEffect, useState } from 'react'
import { supabase, Payment } from '../lib/supabase'
import { useAuth, useTeam } from '../stores'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function PaymentsPage() {
  const { profile } = useAuth()
  const { team, role, members, fetchMembers } = useTeam()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [targetAll, setTargetAll] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchPayments = async () => {
    if (!team) return; setLoading(true)
    const { data } = await supabase.from('payments').select('*, profiles(username, full_name)').eq('team_id', team.id).order('created_at', { ascending: false })
    setPayments(data ?? []); setLoading(false)
  }

  useEffect(() => { if (team) { fetchPayments(); fetchMembers(team.id) } }, [team])

  const createPayments = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description) return; setSaving(true)
    const targets = targetAll ? members.map((m: any) => m.player_id) : [profile!.id]
    await Promise.all(targets.map((pid: string) =>
      supabase.from('payments').insert({ team_id: team!.id, player_id: pid, amount: +amount, description, due_date: dueDate || null, created_by: profile!.id })
    ))
    setSaving(false); setShowForm(false); setDescription(''); setAmount(''); setDueDate('')
    fetchPayments()
  }

  const togglePaid = async (id: string, paid: boolean) => {
    await supabase.from('payments').update({ paid: !paid, paid_at: !paid ? new Date().toISOString() : null }).eq('id', id)
    fetchPayments()
  }

  const myPayments = payments.filter(p => p.player_id === profile?.id)
  const allPayments = role === 'manager' ? payments : myPayments
  const totalOwed = myPayments.filter(p => !p.paid).reduce((s, p) => s + +p.amount, 0)
  const totalPaid = myPayments.filter(p => p.paid).reduce((s, p) => s + +p.amount, 0)

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h1 className="page-title">💰 Quote e Pagamenti</h1><p className="page-sub">{team?.name}</p></div>
        {role === 'manager' && <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? '✕ Chiudi' : '+ Nuova Quota'}</button>}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
        <div className="stat-card" style={{ borderColor: '#7f1d1d' }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>⏳</div>
          <div className="stat-value" style={{ color: '#f87171' }}>€{totalOwed.toFixed(0)}</div>
          <div className="stat-label">Da pagare</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'var(--green)' }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>✅</div>
          <div className="stat-value" style={{ color: 'var(--green-bright)' }}>€{totalPaid.toFixed(0)}</div>
          <div className="stat-label">Pagato</div>
        </div>
        {role === 'manager' && (
          <div className="stat-card">
            <div style={{ fontSize: 22, marginBottom: 4 }}>👥</div>
            <div className="stat-value">{payments.filter(p => !p.paid).length}</div>
            <div className="stat-label">Quote aperte</div>
          </div>
        )}
      </div>

      {/* Form */}
      {showForm && role === 'manager' && (
        <div className="card fade-in" style={{ marginBottom: 24, borderColor: 'var(--green)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Nuova Quota</h3>
          <form onSubmit={createPayments}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Descrizione *</label>
                <input className="form-input" placeholder="es. Quota mensile Marzo" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Importo € *</label>
                <input className="form-input" type="number" placeholder="20" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.5" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Scadenza</label>
                <input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>
                <input type="checkbox" checked={targetAll} onChange={e => setTargetAll(e.target.checked)} style={{ accentColor: 'var(--green)', width: 16, height: 16 }} />
                Assegna a tutti i giocatori
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginLeft: 'auto' }}>{saving ? '...' : 'Crea Quote'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Payments list */}
      {loading ? <div style={{ color: 'var(--muted)', padding: 20 }}>Caricamento...</div> :
        allPayments.length === 0
          ? <div className="empty-state"><span className="empty-icon">💰</span><div className="empty-title">Nessuna quota</div></div>
          : <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Descrizione</th>
                    {role === 'manager' && <th>Giocatore</th>}
                    <th>Importo</th>
                    <th>Scadenza</th>
                    <th>Stato</th>
                    {role === 'manager' && <th>Azione</th>}
                  </tr>
                </thead>
                <tbody>
                  {allPayments.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.description || '–'}</td>
                      {role === 'manager' && (
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="avatar avatar-sm">{(p.profiles?.full_name || p.profiles?.username || '?')[0].toUpperCase()}</div>
                            {p.profiles?.full_name || p.profiles?.username}
                          </div>
                        </td>
                      )}
                      <td style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: p.paid ? 'var(--green-bright)' : '#f87171' }}>
                        €{(+p.amount).toFixed(2)}
                      </td>
                      <td style={{ color: 'var(--muted)' }}>
                        {p.due_date ? format(new Date(p.due_date), 'd MMM yyyy', { locale: it }) : '–'}
                      </td>
                      <td>
                        <span className={`badge ${p.paid ? 'badge-green' : 'badge-red'}`}>
                          {p.paid ? '✅ Pagato' : '⏳ Da pagare'}
                        </span>
                      </td>
                      {role === 'manager' && (
                        <td>
                          <button className={`btn btn-sm ${p.paid ? 'btn-secondary' : 'btn-primary'}`} onClick={() => togglePaid(p.id, p.paid)}>
                            {p.paid ? 'Annulla' : 'Segna pagato'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      }
    </div>
  )
}
