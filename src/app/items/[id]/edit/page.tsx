import { getItemById, updateItem, deleteItem } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { uploadItemImage } from '@/lib/storage';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImagePicker from '@/components/image-picker';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { SubmitButton } from '@/components/submit-button';
import BlackoutDatesPicker from '@/components/blackout-dates-picker';

const CATEGORIES = [
    'Outdoors', 'Tools', 'Kitchen', 'Garden/Yard', 'Electronics',
    'Recreation', 'Travel', 'Clothing', 'Household', 'Other'
];

export default async function EditItemPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const session = await getSession();
    if (!session) redirect('/login');

    const item = await getItemById(id);
    if (!item) notFound();

    // Authorization check
    if (item.ownerId !== session.id && !session.isAdmin) {
        return <div className="p-10 text-center">Unauthorized</div>;
    }

    async function editItem(formData: FormData) {
        'use server';
        if (!session) return;

        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;
        const imageFile = formData.get('imageFile') as File;
        const blackoutDatesJson = formData.get('blackoutDates') as string;
        let blackoutDates: string[] = [];
        try {
            if (blackoutDatesJson) {
                // The picker returns JSON string of array
                const parsed = JSON.parse(blackoutDatesJson);
                if (Array.isArray(parsed)) blackoutDates = parsed;
            }
        } catch (e) {
            console.error("Failed to parse blackout dates", e);
        }

        let imageUrl = item?.imageUrl; // Default to existing
        if (imageFile && imageFile.size > 0) {
            const uploadedUrl = await uploadItemImage(imageFile);
            if (uploadedUrl) imageUrl = uploadedUrl;
        }

        await updateItem(id, {
            name,
            description,
            category,
            imageUrl,
            blackoutDates
        }, session.isAdmin);

        redirect(`/items/${id}`);
    }

    async function removeItem() {
        'use server';
        if (!session || !item) return;
        // Re-verify auth for safety
        if (item.ownerId !== session.id && !session.isAdmin) return;

        await deleteItem(id, session.isAdmin);
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 pt-10">
            <div className="max-w-md mx-auto">
                <Link href={`/items/${id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back to item
                </Link>

                <Card>
                    <CardHeader>
                        <CardTitle>Edit Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={editItem} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Item Name</label>
                                <Input name="name" required defaultValue={item.name} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <select
                                    name="category"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    defaultValue={item.category || 'Other'}
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input name="description" defaultValue={item.description} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Change Photo (Optional)</label>
                                <ImagePicker name="imageFile" initialPreview={item.imageUrl} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Blackout Dates</label>
                                <p className="text-xs text-gray-500">Select dates when this item is unavailable.</p>
                                <BlackoutDatesPicker initialDates={item.blackoutDates || []} />
                            </div>

                            <div className="pt-4 flex gap-2">
                                <Link href={`/items/${id}`} className="flex-1">
                                    <Button variant="outline" className="w-full" type="button">Cancel</Button>
                                </Link>
                                <SubmitButton className="flex-1" loadingText="Saving...">Save Changes</SubmitButton>
                            </div>
                        </form>

                        <div className="mt-8 pt-6 border-t">
                            <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
                            <form action={removeItem}>
                                <Button variant="destructive" className="w-full bg-white text-red-600 border border-red-200 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Listing
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
