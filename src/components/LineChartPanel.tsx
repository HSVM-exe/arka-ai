import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import type { LightCurvePoint } from '../types';

interface LineChartPanelProps {
  data: LightCurvePoint[];
}

export const LineChartPanel: React.FC<LineChartPanelProps> = ({ data }) => {
  // Format timestamps as UTC strings
  const formatTime = (time: number) => {
    const date = new Date(time * 1000);
    return date.toISOString().substring(14, 19); // MM:SS format for quick reading
  };

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pData: LightCurvePoint = payload[0].payload;
      const dateStr = new Date(pData.timestamp * 1000).toISOString().substring(11, 19); // HH:MM:SS
      return (
        <div style={{
          backgroundColor: '#0c0f16',
          border: '1px solid rgba(255, 138, 0, 0.3)',
          boxShadow: '0 0 15px rgba(255, 138, 0, 0.15)',
          padding: '10px 14px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'Share Tech Mono, monospace',
          lineHeight: '1.6'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--solar-gold)', borderBottom: '1px solid rgba(255, 138, 0, 0.1)', paddingBottom: '4px', marginBottom: '6px' }}>
            TIMESTAMP: {dateStr} UTC
          </p>
          <p style={{ margin: 0, color: 'var(--cyan-telemetry)' }}>
            SoLEXS Soft X-Ray: {Math.round(pData.soft_xray_counts)} c/s
          </p>
          <p style={{ margin: 0, color: 'var(--solar-gold)' }}>
            HEL1OS Hard X-Ray: {Math.round(pData.hard_xray_counts)} c/s
          </p>
          <p style={{ margin: 0, color: '#64748b' }}>
            Estimated Baseline: {Math.round(pData.soft_baseline)} c/s
          </p>
          <p style={{ margin: '6px 0 0 0', color: pData.nowcast_phase === 'Quiet' ? 'var(--health-green)' : 'var(--alert-red)', fontWeight: 'bold', textTransform: 'uppercase' }}>
            State: {pData.nowcast_phase} ({Math.round(pData.confidence)}% Conf)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', height: '100%' }}>
      {/* 1. Soft X-ray Chart */}
      <div style={{ height: '210px', width: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 5, left: 10, fontSize: '11px', color: 'var(--cyan-telemetry)', zIndex: 10, fontFamily: 'Share Tech Mono, monospace', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          SoLEXS SOFT X-RAY OBSERVATION (2-22 keV)
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 25, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 138, 0, 0.04)" />
            <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#475569" style={{ fontSize: '10px', fontFamily: 'Share Tech Mono' }} />
            <YAxis stroke="#475569" style={{ fontSize: '10px', fontFamily: 'Share Tech Mono' }} domain={['auto', 'auto']} />
            <Tooltip content={customTooltip} />
            <Legend verticalAlign="top" height={36} style={{ fontSize: '11px', fontFamily: 'Share Tech Mono' }} />
            
            {/* Soft Count Rate Line (Electric Cyan) */}
            <Line
              type="monotone"
              name="Soft Flux Counts"
              dataKey="soft_xray_counts"
              stroke="var(--cyan-telemetry)"
              strokeWidth={2.0}
              dot={false}
              isAnimationActive={false}
            />
            {/* Rolling Baseline Line */}
            <Line
              type="monotone"
              name="Estimated Baseline"
              dataKey="soft_baseline"
              stroke="#475569"
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Hard X-ray Chart */}
      <div style={{ height: '210px', width: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 5, left: 10, fontSize: '11px', color: 'var(--solar-gold)', zIndex: 10, fontFamily: 'Share Tech Mono, monospace', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          HEL1OS HARD X-RAY OBSERVATION (10-150 keV)
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 25, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 138, 0, 0.04)" />
            <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#475569" style={{ fontSize: '10px', fontFamily: 'Share Tech Mono' }} />
            <YAxis stroke="#475569" style={{ fontSize: '10px', fontFamily: 'Share Tech Mono' }} domain={['auto', 'auto']} />
            <Tooltip content={customTooltip} />
            <Legend verticalAlign="top" height={36} style={{ fontSize: '11px', fontFamily: 'Share Tech Mono' }} />
            
            {/* Hard Count Rate Line (Solar Gold) */}
            <Line
              type="monotone"
              name="Hard Flux Counts"
              dataKey="hard_xray_counts"
              stroke="var(--solar-gold)"
              strokeWidth={2.0}
              dot={false}
              isAnimationActive={false}
            />
            {/* Rolling Baseline Line */}
            <Line
              type="monotone"
              name="Estimated Baseline"
              dataKey="hard_baseline"
              stroke="#475569"
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
