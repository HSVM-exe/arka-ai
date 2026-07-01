# ☀️ ARKA AI: ISRO Solar Flare Intelligence Platform

ARKA AI is a premium, real-time space weather observatory HUD and prediction dashboard engineered to run inside the **ISRO Aditya-L1 Mission Operations Center**. 

It ingests streaming telemetry from the Aditya-L1 Lagrange Point 1 satellite payload—specifically the **SoLEXS** (Solar Low Energy X-ray Spectrometer) and **HEL1OS** (High Energy L1 Orbiting X-ray Spectrometer) instruments—to nowcast solar flare cycles, estimate high-energy flaring onset probabilities, and project potential geomagnetic impacts on Earth infrastructure.

---

## 🚀 Key Features

### 📡 Telemetry & Cockpit HUD
* **Obsidian-Slate Space Palette**: Rebuilds the user experience using deep space slates (`#050608`), glowing Solar Orange (`#FF8A00`), Gold (`#FFC84D`), and Electric Cyan (`#49E6FF`) signals.
* **3-Second Initialization Boot Loader**: Simulates a spacecraft telemetry handshake sequence on mount before unlocking the secure access gateway.
* **Mission Elapsed Time (MET)**: Real-time mission elapsed uptime clock tracking satellite payload operations since startup.

### ☀️ Cinematic Solar Imager (Aditya-L1 Core)
* **Wavelength Spectrometers**: Real-time spectral color toggling (`94 Å` green, `131 Å` cyan, `171 Å` gold, `304 Å` orange) mapping specific coronal temperatures and chromospheric layers.
* **Dynamic Plasma Filaments**: Multi-layered SVG solar flares, coronal loops, and magnetic fields rotating dynamically in opposite directions.
* **Timeline Projection Slider**: Interactive scrubbing between `-24h` and `+24h` to visualize past flares and forward projections.
* **Earth Direction coordinate Indicator**: Angular compass showing Earth orientation relative to the solar north.

### 🛡️ Real-Time Forecasts & XAI
* **Analog Needle Risk Gauge**: A circular dial showing active operational risk indices using smooth bezier transitions.
* **Explainable AI (XAI)**: Visualizes feature importance contributions (Soft X-Ray gradients, Hard X-Ray confirmations, detector agreement coefficients).
* **Solar Wind waves**: Displays animated, flowing plasma wave lines drifting dynamically based on incoming solar wind density, speed, and Bz magnetic orientation.
* **Geomagnetic Forecast (Kp Index)**: Circular dial Kp indicators showing live geomagnetic storm ratings (Quiet, Active, Storm).
* **Model Analytics (ML Ops)**: Tracking inference latency (84 ms), validation curves, ROC-AUC (0.965), and CPU/GPU memory loads.

### 🔒 Cryptographic RBAC Gateway
Secured via Base64 HMAC cryptographically signed session tokens:
* **`admin1` / `password` (SysAdmin)**: Full access to baseline threshold parameters.
* **`officer1` / `password` (Space Weather Officer)**: Authorized to dispatch alerts, acknowledge commands, and Suppress/Escalate alarms.
* **`observer1` / `password` (Scientific Observer)**: Read-only access to charts, forecasts, and logs.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Recharts, Lucide React, HTML5 Canvas/SVG.
- **Backend**: FastAPI (Python 3.10), SQLAlchemy, PostgreSQL/SQLite.
- **Infrastructure**: Docker & Docker Compose.

---

## 💻 Setup & Running Locally

### Option 1: Quickstart with Docker (Recommended)
Make sure you have Docker Desktop running, then launch the entire stack:
```bash
# Rebuild and start both database and uvicorn backend
docker compose up -d --build
```
The backend server will spin up on **`http://localhost:8000`** and pre-populate the database. You can then run the local Vite dev server.

---

### Option 2: Local Manual Setup

#### 1. Start the Python Backend
Navigate to the backend directory:
```bash
cd backend
```
Create a virtual environment and activate it:
```bash
python -m venv .venv

# On Windows
.venv\Scripts\activate
# On macOS/Linux
source .venv/bin/activate
```
Install dependencies:
```bash
pip install -r requirements.txt
```
Launch the FastAPI uvicorn server:
```bash
# Runs on http://localhost:8000 by default
uvicorn main:app --reload
```

#### 2. Start the React Frontend
Navigate to the root directory and install dependencies:
```bash
npm install
```
Start the local development server:
```bash
npm run dev
```
Open **`http://localhost:5173/`** (or the port specified by Vite) in your browser.

---

## 🧪 Simulation Scenarios
You can switch simulated solar transits in the header dropdown to test warning triggers:
1. **Quiet Day (Baseline)**: Standard solar noise background fluctuations.
2. **Gradual Pre-Flare**: Early thermal build-up and gradual rises.
3. **Impulsive Solar Flare**: Sudden, sharp counts peaking above threshold limits.
4. **Noisy False Spike**: Simulates corrupted telemetry packets and telemetry loss.
5. **Detector Disagreement**: Discrepancy between SoLEXS and HEL1OS sensors to trigger sensor calibration flags.
