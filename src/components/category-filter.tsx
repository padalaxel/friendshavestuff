'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
    Tent,
    Wrench,
    Utensils,
    Shovel, // Garden/Yard
    MonitorSmartphone,
    Gamepad2,
    Plane, // Travel
    Shirt, // Clothing
    Armchair, // Household
    Package
} from 'lucide-react';

// Map categories to icons
const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'Outdoors': Tent,
    'Tools': Wrench,
    'Kitchen': Utensils,
    'Garden/Yard': Shovel,
    'Electronics': MonitorSmartphone,
    'Recreation': Gamepad2,
    'Travel': Plane,
    'Clothing': Shirt,
    'Household': Armchair,
    'Other': Package
};

export function CategoryFilter({ categories }: { categories: { name: string, count: number }[] }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const currentCategory = searchParams.get('category');

    const handleCategory = (category: string | null) => {
        const params = new URLSearchParams(searchParams);
        if (category) {
            params.set('category', category);
        } else {
            params.delete('category');
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap gap-4 mb-8">
            <Button
                variant={!currentCategory ? "default" : "outline"}
                onClick={() => handleCategory(null)}
                className="h-auto py-4 px-6 flex flex-col items-center gap-2 min-w-[100px]"
            >
                <Package className="h-6 w-6" />
                <span className="text-sm font-medium">All Items</span>
            </Button>

            {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.name] || Package;
                return (
                    <Button
                        key={cat.name}
                        variant={currentCategory === cat.name ? "default" : "outline"}
                        onClick={() => handleCategory(cat.name)}
                        className={cn(
                            "h-auto py-4 px-6 flex flex-col items-center gap-2 min-w-[100px]",
                            currentCategory === cat.name ? "ring-2 ring-offset-2 ring-blue-500" : ""
                        )}
                    >
                        <Icon className="h-6 w-6" />
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium">{cat.name}</span>
                            <span className="text-xs opacity-70">{cat.count} items</span>
                        </div>
                    </Button>
                );
            })}
        </div>
    );
}
