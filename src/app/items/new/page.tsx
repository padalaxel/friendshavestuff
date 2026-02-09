import { createItem } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { uploadItemImage } from '@/lib/storage';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImagePicker from '@/components/image-picker';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SubmitButton } from '@/components/submit-button';
import AutosizeTextarea from '@/components/autosize-textarea';

const CATEGORIES = [
    'Outdoors', 'Tools', 'Kitchen', 'Garden/Yard', 'Electronics',
    'Recreation', 'Travel', 'Clothing', 'Household', 'Other'
];

export const metadata = {
    title: 'Add New Item',
};

export default async function AddItemPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    async function addItem(formData: FormData) {
        'use server';
        if (!session) return;

        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;

        // Handle multiple images
        const imageFiles = formData.getAll('imageFile') as File[];
        const imageUrls: string[] = [];

        // Upload all valid images
        for (const file of imageFiles) {
            if (file && file.size > 0) {
                const uploadedUrl = await uploadItemImage(file);
                if (uploadedUrl) imageUrls.push(uploadedUrl);
            }
        }

        // Default image if none uploaded
        if (imageUrls.length === 0) {
            imageUrls.push("https://placehold.co/600x400?text=Item");
        }

        await createItem({
            ownerId: session.id,
            name,
            description,
            category,
            imageUrls, // Pass array
            imageUrl: imageUrls[0], // Pass first as main (though db.ts handles fallback)
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
                                <AutosizeTextarea
                                    name="description"
                                    placeholder="Brief details..."
                                    minRows={3}
                                    maxRows={10}
                                    className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Photos</label>
                                <ImagePicker name="imageFile" />
                            </div>

                            <div className="pt-4">
                                <SubmitButton className="w-full" loadingText="Creating Item...">Create Item</SubmitButton>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
