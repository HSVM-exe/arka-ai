export interface LightCurvePoint {
  timestamp: number; // Unix timestamp in seconds
  soft_xray_counts: number; // SoLEXS count rate
  hard_xray_counts: number; // HEL1OS count rate
  soft_baseline: number;
  hard_baseline: number;
  soft_std: number;
  hard_std: number;
  soft_gradient: number;
  hard_gradient: number;
  detector_agreement: boolean;
  nowcast_phase: 'Quiet' | 'Pre-Flare' | 'Initiation' | 'Rise' | 'Peak' | 'Decay' | 'Recovery';
  forecast_probability: number; // 0 to 100
  confidence: number; // 0 to 100
  alert_level: 'Low' | 'Elevated' | 'Moderate' | 'High' | 'Critical';
}

export interface DetectorHealth {
  completeness: number; // 0 to 100
  noise_level: number; // 0 to 100
  gti_valid: boolean;
  availability: number; // 0 to 100
  agreement_score: number; // 0 to 100
  overall_score: number; // 0 to 100
}

export interface NowcastResult {
  phase: 'Quiet' | 'Pre-Flare' | 'Initiation' | 'Rise' | 'Peak' | 'Decay' | 'Recovery';
  is_flare_active: boolean;
  confidence: number; // 0 to 100
  explanation: string;
}

export interface ForecastResult {
  prob_10m: number; // 0 to 100
  prob_20m: number;
  prob_30m: number;
  prob_60m: number;
  lead_time_est_min: number;
  confidence: number;
  explanation: string;
}

export interface ExplanationFactor {
  name: string;
  value: number; // percentage
  isPositive: boolean; // positive effect or penalty
}

export interface ImpactRisk {
  domain: string;
  risk_level: 'Low' | 'Elevated' | 'Moderate' | 'High' | 'Critical';
  explanation: string;
  recommendation: string;
}

export interface AlertEvent {
  id: string;
  timestamp: number;
  phase: 'Quiet' | 'Pre-Flare' | 'Initiation' | 'Rise' | 'Peak' | 'Decay' | 'Recovery';
  severity: 'Low' | 'Elevated' | 'Moderate' | 'High' | 'Critical';
  status: 'New' | 'Acknowledged' | 'Escalated' | 'Resolved' | 'Suppressed';
  message: string;
  confidence: number;
}

export interface FlareEvent {
  event_id: string;
  start_time: number;
  peak_time: number;
  end_time: number;
  flare_class: 'Quiet' | 'C-Class' | 'M-Class' | 'X-Class';
  max_soft_flux: number;
  max_hard_flux: number;
  lead_time: number; // minutes
  detection_confidence: number; // 0 to 100
  false_alarm_flag: boolean;
  impact_level: 'Low' | 'Elevated' | 'Moderate' | 'High' | 'Critical';
  notes: string;
}

export interface ModelMetric {
  metric: string;
  value: string | number;
  purpose: string;
}

export interface SystemSettings {
  thresholdSensitivity: number; // k-factor for std_dev threshold
  baselineWindowSize: number; // number of points for baseline calc
  alertSensitivity: 'Low' | 'Normal' | 'High';
  chartWindowSize: number; // number of historical points displayed
  demoSpeed: 1 | 5 | 20;
  detectorWeight: number; // weight of SoLEXS vs HEL1OS
}
