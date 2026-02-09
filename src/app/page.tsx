import { getItems, getUsers } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logout } from '@/lib/actions';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, LogOut, LayoutGrid, List } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Search } from '@/components/search';
import { CategoryFilter } from '@/components/category-filter';
import { SortSelect } from '@/components/sort-select';
import { Suspense } from 'react';

export default async function Home(props: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    view?: string;
    sort?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const searchParams = await props.searchParams;
  const allItems = await getItems();
  const users = await getUsers();

  // 1. Calculate Category Counts
  const ALL_CATEGORIES = ['Outdoors', 'Tools', 'Kitchen', 'Garden/Yard', 'Electronics', 'Recreation', 'Travel', 'Clothing', 'Household'];

  const categoryCounts = allItems.reduce((acc, item) => {
    const cat = item.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Ensure all categories are present, even with 0 count
  const categories = ALL_CATEGORIES.map(name => ({
    name,
    count: categoryCounts[name] || 0
  }));

  // 2. Filter & Sort Items
  const query = searchParams?.q?.toLowerCase() || '';
  const categoryFilter = searchParams?.category;
  const view = searchParams?.view || 'grid';
  // Default sort: 'alpha' if category is selected, otherwise 'date'
  const defaultSort = categoryFilter ? 'alpha' : 'date';
  const sort = searchParams?.sort || defaultSort;
  const isListView = view === 'list';

  const filteredItems = allItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query);
    const matchesCategory = categoryFilter ? (item.category || 'Other') === categoryFilter : true;

    return matchesSearch && matchesCategory;
  });

  // Sort Items based on selection
  filteredItems.sort((a, b) => {
    if (sort === 'alpha') {
      return a.name.localeCompare(b.name);
    } else {
      // Date (Newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (isListView && sort !== 'alpha') {
    // If list view and already sorted by date, no extra sort needed unless we want to enforce name sort for list view specifically.
    // The previous code forced name sort on list view.
    // Let's Respect the user's sort choice for now, but if they haven't chosen (default 'date'), list view might feel better sorted by name?
    // The previous logic was: if (isListView) filteredItems.sort((a, b) => a.name.localeCompare(b.name));
    // Now we likely want to respect the explicit sort.
    // If the user explicitly asks for "Recently Added", we should probably show that.
    // If the user explicitly asks for "Alphabetical", we show that.
    // If the requirement is "we should be able to sort by recently added, or alphabetical", then explicit sort wins.
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">

        {/* Top: Search & Add */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="w-full md:max-w-lg">
            <Search />
          </div>
          <Link href="/items/new">
            <Button size="lg" className="w-full md:w-auto">
              <Plus className="h-5 w-5 mr-2" />
              Add New Item
            </Button>
          </Link>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Categories</h2>
          <CategoryFilter categories={categories} />
        </div>

        {/* List/Grid Content */}
        {/* List/Grid Content */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            {/* Mobile Header Layout */}
            <div className="flex flex-col md:hidden gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">
                  {categoryFilter ? `${categoryFilter} Items` : 'All Gear'}
                  <span className="ml-2 text-sm font-normal text-gray-500">({filteredItems.length})</span>
                </h2>
              </div>

              <div className="flex items-center justify-between">
                {/* View Toggle (Left) */}
                <div className="flex items-center bg-white border rounded-lg p-0.5 shadow-sm">
                  <Link href={{ query: { ...searchParams, view: 'grid' } }}>
                    <Button variant={!isListView ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-md">
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={{ query: { ...searchParams, view: 'list' } }}>
                    <Button variant={isListView ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-md">
                      <List className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Sort (Right) */}
                <Suspense fallback={<div className="h-10 w-[180px] bg-gray-100 animate-pulse rounded-md" />}>
                  <SortSelect />
                </Suspense>
              </div>
            </div>

            {/* Desktop Header Layout */}
            <div className="hidden md:flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">
                  {categoryFilter ? `${categoryFilter} Items` : 'All Gear'}
                  <span className="ml-2 text-sm font-normal text-gray-500">({filteredItems.length})</span>
                </h2>

                {/* View Toggle */}
                <div className="flex items-center bg-white border rounded-lg p-0.5 shadow-sm">
                  <Link href={{ query: { ...searchParams, view: 'grid' } }}>
                    <Button variant={!isListView ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-md">
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={{ query: { ...searchParams, view: 'list' } }}>
                    <Button variant={isListView ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-md">
                      <List className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Sort (Far Right) */}
              <Suspense fallback={<div className="h-10 w-[180px] bg-gray-100 animate-pulse rounded-md" />}>
                <SortSelect />
              </Suspense>
            </div>

            {query && <span className="text-sm text-gray-500">Results for &quot;{query}&quot;</span>}
          </div>

          {filteredItems.length > 0 ? (
            isListView ? (
              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const owner = users.find(u => u.id === item.ownerId);
                  return (
                    <Link key={item.id} href={`/items/${item.id}`}>
                      <Card className="hover:bg-gray-50 transition-colors p-3 md:p-4 flex flex-row items-center justify-between gap-3 md:gap-4 group border border-gray-100 shadow-sm">
                        {/* Text Content (Left) */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                          <div className="font-bold text-base md:text-lg text-gray-900 group-hover:text-blue-600 transition-colors truncate pr-2">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs font-normal px-2 py-0.5 text-gray-500 bg-gray-100">
                              {item.category || 'General'}
                            </Badge>
                          </div>
                        </div>

                        {/* Thumbnail (Right) - Visible on all screens */}
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                          <img
                            src={item.imageUrl || "https://placehold.co/100x100?text=+"}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                {filteredItems.map((item) => {
                  const owner = users.find(u => u.id === item.ownerId);
                  return (
                    <Link key={item.id} href={`/items/${item.id}`} className="block group">
                      <div id={`item-${item.id}`} className="h-full">
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
                          <div className="aspect-[4/3] relative w-full bg-gray-100 overflow-hidden">
                            <img
                              src={item.imageUrl || "https://placehold.co/600x400?text=No+Image"}
                              alt={item.name}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <CardHeader className="p-2 sm:p-4 pb-0 sm:pb-2 flex-grow">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-sm sm:text-lg truncate leading-tight" title={item.name}>{item.name}</CardTitle>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                          </CardHeader>
                          <CardFooter className="p-2 sm:p-4 pt-2 flex items-center justify-between border-t mt-2 bg-gray-50/50 hidden sm:flex">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                              <Avatar className="h-5 w-5 sm:h-6 sm:w-6 ring-2 ring-white">
                                <AvatarImage src={owner?.avatarUrl} />
                                <AvatarFallback>?</AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[60px] sm:max-w-none">{owner?.name.split(' ')[0]}</span>
                            </div>
                            <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5 font-normal bg-white border-gray-200">
                              {item.category || 'General'}
                            </Badge>
                          </CardFooter>
                        </Card>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed">
              <p className="text-gray-500 text-lg">No items found matching your filters.</p>
              <Link href="/">
                <Button variant="link">Clear filters</Button>
              </Link>
            </div>
          )}
        </div>
      </main >
    </div >
  );
}
