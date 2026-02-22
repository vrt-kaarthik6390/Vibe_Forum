import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Flame, Plus } from 'lucide-react';
import api from '../lib/api';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { user } = useAuth();
    const [sort, setSort] = useState('new');
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['feed', sort, page],
        queryFn: async () => {
            const res = await api.get(`/api/posts?sort=${sort}&page=${page}&limit=20`);
            if (page === 1) {
                setPosts(res.data.posts || []);
            } else {
                setPosts(prev => [...prev, ...(res.data.posts || [])]);
            }
            return res.data;
        },
        refetchOnWindowFocus: false,
    });

    const handleDelete = (id) => setPosts(prev => prev.filter(p => p.id !== id));
    const handleSortChange = (s) => { setSort(s); setPage(1); };

    const sortOpts = [
        { key: 'new', icon: <Clock size={14} />, label: 'New' },
        { key: 'hot', icon: <Flame size={14} />, label: 'Hot' },
        { key: 'top', icon: <TrendingUp size={14} />, label: 'Top' },
    ];

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
            {/* Main Feed */}
            <div>
                {/* Sort bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 4, gap: 4 }}>
                        {sortOpts.map(s => (
                            <button key={s.key} onClick={() => handleSortChange(s.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer', background: sort === s.key ? 'var(--accent)' : 'transparent', color: sort === s.key ? 'white' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                                {s.icon}{s.label}
                            </button>
                        ))}
                    </div>
                    {user && (
                        <Link to="/create" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>
                            <Plus size={14} /> Create Post
                        </Link>
                    )}
                </div>

                {isLoading && page === 1 ? (
                    <div className="loading-spinner"><div className="spinner" /></div>
                ) : posts.length === 0 ? (
                    <div className="empty-state">
                        <Flame size={48} />
                        <h3>No posts yet</h3>
                        <p>Be the first to post something!</p>
                        {user && <Link to="/create" className="btn btn-primary" style={{ marginTop: 16 }}>Create Post</Link>}
                    </div>
                ) : (
                    <>
                        {posts.map(post => <PostCard key={post.id} post={post} onDelete={handleDelete} />)}
                        {data?.posts?.length === 20 && (
                            <button onClick={() => setPage(p => p + 1)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                                Load More
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Sidebar */}
            <div>
                <div className="card" style={{ marginBottom: 16 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>🔥 About Vibe Forum</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        The official YouTube channel community forum. Ask questions, share memes, connect with fellow fans!
                    </p>
                    {user ? (
                        <Link to="/create" className="btn btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                            <Plus size={14} /> New Post
                        </Link>
                    ) : (
                        <Link to="/login" className="btn btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                            Join the Community
                        </Link>
                    )}
                </div>

                <div className="card">
                    <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>📌 Community Rules</h3>
                    {['Be respectful', 'No spam', 'Tag your posts correctly', 'Give credit for memes', 'Help others!'].map((r, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{i + 1}.</span> {r}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
