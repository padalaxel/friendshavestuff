'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
    text?: string;
    loadingText?: string;
}

export function SubmitButton({
    children,
    className,
    text = "Submit",
    loadingText = "Processing...",
    ...props
}: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending}
            className={cn(className)}
            {...props}
        >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? loadingText : (children || text)}
        </Button>
    );
}
