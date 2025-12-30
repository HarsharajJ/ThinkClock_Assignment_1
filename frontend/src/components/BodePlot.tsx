'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AreaChart, TrendingUp, Info, Activity, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBodePlotData, BodePlotData as BodePlotDataType } from '@/lib/api';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface BodePlotProps {
    shouldFetch?: boolean;
    onDataLoaded?: () => void;
}

export default function BodePlot({ shouldFetch = false, onDataLoaded }: BodePlotProps) {
    const [data, setData] = useState<BodePlotDataType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!shouldFetch) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getBodePlotData();
                setData(result);
                onDataLoaded?.();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Uplink failed: Telemetry stream corrupted');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [shouldFetch, onDataLoaded]);

    if (!shouldFetch && !data) {
        return (
            <div className="flex h-[420px] flex-col items-center justify-center space-y-4 rounded-xl border border-neutral-100 bg-neutral-50/30 text-center border-dashed">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <AreaChart className="h-6 w-6 text-neutral-200" />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Phase/Magnitude Acquisition Pending</p>
                    <p className="text-[10px] text-neutral-300">Awaiting spectral feed for frequency response mapping</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-[420px] flex-col items-center justify-center space-y-4 rounded-xl bg-white p-12 text-center animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-200" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300 italic">Synthesizing Plot Nodes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[420px] flex-col items-center justify-center space-y-4 rounded-xl border border-red-100 bg-red-50 p-12 text-center">
                <Info className="h-8 w-8 text-red-200" />
                <p className="text-xs font-bold uppercase tracking-wider text-red-900 leading-tight">Sync Failure: {error}</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-black ring-4 ring-black/5" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Magnitude |Z| (Ω)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full border-2 border-neutral-300 bg-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 font-medium">Phase (°)</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-neutral-400 animate-pulse" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-300">Live Telemetry Feed</span>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-neutral-100 bg-white p-4 shadow-inner shadow-neutral-50/50">
                <Plot
                    data={[
                        {
                            x: data.frequencies,
                            y: data.magnitude,
                            type: 'scatter',
                            mode: 'lines',
                            name: 'Magnitude',
                            line: { color: '#000000', width: 2.5, shape: 'spline' },
                            yaxis: 'y1',
                            hoverinfo: 'x+y',
                            fill: 'tozeroy',
                            fillcolor: 'rgba(0,0,0,0.02)'
                        },
                        {
                            x: data.frequencies,
                            y: data.phase,
                            type: 'scatter',
                            mode: 'lines',
                            name: 'Phase',
                            line: { color: '#a3a3a3', width: 1.5, dash: 'dot' },
                            yaxis: 'y2',
                            hoverinfo: 'x+y'
                        },
                    ]}
                    layout={{
                        autosize: true,
                        height: 360,
                        margin: { t: 10, r: 60, b: 50, l: 60 },
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                        font: {
                            color: '#000000',
                            family: 'Inter, system-ui, sans-serif',
                            size: 10
                        },
                        xaxis: {
                            title: {
                                text: 'FREQUENCY (HZ)',
                                font: { size: 9, color: '#a3a3a3', weight: 'bold' }
                            },
                            type: 'log',
                            gridcolor: '#f5f5f5',
                            linecolor: '#f5f5f5',
                            tickcolor: '#f5f5f5',
                            zerolinecolor: '#f5f5f5',
                            tickfont: { color: '#a3a3a3', weight: 'bold' }
                        },
                        yaxis: {
                            title: {
                                text: 'MAGNITUDE |Z| (Ω)',
                                font: { size: 9, color: '#000000', weight: 'bold' }
                            },
                            type: 'log',
                            gridcolor: '#f5f5f5',
                            linecolor: 'transparent',
                            tickcolor: 'transparent',
                            side: 'left',
                            tickfont: { color: '#000000', weight: 'bold' }
                        },
                        yaxis2: {
                            title: {
                                text: 'PHASE (°)',
                                font: { size: 9, color: '#a3a3a3', weight: 'bold' }
                            },
                            gridcolor: 'transparent',
                            linecolor: 'transparent',
                            tickcolor: 'transparent',
                            overlaying: 'y',
                            side: 'right',
                            tickfont: { color: '#a3a3a3', weight: 'bold' }
                        },
                        showlegend: false,
                        hovermode: 'x unified',
                    }}
                    config={{
                        responsive: true,
                        displayModeBar: false,
                    }}
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );
}

function Loader2(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
