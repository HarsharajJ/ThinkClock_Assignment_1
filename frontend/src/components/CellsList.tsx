'use client';

import React, { useState, useEffect } from 'react';
import Barcode from 'react-barcode';
import {
    Search,
    X,
    Trash2,
    ExternalLink,
    CheckCircle2,
    Clock,
    ChevronLeft,
    ChevronRight,
    SearchX,
    Database,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCells, getCellByBarcode, deleteCell, Cell } from '@/lib/api';

interface CellsListProps {
    onSelectCell: (cell: Cell) => void;
    onClose: () => void;
}

export default function CellsList({ onSelectCell, onClose }: CellsListProps) {
    const [cells, setCells] = useState<Cell[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<Cell | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const pageSize = 10;

    useEffect(() => {
        loadCells();
    }, [page]);

    const loadCells = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getCells(page, pageSize);
            setCells(response.cells);
            setTotal(response.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Uplink synchronization failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchError(null);
        setSearchResult(null);

        try {
            const cell = await getCellByBarcode(searchQuery.trim());
            setSearchResult(cell);
        } catch (err) {
            setSearchError(err instanceof Error ? err.message : 'Record not found in registry');
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResult(null);
        setSearchError(null);
    };

    const handleDelete = async (cellId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Confirm permanent deletion from registry?')) return;

        try {
            await deleteCell(cellId);
            loadCells();
            if (searchResult?.id === cellId) {
                clearSearch();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Deletion command failed');
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative flex h-full max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-neutral-100 bg-white shadow-2xl transition-all duration-300 sm:p-2"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                            <Database className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight">Cell Registry Explorer</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Database Index: {total} records</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-black"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="border-b border-neutral-50 bg-neutral-50/50 p-6">
                    <form onSubmit={handleSearch} className="relative flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Query by Cell ID (e.g., 6601377129)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-10 text-sm font-medium transition-all focus:border-black focus:outline-none focus:ring-4 focus:ring-black/5"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="btn-pro btn-pro-primary h-[42px] px-8"
                        >
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Query Database"}
                        </button>
                    </form>
                </div>

                {/* Content Area */}
                <div className="relative flex-1 overflow-y-auto overflow-x-hidden p-6">
                    {searchResult ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">Query Result Identified</h3>
                                <button onClick={clearSearch} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 px-2 py-1 rounded">Reset Filter</button>
                            </div>

                            <div
                                onClick={() => onSelectCell(searchResult)}
                                className="group cursor-pointer overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 p-6 transition-all hover:bg-white hover:shadow-xl hover:border-neutral-200"
                            >
                                <div className="flex flex-col gap-6 sm:flex-row">
                                    <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-inner">
                                        {searchResult.image_url ? (
                                            <img src={searchResult.image_url} alt="Cell" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-neutral-50">
                                                <Database className="h-8 w-8 text-neutral-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-2xl font-black tracking-tighter text-black">#{searchResult.cell_id_barcode}</span>
                                                <span className={cn(
                                                    "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                                                    searchResult.cell_condition === 'New' ? "bg-black text-white" : "bg-neutral-200 text-neutral-600"
                                                )}>
                                                    {searchResult.cell_id_barcode}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                                <div className="flex items-center gap-1.5 font-mono italic">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(searchResult.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Index Verified
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 pt-4">
                                            {searchResult.electrical_params && (
                                                <div className="space-y-1 rounded-lg bg-white px-3 py-2 border border-neutral-100">
                                                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-400">Voltage</p>
                                                    <p className="font-mono text-xs font-bold text-black">{searchResult.electrical_params.nominal_voltage}V</p>
                                                </div>
                                            )}
                                            {searchResult.electrical_params && (
                                                <div className="space-y-1 rounded-lg bg-white px-3 py-2 border border-neutral-100">
                                                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-400">Capacity</p>
                                                    <p className="font-mono text-xs font-bold text-black">{searchResult.electrical_params.nominal_charge_capacity}Ah</p>
                                                </div>
                                            )}
                                            {searchResult.eis_analyses && searchResult.eis_analyses.length > 0 && (
                                                <div className="space-y-1 rounded-lg bg-black px-3 py-2">
                                                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">SOH Index</p>
                                                    <p className="font-mono text-xs font-bold text-white">
                                                        {searchResult.eis_analyses[searchResult.eis_analyses.length - 1].soh_percentage?.toFixed(1)}%
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="mix-blend-multiply opacity-60 transition-opacity group-hover:opacity-100">
                                            <Barcode
                                                value={searchResult.cell_id_barcode}
                                                format="CODE128"
                                                width={1.2}
                                                height={40}
                                                displayValue={false}
                                                background="transparent"
                                                lineColor="#000000"
                                            />
                                        </div>
                                        <button className="btn-pro btn-pro-primary w-full shadow-lg">Load Registry</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : searchError ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center animate-fade-in">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                                <SearchX className="h-8 w-8" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-red-900 uppercase tracking-widest">Null Response</h4>
                                <p className="text-xs text-red-500">{searchError}</p>
                            </div>
                        </div>
                    ) : isLoading && cells.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-neutral-200" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300 italic">Syncing Index...</p>
                        </div>
                    ) : cells.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
                            <Database className="h-12 w-12 text-neutral-100" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Archive Empty</h4>
                                <p className="text-xs text-neutral-300">No telemetry recorded in the registry.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 pb-20">
                            {cells.map((cell) => (
                                <div
                                    key={cell.id}
                                    onClick={() => onSelectCell(cell)}
                                    className="group relative flex cursor-pointer items-center gap-4 rounded-xl border border-neutral-100 bg-white p-4 transition-all hover:bg-neutral-50 hover:shadow-md active:scale-[0.99]"
                                >
                                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100 transition-transform group-hover:scale-[1.05]">
                                        {cell.image_url ? (
                                            <img src={cell.image_url} alt="Cell" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Database className="h-5 w-5 text-neutral-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-black tracking-tight text-black italic">#{cell.cell_id_barcode}</span>
                                            <span className={cn(
                                                "rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest transition-colors",
                                                cell.cell_condition === 'New' ? "bg-black text-white" : "bg-neutral-100 text-neutral-400"
                                            )}>
                                                {cell.cell_condition}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                                            <span className="font-mono">{new Date(cell.created_at).toLocaleDateString()}</span>
                                            <div className="flex items-center gap-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-neutral-200" />
                                                <span>Registry Verified</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden opacity-30 transition-all group-hover:opacity-100 md:block">
                                        <Barcode
                                            value={cell.cell_id_barcode}
                                            format="CODE128"
                                            width={0.8}
                                            height={24}
                                            displayValue={false}
                                            background="transparent"
                                            lineColor="#000000"
                                        />
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(cell.id, e)}
                                        className="rounded-full p-2 text-neutral-200 transition-colors hover:bg-white hover:text-red-500 hover:shadow-sm"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!searchResult && totalPages > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-neutral-100 bg-white/80 p-4 backdrop-blur-md rounded-b-2xl">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="btn-pro btn-pro-secondary h-9 px-4 disabled:opacity-30"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span>Previous</span>
                        </button>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                            Page <span className="text-black font-black">{page}</span> / {totalPages}
                        </div>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="btn-pro btn-pro-secondary h-9 px-4 disabled:opacity-30"
                        >
                            <span>Next</span>
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {isLoading && cells.length > 0 && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                        <Loader2 className="h-8 w-8 animate-spin text-black" />
                    </div>
                )}
            </div>
        </div>
    );
}
