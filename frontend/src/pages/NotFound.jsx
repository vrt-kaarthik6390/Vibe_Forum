import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

export default function NotFound() {
    return (
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
            <Flame size={60} color="var(--accent)" style={{ opacity: 0.4, marginBottom: 16 }} />
            <h1 style={{ fontSize: 60, fontWeight: 900, color: 'var(--text-muted)' }}>404</h1>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Page Not Found</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>This page doesn't exist or was removed.</p>
            <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
    );
}
