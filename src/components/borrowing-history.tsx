import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BorrowRequest, UserProfile } from '@/lib/db';
import { cn } from '@/lib/utils';

interface BorrowingHistoryProps {
    requests: BorrowRequest[];
    users: UserProfile[];
    className?: string;
}

export function BorrowingHistory({ requests, users, className }: BorrowingHistoryProps) {
    // Filter for past history:
    // 1. Remove orphaned requests (where user is missing)
    // 2. Remove future requests (endDate > now)
    const history = requests.filter(r => {
        // User Filter:
        const borrower = users.find(u => u.id === r.requesterId);
        if (!borrower) return false; // Hide "Unknown User"
        if (borrower.email?.toLowerCase().trim() === 'paul@parallax.mov') return false; // Hide specific email

        // Status & Date Checks
        const isReturned = r.status === 'returned';
        const now = new Date();
        // Consider "Past" if endDate is before now. 
        // If no endDate, fall back to startDate (e.g. 1 day rental).
        const endDate = r.endDate ? new Date(r.endDate) : (r.startDate ? new Date(r.startDate) : null);

        const isPast = endDate ? endDate < now : false;

        // Only show if it's a returned item OR an approved item that is in the past
        return isReturned || (r.status === 'approved' && isPast);
    });

    if (history.length === 0) {
        return (
            <div className={cn("pt-6 border-t", className)}>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Borrowing History</h3>
                <p className="text-sm text-gray-500 italic">No previous borrowing history.</p>
            </div>
        );
    }

    return (
        <div className={cn("pt-6 border-t", className)}>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Borrowing History</h3>
            <div className="space-y-3">
                {history.map(req => (
                    <div key={req.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${users.find(u => u.id === req.requesterId)?.email}`} />
                                <AvatarFallback>?</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-gray-700">
                                {users.find(u => u.id === req.requesterId)?.name || 'Unknown User'}
                            </span>
                        </div>
                        <span className="text-gray-500 text-xs">
                            {req.startDate ? new Date(req.startDate).toLocaleDateString() : 'Unknown Date'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
