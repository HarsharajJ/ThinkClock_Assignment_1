'use client';

import React from 'react';
import { Activity, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ECMDiagram() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-neutral-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Schematic Topology</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-neutral-50 px-2.5 py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">Active Bridge</span>
                </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-neutral-100 bg-white p-4">
                <svg viewBox="0 0 600 150" className="w-full h-auto mix-blend-multiply opacity-80 transition-opacity hover:opacity-100">
                    {/* Wire from start */}
                    <line x1="20" y1="75" x2="60" y2="75" stroke="#000000" strokeWidth="1.5" strokeDasharray="4 2" />

                    {/* Rb (R0) - Electrolyte resistance */}
                    <rect x="60" y="60" width="50" height="30" fill="none" stroke="#000000" strokeWidth="2" rx="1" />
                    <text x="85" y="80" textAnchor="middle" fill="#000000" fontSize="10" fontWeight="900" fontFamily="Inter, sans-serif">RB</text>

                    {/* Wire to first parallel */}
                    <line x1="110" y1="75" x2="150" y2="75" stroke="#000000" strokeWidth="1.5" />

                    {/* First parallel element (R_SEI || CPE_SEI) */}
                    <line x1="150" y1="40" x2="150" y2="110" stroke="#000000" strokeWidth="1.5" />
                    <line x1="150" y1="40" x2="170" y2="40" stroke="#000000" strokeWidth="1.5" />
                    <rect x="170" y="25" width="50" height="30" fill="none" stroke="#000000" strokeWidth="2" rx="1" />
                    <text x="195" y="45" textAnchor="middle" fill="#000000" fontSize="8" fontWeight="bold" fontFamily="Inter, sans-serif">R_SEI</text>
                    <line x1="220" y1="40" x2="240" y2="40" stroke="#000000" strokeWidth="1.5" />
                    <line x1="240" y1="40" x2="240" y2="110" stroke="#000000" strokeWidth="1.5" />

                    <line x1="150" y1="110" x2="170" y2="110" stroke="#000000" strokeWidth="1.5" />
                    <line x1="185" y1="95" x2="185" y2="125" stroke="#000000" strokeWidth="2" />
                    <line x1="205" y1="100" x2="205" y2="120" stroke="#000000" strokeWidth="2" />
                    <text x="195" y="138" textAnchor="middle" fill="#a3a3a3" fontSize="7" fontWeight="bold" fontFamily="Inter, sans-serif">CPE_SEI</text>
                    <line x1="220" y1="110" x2="240" y2="110" stroke="#000000" strokeWidth="1.5" />

                    {/* Wire to second parallel */}
                    <line x1="240" y1="75" x2="280" y2="75" stroke="#000000" strokeWidth="1.5" />

                    {/* Second parallel element (R_CT || CPE_DL) */}
                    <line x1="280" y1="40" x2="280" y2="110" stroke="#000000" strokeWidth="1.5" />
                    <line x1="280" y1="40" x2="300" y2="40" stroke="#000000" strokeWidth="1.5" />
                    <rect x="300" y="25" width="50" height="30" fill="none" stroke="#000000" strokeWidth="2" rx="1" />
                    <text x="325" y="45" textAnchor="middle" fill="#000000" fontSize="8" fontWeight="bold" fontFamily="Inter, sans-serif">R_CT</text>
                    <line x1="350" y1="40" x2="370" y2="40" stroke="#000000" strokeWidth="1.5" />
                    <line x1="370" y1="40" x2="370" y2="110" stroke="#000000" strokeWidth="1.5" />

                    <line x1="280" y1="110" x2="300" y2="110" stroke="#000000" strokeWidth="1.5" />
                    <line x1="315" y1="95" x2="315" y2="125" stroke="#000000" strokeWidth="2" />
                    <line x1="335" y1="100" x2="335" y2="120" stroke="#000000" strokeWidth="2" />
                    <text x="325" y="138" textAnchor="middle" fill="#a3a3a3" fontSize="7" fontWeight="bold" fontFamily="Inter, sans-serif">CPE_DL</text>
                    <line x1="350" y1="110" x2="370" y2="110" stroke="#000000" strokeWidth="1.5" />

                    {/* Wire to Warburg */}
                    <line x1="370" y1="75" x2="410" y2="75" stroke="#000000" strokeWidth="1.5" />

                    {/* Warburg element */}
                    <g transform="translate(410, 60)">
                        <path d="M0 15 L8 3 L16 27 L24 3 L32 27 L40 3 L48 15" fill="none" stroke="#000000" strokeWidth="1.5" />
                        <text x="24" y="42" textAnchor="middle" fill="#a3a3a3" fontSize="8" fontWeight="bold" fontFamily="Inter, sans-serif">WARBURG</text>
                    </g>

                    {/* Wire to end */}
                    <line x1="458" y1="75" x2="510" y2="75" stroke="#000000" strokeWidth="1.5" strokeDasharray="4 2" />

                    {/* Terminal dots */}
                    <circle cx="20" cy="75" r="3" fill="#000000" />
                    <circle cx="510" cy="75" r="3" fill="#000000" />
                </svg>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 rounded-lg border border-neutral-50 bg-neutral-50/50 p-2 text-[8px] font-bold uppercase tracking-widest text-neutral-400">
                    <div className="h-1.5 w-1.5 bg-black" />
                    <span>Resistive Nodes</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-neutral-50 bg-neutral-50/50 p-2 text-[8px] font-bold uppercase tracking-widest text-neutral-400">
                    <div className="flex h-1.5 w-1.5 gap-[1px]">
                        <div className="h-full w-[2px] bg-neutral-300" />
                        <div className="h-full w-[2px] bg-neutral-300" />
                    </div>
                    <span>Reactive Elements</span>
                </div>
            </div>
        </div>
    );
}
