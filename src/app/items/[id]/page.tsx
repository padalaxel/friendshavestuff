import { getItemById, getUsers, createBorrowRequest, getRequestsForUser, getRequestsForItem, updateRequestStatus, BorrowRequest, getComments, addComment } from '@/lib/db';
import { sendRequestNotification } from '@/lib/email';
import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { ItemRequestForm } from '@/components/item-request-form';
import CommentsSection from '@/components/comments-section';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const { id } = await params;
    const item = await getItemById(id);
    return {
        title: item ? item.name : 'Item Not Found',
    };
}

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const session = await getSession();
    if (!session) redirect('/login');

    const item = await getItemById(id);
    if (!item) notFound();

    const users = await getUsers();
    const owner = users.find(u => u.id === item.ownerId);

    // Check ongoing requests
    const requests = await getRequestsForUser(session.id); // For requester view
    const ownerRequests = await getRequestsForUser(item.ownerId); // For owner view
    const requestsForItem = await getRequestsForItem(item.id); // For history

    // Find relevant request for THIS item
    // If I am requester: find my request for this item
    // If I am owner: find any active request for this item
    let activeRequest: BorrowRequest | undefined;

    const isOwner = session.id === item.ownerId;

    // Define these outside so they are available in render
    let approvedReq: BorrowRequest | undefined;
    let pendingReq: BorrowRequest | undefined;

    if (isOwner) {
        // Prioritize: Approved (Active Loan) > Pending > Declined/Returned
        approvedReq = ownerRequests.find(r => r.itemId === item.id && r.status === 'approved');
        pendingReq = ownerRequests.find(r => r.itemId === item.id && r.status === 'pending');

        // Use approved first, then pending, then just the most recent one
        activeRequest = approvedReq || pendingReq || ownerRequests
            .filter(r => r.itemId === item.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    } else {
        activeRequest = requests.find(r => r.itemId === item.id && r.requesterId === session.id && r.status !== 'returned');
    }

    // Get all relevant requests for this item to show availability
    // Using filtered ownerRequests for bookings logic
    const itemRequests = ownerRequests.filter(r => r.itemId === item.id);
    const bookings = itemRequests.filter(r => r.status === 'approved');

    // Fetch comments
    const comments = await getComments(item.id);

    // --- Actions ---

    async function submitComment(text: string) {
        'use server';
        if (!session) return;
        await addComment(item!.id, session.id, text);
        redirect(`/items/${item!.id}`);
    }

    async function requestItem(formData: FormData) {
        'use server';
        if (!session || !item) return;

        const startDateStr = formData.get('startDate') as string;
        const endDateStr = formData.get('endDate') as string;

        const start = new Date(startDateStr);
        const end = new Date(endDateStr);

        // Validation: Dates must be valid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return redirect(`/items/${item.id}?error=Invalid Dates`);
        }

        // Validation: End after Start
        if (end < start) {
            return redirect(`/items/${item.id}?error=End date must be after start date`);
        }

        // Validation: Overlap Check
        const currentItemRequests = await getRequestsForUser(item.ownerId);
        const activeBookings = currentItemRequests.filter(r =>
            r.itemId === item.id &&
            r.status === 'approved' &&
            r.startDate
        );

        const hasOverlap = activeBookings.some(booking => {
            if (!booking.startDate) return false;
            const bookingStart = new Date(booking.startDate!);
            const bookingEnd = new Date(booking.endDate || booking.startDate!);

            // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
            return start <= bookingEnd && end >= bookingStart;
        });

        // Check against blackout dates
        const hasBlackoutOverlap = item.blackoutDates?.some(d => {
            const blackoutDate = new Date(d);
            return blackoutDate >= start && blackoutDate <= end;
        });

        if (hasOverlap || hasBlackoutOverlap) {
            return redirect(`/items/${item.id}?error=Dates are unavailable`);
        }

        await createBorrowRequest({
            itemId: item.id,
            requesterId: session.id,
            ownerId: item.ownerId,
            startDate: startDateStr,
            endDate: endDateStr
        });


        // Send notification
        console.log('--- [RequestItem] Debug Start ---');
        if (owner && owner.email) {
            console.log('[RequestItem] Sending email to:', owner.email);
            await sendRequestNotification(owner.email, item.name, session.name || session.email, item.id, session.email, startDateStr, endDateStr);
        } else {
            console.error('[RequestItem] Owner not found or missing email. Notification SKIPPED.');
        }
        console.log('--- [RequestItem] Debug End ---');

        redirect(`/items/${item.id}`);
    }

    async function updateStatus(reqId: string, status: 'approved' | 'declined' | 'returned') {
        'use server';
        await updateRequestStatus(reqId, status);
        redirect(`/items/${id}`);
    }


    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-4xl mx-auto p-4 pt-10">
                <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back to feed
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Image Col */}
                    <div className="space-y-4">
                        <div className="w-full rounded-xl overflow-hidden bg-gray-50 shadow-sm border min-h-[200px] md:min-h-[300px] flex items-center justify-center">
                            <img
                                src={item.imageUrl || "https://placehold.co/800x600?text=No+Image"}
                                alt={item.name}
                                className="object-contain w-full h-auto max-h-[40vh] md:max-h-[70vh]"
                            />
                        </div>
                    </div>

                    {/* Info Col */}
                    <div className="space-y-6">
                        <div>
                            <Badge variant="secondary" className="mb-2">{item.category || 'General'}</Badge>
                            <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
                            <p className="text-sm text-gray-500 mt-1">Owned by {owner?.name || 'Unknown'}</p>
                        </div>

                        <div className="prose prose-sm text-gray-600">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Description</h3>
                            <p>{item.description || "No description provided."}</p>
                        </div>

                        <div className="pt-6 border-t">
                            {/* Interaction Logic */}
                            {/* Admin Controls (for non-owners) */}
                            {session.isAdmin && !isOwner && (
                                <div className="mb-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-semibold text-gray-700">Admin Actions</h3>
                                        <Link href={`/items/${item.id}/edit`}>
                                            <Button variant="outline" size="sm" className="bg-white">Edit / Delete</Button>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Interaction Logic */}
                            {isOwner ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold">Owner Controls</h3>
                                        <Link href={`/items/${item.id}/edit`}>
                                            <Button variant="outline" size="sm">Edit Listing</Button>
                                        </Link>
                                    </div>

                                    {/* Active Loan Section */}
                                    {bookings.length > 0 && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                            <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center">
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Currently Approved Loans
                                            </h4>
                                            {bookings.map(booking => (
                                                <div key={booking.id} className="flex justify-between items-center mb-2 last:mb-0 bg-white p-2 rounded border border-green-100 dark:border-green-800">
                                                    <div className="text-sm">
                                                        <span className="font-semibold text-gray-900">{users.find(u => u.id === booking.requesterId)?.name}</span>
                                                        <br />
                                                        <span className="text-xs text-gray-500">
                                                            {booking.startDate ? `${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate || booking.startDate).toLocaleDateString()}` : 'Indefinite'}
                                                        </span>
                                                    </div>
                                                    <form action={updateStatus.bind(null, booking.id, 'returned')}>
                                                        <Button size="sm" variant="outline" className="h-8">Mark Returned</Button>
                                                    </form>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Pending Requests */}
                                    {pendingReq ? (
                                        <Card className="border-blue-200 shadow-sm">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-blue-900">Request from {users.find(u => u.id === pendingReq.requesterId)?.name}</span>
                                                    <Badge variant="default" className="bg-blue-600">Action Needed</Badge>
                                                </div>
                                                <div className="text-xs text-blue-700 mb-2">
                                                    Requested for: {pendingReq.startDate ? `${new Date(pendingReq.startDate).toLocaleDateString()} - ${new Date(pendingReq.endDate || pendingReq.startDate).toLocaleDateString()}` : 'Unspecified dates'}
                                                </div>

                                                <div className="flex gap-2">
                                                    <form action={updateStatus.bind(null, pendingReq.id, 'approved')} className="flex-1">
                                                        <Button className="w-full bg-blue-600 hover:bg-blue-700">Approve</Button>
                                                    </form>
                                                    <form action={updateStatus.bind(null, pendingReq.id, 'declined')} className="flex-1">
                                                        <Button variant="destructive" className="w-full">Decline</Button>
                                                    </form>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        !bookings.length && <p className="text-sm text-gray-500 italic">No pending requests.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Requester View */}
                                    {activeRequest ? (
                                        <Card className="bg-blue-50 border-blue-100">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {activeRequest.status === 'pending' && <div className="p-2 bg-yellow-100 rounded-full"><RefreshCw className="h-5 w-5 text-yellow-600" /></div>}
                                                    {activeRequest.status === 'approved' && <div className="p-2 bg-green-100 rounded-full"><CheckCircle className="h-5 w-5 text-green-600" /></div>}
                                                    {activeRequest.status === 'declined' && <div className="p-2 bg-red-100 rounded-full"><XCircle className="h-5 w-5 text-red-600" /></div>}
                                                    <div>
                                                        <p className="font-medium text-blue-900">Request {activeRequest.status}</p>
                                                        <p className="text-xs text-blue-700">
                                                            {activeRequest.startDate ? (
                                                                <>
                                                                    {new Date(activeRequest.startDate).toLocaleDateString()} - {new Date(activeRequest.endDate || activeRequest.startDate).toLocaleDateString()}
                                                                </>
                                                            ) : (
                                                                `Sent on ${new Date(activeRequest.createdAt).toLocaleDateString()}`
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {activeRequest.status === 'approved' && (
                                                    <form action={updateStatus.bind(null, activeRequest.id, 'returned')} className="mt-2">
                                                        <Button size="sm" variant="outline" className="w-full bg-white">Mark Returned</Button>
                                                    </form>
                                                )}

                                                {activeRequest.status === 'declined' && (
                                                    <div className="mt-3 pt-3 border-t border-red-200">
                                                        <p className="text-xs text-red-800 mb-2">Request was declined. You can dismiss this to try again with different dates.</p>
                                                        <form action={updateStatus.bind(null, activeRequest.id, 'returned')}>
                                                            <Button size="sm" variant="secondary" className="w-full bg-white border border-red-200 text-red-700 hover:bg-red-50">
                                                                Dismiss & Try Again
                                                            </Button>
                                                        </form>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card>
                                            <CardContent className="p-4 pt-6">
                                                <ItemRequestForm
                                                    bookings={bookings}
                                                    blackoutDates={item.blackoutDates}
                                                    action={requestItem}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Borrowing History Section */}
                        <div className="pt-6 border-t">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Borrowing History</h3>
                            {(() => {
                                // Filter for past history, restricted to after Feb 5th 2026
                                const history = requestsForItem.filter(r => {
                                    // Basic status checks
                                    const isReturned = r.status === 'returned';
                                    const isPast = r.endDate ? new Date(r.endDate) < new Date() : false;
                                    const isValidStatus = isReturned || (r.status === 'approved' && isPast);

                                    // Date Constraint: Only show history from Feb 5th 2026 onwards
                                    // Use startDate or updatedAt if startDate is missing (fallback)
                                    const itemDate = r.startDate ? new Date(r.startDate) : new Date(r.updatedAt);
                                    const cutoffDate = new Date('2026-02-05T00:00:00');

                                    return isValidStatus && itemDate >= cutoffDate;
                                });

                                if (history.length === 0) {
                                    return <p className="text-sm text-gray-500 italic">No previous borrowing history.</p>;
                                }

                                return (
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
                                );
                            })()}
                        </div>

                        {/* Comments Section */}
                        <div className="pt-6 border-t">
                            <CommentsSection
                                comments={comments}
                                currentUser={session}
                                onAddComment={submitComment}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
