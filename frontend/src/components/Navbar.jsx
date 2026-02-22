import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Flame, Home, Users, MessageSquare, PenSquare, Bell, LogOut, Shield, Menu, X, Search, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
    const { user, profile, isAdmin, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        if (!user) return;
        supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_read', false)
            .then(({ count }) => setUnread(count || 0));
    }, [user, location.pathname]);

    async function handleSignOut() {
        await signOut();
        toast.success('Signed out');
        navigate('/');
    }

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { to: '/', icon: <Home size={18} />, label: 'Home' },
        { to: '/groups', icon: <Users size={18} />, label: 'Groups' },
        ...(user ? [
            { to: '/friends', icon: <Users size={18} />, label: 'Friends' },
            { to: '/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
        ] : []),
    ];

    return (
        <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,15,16,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                    <Flame size={22} color="#ff4e4e" />
                    <span style={{ fontWeight: 800, fontSize: 18 }} className="gradient-text">Vibe Forum</span>
                </Link>

                {/* Desktop Nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
                    {navLinks.map(l => (
                        <Link key={l.to} to={l.to} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, color: isActive(l.to) ? 'var(--accent)' : 'var(--text-secondary)', background: isActive(l.to) ? 'rgba(255,78,78,0.1)' : 'transparent', transition: 'all 0.2s' }}>
                            {l.icon}{l.label}
                        </Link>
                    ))}
                </div>

                {/* Right actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {user ? (
                        <>
                            {isAdmin && (
                                <Link to="/admin" className="btn btn-sm" style={{ background: 'rgba(155,89,255,0.15)', color: 'var(--accent-purple)', border: '1px solid rgba(155,89,255,0.3)' }}>
                                    <Shield size={14} /> Admin
                                </Link>
                            )}
                            <Link to="/create" className="btn btn-primary btn-sm">
                                <PenSquare size={14} /> Post
                            </Link>
                            <Link to="/chat" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                                <Bell size={16} />
                                {unread > 0 && <span style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, background: 'var(--accent)', borderRadius: '50%', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{unread > 9 ? '9+' : unread}</span>}
                            </Link>
                            <Link to={`/profile/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)', textDecoration: 'none' }}>
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="avatar" style={{ width: 26, height: 26 }} />
                                ) : (
                                    <div className="avatar" style={{ width: 26, height: 26, background: 'var(--border)', fontSize: 11 }}>{profile?.username?.[0]?.toUpperCase() || '?'}</div>
                                )}
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{profile?.username || 'Me'}</span>
                            </Link>
                            <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)' }}>
                                <LogOut size={15} />
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary btn-sm"><LogOut size={14} /> Sign In</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
