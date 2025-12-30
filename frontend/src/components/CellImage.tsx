'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CellImageProps {
    imageUrl?: string;
    onImageChange?: (file: File | null) => void;
}

export default function CellImage({ imageUrl, onImageChange }: CellImageProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (imageUrl) {
            setPreviewUrl(imageUrl);
        }
    }, [imageUrl]);

    const handleFileSelect = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setIsLoading(true);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            onImageChange?.(file);
            setIsLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const displayUrl = previewUrl || imageUrl;

    return (
        <div className="space-y-4 rounded-xl border border-neutral-100 bg-white p-6 transition-all duration-300 hover:border-neutral-200 hover:shadow-sm">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 text-black">
                    <Camera className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Cell Visual</h3>
            </div>

            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "group relative aspect-video cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-all duration-300",
                    isDragging
                        ? "border-black bg-neutral-50"
                        : "border-neutral-100 bg-neutral-50/50 hover:border-neutral-300 hover:bg-neutral-50",
                    displayUrl && "border-solid border-neutral-200"
                )}
            >
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-sm">
                        <Loader2 className="h-6 w-6 animate-spin text-black" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Processing...</span>
                    </div>
                ) : displayUrl ? (
                    <>
                        <img
                            src={displayUrl}
                            alt="Cell"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black shadow-xl">
                                <Upload className="h-3 w-3" />
                                <span>Replace Image</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                            <ImageIcon className="h-6 w-6 text-neutral-300" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-neutral-600">Drop asset here or browse</p>
                            <p className="text-[10px] text-neutral-400 uppercase tracking-wider">PNG, JPG, WEBP (MAX 10MB)</p>
                        </div>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                />
            </div>
        </div>
    );
}
