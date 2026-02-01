import { getSession } from '@/lib/auth';
import { updateProfileName } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default async function ProfilePage() {
    const session = await getSession();
    if (!session) redirect('/login');

    async function updateProfile(formData: FormData) {
        'use server';
        if (!session) return;

        const name = formData.get('name') as string;
        await updateProfileName(name);
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="-ml-3 text-gray-500">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                        </Link>
                    </div>
                    <div className="flex flex-col items-center mb-4">
                        <Avatar className="h-20 w-20 mb-4">
                            <AvatarImage src={session.avatarUrl} />
                            <AvatarFallback>{session.name[0]}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl">Edit Profile</CardTitle>
                        <CardDescription>{session.email}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form action={updateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Display Name</label>
                            <Input
                                name="name"
                                defaultValue={session.name}
                                placeholder="Enter your full name"
                            />
                            <p className="text-xs text-gray-500">
                                This is the name people will see when you list items.
                            </p>
                        </div>
                        <Button type="submit" className="w-full">Save Changes</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
