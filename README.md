# ⚡ Battery Labs - Cell Characterization Dashboard

<div align="center">

![Battery Labs Banner](https://img.shields.io/badge/Battery_Labs-Cell_Characterization-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xMyAxMFYzTDQgMTRoN3Y3bDktMTFoLTd6Ii8+PC9zdmc+)

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61dafb?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)](https://neon.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python)](https://python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

**A professional battery cell characterization system with EIS analysis, state-of-health monitoring, and comprehensive cell database management.**

[Features](#-features) • [Problem Statement](#-problem-statement) • [Architecture](#️-architecture) • [Getting Started](#-getting-started) • [API Documentation](#-api-documentation)

</div>

---

## 📋 Problem Statement

### Background
Battery cell characterization is critical for:
- **Quality Control**: Ensuring cells meet specifications before deployment
- **State of Health (SoH) Assessment**: Determining remaining useful life
- **Research & Development**: Understanding cell degradation mechanisms
- **Second-Life Applications**: Evaluating recycled cells for reuse

### Challenge
Design and implement a **full-stack web application** for battery cell characterization that:

1. **Manages Cell Database**: CRUD operations for battery cells with unique identification
2. **Stores Cell Images**: Upload and display cell photographs via cloud storage
3. **Performs EIS Analysis**: Analyze Electrochemical Impedance Spectroscopy data
4. **Calculates State of Health**: Determine battery health from impedance parameters
5. **Visualizes Results**: Display Bode plots, ECM diagrams, and parameter tables

### Requirements Fulfilled

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Auto-generated 10-digit Cell ID | Unique barcode generation with react-barcode | ✅ |
| Cell Image Upload | Cloudinary integration with preview | ✅ |
| Cell Condition Tracking | New/Good/Bad/Recycled status | ✅ |
| Meta Information Form | Manufacturer, Model, Type, Form Factor, Dimensions | ✅ |
| 13 Electrical Parameters | Full parameter set with database persistence | ✅ |
| EIS CSV Data Upload | File upload with parsing and validation | ✅ |
| Bode Plot Visualization | Interactive Plotly.js charts (Magnitude & Phase) | ✅ |
| ECM Diagram | R0-p(R1,CPE1)-p(R2,CPE2)-W1 circuit schematic | ✅ |
| Parameters Table | Values with visual indicators and explanations | ✅ |
| State of Health Display | Battery icon with SoH percentage calculation | ✅ |

---

## ✨ Features

### 🔋 Cell Management
- **Auto-Generated Cell ID**: Unique 10-digit identifier with barcode display
- **Cell Conditions**: Track status (New, Good, Bad, Recycled)
- **Image Upload**: Cloud-based image storage via Cloudinary
- **Full CRUD Operations**: Create, Read, Update, Delete cells

### 📊 EIS Analysis
- **CSV Data Import**: Upload impedance spectroscopy data
- **Bode Plot**: Interactive magnitude and phase vs. frequency plots
- **ECM Fitting**: Equivalent Circuit Model parameter extraction
- **Real-time Processing**: Powered by `impedance.py` library

### 🩺 State of Health (SoH)
- **SoH Calculation**: `SoH = (1 - Rb_current / Rb_max) × 100`
- **Visual Battery Indicator**: Dynamic fill based on health percentage
- **Parameter Monitoring**: Track degradation indicators

### 📈 Visualization
- **Bode Plot**: Log-scale frequency response (Magnitude & Phase)
- **ECM Diagram**: Interactive circuit schematic
- **Parameters Table**: All ECM parameters with value bars
- **Responsive Design**: Works on desktop and mobile

### ⚡ Electrical Parameters
The system tracks 13 electrical parameters:

| Parameter | Description | Unit |
|-----------|-------------|------|
| Nominal Voltage | Standard operating voltage | V |
| Nominal Energy | Energy capacity | Wh |
| Nominal Charge Capacity | Charge capacity | Ah |
| Voltage Min/Max | Operating voltage range | V |
| Current Continuous/Peak | Current limits | A |
| Power Continuous/Peak | Power limits | W |
| Energy Density (Gravimetric) | Energy per mass | Wh/kg |
| Energy Density (Volumetric) | Energy per volume | Wh/L |
| Power Density (Gravimetric) | Power per mass | W/kg |
| Power Density (Volumetric) | Power per volume | W/L |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Next.js 16 + React 19                    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │  Cell       │  │  Upload/    │  │  EIS Analysis   │  │    │
│  │  │  Database   │  │  Edit Tab   │  │  Tab            │  │    │
│  │  │  Tab        │  │             │  │                 │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  │                                                          │    │
│  │  Components: BodePlot | ECMDiagram | SoHDisplay | etc.  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ HTTP/REST                         │
│                              ▼                                   │
├─────────────────────────────────────────────────────────────────┤
│                         BACKEND                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    FastAPI Server                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │  Cells      │  │  EIS        │  │  Cloudinary     │  │    │
│  │  │  Router     │  │  Router     │  │  Service        │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  │                                                          │    │
│  │  Services: cell_service | impedance_service              │    │
│  │  Library: impedance.py (ECM fitting)                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ asyncpg                           │
│                              ▼                                   │
├─────────────────────────────────────────────────────────────────┤
│                       DATABASE                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PostgreSQL (Neon Serverless)                │    │
│  │  ┌─────────┐  ┌──────────────────┐  ┌────────────────┐  │    │
│  │  │  cells  │  │ electrical_params │  │ eis_analyses   │  │    │
│  │  └─────────┘  └──────────────────┘  └────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                             │
│  ┌──────────────────────┐                                       │
│  │      Cloudinary      │  ← Image Storage & CDN                │
│  └──────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16.1.1, React 19, TypeScript | UI Framework |
| **Styling** | Tailwind CSS 3.4, Custom Animations | Design System |
| **Charts** | Plotly.js, react-plotly.js | Data Visualization |
| **Backend** | FastAPI, Python 3.12+ | REST API |
| **Database** | PostgreSQL (Neon), SQLAlchemy, asyncpg | Data Persistence |
| **EIS Analysis** | impedance.py, NumPy, Pandas | Scientific Computing |
| **Image Storage** | Cloudinary | Cloud Media Management |
| **Barcode** | react-barcode | Cell ID Generation |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.12
- **uv** (Python package manager) or pip
- **PostgreSQL** database (or Neon account)
- **Cloudinary** account (for image uploads)

### Environment Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/battery-labs.git
cd battery-labs
```

#### 2. Backend Setup

```bash
cd backend

# Create .env file
cp .env.example .env  # Then edit with your credentials

# Install dependencies with uv
uv sync

# Or with pip
pip install -e .

# Run the server
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend Environment Variables (.env):**
```env
# Database (PostgreSQL/Neon)
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/database

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Environment
ENVIRONMENT=development
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local  # Then edit with your API URL

# Run the development server
npm run dev
```

**Frontend Environment Variables (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📁 Project Structure

```
battery-labs/
├── backend/
│   ├── main.py              # FastAPI application entry
│   ├── database.py          # Database connection & setup
│   ├── models/
│   │   ├── cell.py          # SQLAlchemy models
│   │   └── schemas.py       # Pydantic schemas
│   ├── routers/
│   │   ├── cells.py         # Cell CRUD endpoints
│   │   └── eis.py           # EIS analysis endpoints
│   ├── services/
│   │   ├── cell_service.py      # Cell business logic
│   │   ├── cloudinary_service.py # Image upload service
│   │   └── impedance_service.py  # EIS analysis service
│   └── pyproject.toml       # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx     # Main dashboard page
│   │   │   ├── layout.tsx   # Root layout with SEO
│   │   │   └── globals.css  # Global styles & animations
│   │   ├── components/
│   │   │   ├── BodePlot.tsx       # Bode plot component
│   │   │   ├── ECMDiagram.tsx     # ECM circuit diagram
│   │   │   ├── SoHDisplay.tsx     # State of Health display
│   │   │   ├── ErrorBoundary.tsx  # Error handling
│   │   │   └── LoadingSkeleton.tsx # Loading states
│   │   ├── lib/
│   │   │   ├── api.ts       # API client functions
│   │   │   └── env.ts       # Environment validation
│   │   └── types/           # TypeScript definitions
│   ├── public/
│   │   ├── manifest.json    # PWA manifest
│   │   └── icon.svg         # App icon
│   ├── next.config.ts       # Next.js configuration
│   ├── tailwind.config.ts   # Tailwind configuration
│   └── package.json         # Node dependencies
│
└── README.md                # This file
```

---

## 📡 API Documentation

### Cells API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cells` | List all cells (paginated) |
| `GET` | `/cells/{id}` | Get cell by ID |
| `GET` | `/cells/barcode/{barcode}` | Get cell by barcode |
| `POST` | `/cells` | Create new cell |
| `PUT` | `/cells/{id}` | Update cell |
| `DELETE` | `/cells/{id}` | Delete cell |
| `POST` | `/cells/{id}/image` | Upload cell image |

### EIS Analysis API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/cells/{id}/eis` | Upload & analyze EIS data |
| `GET` | `/cells/{id}/eis/latest` | Get latest EIS analysis |
| `GET` | `/cells/{id}/eis` | Get all EIS analyses |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check |

---

## 🔬 EIS Analysis Details

### Equivalent Circuit Model (ECM)

The system uses the following ECM for fitting:

```
R0 - p(R1,CPE1) - p(R2,CPE2) - W1
```

**Components:**
- **R0 (Rb)**: Bulk/Ohmic resistance
- **R1 (R_SEI)**: SEI layer resistance
- **CPE1**: Constant Phase Element for SEI
- **R2 (R_CT)**: Charge transfer resistance
- **CPE2 (CPE_DL)**: Double layer CPE
- **W1 (W_Warburg)**: Warburg diffusion element

### State of Health Calculation

```
SoH (%) = (1 - Rb_current / Rb_max) × 100
```

Where:
- `Rb_current` = Current bulk resistance from EIS fit
- `Rb_max` = Maximum expected bulk resistance (configurable, default 0.1Ω)

---

## 🎨 UI Features

### Visual Design
- **Animated Gradient Background**: Purple/blue/teal gradient shifts
- **Glass Morphism**: Frosted glass effects on cards and header
- **Floating Orbs**: Decorative animated background elements
- **Smooth Animations**: Slide-in modals, hover effects, loading skeletons

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interactions

### Accessibility
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- High contrast color scheme

---

## 🔒 Security Features

- **CORS Configuration**: Environment-based allowed origins
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, XSS Protection
- **Input Validation**: Pydantic schemas for API validation
- **Error Boundaries**: Graceful error handling in UI
- **Environment Validation**: Required variables checked at startup

---

## 📦 Production Deployment

### Frontend (Vercel/Netlify)

```bash
cd frontend
npm run build
npm run start
```

### Backend (Railway/Render/Fly.io)

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Environment Variables for Production

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXT_PUBLIC_SITE_URL=https://your-frontend.com
```

**Backend:**
```env
DATABASE_URL=postgresql+asyncpg://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend.com
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
uv run pytest

# Frontend lint
cd frontend
npm run lint
```

---

## 📄 License

This project is part of the ThinkClock Labs Battery Cell Characterization System.

© 2024 ThinkClock Labs. All rights reserved.

---

## 👥 Contributors

- **404FoundDevelopers** - Development Team

---

<div align="center">

**Built with ❤️ for Battery Research & Development**

[⬆ Back to Top](#-battery-labs---cell-characterization-dashboard)

</div>
