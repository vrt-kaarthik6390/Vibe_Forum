import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Send, MessageSquare, Search } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Chat() {
    const { userId: paramUserId } = useParams();
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [activeUserId, setActiveUserId] = useState(paramUserId || null);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [conversations, setConversations] = useState([]);
    const msgEndRef = useRef(null);

    // Load conversations
    useQuery({
        queryKey: ['conversations'],
        queryFn: async () => { const r = await api.get('/api/chat/conversations'); setConversations(r.data.conversations); return r.data; },
    });

    // Load DM messages
    useEffect(() => {
        if (!activeUserId) return;
        api.get(`/api/chat/dm/${activeUserId}`).then(r => setMessages(r.data.messages));
    }, [activeUserId]);

    // Realtime DM subscription
    useEffect(() => {
        if (!user || !activeUserId) return;
        const channel = supabase.channel(`dm-${user.id}-${activeUserId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const m = payload.new;
                    if ((m.sender_id === activeUserId && m.receiver_id === user.id) || (m.sender_id === user.id && m.receiver_id === activeUserId)) {
                        setMessages(prev => [...prev, m]);
                    }
                })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [user, activeUserId]);

    useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    async function sendMessage() {
        if (!newMsg.trim() || !activeUserId) return;
        setSending(true);
        try {
            await api.post('/api/chat/send', { body: newMsg, receiver_id: activeUserId });
            setNewMsg('');
        } catch { toast.error('Failed to send'); }
        setSending(false);
    }

    // Get unique conversation users
    const getOtherUser = (conv) => conv.sender_id === user?.id ? conv.receiver : conv.sender;
    const seen = new Set();
    const uniqueConvs = conversations.filter(c => {
        const other = getOtherUser(c);
        if (!other || seen.has(other.id)) return false;
        seen.add(other.id);
        return true;
    });

    return (
        <div style={{ maxWidth: 1000, margin: '32px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: 'calc(100vh - 120px)' }}>
            {/* Sidebar */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 16 }}>
                    <MessageSquare size={16} style={{ marginRight: 8, display: 'inline' }} />Messages
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {uniqueConvs.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No conversations yet. Message a friend from their profile!</div>}
                    {uniqueConvs.map((conv, i) => {
                        const other = getOtherUser(conv);
                        if (!other) return null;
                        const isActive = activeUserId === other.id;
                        return (
                            <div key={i} onClick={() => { setActiveUserId(other.id); navigate(`/chat/${other.id}`); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer', background: isActive ? 'rgba(255,78,78,0.1)' : 'transparent', borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent', transition: 'all 0.2s' }}>
                                {other?.avatar_url ? <img src={other.avatar_url} alt="" className="avatar" style={{ width: 36, height: 36 }} /> :
                                    <div className="avatar" style={{ width: 36, height: 36, background: 'var(--bg-hover)', fontSize: 14 }}>{other?.username?.[0]?.toUpperCase() || '?'}</div>}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 600, fontSize: 14 }}>{other?.display_name || other?.username}</p>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.body}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Chat area */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {!activeUserId ? (
                    <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={48} />
                        <h3>Select a conversation</h3>
                        <p>Pick a conversation or message a friend from their profile</p>
                    </div>
                ) : (
                    <>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
                            Direct Message
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                            {messages.map((m, i) => {
                                const isMe = m.sender_id === user?.id;
                                return (
                                    <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                                        <div style={{ maxWidth: '65%', background: isMe ? 'linear-gradient(135deg, var(--accent), #ff854e)' : 'var(--bg-hover)', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px' }}>
                                            <p style={{ fontSize: 14, color: isMe ? 'white' : 'var(--text-primary)' }}>{m.body}</p>
                                            <p style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={msgEndRef} />
                        </div>
                        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                            <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && sendMessage()} style={{ flex: 1 }} />
                            <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="btn btn-primary btn-sm"><Send size={14} /></button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
