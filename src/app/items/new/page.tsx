import { createItem } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { uploadItemImage } from '@/lib/storage';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const CATEGORIES = [
    'Outdoors', 'Tools', 'Kitchen', 'Garden/Yard', 'Electronics',
    'Recreation', 'Travel', 'Clothing', 'Household', 'Other'
];

export default async function AddItemPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    async function addItem(formData: FormData) {
        'use server';
        if (!session) return;

        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;
        const imageFile = formData.get('imageFile') as File;

        let imageUrl = "https://placehold.co/600x400?text=Item"; // Default
        if (imageFile && imageFile.size > 0) {
            const uploadedUrl = await uploadItemImage(imageFile);
            if (uploadedUrl) imageUrl = uploadedUrl;
        }

        await createItem({
            ownerId: session.id,
            name,
            description,
            category,
            imageUrl,
        });

        redirect('/');
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 pt-10">
            <div className="max-w-md mx-auto">
                <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back to feed
                </Link>

                <Card>
                    <CardHeader>
                        <CardTitle>Add New Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={addItem} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Item Name</label>
                                <Input name="name" required placeholder="e.g., Kayak" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <select
                                    name="category"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    defaultValue="Outdoors"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input name="description" placeholder="Brief details..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Photo</label>
                                <Input type="file" name="imageFile" accept="image/*" />
                            </div>

                            <div className="pt-4">
                                <Button type="submit" className="w-full">Create Item</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
