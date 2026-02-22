import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Send, Users, MessageSquare } from 'lucide-react';
import api from '../lib/api';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function GroupDetail() {
    const { groupId } = useParams();
    const { user } = useAuth();
    const [tab, setTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [joining, setJoining] = useState(false);
    const msgEndRef = useRef(null);

    const { data: group, isLoading } = useQuery({
        queryKey: ['group', groupId],
        queryFn: async () => { const r = await api.get(`/api/groups/${groupId}`); return r.data; },
    });

    useQuery({
        queryKey: ['group-posts', groupId],
        queryFn: async () => { const r = await api.get(`/api/posts?group_id=${groupId}`); setPosts(r.data.posts); return r.data; },
    });

    useQuery({
        queryKey: ['group-members', groupId],
        queryFn: async () => {
            const r = await api.get(`/api/groups/${groupId}/members`);
            if (user) setIsMember(r.data.members.some(m => m.user_id === user.id));
            return r.data;
        },
        enabled: !!user,
    });

    useQuery({
        queryKey: ['group-messages', groupId],
        queryFn: async () => { if (!isMember) return []; const r = await api.get(`/api/chat/group/${groupId}`); setMessages(r.data.messages); return r.data.messages; },
        enabled: isMember && tab === 'chat',
    });

    // Realtime chat subscription
    useEffect(() => {
        if (!isMember) return;
        const channel = supabase.channel(`group-chat-${groupId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
                (payload) => setMessages(prev => [...prev, payload.new]))
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [groupId, isMember]);

    useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    async function joinGroup() {
        setJoining(true);
        try { await api.post(`/api/groups/${groupId}/join`); setIsMember(true); toast.success('Joined!'); }
        catch (err) { toast.error(err.response?.data?.detail || 'Failed to join'); }
        setJoining(false);
    }

    async function sendMessage() {
        if (!newMsg.trim()) return;
        setSending(true);
        try {
            await api.post('/api/chat/send', { body: newMsg, group_id: groupId });
            setNewMsg('');
        } catch { toast.error('Failed to send'); }
        setSending(false);
    }

    if (isLoading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!group) return <div className="empty-state"><h3>Group not found</h3></div>;

    return (
        <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 20px' }}>
            {/* Group header */}
            <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {group.avatar_url ? <img src={group.avatar_url} alt="" style={{ width: 60, height: 60, borderRadius: 14 }} /> :
                        <div style={{ width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 26 }}>{group.name[0]}</div>}
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: 22, fontWeight: 800 }}>{group.name}</h1>
                        {group.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{group.description}</p>}
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}><Users size={11} style={{ display: 'inline' }} /> {group.member_count} members</p>
                    </div>
                    {user && !isMember && <button onClick={joinGroup} disabled={joining} className="btn btn-primary">{joining ? '...' : 'Join Group'}</button>}
                    {isMember && <span className="badge badge-green">✓ Member</span>}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[['posts', 'Posts'], ['chat', 'Group Chat']].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-secondary'}`}>{label}</button>
                ))}
            </div>

            {tab === 'posts' && (
                <>
                    {posts.length === 0 ? <div className="empty-state"><h3>No posts in this group</h3></div>
                        : posts.map(p => <PostCard key={p.id} post={p} onDelete={(id) => setPosts(prev => prev.filter(x => x.id !== id))} />)}
                </>
            )}

            {tab === 'chat' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {!isMember ? (
                        <div className="empty-state"><h3>Join the group to chat</h3></div>
                    ) : (
                        <>
                            <div style={{ height: 400, overflowY: 'auto', padding: 16 }}>
                                {messages.map((m, i) => {
                                    const isMe = m.sender_id === user?.id;
                                    return (
                                        <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                                            <div style={{ maxWidth: '70%', background: isMe ? 'linear-gradient(135deg, var(--accent), #ff854e)' : 'var(--bg-hover)', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', fontSize: 14 }}>
                                                {!isMe && <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-purple)', marginBottom: 4 }}>{m.sender?.username}</p>}
                                                <p style={{ color: isMe ? 'white' : 'var(--text-primary)' }}>{m.body}</p>
                                                <p style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={msgEndRef} />
                            </div>
                            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                                <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Send a message..." onKeyDown={e => e.key === 'Enter' && sendMessage()} style={{ flex: 1 }} />
                                <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="btn btn-primary btn-sm"><Send size={14} /></button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
