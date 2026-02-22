import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Lock } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function GroupCard({ group, onJoin }) {
    const { user } = useAuth();
    const [joining, setJoining] = useState(false);

    async function handleJoin() {
        if (!user) return;
        setJoining(true);
        try {
            await api.post(`/api/groups/${group.id}/join`);
            toast.success(`Joined ${group.name}!`);
            onJoin(group.id);
        } catch (err) { toast.error(err.response?.data?.detail || 'Failed to join'); }
        setJoining(false);
    }

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {group.avatar_url ? <img src={group.avatar_url} alt="" className="avatar" style={{ width: 52, height: 52, borderRadius: 12 }} /> :
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 22 }}>{group.name[0]}</div>}
            <div style={{ flex: 1 }}>
                <Link to={`/groups/${group.id}`} style={{ fontWeight: 700, fontSize: 16 }}>{group.name}</Link>
                {!group.is_public && <span style={{ marginLeft: 8 }}><Lock size={12} color="var(--text-muted)" /></span>}
                {group.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{group.description}</p>}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}><Users size={11} style={{ display: 'inline', marginRight: 3 }} />{group.member_count} members</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/groups/${group.id}`} className="btn btn-secondary btn-sm">View</Link>
                {user && <button onClick={handleJoin} disabled={joining} className="btn btn-primary btn-sm">{joining ? '...' : 'Join'}</button>}
            </div>
        </motion.div>
    );
}

export default function Groups() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);
    const [groups, setGroups] = useState([]);
    const [joinedIds, setJoinedIds] = useState(new Set());

    useQuery({
        queryKey: ['groups', search],
        queryFn: async () => { const r = await api.get(`/api/groups${search ? `?search=${search}` : ''}`); setGroups(r.data.groups || []); return r.data; },
    });

    async function createGroup() {
        if (!newGroup.name.trim()) { toast.error('Group name required'); return; }
        setCreating(true);
        try {
            const res = await api.post('/api/groups', newGroup);
            toast.success('Group created!');
            navigate(`/groups/${res.data.id}`);
        } catch (err) { toast.error(err.response?.data?.detail || 'Failed to create group'); }
        setCreating(false);
    }

    return (
        <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}><Users size={22} />Groups</h1>
                {user && <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary btn-sm"><Plus size={14} /> New Group</button>}
            </div>

            {showCreate && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card" style={{ marginBottom: 20, border: '1px solid rgba(255,78,78,0.3)' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Create a Group</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <input value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="Group name" />
                        <input value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} placeholder="Description (optional)" />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowCreate(false)} className="btn btn-ghost btn-sm">Cancel</button>
                            <button onClick={createGroup} disabled={creating} className="btn btn-primary btn-sm">{creating ? '...' : 'Create'}</button>
                        </div>
                    </div>
                </motion.div>
            )}

            <div style={{ position: 'relative', marginBottom: 20 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups..." style={{ paddingLeft: 36 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {groups.length === 0 ? <div className="empty-state"><h3>No groups found</h3> {user && <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ marginTop: 16 }}>Create one!</button>}</div>
                    : groups.map(g => <GroupCard key={g.id} group={g} onJoin={(id) => setJoinedIds(prev => new Set([...prev, id]))} />)}
            </div>
        </div>
    );
}
