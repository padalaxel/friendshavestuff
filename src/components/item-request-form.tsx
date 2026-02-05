'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Calendar as CalendarIcon } from 'lucide-react';
import { BorrowRequest } from '@/lib/db';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

type ItemRequestFormProps = {
    bookings: BorrowRequest[];
    action: (formData: FormData) => Promise<void>;
};

export function ItemRequestForm({ bookings, action }: ItemRequestFormProps) {
    const [date, setDate] = useState<DateRange | undefined>();
    const [dateError, setDateError] = useState('');

    // Prepare disabled dates from bookings
    const disabledDays = bookings.flatMap(b => {
        if (!b.startDate) return [];
        const start = new Date(b.startDate);
        const end = new Date(b.endDate || b.startDate);
        const days = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
        }
        return days;
    });

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range);

        if (range?.from && range?.to) {
            // Check for overlaps in the newly selected range
            const hasOverlap = disabledDays.some(disabledDate =>
                disabledDate >= range.from! && disabledDate <= range.to!
            );

            if (hasOverlap) {
                setDateError('Selected overlapping details');
                // Optionally clear selection or let user fix it. 
                // Let's keep it but show error.
            } else {
                setDateError('');
            }
        } else {
            setDateError('');
        }
    };

    return (
        <form action={action} className="space-y-4">
            <input type="hidden" name="startDate" value={date?.from ? format(date.from, 'yyyy-MM-dd') : ''} />
            <input type="hidden" name="endDate" value={date?.to ? format(date.to, 'yyyy-MM-dd') : ''} />

            <div className="flex flex-col gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal h-12 text-base",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleSelect}
                            numberOfMonths={1}
                            disabled={[...disabledDays, { before: new Date() }]}
                        />
                    </PopoverContent>
                </Popover>

                {dateError && (
                    <p className="text-sm text-red-600 font-medium">{dateError}</p>
                )}
            </div>

            <Button className="w-full h-12 text-lg" disabled={!date?.from || !date?.to || !!dateError}>
                <Send className="mr-2 h-5 w-5" />
                Request to Borrow
            </Button>
        </form>
    );
}
