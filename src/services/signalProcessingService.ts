import type { SystemSettings } from '../types';
import type { RawTelemetryPoint } from './dataSimulationService';

export interface ProcessedSignal {
  soft_clean: number;
  hard_clean: number;
  raw_soft_counts: number;
  raw_hard_counts: number;
  soft_baseline: number;
  hard_baseline: number;
  soft_std: number;
  hard_std: number;
  soft_gradient: number;
  hard_gradient: number;
  soft_acceleration: number;
  hard_acceleration: number;
  detector_agreement: boolean;
  data_quality_score: number;
  soft_consecutive_triggers: number;
  hard_consecutive_triggers: number;
  soft_consecutive_positive_gradients: number;
  hard_consecutive_positive_gradients: number;
}

export const processTelemetrySignal = (
  rawPoint: RawTelemetryPoint,
  history: { soft_xray_counts: number; hard_xray_counts: number; raw_soft_counts?: number; raw_hard_counts?: number; soft_baseline?: number; hard_baseline?: number; soft_gradient?: number; hard_gradient?: number }[],
  settings: SystemSettings
): ProcessedSignal => {
  const windowSize = settings.baselineWindowSize;
  const historyLen = history.length;

  const currentRawSoft = rawPoint.soft_xray_counts;
  const currentRawHard = rawPoint.hard_xray_counts;

  // 1. Signal Ingestion / Cleaning: rolling median of size 5 to suppress single-sample spikes
  let soft_clean = currentRawSoft;
  let hard_clean = currentRawHard;

  if (historyLen >= 4) {
    const last4 = history.slice(-4);
    
    const softValues = [
      ...last4.map(p => p.raw_soft_counts !== undefined ? p.raw_soft_counts : p.soft_xray_counts),
      currentRawSoft
    ].sort((a, b) => a - b);
    
    const hardValues = [
      ...last4.map(p => p.raw_hard_counts !== undefined ? p.raw_hard_counts : p.hard_xray_counts),
      currentRawHard
    ].sort((a, b) => a - b);

    soft_clean = softValues[2]; // Median of 5 elements
    hard_clean = hardValues[2];
  }

  // 2. Baseline & Standard Deviation estimation
  let soft_baseline = soft_clean;
  let hard_baseline = hard_clean;
  let soft_std = 1.0;
  let hard_std = 1.0;

  if (historyLen >= 5) {
    // If we have history, compute baseline and standard deviation on the window (or all available history if less than windowSize)
    const activeWindowSize = Math.min(windowSize, historyLen);
    const baselineWindow = history.slice(-activeWindowSize);
    
    // Mean
    const softMean = baselineWindow.reduce((sum, p) => sum + p.soft_xray_counts, 0) / activeWindowSize;
    const hardMean = baselineWindow.reduce((sum, p) => sum + p.hard_xray_counts, 0) / activeWindowSize;
    soft_baseline = softMean;
    hard_baseline = hardMean;

    // Variance & Std Dev
    const softVar = baselineWindow.reduce((sum, p) => sum + Math.pow(p.soft_xray_counts - softMean, 2), 0) / activeWindowSize;
    const hardVar = baselineWindow.reduce((sum, p) => sum + Math.pow(p.hard_xray_counts - hardMean, 2), 0) / activeWindowSize;
    
    // We enforce a minimum standard deviation to avoid divide-by-zero or noise sensitivity on flat signals
    soft_std = Math.max(1.5, Math.sqrt(softVar));
    hard_std = Math.max(0.5, Math.sqrt(hardVar));
  } else if (historyLen > 1) {
    // Fallback for very short history (first 5 seconds)
    const softMean = history.reduce((sum, p) => sum + p.soft_xray_counts, 0) / historyLen;
    const hardMean = history.reduce((sum, p) => sum + p.hard_xray_counts, 0) / historyLen;
    soft_baseline = softMean;
    hard_baseline = hardMean;
    soft_std = 5.0; // Higher default to prevent false triggers during start
    hard_std = 2.0;
  }

  // 3. Gradient (Slope) computation: difference over last 3 seconds
  let soft_gradient = 0;
  let hard_gradient = 0;
  if (historyLen >= 3) {
    const prevPoint = history[historyLen - 3];
    soft_gradient = (soft_clean - prevPoint.soft_xray_counts) / 3;
    hard_gradient = (hard_clean - prevPoint.hard_xray_counts) / 3;
  }

  // 4. Acceleration (change in gradient)
  let soft_acceleration = 0;
  let hard_acceleration = 0;
  if (historyLen >= 6) {
    const prev1 = history[historyLen - 1] as any;
    const prevGrad1 = prev1.soft_gradient || 0;
    soft_acceleration = (soft_gradient - prevGrad1);
    hard_acceleration = (hard_gradient - (prev1.hard_gradient || 0));
  }

  // 5. Detector Agreement Check
  // Disagreement occurs when one rises significantly but the other is flat/falling.
  let detector_agreement = true;
  const isSoftRising = soft_gradient > 2.0;
  const isHardRising = hard_gradient > 0.6;
  const softRatio = soft_clean / soft_baseline;
  const hardRatio = hard_clean / hard_baseline;

  if ((softRatio > 1.4 && hardRatio < 1.1 && isSoftRising && !isHardRising) ||
      (hardRatio > 1.8 && softRatio < 1.1 && isHardRising && !isSoftRising)) {
    detector_agreement = false;
  }

  // 6. Ingested data quality scoring formula (Page 45)
  const completeness = (rawPoint.soft_valid ? 50 : 0) + (rawPoint.hard_valid ? 50 : 0);
  
  const softNoiseRatio = soft_std / Math.max(1, soft_clean);
  const noiseScore = Math.max(0, Math.min(100, 100 - (softNoiseRatio * 200)));

  const agreementScore = detector_agreement ? 100 : 30;
  
  let timeContinuity = 100;
  if (historyLen > 0) {
    const lastTime = (history[historyLen - 1] as any).timestamp;
    const diff = rawPoint.timestamp - lastTime;
    if (diff !== 1) {
      timeContinuity = Math.max(0, 100 - (Math.abs(diff - 1) * 10));
    }
  }

  const gtiValid = rawPoint.soft_valid && rawPoint.hard_valid;
  const gtiScore = gtiValid ? 100 : 0;

  const data_quality_score = Math.round(
    0.30 * completeness +
    0.25 * noiseScore +
    0.20 * agreementScore +
    0.15 * timeContinuity +
    0.10 * gtiScore
  );

  // 7. Calculate consecutive triggers for Nowcasting persistence checks
  let soft_consecutive_triggers = 0;
  let hard_consecutive_triggers = 0;
  
  const softThreshold = soft_baseline + settings.thresholdSensitivity * soft_std;
  const hardThreshold = hard_baseline + settings.thresholdSensitivity * hard_std;

  if (soft_clean > softThreshold) {
    let count = 1;
    for (let i = history.length - 1; i >= 0; i--) {
      const pt = history[i] as any;
      const ptThreshold = (pt.soft_baseline || 0) + settings.thresholdSensitivity * (pt.soft_std || 1);
      if (pt.soft_xray_counts > ptThreshold) {
        count++;
      } else {
        break;
      }
    }
    soft_consecutive_triggers = count;
  }

  if (hard_clean > hardThreshold) {
    let count = 1;
    for (let i = history.length - 1; i >= 0; i--) {
      const pt = history[i] as any;
      const ptThreshold = (pt.hard_baseline || 0) + settings.thresholdSensitivity * (pt.hard_std || 1);
      if (pt.hard_xray_counts > ptThreshold) {
        count++;
      } else {
        break;
      }
    }
    hard_consecutive_triggers = count;
  }

  // 8. Calculate consecutive positive gradients
  let soft_consecutive_positive_gradients = 0;
  let hard_consecutive_positive_gradients = 0;

  if (soft_gradient > 2.0) {
    let count = 1;
    for (let i = history.length - 1; i >= 0; i--) {
      const pt = history[i] as any;
      if ((pt.soft_gradient || 0) > 2.0) {
        count++;
      } else {
        break;
      }
    }
    soft_consecutive_positive_gradients = count;
  }

  if (hard_gradient > 0.6) {
    let count = 1;
    for (let i = history.length - 1; i >= 0; i--) {
      const pt = history[i] as any;
      if ((pt.hard_gradient || 0) > 0.6) {
        count++;
      } else {
        break;
      }
    }
    hard_consecutive_positive_gradients = count;
  }

  return {
    soft_clean,
    hard_clean,
    raw_soft_counts: currentRawSoft,
    raw_hard_counts: currentRawHard,
    soft_baseline,
    hard_baseline,
    soft_std,
    hard_std,
    soft_gradient,
    hard_gradient,
    soft_acceleration,
    hard_acceleration,
    detector_agreement,
    data_quality_score,
    soft_consecutive_triggers,
    hard_consecutive_triggers,
    soft_consecutive_positive_gradients,
    hard_consecutive_positive_gradients
  };
};
export type { ProcessedSignal as ProcessedSignalType };
