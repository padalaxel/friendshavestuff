import { getItemById, getUsers, createBorrowRequest, getRequestsForUser, updateRequestStatus, BorrowRequest } from '@/lib/db';
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
    const ownerRequests = await getRequestsForUser(item.ownerId); // For owner view (this is imperfect, but fine for local MVP)

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
    const itemRequests = ownerRequests.filter(r => r.itemId === item.id);
    const bookings = itemRequests.filter(r => r.status === 'approved');

    // --- Actions ---

    async function requestItem(formData: FormData) {
        'use server';
        if (!session || !item) return;

        const startDateStr = formData.get('startDate') as string;
        const endDateStr = formData.get('endDate') as string;

        const start = new Date(startDateStr);
        const end = new Date(endDateStr);

        // Validation: Dates must be valid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            // ideally return error, but for MVP just redirect
            return redirect(`/items/${item.id}?error=Invalid Dates`);
        }

        // Validation: End after Start
        if (end < start) {
            return redirect(`/items/${item.id}?error=End date must be after start date`);
        }

        // Validation: Overlap Check
        // We need to re-fetch to be safe (concurrent requests), but using passed 'bookings' (if logic moved here) or re-querying DB is best.
        // For this server action, we'll re-fetch just the requests for this item to check.
        const currentItemRequests = await getRequestsForUser(item.ownerId); // Owner has all requests for their items
        const activeBookings = currentItemRequests.filter(r =>
            r.itemId === item.id &&
            r.status === 'approved' &&
            r.startDate // legacy check
        );

        const hasOverlap = activeBookings.some(booking => {
            if (!booking.startDate) return false;
            const bookingStart = new Date(booking.startDate!);
            const bookingEnd = new Date(booking.endDate || booking.startDate!);

            // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
            return start <= bookingEnd && end >= bookingStart;
        });

        if (hasOverlap) {
            return redirect(`/items/${item.id}?error=Dates are already booked`);
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
        console.log('Item Owner ID:', item.ownerId);
        // ... logging code ...

        if (owner && owner.email) {
            console.log('[RequestItem] Sending email to:', owner.email);
            const emailResult = await sendRequestNotification(owner.email, item.name, session.name || session.email, item.id, session.email, startDateStr, endDateStr);
            console.log('[RequestItem] Email result:', emailResult);
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
                        <div className="w-full rounded-xl overflow-hidden bg-gray-50 shadow-sm border min-h-[300px] flex items-center justify-center">
                            <img
                                src={item.imageUrl || "https://placehold.co/800x600?text=No+Image"}
                                alt={item.name}
                                className="object-contain w-full h-auto max-h-[70vh]"
                            />
                        </div>
                    </div>

                    {/* Info Col */}
                    <div className="space-y-6">
                        <div>
                            <Badge variant="secondary" className="mb-2">{item.category || 'General'}</Badge>
                            <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={owner?.avatarUrl} />
                                <AvatarFallback>{owner?.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Owned by {owner?.name}</p>
                                <p className="text-xs text-gray-500">Member since {new Date().getFullYear()}</p>
                            </div>
                        </div>

                        <div className="prose prose-sm text-gray-600">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Description</h3>
                            <p>{item.description || "No description provided."}</p>
                        </div>

                        <div className="pt-6 border-t">
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

                                    {/* History Link or Other info could go here */}
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
                                                    action={requestItem}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
