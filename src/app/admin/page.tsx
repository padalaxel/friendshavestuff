import { getSession } from '@/lib/auth';
import { getUsers, addAllowedUser, removeAllowedUser } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Dashboard',
};

export default async function AdminPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    // Simple Admin Check
    if (session.email !== 'paul.s.rogers@gmail.com') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p>You do not have permission to view this page.</p>
                <Link href="/">
                    <Button variant="outline">Return Home</Button>
                </Link>
            </div>
        );
    }

    const users = await getUsers();

    async function addUser(formData: FormData) {
        'use server';
        if (session?.email !== 'paul.s.rogers@gmail.com') return;

        const email = formData.get('email') as string;
        const name = formData.get('name') as string;

        if (email) {
            await addAllowedUser(email, name);
        }
        redirect('/admin');
    }

    async function removeUser(formData: FormData) {
        'use server';
        if (session?.email !== 'paul.s.rogers@gmail.com') return;

        const email = formData.get('email') as string;
        await removeAllowedUser(email);
        redirect('/admin');
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <Link href="/">
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                        </Button>
                    </Link>
                </div>

                {/* Add User Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Invite New User
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={addUser} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <Input name="email" type="email" placeholder="friend@example.com" required />
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium">Display Name (Optional)</label>
                                <Input name="name" placeholder="John Doe" />
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" className="w-full md:w-auto">Add User</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* User List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Allowed Users ({users.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.email}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="text-right">
                                            {user.email !== 'paul.s.rogers@gmail.com' && (
                                                <form action={removeUser}>
                                                    <input type="hidden" name="email" value={user.email} />
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
