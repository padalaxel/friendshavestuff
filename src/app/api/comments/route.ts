import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { addComment, deleteComment, getItemById, getUsers, getComments } from '@/lib/db';
import { sendCommentNotification, sendReplyNotification } from '@/lib/email';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { itemId, text, parentId } = body;

        if (!itemId || !text) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Insert Comment
        const newComment = await addComment(itemId, session.id, text, parentId);

        // 2. Notification Logic
        // We catch errors here so we don't fail the request if email fails
        try {
            const item = await getItemById(itemId);
            const allUsers = await getUsers(); // Needed to find owner email and parent author email

            if (item) {
                // Scenario A: Reply to a Comment
                if (parentId) {
                    const comments = await getComments(itemId);
                    const parentComment = comments.find(c => c.id === parentId);

                    if (parentComment) {
                        const parentAuthor = allUsers.find(u => u.id === parentComment.userId);
                        // Notify parent author if it's not the replier themselves
                        if (parentAuthor && parentAuthor.email && parentAuthor.id !== session.id) {
                            await sendReplyNotification(
                                parentAuthor.email,
                                item.name,
                                text,
                                session.name || session.email,
                                item.id
                            );
                        }
                    }
                }
                // Scenario B: Top-level Comment -> Notify Owner
                else {
                    const owner = allUsers.find(u => u.id === item.ownerId);
                    // Notify owner if it's not the commenter themselves
                    if (owner && owner.email && owner.id !== session.id) {
                        // Note: sendCommentNotification signature: (toEmail, itemName, commentText, commenterName, itemId, replyToEmail)
                        await sendCommentNotification(
                            owner.email,
                            item.name,
                            text,
                            session.name || session.email,
                            item.id,
                            session.email
                        );
                    }
                }
            }
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
            // Continue execution, do not return error
        }

        revalidatePath(`/items/${itemId}`);
        return NextResponse.json(newComment);

    } catch (error: any) {
        console.error('Error in comments route:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const commentId = searchParams.get('id');
        const itemId = searchParams.get('itemId');

        if (!commentId || !itemId) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        // Note: deleteComment RLS will enforce ownership?
        // Actually deleteComment in db.ts uses service role usually? 
        // Let's check db.ts deleteComment. verify it uses createClient() which uses headers() -> RLS.
        // db.ts: const supabase = await createClient(); -> Yes, RLS.
        // So if user works, it works.

        await deleteComment(commentId);

        revalidatePath(`/items/${itemId}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting comment:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 });
    }
}
