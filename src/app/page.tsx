import { getItems, getUsers } from '@/lib/db';
import { getSession, logout } from '@/lib/auth';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, LogOut } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Search } from '@/components/search';
import { CategoryFilter } from '@/components/category-filter';

export default async function Home(props: {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const searchParams = await props.searchParams;
  const allItems = await getItems();
  const users = await getUsers();

  // 1. Calculate Category Counts (from ALL items)
  const categoryCounts = allItems.reduce((acc, item) => {
    const cat = item.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // 2. Filter Items
  const query = searchParams?.q?.toLowerCase() || '';
  const categoryFilter = searchParams?.category;

  const filteredItems = allItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query);
    const matchesCategory = categoryFilter ? (item.category || 'Other') === categoryFilter : true;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navbar */}
      <header className="bg-white border-b sticky top-0 z-10 px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight text-blue-600 hover:text-blue-700 transition-colors">
          FriendsHaveStuff
        </Link>
        <div className="flex items-center gap-4">
          {session.email === 'paul.s.rogers@gmail.com' && (
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-blue-600 font-medium hidden md:flex">
                Manage Users
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <Link href="/profile" className="flex items-center gap-2 group">
              <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                <AvatarImage src={session.avatarUrl} />
                <AvatarFallback>{(session.name || session.email)[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline group-hover:text-blue-600 transition-colors">
                {session.name || session.email}
              </span>
            </Link>
          </div>

          <form action={logout}>
            <Button variant="ghost" size="icon" title="Logout">
              <LogOut className="h-5 w-5 text-gray-500" />
            </Button>
          </form>
        </div>
      </header>

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

        {/* Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {categoryFilter ? `${categoryFilter} Items` : 'All Gear'}
              <span className="ml-2 text-sm font-normal text-gray-500">({filteredItems.length})</span>
            </h2>
            {query && <span className="text-sm text-gray-500">Results for &quot;{query}&quot;</span>}
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredItems.map((item) => {
                const owner = users.find(u => u.id === item.ownerId);
                return (
                  <Link key={item.id} href={`/items/${item.id}`} className="block group">
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
                      <div className="aspect-[4/3] relative w-full bg-gray-100 overflow-hidden">
                        <img
                          src={item.imageUrl || "https://placehold.co/600x400?text=No+Image"}
                          alt={item.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute top-2 right-2 bg-white/90 text-black hover:bg-white/90">
                          {item.category || 'General'}
                        </Badge>
                      </div>
                      <CardHeader className="p-4 pb-2 flex-grow">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg truncate" title={item.name}>{item.name}</CardTitle>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                      </CardHeader>
                      <CardFooter className="p-4 pt-2 flex items-center justify-between border-t mt-2 bg-gray-50/50">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Avatar className="h-6 w-6 ring-2 ring-white">
                            <AvatarImage src={owner?.avatarUrl} />
                            <AvatarFallback>?</AvatarFallback>
                          </Avatar>
                          <span>{owner?.name.split(' ')[0]}</span>
                        </div>
                        <Button variant="secondary" size="sm" className="pointer-events-none">Details</Button>
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed">
              <p className="text-gray-500 text-lg">No items found matching your filters.</p>
              <Link href="/">
                <Button variant="link">Clear filters</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
