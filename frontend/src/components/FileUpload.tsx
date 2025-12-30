'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadEISData, uploadCellEIS } from '@/lib/api';

interface FileUploadProps {
    onUploadSuccess?: (numDatapoints: number) => void;
    onUploadError?: (error: string) => void;
    cellId?: string;
}

export default function FileUpload({ onUploadSuccess, onUploadError, cellId }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [dataPoints, setDataPoints] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            setUploadStatus('error');
            setStatusMessage('Format Mismatch: Please provide a valid CSV file.');
            onUploadError?.('Please upload a CSV file');
            return;
        }

        setIsUploading(true);
        setUploadStatus('idle');

        try {
            if (cellId) {
                const result = await uploadCellEIS(cellId, file);
                setUploadStatus('success');
                setStatusMessage('System Sync: Registry updated with new telemetry.');
                setDataPoints(null);
                onUploadSuccess?.(0);
            } else {
                const result = await uploadEISData(file);
                setUploadStatus('success');
                setStatusMessage('Buffer Populated: Spectral data ready for analysis.');
                setDataPoints(result.num_datapoints || null);
                onUploadSuccess?.(result.num_datapoints || 0);
            }
        } catch (error) {
            setUploadStatus('error');
            const errorMessage = error instanceof Error ? error.message : 'Uplink Failed: Server connection interrupted.';
            setStatusMessage(errorMessage);
            onUploadError?.(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleReset = () => {
        setUploadStatus('idle');
        setStatusMessage('');
        setDataPoints(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 text-black">
                    <FileSpreadsheet className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Data Acquisition</h3>
            </div>

            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "group relative min-h-[160px] cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300",
                    isDragging
                        ? "border-black bg-neutral-50 scale-[0.99]"
                        : "border-neutral-100 bg-white hover:border-neutral-300",
                    uploadStatus === 'success' && "border-solid border-green-200 bg-green-50/30",
                    uploadStatus === 'error' && "border-solid border-red-200 bg-red-50/30",
                    isUploading && "pointer-events-none opacity-80"
                )}
            >
                {isUploading ? (
                    <div className="flex absolute inset-0 flex-col items-center justify-center gap-2 bg-white/60 backdrop-blur-[2px]">
                        <Loader2 className="h-8 w-8 animate-spin text-black" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 italic">Decoding Spectral Stream...</span>
                    </div>
                ) : uploadStatus === 'success' ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-green-900">{statusMessage}</p>
                            {dataPoints && (
                                <p className="text-[10px] uppercase tracking-widest text-green-600 font-medium">
                                    {dataPoints} Nodes Synchronized
                                </p>
                            )}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleReset(); }}
                            className="mt-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
                        >
                            Upload New Feed
                        </button>
                    </div>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 transition-transform duration-300 group-hover:scale-110 group-hover:bg-black group-hover:text-white">
                            <Upload className="h-5 w-5" />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs font-bold text-neutral-600 uppercase tracking-tight">Sync EIS Telemetry</p>
                            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">CSV Format: Freq, Real, Imag</p>
                        </div>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={isUploading}
                />
            </div>

            {uploadStatus === 'error' && (
                <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-900">{statusMessage}</p>
                </div>
            )}

            <div className="flex justify-center pt-2">
                <a
                    href="https://impedancepy.readthedocs.io/en/latest/_downloads/320671c0bb666e4d6ac487c9d7ff1679/exampleData.csv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 hover:text-black transition-colors"
                >
                    <Download className="h-3 w-3" />
                    <span>Schema Template (exampleData.csv)</span>
                </a>
            </div>
        </div>
    );
}
