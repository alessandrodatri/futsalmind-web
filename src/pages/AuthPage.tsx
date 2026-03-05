// src/pages/AuthPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!email || !password) { setError('Inserisci email e password'); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      } else {
        if (!username) { setError('Username obbligatorio'); setLoading(false); return }
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { username, full_name: fullName } } })
        if (error) throw error
        setSuccess('Registrazione completata! Controlla la tua email e poi accedi.')
        setMode('login')
      }
    } catch (e: any) {
      setError(e.message || 'Si è verificato un errore')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, #1A6B3A22 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>⚽</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>
            Futsal<span style={{ color: 'var(--green-bright)' }}>Mind</span>
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 15 }}>La tua squadra, al prossimo livello</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--card)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 24, border: '1px solid var(--border)' }}>
          {(['login', 'register'] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, transition: 'all 0.15s',
                background: mode === m ? 'var(--green)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--muted)' }}
            >
              {m === 'login' ? 'Accedi' : 'Registrati'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="card" style={{ border: '1px solid var(--border2)' }}>
          <form onSubmit={handle}>
            {mode === 'register' && <>
              <div className="form-group">
                <label className="form-label">Nome completo</label>
                <input className="form-input" placeholder="Mario Rossi" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input className="form-input" placeholder="mariorossi10" value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="none" />
              </div>
            </>}

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" placeholder="mario@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" placeholder="Almeno 6 caratteri" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {error && <div className="alert-box alert-error" style={{ marginTop: 16 }}>{error}</div>}
            {success && <div className="alert-box alert-success" style={{ marginTop: 16 }}>{success}</div>}

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
              style={{ width: '100%', marginTop: 20 }}>
              {loading ? <span className="spinner">↻</span> : mode === 'login' ? 'Accedi →' : 'Crea account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
