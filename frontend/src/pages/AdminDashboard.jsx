import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Shield, Trash2, Users, FileText, MessageSquare, BarChart3, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [tab, setTab] = useState('overview');
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({});
    const [deleting, setDeleting] = useState({});

    useQuery({ queryKey: ['admin-stats'], queryFn: async () => { const r = await api.get('/api/admin/stats'); setStats(r.data); return r.data; } });
    useQuery({ queryKey: ['admin-posts'], queryFn: async () => { const r = await api.get('/api/admin/posts'); setPosts(r.data.posts); return r.data; } });
    useQuery({ queryKey: ['admin-users'], queryFn: async () => { const r = await api.get('/api/admin/users'); setUsers(r.data.users); return r.data; } });
    useQuery({ queryKey: ['admin-reports'], queryFn: async () => { const r = await api.get('/api/admin/reports'); setComments(r.data.comments); return r.data; } });

    async function deletePost(id) {
        if (!confirm('Delete this post?')) return;
        setDeleting(prev => ({ ...prev, [id]: true }));
        try { await api.delete(`/api/admin/posts/${id}`); setPosts(prev => prev.filter(p => p.id !== id)); toast.success('Post deleted'); }
        catch { toast.error('Failed to delete'); }
        setDeleting(prev => ({ ...prev, [id]: false }));
    }

    async function deleteComment(id) {
        if (!confirm('Delete this comment?')) return;
        setDeleting(prev => ({ ...prev, [id]: true }));
        try { await api.delete(`/api/admin/comments/${id}`); setComments(prev => prev.filter(c => c.id !== id)); toast.success('Comment deleted'); }
        catch { toast.error('Failed to delete'); }
        setDeleting(prev => ({ ...prev, [id]: false }));
    }

    async function deleteUser(id) {
        if (!confirm('Permanently delete this user? This cannot be undone!')) return;
        try { await api.delete(`/api/admin/users/${id}`); setUsers(prev => prev.filter(u => u.id !== id)); toast.success('User deleted'); }
        catch { toast.error('Failed to delete'); }
    }

    const TABS = [['overview', <BarChart3 size={14} />, 'Overview'], ['posts', <FileText size={14} />, 'Posts'], ['comments', <MessageSquare size={14} />, 'Comments'], ['users', <Users size={14} />, 'Users']];

    return (
        <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', background: 'rgba(155,89,255,0.15)' }}>
                    <Shield size={22} color="var(--accent-purple)" />
                </div>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800 }}>Admin Dashboard</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Logged in as <span style={{ color: 'var(--accent-purple)' }}>{user?.email}</span></p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {TABS.map(([key, icon, label]) => (
                    <button key={key} onClick={() => setTab(key)} className={`btn btn-sm ${tab === key ? '' : 'btn-secondary'}`} style={tab === key ? { background: 'linear-gradient(135deg, var(--accent-purple), #6c3fd9)', color: 'white', border: 'none' } : {}}>
                        {icon}{label}
                    </button>
                ))}
            </div>

            {/* Overview */}
            {tab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                    {[
                        { label: 'Total Users', value: stats.total_users, color: 'var(--accent-blue)', icon: <Users size={24} /> },
                        { label: 'Total Posts', value: stats.total_posts, color: 'var(--accent)', icon: <FileText size={24} /> },
                        { label: 'Total Comments', value: stats.total_comments, color: 'var(--accent-purple)', icon: <MessageSquare size={24} /> },
                        { label: 'Total Groups', value: stats.total_groups, color: 'var(--success)', icon: <Users size={24} /> },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: s.color }}>{s.icon}</div>
                            <div style={{ fontSize: 36, fontWeight: 800, color: s.color }}>{s.value ?? '—'}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Posts */}
            {tab === 'posts' && (
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>{posts.length} posts</p>
                    {posts.map(post => (
                        <div key={post.id} className="card" style={{ marginBottom: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{post.title}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>by @{post.profiles?.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                                {post.body && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{post.body?.slice(0, 150)}{post.body?.length > 150 ? '...' : ''}</p>}
                            </div>
                            <button onClick={() => deletePost(post.id)} disabled={deleting[post.id]} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
                        </div>
                    ))}
                </div>
            )}

            {/* Comments */}
            {tab === 'comments' && (
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>{comments.length} comments</p>
                    {comments.map(c => (
                        <div key={c.id} className="card" style={{ marginBottom: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{c.body}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>by @{c.profiles?.username} · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                            </div>
                            <button onClick={() => deleteComment(c.id)} disabled={deleting[c.id]} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
                        </div>
                    ))}
                </div>
            )}

            {/* Users */}
            {tab === 'users' && (
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>{users.length} users</p>
                    {users.map(u => (
                        <div key={u.id} className="card" style={{ marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                            {u.avatar_url ? <img src={u.avatar_url} alt="" className="avatar" style={{ width: 38, height: 38 }} /> :
                                <div className="avatar" style={{ width: 38, height: 38, background: 'var(--bg-hover)', fontSize: 14 }}>{u.username?.[0]?.toUpperCase() || '?'}</div>}
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600 }}>{u.display_name || u.username}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{u.username} · Joined {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</p>
                            </div>
                            {u.is_admin && <span className="badge badge-purple"><Shield size={11} /> Admin</span>}
                            {!u.is_admin && (
                                <button onClick={() => deleteUser(u.id)} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
