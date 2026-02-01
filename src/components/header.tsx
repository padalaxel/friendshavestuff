import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Bell } from 'lucide-react';
import { getSession, logout } from '@/lib/auth';
import { getRequestsForUser } from '@/lib/db';

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
                FriendsHaveStuff
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
                        <div className="relative mr-2">
                            <Bell className="h-5 w-5 text-gray-500" />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                                {pendingCount}
                            </span>
                            <span className="sr-only">{pendingCount} pending requests</span>
                        </div>
                    )}

                    <Link href="/profile" className="flex items-center gap-2 group">
                        <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                            <AvatarImage src={session.avatarUrl} />
                            <AvatarFallback>{(session.name || session.email)[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium hidden sm:inline group-hover:text-blue-600 transition-colors">
                            {session.name || session.email}
                        </span>
                    </Link>
                </div>

                <form action={logout}>
                    <Button variant="ghost" size="icon" title="Logout">
                        <LogOut className="h-5 w-5 text-gray-500" />
                    </Button>
                </form>
            </div>
        </header>
    );
}
