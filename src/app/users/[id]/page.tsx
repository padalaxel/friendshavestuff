import { getItemsByOwner, getUsers } from '@/lib/db';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const userId = params.id;
    const items = await getItemsByOwner(userId);
    const users = await getUsers();
    const user = users.find(u => u.id === userId);

    if (!user && items.length === 0) {
        notFound();
    }

    const userName = user?.name || 'Unknown User';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <main className="max-w-7xl mx-auto p-4 md:p-8">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to All Gear
                        </Button>
                    </Link>
                </div>

                <div className="mb-8 flex items-center gap-4">
                    <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-white shadow-sm">
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{userName}</h1>
                        <p className="text-gray-500">Sharing {items.length} item{items.length !== 1 && 's'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {items.map((item) => (
                        <Link key={item.id} href={`/items/${item.id}`} className="block group">
                            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
                                <div className="aspect-[4/3] relative w-full bg-gray-100 overflow-hidden">
                                    <img
                                        src={item.imageUrl || "https://placehold.co/600x400?text=No+Image"}
                                        alt={item.name}
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <CardHeader className="p-4 pb-2 flex-grow">
                                    <CardTitle className="text-sm sm:text-lg truncate leading-tight" title={item.name}>{item.name}</CardTitle>
                                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                                </CardHeader>
                                <CardFooter className="p-4 pt-2 flex items-center justify-between border-t mt-2 bg-gray-50/50">
                                    <Badge variant="secondary" className="text-xs px-2 py-0.5 font-normal bg-white border-gray-200">
                                        {item.category || 'General'}
                                    </Badge>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>

                {items.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed text-gray-500">
                        This user hasn't listed any items yet.
                    </div>
                )}
            </main>
        </div>
    );
}
