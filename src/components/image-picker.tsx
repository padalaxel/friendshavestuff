'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImagePickerProps {
    name: string;
    initialPreview?: string | null;
}

export default function ImagePicker({ name, initialPreview }: ImagePickerProps) {
    const [preview, setPreview] = useState<string | null>(initialPreview || null);
    const [isCompressing, setIsCompressing] = useState(false);
    const realInputRef = useRef<HTMLInputElement>(null);

    async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset
        setIsCompressing(true);

        try {
            // Compress Image
            const compressedFile = await compressImage(file);

            // Set the compressed file into the REAL hidden input
            if (realInputRef.current) {
                const dt = new DataTransfer();
                dt.items.add(compressedFile);
                realInputRef.current.files = dt.files;
            }

            // Create preview URL
            const url = URL.createObjectURL(compressedFile);
            setPreview(url);

        } catch (err) {
            console.error("Compression failed", err);
            alert("Failed to process image. Please try another one.");
        } finally {
            setIsCompressing(false);
        }
    }

    function clearImage() {
        setPreview(null);
        if (realInputRef.current) realInputRef.current.value = '';
    }

    return (
        <div className="space-y-3">
            {/* The Real Input (Hidden) that gets submitted */}
            <input
                type="file"
                name={name}
                ref={realInputRef}
                className="hidden"
                accept="image/*"
            />

            {/* The Preview / Selection Area */}
            {!preview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`picker-${name}`}
                        onChange={handleFileSelect}
                        disabled={isCompressing}
                    />
                    <label
                        htmlFor={`picker-${name}`}
                        className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                        {isCompressing ? (
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        ) : (
                            <ImagePlus className="h-8 w-8 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-600">
                            {isCompressing ? 'Compressing...' : 'Tap to add photo'}
                        </span>
                        <span className="text-xs text-gray-400">
                            Max 5MB (Auto-resized)
                        </span>
                    </label>
                </div>
            ) : (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <div className="aspect-video relative">
                        {/* We use standard img for blob preview validity */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded">
                        Ready to upload
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Helper: Compression Logic ---
async function compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const scaleSize = MAX_WIDTH / img.width;
                const newWidth = Math.min(img.width, MAX_WIDTH);
                const newHeight = img.height * (scaleSize < 1 ? scaleSize : 1);

                canvas.width = newWidth;
                canvas.height = newHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Canvas context failed')); return; }

                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                // Convert to Blob (JPEG 0.8)
                canvas.toBlob((blob) => {
                    if (!blob) { reject(new Error('Blob creation failed')); return; }
                    // Create new file with original name (but .jpg extension if needed)
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(newFile);
                }, 'image/jpeg', 0.8);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}
