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
    blackoutDates?: string[];
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

export type Comment = {
    id: string;
    itemId: string;
    userId: string;
    text: string;
    createdAt: string;
    user?: UserProfile;
    parentId?: string;
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
    blackout_dates?: string[];
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

// --- Data Access Methods ---

export const getItems = cache(async (): Promise<Item[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching items:', error);
        return [];
    }

    return (data as DBItem[]).map(toItemModel);
});

export const getItemsByOwner = cache(async (ownerId: string): Promise<Item[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching owner items:', error);
        return [];
    }

    return (data as DBItem[]).map(toItemModel);
});

export const getItemById = cache(async (id: string): Promise<Item | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return toItemModel(data as DBItem);
});

export async function createItem(item: { name: string; description?: string; category?: string; sub_category?: string; imageUrl?: string; ownerId: string }) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('items')
        .insert([{
            name: item.name,
            description: item.description,
            category: item.category,
            image_url: item.imageUrl,
            owner_id: item.ownerId,
            blackout_dates: []
        }])
        .select()
        .single();

    if (error) throw error;
    return toItemModel(data as DBItem);
}

export async function updateItem(id: string, updates: Partial<Item>, asAdmin: boolean = false) {
    const supabase = await (asAdmin ? createAdminClient() : createClient());

    const dbUpdates: Partial<DBItem> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl;
    if (updates.blackoutDates) dbUpdates.blackout_dates = updates.blackoutDates;

    const { data, error } = await supabase
        .from('items')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return toItemModel(data as DBItem);
}

export async function deleteItem(id: string, asAdmin: boolean = false) {
    const supabase = await (asAdmin ? createAdminClient() : createClient());
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
}

export const getRequestsForUser = cache(async (userId: string): Promise<BorrowRequest[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('borrow_requests')
        .select('*')
        .or(`requester_id.eq.${userId},owner_id.eq.${userId}`)
        .order('created_at', { ascending: false });

    if (error) return [];
    return (data as DBRequest[]).map(toRequestModel);
});

export const getRequestsForItem = cache(async (itemId: string): Promise<BorrowRequest[]> => {
    // Use Admin Client to bypass RLS so anyone can see the history (as requested)
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('item_id', itemId)
        .order('start_date', { ascending: false });

    if (error) return [];
    return (data as DBRequest[]).map(toRequestModel);
});

export async function createBorrowRequest(req: { itemId: string; requesterId: string; ownerId: string; startDate: string; endDate: string }) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('borrow_requests')
        .insert([{
            item_id: req.itemId,
            requester_id: req.requesterId,
            owner_id: req.ownerId,
            start_date: req.startDate,
            end_date: req.endDate,
            status: 'pending'
        }])
        .select()
        .single();

    if (error) throw error;
    return toRequestModel(data as DBRequest);
}

export async function updateRequestStatus(requestId: string, status: string, message?: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('borrow_requests')
        .update({ status, message, updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single();

    if (error) throw error;
    return toRequestModel(data as DBRequest);
}

type DBAllowedUser = {
    user_id: string | null;
    email: string;
    name: string | null;
    created_at?: string;
}

export const getUsers = cache(async (): Promise<UserProfile[]> => {
    // Legacy simple fetch, or we can just make this call the new one if we want consistent types
    // For now, let's leave it and replicate logical upgrade in a new function specific for Admin
    const supabase = await createClient();
    const { data: allowed } = await supabase.from('allowed_users').select('*');
    if (!allowed) return [];

    return (allowed as DBAllowedUser[]).map((u) => ({
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
    return (allowed as DBAllowedUser[]).map((u) => {
        const authUser = authUsers?.find((au) => au.email === u.email);
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
        blackoutDates: dbItem.blackout_dates || [],
        createdAt: dbItem.created_at
    };
}

type DBComment = {
    id: string;
    item_id: string;
    user_id: string;
    text: string;
    created_at: string;
    parent_id?: string;
}

// --- Comments ---
export async function getComments(itemId: string): Promise<Comment[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });

    if (error || !data) return [];

    // Retrieve user details for each comment
    // We use the existing getUsers cache
    const allUsers = await getUsers();

    return (data as DBComment[]).map((c) => ({
        id: c.id,
        itemId: c.item_id,
        userId: c.user_id,
        text: c.text,
        createdAt: c.created_at,
        parentId: c.parent_id,
        user: allUsers.find(u => u.id === c.user_id)
    }));
}

export async function addComment(itemId: string, userId: string, text: string, parentId?: string) {
    // Use Admin Client to bypass strict RLS checks for insertion
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('comments')
        .insert([{ item_id: itemId, user_id: userId, text, parent_id: parentId }])
        .select()
        .single();

    if (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
    return data;
}

export async function deleteComment(commentId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

    if (error) throw error;
}

function toRequestModel(dbReq: DBRequest): BorrowRequest {
    return {
        id: dbReq.id,
        itemId: dbReq.item_id,
        requesterId: dbReq.requester_id,
        ownerId: dbReq.owner_id,
        status: dbReq.status as BorrowRequest['status'],
        startDate: dbReq.start_date,
        endDate: dbReq.end_date,
        message: dbReq.message,
        createdAt: dbReq.created_at,
        updatedAt: dbReq.updated_at
    };
}
