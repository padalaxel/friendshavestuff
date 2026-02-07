'use server';

import { revalidatePath } from 'next/cache';
import { addComment, deleteComment } from '@/lib/db';
import { sendCommentNotification, sendReplyNotification, sendRequestNotification } from '@/lib/email';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function submitCommentAction(itemId: string, itemName: string, ownerEmail: string, ownerId: string, text: string, parentId?: string) {
    const session = await getSession();
    if (!session) throw new Error("Not authenticated");

    try {
        await addComment(itemId, session.id, text, parentId);
    } catch (e: any) {
        throw new Error(`Submit Failed: ${e.message || JSON.stringify(e)}`);
    }

    // Notify owner
    if (ownerEmail && ownerId !== session.id) {
        // We need to fetch the item again or pass in the details? We passed them in.
        // But we need to be careful about what 'y' was. 
        // If sendCommentNotification was 'y', it might be undefined?

        try {
            await sendCommentNotification(ownerEmail, itemName, text, session.name || session.email, itemId);
        } catch (e) {
            console.error("Failed to send notification (non-fatal):", e);
        }
    }

    // Notify parent author if reply
    // We need to fetch the parent comment to know who to notify.
    // This logic was in the component. We should probably move it here or just simplify for now.
    // For now, let's just get the comment saved.

    // Simplification: We'll skip reply notifications in this extraction to isolate the error.
    // If this works, we add them back.

    revalidatePath(`/items/${itemId}`);
}

export async function removeCommentAction(commentId: string, itemId: string) {
    const session = await getSession();
    if (!session) throw new Error("Not authenticated");

    await deleteComment(commentId);
    revalidatePath(`/items/${itemId}`);
}
