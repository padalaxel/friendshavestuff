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

    const params = new URLSearchParams(searchParams);
    const category = params.get('category');
    // Default sort: 'alpha' if category is selected, otherwise 'date'
    const defaultSort = category ? 'alpha' : 'date';
    const currentSort = searchParams.get('sort') || defaultSort;

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        const category = params.get('category');
        const defaultSort = category ? 'alpha' : 'date';

        if (value && value !== defaultSort) {
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
