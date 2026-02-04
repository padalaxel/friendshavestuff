import { getRequestsForUser, getItems, updateRequestStatus, getUsers, getItemById } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Check, X, MessageSquare, ArrowLeft } from 'lucide-react';
import { sendStatusUpdateEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';

export const metadata = {
    title: 'Manage Requests',
};

export default async function RequestsPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const requests = await getRequestsForUser(session.id);
    const users = await getUsers();

    // Filter for requests where I am the OWNER
    const incomingRequests = requests.filter(r => r.ownerId === session.id);

    async function handleRequest(formData: FormData) {
        'use server';
        const requestId = formData.get('requestId') as string;
        const status = formData.get('status') as string;
        const message = formData.get('message') as string;

        // 1. Update DB
        const updatedReq = await updateRequestStatus(requestId, status, message);

        // 2. Send Email
        const requester = users.find(u => u.id === updatedReq.requesterId);
        const item = await getItemById(updatedReq.itemId);

        if (requester && item && session) {
            await sendStatusUpdateEmail(
                requester.email,
                item.name,
                status,
                message,
                session.email,
                session.name || session.email,
                updatedReq.startDate,
                updatedReq.endDate,
                item.id
            );
        }

        revalidatePath('/requests');
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 pt-10">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="text-gray-500 hover:text-gray-900">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-2xl font-bold">Incoming Requests</h1>
                    </div>
                </div>

                {incomingRequests.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                            No requests found.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {incomingRequests.map(async (req) => {
                            const requester = users.find(u => u.id === req.requesterId);
                            const item = await getItemById(req.itemId);

                            if (!requester || !item) return null;

                            const isPending = req.status === 'pending';

                            return (
                                <Card key={req.id} className={`overflow-hidden ${!isPending ? 'opacity-75' : ''}`}>
                                    <div className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">

                                            {/* Request Details */}
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={req.status === 'pending' ? 'secondary' : (req.status === 'approved' ? 'default' : 'destructive')}>
                                                        {req.status.toUpperCase()}
                                                    </Badge>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(req.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 py-2">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={requester.avatarUrl} />
                                                        <AvatarFallback>{requester.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {requester.name} <span className="font-normal text-gray-500">wants to borrow</span>
                                                        </p>
                                                        <p className="font-semibold text-blue-600">{item.name}</p>
                                                    </div>
                                                </div>

                                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md inline-block">
                                                    📅 {new Date(req.startDate!).toLocaleDateString()} — {new Date(req.endDate!).toLocaleDateString()}
                                                </div>

                                                {/* Show existing message if handled */}
                                                {!isPending && req.message && (
                                                    <div className="mt-3 text-sm text-gray-600 border-l-2 border-gray-300 pl-3">
                                                        <strong>Your Message:</strong> {req.message}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions Area */}
                                            {isPending && (
                                                <div className="w-full sm:w-64 bg-gray-50/50 p-4 rounded-lg border border-gray-100 mt-4 sm:mt-0">
                                                    <form action={handleRequest} className="space-y-3">
                                                        <input type="hidden" name="requestId" value={req.id} />

                                                        <div className="space-y-1">
                                                            <label className="text-xs font-semibold text-gray-500 uppercase">Reply Message (Optional)</label>
                                                            <Textarea
                                                                name="message"
                                                                placeholder="e.g. Sure, pick it up at 5pm!"
                                                                className="min-h-[80px] text-sm bg-white"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            <Button
                                                                type="submit"
                                                                name="status"
                                                                value="declined"
                                                                variant="outline"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                                                            >
                                                                <X className="w-4 h-4 mr-1" /> Decline
                                                            </Button>
                                                            <Button
                                                                type="submit"
                                                                name="status"
                                                                value="approved"
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                <Check className="w-4 h-4 mr-1" /> Approve
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
