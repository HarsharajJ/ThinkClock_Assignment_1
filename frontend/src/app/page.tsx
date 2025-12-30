"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, Suspense } from "react";
import Barcode from "react-barcode";
import ErrorBoundary from "@/components/ErrorBoundary";
import { TableSkeleton } from "@/components/LoadingSkeleton";

import {
  API_BASE_URL,
  Cell,
  EISAnalysis,
  createCell,
  getCell,
  getCells,
  getCellByBarcode,
  getLatestEISAnalysis,
  updateCell,
  uploadCellEIS,
  uploadCellImage,
} from "@/lib/api";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type AnalysisParameter = {
  parameter: string;
  value: number;
  explanation: string;
  min: number;
  max: number;
  unit?: string;
};

type AnalysisView = {
  bode: {
    freq_hz: number[];
    magnitude_ohm: number[];
    phase_deg: number[];
  };
  ecm: {
    parameters: AnalysisParameter[];
  };
  soh: {
    percent: number;
    formula: string;
    rb_max_assumed: number;
    rb_current: number;
  };
};

type TabType = "database" | "upload" | "eis";

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function BatteryIcon({ percent }: { percent: number }) {
  const fill = clamp01(percent / 100);
  const w = 42;
  const h = 20;
  const innerW = 34;
  const innerH = 12;
  const fillW = innerW * fill;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="State of health">
      <rect x="1" y="4" width="36" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="37" y="9" width="4" height="6" rx="1" fill="currentColor" />
      <rect x="3" y="6" width={fillW} height={innerH} rx="2" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

function EcmDiagram() {
  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-white p-4">
      <div className="text-sm font-semibold text-zinc-900">Equivalent Circuit Model</div>
      <div className="mt-2 text-xs text-zinc-600">R0 - p(R1,CPE1) - p(R2,CPE2) - W1</div>
      <svg className="mt-3 w-full" viewBox="0 0 760 120" role="img" aria-label="ECM schematic">
        <defs>
          <style>{`.w{stroke:#18181b;stroke-width:2;fill:none} .t{fill:#18181b;font:12px ui-sans-serif,system-ui}`}</style>
        </defs>
        <path className="w" d="M20 60 H80" />
        <path className="w" d="M80 60 l10 -12 l10 24 l10 -24 l10 24 l10 -24 l10 24 l10 -12" />
        <text className="t" x="115" y="25">Rb (R0)</text>
        <path className="w" d="M160 60 H210" />
        <path className="w" d="M210 60 H250" />
        <path className="w" d="M250 60 V30 H360 V60" />
        <path className="w" d="M250 60 V90 H360 V60" />
        <path className="w" d="M270 30 l10 -10 l10 20 l10 -20 l10 20 l10 -20 l10 20 l10 -10" />
        <text className="t" x="285" y="18">R_SEI (R1)</text>
        <path className="w" d="M300 80 v-10" />
        <path className="w" d="M320 70 v20" />
        <path className="w" d="M290 70 h40" />
        <text className="t" x="285" y="112">CPE_SEI (CPE1)</text>
        <path className="w" d="M360 60 H410" />
        <path className="w" d="M410 60 H450" />
        <path className="w" d="M450 60 V30 H560 V60" />
        <path className="w" d="M450 60 V90 H560 V60" />
        <path className="w" d="M470 30 l10 -10 l10 20 l10 -20 l10 20 l10 -20 l10 20 l10 -10" />
        <text className="t" x="485" y="18">R_CT (R2)</text>
        <path className="w" d="M500 80 v-10" />
        <path className="w" d="M520 70 v20" />
        <path className="w" d="M490 70 h40" />
        <text className="t" x="490" y="112">CPE_DL (CPE2)</text>
        <path className="w" d="M560 60 H610" />
        <path className="w" d="M610 60 h20 l8 -10 l8 20 l8 -20 l8 20 l8 -20 l8 20 l8 -10 h20" />
        <text className="t" x="630" y="25">W_Warburg (W1)</text>
        <path className="w" d="M740 60 H750" />
      </svg>
    </div>
  );
}

function ValueBar({ value, min, max }: { value: number; min: number; max: number }) {
  const denom = max - min;
  const pct = denom > 0 ? clamp01((value - min) / denom) : 0;
  return (
    <div className="w-full">
      <div className="h-2 w-full rounded bg-zinc-100">
        <div className="h-2 rounded bg-zinc-900" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
        <span>{min.toFixed(3)}</span>
        <span>{max.toFixed(3)}</span>
      </div>
    </div>
  );
}

function mapAnalysis(data: EISAnalysis, rbMax: number): AnalysisView {
  const freq = data.frequencies ?? [];
  const mag = data.bode_magnitude ?? [];
  const phase = data.bode_phase ?? [];

  const parameters: AnalysisParameter[] = Object.values(data.ecm_parameters ?? {}).map((p) => ({
    parameter: p.name || "Parameter",
    value: p.value ?? 0,
    explanation: p.explanation || "",
    min: p.min_value ?? 0,
    max: p.max_value ?? 0,
    unit: p.unit,
  }));

  return {
    bode: { freq_hz: freq, magnitude_ohm: mag, phase_deg: phase },
    ecm: { parameters: parameters.sort((a, b) => a.parameter.localeCompare(b.parameter)) },
    soh: {
      percent: data.soh_percentage ?? 0,
      formula: "SoH = (1 - Rb_current / Rb_max) * 100",
      rb_max_assumed: rbMax,
      rb_current: data.rb_current ?? 0,
    },
  };
}

export default function Home() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("database");
  
  // Cell state
  const [cell, setCell] = useState<Cell | null>(null);
  const [cellError, setCellError] = useState<string | null>(null);
  const [showCellDetail, setShowCellDetail] = useState(false);

  // Search state
  const [searchBarcode, setSearchBarcode] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Cells list state
  const [cellsList, setCellsList] = useState<Cell[]>([]);
  const [totalCells, setTotalCells] = useState(0);
  const [isLoadingCells, setIsLoadingCells] = useState(false);
  const [cellsListError, setCellsListError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Meta/Upload state
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [metaMessage, setMetaMessage] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageStatus, setImageStatus] = useState<string | null>(null);
  const [cellCondition, setCellCondition] = useState<string>("Recycled");
  const [electrical, setElectrical] = useState<Record<string, string>>({});
  // Meta information state
  const [metaInfo, setMetaInfo] = useState({
    manufacturer: "Molicel",
    model: "INR21700-P45B",
    cell_type: "Li-ion",
    form_factor: "Cylindrical 21700",
    mass: "70",
    height: "70.15",
    diameter: "21.55",
    volume: "25.59"
  });

  // EIS state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisView | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rbMax, setRbMax] = useState(0.1);

  const syncElectricalFromCell = (c: Cell) => {
    if (!c.electrical_params) return;
    const params = c.electrical_params;
    setElectrical({
      nominal_voltage: String(params.nominal_voltage ?? ""),
      nominal_energy: String(params.nominal_energy ?? ""),
      nominal_charge_capacity: String(params.nominal_charge_capacity ?? ""),
      voltage_min: String(params.voltage_min ?? ""),
      voltage_max: String(params.voltage_max ?? ""),
      current_continuous: String(params.current_continuous ?? ""),
      current_peak: String(params.current_peak ?? ""),
      power_continuous: String(params.power_continuous ?? ""),
      power_peak: String(params.power_peak ?? ""),
      energy_density_gravimetric: String(params.energy_density_gravimetric ?? ""),
      energy_density_volumetric: String(params.energy_density_volumetric ?? ""),
      power_density_gravimetric: String(params.power_density_gravimetric ?? ""),
      power_density_volumetric: String(params.power_density_volumetric ?? ""),
    });
  };

  useEffect(() => {
    loadCellsList(1);
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const barcodeSrc = useMemo(() => {
    if (!cell?.cell_id_barcode) return null;
    return cell.cell_id_barcode;
  }, [cell?.cell_id_barcode]);

  const bodePlotData = useMemo(() => {
    if (!analysis) return null;
    const x = analysis.bode.freq_hz;
    return [
      { x, y: analysis.bode.magnitude_ohm, type: "scatter" as const, mode: "lines" as const, name: "|Z| (Ohm)", xaxis: "x", yaxis: "y" },
      { x, y: analysis.bode.phase_deg, type: "scatter" as const, mode: "lines" as const, name: "Phase (deg)", xaxis: "x2", yaxis: "y2" },
    ];
  }, [analysis]);

  async function loadCellsList(page: number = 1) {
    console.log('[UI] loadCellsList called with page:', page);
    setIsLoadingCells(true);
    setCellsListError(null);
    try {
      console.log('[UI] Calling getCells...');
      const result = await getCells(page, pageSize);
      console.log('[UI] getCells result:', result);
      setCellsList(result.cells || []);
      setTotalCells(result.total || 0);
      setCurrentPage(page);
    } catch (e) {
      console.error('[UI] getCells error:', e);
      const errorMsg = e instanceof Error ? e.message : "Failed to load cells";
      setCellsListError(errorMsg);
    } finally {
      setIsLoadingCells(false);
    }
  }

  function selectCellFromList(selectedCell: Cell) {
    setCell(selectedCell);
    setCellCondition(selectedCell.cell_condition);
    syncElectricalFromCell(selectedCell);
    setAnalysis(null);
    setCsvFile(null);
    setImageFile(null);
    setImagePreviewUrl(null);
    setMetaMessage(null);
    setMetaError(null);
    setImageStatus(null);
    setShowCellDetail(true);
  }

  async function handleSearch() {
    if (!searchBarcode.trim()) {
      setSearchError("Please enter a barcode to search.");
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    try {
      const found = await getCellByBarcode(searchBarcode.trim());
      setCell(found);
      setCellCondition(found.cell_condition);
      syncElectricalFromCell(found);
      setSearchBarcode("");
      setShowCellDetail(true);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Cell not found");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleNewCell() {
    setCellError(null);
    setMetaMessage(null);
    setMetaError(null);
    setImageStatus(null);
    setAnalysis(null);
    setCsvFile(null);
    setImageFile(null);
    setImagePreviewUrl(null);
    setElectrical({});
    setCellCondition("New");
    try {
      const created = await createCell();
      setCell(created);
      setCellCondition(created.cell_condition);
      syncElectricalFromCell(created);
      setActiveTab("upload");
      await loadCellsList(1);
    } catch (e) {
      setCellError(e instanceof Error ? e.message : "Failed to create cell");
    }
  }

  async function handleUploadImage() {
    if (!cell) {
      setImageStatus("Create a cell first.");
      return;
    }
    if (!imageFile) {
      setImageStatus("Select an image file to upload.");
      return;
    }
    setIsUploadingImage(true);
    setImageStatus(null);
    try {
      await uploadCellImage(cell.id, imageFile);
      const refreshed = await getCell(cell.id);
      setCell(refreshed);
      setImageStatus("Image uploaded successfully!");
      await loadCellsList(currentPage);
    } catch (e) {
      setImageStatus(e instanceof Error ? e.message : "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSaveMeta() {
    if (!cell) return;
    setIsSavingMeta(true);
    setMetaMessage(null);
    setMetaError(null);
    try {
      const parsed: Record<string, number> = {};
      for (const [key, value] of Object.entries(electrical)) {
        const num = Number(value);
        if (Number.isNaN(num)) throw new Error(`Invalid number for ${key}`);
        parsed[key] = num;
      }
      
      const updated = await updateCell(cell.id, { cell_condition: cellCondition, electrical_params: parsed });
      setCell(updated);
      syncElectricalFromCell(updated);
      setMetaMessage("Cell metadata saved successfully!");
      await loadCellsList(currentPage);
    } catch (e) {
      setMetaError(e instanceof Error ? e.message : "Failed to save metadata");
    } finally {
      setIsSavingMeta(false);
    }
  }

  async function runAnalyze() {
    if (!csvFile) {
      setAnalyzeError("Please upload a CSV data file first.");
      return;
    }
    if (!cell) {
      setAnalyzeError("Please select or create a cell first.");
      return;
    }
    setAnalyzeError(null);
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      await uploadCellEIS(cell.id, csvFile, rbMax);
      const latest = await getLatestEISAnalysis(cell.id);
      setAnalysis(mapAnalysis(latest, rbMax));
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const tabs = [
    { id: "database" as const, label: "Cell Database", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    )},
    { id: "upload" as const, label: "Upload / Edit Cell", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    )},
    { id: "eis" as const, label: "EIS Analysis", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
  ];

  return (
    <ErrorBoundary>
    <div className="min-h-screen animated-bg grid-pattern relative overflow-hidden">
      {/* Floating Background Orbs */}
      <div className="floating-orb orb-1" />
      <div className="floating-orb orb-2" />
      <div className="floating-orb orb-3" />
      
      {/* Header */}
      <header className="glass-header sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Battery Labs</h1>
                <p className="text-xs text-slate-500">Cell Characterization Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full backdrop-blur-sm">API: {API_BASE_URL}</span>
              <span className="inline-flex items-center gap-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200/50">
                <span className="relative">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full block"></span>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full absolute top-0 left-0 pulse-ring"></span>
                </span>
                Connected
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Cells</div>
                <div className="text-2xl font-bold text-slate-900">{totalCells}</div>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Selected Cell</div>
                <div className="text-sm font-mono text-violet-600 truncate max-w-[120px]">{cell?.cell_id_barcode || "None"}</div>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${
                cell?.cell_condition === "Good" ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30" :
                cell?.cell_condition === "Bad" ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30" :
                cell?.cell_condition === "New" ? "bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/30" :
                "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30"
              }`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Condition</div>
                {cell ? (
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold mt-1 ${
                    cell.cell_condition === "Good" ? "bg-emerald-100 text-emerald-700" :
                    cell.cell_condition === "Bad" ? "bg-red-100 text-red-700" :
                    cell.cell_condition === "New" ? "bg-blue-100 text-blue-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{cell.cell_condition}</span>
                ) : (
                  <span className="text-slate-400 text-sm">-</span>
                )}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${
                analysis ? "bg-gradient-to-br from-teal-500 to-cyan-600 shadow-teal-500/30" : "bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-400/30"
              }`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Analysis</div>
                {analysis ? (
                  <span className="text-teal-600 font-bold text-lg">SoH: {analysis.soh.percent.toFixed(1)}%</span>
                ) : (
                  <span className="text-slate-400 text-sm">No data</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card rounded-2xl shadow-xl mb-6 overflow-hidden">
          <div className="border-b border-slate-200/50 px-4 bg-gradient-to-r from-slate-50/50 to-white/50">
            <nav className="flex gap-1 -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600 bg-blue-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 bg-white/50">
            {/* DATABASE TAB */}
            {activeTab === "database" && (
              <div className="space-y-6">
                {/* Search & New Cell Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative flex-1">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={searchBarcode}
                        onChange={(e) => setSearchBarcode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search by Cell ID or Barcode..."
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-400 transition-all shadow-md hover:shadow-lg btn-shine"
                    >
                      {isSearching ? "..." : "Search"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleNewCell}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 btn-shine"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Cell
                  </button>
                </div>

                {searchError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {searchError}
                  </div>
                )}
                
                {cellError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {cellError}
                  </div>
                )}

                {/* Cells Table */}
                <div className="border border-slate-200/70 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/70">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">All Cells</span>
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{totalCells}</span>
                    </div>
                    <button
                      onClick={() => loadCellsList(currentPage)}
                      disabled={isLoadingCells}
                      className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <svg className={`w-4 h-4 ${isLoadingCells ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {isLoadingCells ? "Loading..." : "Refresh"}
                    </button>
                  </div>

                  {cellsListError ? (
                    <div className="p-6 text-center">
                      <div className="text-red-600 text-sm">{cellsListError}</div>
                      <button onClick={() => loadCellsList(1)} className="mt-2 text-xs text-blue-600 underline">Try again</button>
                    </div>
                  ) : isLoadingCells && cellsList.length === 0 ? (
                    <table className="w-full">
                      <tbody>
                        <TableSkeleton rows={5} />
                      </tbody>
                    </table>
                  ) : cellsList.length === 0 ? (
                    <div className="p-8 text-center">
                      <svg className="w-12 h-12 mx-auto text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="mt-3 text-sm font-medium text-zinc-600">No cells in database</p>
                      <p className="mt-1 text-xs text-zinc-400">Click New Cell to create your first cell</p>
                    </div>
                  ) : (
                    <>
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium text-zinc-600 text-xs uppercase tracking-wide">Cell Barcode</th>
                            <th className="text-left py-3 px-4 font-medium text-zinc-600 text-xs uppercase tracking-wide">Condition</th>
                            <th className="text-left py-3 px-4 font-medium text-zinc-600 text-xs uppercase tracking-wide">Image</th>
                            <th className="text-left py-3 px-4 font-medium text-zinc-600 text-xs uppercase tracking-wide">Created</th>
                            <th className="text-right py-3 px-4 font-medium text-zinc-600 text-xs uppercase tracking-wide">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {cellsList.map((c) => (
                            <tr
                              key={c.id}
                              className={`table-row-hover cursor-pointer ${cell?.id === c.id ? "bg-blue-50 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"}`}
                              onClick={() => selectCellFromList(c)}
                            >
                              <td className="py-3.5 px-4">
                                <span className="font-mono text-xs bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">{c.cell_id_barcode}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                  c.cell_condition === "Good" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                                  c.cell_condition === "Bad" ? "bg-red-100 text-red-700 border border-red-200" :
                                  c.cell_condition === "New" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                                  "bg-amber-100 text-amber-700 border border-amber-200"
                                }`}>{c.cell_condition}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                {c.image_url ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Uploaded
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">None</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 text-xs">
                                {new Date(c.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={(e) => { e.stopPropagation(); selectCellFromList(c); }}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all hover:shadow-md"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {totalCells > pageSize && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 bg-zinc-50/50">
                          <div className="text-xs text-zinc-500">
                            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{Math.ceil(totalCells / pageSize)}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => loadCellsList(currentPage - 1)}
                              disabled={currentPage <= 1 || isLoadingCells}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => loadCellsList(currentPage + 1)}
                              disabled={currentPage >= Math.ceil(totalCells / pageSize) || isLoadingCells}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* UPLOAD TAB */}
            {activeTab === "upload" && (
              <div className="space-y-6">
                {!cell ? (
                  <div className="text-center py-12 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-300">
                    <svg className="w-12 h-12 mx-auto text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="mt-4 text-sm font-medium text-zinc-600">No cell selected</p>
                    <p className="mt-1 text-xs text-zinc-400">Create a new cell or select one from the Database tab</p>
                    <button
                      onClick={handleNewCell}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create New Cell
                    </button>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Cell Identity */}
                    <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5">
                      <h3 className="text-sm font-semibold text-zinc-900 mb-4">Cell Identity</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Cell ID</div>
                          <div className="mt-1 font-mono text-lg font-semibold text-zinc-900">{cell.cell_id_barcode}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Barcode</div>
                          {barcodeSrc && (
                            <div className="bg-white p-2 rounded-lg inline-block">
                              <Barcode value={barcodeSrc} format="CODE128" displayValue={false} height={50} background="transparent" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cell Image Upload */}
                    <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5">
                      <h3 className="text-sm font-semibold text-zinc-900 mb-4">Cell Image</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            className="flex-1 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-zinc-800 file:cursor-pointer"
                          />
                          <button
                            onClick={handleUploadImage}
                            disabled={isUploadingImage || !imageFile}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isUploadingImage ? "Uploading..." : "Upload"}
                          </button>
                        </div>
                        <div className="flex gap-4">
                          <div className="h-24 w-32 overflow-hidden rounded-lg border border-zinc-200 bg-white flex-shrink-0">
                            {imagePreviewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                            ) : cell.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cell.image_url} alt="Cell" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">No image</div>
                            )}
                          </div>
                          {imageStatus && (
                            <div className={`text-xs ${imageStatus.includes("success") ? "text-green-600" : "text-zinc-600"}`}>{imageStatus}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Meta Information */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-5">
                      <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        Meta Information
                      </h3>
                      
                      {/* Cell Condition and Physical Info */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cell Condition</label>
                          <select
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            value={cellCondition}
                            onChange={(e) => setCellCondition(e.target.value)}
                          >
                            <option value="New">New</option>
                            <option value="Recycled">Recycled</option>
                            <option value="Good">Good</option>
                            <option value="Bad">Bad</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Manufacturer</label>
                          <input
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            value={metaInfo.manufacturer}
                            onChange={(e) => setMetaInfo(prev => ({ ...prev, manufacturer: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Model</label>
                          <input
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            value={metaInfo.model}
                            onChange={(e) => setMetaInfo(prev => ({ ...prev, model: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Type</label>
                          <input
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            value={metaInfo.cell_type}
                            onChange={(e) => setMetaInfo(prev => ({ ...prev, cell_type: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      {/* Physical Properties */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Form Factor</label>
                          <input
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            value={metaInfo.form_factor}
                            onChange={(e) => setMetaInfo(prev => ({ ...prev, form_factor: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mass (g)</label>
                          <input
                            type="number"
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            value={metaInfo.mass}
                            onChange={(e) => setMetaInfo(prev => ({ ...prev, mass: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Height (mm)</label>
                          <input
                            type="number"
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            value={metaInfo.height}
                            onChange={(e) => setMetaInfo(prev => ({ ...prev, height: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Diameter (mm)</label>
                          <input
                            type="number"
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            value={metaInfo.diameter}
                            onChange={(e) => setMetaInfo(prev => ({ ...prev, diameter: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Volume (cm³)</label>
                          <input
                            type="number"
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            value={metaInfo.volume}
                            onChange={(e) => setMetaInfo(prev => ({ ...prev, volume: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Electrical Parameters */}
                      <div>
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-cyan-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          Electrical Parameters
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {Object.entries(electrical).map(([k, v]) => (
                            <div key={k} className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                              <label className="block text-[10px] text-slate-500 uppercase tracking-wide">{k.replace(/_/g, " ")}</label>
                              <input
                                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                                value={v}
                                onChange={(e) => setElectrical((prev) => ({ ...prev, [k]: e.target.value }))}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-5 flex items-center gap-3">
                          <button
                            onClick={handleSaveMeta}
                            disabled={isSavingMeta}
                            className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:from-slate-900 hover:to-black disabled:opacity-60 shadow-lg transition-all"
                          >
                            {isSavingMeta ? "Saving..." : "Save All Metadata"}
                          </button>
                          {metaMessage && <span className="text-xs text-emerald-600 font-medium">{metaMessage}</span>}
                          {metaError && <span className="text-xs text-red-600 font-medium">{metaError}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EIS TAB */}
            {activeTab === "eis" && (
              <div className="space-y-6">
                {!cell ? (
                  <div className="text-center py-12 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-300">
                    <svg className="w-12 h-12 mx-auto text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="mt-4 text-sm font-medium text-zinc-600">No cell selected</p>
                    <p className="mt-1 text-xs text-zinc-400">Select a cell from the Database tab to run EIS analysis</p>
                    <button
                      onClick={() => setActiveTab("database")}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Go to Database
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Current Cell Info */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div>
                        <div className="text-xs text-blue-600 font-medium">Selected Cell</div>
                        <div className="text-sm font-mono font-semibold text-blue-900">{cell.cell_id_barcode}</div>
                      </div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        cell.cell_condition === "Good" ? "bg-green-100 text-green-700" :
                        cell.cell_condition === "Bad" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{cell.cell_condition}</span>
                    </div>

                    {/* CSV Upload */}
                    <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5">
                      <h3 className="text-sm font-semibold text-zinc-900 mb-2">EIS Data Upload</h3>
                      <p className="text-xs text-zinc-500 mb-4">Upload a CSV file with impedance data (freq, real, imag columns)</p>
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                          className="flex-1 text-sm text-zinc-700 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 file:cursor-pointer"
                        />
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-zinc-500">Rb(max):</label>
                          <input
                            type="number"
                            value={rbMax}
                            step="0.01"
                            min="0.01"
                            onChange={(e) => setRbMax(Number(e.target.value))}
                            className="w-20 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <button
                          onClick={runAnalyze}
                          disabled={isAnalyzing || !csvFile}
                          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isAnalyzing ? "Analyzing..." : "Analyze"}
                        </button>
                      </div>
                      {analyzeError && (
                        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{analyzeError}</div>
                      )}
                    </div>

                    {/* Analysis Results */}
                    {analysis && (
                      <div className="space-y-6">
                        {/* SoH & Bode Plot Row */}
                        <div className="grid lg:grid-cols-2 gap-6">
                          {/* State of Health */}
                          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                            <h3 className="text-sm font-semibold text-zinc-900 mb-1">State of Health (SoH)</h3>
                            <p className="text-xs text-zinc-500 mb-4">{analysis.soh.formula}</p>
                            <div className="flex items-center gap-4">
                              <div className="text-zinc-900">
                                <BatteryIcon percent={analysis.soh.percent} />
                              </div>
                              <div>
                                <div className="text-3xl font-bold text-zinc-900">{analysis.soh.percent.toFixed(1)}%</div>
                                <div className="text-xs text-zinc-500">Rb(max): {analysis.soh.rb_max_assumed} | Rb(current): {analysis.soh.rb_current.toPrecision(4)}</div>
                              </div>
                            </div>
                          </div>

                          {/* Bode Plot */}
                          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                            <h3 className="text-sm font-semibold text-zinc-900 mb-1">Bode Plot</h3>
                            <p className="text-xs text-zinc-500 mb-4">Magnitude and Phase vs Frequency</p>
                            {bodePlotData && (
                              <Plot
                                className="w-full"
                                data={bodePlotData as any}
                                layout={{
                                  margin: { l: 50, r: 20, t: 10, b: 45 },
                                  height: 280,
                                  grid: { rows: 2, columns: 1, pattern: "independent" },
                                  xaxis: { type: "log", title: "Frequency (Hz)" },
                                  yaxis: { title: "|Z| (Ohm)" },
                                  xaxis2: { type: "log", title: "Frequency (Hz)" },
                                  yaxis2: { title: "Phase (deg)" },
                                  legend: { orientation: "h" },
                                }}
                                config={{ responsive: true, displaylogo: false }}
                              />
                            )}
                          </div>
                        </div>

                        {/* ECM Diagram */}
                        <EcmDiagram />

                        {/* Parameters Table */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                          <h3 className="text-sm font-semibold text-zinc-900 mb-1">Predicted Circuit Parameters</h3>
                          <p className="text-xs text-zinc-500 mb-4">
                            Rb(current): {analysis.soh.rb_current.toPrecision(4)} Ohm - Rb(max): {analysis.soh.rb_max_assumed}
                          </p>
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-2">
                              <thead>
                                <tr className="text-left text-xs text-zinc-500">
                                  <th className="px-3 py-2">Parameter</th>
                                  <th className="px-3 py-2">Value</th>
                                  <th className="px-3 py-2">Explanation</th>
                                  <th className="px-3 py-2">Visual</th>
                                </tr>
                              </thead>
                              <tbody>
                                {analysis.ecm.parameters.map((p) => (
                                  <tr key={p.parameter} className="rounded-lg bg-zinc-50">
                                    <td className="px-3 py-2 font-mono text-sm text-zinc-900">{p.parameter}</td>
                                    <td className="px-3 py-2 text-sm text-zinc-900">{p.value.toPrecision(5)} {p.unit ?? ""}</td>
                                    <td className="px-3 py-2 text-sm text-zinc-600">{p.explanation}</td>
                                    <td className="px-3 py-2">
                                      <ValueBar value={p.value} min={p.min} max={p.max} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cell Detail Modal/Sidebar */}
      {showCellDetail && cell && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCellDetail(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in">
            <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Cell Details</h2>
                  <p className="text-xs text-slate-400">View and manage cell information</p>
                </div>
              </div>
              <button onClick={() => setShowCellDetail(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Cell ID & Barcode */}
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/30">
                <div className="text-xs font-medium text-blue-100 uppercase tracking-wider">Cell ID</div>
                <div className="mt-2 text-2xl font-mono font-bold">{cell.cell_id_barcode}</div>
                {barcodeSrc && (
                  <div className="mt-5 bg-white p-4 rounded-xl inline-block shadow-lg">
                    <Barcode value={barcodeSrc} format="CODE128" displayValue={false} height={50} background="transparent" />
                  </div>
                )}
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      cell.cell_condition === "Good" ? "bg-emerald-100" :
                      cell.cell_condition === "Bad" ? "bg-red-100" :
                      cell.cell_condition === "New" ? "bg-blue-100" :
                      "bg-amber-100"
                    }`}>
                      <svg className={`w-4 h-4 ${
                        cell.cell_condition === "Good" ? "text-emerald-600" :
                        cell.cell_condition === "Bad" ? "text-red-600" :
                        cell.cell_condition === "New" ? "text-blue-600" :
                        "text-amber-600"
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-slate-500 uppercase">Condition</div>
                      <span className={`text-sm font-semibold ${
                        cell.cell_condition === "Good" ? "text-emerald-700" :
                        cell.cell_condition === "Bad" ? "text-red-700" :
                        cell.cell_condition === "New" ? "text-blue-700" :
                        "text-amber-700"
                      }`}>{cell.cell_condition}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-slate-500 uppercase">Created</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {new Date(cell.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cell Image */}
              {cell.image_url && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Cell Image</span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cell.image_url} alt="Cell" className="w-full h-48 object-cover" />
                  </div>
                </div>
              )}

              {/* Electrical Parameters */}
              {cell.electrical_params && Object.keys(cell.electrical_params).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Electrical Parameters</span>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 divide-y divide-slate-200/70 overflow-hidden">
                    {Object.entries(cell.electrical_params).map(([key, value]) => (
                      <div key={key} className="px-4 py-3 flex justify-between items-center hover:bg-white/50 transition-colors">
                        <span className="text-xs text-slate-600 capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="text-sm font-semibold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => { setShowCellDetail(false); setActiveTab("upload"); }}
                  className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Edit Cell
                </button>
                <button
                  onClick={() => { setShowCellDetail(false); setActiveTab("eis"); }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30"
                >
                  Run EIS Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-slate-200/50 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-700">Battery Labs</span>
            </div>
            <div className="text-xs text-slate-500">
              Battery Cell Characterization System v1.0 | Powered by 404FoundDevelopers
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">© 2024 ThinkClock Labs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
