import { createClient } from '@/lib/supabase/server';

export async function getSession() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Sync: Ensure the allowed_user row has the user_id linked
    // First try exact match
    const { count } = await supabase
        .from('allowed_users')
        .update({ user_id: user.id })
        .eq('email', user.email!)
        .is('user_id', null)
        .select('', { count: 'exact', head: true }); // Use count to return number of rows affected

    // If no rows updated (and we don't know if it was because it's already linked or because not found),
    // let's check for "fuzzy" match if the user isn't already linked in DB.
    // Ideally we'd check if `user` is already linked to avoid redundant work, but `update` is idempotent-ish if we check user_id is null.

    if (count === 0) {
        // Fetch all unlinked allowed users to check for normalized match
        const { data: unlinked } = await supabase
            .from('allowed_users')
            .select('*')
            .is('user_id', null);

        if (unlinked && unlinked.length > 0) {
            const { normalizeEmail } = await import('@/lib/utils');
            const normalizedUserEmail = normalizeEmail(user.email!);

            const match = unlinked.find(u => normalizeEmail(u.email) === normalizedUserEmail);

            if (match) {
                await supabase
                    .from('allowed_users')
                    .update({ user_id: user.id })
                    .eq('email', match.email); // Update the specific matching row
            }
        }
    }

    // We map the Supabase User to our App User shape
    return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata.full_name || user.email!.split('@')[0],
        avatarUrl: user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
    };
}
