'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { BorrowRequest } from '@/lib/db';

type Item = {
    id: string;
    ownerId: string;
    name: string;
    category?: string;
    description?: string;
    imageUrl?: string;
    // ... other fields if needed for display, but main logic needs IDs
};

type ItemRequestFormProps = {
    bookings: BorrowRequest[];
    action: (formData: FormData) => Promise<void>;
};

export function ItemRequestForm({ bookings, action }: ItemRequestFormProps) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateError, setDateError] = useState('');

    const endDateRef = useRef<HTMLInputElement>(null);

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStart = e.target.value;
        setStartDate(newStart);

        // Auto-set end date if empty or before new start date
        if (!endDate || newStart > endDate) {
            setEndDate(newStart);
        }

        // validate
        validateDates(newStart, endDate || newStart);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEnd = e.target.value;
        setEndDate(newEnd);
        validateDates(startDate, newEnd);
    };

    const validateDates = (start: string, end: string) => {
        if (!start || !end) {
            setDateError('');
            return;
        }

        const s = new Date(start);
        const e = new Date(end);

        if (e < s) {
            setDateError('End date cannot be before start date');
            return;
        }

        // Check overlaps
        const hasOverlap = bookings.some(b => {
            if (!b.startDate) return false;
            const bStart = new Date(b.startDate);
            const bEnd = new Date(b.endDate || b.startDate);
            return s <= bEnd && e >= bStart;
        });

        if (hasOverlap) {
            setDateError('Selected dates overlap with an existing booking');
            return;
        }

        setDateError('');
    };

    return (
        <form action={action} className="space-y-4">
            {bookings.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-md p-3 text-sm text-red-800 mb-4">
                    <p className="font-semibold mb-1">Unavailable Dates:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                        {bookings.map(b => (
                            <li key={b.id}>
                                {b.startDate ? `${new Date(b.startDate).toLocaleDateString()} - ${new Date(b.endDate || b.startDate).toLocaleDateString()}` : 'Booked'}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 cursor-pointer" onClick={() => (document.getElementById('startDateInput') as HTMLInputElement)?.showPicker?.()}>
                    <label className="text-xs font-semibold uppercase text-gray-500 pointer-events-none">From</label>
                    <input
                        id="startDateInput"
                        type="date"
                        name="startDate"
                        required
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={startDate}
                        onChange={handleStartDateChange}
                    />
                </div>
                <div className="space-y-2 cursor-pointer" onClick={() => (document.getElementById('endDateInput') as HTMLInputElement)?.showPicker?.()}>
                    <label className="text-xs font-semibold uppercase text-gray-500 pointer-events-none">To</label>
                    <input
                        id="endDateInput"
                        type="date"
                        name="endDate"
                        required
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={endDate}
                        onChange={handleEndDateChange}
                        ref={endDateRef}
                    />
                </div>
            </div>

            {dateError && (
                <p className="text-sm text-red-600 font-medium">{dateError}</p>
            )}

            <Button className="w-full h-12 text-lg" disabled={!!dateError}>
                <Send className="mr-2 h-5 w-5" />
                Request to Borrow
            </Button>
        </form>
    );
}
