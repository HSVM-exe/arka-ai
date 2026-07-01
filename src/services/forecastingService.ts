import type { ProcessedSignal } from './signalProcessingService';
import type { NowcastResult } from './nowcastingService';

export interface ForecastResult {
  prob_10m: number; // 0 to 100
  prob_20m: number;
  prob_30m: number;
  prob_60m: number;
  lead_time_est_min: number;
  confidence: number;
  explanation: string;
}

export const runForecastingEngine = (
  currentSignal: ProcessedSignal,
  nowcast: NowcastResult
): ForecastResult => {
  const soft = currentSignal.soft_clean;
  const soft_base = currentSignal.soft_baseline;
  const soft_std = currentSignal.soft_std;
  const soft_grad = currentSignal.soft_gradient;
  const hard_grad = currentSignal.hard_gradient;
  const accel = currentSignal.soft_acceleration;

  // 1. Feature scoring calculations (normalized to 0-1)
  const normSoftGrad = Math.min(1, Math.max(0, soft_grad / (soft_std * 3.0)));
  const normHardGrad = Math.min(1, Math.max(0, hard_grad / (currentSignal.hard_std * 2.0)));
  const normSustainedRise = Math.min(1, Math.max(0, (soft / soft_base - 1.0) * 1.5));
  const normAccel = Math.min(1, Math.max(0, accel / (soft_std * 1.5)));
  
  // Calculate weighted core score (0 to 100)
  const agreementMultiplier = currentSignal.detector_agreement ? 1.0 : 0.6;
  const coreScore = (
    0.35 * normSoftGrad +
    0.25 * normSustainedRise +
    0.20 * normHardGrad +
    0.20 * normAccel
  ) * 100 * agreementMultiplier;

  let prob_10m = 5;
  let prob_20m = 8;
  let prob_30m = 10;
  let prob_60m = 12;
  let lead_time_est_min = 0;
  let explanation = '';

  // Classify probability based on nowcasting phase
  switch (nowcast.phase) {
    case 'Quiet':
      // Low baseline probability with minor fluctuations
      prob_60m = Math.round(12 + coreScore * 0.5);
      prob_30m = Math.round(8 + coreScore * 0.3);
      prob_20m = Math.round(6 + coreScore * 0.2);
      prob_10m = Math.round(4 + coreScore * 0.1);
      lead_time_est_min = 0;
      explanation = 'Solar activity is low. No precursors detected in soft X-ray spectrum.';
      break;

    case 'Pre-Flare':
      // Gradual build up - long term probability rises first
      prob_60m = Math.round(45 + coreScore * 0.4);
      prob_30m = Math.round(35 + coreScore * 0.35);
      prob_20m = Math.round(25 + coreScore * 0.3);
      prob_10m = Math.round(15 + coreScore * 0.2);
      lead_time_est_min = Math.round(25 - normSoftGrad * 10);
      explanation = 'Slight increase in soft X-ray baseline and positive gradient. Moderate probability of event in 30-60 min.';
      break;

    case 'Initiation':
      // Crossing threshold - immediate warning
      prob_60m = Math.round(80 + coreScore * 0.15);
      prob_30m = Math.round(85 + coreScore * 0.1);
      prob_20m = Math.round(90 + coreScore * 0.08);
      prob_10m = Math.round(95 + coreScore * 0.04);
      lead_time_est_min = Math.round(8 - normAccel * 4);
      explanation = 'Flare threshold crossed (+kσ). High probability of major flare peaking within 5-10 minutes.';
      break;

    case 'Rise':
      // Active flare rising
      prob_10m = 99;
      prob_20m = 99;
      prob_30m = 95;
      prob_60m = 90;
      lead_time_est_min = 2;
      explanation = 'Impulsive heating phase active. Peak flux expected imminently.';
      break;

    case 'Peak':
      // Already peaking, short term goes down since it is happening now, but remains high for sustained risk
      prob_10m = 85;
      prob_20m = 75;
      prob_30m = 65;
      prob_60m = 50;
      lead_time_est_min = 0;
      explanation = 'Peak emission ongoing. Risk of secondary spikes or sustained X-class flux.';
      break;

    case 'Decay':
    case 'Recovery':
      // Post flare recovery
      prob_10m = 15;
      prob_20m = 20;
      prob_30m = 25;
      prob_60m = 30;
      lead_time_est_min = 0;
      explanation = 'Flare is decaying. Risk is returning to quiet baseline.';
      break;
  }

  // Ensure values stay within 0-100
  prob_10m = Math.max(2, Math.min(100, prob_10m));
  prob_20m = Math.max(3, Math.min(100, prob_20m));
  prob_30m = Math.max(4, Math.min(100, prob_30m));
  prob_60m = Math.max(5, Math.min(100, prob_60m));

  // 53. Confidence vs Probability: Page 57 of PRD
  // Confidence estimates the reliability of the forecast based on data quality & agreement.
  let confidencePoints = 95;
  if (!currentSignal.detector_agreement) {
    confidencePoints -= 35;
  }
  if (currentSignal.data_quality_score < 70) {
    confidencePoints -= (70 - currentSignal.data_quality_score);
  }
  const confidence = Math.max(10, Math.min(100, Math.round(confidencePoints)));

  return {
    prob_10m,
    prob_20m,
    prob_30m,
    prob_60m,
    lead_time_est_min,
    confidence,
    explanation,
  };
};
export type { ForecastResult as ForecastResultType };
