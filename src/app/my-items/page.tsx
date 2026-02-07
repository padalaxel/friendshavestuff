import { getItems, getRequestsForUser, getUsers } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Items',
};

export default async function MyItemsPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const allItems = await getItems();
    const myItems = allItems.filter(item => item.ownerId === session.id);

    // Get all requests to determine status
    // Optimization: We could have a specific DB query, but for now filtering is fine
    const allRequests = await getRequestsForUser(session.id);
    const users = await getUsers();

    // Determine borrowed items
    const myBorrowRequests = allRequests.filter(r =>
        r.requesterId === session.id &&
        r.status === 'approved' &&
        (!r.endDate || new Date(r.endDate) > new Date()) // Active only
    );

    // Efficiently map requests to items
    const borrowedItems = allItems.filter(item =>
        myBorrowRequests.some(r => r.itemId === item.id)
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <main className="max-w-4xl mx-auto p-4 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center mb-2">
                            <ArrowLeft className="mr-1 h-4 w-4" /> Back to feed
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">My Gear</h1>
                        <p className="text-gray-600">Manage your listed items and availability.</p>
                    </div>
                    <Link href="/items/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add New Item
                        </Button>
                    </Link>
                </div>

                {/* BORROWED ITEMS SECTION */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="bg-amber-100 text-amber-800 p-2 rounded-lg mr-3">
                            <Loader2 className="h-5 w-5" />
                        </span>
                        Items I&apos;m Borrowing
                    </h2>

                    {borrowedItems.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center text-gray-500 text-sm">
                            You are not currently borrowing any items.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {borrowedItems.map(item => {
                                const req = myBorrowRequests.find(r => r.itemId === item.id);
                                const owner = users.find(u => u.id === item.ownerId);

                                return (
                                    <Card key={item.id} className="flex flex-col sm:flex-row overflow-hidden border-amber-200 bg-amber-50/30">
                                        <div className="w-full sm:w-48 h-48 sm:h-auto bg-gray-100 relative">
                                            <img
                                                src={item.imageUrl || "https://placehold.co/400x300?text=No+Image"}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-2 left-2">
                                                <Badge className="bg-amber-500 hover:bg-amber-600">Borrowing</Badge>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                                    <span className="font-medium">Owned by:</span>
                                                    <div className="flex items-center gap-1">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarImage src={owner?.avatarUrl} />
                                                            <AvatarFallback>{owner?.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <span>{owner?.name}</span>
                                                    </div>
                                                </div>

                                                {/* Message from Owner (if any) */}
                                                {req?.message && (
                                                    <div className="mt-3 text-sm bg-white p-2 rounded border border-amber-100 text-gray-700">
                                                        <span className="font-medium text-amber-800 text-xs uppercase tracking-wide block mb-1">Message from Owner</span>
                                                        &quot;{req.message}&quot;
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-amber-100 flex items-center justify-between">
                                                <div className="text-sm flex flex-col">
                                                    <div>
                                                        <span className="text-amber-700 font-medium">Start: </span>
                                                        {req?.startDate ? new Date(req.startDate).toLocaleDateString() : 'Unknown'}
                                                    </div>
                                                    <div>
                                                        <span className="text-amber-700 font-medium">Return: </span>
                                                        {req?.endDate ? new Date(req.endDate).toLocaleDateString() : 'Indefinite'}
                                                    </div>
                                                </div>
                                                <Link href={`/items/${item.id}`}>
                                                    <Button variant="outline" size="sm" className="border-amber-200 hover:bg-amber-100 text-amber-900">
                                                        View Item
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* MY OWNED ITEMS SECTION */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">My Listings</h2>
                    </div>

                    {myItems.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                            <p className="text-gray-500 text-lg mb-4">You haven&apos;t listed any items yet.</p>
                            <Link href="/items/new">
                                <Button variant="outline">List your first item</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {myItems.map(item => {
                                // Find active request
                                const activeRequest = allRequests.find(r =>
                                    r.itemId === item.id &&
                                    r.status === 'approved' &&
                                    (!r.endDate || new Date(r.endDate) > new Date()) // Simple active check
                                );

                                const borrowingUser = activeRequest ? users.find(u => u.id === activeRequest.requesterId) : null;

                                return (
                                    <Card key={item.id} className="flex flex-col sm:flex-row overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="w-full sm:w-48 h-48 sm:h-auto bg-gray-100 relative">
                                            <img
                                                src={item.imageUrl || "https://placehold.co/400x300?text=No+Image"}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                            {activeRequest && (
                                                <div className="absolute top-2 right-2 sm:left-2 sm:right-auto sm:top-2">
                                                    <Badge variant="destructive" className="shadow-sm">Borrowed</Badge>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                                                        <Badge variant="secondary" className="mt-1">{item.category || 'General'}</Badge>
                                                    </div>
                                                    <Link href={`/items/${item.id}/edit`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4 mr-1" /> Edit
                                                        </Button>
                                                    </Link>
                                                </div>
                                                <p className="text-gray-500 mt-2 line-clamp-2 text-sm">{item.description}</p>
                                            </div>

                                            <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                                {activeRequest ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                                                            <span className="font-medium">Borrowed by</span>
                                                            <div className="flex items-center gap-1">
                                                                <Avatar className="h-5 w-5">
                                                                    <AvatarImage src={borrowingUser?.avatarUrl} />
                                                                    <AvatarFallback>?</AvatarFallback>
                                                                </Avatar>
                                                                <span>{borrowingUser?.name}</span>
                                                            </div>
                                                        </div>
                                                        {activeRequest.startDate && (
                                                            <span className="text-xs text-amber-600 font-medium">
                                                                {new Date(activeRequest.startDate).toLocaleDateString()} - {new Date(activeRequest.endDate || activeRequest.startDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-green-600 font-medium flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                        Available
                                                    </div>
                                                )}

                                                <Link href={`/items/${item.id}`}>
                                                    <Button variant="link" size="sm" className="text-blue-600">View Public Page</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
