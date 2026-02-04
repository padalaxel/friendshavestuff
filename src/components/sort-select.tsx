'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function SortSelect() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const currentSort = searchParams.get('sort') || 'date';

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'date') {
            params.set('sort', value);
        } else {
            params.delete('sort');
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <Select
            value={currentSort}
            onValueChange={handleSortChange}
        >
            <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="date">Recently Added</SelectItem>
                <SelectItem value="alpha">Alphabetical</SelectItem>
            </SelectContent>
        </Select>
    );
}
