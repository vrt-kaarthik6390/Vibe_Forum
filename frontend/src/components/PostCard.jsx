import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUp, ArrowDown, MessageSquare, Trash2, Image, HelpCircle, ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const POST_TYPE_ICONS = {
    meme: <ImageIcon size={14} color="var(--accent-purple)" />,
    image: <Image size={14} color="var(--accent-blue)" />,
    question: <HelpCircle size={14} color="var(--upvote)" />,
    text: null,
};

export default function PostCard({ post, onDelete, compact = false }) {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [votes, setVotes] = useState({ upvotes: post.upvotes, downvotes: post.downvotes });
    const [myVote, setMyVote] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const profile = post.profiles;
    const authorName = profile?.display_name || profile?.username || 'Unknown';
    const initials = authorName[0]?.toUpperCase() || '?';

    async function handleVote(type) {
        if (!user) { navigate('/login'); return; }
        try {
            const res = await api.post('/api/reactions', { post_id: post.id, type });
            const action = res.data.action;
            const delta = type === 'upvote' ? 1 : -1;
            if (action === 'removed') {
                setVotes(v => ({ ...v, [type === 'upvote' ? 'upvotes' : 'downvotes']: v[type === 'upvote' ? 'upvotes' : 'downvotes'] - 1 }));
                setMyVote(null);
            } else if (action === 'switched') {
                const prev = type === 'upvote' ? 'downvote' : 'upvote';
                setVotes(v => ({ upvotes: type === 'upvote' ? v.upvotes + 1 : v.upvotes - 1, downvotes: type === 'downvote' ? v.downvotes + 1 : v.downvotes - 1 }));
                setMyVote(type);
            } else {
                setVotes(v => ({ ...v, [type === 'upvote' ? 'upvotes' : 'downvotes']: v[type === 'upvote' ? 'upvotes' : 'downvotes'] + 1 }));
                setMyVote(type);
            }
        } catch { toast.error('Failed to react'); }
    }

    async function handleDelete() {
        if (!confirm('Delete this post?')) return;
        setDeleting(true);
        try {
            const endpoint = isAdmin ? `/api/admin/posts/${post.id}` : `/api/posts/${post.id}`;
            await api.delete(endpoint);
            toast.success('Post deleted');
            onDelete?.(post.id);
        } catch { toast.error('Failed to delete'); }
        setDeleting(false);
    }

    const canDelete = user && (user.id === post.user_id || isAdmin);

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginBottom: 12, cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
            {/* Author row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Link to={`/profile/${post.user_id}`} onClick={e => e.stopPropagation()}>
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="avatar" style={{ width: 34, height: 34 }} />
                    ) : (
                        <div className="avatar" style={{ width: 34, height: 34, background: 'var(--bg-hover)', fontSize: 14 }}>{initials}</div>
                    )}
                </Link>
                <div style={{ flex: 1 }}>
                    <Link to={`/profile/${post.user_id}`} onClick={e => e.stopPropagation()} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{authorName}</Link>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        {post.post_type !== 'text' && <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{POST_TYPE_ICONS[post.post_type]}{post.post_type}</span>}
                    </div>
                </div>
                {canDelete && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(); }} disabled={deleting} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', opacity: 0.7, padding: 4 }}>
                        <Trash2 size={15} color="var(--danger)" />
                    </button>
                )}
            </div>

            {/* Content */}
            <Link to={`/posts/${post.id}`} style={{ textDecoration: 'none' }}>
                <h2 style={{ fontSize: compact ? 16 : 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.35 }}>{post.title}</h2>
                {post.body && !compact && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>{post.body.length > 200 ? post.body.slice(0, 200) + '...' : post.body}</p>}
                {post.image_url && (
                    <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 12, maxHeight: compact ? 200 : 400, background: 'var(--bg-secondary)' }}>
                        <img src={post.image_url} alt="" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                )}
            </Link>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={() => handleVote('upvote')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: myVote === 'upvote' ? 'rgba(255,107,53,0.15)' : 'var(--bg-hover)', border: 'none', borderRadius: 6, padding: '5px 10px', color: myVote === 'upvote' ? 'var(--upvote)' : 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>
                        <ArrowUp size={14} />{votes.upvotes}
                    </button>
                    <button onClick={() => handleVote('downvote')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: myVote === 'downvote' ? 'rgba(129,140,248,0.15)' : 'var(--bg-hover)', border: 'none', borderRadius: 6, padding: '5px 10px', color: myVote === 'downvote' ? 'var(--downvote)' : 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>
                        <ArrowDown size={14} />{votes.downvotes}
                    </button>
                </div>
                <Link to={`/posts/${post.id}`} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 13 }}>
                    <MessageSquare size={14} />{post.comment_count || 0} comments
                </Link>
            </div>
        </motion.div>
    );
}
