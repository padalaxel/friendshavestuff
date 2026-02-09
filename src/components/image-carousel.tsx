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

    // Safety check
    const currentSrc = images[currentIndex] || "https://placehold.co/800x600?text=No+Image";

    return (
        <div className={cn("relative group select-none", className)}>
            {/* Main Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={currentSrc}
                alt={`${alt} - Image ${currentIndex + 1}`}
                className="object-contain w-full h-full max-h-[40vh] md:max-h-[70vh] transition-opacity duration-300"
            />

            {/* Navigation Arrows (Only if multiple) */}
            {hasMultiple && (
                <>
                    {/* Left Arrow */}
                    <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none backdrop-blur-sm"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    {/* Right Arrow */}
                    <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none backdrop-blur-sm"
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
