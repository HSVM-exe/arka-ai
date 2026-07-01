import type { AlertEvent } from '../types';

export const createNewAlert = (
  phase: AlertEvent['phase'],
  severity: AlertEvent['severity'],
  confidence: number,
  message: string
): AlertEvent => {
  return {
    id: `alert-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Math.floor(Date.now() / 1000),
    phase,
    severity,
    status: 'New',
    message,
    confidence
  };
};

export const updateAlertStatus = (
  alerts: AlertEvent[],
  alertId: string,
  newStatus: AlertEvent['status']
): AlertEvent[] => {
  return alerts.map(alert => 
    alert.id === alertId ? { ...alert, status: newStatus } : alert
  );
};

export const determineSeverity = (
  phase: string,
  forecastProbability: number
): AlertEvent['severity'] => {
  if (phase === 'Rise' || phase === 'Peak') {
    return forecastProbability > 90 ? 'Critical' : 'High';
  }
  if (phase === 'Initiation') {
    return 'Moderate';
  }
  if (phase === 'Pre-Flare') {
    return 'Elevated';
  }
  return 'Low';
};
