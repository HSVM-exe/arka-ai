import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldAlert, 
  Cpu, 
  Wifi, 
  Radio, 
  Globe, 
  Compass, 
  Flame, 
  UserCheck,
  CheckCircle
} from 'lucide-react';
import type { ImpactRisk, ExplanationFactor } from '../types';

// ==========================================
// 1. RiskBadge Component
// ==========================================
interface RiskBadgeProps {
  level: 'Low' | 'Elevated' | 'Moderate' | 'High' | 'Critical';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  const badgeColors: Record<string, string> = {
    Low: '#40ff7a',
    Elevated: '#49e6ff',
    Moderate: '#ffc84d',
    High: '#ff8a00',
    Critical: '#ff3b30'
  };

  const color = badgeColors[level] || '#40ff7a';

  return (
    <span style={{
      color: color,
      background: `${color}10`,
      border: `1.5px solid ${color}33`,
      borderRadius: '2px',
      fontSize: '11px',
      fontWeight: 'bold',
      padding: '2px 8px',
      fontFamily: 'Share Tech Mono, monospace',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      boxShadow: `0 0 6px ${color}15`
    }}>
      {level}
    </span>
  );
};

// ==========================================
// 2. StatusCard Component
// ==========================================
interface StatusCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon?: React.ReactNode;
}

export const StatusCard: React.FC<StatusCardProps> = ({ title, value, subtext, icon }) => {
  return (
    <div className="metric-card" style={{
      borderLeft: '3px solid var(--solar-orange)',
      background: 'rgba(13, 16, 24, 0.6)'
    }}>
      <div className="metric-card-header">
        <span>{title}</span>
        {icon && <span style={{ color: 'var(--solar-gold)' }}>{icon}</span>}
      </div>
      <div className="metric-val-main" style={{
        fontFamily: 'Share Tech Mono, monospace',
        color: '#f8fafc',
        marginTop: '2px'
      }}>{value}</div>
      <div className="metric-details-row" style={{
        fontSize: '11px',
        color: '#64748b'
      }}>{subtext}</div>
    </div>
  );
};

// ==========================================
// 3. ExplanationBar Component (Feature Contributions)
// ==========================================
interface ExplanationBarProps {
  factors: ExplanationFactor[];
}

export const ExplanationBar: React.FC<ExplanationBarProps> = ({ factors }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
      {factors.map((factor, index) => {
        const absVal = Math.min(100, Math.abs(factor.value));
        const color = factor.value >= 0 ? 'var(--solar-gold)' : 'var(--solar-orange)';
        
        return (
          <div key={index} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#94a3b8' }}>
              <span>{factor.name}</span>
              <span style={{ fontWeight: 'bold', color: color }}>
                {factor.value >= 0 ? '+' : ''}{factor.value}%
              </span>
            </div>
            <div style={{
              height: '5px',
              backgroundColor: '#07080b',
              border: '1px solid rgba(255, 138, 0, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${absVal}%`,
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}`
                }} 
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 4. ImpactGrid Component
// ==========================================
interface ImpactGridProps {
  risks: ImpactRisk[];
}

export const ImpactGrid: React.FC<ImpactGridProps> = ({ risks }) => {
  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case 'Satellite Electronics': return <Cpu size={16} />;
      case 'GPS Navigation': return <Compass size={16} />;
      case 'HF Radio Communication': return <Wifi size={16} />;
      case 'Aviation Communication': return <Radio size={16} />;
      case 'Power Grid Vulnerability': return <Globe size={16} />;
      case 'Astronaut Radiation Exposure': return <UserCheck size={16} />;
      case 'Mission Operations': return <Flame size={16} />;
      default: return <ShieldAlert size={16} />;
    }
  };

  const getBorderColor = (level: string) => {
    switch (level) {
      case 'Low': return '#40ff7a';
      case 'Elevated': return '#49e6ff';
      case 'Moderate': return '#ffc84d';
      case 'High': return '#ff8a00';
      case 'Critical': return '#ff3b30';
      default: return 'var(--border-glass)';
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
      marginTop: '12px'
    }}>
      {risks.map((risk, index) => {
        const color = getBorderColor(risk.risk_level);
        return (
          <div 
            key={index} 
            style={{
              background: 'rgba(13, 16, 24, 0.5)',
              border: '1px solid rgba(255, 138, 0, 0.1)',
              borderLeft: `4px solid ${color}`,
              borderRadius: '4px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontFamily: 'Share Tech Mono, monospace'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color }}>{getDomainIcon(risk.domain)}</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc', letterSpacing: '0.5px' }}>{risk.domain}</span>
              </div>
              <RiskBadge level={risk.risk_level} />
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', margin: '4px 0' }}>{risk.explanation}</div>
            <div style={{ fontSize: '11px', color: color, fontWeight: 'bold', letterSpacing: '0.5px' }}>
              CMD &gt; {risk.recommendation}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 5. ReplayControls Component
// ==========================================
interface ReplayControlsProps {
  isPlaying: boolean;
  onPlayToggle: () => void;
  onReset: () => void;
  speed: 1 | 5 | 20;
  onSpeedChange: (speed: 1 | 5 | 20) => void;
  progressPercent: number;
  currentPointIndex: number;
  totalPoints: number;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  isPlaying,
  onPlayToggle,
  onReset,
  speed,
  onSpeedChange,
  progressPercent,
  currentPointIndex,
  totalPoints
}) => {
  return (
    <div className="replay-dashboard-controls">
      <div className="playback-controls-row">
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-control"
            onClick={onPlayToggle}
            title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
            style={{
              borderColor: isPlaying ? 'var(--solar-orange)' : 'var(--border-glass)',
              backgroundColor: isPlaying ? 'rgba(255, 138, 0, 0.05)' : 'rgba(0,0,0,0)'
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'PAUSE FEED' : 'ENGAGE FEED'}</span>
          </button>
          <button className="btn-control" onClick={onReset} title="Reset Simulation">
            <RotateCcw size={14} />
            <span>RESET BUFFER</span>
          </button>
        </div>
        
        {/* Speed Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Ingestion speed:</span>
          <div className="btn-group">
            {( [1, 5, 20] as const).map(s => (
              <button
                key={s}
                className="btn-control"
                onClick={() => onSpeedChange(s)}
                style={{
                  padding: '4px 10px',
                  borderColor: speed === s ? 'var(--solar-orange)' : 'var(--border-glass)',
                  backgroundColor: speed === s ? 'rgba(255, 138, 0, 0.05)' : 'rgba(0,0,0,0)',
                  color: speed === s ? 'var(--solar-gold)' : '#94a3b8'
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--solar-gold)', fontWeight: 'bold' }}>
          TELEMETRY INDEX: {currentPointIndex} / {totalPoints} ({Math.round(progressPercent)}%)
        </div>
      </div>
      
      {/* Visual Timeline Bar */}
      <div className="timeline-progress-bar-wrapper">
        <div className="timeline-progress-track">
          <div 
            className="timeline-progress-fill"
            style={{ 
              width: `${progressPercent}%`, 
              transition: 'width 0.1s linear'
            }} 
          />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. PhaseTimeline Component
// ==========================================
interface PhaseTimelineProps {
  currentPhase: 'Quiet' | 'Pre-Flare' | 'Initiation' | 'Rise' | 'Peak' | 'Decay' | 'Recovery';
}

export const PhaseTimeline: React.FC<PhaseTimelineProps> = ({ currentPhase }) => {
  const phases = ['Quiet', 'Pre-Flare', 'Initiation', 'Rise', 'Peak', 'Decay', 'Recovery'] as const;
  const currentIdx = phases.indexOf(currentPhase);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      margin: '20px 0', 
      padding: '10px 0', 
      overflowX: 'auto',
      position: 'relative'
    }}>
      {phases.map((ph, idx) => {
        const isCompleted = idx < currentIdx;
        const isActive = idx === currentIdx;
        
        let color = '#1e293b'; 
        let textClr = '#64748b';
        if (isActive) {
          color = 'var(--solar-orange)';
          textClr = 'var(--solar-gold)';
        } else if (isCompleted) {
          color = 'var(--health-green)';
          textClr = '#cbd5e1';
        }

        return (
          <div 
            key={idx} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              flex: 1, 
              minWidth: '70px',
              position: 'relative',
              zIndex: 2
            }}
          >
            {/* Timeline connectors */}
            {idx < phases.length - 1 && (
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '12px', 
                  left: '50%', 
                  right: '-50%', 
                  height: '2px', 
                  backgroundColor: idx < currentIdx ? 'var(--health-green)' : '#10141e',
                  borderTop: idx < currentIdx ? 'none' : '1px dashed rgba(255, 138, 0, 0.1)',
                  zIndex: 1
                }} 
              />
            )}
            
            <div 
              style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                backgroundColor: isActive ? '#07080b' : (isCompleted ? 'var(--health-green)' : '#0d1018'),
                border: `2px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? 'var(--solar-orange)' : (isCompleted ? '#000' : '#475569'),
                fontSize: '10px',
                fontWeight: 'bold',
                zIndex: 2,
                boxShadow: isActive ? '0 0 10px rgba(255, 138, 0, 0.4)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {isCompleted ? <CheckCircle size={12} strokeWidth={2.5} /> : idx + 1}
            </div>
            
            <span 
              style={{ 
                marginTop: '8px', 
                fontSize: '11px', 
                fontWeight: isActive ? 'bold' : 'normal',
                color: textClr,
                fontFamily: 'Share Tech Mono, monospace',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {ph}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 7. AnalogRiskGauge Component
// ==========================================
interface AnalogRiskGaugeProps {
  level: 'Low' | 'Elevated' | 'Moderate' | 'High' | 'Critical';
}

export const AnalogRiskGauge: React.FC<AnalogRiskGaugeProps> = ({ level }) => {
  const rotationMap: Record<string, number> = {
    Low: -60,
    Elevated: -30,
    Moderate: 0,
    High: 30,
    Critical: 60
  };
  const needleRotation = rotationMap[level] ?? -60;

  const colorMap: Record<string, string> = {
    Low: '#40ff7a',
    Elevated: '#49e6ff',
    Moderate: '#ffc84d',
    High: '#ff8a00',
    Critical: '#ff3b30'
  };
  const activeColor = colorMap[level] ?? '#40ff7a';

  return (
    <div style={{
      width: '100px',
      height: '55px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      margin: '0 auto'
    }}>
      <svg width="100" height="50" viewBox="0 0 100 50">
        <path 
          d="M 10,50 A 40,40 0 0,1 90,50" 
          fill="none" 
          stroke="rgba(255, 138, 0, 0.05)" 
          strokeWidth="6" 
          strokeLinecap="round" 
        />
        <path 
          d="M 10,50 A 40,40 0 0,1 90,50" 
          fill="none" 
          stroke={activeColor} 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeDasharray="125"
          strokeDashoffset={125 - ((needleRotation + 90) / 180) * 125}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease' }}
        />
      </svg>

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 'calc(50% - 1.5px)',
        width: '3px',
        height: '42px',
        background: activeColor,
        boxShadow: `0 0 8px ${activeColor}`,
        transformOrigin: '50% 100%',
        transform: `rotate(${needleRotation}deg)`,
        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.6s ease',
        borderRadius: '2px 2px 0 0'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '-4px',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: '#050608',
        border: `2.5px solid ${activeColor}`,
        boxShadow: `0 0 6px ${activeColor}`,
        zIndex: 5,
        transition: 'border 0.6s ease'
      }} />
    </div>
  );
};

// ==========================================
// 8. GeomagneticForecast Component
// ==========================================
interface GeomagneticForecastProps {
  phase: string;
}

export const GeomagneticForecast: React.FC<GeomagneticForecastProps> = ({ phase }) => {
  const isEruptive = phase !== 'Quiet' && phase !== 'Pre-Flare';
  const kpValues = isEruptive ? [4.2, 5.8, 6.5] : [1.0, 1.3, 1.0];
  const kpLabel = isEruptive ? 'ACTIVE' : 'QUIET';
  const kpColor = isEruptive ? 'var(--solar-orange)' : 'var(--health-green)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', height: '100px', alignItems: 'center', fontFamily: 'Share Tech Mono, monospace' }}>
      <div style={{ display: 'flex', gap: '12px', height: '80px', alignItems: 'flex-end', justifyContent: 'center' }}>
        {kpValues.map((val, i) => {
          const heightPercent = (val / 9) * 100;
          const barColor = val > 4 ? (val > 6 ? 'var(--alert-red)' : 'var(--solar-orange)') : 'var(--health-green)';
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>{val.toFixed(1)}</span>
              <div style={{
                width: '16px',
                height: '50px',
                backgroundColor: 'rgba(5, 6, 8, 0.5)',
                border: '1px solid rgba(255, 138, 0, 0.08)',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'flex-end',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '100%',
                  height: `${heightPercent}%`,
                  backgroundColor: barColor,
                  boxShadow: `0 0 6px ${barColor}`,
                  transition: 'height 0.6s ease'
                }} />
              </div>
              <span style={{ fontSize: '10px', color: '#64748b' }}>+{i+1}h</span>
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 6, 8, 0.3)',
        border: '1px solid rgba(255, 138, 0, 0.06)',
        borderRadius: '6px',
        padding: '8px 10px',
        height: '80px'
      }}>
        <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>Kp Index</div>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: kpColor, margin: '2px 0' }}>
          {isEruptive ? '5.0' : '1.0'}
        </div>
        <div style={{ fontSize: '9.5px', color: kpColor, fontWeight: 'bold', letterSpacing: '0.5px' }}>{kpLabel}</div>
      </div>
    </div>
  );
};

// ==========================================
// 9. SolarWindWaves Component
// ==========================================
export const SolarWindWaves: React.FC = () => {
  return (
    <div style={{
      width: '100%',
      height: '42px',
      position: 'relative',
      overflow: 'hidden',
      background: 'rgba(5, 6, 8, 0.3)',
      border: '1px solid rgba(255, 138, 0, 0.05)',
      borderRadius: '4px',
      marginTop: '8px'
    }}>
      <svg width="100%" height="42" viewBox="0 0 300 42" preserveAspectRatio="none">
        <path 
          d="M 0,21 Q 40,30 80,21 T 160,21 T 240,21 T 320,21" 
          fill="none" 
          stroke="rgba(73, 230, 255, 0.35)" 
          strokeWidth="1.2"
          style={{
            transform: 'translateX(0px)',
            animation: 'wave-drift 4s linear infinite'
          }}
        />
        <path 
          d="M 0,21 Q 50,12 100,21 T 200,21 T 300,21 T 400,21" 
          fill="none" 
          stroke="rgba(255, 200, 77, 0.25)" 
          strokeWidth="1.0"
          style={{
            transform: 'translateX(0px)',
            animation: 'wave-drift 6s linear infinite reverse'
          }}
        />
      </svg>
    </div>
  );
};

