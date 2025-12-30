'use client';

import React, { useEffect, useState } from 'react';
import { Info, Loader2, Table as TableIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getECMParameters, ECMParameter } from '@/lib/api';

interface ECMParamsTableProps {
    shouldFetch?: boolean;
    onDataLoaded?: (params: ECMParameter[]) => void;
}

export default function ECMParamsTable({ shouldFetch = false, onDataLoaded }: ECMParamsTableProps) {
    const [parameters, setParameters] = useState<ECMParameter[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!shouldFetch) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getECMParameters();
                setParameters(result.parameters);
                onDataLoaded?.(result.parameters);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Model convergence failed');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [shouldFetch, onDataLoaded]);

    const getIndicatorPosition = (value: number, min: number, max: number) => {
        const percentage = ((value - min) / (max - min)) * 100;
        return Math.max(0, Math.min(100, percentage));
    };

    if (!shouldFetch && parameters.length === 0) {
        return (
            <div className="flex h-[200px] flex-col items-center justify-center space-y-3 rounded-lg border border-neutral-100 bg-neutral-50/30 text-center border-dashed">
                <TableIcon className="h-6 w-6 text-neutral-200" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">Awaiting Model Fitment</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 py-12 animate-pulse">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-200" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300 italic">Iterating Constants...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-red-900">
                <Info className="h-4 w-4 shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                    <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-100">
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-neutral-400">Node</th>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-neutral-400">Magnitude</th>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-neutral-400">System Impact</th>
                            <th className="px-4 py-3 font-black uppercase tracking-widest text-neutral-400 text-right">Confidence</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {parameters.map((param, index) => (
                            <tr key={index} className="transition-colors hover:bg-neutral-50/50">
                                <td className="px-4 py-3 font-mono font-black text-black">{param.name}</td>
                                <td className="px-4 py-3 font-mono text-neutral-600">
                                    <span className="font-bold text-black">{param.value.toExponential(2)}</span>
                                    <span className="ml-1 text-[8px] font-black opacity-40">{param.unit}</span>
                                </td>
                                <td className="px-4 py-3 text-[10px] font-medium leading-relaxed text-neutral-400 max-w-[180px]">
                                    {param.explanation}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex flex-col items-end gap-1 w-24">
                                        <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100">
                                            <div
                                                className="h-full bg-black transition-all duration-1000"
                                                style={{ left: 0, width: `${getIndicatorPosition(param.value, param.min_value, param.max_value)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between w-full font-mono text-[7px] font-black text-neutral-300">
                                            <span>MIN</span>
                                            <span>MAX</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
