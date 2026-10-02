# Project DHRUVA SETU (SIH PS ID 26065 / MoES)

> **Autonomous Low-Cost Ocean Observation Platform for Polar and Southern Oceans**  
> Developed for Smart India Hackathon (Ministry of Earth Sciences, Govt. of India).  
> **YouTube Demonstration Video:** [https://youtu.be/iSF5zRWMjkU](https://youtu.be/iSF5zRWMjkU)

---

## 🌊 System Overview

**Project Dhruva Setu** is an autonomous, ultra-low-cost, self-righting polar oceanographic buoy engineered for extreme sub-zero conditions (-30°C to +40°C). It delivers high-frequency hydrographic vertical profiling, acoustic marine mammal tracking, and satellite/LoRa telemetry, while remaining under a total Bill of Materials (BOM) cost of **₹18,700 (~$225 USD)**.

---

## 🔬 3-Tier Cutaway Architecture & Subsystem Breakdown

| Subsystem | Core Components | Materials & Tech Specs | Cost (INR) |
| :--- | :--- | :--- | :--- |
| **Hull & Exterior Enclosure** | Conical HDPE/Delrin Shell, Slanted Solar Facets, Anti-Bird Spikes, Metacentric Ballast | UV-stabilized POM Delrin / HDPE shell, 16.1 kg cast MS keel counterweight, 316L stainless bird deterrent spikes, silicone foul-release coating | ₹2,800 |
| **Atmospheric Dome** | Polycarbonate Upper Mast Dome, Stevenson Radiation Shield | Dual 433MHz LoRa + Iridium SBD antennas, NEO-M9N GNSS, SHT45 humidity & TMP117 high-precision temperature sensors | ₹1,800 |
| **Tier 1: Compute Deck** | ESP32-S3 FreeRTOS Mainboard, TinyML Anomaly Engine | Conformal-coated FR4 PCB, ESP32-S3 Dual-Core LX7 @ 240MHz, TPL5110 nano-power gating (22 µA deep sleep), BNO085 9-DOF IMU, MicroSD logger | ₹3,500 |
| **Tier 2: Power Core** | Dual LiFePO4 Energy Bays, Kapton Thermal Envelope | Twin 12.8V 25Ah (300Wh total) LiFePO4 cells, gold Kapton thermal polyimide wrap, TP5100 MPPT solar charge controllers, 12V PTC pulse heating | ₹4,200 |
| **Tier 3: Actuation Deck** | Motorized Worm Gearbox & Profiling Winch | Cast aluminum self-locking 40:1 worm gearbox, NEMA 17 high-torque stepper, ABS tether spool, 6-channel continuous slip ring | ₹3,200 |
| **Sub-Sea CTD Payload** | Hydrodynamic Titanium/HDPE Deep-Water Sensor Pod | TI MSP430 low-power MCU, GY-MS5837 24-bit depth sensor (0.2cm resolution), DS18B20 needle temp, Inductive toroidal salinity cell, MAX485 bus | ₹3,200 |
| **Total Estimated BOM** | **Complete Commercial-Grade Autonomous Polar Buoy Platform** | **Sub-Zero Rated (-30°C to +40°C), 200m Profiling Depth, 18+ Months Endurance** | **~₹18,700** |

---

## 🛠️ Technology Stack

- **Framework**: React 18, Vite
- **3D Engine**: React Three Fiber (`@react-three/fiber`), Three.js (`three`), `@react-three/drei`
- **UI & HUD**: Tailwind CSS, Framer Motion, Lucide React
- **Physics Simulation**: Custom Gerstner Wave & Polar Brine Fluid Mechanics Shader

---

## 🚀 Running the Web Application

### Option 1: React + Vite Development Server (Recommended)
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open browser at http://localhost:3000
```

### Option 2: Production Build
```bash
npm run build
npm run preview
```

### Option 3: Standalone Zero-Dependency Browser Preview
Simply open `index.html` directly in any modern WebGL-supported browser (Chrome, Edge, Firefox, Safari) with zero npm build step required.

---

## 🎮 Interactive Controls & Features

- **360° Orbit & Zoom**: Left-click drag to rotate camera, right-click drag to pan, scroll wheel to zoom.
- **Exploded View Slider**: Smoothly separate buoy components vertically from 0% to 100% to inspect internal tiers.
- **Interactive Component Raycasting**: Click any component (Hull, Solar, Dome, ESP32 Mainboard, Kapton Battery, Winch, CTD Probe) to open the real-time engineering specs and cost drawer.
- **Live 1 Hz Telemetry Stream**: Displays real-time System Voltage, SST Temperature, Salinity PSU, and TinyML health status.
- **View Modes**: Switch between `NORMAL`, `X-RAY VIEW`, and `POLAR BLIZZARD` modes.
- **CAD Architecture Blueprint**: Click `CAD BLUEPRINT` in the HUD to view comprehensive engineering schematics and subsystem breakdowns.
