'use client';

import React from 'react';
import { Settings2, Sparkles, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetaInfoFormProps {
    condition?: string;
    onConditionChange?: (condition: string) => void;
}

export default function MetaInfoForm({ condition = 'Recycled', onConditionChange }: MetaInfoFormProps) {
    const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        onConditionChange?.(value);
    };

    return (
        <div className="space-y-4 rounded-xl border border-neutral-100 bg-white p-6 transition-all duration-300 hover:border-neutral-200 hover:shadow-sm">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 text-black">
                    <Settings2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Status & Lifecycle</h3>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Current Health Context</label>
                    <select
                        value={condition}
                        onChange={handleConditionChange}
                        className="w-full appearance-none rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:border-neutral-200 focus:border-black focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5"
                    >
                        <option value="New">Pristine (New)</option>
                        <option value="Recycled">Sustainable (Recycled)</option>
                    </select>
                </div>

                <div className={cn(
                    "flex items-center gap-2 rounded-lg py-3 px-4 text-xs font-bold transition-all duration-500",
                    condition === 'New'
                        ? "bg-black text-white shadow-lg shadow-black/10"
                        : "bg-neutral-100 text-neutral-500"
                )}>
                    {condition === 'New' ? (
                        <>
                            <Sparkles className="h-3.5 w-3.5" />
                            <span className="uppercase tracking-widest">Premium Grade Asset</span>
                        </>
                    ) : (
                        <>
                            <RefreshCcw className="h-3.5 w-3.5" />
                            <span className="uppercase tracking-widest">Circular Economy Tier</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
