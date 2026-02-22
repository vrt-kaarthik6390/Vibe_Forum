import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const ADMIN_EMAIL = 'vrtkaarthik6@gmail.com';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const isAdmin = user?.email === ADMIN_EMAIL;

    async function loadProfile(userId) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (data) setProfile(data);
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) loadProfile(session.user.id);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) loadProfile(session.user.id);
            else setProfile(null);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function signUp(email, password, username) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username, display_name: username } },
        });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    }

    return (
        <AuthContext.Provider value={{ user, profile, isAdmin, loading, signIn, signUp, signOut, loadProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
