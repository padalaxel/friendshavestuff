"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3 pointer-events-auto bg-white rounded-md shadow-sm border", className)}
            // We strip most custom classNames to rely on the library's layout (Grid/Table)
            // Only adding cosmetic overrides where safe
            modifiersClassNames={{
                selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white",
                today: "bg-gray-100 text-gray-900 font-bold",
                disabled: "text-gray-300 opacity-30 line-through decoration-red-500 decoration-2"
            }}
            components={{
                Chevron: ({ orientation, ...props }) => {
                    switch (orientation) {
                        case "left":
                            return <ChevronLeft className="h-4 w-4" {...props} />
                        case "right":
                            return <ChevronRight className="h-4 w-4" {...props} />
                        case "up":
                            return <ChevronUp className="h-4 w-4" {...props} />
                        case "down":
                            return <ChevronDown className="h-4 w-4" {...props} />
                        default:
                            return <ChevronRight className="h-4 w-4" {...props} />
                    }
                },
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
