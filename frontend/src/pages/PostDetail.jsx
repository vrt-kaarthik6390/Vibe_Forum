import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUp, Trash2, Reply, Send } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function Comment({ comment, onDelete, postId, onReplyPosted }) {
    const { user, isAdmin } = useAuth();
    const [replying, setReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const canDelete = user && (user.id === comment.user_id || isAdmin);
    const profile = comment.profiles;

    async function sendReply() {
        if (!replyText.trim()) return;
        setSending(true);
        try {
            const res = await api.post('/api/comments', { post_id: postId, body: replyText, parent_id: comment.id });
            onReplyPosted(res.data);
            setReplyText('');
            setReplying(false);
        } catch { toast.error('Failed to post reply'); }
        setSending(false);
    }

    async function handleDelete() {
        if (!confirm('Delete comment?')) return;
        const endpoint = isAdmin ? `/api/admin/comments/${comment.id}` : `/api/comments/${comment.id}`;
        try { await api.delete(endpoint); onDelete(comment.id); toast.success('Comment deleted'); }
        catch { toast.error('Failed to delete'); }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 12, paddingLeft: comment.parent_id ? 24 : 0, borderLeft: comment.parent_id ? '2px solid var(--border)' : 'none' }}>
            <div className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Link to={`/profile/${comment.user_id}`}>
                        {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="avatar" style={{ width: 28, height: 28 }} /> :
                            <div className="avatar" style={{ width: 28, height: 28, background: 'var(--bg-hover)', fontSize: 11 }}>{profile?.username?.[0]?.toUpperCase() || '?'}</div>}
                    </Link>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{profile?.display_name || profile?.username}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    {canDelete && <button onClick={handleDelete} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={13} /></button>}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{comment.body}</p>
                {user && !comment.parent_id && (
                    <button onClick={() => setReplying(!replying)} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                        <Reply size={12} /> Reply
                    </button>
                )}
                <AnimatePresence>
                    {replying && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                            <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." onKeyDown={e => e.key === 'Enter' && sendReply()} style={{ flex: 1, fontSize: 13 }} />
                            <button onClick={sendReply} disabled={sending} className="btn btn-primary btn-sm"><Send size={13} /></button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default function PostDetail() {
    const { postId } = useParams();
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [posting, setPosting] = useState(false);
    const [comments, setComments] = useState([]);

    const { data: post, isLoading: postLoading } = useQuery({
        queryKey: ['post', postId],
        queryFn: async () => { const r = await api.get(`/api/posts/${postId}`); return r.data; },
    });

    useQuery({
        queryKey: ['comments', postId],
        queryFn: async () => {
            const r = await api.get(`/api/comments?post_id=${postId}`);
            setComments(r.data.comments || []);
            return r.data.comments || [];
        },
        enabled: !!postId,
    });

    async function postComment() {
        if (!newComment.trim() || !user) return;
        setPosting(true);
        try {
            const res = await api.post('/api/comments', { post_id: postId, body: newComment });
            setComments(prev => [res.data, ...prev]);
            setNewComment('');
        } catch { toast.error('Failed to post comment'); }
        setPosting(false);
    }

    const topComments = comments.filter(c => !c.parent_id);
    const replies = (parentId) => comments.filter(c => c.parent_id === parentId);
    const handleDelete = (id) => setComments(prev => prev.filter(c => c.id !== id));
    const handleReply = (reply) => setComments(prev => [...prev, reply]);

    if (postLoading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!post) return <div className="empty-state"><h3>Post not found</h3></div>;

    const profile = post.profiles;

    return (
        <div style={{ maxWidth: 800, margin: '32px auto', padding: '0 20px' }}>
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                    <Link to={`/profile/${post.user_id}`}>
                        {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="avatar" style={{ width: 38, height: 38 }} /> :
                            <div className="avatar" style={{ width: 38, height: 38, background: 'var(--bg-hover)', fontSize: 14 }}>{profile?.username?.[0]?.toUpperCase() || '?'}</div>}
                    </Link>
                    <div>
                        <Link to={`/profile/${post.user_id}`} style={{ fontWeight: 600 }}>{profile?.display_name || profile?.username}</Link>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</div>
                    </div>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, lineHeight: 1.35 }}>{post.title}</h1>
                {post.body && <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: post.image_url ? 16 : 0 }}>{post.body}</p>}
                {post.image_url && <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 'var(--radius-sm)', maxHeight: 500, objectFit: 'contain', background: 'var(--bg-secondary)' }} />}
            </div>

            {/* Comment box */}
            {user && (
                <div className="card" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Leave a comment</h3>
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Share your thoughts..." rows={3} style={{ resize: 'none', marginBottom: 10 }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={postComment} disabled={posting || !newComment.trim()} className="btn btn-primary btn-sm">
                            {posting ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <><Send size={13} /> Comment</>}
                        </button>
                    </div>
                </div>
            )}

            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>{comments.length} Comments</h3>
            {topComments.map(c => (
                <div key={c.id}>
                    <Comment comment={c} postId={postId} onDelete={handleDelete} onReplyPosted={handleReply} />
                    {replies(c.id).map(r => <Comment key={r.id} comment={r} postId={postId} onDelete={handleDelete} onReplyPosted={handleReply} />)}
                </div>
            ))}
        </div>
    );
}
