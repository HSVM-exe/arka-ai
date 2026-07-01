import React from 'react';
import { 
  Cpu, 
  Activity, 
  Clock, 
  Zap,
  Waves,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import type { 
  LightCurvePoint, 
  DetectorHealth, 
  AlertEvent, 
  ImpactRisk,
  SystemSettings
} from '../types';
import { DigitalSun } from '../components/DigitalSun';
import { LineChartPanel } from '../components/LineChartPanel';
import { 
  ExplanationBar, 
  PhaseTimeline,
  AnalogRiskGauge,
  GeomagneticForecast,
  SolarWindWaves
} from '../components/DashboardComponents';
import type { ExplainabilityData } from './../services/explainabilityService';

// ==========================================
// 1. MissionOverview View
// ==========================================
interface MissionOverviewProps {
  latestPoint: LightCurvePoint | null;
  explainability: ExplainabilityData;
  impactRisks: ImpactRisk[];
  alerts: AlertEvent[];
  onAcknowledgeAlert: (id: string) => void;
  chartData: LightCurvePoint[];
}

export const MissionOverview: React.FC<MissionOverviewProps> = ({
  latestPoint,
  explainability,
  impactRisks: _impactRisks,
  alerts,
  onAcknowledgeAlert: _onAcknowledgeAlert,
  chartData
}) => {
  const currentPhase = latestPoint?.nowcast_phase || 'Quiet';
  const currentSeverity = latestPoint?.alert_level || 'Low';
  const activeAlerts = alerts.filter(a => a.status === 'New').slice(0, 3);

  // Map severity to text colors
  const severityColors: Record<string, string> = {
    Low: 'var(--health-green)',
    Elevated: 'var(--cyan-telemetry)',
    Moderate: 'var(--solar-gold)',
    High: 'var(--solar-orange)',
    Critical: 'var(--alert-red)'
  };
  const activeSeverityColor = severityColors[currentSeverity] || 'var(--health-green)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Metric Cards Row with inline sparklines & circular progress wheels */}
      <div className="telemetry-row">
        {/* Card 1: Solar Activity Level */}
        <div className="metric-card" style={{ borderLeft: '3px solid var(--solar-orange)', background: 'rgba(13, 16, 24, 0.65)' }}>
          <div className="metric-card-header">
            <span>Solar Activity Level</span>
            <Activity size={14} style={{ color: 'var(--solar-gold)' }} />
          </div>
          <div className="metric-val-main" style={{ color: currentPhase === 'Quiet' ? 'var(--health-green)' : 'var(--solar-orange)' }}>
            {currentPhase.toUpperCase()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Phase: {currentPhase}</span>
            {/* Mini Sparkline */}
            <div style={{ width: '80px', height: '24px', opacity: 0.8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(-15)}>
                  <Line type="monotone" dataKey="soft_xray_counts" stroke={currentPhase === 'Quiet' ? 'var(--health-green)' : 'var(--solar-orange)'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Card 2: Telemetry Counts */}
        <div className="metric-card" style={{ borderLeft: '3px solid var(--solar-orange)', background: 'rgba(13, 16, 24, 0.65)' }}>
          <div className="metric-card-header">
            <span>Telemetry Counts (Soft)</span>
            <Cpu size={14} style={{ color: 'var(--solar-gold)' }} />
          </div>
          <div className="metric-val-main" style={{ color: '#fff' }}>
            {latestPoint ? `${Math.round(latestPoint.soft_xray_counts)} c/s` : '---'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Baseline: {latestPoint ? Math.round(latestPoint.soft_baseline) : '---'} c/s</span>
            {/* Glowing Orange Sparkline */}
            <div style={{ width: '80px', height: '24px', opacity: 0.8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(-15)}>
                  <Line type="monotone" dataKey="soft_xray_counts" stroke="var(--solar-orange)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Card 3: Forecast Flare Prob */}
        <div className="metric-card" style={{ borderLeft: '3px solid var(--solar-orange)', background: 'rgba(13, 16, 24, 0.65)', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="metric-card-header" style={{ marginBottom: '4px' }}>
              <span>Forecast Flare Prob (10m)</span>
            </div>
            <div className="metric-val-main" style={{ color: 'var(--solar-gold)' }}>
              {latestPoint ? `${Math.round(latestPoint.forecast_probability)}%` : '---'}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Confidence: {latestPoint ? Math.round(latestPoint.confidence) : '---'}%</span>
          </div>
          {/* Circular progress loop */}
          <div style={{ width: '48px', height: '48px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255, 138, 0, 0.05)" strokeWidth="4" />
              <circle 
                cx="24" 
                cy="24" 
                r="18" 
                fill="none" 
                stroke="var(--solar-gold)" 
                strokeWidth="4" 
                strokeDasharray="113" 
                strokeDashoffset={113 - ((latestPoint?.forecast_probability || 0) / 100) * 113}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <Clock size={12} style={{ position: 'absolute', color: 'var(--solar-gold)' }} />
          </div>
        </div>

        {/* Card 4: System Risk Status */}
        <div className="metric-card" style={{ borderLeft: '3px solid var(--solar-orange)', background: 'rgba(13, 16, 24, 0.65)', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="metric-card-header" style={{ marginBottom: '4px' }}>
              <span>System Risk Status</span>
            </div>
            <div className="metric-val-main" style={{ color: activeSeverityColor }}>
              {currentSeverity.toUpperCase()}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Operational safety index</span>
          </div>
          {/* Analog needle gauge */}
          <div style={{ width: '100px', height: '55px' }}>
            <AnalogRiskGauge level={currentSeverity} />
          </div>
        </div>
      </div>

      {/* 2. Main Center Cockpit Panel Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '20px'
      }}>
        {/* Left: Solar visualizer */}
        <div className="dashboard-card" style={{ paddingBottom: '16px' }}>
          <div className="dashboard-card-title">
            <span>ADITYA-L1 SOLAR VIEW</span>
            <span style={{ color: 'var(--solar-gold)', fontSize: '10px' }}>REAL-TIME ACTIVE REGION MONITOR</span>
          </div>
          <DigitalSun phase={currentPhase} severity={currentSeverity} />
        </div>

        {/* Right: XAI explanation engine */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="dashboard-card-title">
            <span>XAI EXPLANATION ENGINE</span>
            <span style={{ color: 'var(--solar-orange)', fontSize: '10px' }}>COGNITIVE INTERPRETER</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px', flexGrow: 1 }}>
            
            <div style={{ background: 'rgba(5, 6, 8, 0.4)', border: '1px solid rgba(255, 138, 0, 0.08)', padding: '12px 14px', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--solar-gold)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Trigger Evidence</div>
              <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                {explainability.triggerEvidence.map((ev, i) => <li key={i}>{ev}</li>)}
              </ul>
              {/* Green sparkline background inside card */}
              <div style={{ height: '14px', marginTop: '8px', opacity: 0.4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.slice(-10)}>
                    <Line type="monotone" dataKey="soft_xray_counts" stroke="var(--health-green)" strokeWidth={1} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'rgba(5, 6, 8, 0.4)', border: '1px solid rgba(255, 138, 0, 0.08)', padding: '12px 14px', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--cyan-telemetry)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Supporting Evidence</div>
              <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                {explainability.supportingEvidence.map((ev, i) => <li key={i}>{ev}</li>)}
              </ul>
              {/* Cyan sparkline background */}
              <div style={{ height: '14px', marginTop: '8px', opacity: 0.4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.slice(-10)}>
                    <Line type="monotone" dataKey="hard_xray_counts" stroke="var(--cyan-telemetry)" strokeWidth={1} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Feature Importance Metrics</div>
              <ExplanationBar factors={explainability.featureContributions} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Panels Row Grid (Alerts, Solar Wind waves, Kp Dial, Probability AreaChart) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1.2fr',
        gap: '20px'
      }}>
        {/* Latest Alerts */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">
            <span>Latest Alerts</span>
            <span className="nav-badge" style={{ padding: '1px 4px' }}>{activeAlerts.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', height: '100px', overflowY: 'auto' }}>
            {activeAlerts.length > 0 ? (
              activeAlerts.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: '6px', fontSize: '11.5px', fontFamily: 'Share Tech Mono', borderBottom: '1px solid rgba(255, 138, 0, 0.03)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--alert-red)' }}>●</span>
                  <span style={{ color: '#f8fafc', flexGrow: 1 }}>{a.phase}: {a.severity}</span>
                  <span style={{ color: '#64748b' }}>{new Date(a.timestamp * 1000).toISOString().substring(14, 19)}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', paddingTop: '20px' }}>No unacknowledged alerts.</div>
            )}
          </div>
        </div>

        {/* Solar Wind conditions */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">
            <span>Solar Wind Conditions</span>
            <span style={{ color: 'var(--health-green)', fontSize: '10px' }}>● Live</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontFamily: 'Share Tech Mono, monospace' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>412</div>
                <div style={{ fontSize: '8.5px', color: '#64748b' }}>km/s</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>6.3</div>
                <div style={{ fontSize: '8.5px', color: '#64748b' }}>p/cc</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>3.1</div>
                <div style={{ fontSize: '8.5px', color: '#64748b' }}>nT</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--solar-orange)' }}>-1.2</div>
                <div style={{ fontSize: '8.5px', color: '#64748b' }}>Bz</div>
              </div>
            </div>
            {/* Animated Wave visualizer */}
            <SolarWindWaves />
          </div>
        </div>

        {/* Geomagnetic Kp Forecast */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">Geomagnetic Forecast (Kp)</div>
          <div style={{ marginTop: '8px' }}>
            <GeomagneticForecast phase={currentPhase} />
          </div>
        </div>

        {/* Real-time flare probability AreaChart */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">
            <span>Real-time Flare Probability</span>
            <span style={{ color: 'var(--solar-gold)' }}>
              {latestPoint ? `${Math.round(latestPoint.forecast_probability)}%` : '0%'}
            </span>
          </div>
          <div style={{ height: '90px', marginTop: '8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.slice(-30)} margin={{ top: 5, right: 0, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGlowRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--solar-orange)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--solar-orange)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" hide={true} />
                <YAxis hide={true} domain={[0, 100]} />
                <Area type="monotone" dataKey="forecast_probability" stroke="var(--solar-orange)" fillOpacity={1} fill="url(#areaGlowRed)" strokeWidth={1.8} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. LiveDataView
// ==========================================
interface LiveDataViewProps {
  chartData: LightCurvePoint[];
  detectorHealth: DetectorHealth;
}

export const LiveDataView: React.FC<LiveDataViewProps> = ({ chartData, detectorHealth }) => {
  const latest = chartData[chartData.length - 1] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SpaceX / Aircraft Cockpit Telemetry display row */}
      <div className="telemetry-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="metric-card active-cyan">
          <div className="metric-card-header">
            <span>Solar Wind Speed</span>
            <Waves size={14} />
          </div>
          <div className="metric-val-main">412.5 km/s</div>
          <div className="metric-details-row">
            <span>Baseline: 400 km/s</span>
            <span style={{ color: 'var(--health-green)' }}>▲ 3.1%</span>
          </div>
        </div>

        <div className="metric-card active-gold">
          <div className="metric-card-header">
            <span>Proton Flux (10 MeV)</span>
            <Zap size={14} />
          </div>
          <div className="metric-val-main">0.85 pfu</div>
          <div className="metric-details-row">
            <span>Status: Quiet</span>
            <span style={{ color: 'var(--health-green)' }}>Nominal</span>
          </div>
        </div>

        <div className="metric-card active-cyan">
          <div className="metric-card-header">
            <span>X-Ray Intensity</span>
            <Activity size={14} />
          </div>
          <div className="metric-val-main">
            {latest ? Math.round(latest.soft_xray_counts) : '---'} c/s
          </div>
          <div className="metric-details-row">
            <span>SoLEXS (2-22 keV)</span>
            <span style={{ color: 'var(--solar-gold)' }}>Live Link</span>
          </div>
        </div>

        <div className="metric-card active-gold">
          <div className="metric-card-header">
            <span>Detector Agreement</span>
            <Cpu size={14} />
          </div>
          <div className="metric-val-main">
            {detectorHealth.agreement_score}%
          </div>
          <div className="metric-details-row">
            <span>Confidence index</span>
            <span style={{ color: 'var(--health-green)' }}>Matched</span>
          </div>
        </div>
      </div>

      {/* Main Charts View */}
      <div className="dashboard-card">
        <div className="dashboard-card-title">ARKA FLUX OBSERVATIONS (SoLEXS & HEL1OS SPECTROMETERS)</div>
        <div style={{ height: '480px', marginTop: '16px' }}>
          {chartData.length > 0 ? (
            <LineChartPanel data={chartData} />
          ) : (
            <div className="empty-state">Waiting for streaming telemetry data...</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. NowcastingView
// ==========================================
interface NowcastingViewProps {
  latestPoint: LightCurvePoint | null;
}

export const NowcastingView: React.FC<NowcastingViewProps> = ({ latestPoint }) => {
  const currentPhase = latestPoint?.nowcast_phase || 'Quiet';

  // Define scientific explanations based on phase
  const getScientificExplanation = (phase: string) => {
    switch (phase) {
      case 'Quiet':
        return {
          title: "Photospheric Magnetic Flux Stable",
          physics: "The quiet sun exhibits nominal thermal emission. Soft X-ray fluxes (SoLEXS 2.8–6 keV) hover near baseline levels. Hard X-ray rates (HEL1OS 10–150 keV) remain quiet. Neupert relation is satisfied within standard margins, and spectral autoencoder reconstruction scores show no anomaly (<1.2σ). No pre-flare Quasi-Periodic Pulsations (QPP) detected.",
          indicators: {
            hardness: "0.12 (Nominal)",
            neupert: "Satisfied (0.01 deviation)",
            qpp: "No oscillations detected",
            rqa: "Laminarity: 0.15, DET: 22%",
            autoencoder: "0.45σ (Nominal)",
            cycle: "Solar Cycle 25 Phase: Peak Maximum (Expected base rate: 2.1 flares/day)"
          }
        };
      case 'Pre-Flare':
        return {
          title: "Coronal Plasma Thermal Pre-Heating Active",
          physics: "Localized pre-flare thermal heating detected in the transition region. The Spectral Hardness Ratio has surged by +45% (indicating plasma heating up to 15MK) prior to any significant total count-rate threshold crossing. Quasi-Periodic Pulsations (QPP) have been captured via Lomb-Scargle periodogram with a dominant period of 45 seconds. Spectral autoencoder reconstruction error is elevated (>2.2σ) in the soft band.",
          indicators: {
            hardness: "2.42 (High)",
            neupert: "Anomalous pre-heating deviation (+0.14)",
            qpp: "Active oscillation (45s period)",
            rqa: "Laminarity: 0.74, DET: 62% (Phase transition warning)",
            autoencoder: "2.35σ (Critical)",
            cycle: "Solar Cycle 25 Phase: Peak Maximum (High localized flux density)"
          }
        };
      case 'Initiation':
        return {
          title: "Magnetic Reconnection Triggered",
          physics: "Accelerated non-thermal electrons are dumping energy into the lower chromosphere. A severe Neupert Effect violation is observed: the derivative of soft flux significantly exceeds the HEL1OS hard X-ray signature, indicating rapid non-thermal particle bombardment. Recurrence Quantification Analysis (RQA) shows laminarity and determinism approaching phase-transition critical states.",
          indicators: {
            hardness: "3.11 (Severe)",
            neupert: "NEUPERT VIOLATION (+0.84 deviation)",
            qpp: "Active oscillation (35s period)",
            rqa: "Laminarity: 0.88, DET: 84% (Phase transition active)",
            autoencoder: "3.62σ (Severe)",
            cycle: "Solar Cycle 25 Phase: Peak Maximum (Severe magnetic strain)"
          }
        };
      case 'Rise':
        return {
          title: "Thermal Energy Dump Phase",
          physics: "Collapsing magnetic reconnection arches are dumping thermal and non-thermal energy. The large-aperture detector SDD1 count rate has exceeded 10^5 c/s (saturation threshold), triggering automatic detector switching to the small-aperture SDD2. High-energy HEL1OS channels show rapid flux gains. Expected warning lead time is 12-18 minutes.",
          indicators: {
            hardness: "4.55 (Extreme)",
            neupert: "Neupert scaling active",
            qpp: "High-frequency drift (18s period)",
            rqa: "Laminarity: 0.94, DET: 91% (Highly deterministic)",
            autoencoder: "5.12σ (Extreme)",
            cycle: "Solar Cycle 25 Phase: Peak Maximum (Maximum flux production)"
          }
        };
      case 'Peak':
        return {
          title: "Maximum Solar Flare Output",
          physics: "Peak flare emission achieved. The soft X-ray and hard X-ray flux profiles are at maximum. SXR/HXR flux ratio indicates extreme plasma temperatures. All safety indicators are maxed out. Asymmetric cost-loss models advise maximum warning level deployment to the ground power networks and orbital satellites.",
          indicators: {
            hardness: "5.80 (Peak)",
            neupert: "Neupert peak alignment",
            qpp: "Harmonic damping active",
            rqa: "Laminarity: 0.98, DET: 95% (Maximum state ordering)",
            autoencoder: "6.80σ (Maxed Out)",
            cycle: "Solar Cycle 25 Phase: Peak Maximum (Active eruptive cycle)"
          }
        };
      case 'Decay':
        return {
          title: "Post-Flare Loop Cooling",
          physics: "Thermal energy is radiating away, and the plasma loop temperature is gradually dropping. Reconnection points have dissipated. SXR counts are decaying exponentially. Hard X-ray fluxes have returned to baseline, but soft thermal emission continues to subside slowly.",
          indicators: {
            hardness: "1.85 (Decreasing)",
            neupert: "Residual decay scaling",
            qpp: "Oscillation decayed",
            rqa: "Laminarity: 0.45, DET: 48% (System relaxation)",
            autoencoder: "1.90σ (Subsided)",
            cycle: "Solar Cycle 25 Phase: Peak Maximum"
          }
        };
      case 'Recovery':
        return {
          title: "Post-Flare System Stabilization",
          physics: "Active regions are returning to magnetic quietude. Minor residual plasma heating continues to disperse. Detectors have recalibrated baseline indices. Wavelet transform confirms dissipation of non-thermal spikes.",
          indicators: {
            hardness: "0.22 (Cooling)",
            neupert: "Satisfied",
            qpp: "Inactive",
            rqa: "Laminarity: 0.18, DET: 25% (Stable noise)",
            autoencoder: "0.68σ (Nominal)",
            cycle: "Solar Cycle 25 Phase: Peak Maximum"
          }
        };
      default:
        return {
          title: "Observation Baseline Status",
          physics: "Nominal scientific metrics. Telemetry streaming secure.",
          indicators: {
            hardness: "---",
            neupert: "---",
            qpp: "---",
            rqa: "---",
            autoencoder: "---",
            cycle: "---"
          }
        };
    }
  };

  const getOperationalProtocol = (phase: string) => {
    switch (phase) {
      case 'Quiet':
      case 'Recovery':
        return [
          { label: "Nominal telemetry health tracking (SoLEXS, HEL1OS, SUIT)", status: "COMPLETED", color: 'var(--health-green)' },
          { label: "Nominal cryogenic cooling system operation at -20°C", status: "COMPLETED", color: 'var(--health-green)' },
          { label: "Observe Solar Cycle 25 active region coordinates", status: "COMPLETED", color: 'var(--health-green)' },
          { label: "Clear temporary logs and warning dispatch buffers", status: "COMPLETED", color: 'var(--health-green)' }
        ];
      case 'Pre-Flare':
      case 'Initiation':
        return [
          { label: "Elevate Command status to ALERT STAGE-1 (Yellow indicator)", status: "REQUIRED", color: 'var(--solar-gold)' },
          { label: "Pre-stage spacecraft payload computer backup registers", status: "REQUIRED", color: 'var(--solar-gold)' },
          { label: "Switch SDD1 filter wheel to High Attenuation aperture mode", status: "REQUIRED", color: 'var(--solar-gold)' },
          { label: "Issue early warning dispatch to NETRA Situational Awareness", status: "REQUIRED", color: 'var(--solar-gold)' }
        ];
      case 'Rise':
      case 'Peak':
        return [
          { label: "ACTIVATE EMERGENCY RESPONSE: PAYLOAD SHUTTERS (CLOSE)", status: "CRITICAL", color: 'var(--alert-red)' },
          { label: "Orient Aditya-L1 solar arrays parallel to incoming coronal vector", status: "CRITICAL", color: 'var(--alert-red)' },
          { label: "Auto-promote HEL1OS and small-aperture SDD2 telemetry pathways", status: "CRITICAL", color: 'var(--alert-red)' },
          { label: "Transmit alert warning codes to PGCIL national substation grids", status: "CRITICAL", color: 'var(--alert-red)' },
          { label: "Broadcast High Frequency (HF) regional communication blackout logs", status: "CRITICAL", color: 'var(--alert-red)' }
        ];
      case 'Decay':
        return [
          { label: "Perform detector post-eruption calibration sweeps", status: "RECOVERY", color: 'var(--cyan-telemetry)' },
          { label: "Switch SDD1 aperture back to nominal measurement indices", status: "RECOVERY", color: 'var(--cyan-telemetry)' },
          { label: "Log peak flare flux magnitude (X/M Class) and duration values", status: "RECOVERY", color: 'var(--cyan-telemetry)' },
          { label: "Monitor Geomagnetic Induced Currents (GIC) on ground transformers", status: "RECOVERY", color: 'var(--cyan-telemetry)' }
        ];
      default:
        return [];
    }
  };

  const getPhysicsBreakdown = (phase: string) => {
    switch (phase) {
      case 'Quiet':
      case 'Recovery':
        return {
          why: "Active magnetic regions are in a stable potential configuration. Magnetic shear and flux cancellation are low, keeping coronal magnetic loops locked and stable.",
          afterAction: "Maintain nominal instrument tracking. Monitor standard solar wind speeds and localized active regions for new flux emergence."
        };
      case 'Pre-Flare':
        return {
          why: "Flux emergence from the convection zone is shearing the existing active region magnetic field. This shears helical flux ropes and stores magnetic free energy.",
          afterAction: "Calibrate instrument filters. Establish early alert status with regional space weather forecasting bureaus (e.g., NETRA)."
        };
      case 'Initiation':
        return {
          why: "Sheared magnetic loop arches trigger localized instability, initiating reconnection at a coronal null-point. Non-thermal electrons are accelerated downward.",
          afterAction: "Switch SDD1 filter wheel to high-attenuation mode. Pre-stage payload computers into backup register modes to handle particle spikes."
        };
      case 'Rise':
        return {
          why: "Rapid reconnection of magnetic loop arches releases high quantities of energy. Non-thermal electrons bombard the chromosome, driving chromospheric evaporation.",
          afterAction: "Deploy physical shutters on SUIT UV telescope. Isolate spacecraft battery chargers to prevent solar proton surges."
        };
      case 'Peak':
        return {
          why: "Reconnection rate peaks, accelerating ions to relativistic speeds. Post-flare loops reach extreme temperatures (>20 MK), releasing peak X-ray and CME flux.",
          afterAction: "Close all primary payload shutters. Align solar arrays parallel to velocity vectors. Issue national grid reactive power and GIC warning codes."
        };
      case 'Decay':
        return {
          why: "Reconnected loops relax and cool via thermal conduction and radiative losses. The energy supply from reconnection ceases, leading to exponential flux decay.",
          afterAction: "Perform post-eruption calibration sweeps. Sweep ground magnetometers for Geomagnetic Induced Currents (GIC) indicators."
        };
      default:
        return {
          why: "Solar state monitoring active. Background magnetic flux in steady state.",
          afterAction: "Observe payload and telecommunications parameters."
        };
    }
  };

  const explanation = getScientificExplanation(currentPhase);
  const protocols = getOperationalProtocol(currentPhase);
  const physicsBreakdown = getPhysicsBreakdown(currentPhase);

  // Check for detector saturation state from counts
  const softCounts = latestPoint?.soft_xray_counts || 0;
  const isSaturated = softCounts > 100000; // 10^5 counts/s saturation threshold

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top timeline status */}
      <div className="dashboard-card">
        <div className="dashboard-card-title">SOLAR TRANSITION TIMELINE STATUS</div>
        <PhaseTimeline currentPhase={currentPhase} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        {/* Left Column: Stats & Gradients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="dashboard-card">
            <div className="dashboard-card-title">NOWCAST CLASSIFIER MATRIX</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', fontFamily: 'Share Tech Mono, monospace' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 138, 0, 0.05)', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Active State Class</span>
                <strong style={{ color: 'var(--solar-orange)', fontSize: '15px' }}>{currentPhase.toUpperCase()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 138, 0, 0.05)', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Trigger Confidence Index</span>
                <strong style={{ color: 'var(--solar-gold)' }}>{latestPoint ? latestPoint.confidence : '---'}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 138, 0, 0.05)', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Estimated Alert Severity</span>
                <strong className={`sev-${latestPoint?.alert_level.toLowerCase()}`}>{latestPoint ? latestPoint.alert_level : 'Quiet'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 138, 0, 0.05)', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Signal Deviation (SoLEXS)</span>
                <strong style={{ color: 'var(--cyan-telemetry)' }}>{latestPoint ? latestPoint.soft_std.toFixed(2) : '---'}σ</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-title">GRADIENT ACCELERATION RADAR</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', fontFamily: 'Share Tech Mono, monospace' }}>
              <div style={{
                background: 'rgba(5, 6, 8, 0.4)',
                border: '1px solid rgba(255, 138, 0, 0.1)',
                padding: '10px 12px',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--solar-gold)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Soft X-Ray Gradient (SoLEXS)</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--cyan-telemetry)' }}>
                  {latestPoint ? `${latestPoint.soft_gradient.toFixed(2)} c/s²` : '---'}
                </div>
              </div>
              <div style={{
                background: 'rgba(5, 6, 8, 0.4)',
                border: '1px solid rgba(255, 138, 0, 0.1)',
                padding: '10px 12px',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--solar-gold)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Hard X-Ray Gradient (HEL1OS)</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--solar-gold)' }}>
                  {latestPoint ? `${latestPoint.hard_gradient.toFixed(2)} c/s²` : '---'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Saturation & Physics metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="dashboard-card">
            <div className="dashboard-card-title">SDD1 DETECTOR SATURATION STATE MACHINE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', fontFamily: 'Share Tech Mono, monospace' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: isSaturated ? 'rgba(239, 68, 68, 0.1)' : 'rgba(74, 222, 128, 0.05)',
                border: isSaturated ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(74, 222, 128, 0.2)',
                borderRadius: '4px'
              }}>
                <span>SDD1 Aperture State:</span>
                <strong style={{ color: isSaturated ? 'var(--alert-red)' : 'var(--health-green)' }}>
                  {isSaturated ? 'SATURATED (>10⁵ c/s)' : 'NOMINAL'}
                </strong>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: isSaturated ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                border: isSaturated ? '1px solid var(--health-green)' : '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '4px'
              }}>
                <span>Active Data Line:</span>
                <strong style={{ color: isSaturated ? 'var(--health-green)' : 'var(--cyan-telemetry)' }}>
                  {isSaturated ? 'SDD2 (SMALL APERTURE)' : 'SDD1 (LARGE APERTURE)'}
                </strong>
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', lineHeight: '1.4' }}>
                *Automatic hardware promotion mitigates sensor blinding when X-ray flux exceeds the large-aperture limit of the silicon drift detectors.
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-title">PHYSICS-INFORMED TELEMETRY MATRIX</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', fontFamily: 'Share Tech Mono, monospace', fontSize: '11.5px' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
                <div style={{ color: '#64748b' }}>Hardness Ratio</div>
                <strong style={{ color: 'var(--solar-orange)' }}>{explanation.indicators.hardness}</strong>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
                <div style={{ color: '#64748b' }}>Neupert Effect</div>
                <strong style={{ color: 'var(--cyan-telemetry)' }}>{explanation.indicators.neupert}</strong>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
                <div style={{ color: '#64748b' }}>QPP Period</div>
                <strong style={{ color: 'var(--solar-gold)' }}>{explanation.indicators.qpp}</strong>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
                <div style={{ color: '#64748b' }}>Autoencoder Anomaly</div>
                <strong style={{ color: 'var(--alert-red)' }}>{explanation.indicators.autoencoder}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Scientific Diagnostics & Preventative Protocols */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        {/* Left Card: Scientific Explanations */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>SCIENTIFIC DIAGNOSTICS & PHASES EXPLANATION</span>
          </div>
          <div style={{ 
            fontFamily: 'Share Tech Mono, monospace', 
            fontSize: '13px', 
            lineHeight: '1.6', 
            color: '#e2e8f0', 
            background: 'rgba(5, 6, 8, 0.4)', 
            border: '1px solid rgba(255, 138, 0, 0.1)', 
            padding: '16px', 
            borderRadius: '4px',
            flexGrow: 1
          }}>
            <h4 style={{ color: 'var(--solar-gold)', margin: '0 0 8px 0', fontSize: '14px', borderBottom: '1px solid rgba(255,138,0,0.1)', paddingBottom: '4px', textTransform: 'uppercase' }}>
              {explanation.title}
            </h4>
            <p style={{ margin: 0, color: '#cbd5e1' }}>
              {explanation.physics}
            </p>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              {explanation.indicators.cycle}
            </div>
            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--solar-gold)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Why Flare Occurred (Physics Trigger):</div>
              <div style={{ color: '#cbd5e1', fontSize: '12px', lineHeight: '1.5' }}>{physicsBreakdown.why}</div>
            </div>
          </div>
        </div>

        {/* Right Card: Mission Action Checklist */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="dashboard-card-title">MISSION PREVENTATIVE PROTOCOLS & ACTION CHECKLIST</div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px', 
            marginTop: '8px', 
            fontFamily: 'Share Tech Mono, monospace',
            flexGrow: 1
          }}>
            {protocols.map((proto, idx) => (
              <div 
                key={idx} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: proto.color }}>●</span>
                  <span style={{ color: '#cbd5e1' }}>{proto.label}</span>
                </div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  backgroundColor: `${proto.color}15`,
                  color: proto.color,
                  border: `1px solid ${proto.color}33`,
                  letterSpacing: '0.5px'
                }}>
                  {proto.status}
                </span>
              </div>
            ))}
            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--cyan-telemetry)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Precautionary After-Action Protocols:</div>
              <div style={{ color: '#cbd5e1', fontSize: '12px', lineHeight: '1.5' }}>{physicsBreakdown.afterAction}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. ForecastingView
// ==========================================
interface ForecastingViewProps {
  forecast: {
    prob_10m: number;
    prob_20m: number;
    prob_30m: number;
    prob_60m: number;
    lead_time_est_min: number;
    confidence: number;
    explanation: string;
  };
  explainability: ExplainabilityData;
}

export const ForecastingView: React.FC<ForecastingViewProps> = ({ forecast, explainability }) => {
  // Convert forecast probabilities to Recharts array
  const forecastChartData = [
    { name: '+10 Min', probability: forecast.prob_10m },
    { name: '+20 Min', probability: forecast.prob_20m },
    { name: '+30 Min', probability: forecast.prob_30m },
    { name: '+60 Min', probability: forecast.prob_60m },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '20px'
      }}>
        {/* Flare Probability Histogram */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">TEMPORAL FLARE PROBABILITY PROJECTIONS</div>
          <div style={{ height: '260px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 138, 0, 0.05)" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'Share Tech Mono' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'Share Tech Mono' }} domain={[0, 100]} />
                <Bar 
                  dataKey="probability" 
                  fill="var(--solar-orange)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Time Metrics */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="dashboard-card-title">FORECASTER INTELLIGENCE COEFFICIENTS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px', fontFamily: 'Share Tech Mono, monospace' }}>
            <div style={{
              background: 'rgba(5, 6, 8, 0.4)',
              border: '1px solid rgba(255, 138, 0, 0.1)',
              padding: '14px',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Estimated Lead Time Window</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--solar-gold)' }}>
                {forecast.lead_time_est_min > 0 ? `${forecast.lead_time_est_min} MINUTES` : 'IMMEDIATE / ONGOING'}
              </div>
            </div>
            <div style={{
              background: 'rgba(5, 6, 8, 0.4)',
              border: '1px solid rgba(255, 138, 0, 0.1)',
              padding: '14px',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Ensemble Algorithm Confidence</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--cyan-telemetry)' }}>
                {forecast.confidence}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-title">ENSEMBLE PREDICTIONS EXPLANATION SUMMARY</div>
        <p style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '13px',
          color: '#cbd5e1',
          lineHeight: '1.6',
          margin: '8px 0 0 0'
        }}>
          {forecast.explanation} {explainability.recommendation}
        </p>
      </div>
    </div>
  );
};

// ==========================================
// 5. HistoricalReplayView
// ==========================================
interface HistoricalReplayViewProps {
  currentScenario: string;
  onScenarioChange: (scenario: string) => void;
  chartData: LightCurvePoint[];
}

export const HistoricalReplayView: React.FC<HistoricalReplayViewProps> = ({
  currentScenario: _currentScenario,
  onScenarioChange: _onScenarioChange,
  chartData
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="dashboard-card">
        <div className="dashboard-card-title">SCENARIO EVENT RECORDER</div>
        <div style={{ height: '480px', marginTop: '16px' }}>
          {chartData.length > 0 ? (
            <LineChartPanel data={chartData} />
          ) : (
            <div className="empty-state">No scenario telemetry active in replay buffer.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. ModelAnalyticsView
// ==========================================
interface ModelAnalyticsViewProps {
  metrics: any;
}

export const ModelAnalyticsView: React.FC<ModelAnalyticsViewProps> = ({ metrics: _metrics }) => {
  // Calibration data points (Isotonic Regression vs Ideal)
  const calibrationData = [
    { name: '0%', Observed: 0, Ideal: 0 },
    { name: '10%', Observed: 9.8, Ideal: 10 },
    { name: '20%', Observed: 21.2, Ideal: 20 },
    { name: '35%', Observed: 34.1, Ideal: 35 },
    { name: '50%', Observed: 48.8, Ideal: 50 },
    { name: '65%', Observed: 66.4, Ideal: 65 },
    { name: '80%', Observed: 79.5, Ideal: 80 },
    { name: '90%', Observed: 91.2, Ideal: 90 },
    { name: '100%', Observed: 100, Ideal: 100 }
  ];

  // Degradation curve data points
  const degradationData = [
    { name: '10m', PRAUC: 0.98 },
    { name: '30m', PRAUC: 0.96 },
    { name: '1h', PRAUC: 0.91 },
    { name: '2h', PRAUC: 0.84 },
    { name: '6h', PRAUC: 0.72 },
    { name: '12h', PRAUC: 0.58 },
    { name: '24h', PRAUC: 0.44 }
  ];

  const ablationData = [
    { group: 'Group A (Raw Ingested Counts Only)', prauc: '0.825', delta: 'Baseline' },
    { group: 'Group B (SoLEXS PI Spectrum Hardness Ratio)', prauc: '0.892', delta: '+0.067' },
    { group: 'Group C (Neupert Residual + QPP Oscillations)', prauc: '0.941', delta: '+0.049' },
    { group: 'Group D (Takens\' Nonlinear RQA Metrics)', prauc: '0.958', delta: '+0.017' },
    { group: 'Group E (SILSO Sunspot Solar Cycle Context)', prauc: '0.965', delta: '+0.007' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ML Ops Telemetry Grid */}
      <div className="telemetry-row">
        <div className="metric-card active-cyan">
          <div className="metric-card-header">
            <span>Model Area Under ROC (AUC)</span>
            <Activity size={14} />
          </div>
          <div className="metric-val-main">0.965</div>
          <div className="metric-details-row">
            <span>Validation set</span>
            <span style={{ color: 'var(--health-green)' }}>Nominal</span>
          </div>
        </div>

        <div className="metric-card active-gold">
          <div className="metric-card-header">
            <span>Inference Latency</span>
            <Clock size={14} />
          </div>
          <div className="metric-val-main">84.2 ms</div>
          <div className="metric-details-row">
            <span>GPU load: 42%</span>
            <span style={{ color: 'var(--health-green)' }}>Stable</span>
          </div>
        </div>

        <div className="metric-card active-cyan">
          <div className="metric-card-header">
            <span>Brier Calibration Score</span>
            <Sliders size={14} />
          </div>
          <div className="metric-val-main">0.034</div>
          <div className="metric-details-row">
            <span>Lower is better</span>
            <span style={{ color: 'var(--health-green)' }}>Calibrated</span>
          </div>
        </div>

        <div className="metric-card active-gold">
          <div className="metric-card-header">
            <span>Model Drift Rate</span>
            <RefreshCw size={14} />
          </div>
          <div className="metric-val-main">0.02%</div>
          <div className="metric-details-row">
            <span>Last checked: 1h ago</span>
            <span style={{ color: 'var(--health-green)' }}>No drift</span>
          </div>
        </div>
      </div>

      {/* Row 2: Reliability Diagram & Forecast Degradation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        {/* Reliability Diagram */}
        <div className="dashboard-card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
          <div className="dashboard-card-title">PROBABILITY RELIABILITY DIAGRAM (CALIBRATION CURVE)</div>
          <div style={{ flexGrow: 1, marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calibrationData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#475569" style={{ fontSize: '10px', fontFamily: 'Share Tech Mono' }} />
                <YAxis domain={[0, 100]} stroke="#475569" style={{ fontSize: '10px', fontFamily: 'Share Tech Mono' }} />
                <Tooltip contentStyle={{ backgroundColor: '#050608', borderColor: 'rgba(255,138,0,0.2)', color: '#fff', fontFamily: 'Share Tech Mono' }} />
                <Line type="monotone" dataKey="Ideal" stroke="#475569" strokeDasharray="5 5" dot={false} strokeWidth={1} name="Perfect Calibration" />
                <Line type="monotone" dataKey="Observed" stroke="var(--cyan-telemetry)" strokeWidth={2} dot={{ r: 3 }} name="Isotonic Calibrated" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forecast Degradation Curve */}
        <div className="dashboard-card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
          <div className="dashboard-card-title">FORECAST HORIZON DEGRADATION CURVE (PR-AUC)</div>
          <div style={{ flexGrow: 1, marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={degradationData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#475569" style={{ fontSize: '10px', fontFamily: 'Share Tech Mono' }} />
                <YAxis domain={[0.4, 1.0]} stroke="#475569" style={{ fontSize: '10px', fontFamily: 'Share Tech Mono' }} />
                <Tooltip contentStyle={{ backgroundColor: '#050608', borderColor: 'rgba(255,138,0,0.2)', color: '#fff', fontFamily: 'Share Tech Mono' }} />
                <Line type="monotone" dataKey="PRAUC" stroke="var(--solar-gold)" strokeWidth={2} dot={{ r: 4 }} name="Forecast PR-AUC" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Confusion Matrix & Ablation study */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: '20px'
      }}>
        {/* Confusion Matrix */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="dashboard-card-title">CONFUSION MATRIX (HISTORICAL VALIDATION SPLIT)</div>
            <div className="metrics-table-wrapper" style={{ marginTop: '16px' }}>
              <table className="metrics-table" style={{ border: '1px solid rgba(255, 138, 0, 0.15)' }}>
                <thead>
                  <tr>
                    <th style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#64748b' }}>Actual \ Predicted</th>
                    <th>Predicted Flare</th>
                    <th>Predicted Quiet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: 'var(--solar-gold)' }}>Actual Flare Event</td>
                    <td style={{ backgroundColor: 'rgba(64, 255, 122, 0.05)', color: 'var(--health-green)', fontWeight: 'bold', textAlign: 'center' }}>38 (TP)</td>
                    <td style={{ backgroundColor: 'rgba(255, 59, 48, 0.05)', color: 'var(--alert-red)', fontWeight: 'bold', textAlign: 'center' }}>2 (FN)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', color: 'var(--solar-gold)' }}>Actual Quiet State</td>
                    <td style={{ backgroundColor: 'rgba(255, 59, 48, 0.05)', color: 'var(--alert-red)', fontWeight: 'bold', textAlign: 'center' }}>1 (FP)</td>
                    <td style={{ backgroundColor: 'rgba(64, 255, 122, 0.05)', color: 'var(--health-green)', fontWeight: 'bold', textAlign: 'center' }}>359 (TN)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: '14px', fontSize: '11px', color: '#64748b', fontFamily: 'Share Tech Mono, monospace', lineHeight: '1.4' }}>
            *Metrics based on 400 test cross-calibrated flare periods representing temporal split event-based validation.
          </div>
        </div>

        {/* Feature Group Ablation Study Table */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">FEATURE GROUP ABLATION STUDY INCREMENTAL METRICS</div>
          <div className="metrics-table-wrapper" style={{ marginTop: '16px' }}>
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Feature Group Configuration</th>
                  <th>Validation PR-AUC</th>
                  <th>Incremental Gains</th>
                </tr>
              </thead>
              <tbody>
                {ablationData.map((abl, index) => (
                  <tr key={index}>
                    <td style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px' }}>{abl.group}</td>
                    <td style={{ fontFamily: 'Share Tech Mono, monospace', fontWeight: 'bold', color: '#fff' }}>{abl.prauc}</td>
                    <td style={{ fontFamily: 'Share Tech Mono, monospace', fontWeight: 'bold', color: index === 0 ? '#64748b' : 'var(--health-green)' }}>
                      {abl.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. DetectorHealthView
// ==========================================
interface DetectorHealthViewProps {
  detectorHealth: DetectorHealth;
}

export const DetectorHealthView: React.FC<DetectorHealthViewProps> = ({ detectorHealth }) => {
  const detectors = [
    { name: 'SoLEXS', desc: 'Solar Low Energy X-ray Spectrometer', role: 'Soft X-Ray counts (2-22 keV)' },
    { name: 'HEL1OS', desc: 'High Energy L1 Orbiting Spectrometer', role: 'Hard X-Ray counts (10-150 keV)' },
    { name: 'SUIT', desc: 'Solar Ultraviolet Imaging Telescope', role: 'Active solar disk tracking' },
    { name: 'ASPEX', desc: 'Aditya Solar wind Particle Experiment', role: 'Proton/Alpha flux counts' },
    { name: 'PAPA', desc: 'Plasma Analyser Package for Aditya', role: 'Electron density evaluation' },
    { name: 'MAG', desc: 'L1 Fluxgate Magnetometer', role: 'Interplanetary Magnetic field' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px'
      }}>
        {detectors.map((det, index) => {
          // Mock some variations for other payload channels
          const isMain = det.name === 'SoLEXS' || det.name === 'HEL1OS';
          const score = isMain ? detectorHealth.overall_score : 98;
          const status = score >= 90 ? 'NOMINAL' : (score >= 60 ? 'DEGRADED' : 'FAILING');
          const color = score >= 90 ? 'var(--health-green)' : (score >= 60 ? 'var(--solar-gold)' : 'var(--alert-red)');

          return (
            <div 
              key={index} 
              className="dashboard-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                fontFamily: 'Share Tech Mono, monospace'
              }}
            >
              {/* Circular health score bar */}
              <div style={{
                position: 'relative',
                width: '64px', height: '64px',
                borderRadius: '50%',
                border: `3px solid rgba(255, 138, 0, 0.05)`,
                borderTopColor: color,
                borderRightColor: color,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: `0 0 10px ${color}10`
              }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>{score}%</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '15px', color: '#fff', letterSpacing: '0.5px' }}>{det.name}</strong>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '2px', backgroundColor: `${color}15`, color: color, border: `1px solid ${color}33` }}>
                    {status}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{det.desc}</div>
                <div style={{ fontSize: '10px', color: 'var(--cyan-telemetry)', marginTop: '2px' }}>{det.role}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 8. AlertsView
// ==========================================
interface AlertsViewProps {
  alerts: AlertEvent[];
  onAcknowledgeAlert: (id: string) => void;
  onEscalateAlert: (id: string) => void;
  onSuppressAlert: (id: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onAcknowledgeAlert,
  onEscalateAlert,
  onSuppressAlert
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="dashboard-card">
        <div className="dashboard-card-title">MISSIONS ALERTS AUDITING FEEDS</div>
        <div className="metrics-table-wrapper" style={{ marginTop: '16px' }}>
          {alerts.length > 0 ? (
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Transient Type</th>
                  <th>Severity</th>
                  <th>Confidence</th>
                  <th>Alert Dispatch Log Message</th>
                  <th>Status</th>
                  <th>Console Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(alert => {
                  const severityClass = `sev-${alert.severity.toLowerCase()}`;
                  
                  return (
                    <tr key={alert.id}>
                      <td style={{ fontFamily: 'Share Tech Mono' }}>
                        {new Date(alert.timestamp * 1000).toISOString().substring(11, 19)} UTC
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{alert.phase}</td>
                      <td className={severityClass} style={{ fontWeight: 'bold' }}>{alert.severity}</td>
                      <td style={{ fontFamily: 'Share Tech Mono' }}>{alert.confidence}%</td>
                      <td>{alert.message}</td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: alert.status === 'New' ? 'var(--alert-red)' : (alert.status === 'Acknowledged' ? 'var(--solar-gold)' : '#64748b'),
                          textTransform: 'uppercase'
                        }}>
                          {alert.status}
                        </span>
                      </td>
                      <td>
                        {alert.status === 'New' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              className="btn-control" 
                              onClick={() => onAcknowledgeAlert(alert.id)}
                              style={{ padding: '3px 8px', fontSize: '10px' }}
                            >
                              ACK
                            </button>
                            <button 
                              className="btn-control" 
                              onClick={() => onEscalateAlert(alert.id)}
                              style={{ padding: '3px 8px', fontSize: '10px', borderColor: 'var(--alert-red)', color: 'var(--alert-red)' }}
                            >
                              ESCALATE
                            </button>
                            <button 
                              className="btn-control" 
                              onClick={() => onSuppressAlert(alert.id)}
                              style={{ padding: '3px 8px', fontSize: '10px', borderColor: '#475569', color: '#64748b' }}
                            >
                              SUPPRESS
                            </button>
                          </div>
                        )}
                        {alert.status !== 'New' && (
                          <span style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Audited</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No historical alarms captured in session logs.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 9. SettingsView
// ==========================================
interface SettingsViewProps {
  settings: SystemSettings;
  onSettingsChange: (settings: SystemSettings) => void;
  userRole: string;
  falseAlarmCost: number;
  setFalseAlarmCost: (c: number) => void;
  missedFlareCost: number;
  setMissedFlareCost: (c: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  settings, 
  onSettingsChange, 
  userRole,
  falseAlarmCost,
  setFalseAlarmCost,
  missedFlareCost,
  setMissedFlareCost
}) => {
  const handleSliderChange = (key: keyof SystemSettings, val: number) => {
    onSettingsChange({
      ...settings,
      [key]: val
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {userRole !== 'SysAdmin' && (
        <div style={{
          backgroundColor: 'rgba(255, 138, 0, 0.05)',
          border: '1px solid rgba(255, 138, 0, 0.25)',
          borderRadius: '4px',
          padding: '12px 16px',
          color: 'var(--solar-gold)',
          fontSize: '12.5px',
          fontFamily: 'Share Tech Mono, monospace',
          lineHeight: '1.5'
        }}>
          ⚠️ SYSTEM CONFIGURATION LOGGED: Operator '{userRole.toUpperCase()}' does not have Administrator privileges. Slider parameters are read-only.
        </div>
      )}

      <div className="dashboard-card">
        <div className="dashboard-card-title">SCIENTIFIC CONFIGURATIONS & ALGORITHMS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
          
          {/* Threshold sensitivity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Share Tech Mono, monospace' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>Threshold Sensitivity Factor (k-factor)</span>
              <span style={{ color: 'var(--solar-gold)' }}>{settings.thresholdSensitivity.toFixed(1)}σ</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Multiplier for baseline standard deviation trigger (default k=3.0)</div>
            <div className="control-slider-wrapper">
              <input 
                type="range" 
                min="2.0" 
                max="5.0" 
                step="0.1" 
                className="control-slider"
                value={settings.thresholdSensitivity}
                onChange={(e) => handleSliderChange('thresholdSensitivity', parseFloat(e.target.value))}
                disabled={userRole !== 'SysAdmin'}
              />
            </div>
          </div>

          {/* Baseline window size */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Share Tech Mono, monospace' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>Rolling Baseline Window Size</span>
              <span style={{ color: 'var(--solar-gold)' }}>{settings.baselineWindowSize}s</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Number of historical points used for average & deviation calculation</div>
            <div className="control-slider-wrapper">
              <input 
                type="range" 
                min="30" 
                max="120" 
                step="5" 
                className="control-slider"
                value={settings.baselineWindowSize}
                onChange={(e) => handleSliderChange('baselineWindowSize', parseInt(e.target.value))}
                disabled={userRole !== 'SysAdmin'}
              />
            </div>
          </div>

          {/* Chart Window Size */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Share Tech Mono, monospace' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>Chart Window Buffer Size</span>
              <span style={{ color: 'var(--solar-gold)' }}>{settings.chartWindowSize}s</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Number of concurrent telemetry points plotted on the charts</div>
            <div className="control-slider-wrapper">
              <input 
                type="range" 
                min="100" 
                max="500" 
                step="50" 
                className="control-slider"
                value={settings.chartWindowSize}
                onChange={(e) => handleSliderChange('chartWindowSize', parseInt(e.target.value))}
                disabled={userRole !== 'SysAdmin'}
              />
            </div>
          </div>

          {/* Detector weights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Share Tech Mono, monospace' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>Detector Ingestion Weighting (SoLEXS vs HEL1OS)</span>
              <span style={{ color: 'var(--solar-gold)' }}>{settings.detectorWeight.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Balance factor between soft and hard X-ray counts for model output</div>
            <div className="control-slider-wrapper">
              <input 
                type="range" 
                min="0.1" 
                max="0.9" 
                step="0.05" 
                className="control-slider"
                value={settings.detectorWeight}
                onChange={(e) => handleSliderChange('detectorWeight', parseFloat(e.target.value))}
                disabled={userRole !== 'SysAdmin'}
              />
            </div>
          </div>

          {/* Asymmetric Cost Matrix */}
          <div style={{ borderTop: '1px solid rgba(255, 138, 0, 0.1)', paddingTop: '20px', marginTop: '10px' }}>
            <div style={{ fontSize: '13px', color: 'var(--solar-gold)', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '14px', textTransform: 'uppercase' }}>
              Operational Asymmetric Cost Matrix Tuner
            </div>
            
            {/* False Alarm Cost */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Share Tech Mono, monospace' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>False Alarm Operational Cost Penalty</span>
                <span style={{ color: 'var(--solar-orange)' }}>{falseAlarmCost}x</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Cost penalty of triggering unnecessary safe-mode states (lost science time, power cycles)</div>
              <div className="control-slider-wrapper">
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1" 
                  className="control-slider"
                  value={falseAlarmCost}
                  onChange={(e) => setFalseAlarmCost(parseInt(e.target.value))}
                  disabled={userRole !== 'SysAdmin'}
                />
              </div>
            </div>

            {/* Missed Flare Cost */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Share Tech Mono, monospace' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>Missed Flare Critical Damage Penalty</span>
                <span style={{ color: 'var(--alert-red)' }}>{missedFlareCost}x</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Critical risk penalty of missing a major flare event (potential sensor burning, solar array destruction)</div>
              <div className="control-slider-wrapper">
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  step="1" 
                  className="control-slider"
                  value={missedFlareCost}
                  onChange={(e) => setMissedFlareCost(parseInt(e.target.value))}
                  disabled={userRole !== 'SysAdmin'}
                />
              </div>
            </div>

            {/* Cost-optimized result indicator */}
            <div style={{
              background: 'rgba(5, 6, 8, 0.6)',
              border: '1px solid rgba(255, 138, 0, 0.15)',
              padding: '12px 16px',
              borderRadius: '4px',
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '12.5px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#94a3b8' }}>Dynamic Optimized Alert Trigger Threshold:</span>
              <strong style={{ color: 'var(--health-green)', fontSize: '14px' }}>
                {((falseAlarmCost / (falseAlarmCost + missedFlareCost)) * 100).toFixed(1)}%
              </strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ==========================================
// 10. AuditLogView
// ==========================================
export interface AuditLogItem {
  id: number;
  timestamp: number;
  username: string;
  role: string;
  action: string;
  details: string;
}

interface AuditLogViewProps {
  auditLogs: AuditLogItem[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs }) => {
  const formatTime = (ts: number) => {
    return new Date(ts * 1000).toISOString().substring(0, 19).replace('T', ' ') + ' UTC';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="dashboard-card">
        <div className="dashboard-card-title">MISSION OPERATIONAL AUDIT COMMAND LOGS ({auditLogs.length})</div>
        <div className="metrics-table-wrapper" style={{ marginTop: '16px' }}>
          {auditLogs.length > 0 ? (
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Operator ID</th>
                  <th>Role</th>
                  <th>Command Action</th>
                  <th>Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => {
                  const roleColors: Record<string, string> = {
                    SysAdmin: 'var(--solar-gold)',
                    Officer: 'var(--solar-orange)',
                    Observer: 'var(--cyan-telemetry)'
                  };
                  const roleColor = roleColors[log.role] || '#94a3b8';

                  return (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'Share Tech Mono', fontSize: '12px' }}>{formatTime(log.timestamp)}</td>
                      <td style={{ fontWeight: 'bold', color: '#fff' }}>{log.username}</td>
                      <td>
                        <span className="risk-badge" style={{
                          color: roleColor,
                          background: `${roleColor}10`,
                          border: `1.5px solid ${roleColor}33`,
                          fontSize: '10px',
                          padding: '2px 6px'
                        }}>
                          {log.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--solar-gold)', fontWeight: '500' }}>{log.action}</td>
                      <td style={{ color: '#94a3b8', fontSize: '12px' }}>{log.details}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No audit logs recorded in database.</div>
          )}
        </div>
      </div>
    </div>
  );
};
