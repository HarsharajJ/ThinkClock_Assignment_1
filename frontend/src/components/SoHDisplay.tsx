'use client';

import React, { useEffect, useState } from 'react';
import { Battery as BatteryIcon, Zap, AlertTriangle, ShieldCheck, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSoH, SoHResult } from '@/lib/api';

interface SoHDisplayProps {
    shouldFetch?: boolean;
    rbMax?: number;
}

export default function SoHDisplay({ shouldFetch = false, rbMax = 0.1 }: SoHDisplayProps) {
    const [data, setData] = useState<SoHResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!shouldFetch) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getSoH(rbMax);
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to calculate SoH');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [shouldFetch, rbMax]);

    const getHealthColor = (percentage: number) => {
        if (percentage >= 80) return 'text-black bg-neutral-100';
        if (percentage >= 50) return 'text-black bg-neutral-100';
        return 'text-red-600 bg-red-50';
    };

    if (!shouldFetch && !data) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-3 rounded-lg border border-neutral-100 bg-neutral-50/30 p-8 text-center border-dashed">
                <BatteryIcon className="h-8 w-8 text-neutral-200" />
                <div className="space-y-1">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Health Analysis Pending</p>
                    <p className="text-[10px] text-neutral-300">Synchronize spectral data to initialize</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8 animate-pulse text-center">
                <div className="h-12 w-24 rounded-full bg-neutral-100" />
                <div className="space-y-2">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Calculating Indices</p>
                    <div className="mx-auto h-2 w-32 rounded bg-neutral-50" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-3 rounded-lg border border-red-100 bg-red-50 p-8 text-center">
                <AlertTriangle className="h-8 w-8 text-red-400" />
                <p className="text-xs font-bold uppercase tracking-wider text-red-900 leading-tight">Calc Error: {error}</p>
            </div>
        );
    }

    if (!data) return null;

    const percentage = data.soh_percentage;
    const isHealthy = percentage >= 80;

    return (
        <div className="h-full flex flex-col justify-center space-y-6 rounded-lg bg-black text-white p-8 transition-transform duration-500 hover:scale-[1.02] shadow-2xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className={cn("h-4 w-4", isHealthy ? "text-white" : "text-red-400")} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Health Index</span>
                </div>
                {isHealthy ? (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase">Validated</span>
                ) : (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase text-red-400">Degraded</span>
                )}
            </div>

            <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black tracking-tighter tracking-tighter">
                    {percentage.toFixed(0)}
                </span>
                <span className="text-2xl font-light text-white/40">%</span>
            </div>

            <div className="space-y-4 pt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                        className={cn("h-full transition-all duration-1000", isHealthy ? "bg-white" : "bg-red-400")}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 border-l border-white/10 pl-3">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-white/40">Rb Magnitude</p>
                        <p className="font-mono text-[10px] text-white font-bold">{data.rb_current.toExponential(3)} Ω</p>
                    </div>
                    <div className="space-y-1 border-l border-white/10 pl-3">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-white/40">Bound Peak</p>
                        <p className="font-mono text-[10px] text-white/60 font-bold">{data.rb_max.toExponential(3)} Ω</p>
                    </div>
                </div>
            </div>

            <p className="text-[8px] italic text-white/20 pt-2 border-t border-white/5">
                Calculated via Ohmic Resistance Delta Analysis (SOH = (1 - Rb / Rb_max) × 100)
            </p>
        </div>
    );
}
