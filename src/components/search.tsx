'use client';

import { Input } from '@/components/ui/input';
import { SearchIcon } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export function Search() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        // Reset category if searching, or keep it? User probably wants to search globally usually, but let's keep category if set.
        // Actually, if I search "tent" while in "Kitchen", I might find nothing. 
        // UX Decision: Search is global. Clear category if search is present?
        // Let's keep filters additive for now, but simple search is usually expected to be glboal. 
        // For simplicity: If I type, I stay on current view but filtered. 
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    return (
        <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            <Input
                className="pl-10 h-12 text-lg bg-white shadow-sm"
                placeholder="Search for items..."
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get('q')?.toString()}
            />
        </div>
    );
}
