'use client';

import React from 'react';
import { Activity } from 'lucide-react';

// Resistor component with proper zigzag symbol
const Resistor = ({ x, y, label, sublabel }: { x: number; y: number; label: string; sublabel: string }) => (
    <g transform={`translate(${x}, ${y})`}>
        <path
            d="M0 0 L5 0 L8 -8 L14 8 L20 -8 L26 8 L32 -8 L38 8 L41 0 L46 0"
            fill="none"
            stroke="#1f2937"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <text x="23" y="-16" textAnchor="middle" fill="#1f2937" fontSize="11" fontWeight="600" fontFamily="system-ui">{label}</text>
        <text x="23" y="-28" textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="system-ui">({sublabel})</text>
    </g>
);

// CPE (Constant Phase Element) - shown as tilted capacitor symbol
const CPE = ({ x, y, label, sublabel }: { x: number; y: number; label: string; sublabel: string }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* CPE plates - slightly tilted to indicate non-ideal behavior */}
        <line x1="18" y1="-12" x2="18" y2="12" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="28" y1="-10" x2="28" y2="10" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
        {/* Connection wires */}
        <line x1="0" y1="0" x2="18" y2="0" stroke="#1f2937" strokeWidth="2" />
        <line x1="28" y1="0" x2="46" y2="0" stroke="#1f2937" strokeWidth="2" />
        {/* Labels */}
        <text x="23" y="28" textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="600" fontFamily="system-ui">{label}</text>
        <text x="23" y="40" textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="system-ui">({sublabel})</text>
    </g>
);

// Warburg element - zigzag with a line (semi-infinite diffusion)
const Warburg = ({ x, y, label, sublabel }: { x: number; y: number; label: string; sublabel: string }) => (
    <g transform={`translate(${x}, ${y})`}>
        {/* Warburg symbol: zigzag followed by a straight line */}
        <path
            d="M0 0 L5 0 L8 -6 L14 6 L20 -6 L26 6 L29 0 L46 0"
            fill="none"
            stroke="#1f2937"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* Semi-infinite indicator line */}
        <line x1="46" y1="-8" x2="46" y2="8" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
        <text x="23" y="-16" textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="600" fontFamily="system-ui">{label}</text>
        <text x="23" y="-28" textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="system-ui">({sublabel})</text>
    </g>
);

export default function ECMDiagram() {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600">Equivalent Circuit Model</span>
                </div>
            </div>

            {/* Circuit notation */}
            <div className="text-xs text-gray-500 font-mono bg-gray-50 px-3 py-1.5 rounded-md inline-block">
                R0 - p(R1,CPE1) - p(R2,CPE2) - W1
            </div>

            {/* Circuit Diagram */}
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6">
                <svg viewBox="0 0 720 180" className="w-full h-auto">
                    {/* Main horizontal wire - input */}
                    <line x1="20" y1="90" x2="50" y2="90" stroke="#1f2937" strokeWidth="2" />

                    {/* R0 (Rb) - Bulk/Electrolyte Resistance */}
                    <Resistor x={50} y={90} label="Rb" sublabel="R0" />

                    {/* Wire from R0 to first parallel */}
                    <line x1="96" y1="90" x2="140" y2="90" stroke="#1f2937" strokeWidth="2" />

                    {/* First parallel junction - left vertical */}
                    <line x1="140" y1="45" x2="140" y2="135" stroke="#1f2937" strokeWidth="2" />

                    {/* R_SEI (R1) - top branch */}
                    <line x1="140" y1="45" x2="160" y2="45" stroke="#1f2937" strokeWidth="2" />
                    <Resistor x={160} y={45} label="R_SEI" sublabel="R1" />
                    <line x1="206" y1="45" x2="240" y2="45" stroke="#1f2937" strokeWidth="2" />

                    {/* CPE_SEI (CPE1) - bottom branch */}
                    <line x1="140" y1="135" x2="160" y2="135" stroke="#1f2937" strokeWidth="2" />
                    <CPE x={160} y={135} label="CPE_SEI" sublabel="CPE1" />
                    <line x1="206" y1="135" x2="240" y2="135" stroke="#1f2937" strokeWidth="2" />

                    {/* First parallel junction - right vertical */}
                    <line x1="240" y1="45" x2="240" y2="135" stroke="#1f2937" strokeWidth="2" />

                    {/* Wire between parallel sections */}
                    <line x1="240" y1="90" x2="300" y2="90" stroke="#1f2937" strokeWidth="2" />

                    {/* Second parallel junction - left vertical */}
                    <line x1="300" y1="45" x2="300" y2="135" stroke="#1f2937" strokeWidth="2" />

                    {/* R_CT (R2) - top branch */}
                    <line x1="300" y1="45" x2="320" y2="45" stroke="#1f2937" strokeWidth="2" />
                    <Resistor x={320} y={45} label="R_CT" sublabel="R2" />
                    <line x1="366" y1="45" x2="400" y2="45" stroke="#1f2937" strokeWidth="2" />

                    {/* CPE_DL (CPE2) - bottom branch */}
                    <line x1="300" y1="135" x2="320" y2="135" stroke="#1f2937" strokeWidth="2" />
                    <CPE x={320} y={135} label="CPE_DL" sublabel="CPE2" />
                    <line x1="366" y1="135" x2="400" y2="135" stroke="#1f2937" strokeWidth="2" />

                    {/* Second parallel junction - right vertical */}
                    <line x1="400" y1="45" x2="400" y2="135" stroke="#1f2937" strokeWidth="2" />

                    {/* Wire to Warburg */}
                    <line x1="400" y1="90" x2="450" y2="90" stroke="#1f2937" strokeWidth="2" />

                    {/* Warburg (W1) - Diffusion Element */}
                    <Warburg x={450} y={90} label="W_Warburg" sublabel="W1" />

                    {/* Wire to output */}
                    <line x1="496" y1="90" x2="540" y2="90" stroke="#1f2937" strokeWidth="2" />

                    {/* Terminal dots */}
                    <circle cx="20" cy="90" r="4" fill="#1f2937" />
                    <circle cx="540" cy="90" r="4" fill="#1f2937" />

                    {/* Terminal labels */}
                    <text x="20" y="115" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="system-ui">+</text>
                    <text x="540" y="115" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="system-ui">−</text>
                </svg>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <svg width="24" height="12" viewBox="0 0 24 12">
                        <path d="M0 6 L3 6 L5 2 L9 10 L13 2 L17 10 L19 6 L24 6" fill="none" stroke="#1f2937" strokeWidth="1.5" />
                    </svg>
                    <span className="text-gray-600 font-medium">Resistor</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <svg width="24" height="12" viewBox="0 0 24 16">
                        <line x1="0" y1="8" x2="8" y2="8" stroke="#1f2937" strokeWidth="1.5" />
                        <line x1="8" y1="2" x2="8" y2="14" stroke="#1f2937" strokeWidth="2" />
                        <line x1="14" y1="3" x2="14" y2="13" stroke="#1f2937" strokeWidth="2" />
                        <line x1="14" y1="8" x2="24" y2="8" stroke="#1f2937" strokeWidth="1.5" />
                    </svg>
                    <span className="text-gray-600 font-medium">CPE</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <svg width="24" height="12" viewBox="0 0 28 12">
                        <path d="M0 6 L3 6 L5 2 L9 10 L13 2 L15 6 L24 6" fill="none" stroke="#1f2937" strokeWidth="1.5" />
                        <line x1="24" y1="2" x2="24" y2="10" stroke="#1f2937" strokeWidth="1.5" />
                    </svg>
                    <span className="text-gray-600 font-medium">Warburg</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-500 font-mono text-[10px]">p(A,B)</span>
                    <span className="text-gray-600 font-medium">Parallel</span>
                </div>
            </div>
        </div>
    );
}
