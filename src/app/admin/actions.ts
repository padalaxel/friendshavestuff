'use server';

import { getSession } from '@/lib/auth';
import { addAllowedUser, removeAllowedUser } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function addUser(formData: FormData) {
    const session = await getSession();
    if (session?.email !== 'paul.s.rogers@gmail.com') return;

    const email = formData.get('email') as string;
    const name = formData.get('name') as string;

    if (email) {
        await addAllowedUser(email, name);
    }
    revalidatePath('/admin');
}

export async function removeUser(email: string) {
    const session = await getSession();
    if (session?.email !== 'paul.s.rogers@gmail.com') return;

    if (email) {
        await removeAllowedUser(email);
    }
    revalidatePath('/admin');
}
