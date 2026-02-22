import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { UserPlus, UserCheck, UserX, MessageSquare, Users } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

function FriendCard({ friend, currentUserId, onUpdate }) {
    const otherUser = friend.requester_id === currentUserId ? friend.addressee : friend.requester;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}>
            <Link to={`/profile/${otherUser?.id}`}>
                {otherUser?.avatar_url ? <img src={otherUser.avatar_url} alt="" className="avatar" style={{ width: 44, height: 44 }} /> :
                    <div className="avatar" style={{ width: 44, height: 44, background: 'var(--bg-hover)', fontSize: 18 }}>{otherUser?.username?.[0]?.toUpperCase() || '?'}</div>}
            </Link>
            <div style={{ flex: 1 }}>
                <Link to={`/profile/${otherUser?.id}`} style={{ fontWeight: 600 }}>{otherUser?.display_name || otherUser?.username}</Link>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{otherUser?.username}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/chat/${otherUser?.id}`} className="btn btn-secondary btn-sm"><MessageSquare size={13} /> Chat</Link>
            </div>
        </motion.div>
    );
}

function RequestCard({ req, onAccept, onReject }) {
    const [acting, setActing] = useState(false);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, border: '1px solid rgba(255,78,78,0.2)' }}>
            <Link to={`/profile/${req.requester?.id}`}>
                {req.requester?.avatar_url ? <img src={req.requester.avatar_url} alt="" className="avatar" style={{ width: 44, height: 44 }} /> :
                    <div className="avatar" style={{ width: 44, height: 44, background: 'var(--bg-hover)', fontSize: 18 }}>{req.requester?.username?.[0]?.toUpperCase() || '?'}</div>}
            </Link>
            <div style={{ flex: 1 }}>
                <Link to={`/profile/${req.requester?.id}`} style={{ fontWeight: 600 }}>{req.requester?.display_name || req.requester?.username}</Link>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>sent you a friend request</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={async () => { setActing(true); try { await api.patch(`/api/friends/request/${req.id}?action=accept`); onAccept(req.id); toast.success('Request accepted!'); } catch { toast.error('Failed'); } setActing(false); }} disabled={acting} className="btn btn-primary btn-sm"><UserCheck size={13} /></button>
                <button onClick={async () => { setActing(true); try { await api.patch(`/api/friends/request/${req.id}?action=reject`); onReject(req.id); } catch { toast.error('Failed'); } setActing(false); }} disabled={acting} className="btn btn-ghost btn-sm"><UserX size={13} /></button>
            </div>
        </motion.div>
    );
}

export default function Friends() {
    const [tab, setTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const { data: userData } = useQuery({ queryKey: ['me-id'], queryFn: async () => { const r = await api.get('/api/profiles/me'); return r.data; } });

    useQuery({ queryKey: ['friends'], queryFn: async () => { const r = await api.get('/api/friends'); setFriends(r.data.friends); return r.data; } });
    useQuery({ queryKey: ['friend-requests'], queryFn: async () => { const r = await api.get('/api/friends/requests'); setRequests(r.data.requests); return r.data; } });

    return (
        <div style={{ maxWidth: 700, margin: '32px auto', padding: '0 20px' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={22} /> Friends
            </h1>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[['friends', `My Friends (${friends.length})`], ['requests', `Requests (${requests.length})`]].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} className={`btn ${tab === key ? 'btn-primary' : 'btn-secondary'} btn-sm`}>{label}</button>
                ))}
            </div>

            {tab === 'friends' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {friends.length === 0 ? <div className="empty-state"><h3>No friends yet</h3><p>Send friend requests from user profiles</p></div>
                        : friends.map(f => <FriendCard key={f.id} friend={f} currentUserId={userData?.id} onUpdate={() => { }} />)}
                </div>
            )}

            {tab === 'requests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {requests.length === 0 ? <div className="empty-state"><h3>No pending requests</h3></div>
                        : requests.map(r => <RequestCard key={r.id} req={r} onAccept={(id) => { setRequests(prev => prev.filter(x => x.id !== id)); setFriends(prev => [...prev, r]); }} onReject={(id) => setRequests(prev => prev.filter(x => x.id !== id))} />)}
                </div>
            )}
        </div>
    );
}
