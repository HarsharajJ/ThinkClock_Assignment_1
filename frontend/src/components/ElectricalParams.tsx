'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Check, Zap, Cpu, Activity, Gauge, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ElectricalParams as ElectricalParamsType } from '@/lib/api';

interface ElectricalParamsProps {
    params?: Partial<ElectricalParamsType>;
    onParamsChange?: (params: Partial<ElectricalParamsType>) => void;
}

const defaultParams: ElectricalParamsType = {
    nominal_voltage: 3.6,
    nominal_energy: 16.2,
    nominal_charge_capacity: 4.5,
    voltage_min: 2.5,
    voltage_max: 4.2,
    current_continuous: 8.61,
    current_peak: 17.5,
    power_continuous: 25.6,
    power_peak: 50.0,
    energy_density_gravimetric: 154,
    energy_density_volumetric: 375,
    power_density_gravimetric: 837,
    power_density_volumetric: 2.04,
};

const paramConfig = [
    {
        section: 'Voltage & Energy',
        icon: Zap,
        fields: [
            { key: 'nominal_voltage', label: 'Nominal Voltage', unit: 'V' },
            { key: 'nominal_energy', label: 'Nominal Energy', unit: 'Wh' },
            { key: 'nominal_charge_capacity', label: 'Charge Capacity', unit: 'Ah' },
            { key: 'voltage_min', label: 'Lower Limit', unit: 'V' },
            { key: 'voltage_max', label: 'Upper Limit', unit: 'V' },
        ]
    },
    {
        section: 'Current Control',
        icon: Activity,
        fields: [
            { key: 'current_continuous', label: 'Sustained Current', unit: 'A' },
            { key: 'current_peak', label: 'Peak Impulse', unit: 'A' },
        ]
    },
    {
        section: 'Power Dynamics',
        icon: TrendingUp,
        fields: [
            { key: 'power_continuous', label: 'Nominal Load', unit: 'W' },
            { key: 'power_peak', label: 'Max Surge', unit: 'W' },
        ]
    },
    {
        section: 'Density Metrics',
        icon: Gauge,
        fields: [
            { key: 'energy_density_gravimetric', label: 'Gravimetric Energy', unit: 'Wh/kg' },
            { key: 'energy_density_volumetric', label: 'Volumetric Energy', unit: 'Wh/l' },
            { key: 'power_density_gravimetric', label: 'Gravimetric Power', unit: 'W/kg' },
            { key: 'power_density_volumetric', label: 'Volumetric Power', unit: 'kW/l' },
        ]
    }
];

export default function ElectricalParams({ params, onParamsChange }: ElectricalParamsProps) {
    const [localParams, setLocalParams] = useState<ElectricalParamsType>({ ...defaultParams, ...params });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (params) {
            setLocalParams({ ...defaultParams, ...params });
        }
    }, [params]);

    const handleChange = (key: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        const newParams = { ...localParams, [key]: numValue };
        setLocalParams(newParams);
        onParamsChange?.(newParams);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white shadow-sm">
                        <Cpu className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Parameter Configuration</h3>
                </div>

                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={cn(
                        "btn-pro h-8 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        isEditing ? "btn-pro-primary" : "btn-pro-secondary"
                    )}
                >
                    {isEditing ? (
                        <>
                            <Check className="h-3 w-3" />
                            <span>Commit Changes</span>
                        </>
                    ) : (
                        <>
                            <Edit3 className="h-3 w-3" />
                            <span>Modify Specs</span>
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {paramConfig.map((section) => (
                    <div key={section.section} className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                            <section.icon className="h-3.5 w-3.5 text-neutral-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                                {section.section}
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {section.fields.map((field) => (
                                <div
                                    key={field.key}
                                    className="flex items-center justify-between rounded-lg border border-neutral-50 bg-neutral-50/30 p-3 transition-colors hover:bg-neutral-50"
                                >
                                    <span className="text-xs font-medium text-neutral-600">{field.label}</span>

                                    <div className="flex items-center gap-2">
                                        {isEditing ? (
                                            <div className="flex items-center overflow-hidden rounded-md border border-neutral-200 bg-white focus-within:border-black focus-within:ring-2 focus-within:ring-black/5">
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={localParams[field.key as keyof ElectricalParamsType] ?? ''}
                                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                                    className="w-20 px-2 py-1 text-right text-xs font-bold focus:outline-none"
                                                />
                                                <span className="bg-neutral-50 px-2 py-1 text-[10px] font-bold text-neutral-400 border-l border-neutral-100">
                                                    {field.unit}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-black">
                                                <span>{localParams[field.key as keyof ElectricalParamsType]}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-tighter text-neutral-400">
                                                    {field.unit}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
