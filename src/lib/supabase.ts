// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── TYPES (identici alla versione mobile) ──────────────────

export type UserRole = 'manager' | 'coach' | 'player'
export type AttendanceStatus = 'confirmed' | 'declined' | 'maybe' | 'pending'
export type MatchStatus = 'scheduled' | 'completed' | 'cancelled'
export type EventType = 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'mvp'
export type Position = 'portiere' | 'terzino' | 'pivot' | 'ala' | 'universale'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  position: Position | null
  foot: 'destro' | 'sinistro' | 'ambidestro' | null
  bio: string | null
  created_at: string
}

export interface Team {
  id: string
  name: string
  logo_url: string | null
  city: string | null
  color_primary: string
  color_secondary: string
  invite_code: string
  manager_id: string
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  player_id: string
  role: UserRole
  jersey_number: number | null
  joined_at: string
  active: boolean
  profiles?: Profile
}

export interface Match {
  id: string
  team_id: string
  opponent_name: string
  opponent_team_id: string | null
  match_date: string
  venue: string | null
  is_home: boolean
  score_home: number | null
  score_away: number | null
  status: MatchStatus
  notes: string | null
  created_by: string
  created_at: string
}

export interface MatchEvent {
  id: string
  match_id: string
  player_id: string
  event_type: EventType
  minute: number | null
  created_at: string
  profiles?: Profile
}

export interface Training {
  id: string
  team_id: string
  training_date: string
  location: string | null
  duration_minutes: number
  notes: string | null
  coach_id: string | null
  created_at: string
}

export interface Message {
  id: string
  team_id: string
  sender_id: string
  content: string
  pinned: boolean
  created_at: string
  profiles?: Profile
}

export interface Payment {
  id: string
  team_id: string
  player_id: string
  amount: number
  description: string | null
  due_date: string | null
  paid: boolean
  paid_at: string | null
  created_at: string
  profiles?: Profile
}

export interface PlayerStats {
  player_id: string
  username: string
  full_name: string | null
  goals: number
  total_goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  mvp_count: number
  matches_attended: number
}
