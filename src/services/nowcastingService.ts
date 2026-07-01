import type { ProcessedSignal } from './signalProcessingService';

export interface NowcastResult {
  phase: 'Quiet' | 'Pre-Flare' | 'Initiation' | 'Rise' | 'Peak' | 'Decay' | 'Recovery';
  is_flare_active: boolean;
  confidence: number; // 0 to 100
  explanation: string;
}

export const runNowcastEngine = (
  currentSignal: ProcessedSignal,
  prevPhase: 'Quiet' | 'Pre-Flare' | 'Initiation' | 'Rise' | 'Peak' | 'Decay' | 'Recovery' = 'Quiet'
): NowcastResult => {
  const soft = currentSignal.soft_clean;
  
  const soft_base = currentSignal.soft_baseline;
  const soft_std = currentSignal.soft_std;
  const soft_grad = currentSignal.soft_gradient;

  // 12.5 False Alarm Control: Require trigger persistence over multiple samples to filter out noise spikes
  const isSoftTriggered = currentSignal.soft_consecutive_triggers >= 3;
  const isHardTriggered = currentSignal.hard_consecutive_triggers >= 3;
  
  // Rate of change checks (require gradient to be positive for at least 2 consecutive seconds to filter out single-second noise)
  const isSoftRising = currentSignal.soft_consecutive_positive_gradients >= 2;
  const isHardRising = currentSignal.hard_consecutive_positive_gradients >= 2;
  const isSoftFalling = soft_grad < -soft_std * 0.5;

  let phase: 'Quiet' | 'Pre-Flare' | 'Initiation' | 'Rise' | 'Peak' | 'Decay' | 'Recovery' = 'Quiet';
  let is_flare_active = false;
  let confidence = 100;
  let explanation = '';

  // Phase classification state machine based on thresholds and gradients
  if (!isSoftTriggered && !isHardTriggered) {
    if (isSoftRising && soft > soft_base + soft_std) {
      phase = 'Pre-Flare';
      is_flare_active = false;
      explanation = 'Gradual rising trend detected in soft X-ray channel (SoLEXS). Early thermal buildup.';
    } else if (prevPhase === 'Peak' || prevPhase === 'Decay') {
      phase = 'Recovery';
      is_flare_active = true;
      explanation = 'Solar activity returning towards baseline. Recovery phase.';
    } else if (prevPhase === 'Recovery' && soft > soft_base + soft_std * 0.5) {
      phase = 'Recovery';
      is_flare_active = true;
      explanation = 'Recovering back to nominal solar baseline levels.';
    } else {
      phase = 'Quiet';
      is_flare_active = false;
      explanation = 'Solar activity within normal baseline fluctuations. Quiet Sun state.';
    }
  } else if (isSoftTriggered && !isHardTriggered) {
    if (prevPhase === 'Pre-Flare' || prevPhase === 'Quiet') {
      phase = 'Initiation';
      is_flare_active = true;
      explanation = 'Soft X-ray crossed adaptive threshold (+kσ). Flare initiation candidate.';
    } else if (prevPhase === 'Peak' || prevPhase === 'Decay') {
      phase = 'Recovery';
      is_flare_active = true;
      explanation = 'Solar activity returning towards baseline. Recovery phase.';
    } else {
      phase = prevPhase === 'Initiation' ? 'Initiation' : 'Recovery';
      is_flare_active = true;
      explanation = 'Elevated soft X-ray flux detected, awaiting hard X-ray confirmation.';
    }
  } else if (isSoftTriggered && isHardTriggered) {
    if (isSoftRising && isHardRising) {
      phase = 'Rise';
      is_flare_active = true;
      explanation = 'Rapid rising trend in both soft and hard channels. High-energy impulsive heating.';
    } else if (soft > soft_base * 1.5) {
      phase = 'Peak';
      is_flare_active = true;
      explanation = 'Solar flux stabilized at elevated levels. Solar flare peak reached.';
    } else if (isSoftFalling) {
      phase = 'Decay';
      is_flare_active = true;
      explanation = 'Thermal emission decaying. Hard X-ray impulse has subsided.';
    } else {
      phase = prevPhase === 'Rise' ? 'Peak' : prevPhase;
      is_flare_active = true;
      explanation = 'Elevated counts across detectors. High activity ongoing.';
    }
  } else if (!isSoftTriggered && isHardTriggered) {
    // Unusual state (hard trigger but no soft trigger)
    phase = 'Initiation';
    is_flare_active = true;
    explanation = 'Hard X-ray triggered without soft X-ray confirmation. Check for detector anomalies.';
  }

  // 45. Nowcasting Confidence: Page 49 of PRD
  // Confidence depends on signal strength, detector agreement, data quality, and noise levels.
  let confidencePoints = 100;

  // Penalty for detector disagreement
  if (!currentSignal.detector_agreement) {
    confidencePoints -= 40;
  }
  // Penalty for low data quality score
  if (currentSignal.data_quality_score < 70) {
    confidencePoints -= (70 - currentSignal.data_quality_score);
  }
  // Penalty for lack of hard X-ray confirmation during rise phase
  if (phase === 'Rise' && !isHardTriggered) {
    confidencePoints -= 20;
  }
  // Penalty for very high noise
  if (currentSignal.soft_std > 25) {
    confidencePoints -= 15;
  }

  confidence = Math.max(10, Math.min(100, Math.round(confidencePoints)));

  return {
    phase,
    is_flare_active,
    confidence,
    explanation,
  };
};
