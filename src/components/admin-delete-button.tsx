'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { removeUser } from '@/app/admin/actions';

export function DeleteUserButton({ email, name }: { email: string, name: string }) {
    async function handleDelete() {
        if (confirm(`Are you sure you want to remove ${name} (${email})?`)) {
            await removeUser(email);
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
