'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImagePickerProps {
    name: string;
    initialImages?: string[];
}

export default function ImagePicker({ name, initialImages = [] }: ImagePickerProps) {
    // We'll treat initialPreview as a single string for now, but valid state can hold multiple
    const [images, setImages] = useState<{ id: string; url: string; file?: File; isExisting?: boolean }[]>(
        initialImages ? initialImages.map((url, idx) => ({ id: `init-${idx}`, url, isExisting: true })) : []
    );
    const [isCompressing, setIsCompressing] = useState(false);

    // We use a container to hold multiple inputs or just manage one data transfer
    // For simple form submission with name="imageFile", multiple inputs with same name works best
    // or one input with multiple attribute. 
    // Let's use DataTransfer object to sync with a single hidden input.
    const realInputRef = useRef<HTMLInputElement>(null);

    async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        if (images.length + selectedFiles.length > 3) {
            alert("You can only add up to 3 images.");
            return;
        }

        setIsCompressing(true);

        try {
            const newImages: { id: string; url: string; file: File; isExisting?: boolean }[] = [];

            for (const file of selectedFiles) {
                const compressedFile = await compressImage(file);
                newImages.push({
                    id: Math.random().toString(36).substr(2, 9),
                    url: URL.createObjectURL(compressedFile),
                    file: compressedFile
                });
            }

            const updatedImages = [...images, ...newImages];
            setImages(updatedImages);
            updateHiddenInput(updatedImages);

        } catch (err) {
            console.error("Compression failed", err);
            alert("Failed to process one or more images.");
        } finally {
            setIsCompressing(false);
            // Reset the picker input so same file can be selected again if needed
            e.target.value = '';
        }
    }

    function removeImage(idToRemove: string) {
        const updatedImages = images.filter(img => img.id !== idToRemove);
        setImages(updatedImages);
        updateHiddenInput(updatedImages);

        // Revoke URL if it was created by us (checked by file existence)
        const removed = images.find(img => img.id === idToRemove);
        if (removed?.file) {
            URL.revokeObjectURL(removed.url);
        }
    }

    function updateHiddenInput(currentImages: { id: string; url: string; file?: File; isExisting?: boolean }[]) {
        if (!realInputRef.current) return;

        const dt = new DataTransfer();
        currentImages.forEach(img => {
            if (img.file) {
                dt.items.add(img.file);
            }
        });
        realInputRef.current.files = dt.files;
    }

    return (
        <div className="space-y-4">
            {/* The Real Input (Hidden) that gets submitted for NEW files */}
            <input
                type="file"
                name={name}
                ref={realInputRef}
                className="hidden"
                accept="image/*"
                multiple
            />

            {/* Hidden inputs for EXISTING images that should be kept */}
            {images.filter(img => img.isExisting).map(img => (
                <input key={img.id} type="hidden" name="existingImageUrls" value={img.url} />
            ))}

            {/* Image Grid */}
            <div className="grid grid-cols-3 gap-4">
                {images.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={img.url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage(img.id)}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}

                {/* Add Button */}
                {images.length < 3 && (
                    <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors relative">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            onChange={handleFileSelect}
                            disabled={isCompressing}
                            multiple
                            title={isCompressing ? "Compressing..." : "Add image"}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none p-2 text-center">
                            {isCompressing ? (
                                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                            ) : (
                                <ImagePlus className="h-6 w-6 text-gray-400" />
                            )}
                            <span className="text-xs font-medium text-gray-600">
                                {isCompressing ? '...' : 'Add Photo'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                                {3 - images.length} remaining
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-500">
                Add up to 3 photos. First one will be the cover.
            </p>
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
