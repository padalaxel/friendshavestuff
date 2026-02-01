import { createClient } from '@/lib/supabase/server';

export async function uploadItemImage(file: File): Promise<string | null> {
    if (!file || file.size === 0) return null;

    const supabase = await createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
        .from('items')
        .upload(filePath, file);

    if (error) {
        console.error('Error uploading image:', error);
        throw new Error('Image upload failed');
    }

    const { data } = supabase.storage
        .from('items')
        .getPublicUrl(filePath);

    return data.publicUrl;
}
