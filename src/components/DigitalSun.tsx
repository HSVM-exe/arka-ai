import React, { useState, useEffect } from 'react';
import { Compass, Play, Pause, RefreshCw } from 'lucide-react';

interface DigitalSunProps {
  phase: string;
  severity: 'Low' | 'Elevated' | 'Moderate' | 'High' | 'Critical';
}

type Wavelength = '94' | '131' | '171' | '304';

export const DigitalSun: React.FC<DigitalSunProps> = ({ phase, severity: _severity }) => {
  // Wavelength selection: default 171 Å (Golden)
  const [wavelength, setWavelength] = useState<Wavelength>('171');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [timelineVal, setTimelineVal] = useState<number>(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  // Map wavelength to scientific color bands
  const waveColors: Record<Wavelength, { primary: string; secondary: string; glow: string }> = {
    '94': { primary: '#40ff7a', secondary: '#052e16', glow: 'rgba(64, 255, 122, 0.4)' },    // Flaring corona - Green
    '131': { primary: '#49e6ff', secondary: '#082f49', glow: 'rgba(73, 230, 255, 0.4)' },   // Hot flaring - Cyan
    '171': { primary: '#ffc84d', secondary: '#451a03', glow: 'rgba(255, 200, 77, 0.4)' },   // Quiet corona - Gold
    '304': { primary: '#ff8a00', secondary: '#3b0712', glow: 'rgba(255, 138, 0, 0.4)' }     // Chromosphere - Red/Orange
  };

  const currentColors = waveColors[wavelength];

  // Timeline playback simulation
  useEffect(() => {
    if (!isPlayingTimeline) return;
    const interval = setInterval(() => {
      setTimelineVal(prev => (prev >= 24 ? -24 : prev + 4));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlayingTimeline]);

  // Active region name based on scenario
  const getActiveRegion = () => {
    if (phase === 'Quiet') return 'AR 4087';
    if (phase === 'Pre-Flare') return 'AR 4088';
    return 'AR 4089 (Eruptive)';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      fontFamily: 'Share Tech Mono, monospace',
      position: 'relative'
    }}>
      {/* Sun Header Details */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16px',
        borderBottom: '1px solid rgba(255, 138, 0, 0.08)',
        paddingBottom: '10px'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>ACTIVE REGION</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{getActiveRegion()}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--solar-gold)', marginTop: '2px' }}>
            {phase === 'Quiet' ? 'β-γ Config Complex' : 'Unstable Magnetic Shear'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>REGION STATUS</div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: phase === 'Quiet' ? 'var(--health-green)' : 'var(--alert-red)' 
          }}>
            {phase === 'Quiet' ? 'STABLE' : 'ERUPTIVE'}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
            X-Ray: {phase === 'Quiet' ? 'A2.1 (Low)' : 'M5.4 (Elevated)'}
          </div>
        </div>
      </div>

      {/* Main Interactive Solar Box */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '350px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'radial-gradient(circle, rgba(255, 138, 0, 0.02) 0%, rgba(5, 6, 8, 0.9) 80%)',
        overflow: 'hidden'
      }}>
        {/* Reticles grid lines */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'linear-gradient(rgba(255, 138, 0, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 138, 0, 0.02) 1px, transparent 1px)',
          backgroundSize: '25px 25px',
          pointerEvents: 'none'
        }} />

        {/* Orbit Path rings */}
        <div style={{
          position: 'absolute',
          width: '270px', height: '270px',
          border: '1px solid rgba(255, 138, 0, 0.04)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          width: '320px', height: '320px',
          border: '1px dashed rgba(255, 138, 0, 0.02)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* 1. Earth Direction Compass Dial (Left Corner) */}
        <div style={{
          position: 'absolute',
          bottom: '16px', left: '16px',
          display: 'flex', flexDirection: 'column', gap: '4px',
          color: '#64748b', fontSize: '9px',
          background: 'rgba(13, 16, 24, 0.4)',
          border: '1px solid rgba(255, 138, 0, 0.05)',
          padding: '8px 10px',
          borderRadius: '3px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={11} style={{ color: 'var(--solar-orange)' }} />
            <span>Solar North</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--cyan-telemetry)' }} />
            <span>Earth Direction</span>
          </div>
        </div>

        {/* 2. Interactive Wavelength Selector tags (Right Corner) */}
        <div style={{
          position: 'absolute',
          bottom: '16px', right: '16px',
          display: 'flex', gap: '6px',
          zIndex: 10
        }}>
          {(['94', '131', '171', '304'] as const).map(w => (
            <button
              key={w}
              onClick={() => setWavelength(w)}
              style={{
                background: wavelength === w ? currentColors.glow : 'rgba(5, 6, 8, 0.8)',
                border: `1.5px solid ${wavelength === w ? currentColors.primary : 'rgba(255, 138, 0, 0.15)'}`,
                color: wavelength === w ? '#fff' : '#64748b',
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: '10.5px',
                fontWeight: 'bold',
                padding: '4px 8px',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {w}Å
            </button>
          ))}
        </div>

        {/* Cinematic SVG Solar Sphere */}
        <svg 
          style={{
            width: '240px',
            height: '240px',
            filter: `drop-shadow(0 0 35px ${currentColors.primary}33)`,
            pointerEvents: 'none'
          }} 
          viewBox="0 0 100 100"
        >
          <defs>
            <radialGradient id={`wave-corona-${wavelength}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={currentColors.primary} stopOpacity="0.8" />
              <stop offset="35%" stopColor={currentColors.primary} stopOpacity="0.4" />
              <stop offset="70%" stopColor={currentColors.primary} stopOpacity="0.15" />
              <stop offset="100%" stopColor={currentColors.primary} stopOpacity="0" />
            </radialGradient>

            <radialGradient id={`wave-body-${wavelength}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#fffaeb" />
              <stop offset="65%" stopColor={currentColors.primary} />
              <stop offset="92%" stopColor={currentColors.secondary} />
              <stop offset="100%" stopColor="#050608" />
            </radialGradient>

            <filter id="plasma-loops-blur">
              <feGaussianBlur stdDeviation="1.0" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Ambient Corona Glow */}
          <circle cx="50%" cy="50%" r="48" fill={`url(#wave-corona-${wavelength})`} />

          {/* 2. Rotating Magnetic loops (CSS Animated Spin) */}
          <g 
            style={{
              transformOrigin: '50px 50px',
              animation: autoRotate ? 'rotate-corona 15s linear infinite' : 'none',
              filter: 'url(#plasma-loops-blur)'
            }}
            stroke={currentColors.primary}
            strokeWidth="0.4"
            strokeOpacity="0.65"
            fill="none"
          >
            {/* Fine filament arches */}
            <path d="M 28,50 A 22,22 0 0,1 72,50" />
            <path d="M 33,50 A 17,17 0 0,1 67,50" />
            <path d="M 38,50 A 12,12 0 0,1 62,50" />
            
            <path d="M 28,50 A 22,22 0 0,0 72,50" />
            <path d="M 33,50 A 17,17 0 0,0 67,50" />
            
            {/* Orthogonal field segments */}
            <path d="M 50,28 A 22,22 0 0,1 50,72" />
            <path d="M 50,33 A 17,17 0 0,1 50,67" />
          </g>

          {/* 3. Reverse Spin Filament Layer */}
          <g 
            style={{
              transformOrigin: '50px 50px',
              animation: autoRotate ? 'rotate-corona-reverse 22s linear infinite' : 'none',
              filter: 'url(#plasma-loops-blur)'
            }}
            stroke={currentColors.primary}
            strokeWidth="0.3"
            strokeOpacity="0.4"
            fill="none"
          >
            <circle cx="50%" cy="50%" r="35" strokeDasharray="3, 10" />
            <circle cx="50%" cy="50%" r="41" strokeDasharray="6, 14" />
          </g>

          {/* 4. Core Solar Photosphere Disc */}
          <circle cx="50%" cy="50%" r="24" fill={`url(#wave-body-${wavelength})`} stroke={currentColors.primary} strokeWidth="0.6" />

          {/* 5. Active Eruptive CME loops (Only visible if scenario is flaring) */}
          {phase !== 'Quiet' && (
            <g filter="url(#plasma-loops-blur)">
              <path 
                d="M 36,36 Q 20,20 10,25" 
                fill="none" 
                stroke="#fff" 
                strokeWidth="1.2"
                style={{
                  transformOrigin: '50px 50px',
                  animation: 'dot-breathing 1s alternate infinite'
                }}
              />
              <path 
                d="M 64,64 Q 80,80 90,75" 
                fill="none" 
                stroke="#fff" 
                strokeWidth="1.0"
                style={{
                  transformOrigin: '50px 50px',
                  animation: 'dot-breathing 1.2s alternate infinite'
                }}
              />
            </g>
          )}

          {/* 6. Active Region spots and flares */}
          {phase !== 'Quiet' && (
            <g fill="#ffffff">
              <circle cx="43" cy="41" r="2.0" />
              <circle cx="43" cy="41" r="3.5" fill="#fff" opacity="0.3" />
              <circle cx="55" cy="52" r="1.4" />
              <circle cx="55" cy="52" r="2.5" fill={currentColors.primary} opacity="0.4" />
            </g>
          )}
        </svg>

        {/* Orbit North compass indicator */}
        <div style={{
          position: 'absolute',
          top: '16px', left: '16px',
          fontSize: '10px', color: '#64748b'
        }}>
          <span>Solar North ↑</span>
        </div>

        {/* Auto Rotate Control */}
        <div style={{
          position: 'absolute',
          top: '16px', right: '16px',
          display: 'flex', alignItems: 'center', gap: '8px',
          zIndex: 10
        }}>
          <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Auto Rotate</span>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            style={{
              background: autoRotate ? 'rgba(255, 138, 0, 0.1)' : 'rgba(5, 6, 8, 0.8)',
              border: `1.5px solid ${autoRotate ? 'var(--solar-orange)' : 'rgba(255, 138, 0, 0.15)'}`,
              color: autoRotate ? 'var(--solar-gold)' : '#64748b',
              padding: '4px',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={12} className={autoRotate ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* 3. Bottom Timeline Slider (-24h to +24h forecast slider) */}
      <div style={{
        marginTop: '16px',
        borderTop: '1px solid rgba(255, 138, 0, 0.08)',
        paddingTop: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
          style={{
            background: isPlayingTimeline ? 'rgba(255, 138, 0, 0.1)' : 'rgba(5, 6, 8, 0.8)',
            border: `1.5px solid ${isPlayingTimeline ? 'var(--solar-orange)' : 'var(--border-glass)'}`,
            color: 'var(--solar-gold)',
            padding: '6px 10px',
            borderRadius: '3px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            textTransform: 'uppercase'
          }}
        >
          {isPlayingTimeline ? <Pause size={12} /> : <Play size={12} />}
          <span>{isPlayingTimeline ? 'PAUSE' : 'SCAN'}</span>
        </button>

        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="control-slider-wrapper">
            <input
              type="range"
              min="-24"
              max="24"
              step="4"
              className="control-slider"
              value={timelineVal}
              onChange={(e) => setTimelineVal(parseInt(e.target.value))}
            />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#64748b',
            textTransform: 'uppercase',
            marginTop: '2px'
          }}>
            <span>-24h</span>
            <span>-12h</span>
            <span style={{ color: timelineVal === 0 ? 'var(--solar-orange)' : '#64748b', fontWeight: timelineVal === 0 ? 'bold' : 'normal' }}>NOW</span>
            <span>+12h</span>
            <span>+24h</span>
          </div>
        </div>

        <div style={{
          minWidth: '55px',
          textAlign: 'right',
          fontSize: '12px',
          fontWeight: 'bold',
          color: timelineVal === 0 ? 'var(--solar-orange)' : 'var(--solar-gold)'
        }}>
          {timelineVal === 0 ? 'LIVE' : (timelineVal > 0 ? `+${timelineVal}h` : `${timelineVal}h`)}
        </div>
      </div>
    </div>
  );
};
