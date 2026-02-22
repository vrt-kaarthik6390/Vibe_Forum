import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn, UserPlus, Eye, EyeOff, Flame } from 'lucide-react';

export default function Login() {
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [formData, setFormData] = useState({ email: '', password: '', username: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'login') {
                await signIn(formData.email, formData.password);
                toast.success('Welcome back!');
                navigate('/');
            } else {
                if (!formData.username.trim()) {
                    toast.error('Username is required');
                    setLoading(false);
                    return;
                }
                await signUp(formData.email, formData.password, formData.username);
                toast.success('Account created! Check your email or log in now.');
                setMode('login');
            }
        } catch (err) {
            toast.error(err.message || 'Something went wrong');
        }
        setLoading(false);
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,78,78,0.08) 0%, transparent 70%)' }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <Flame size={32} color="#ff4e4e" />
                        <h1 style={{ fontSize: '28px', fontWeight: '800' }} className="gradient-text">Vibe Forum</h1>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>YT Community • Ask • Share • Vibe</p>
                </div>

                <div className="card" style={{ boxShadow: 'var(--shadow)' }}>
                    {/* Tab switcher */}
                    <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '4px', marginBottom: '24px' }}>
                        {['login', 'signup'].map(m => (
                            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '9px', borderRadius: '6px', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', background: mode === m ? 'var(--bg-card)' : 'transparent', color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {m === 'login' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {mode === 'signup' && (
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Username</label>
                                <input name="username" value={formData.username} onChange={onChange} placeholder="yourname" required />
                            </div>
                        )}
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={onChange} placeholder="you@example.com" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPw ? 'text' : 'password'} name="password" value={formData.password} onChange={onChange} placeholder="••••••••" minLength={6} required style={{ paddingRight: 42 }} />
                                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ marginTop: 8, justifyContent: 'center' }}>
                            {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : mode === 'login' ? <><LogIn size={16} /> Sign In</> : <><UserPlus size={16} /> Create Account</>}
                        </motion.button>
                    </form>

                    <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        Are you the admin? <Link to="/admin/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Admin Login →</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
