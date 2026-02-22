import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Image, FileText, HelpCircle, Upload, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const POST_TYPES = [
    { key: 'text', icon: <FileText size={16} />, label: 'Text' },
    { key: 'meme', icon: <Image size={16} />, label: 'Meme' },
    { key: 'image', icon: <Image size={16} />, label: 'Image' },
    { key: 'question', icon: <HelpCircle size={16} />, label: 'Question' },
];

export default function CreatePost() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: '', body: '', post_type: 'text', group_id: '' });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef();

    const { data: groupsData } = useQuery({
        queryKey: ['my-groups'],
        queryFn: async () => { const r = await api.get('/api/groups/my/joined'); return r.data; },
    });

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    function handleImageSelect(e) {
        const f = e.target.files[0];
        if (!f) return;
        setImageFile(f);
        setImagePreview(URL.createObjectURL(f));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title.trim()) { toast.error('Title is required'); return; }
        setLoading(true);

        try {
            let image_url = null;
            if (imageFile) {
                const fd = new FormData();
                fd.append('file', imageFile);
                const upRes = await api.post('/api/upload/post-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                image_url = upRes.data.url;
            }

            const res = await api.post('/api/posts', {
                title: form.title,
                body: form.body || null,
                image_url,
                post_type: form.post_type,
                group_id: form.group_id || null,
            });
            toast.success('Post created!');
            navigate(`/posts/${res.data.id}`);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create post');
        }
        setLoading(false);
    }

    return (
        <div style={{ maxWidth: 700, margin: '32px auto', padding: '0 20px' }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Create a Post</h1>

                {/* Type selector */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    {POST_TYPES.map(t => (
                        <button key={t.key} onClick={() => setForm({ ...form, post_type: t.key })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: `1px solid ${form.post_type === t.key ? 'var(--accent)' : 'var(--border)'}`, background: form.post_type === t.key ? 'rgba(255,78,78,0.1)' : 'var(--bg-card)', color: form.post_type === t.key ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                            {t.icon}{t.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Title *</label>
                        <input name="title" value={form.title} onChange={onChange} placeholder="Give your post a great title..." maxLength={300} required />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Body (optional)</label>
                        <textarea name="body" value={form.body} onChange={onChange} placeholder="Share your thoughts, question, or meme description..." rows={5} style={{ resize: 'vertical' }} />
                    </div>

                    {/* Image upload */}
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Image / Meme (optional)</label>
                        {imagePreview ? (
                            <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                                <img src={imagePreview} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }} />
                                <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <div onClick={() => fileRef.current.click()} style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: '32px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={e => e.target.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}>
                                <Upload size={24} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Click or drag to upload image</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>PNG, JPG, GIF up to 10MB</p>
                            </div>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                    </div>

                    {/* Post to group */}
                    {groupsData?.groups?.length > 0 && (
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Post to Group (optional)</label>
                            <select name="group_id" value={form.group_id} onChange={onChange} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', width: '100%' }}>
                                <option value="">Public Feed</option>
                                {groupsData.groups.map(g => <option key={g.group_id} value={g.group_id}>{g.groups?.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost">Cancel</button>
                        <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : 'Publish Post'}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
