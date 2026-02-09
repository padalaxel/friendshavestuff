'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
    images: string[];
    alt: string;
    className?: string; // Allow passing existing layout classes
}

export function ImageCarousel({ images, alt, className }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // If no images or empty array, show placeholder or return nothing?
    // Logic in usage site usually handles specific placeholder URL.
    // If we have just 1 image, don't show arrows.
    const hasMultiple = images.length > 1;

    function nextImage() {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }

    function prevImage() {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }

    // Swipe support
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Minimum swipe distance (in px) 
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null); // Reset
        setTouchStart(e.targetTouches[0].clientX);
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextImage(); // Swipe left -> Go to next (right)
        }
        if (isRightSwipe) {
            prevImage(); // Swipe right -> Go to prev (left)
        }
    }

    // Safety check
    const currentSrc = images[currentIndex] || "https://placehold.co/800x600?text=No+Image";

    return (
        <div
            className={cn("relative group select-none touch-pan-y", className)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Main Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={currentSrc}
                alt={`${alt} - Image ${currentIndex + 1}`}
                className="object-contain w-full h-full max-h-[40vh] md:max-h-[70vh] transition-opacity duration-300"
                draggable={false}
            />

            {/* Navigation Arrows (Only if multiple) */}
            {hasMultiple && (
                <>
                    {/* Left Arrow */}
                    <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all focus:opacity-100 focus:outline-none backdrop-blur-sm"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    {/* Right Arrow */}
                    <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all focus:opacity-100 focus:outline-none backdrop-blur-sm"
                        aria-label="Next image"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Indicators/Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all shadow-sm",
                                    idx === currentIndex
                                        ? "bg-white scale-110"
                                        : "bg-white/50 hover:bg-white/80"
                                )}
                                aria-label={`Go to image ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
