import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';

const ADMIN_EMAIL = 'vrtkaarthik6@gmail.com';

export default function AdminLogin() {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    async function handleSubmit(e) {
        e.preventDefault();
        if (formData.email !== ADMIN_EMAIL) {
            toast.error('Unauthorized: This email does not have admin access.');
            return;
        }
        setLoading(true);
        try {
            await signIn(formData.email, formData.password);
            toast.success('Welcome, Admin!');
            navigate('/admin');
        } catch (err) {
            toast.error(err.message || 'Invalid credentials');
        }
        setLoading(false);
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'radial-gradient(ellipse at 50% 0%, rgba(155,89,255,0.1) 0%, transparent 70%)' }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: '50%', background: 'rgba(155,89,255,0.15)', marginBottom: 16 }}>
                        <Shield size={28} color="var(--accent-purple)" />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Super Admin Login</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 6 }}>Restricted access — authorised personnel only</p>
                </div>

                <div className="card" style={{ boxShadow: '0 4px 32px rgba(155,89,255,0.15)', border: '1px solid rgba(155,89,255,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(155,89,255,0.1)', borderRadius: 'var(--radius-sm)', marginBottom: 24 }}>
                        <Lock size={14} color="var(--accent-purple)" />
                        <span style={{ fontSize: 13, color: 'var(--accent-purple)', fontWeight: 600 }}>This portal is locked to a single admin email</span>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Admin Email</label>
                            <input type="email" name="email" value={formData.email} onChange={onChange} placeholder="admin@example.com" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPw ? 'text' : 'password'} name="password" value={formData.password} onChange={onChange} placeholder="••••••••" required style={{ paddingRight: 42 }} />
                                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} style={{ marginTop: 8, padding: '12px', border: 'none', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--accent-purple), #6c3fd9)', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : <><Shield size={16} /> Access Admin Panel</>}
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
