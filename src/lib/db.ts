import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cache } from 'react';

// Types mapped to Application Model (CamelCase)
export type Item = {
    id: string;
    ownerId: string;
    name: string;
    description?: string;
    category?: string;
    imageUrl?: string;
    createdAt: string;
};

export type BorrowRequest = {
    id: string;
    itemId: string;
    requesterId: string;
    ownerId: string;
    status: 'pending' | 'approved' | 'declined' | 'returned';
    startDate?: string;
    endDate?: string;
    message?: string;
    createdAt: string;
    updatedAt: string;
};

// Update UserProfile type to include lastLogin
export type UserProfile = {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    lastLogin?: string | null;
}

// Internal Supabase Types
type DBItem = {
    id: string;
    owner_id: string;
    name: string;
    description?: string;
    category?: string;
    image_url?: string;
    created_at: string;
}

type DBRequest = {
    id: string;
    item_id: string;
    requester_id: string;
    owner_id: string;
    status: string;
    start_date?: string;
    end_date?: string;
    message?: string;
    created_at: string;
    updated_at: string;
}

export const getUsers = cache(async (): Promise<UserProfile[]> => {
    // Legacy simple fetch, or we can just make this call the new one if we want consistent types
    // For now, let's leave it and replicate logical upgrade in a new function specific for Admin
    const supabase = await createClient();
    const { data: allowed } = await supabase.from('allowed_users').select('*');
    if (!allowed) return [];

    return allowed.map((u: any) => ({
        id: u.user_id || u.email,
        email: u.email,
        name: u.name || u.email,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${u.name || u.email}`
    }));
});

export const getUsersWithLastLogin = cache(async (): Promise<UserProfile[]> => {
    const supabase = await createClient();
    const adminAuthClient = createAdminClient();

    // 1. Get Allowed Users (Public Data)
    const { data: allowed } = await supabase.from('allowed_users').select('*');
    if (!allowed) return [];

    // 2. Get Auth Users (Private Data - requires Service Role)
    // List users method defaults to 50 users per page. For small app it's fine.
    // For larger app, we'd need pagination.
    const { data: { users: authUsers }, error: authError } = await adminAuthClient.auth.admin.listUsers({
        perPage: 1000
    });

    if (authError) {
        console.error('Error fetching auth users:', authError);
    }

    // 3. Merge Data
    return allowed.map((u: any) => {
        const authUser = authUsers?.find((au: any) => au.email === u.email);
        return {
            id: u.user_id || u.email,
            email: u.email,
            name: u.name || u.email,
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${u.name || u.email}`,
            lastLogin: authUser?.last_sign_in_at || null
        };
    });
});

export async function addAllowedUser(email: string, name: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('allowed_users').insert([{ email, name }]);
    if (error) throw error;
}

export async function removeAllowedUser(email: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('allowed_users').delete().eq('email', email);
    if (error) throw error;
}

export async function updateProfileName(name: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('allowed_users')
        .update({ name })
        .eq('email', user.email);

    if (error) throw error;
}

// Helper Mappers 
function toItemModel(dbItem: DBItem): Item {
    return {
        id: dbItem.id,
        ownerId: dbItem.owner_id,
        name: dbItem.name,
        description: dbItem.description,
        category: dbItem.category,
        imageUrl: dbItem.image_url,
        createdAt: dbItem.created_at
    };
}

function toRequestModel(dbReq: DBRequest): BorrowRequest {
    return {
        id: dbReq.id,
        itemId: dbReq.item_id,
        requesterId: dbReq.requester_id,
        ownerId: dbReq.owner_id,
        status: dbReq.status as any,
        startDate: dbReq.start_date,
        endDate: dbReq.end_date,
        message: dbReq.message,
        createdAt: dbReq.created_at,
        updatedAt: dbReq.updated_at
    };
}
