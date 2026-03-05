// src/stores/index.ts
import { create } from 'zustand'
import { supabase, Profile, Team, TeamMember, UserRole } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

// ── AUTH STORE ─────────────────────────────────────────────
interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  setSession: (s: Session | null) => void
  fetchProfile: (id: string) => Promise<void>
  signOut: () => Promise<void>
}
export const useAuth = create<AuthState>((set) => ({
  session: null, profile: null, loading: true,
  setSession: (session) => set({ session, loading: false }),
  fetchProfile: async (id) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (data) set({ profile: data })
  },
  signOut: async () => { await supabase.auth.signOut(); set({ session: null, profile: null }) },
}))

// ── TEAM STORE ─────────────────────────────────────────────
interface TeamState {
  team: Team | null
  role: UserRole | null
  members: TeamMember[]
  setTeam: (t: Team | null, r: UserRole | null) => void
  fetchTeam: (teamId: string, userId: string) => Promise<void>
  fetchMembers: (teamId: string) => Promise<void>
  createTeam: (name: string, city: string, userId: string) => Promise<Team | null>
  joinTeam: (code: string, userId: string) => Promise<boolean>
}
export const useTeam = create<TeamState>((set, get) => ({
  team: null, role: null, members: [],
  setTeam: (team, role) => set({ team, role }),
  fetchTeam: async (teamId, userId) => {
    const [{ data: team }, { data: mem }] = await Promise.all([
      supabase.from('teams').select('*').eq('id', teamId).single(),
      supabase.from('team_members').select('role').eq('team_id', teamId).eq('player_id', userId).eq('active', true).single(),
    ])
    set({ team: team ?? null, role: (mem?.role as UserRole) ?? null })
  },
  fetchMembers: async (teamId) => {
    const { data } = await supabase.from('team_members').select('*, profiles(*)').eq('team_id', teamId).eq('active', true).order('role')
    set({ members: data ?? [] })
  },
  createTeam: async (name, city, userId) => {
    const { data: team } = await supabase.from('teams').insert({ name, city, manager_id: userId }).select().single()
    if (!team) return null
    await supabase.from('team_members').insert({ team_id: team.id, player_id: userId, role: 'manager' })
    set({ team, role: 'manager' })
    return team
  },
  joinTeam: async (code, userId) => {
    const { data: team } = await supabase.from('teams').select('id').eq('invite_code', code.toUpperCase()).single()
    if (!team) return false
    const { error } = await supabase.from('team_members').insert({ team_id: team.id, player_id: userId, role: 'player' })
    if (error) return false
    await get().fetchTeam(team.id, userId)
    return true
  },
}))
