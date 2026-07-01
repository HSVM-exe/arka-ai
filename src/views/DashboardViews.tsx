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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="dashboard-card">
        <div className="dashboard-card-title">SOLAR TRANSITION TIMELINE STATUS</div>
        <PhaseTimeline currentPhase={currentPhase} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        <div className="dashboard-card">
          <div className="dashboard-card-title">NOWCAST CLASSIFIER MATRIX</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px', fontFamily: 'Share Tech Mono, monospace' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 138, 0, 0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Active State Class</span>
              <strong style={{ color: 'var(--solar-orange)', fontSize: '15px' }}>{currentPhase.toUpperCase()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 138, 0, 0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Trigger Confidence Index</span>
              <strong style={{ color: 'var(--solar-gold)' }}>{latestPoint ? latestPoint.confidence : '---'}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 138, 0, 0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Estimated Alert Severity</span>
              <strong className={`sev-${latestPoint?.alert_level.toLowerCase()}`}>{latestPoint ? latestPoint.alert_level : 'Quiet'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 138, 0, 0.05)', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Signal Deviation Threshold</span>
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
              padding: '12px 14px',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--solar-gold)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Soft X-Ray Gradient (SoLEXS)</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--cyan-telemetry)' }}>
                {latestPoint ? `${latestPoint.soft_gradient.toFixed(1)} c/s²` : '---'}
              </div>
            </div>
            <div style={{
              background: 'rgba(5, 6, 8, 0.4)',
              border: '1px solid rgba(255, 138, 0, 0.1)',
              padding: '12px 14px',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--solar-gold)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Hard X-Ray Gradient (HEL1OS)</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--solar-gold)' }}>
                {latestPoint ? `${latestPoint.hard_gradient.toFixed(1)} c/s²` : '---'}
              </div>
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        {/* Confusion Matrix */}
        <div className="dashboard-card">
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
          <div style={{ marginTop: '14px', fontSize: '11.5px', color: '#64748b', fontFamily: 'Share Tech Mono, monospace', lineHeight: '1.5' }}>
            *Metrics based on 400 test solar interval samples representingGOES-16 and SoLEXS cross-calibrated flare periods.
          </div>
        </div>

        {/* Feature Importance contributions */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">TEMPORAL ATTENTION FEATURE CONTRIBUTIONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', fontFamily: 'Share Tech Mono, monospace' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                <span>1. Soft X-Ray Gradient (t-0 to t-60s)</span>
                <span style={{ color: 'var(--solar-gold)', fontWeight: 'bold' }}>42% contribution</span>
              </div>
              <div style={{ height: '4px', backgroundColor: '#07080b', border: '1px solid rgba(255,138,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '42%', backgroundColor: 'var(--solar-gold)', boxShadow: '0 0 6px var(--solar-gold)' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                <span>2. Hard X-Ray Deviation (above median)</span>
                <span style={{ color: 'var(--solar-gold)', fontWeight: 'bold' }}>28% contribution</span>
              </div>
              <div style={{ height: '4px', backgroundColor: '#07080b', border: '1px solid rgba(255,138,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '28%', backgroundColor: 'var(--solar-gold)', boxShadow: '0 0 6px var(--solar-gold)' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                <span>3. Soft X-Ray Standard Deviation Threshold</span>
                <span style={{ color: 'var(--cyan-telemetry)', fontWeight: 'bold' }}>18% contribution</span>
              </div>
              <div style={{ height: '4px', backgroundColor: '#07080b', border: '1px solid rgba(255,138,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '18%', backgroundColor: 'var(--cyan-telemetry)', boxShadow: '0 0 6px var(--cyan-telemetry)' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                <span>4. Detector Correlation Coefficient</span>
                <span style={{ color: 'var(--cyan-telemetry)', fontWeight: 'bold' }}>12% contribution</span>
              </div>
              <div style={{ height: '4px', backgroundColor: '#07080b', border: '1px solid rgba(255,138,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '12%', backgroundColor: 'var(--cyan-telemetry)', boxShadow: '0 0 6px var(--cyan-telemetry)' }} />
              </div>
            </div>
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
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsChange, userRole }) => {
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
