'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

type BlackoutDatesPickerProps = {
    initialDates?: string[];
    name?: string;
};

export default function BlackoutDatesPicker({ initialDates = [], name = "blackoutDates" }: BlackoutDatesPickerProps) {
    // Parse initial strings to Date objects
    const [selectedDates, setSelectedDates] = useState<Date[] | undefined>(
        initialDates.map(d => new Date(d))
    );

    const handleSelect = (dates: Date[] | undefined) => {
        setSelectedDates(dates);
    };

    // Serialize to JSON string for form submission
    const serializedDates = selectedDates?.map(d => format(d, 'yyyy-MM-dd')) || [];

    return (
        <div className="space-y-3">
            <input type="hidden" name={name} value={JSON.stringify(serializedDates)} />

            <div className="border rounded-md p-4 bg-white">
                <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={handleSelect}
                    className="rounded-md border shadow-sm mx-auto"
                />
            </div>

            <div className="text-sm text-gray-500">
                {selectedDates?.length
                    ? `${selectedDates.length} date(s) marked as unavailable.`
                    : "No dates blocked."}
            </div>
        </div>
    );
}
