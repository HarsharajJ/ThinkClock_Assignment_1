import numpy as np
import pandas as pd
from impedance import preprocessing
from impedance.models.circuits import CustomCircuit
from typing import Tuple, Dict, Any
import io


class ImpedanceService:
    """Service for processing EIS data using impedancepy library."""
    
    # Randles circuit with Warburg element for battery impedance
    # R_b - R_SEI/CPE_SEI - R_CT/CPE_DL - Wo (open Warburg)
    CIRCUIT_STRING = "R0-p(R1,CPE1)-p(R2,CPE2)-Wo0"
    
    # Initial guess for circuit parameters (8 total: R0, R1, CPE1_0, CPE1_1, R2, CPE2_0, CPE2_1, Wo0_0, Wo0_1)
    # Wo (open Warburg) has 2 parameters: Wo0_0 (Warburg coefficient) and Wo0_1 (time constant)
    INITIAL_GUESS = [0.01, 0.02, 0.01, 0.8, 0.05, 0.01, 0.8, 100, 100]
    
    # Parameter bounds (min, max) for each parameter
    PARAM_BOUNDS = {
        'R0': (0.001, 0.5),      # Rb - Electrolyte resistance
        'R1': (0.001, 0.5),      # R_SEI
        'CPE1_0': (1e-6, 0.1),   # CPE_SEI capacitance
        'CPE1_1': (0.5, 1.0),    # CPE_SEI exponent
        'R2': (0.001, 0.5),      # R_CT
        'CPE2_0': (1e-6, 0.1),   # CPE_DL capacitance
        'CPE2_1': (0.5, 1.0),    # CPE_DL exponent
        'Wo0_0': (1, 1000),      # Warburg coefficient
        'Wo0_1': (1, 1000),      # Warburg time constant
    }
    
    # Parameter explanations
    PARAM_EXPLANATIONS = {
        'R0': 'Electrolyte resistance',
        'R1': 'Resistance due to SEI layer',
        'CPE1_0': 'Capacitance due to SEI layer',
        'CPE1_1': 'SEI CPE exponent',
        'R2': 'Charge-transfer resistance that models the voltage drop over the electrode-electrolyte interface due to a load',
        'CPE2_0': 'Double-layer capacitance that models the effect of charges building up in the electrolyte at the electrode surface',
        'CPE2_1': 'Double-layer CPE exponent',
        'Wo0_0': 'Frequency-dependent Warburg impedance models diffusion of lithium ions in the electrodes',
        'Wo0_1': 'Warburg time constant',
    }
    
    # Friendly names for display
    PARAM_DISPLAY_NAMES = {
        'R0': 'Rb',
        'R1': 'R_SEI',
        'CPE1_0': 'CPE_SEI',
        'CPE1_1': 'CPE_SEI_n',
        'R2': 'R_CT',
        'CPE2_0': 'CPE_DL',
        'CPE2_1': 'CPE_DL_n',
        'Wo0_0': 'W_Warburg',
        'Wo0_1': 'W_tau',
    }
    
    # Units for each parameter
    PARAM_UNITS = {
        'R0': 'Ω',
        'R1': 'Ω',
        'CPE1_0': 'F·s^(n-1)',
        'CPE1_1': '',
        'R2': 'Ω',
        'CPE2_0': 'F·s^(n-1)',
        'CPE2_1': '',
        'Wo0_0': 'Ω·s^(-1/2)',
        'Wo0_1': 's',
    }

    
    def __init__(self):
        self.frequencies = None
        self.Z = None
        self.circuit = None
        self.fitted_params = None
    
    def load_csv_data(self, csv_content: bytes) -> Tuple[np.ndarray, np.ndarray]:
        """Load EIS data from CSV content."""
        try:
            # First try reading with headers
            df = pd.read_csv(io.BytesIO(csv_content))
            
            # Check if first column looks like a number (no header)
            first_col_name = str(df.columns[0])
            try:
                float(first_col_name)
                # First column is a number - this file has no headers
                df = pd.read_csv(io.BytesIO(csv_content), header=None, names=['frequency', 'real', 'imag'])
                freq_col = 'frequency'
                real_col = 'real'
                imag_col = 'imag'
            except ValueError:
                # Has headers - find the column names
                freq_col = None
                real_col = None
                imag_col = None
                
                for col in df.columns:
                    col_lower = col.lower().strip()
                    if 'freq' in col_lower or col_lower == 'f':
                        freq_col = col
                    elif 'real' in col_lower or col_lower == "z'" or col_lower == 'zre':
                        real_col = col
                    elif 'imag' in col_lower or col_lower == "z''" or col_lower == '-z"' or col_lower == 'zim':
                        imag_col = col
                
                if freq_col is None or real_col is None or imag_col is None:
                    # Try positional columns
                    if len(df.columns) >= 3:
                        freq_col = df.columns[0]
                        real_col = df.columns[1]
                        imag_col = df.columns[2]
                    else:
                        raise ValueError("Could not identify frequency, real, and imaginary columns")
            
            frequencies = df[freq_col].values.astype(float)
            Z_real = df[real_col].values.astype(float)
            Z_imag = df[imag_col].values.astype(float)
            
            # Create complex impedance
            Z = Z_real + 1j * Z_imag
            
            # Preprocess: keep only positive frequencies and remove outliers
            frequencies, Z = preprocessing.ignoreBelowX(frequencies, Z)
            
            self.frequencies = frequencies
            self.Z = Z
            
            return frequencies, Z
            
        except Exception as e:
            raise ValueError(f"Error parsing CSV data: {str(e)}")
    
    def get_bode_plot_data(self) -> Dict[str, Any]:
        """Get data for Bode plot (magnitude and phase vs frequency)."""
        if self.frequencies is None or self.Z is None:
            raise ValueError("No data loaded. Please upload CSV first.")
        
        magnitude = np.abs(self.Z)
        phase = np.angle(self.Z, deg=True)
        
        return {
            'frequencies': self.frequencies.tolist(),
            'magnitude': magnitude.tolist(),
            'phase': phase.tolist()
        }
    
    def fit_circuit(self) -> Dict[str, Any]:
        """Fit equivalent circuit model to the impedance data."""
        if self.frequencies is None or self.Z is None:
            raise ValueError("No data loaded. Please upload CSV first.")
        
        try:
            # Create and fit the circuit
            self.circuit = CustomCircuit(
                circuit=self.CIRCUIT_STRING,
                initial_guess=self.INITIAL_GUESS
            )
            
            self.circuit.fit(self.frequencies, self.Z)
            self.fitted_params = self.circuit.parameters_
            
            # Build parameter list with bounds info
            param_names = ['R0', 'R1', 'CPE1_0', 'CPE1_1', 'R2', 'CPE2_0', 'CPE2_1', 'Wo0_0', 'Wo0_1']
            parameters = []
            
            for i, name in enumerate(param_names):
                if i < len(self.fitted_params):
                    bounds = self.PARAM_BOUNDS.get(name, (0, 1))
                    parameters.append({
                        'name': self.PARAM_DISPLAY_NAMES.get(name, name),
                        'value': float(self.fitted_params[i]),
                        'unit': self.PARAM_UNITS.get(name, ''),
                        'explanation': self.PARAM_EXPLANATIONS.get(name, ''),
                        'min_value': bounds[0],
                        'max_value': bounds[1]
                    })
            
            return {
                'parameters': parameters,
                'circuit_string': self.CIRCUIT_STRING
            }
            
        except Exception as e:
            raise ValueError(f"Error fitting circuit: {str(e)}")
    
    def calculate_soh(self, rb_max: float = 0.1) -> Dict[str, Any]:
        """Calculate State of Health based on Rb value."""
        if self.fitted_params is None:
            raise ValueError("Circuit not fitted. Please fit circuit first.")
        
        # R0 (Rb) is the first parameter
        rb_current = float(self.fitted_params[0])
        
        # SoH = (Rb_max - Rb_current) / Rb_max * 100
        # Lower Rb means better health
        soh_percentage = max(0, min(100, (1 - rb_current / rb_max) * 100))
        
        return {
            'soh_percentage': soh_percentage,
            'rb_current': rb_current,
            'rb_max': rb_max
        }


# Global instance for storing state between requests
impedance_service = ImpedanceService()
