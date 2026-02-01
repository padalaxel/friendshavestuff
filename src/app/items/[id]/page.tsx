import { getItemById, getUsers, createBorrowRequest, getRequestsForUser, updateRequestStatus, BorrowRequest } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw, Send } from 'lucide-react';
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

    if (isOwner) {
        // Show the most recent relevant request
        activeRequest = ownerRequests
            .filter(r => r.itemId === item.id && r.status !== 'returned')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    } else {
        activeRequest = requests.find(r => r.itemId === item.id && r.requesterId === session.id && r.status !== 'returned');
    }


    // --- Actions ---

    async function requestItem(formData: FormData) {
        'use server';
        if (!session || !item) return;

        const startDate = formData.get('startDate') as string;
        const endDate = formData.get('endDate') as string;

        await createBorrowRequest({
            itemId: item.id,
            requesterId: session.id,
            ownerId: item.ownerId,
            startDate,
            endDate
        });
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
                        <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-200 shadow-sm border">
                            <img
                                src={item.imageUrl || "https://placehold.co/800x600?text=No+Image"}
                                alt={item.name}
                                className="object-cover w-full h-full"
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
                                    {activeRequest ? (
                                        <Card>
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">Request from {users.find(u => u.id === activeRequest?.requesterId)?.name}</span>
                                                    <Badge>{activeRequest.status}</Badge>
                                                </div>

                                                {activeRequest.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <form action={updateStatus.bind(null, activeRequest.id, 'approved')} className="flex-1">
                                                            <Button className="w-full bg-green-600 hover:bg-green-700">Approve</Button>
                                                        </form>
                                                        <form action={updateStatus.bind(null, activeRequest.id, 'declined')} className="flex-1">
                                                            <Button variant="destructive" className="w-full">Decline</Button>
                                                        </form>
                                                    </div>
                                                )}

                                                {activeRequest.status === 'approved' && (
                                                    <form action={updateStatus.bind(null, activeRequest.id, 'returned')}>
                                                        <Button variant="outline" className="w-full">
                                                            <RefreshCw className="mr-2 h-4 w-4" />
                                                            Mark Returned
                                                        </Button>
                                                    </form>
                                                )}

                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No active requests.</p>
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
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card>
                                            <CardContent className="p-4 pt-6">
                                                <form action={requestItem} className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-semibold uppercase text-gray-500">From</label>
                                                            <input type="date" name="startDate" required className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-semibold uppercase text-gray-500">To</label>
                                                            <input type="date" name="endDate" required className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                        </div>
                                                    </div>
                                                    <Button className="w-full h-12 text-lg">
                                                        <Send className="mr-2 h-5 w-5" />
                                                        Request to Borrow
                                                    </Button>
                                                </form>
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
