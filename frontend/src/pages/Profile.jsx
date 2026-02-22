import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { UserPlus, UserCheck, MessageSquare } from 'lucide-react';
import api from '../lib/api';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
    const { userId } = useParams();
    const { user, profile: myProfile } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const isOwnProfile = user?.id === userId;

    const { data: profileData, isLoading } = useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => { const r = await api.get(`/api/profiles/${userId}`); return r.data; },
    });

    useQuery({
        queryKey: ['user-posts', userId],
        queryFn: async () => { const r = await api.get(`/api/profiles/${userId}/posts`); setPosts(r.data.posts); return r.data.posts; },
        enabled: !!userId,
    });

    const { data: friendStatus } = useQuery({
        queryKey: ['friend-status', userId],
        queryFn: async () => {
            if (!user || isOwnProfile) return null;
            const r = await api.get('/api/friends');
            const friend = r.data.friends.find(f => f.requester_id === userId || f.addressee_id === userId);
            return friend?.status || 'none';
        },
        enabled: !!user && !isOwnProfile,
    });

    async function sendFriendRequest() {
        try {
            await api.post(`/api/friends/request/${userId}`);
            toast.success('Friend request sent!');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to send request');
        }
    }

    if (isLoading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!profileData) return <div className="empty-state"><h3>User not found</h3></div>;

    const initials = (profileData.display_name || profileData.username)?.[0]?.toUpperCase() || '?';

    return (
        <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 20px' }}>
            {/* Profile header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
                    {profileData.avatar_url ? (
                        <img src={profileData.avatar_url} alt="" className="avatar" style={{ width: 80, height: 80, border: '3px solid var(--accent)' }} />
                    ) : (
                        <div className="avatar" style={{ width: 80, height: 80, background: 'linear-gradient(135deg, var(--accent), var(--accent-purple))', fontSize: 32, color: 'white' }}>{initials}</div>
                    )}
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{profileData.display_name || profileData.username}</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>@{profileData.username}</p>
                        {profileData.bio && <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>{profileData.bio}</p>}
                        <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                            <div><span style={{ fontWeight: 700 }}>{profileData.post_count || 0}</span> <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>posts</span></div>
                            <div><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Joined {formatDistanceToNow(new Date(profileData.created_at), { addSuffix: true })}</span></div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {!isOwnProfile && user && (
                            <>
                                {friendStatus === 'accepted' ? (
                                    <button className="btn btn-secondary btn-sm"><UserCheck size={14} /> Friends</button>
                                ) : friendStatus === 'pending' ? (
                                    <button className="btn btn-ghost btn-sm">Request Pending</button>
                                ) : (
                                    <button onClick={sendFriendRequest} className="btn btn-primary btn-sm"><UserPlus size={14} /> Add Friend</button>
                                )}
                                <button onClick={() => navigate(`/chat/${userId}`)} className="btn btn-secondary btn-sm"><MessageSquare size={14} /> Message</button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Posts */}
            <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: 18 }}>Posts</h2>
            {posts.length === 0 ? (
                <div className="empty-state"><h3>No posts yet</h3></div>
            ) : (
                posts.map(post => <PostCard key={post.id} post={post} onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))} compact />)
            )}
        </div>
    );
}
