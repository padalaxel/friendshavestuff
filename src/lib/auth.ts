import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function getSession() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // We map the Supabase User to our App User shape
    return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata.full_name || user.email!.split('@')[0],
        avatarUrl: user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
    };
}

export async function loginWithGoogle() {
    'use server';
    const supabase = await createClient();
    const origin = (await headers()).get('origin');

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    });

    if (data.url) {
        redirect(data.url);
    }
}

export async function logout() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}
