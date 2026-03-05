// src/App.tsx
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuth, useTeam } from './stores'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import MatchesPage from './pages/MatchesPage'
import ChatPage from './pages/ChatPage'
import TeamPage from './pages/TeamPage'
import ProfilePage from './pages/ProfilePage'
import TrainingsPage from './pages/TrainingsPage'
import PaymentsPage from './pages/PaymentsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚽</div>
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: 20 }}>Caricamento...</div>
      </div>
    </div>
  )
  return session ? <>{children}</> : <Navigate to="/auth" replace />
}

export default function App() {
  const { setSession, fetchProfile } = useAuth()
  const { fetchTeam } = useTeam()
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        await fetchProfile(session.user.id)
        await loadUserTeam(session.user.id)
      }
      setBooted(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        await fetchProfile(session.user.id)
        await loadUserTeam(session.user.id)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadUserTeam = async (userId: string) => {
    const { data } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('player_id', userId)
      .eq('active', true)
      .limit(1)
      .single()
    if (data) await fetchTeam(data.team_id, userId)
  }

  if (!booted) return null

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/trainings" element={<TrainingsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
