import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, ShieldCheck, ShieldAlert, Cpu, Eye, Navigation, 
  Map, BarChart2, Users, Truck, AlertTriangle, Layers, Maximize2, 
  ChevronRight, RefreshCw, Smartphone, TrendingUp, ShoppingBag 
} from 'lucide-react';
import { gsap } from 'gsap';

// --- SYSTEM GEOLOCATION FALLBACK CONSTANTS ---
const GQEBERHA_LAT = -33.9608;
const GQEBERHA_LNG = 25.6022;

interface GISBenchProps {
  gpuTier?: number | null; // Passed from client-side detect-gpu hook (1-3)
}

export default function Geospatial3DGISBench({ gpuTier = 3 }: GISBenchProps) {
  // --- UI STATES ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState({ lat: GQEBERHA_LAT, lng: GQEBERHA_LNG });
  const [gpsStatus, setGpsStatus] = useState<'STANDBY' | 'ACQUIRING' | 'LOCKED' | 'FAILED'>('STANDBY');
  const [selectedLayer, setSelectedLayer] = useState<'TERRAIN' | 'HEATMAP' | 'INFRASTRUCTURE'>('TERRAIN');
  const [activeVisualMode, setActiveVisualMode] = useState<'DEFAULT' | 'FLIR' | 'NVG'>('DEFAULT');

  // --- DYNAMIC ANALYTICS SIMULATION STATE (UPDATES EVERY 2.5s) ---
  const [liveMetrics, setLiveMetrics] = useState({
    fps: 60,
    frameTimeMs: 16.6,
    apiCalls: 12,
    apiRequests: 148,
    peopleCountTotal: 1077,
    peopleStreet: 542,
    peopleSidewalk: 384,
    peopleAlley: 151,
    vehiclesTotal: 45,
    vehiclesTrucks: 8,
    vehiclesBuses: 4,
    vehiclesCars: 28,
    vehiclesVans: 5,
    marsoAnimals: 12,
    marsoVehicles: 31,
    factoryDefects: 3,
    factoryYieldRate: 99.4,
    retailCustomers: 188,
    retailFootTraffic: 420
  });

  // --- DOM REFS FOR GSAP ANIMATIONS ---
  const sidebarRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const glowOverlayRef = useRef<HTMLDivElement>(null);

  // 🛡️ THE CRITICAL PERFORMANCE INVARIANT: Throttle heavy animations on low-spec hardware (Tier < 2)
  const enableAnimations = useMemo(() => {
    if (typeof gpuTier === 'number' && gpuTier < 2) {
      console.warn("⚠️ [VVU PERF] Low-spec GPU detected (Tier < 2). Disabling complex 3D post-processing, glowing neon beams, and heavy SVG rendering.");
      return false;
    }
    return true;
  }, [gpuTier]);

  // --- INITIAL GEOLOCATION RESOLUTION ---
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('FAILED');
      return;
    }
    setGpsStatus('ACQUIRING');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGpsStatus('LOCKED');
      },
      (error) => {
        console.error("Geolocation capture error. Falling back to Gqeberha base coordinates:", error);
        setGpsStatus('FAILED');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  // --- DYNAMIC METRICS LOOP (Simulating real-time edge AI streams) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics(prev => {
        const fpsVariance = Math.floor(Math.random() * 5) - 2;
        const targetFps = enableAnimations ? 60 : 30; // Lower baseline target for Tier-1 hardware
        const currentFps = Math.max(targetFps + fpsVariance, 12);
        
        return {
          fps: currentFps,
          frameTimeMs: parseFloat((1000 / currentFps).toFixed(1)),
          apiCalls: prev.apiCalls + Math.floor(Math.random() * 3) - 1,
          apiRequests: prev.apiRequests + Math.floor(Math.random() * 5),
          peopleCountTotal: prev.peopleCountTotal + Math.floor(Math.random() * 11) - 5,
          peopleStreet: prev.peopleStreet + Math.floor(Math.random() * 5) - 2,
          peopleSidewalk: prev.peopleSidewalk + Math.floor(Math.random() * 4) - 2,
          peopleAlley: prev.peopleAlley + Math.floor(Math.random() * 2) - 1,
          vehiclesTotal: prev.vehiclesTotal + Math.floor(Math.random() * 3) - 1,
          vehiclesTrucks: prev.vehiclesTrucks,
          vehiclesBuses: prev.vehiclesBuses,
          vehiclesCars: prev.vehiclesCars + Math.floor(Math.random() * 2) - 1,
          vehiclesVans: prev.vehiclesVans,
          marsoAnimals: Math.max(0, prev.marsoAnimals + Math.floor(Math.random() * 3) - 1),
          marsoVehicles: prev.marsoVehicles + Math.floor(Math.random() * 2) - 1,
          factoryDefects: Math.max(0, prev.factoryDefects + (Math.random() > 0.85 ? 1 : -1)),
          factoryYieldRate: parseFloat((99.0 + Math.random() * 0.9).toFixed(2)),
          retailCustomers: prev.retailCustomers + Math.floor(Math.random() * 7) - 3,
          retailFootTraffic: prev.retailFootTraffic + Math.floor(Math.random() * 10) - 4
        };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [enableAnimations]);

  // --- GSAP SIDEBAR TRANSITION SLIDE-IN/OUT ---
  useEffect(() => {
    if (!enableAnimations) return;

    if (isSidebarOpen) {
      gsap.to(sidebarRef.current, {
        x: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power3.out',
        display: 'block'
      });
      gsap.to(triggerButtonRef.current, {
        right: '416px',
        rotation: 180,
        duration: 0.5,
        ease: 'power3.out'
      });
    } else {
      gsap.to(sidebarRef.current, {
        x: '100%',
        opacity: 0,
        duration: 0.4,
        ease: 'power3.in',
        onComplete: () => {
          if (sidebarRef.current) sidebarRef.current.style.display = 'none';
        }
      });
      gsap.to(triggerButtonRef.current, {
        right: '16px',
        rotation: 0,
        duration: 0.4,
        ease: 'power3.inOut'
      });
    }
  }, [isSidebarOpen, enableAnimations]);

  return (
    <div className={`relative w-full h-screen bg-slate-950 text-slate-100 overflow-hidden font-mono select-none ${
      activeVisualMode === 'FLIR' ? 'filter hue-rotate-180 brightness-95 contrast-125' : 
      activeVisualMode === 'NVG' ? 'filter saturate-150 contrast-125 brightness-110 green-phosphor' : ''
    }`}>
      
      {/* 🟢 STRICT SIMULATION ADVISORY */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-8 py-1.5 font-bold text-xs tracking-widest z-50 rounded-b-md shadow-2xl pointer-events-none">
        SIMULATION WORKSPACE — NOT MUNICIPAL OPERATIONAL SCADA
      </div>

      {/* 🚀 THE 3D GIS CANVASES & TERRAIN (MOCKED & ANIMATED) */}
      <div className="absolute inset-0 w-full h-full z-0">
        {/* Synthetic WebGL / Grid Layer */}
        <div className={`absolute inset-0 w-full h-full bg-grid-pattern transition-opacity duration-1000 ${
          selectedLayer === 'TERRAIN' ? 'opacity-30' : selectedLayer === 'HEATMAP' ? 'opacity-10' : 'opacity-40'
        }`} />
        
        {/* Glowing Simulated 3D Satellite Radar Line */}
        {enableAnimations && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_15px_#0ea5e9] animate-scanline z-10" />
        )}

        {/* Real-time YOLO Bounding Boxes Rendering Directly over Terrain */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* Mock Box 1: Pedestrian Crowd */}
          <div className="absolute top-[28%] left-[34%] border border-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-rose-400 tracking-wider shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse">
            YOLOv8: PEDESTRIAN_CROWD [CONF: 94%]
          </div>
          {/* Mock Box 2: Defect/Leak Anomaly */}
          <div className="absolute top-[64%] left-[45%] border border-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-cyan-300 tracking-wider shadow-[0_0_8px_rgba(14,165,233,0.3)]">
            STATE: SOIL_WETNESS_ANOMALY [CONF: 91%]
          </div>
          {/* Mock Box 3: Heavy Truck */}
          <div className="absolute top-[48%] left-[72%] border border-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-400 tracking-wider shadow-[0_0_8px_rgba(245,158,11,0.3)]">
            YOLOv8: HEAVY_TRUCK [CONF: 98.7%]
          </div>
        </div>

        {/* 🗺️ MOCK MAP BACKDROP VIEWPORT (Fills screen) */}
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.3)_0%,rgba(2,6,23,0.95)_100%)]">
          <div className="max-w-xl flex flex-col items-center gap-4">
            <Map className="w-16 h-16 text-emerald-500 opacity-60 animate-bounce" />
            <h2 className="text-lg font-bold text-emerald-400 tracking-widest uppercase">
              3D GIS Engine Active
            </h2>
            <div className="bg-slate-900/80 border border-slate-800 rounded p-4 text-[11px] text-slate-400 w-full text-left leading-relaxed">
              <span className="text-sky-400 font-bold">CRS TARGET:</span> EPSG:4326 (WGS84) georeferenced ellipsoid.<br />
              <span className="text-sky-400 font-bold">DEVICE GPS:</span> {gpsCoordinates.lat.toFixed(6)} S, {gpsCoordinates.lng.toFixed(6)} E ({gpsStatus})<br />
              <span className="text-sky-400 font-bold">HARDWARE TIER:</span> GPU_TIER_{gpuTier} ({enableAnimations ? "FULL ANIMATIONS ACTIVE" : "PERFORMANCE RE-ROUTE LOCKED"})
            </div>
          </div>
        </div>
      </div>

      {/* --- HUD HEADER --- */}
      <header className="absolute top-12 left-6 right-6 flex justify-between items-start z-30 pointer-events-none">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur px-4 py-3 rounded shadow-2xl pointer-events-auto">
          <h1 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <Activity className="w-4 h-4 animate-pulse" />
            VENTURE VISION UBUNTU — 3D GIS BENCH v2.5
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase">SANS 10112 / EIS v1.0 EVIDENCE COMPLIANT PLATFORM</p>
        </div>

        {/* Visual Mode Toggles & Spatial Layers (HUD Controls) */}
        <div className="flex gap-3 pointer-events-auto">
          {/* Layers Controls */}
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur rounded flex p-1 shadow-2xl">
            {(['TERRAIN', 'HEATMAP', 'INFRASTRUCTURE'] as const).map(layer => (
              <button
                key={layer}
                onClick={() => setSelectedLayer(layer)}
                className={`px-3 py-1.5 rounded text-[9px] font-bold transition-all ${
                  selectedLayer === layer ? 'bg-emerald-500 text-black shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>

          {/* Optics Shader Modes */}
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur rounded flex p-1 shadow-2xl">
            {(['DEFAULT', 'FLIR', 'NVG'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setActiveVisualMode(mode)}
                className={`px-3 py-1.5 rounded text-[9px] font-bold transition-all ${
                  activeVisualMode === mode ? 'bg-sky-500 text-black shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* --- BOTTOM FLOATING TELEMETRY FEED (11-FIELD PROVENANCE CARD) --- */}
      <div className="absolute bottom-6 left-6 w-96 bg-slate-900/90 border border-slate-800 backdrop-blur p-4 rounded shadow-2xl z-30">
        <h3 className="text-xs font-bold text-sky-400 flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
          <Smartphone className="w-4 h-4" /> LOCAL NODE PAIRING STATUS
        </h3>
        <div className="grid grid-cols-2 gap-y-2 text-[10px] text-slate-400">
          <div>ACTIVE GATEWAY:</div><div className="text-emerald-400 font-bold text-right">VVU-HG-NMBM-01</div>
          <div>PAIRING MECHANISM:</div><div className="text-right">BLE + TOTP HANDSHAKE</div>
          <div>MFA CODE SYNC:</div><div className="text-right text-sky-400 font-bold">VERIFIED_CANDIDATE</div>
          <div>ENVELOPE COMPLIANCE:</div><div className="text-right text-emerald-500">SANS 1200 / PASS</div>
        </div>
      </div>

      {/* --- FLOATING TRIGGER SIDEBAR BUTTON (GLOWING GLASS) --- */}
      <button
        ref={triggerButtonRef}
        onClick={() => setIsSidebarOpen(prev => !prev)}
        style={{ right: !enableAnimations && isSidebarOpen ? '416px' : '16px' }}
        className="absolute top-1/2 -translate-y-1/2 w-10 h-24 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 backdrop-blur rounded-l-lg shadow-[0_0_20px_rgba(2,6,23,0.8)] z-40 flex flex-col justify-center items-center gap-1.5 group cursor-pointer transition-all duration-300"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        <ChevronRight className={`w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} />
        <span className="text-[8px] font-bold text-slate-500 group-hover:text-emerald-400 tracking-widest writing-vertical rotate-180 uppercase mt-1">
          ANALYTICS
        </span>
      </button>

      {/* --- RETRACTABLE HIGH-DENSITY ANALYTICS SIDEBAR --- */}
      <aside
        ref={sidebarRef}
        style={{ display: isSidebarOpen ? 'block' : 'none' }}
        className="absolute top-0 right-0 w-96 h-full bg-slate-900/95 border-l border-slate-800/80 backdrop-blur-xl shadow-[-10px_0_30px_rgba(2,6,23,0.9)] p-6 overflow-y-auto z-30"
      >
        <div className="flex flex-col gap-6 pt-12">
          {/* Header info */}
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-sky-400 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> METROPOLITAN METRICS
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 uppercase">Live feed from local YOLO and satellite models</p>
          </div>

          {/* SECTION 1: GLOBAL FEED STATUS (System Heartbeat) */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded p-4">
            <h3 className="text-[11px] font-bold text-emerald-400 flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> SYSTEM PERFORMANCE</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="text-slate-400">FPS / RENDERING:</div>
              <div className={`text-right font-bold ${liveMetrics.fps > 45 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {liveMetrics.fps} FPS
              </div>
              <div className="text-slate-400">FRAME RENDER TIME:</div>
              <div className="text-right text-slate-200">{liveMetrics.frameTimeMs} ms</div>
              <div className="text-slate-400">ACTIVE SCADA CALLS:</div>
              <div className="text-right text-slate-200">{liveMetrics.apiCalls}/s</div>
              <div className="text-slate-400">TOTAL B2B REQUESTS:</div>
              <div className="text-right text-sky-400 font-bold">{liveMetrics.apiRequests} req</div>
            </div>
          </div>

          {/* SECTION 2: CITYWIDE PEOPLE COUNTER */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded p-4">
            <h3 className="text-[11px] font-bold text-sky-400 flex items-center justify-between mb-3 border-b border-slate-900 pb-1.5">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> PEOPLE COUNTER (YOLO)</span>
              <span className="text-[10px] text-sky-300 font-mono">{liveMetrics.peopleCountTotal}</span>
            </h3>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">PUBLIC STREETWAYS:</span>
                <span className="text-slate-200">{liveMetrics.peopleStreet}</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                <div className="bg-sky-400 h-full transition-all duration-1000" style={{ width: `${(liveMetrics.peopleStreet / liveMetrics.peopleCountTotal) * 100}%` }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">COMMERCIAL SIDEWALKS:</span>
                <span className="text-slate-200">{liveMetrics.peopleSidewalk}</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                <div className="bg-sky-400 h-full transition-all duration-1000" style={{ width: `${(liveMetrics.peopleSidewalk / liveMetrics.peopleCountTotal) * 100}%` }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">ALLEYWAYS & BYPASSES:</span>
                <span className="text-slate-200">{liveMetrics.peopleAlley}</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                <div className="bg-sky-400 h-full transition-all duration-1000" style={{ width: `${(liveMetrics.peopleAlley / liveMetrics.peopleCountTotal) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* SECTION 3: METROPOLITAN VEHICLE BREAKDOWN */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded p-4">
            <h3 className="text-[11px] font-bold text-amber-500 flex items-center justify-between mb-3 border-b border-slate-900 pb-1.5">
              <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> METRO VEHICLE METRICS</span>
              <span className="text-[10px] text-amber-400 font-mono">TOTAL: {liveMetrics.vehiclesTotal}</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
              <div>HEAVY TRUCKS:</div><div className="text-right text-slate-200 font-bold">{liveMetrics.vehiclesTrucks}</div>
              <div>TRANSIT BUSES:</div><div className="text-right text-slate-200 font-bold">{liveMetrics.vehiclesBuses}</div>
              <div>COMMERCIAL CARS:</div><div className="text-right text-slate-200 font-bold">{liveMetrics.vehiclesCars}</div>
              <div>LOGISTICS VANS:</div><div className="text-right text-slate-200 font-bold">{liveMetrics.vehiclesVans}</div>
            </div>
          </div>

          {/* SECTION 4: MARSO TRANSIT FLOWS */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded p-4">
            <h3 className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5 mb-3">
              <Layers className="w-3.5 h-3.5" /> MARSO TRAFFIC FLOWS
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
              <div>LIVESTOCK / FLOW:</div><div className="text-right text-rose-400 font-bold">{liveMetrics.marsoAnimals} units/h</div>
              <div>VEHICULAR FLUX:</div><div className="text-right text-rose-400 font-bold">{liveMetrics.marsoVehicles} trans/h</div>
            </div>
          </div>

          {/* SECTION 5: FACTORY DEFECT STATISTICS */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded p-4">
            <h3 className="text-[11px] font-bold text-purple-400 flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> FACTORY INSPECTIONS</span>
              <span className="text-[10px] text-purple-300 font-mono">{liveMetrics.factoryYieldRate}% YIELD</span>
            </h3>
            <div className="space-y-2 text-[10px] text-slate-400">
              <div className="flex justify-between items-center">
                <span>DETECTED ANOMALIES/DEFECTS:</span>
                <span className={`font-bold ${liveMetrics.factoryDefects > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {liveMetrics.factoryDefects} LIMIT-VIOLATIONS
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 6: MICRO-LOCATION RETAIL */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded p-4">
            <h3 className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5 mb-3">
              <ShoppingBag className="w-3.5 h-3.5" /> RETAIL & FOOT TRAFFIC
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
              <div>STORE CUSTOMERS:</div><div className="text-right text-slate-200 font-bold">{liveMetrics.retailCustomers}</div>
              <div>ZONE FOOT TRAFFIC:</div><div className="text-right text-slate-200 font-bold">{liveMetrics.retailFootTraffic} people</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
