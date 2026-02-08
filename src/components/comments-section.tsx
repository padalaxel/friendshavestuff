'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { Send, Trash2 } from 'lucide-react';
import { Comment, UserProfile } from '@/lib/db';
import { useRouter } from 'next/navigation';

type CommentsSectionProps = {
    itemId: string;
    comments: Comment[];
    currentUser?: UserProfile | null;
};

export default function CommentsSection({ itemId, comments: initialComments, currentUser }: CommentsSectionProps) {
    const router = useRouter();
    const [comments, setComments] = useState(initialComments);

    useEffect(() => {
        setComments(initialComments);
    }, [initialComments]);

    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Group comments
    const topLevelComments = comments.filter(c => !c.parentId);
    const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        const textToSubmit = parentId ? replyText : newComment;
        if (!textToSubmit.trim() || !currentUser) return;

        setIsSubmitting(true);

        const tempId = Math.random().toString();
        const optimisticComment: Comment = {
            id: tempId,
            itemId: itemId,
            userId: currentUser.id,
            text: textToSubmit,
            createdAt: new Date().toISOString(),
            user: currentUser,
            parentId
        };

        setComments(prev => [...prev, optimisticComment]);
        if (parentId) {
            setReplyText('');
            setReplyingTo(null);
        } else {
            setNewComment('');
        }

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, text: textToSubmit, parentId })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to post comment');
            }

            // Refresh the route to get updated data
            router.refresh();

        } catch (err: any) {
            console.error("Failed to post comment", err);
            setComments(prev => prev.filter(c => c.id !== tempId));
            setError(err.message || 'Failed to post comment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;

        setIsDeleting(commentId);
        // Optimistic delete
        const previousComments = [...comments];
        setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId)); // Delete comment and its replies

        try {
            const res = await fetch(`/api/comments?id=${commentId}&itemId=${itemId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete comment');
            }

            router.refresh();

        } catch (error) {
            console.error("Failed to delete comment", error);
            setComments(previousComments);
        } finally {
            setIsDeleting(null);
        }
    };

    const renderComment = (comment: Comment, isReply = false) => (
        <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-11 mt-3' : 'mt-4'}`}>
            <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user?.avatarUrl} />
                <AvatarFallback>{comment.user?.name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="font-semibold text-sm text-gray-900">{comment.user?.name || 'Unknown User'}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                            {currentUser && currentUser.id === comment.userId && (
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                    disabled={isDeleting === comment.id}
                                    title="Delete Comment"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-4 mt-1 ml-1">
                    {currentUser && !isReply && (
                        <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="text-xs font-medium text-gray-500 hover:text-gray-900"
                        >
                            Reply
                        </button>
                    )}
                </div>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                    <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-3 flex gap-3">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={currentUser?.avatarUrl} />
                            <AvatarFallback>{currentUser?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                            <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="min-h-[40px] h-[40px] py-2 text-sm"
                                autoFocus
                            />
                            <Button size="sm" type="submit" disabled={!replyText.trim() || isSubmitting}>
                                {isSubmitting ? '...' : 'Reply'}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Nested Replies */}
                {!isReply && getReplies(comment.id).map(reply => renderComment(reply, true))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Comments & Questions ({comments.length})</h3>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200 text-sm">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* List */}
            <div className="">
                {comments.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No comments yet. Be the first to ask about this item.</p>
                )}
                {topLevelComments.map(comment => renderComment(comment))}
            </div>

            {/* Main Form */}
            {currentUser ? (
                <form onSubmit={(e) => handleSubmit(e)} className="flex gap-3 items-start mt-8 pt-6 border-t">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser.avatarUrl} />
                        <AvatarFallback>{currentUser.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 gap-2 flex flex-col">
                        <Textarea
                            placeholder="Ask a question or leave a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[80px]"
                        />
                        <div className="flex justify-end">
                            <Button size="sm" type="submit" disabled={!newComment.trim() || isSubmitting}>
                                <Send className="h-3 w-3 mr-2" />
                                {isSubmitting ? 'Posting...' : 'Post Comment'}
                            </Button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="bg-gray-50 p-4 rounded text-center text-sm text-gray-500 mt-6">
                    Please log in to leave a comment.
                </div>
            )}
        </div>
    );
}
