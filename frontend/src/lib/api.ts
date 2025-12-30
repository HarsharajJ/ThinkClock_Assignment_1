// Remove trailing slash from API URL to prevent double slashes
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_BASE_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

// ============== EIS Types ==============

export interface BodePlotData {
  frequencies: number[];
  magnitude: number[];
  phase: number[];
}

export interface ECMParameter {
  name: string;
  value: number;
  unit: string;
  explanation: string;
  min_value: number;
  max_value: number;
}

export interface ECMFitResult {
  parameters: ECMParameter[];
  circuit_string: string;
}

export interface SoHResult {
  soh_percentage: number;
  rb_current: number;
  rb_max: number;
}

export interface EISUploadResponse {
  success: boolean;
  message: string;
  num_datapoints?: number;
}

// ============== Cell Types ==============

export interface ElectricalParams {
  id?: string;
  cell_id?: string;
  nominal_voltage: number;
  nominal_energy: number;
  nominal_charge_capacity: number;
  voltage_min: number;
  voltage_max: number;
  current_continuous: number;
  current_peak: number;
  power_continuous: number;
  power_peak: number;
  energy_density_gravimetric: number;
  energy_density_volumetric: number;
  power_density_gravimetric: number;
  power_density_volumetric: number;
}

export interface EISAnalysis {
  id: string;
  cell_id: string;
  frequencies?: number[];
  z_real?: number[];
  z_imag?: number[];
  bode_magnitude?: number[];
  bode_phase?: number[];
  ecm_parameters?: Record<string, ECMParameter>;
  circuit_string?: string;
  soh_percentage?: number;
  rb_current?: number;
  rb_max?: number;
  created_at: string;
}

export interface Cell {
  id: string;
  cell_id_barcode: string;
  image_url?: string;
  cell_condition: string;
  created_at: string;
  updated_at: string;
  electrical_params?: ElectricalParams;
  eis_analyses?: EISAnalysis[];
}

export interface CellListResponse {
  cells: Cell[];
  total: number;
  page: number;
  page_size: number;
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  image_url?: string;
}

// ============== EIS API Functions ==============

export async function uploadEISData(file: File): Promise<EISUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/eis/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload file');
  }

  return response.json();
}

export async function getBodePlotData(): Promise<BodePlotData> {
  const response = await fetch(`${API_BASE_URL}/api/eis/bode-plot`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get Bode plot data');
  }

  return response.json();
}

export async function getECMParameters(): Promise<ECMFitResult> {
  const response = await fetch(`${API_BASE_URL}/api/eis/ecm-params`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get ECM parameters');
  }

  return response.json();
}

export async function getSoH(rbMax: number = 0.1): Promise<SoHResult> {
  const response = await fetch(`${API_BASE_URL}/api/eis/soh?rb_max=${rbMax}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get SoH');
  }

  return response.json();
}

// ============== Cell API Functions ==============

export async function createCell(cellCondition: string = 'Recycled', electricalParams?: Partial<ElectricalParams>): Promise<Cell> {
  const response = await fetch(`${API_BASE_URL}/api/cells`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cell_condition: cellCondition,
      electrical_params: electricalParams,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create cell');
  }

  return response.json();
}

export async function getCells(page: number = 1, pageSize: number = 10): Promise<CellListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/cells?page=${page}&page_size=${pageSize}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get cells');
  }

  return response.json();
}

export async function getCell(cellId: string): Promise<Cell> {
  const response = await fetch(`${API_BASE_URL}/api/cells/${cellId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get cell');
  }

  return response.json();
}

export async function getCellByBarcode(barcode: string): Promise<Cell> {
  const response = await fetch(`${API_BASE_URL}/api/cells/barcode/${barcode}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get cell');
  }

  return response.json();
}

export async function updateCell(cellId: string, data: { cell_condition?: string; electrical_params?: Partial<ElectricalParams> }): Promise<Cell> {
  const response = await fetch(`${API_BASE_URL}/api/cells/${cellId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update cell');
  }

  return response.json();
}

export async function deleteCell(cellId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/cells/${cellId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete cell');
  }
}

export async function uploadCellImage(cellId: string, file: File): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/cells/${cellId}/image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload image');
  }

  return response.json();
}

export async function uploadCellEIS(cellId: string, file: File, rbMax: number = 0.1): Promise<{
  success: boolean;
  message: string;
  analysis_id: string;
  soh_percentage: number;
}> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/cells/${cellId}/eis?rb_max=${rbMax}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload EIS data');
  }

  return response.json();
}

export async function getLatestEISAnalysis(cellId: string): Promise<EISAnalysis> {
  const response = await fetch(`${API_BASE_URL}/api/cells/${cellId}/eis/latest`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get EIS analysis');
  }

  return response.json();
}
