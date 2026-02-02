import { createClient } from '@/lib/supabase/server';

export async function getSession() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Sync: Ensure the allowed_user row has the user_id linked
    // We do this in the background to avoid blocking, or await if critical.
    // For safety/speed, we'll fire and forget or quick await.
    const { error } = await supabase
        .from('allowed_users')
        .update({ user_id: user.id })
        .eq('email', user.email!)
        .is('user_id', null);

    // We map the Supabase User to our App User shape
    return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata.full_name || user.email!.split('@')[0],
        avatarUrl: user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
    };
}
