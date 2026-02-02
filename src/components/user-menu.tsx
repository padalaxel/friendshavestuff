'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Package, ChevronDown } from 'lucide-react';
import { logout } from '@/lib/actions';

type UserMenuProps = {
    user: {
        name: string;
        email: string;
        avatarUrl?: string;
    };
};

export function UserMenu({ user }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape key
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 group focus:outline-none"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{(user.name || user.email)[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex items-center gap-1">
                    <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                        {user.name || user.email}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100 mb-1 sm:hidden">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <User className="h-4 w-4" />
                        Edit Profile
                    </Link>

                    <Link
                        href="/my-items"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <Package className="h-4 w-4" />
                        My Items
                    </Link>

                    <div className="border-t border-gray-100 my-1"></div>

                    <form action={logout} className="w-full">
                        <button
                            type="submit"
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
