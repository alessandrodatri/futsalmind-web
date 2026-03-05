// src/pages/ChatPage.tsx
import { useEffect, useRef, useState } from 'react'
import { supabase, Message } from '../lib/supabase'
import { useAuth, useTeam } from '../stores'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function ChatPage() {
  const { profile } = useAuth()
  const { team } = useTeam()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!team) return
    supabase.from('messages').select('*, profiles(username, full_name)').eq('team_id', team.id)
      .order('created_at').limit(150)
      .then(({ data }) => { setMessages(data ?? []); setLoading(false) })

    const ch = supabase.channel(`chat-${team.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `team_id=eq.${team.id}` },
        async (payload) => {
          const { data } = await supabase.from('messages').select('*, profiles(username, full_name)').eq('id', payload.new.id).single()
          if (data) setMessages(p => [...p, data])
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [team])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !team || !profile) return
    const content = text.trim(); setText('')
    await supabase.from('messages').insert({ team_id: team.id, sender_id: profile.id, content })
  }

  const fmtDay = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Oggi'
    return format(d, "d MMMM", { locale: it })
  }
  const fmtTime = (iso: string) => format(new Date(iso), 'HH:mm')

  if (!team) return (
    <div className="page fade-in">
      <div className="empty-state"><span className="empty-icon">💬</span><div className="empty-title">Unisciti a una squadra per chattare</div></div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#fff' }}>💬 Chat Squadra</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 2 }}>{team.name}</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', paddingTop: 40 }}>Caricamento messaggi...</div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === profile?.id
              const prev = i > 0 ? messages[i - 1] : null
              const showDay = !prev || fmtDay(msg.created_at) !== fmtDay(prev.created_at)
              const showName = !isMe && (!prev || prev.sender_id !== msg.sender_id || showDay)

              return (
                <div key={msg.id}>
                  {showDay && (
                    <div style={{ textAlign: 'center', margin: '20px 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      <span style={{ color: 'var(--muted2)', fontSize: 12, fontWeight: 600 }}>{fmtDay(msg.created_at)}</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 4, gap: 8, alignItems: 'flex-end' }}>
                    {!isMe && (
                      <div className="avatar avatar-sm" style={{ opacity: showName ? 1 : 0, marginBottom: 2 }}>
                        {(msg.profiles?.full_name || msg.profiles?.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ maxWidth: '65%' }}>
                      {showName && (
                        <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, marginBottom: 3, marginLeft: 4 }}>
                          {msg.profiles?.full_name || msg.profiles?.username}
                        </div>
                      )}
                      <div style={{
                        background: isMe ? 'var(--green)' : 'var(--card2)',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        padding: '10px 14px',
                        border: isMe ? 'none' : '1px solid var(--border2)',
                      }}>
                        <div style={{ color: '#fff', fontSize: 15, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</div>
                        <div style={{ color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--muted2)', fontSize: 11, marginTop: 4, textAlign: 'right' }}>{fmtTime(msg.created_at)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={send} style={{ padding: '12px 28px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <input
          className="form-input"
          style={{ flex: 1, borderRadius: 24, padding: '11px 18px' }}
          placeholder="Scrivi un messaggio..."
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={500}
        />
        <button className="btn btn-primary" type="submit" disabled={!text.trim()} style={{ borderRadius: 24, padding: '11px 20px' }}>
          Invia ➤
        </button>
      </form>
    </div>
  )
}
