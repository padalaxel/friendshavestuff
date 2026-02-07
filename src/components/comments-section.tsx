'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';
import { Comment, UserProfile } from '@/lib/db';

type CommentsSectionProps = {
    comments: Comment[];
    currentUser?: UserProfile | null;
    onAddComment: (text: string) => Promise<void>;
};

export default function CommentsSection({ comments: initialComments, currentUser, onAddComment }: CommentsSectionProps) {
    const [comments, setComments] = useState(initialComments);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;

        setIsSubmitting(true);

        // Optimistic update
        const tempId = Math.random().toString();
        const optimisticComment: Comment = {
            id: tempId,
            itemId: 'temp',
            userId: currentUser.id,
            text: newComment,
            createdAt: new Date().toISOString(),
            user: currentUser
        };

        setComments(prev => [...prev, optimisticComment]);
        setNewComment('');

        try {
            await onAddComment(optimisticComment.text);
            // In a real app we'd replace the temp comment with the real one from the server response,
            // but for now relying on revalidation or just keeping the optimistic one is "okay" for MVP
            // better: onAddComment returns the real comment
        } catch (error) {
            console.error("Failed to post comment", error);
            // Rollback
            setComments(prev => prev.filter(c => c.id !== tempId));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Comments & Questions ({comments.length})</h3>

            {/* List */}
            <div className="space-y-4">
                {comments.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No comments yet. Be the first to ask about this item.</p>
                )}
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.user?.avatarUrl} />
                            <AvatarFallback>{comment.user?.name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-50 p-3 rounded-lg flex-1">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-semibold text-sm text-gray-900">{comment.user?.name || 'Unknown User'}</span>
                                <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Form */}
            {currentUser ? (
                <form onSubmit={handleSubmit} className="flex gap-3 items-start mt-6">
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
                                Post Comment
                            </Button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="bg-gray-50 p-4 rounded text-center text-sm text-gray-500">
                    Please log in to leave a comment.
                </div>
            )}
        </div>
    );
}
