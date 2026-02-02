import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getRequestsForUser } from '@/lib/db';
import { UserMenu } from '@/components/user-menu';

export async function Header() {
    const session = await getSession();
    if (!session) return null;

    // Fetch pending requests for this user as OWNER
    const allRequests = await getRequestsForUser(session.id);
    const pendingCount = allRequests.filter(r =>
        r.ownerId === session.id && r.status === 'pending'
    ).length;

    return (
        <header className="bg-white border-b sticky top-0 z-10 px-4 h-16 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl tracking-tight text-blue-600 hover:text-blue-700 transition-colors">
                <img src="/logo.png" alt="FriendsHaveStuff" className="h-8 md:h-10 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
                {session.email === 'paul.s.rogers@gmail.com' && (
                    <Link href="/admin">
                        <Button variant="ghost" size="sm" className="text-blue-600 font-medium hidden md:flex">
                            Manage Users
                        </Button>
                    </Link>
                )}

                <div className="flex items-center gap-2">
                    {pendingCount > 0 && (
                        <Link href="/requests" className="relative mr-2 p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <Bell className="h-5 w-5 text-gray-500 hover:text-blue-600" />
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center shadow-sm border border-white">
                                {pendingCount}
                            </span>
                            <span className="sr-only">View {pendingCount} pending requests</span>
                        </Link>
                    )}

                    <UserMenu user={{
                        name: session.name,
                        email: session.email,
                        avatarUrl: session.avatarUrl
                    }} />
                </div>
            </div>
        </header>
    );
}

