'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Barcode from 'react-barcode';
import { Copy, Check, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CellIdBarcodeProps {
    cellId?: string;
    onCellIdGenerated?: (id: string) => void;
}

function generateUniqueCellId(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const combined = timestamp + random;
    return combined.slice(-10);
}

export default function CellIdBarcode({ cellId: externalCellId, onCellIdGenerated }: CellIdBarcodeProps) {
    const [cellId, setCellId] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (externalCellId) {
            setCellId(externalCellId);
        } else {
            const newId = generateUniqueCellId();
            setCellId(newId);
            onCellIdGenerated?.(newId);
        }
    }, [externalCellId, onCellIdGenerated]);

    const handleCopy = useCallback(async () => {
        if (cellId) {
            await navigator.clipboard.writeText(cellId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [cellId]);

    return (
        <div className="space-y-4 rounded-xl border border-neutral-100 bg-white p-6 transition-all duration-300 hover:border-neutral-200 hover:shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 text-black">
                        <Fingerprint className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Cell Identity</h3>
                </div>
                <button
                    onClick={handleCopy}
                    disabled={!cellId}
                    className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider transition-all duration-200",
                        copied
                            ? "bg-black text-white"
                            : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-black"
                    )}
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3" />
                            <span>Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" />
                            <span>Copy ID</span>
                        </>
                    )}
                </button>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-neutral-50/50 py-8">
                {cellId ? (
                    <>
                        <div className="mix-blend-multiply transition-opacity duration-300 hover:opacity-80">
                            <Barcode
                                value={cellId}
                                format="CODE128"
                                width={1.8}
                                height={60}
                                displayValue={false}
                                background="transparent"
                                lineColor="#000000"
                            />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-mono text-lg font-bold tracking-[0.3em] text-black">
                                {cellId.match(/.{1,5}/g)?.join(' ')}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Assigning ID...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
