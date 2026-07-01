import type { ExplanationFactor } from '../types';
import type { ProcessedSignal } from './signalProcessingService';
import type { NowcastResult } from './nowcastingService';

export interface ExplainabilityData {
  triggerEvidence: string[];
  supportingEvidence: string[];
  uncertaintyFactors: string[];
  recommendation: string;
  featureContributions: ExplanationFactor[];
}

export const generateExplanation = (
  signal: ProcessedSignal,
  nowcast: NowcastResult
): ExplainabilityData => {
  const triggerEvidence: string[] = [];
  const supportingEvidence: string[] = [];
  const uncertaintyFactors: string[] = [];
  let recommendation = '';

  const softRatio = signal.soft_clean / signal.soft_baseline;
  const hardRatio = signal.hard_clean / signal.hard_baseline;

  // 1. Evidence extraction
  if (softRatio > 1.1) {
    triggerEvidence.push(`Soft X-ray counts elevated ${Math.round((softRatio - 1) * 100)}% above baseline`);
  }
  if (signal.soft_gradient > signal.soft_std * 0.8) {
    triggerEvidence.push(`Positive Soft X-ray gradient spike: +${signal.soft_gradient.toFixed(1)} c/s²`);
  } else if (signal.soft_gradient < -signal.soft_std * 0.5) {
    triggerEvidence.push(`Negative Soft X-ray gradient (decay): ${signal.soft_gradient.toFixed(1)} c/s²`);
  }

  if (hardRatio > 1.2) {
    supportingEvidence.push(`Hard X-ray confirmation (HEL1OS): ${Math.round((hardRatio - 1) * 100)}% above baseline`);
  }
  if (signal.hard_gradient > signal.hard_std * 0.8) {
    supportingEvidence.push(`Positive Hard X-ray gradient: +${signal.hard_gradient.toFixed(1)} c/s²`);
  }

  if (signal.detector_agreement) {
    supportingEvidence.push('Dual-detector alignment confirmed (SoLEXS & HEL1OS agreement)');
  } else {
    uncertaintyFactors.push('Detector disagreement: SoLEXS soft counts rising without HEL1OS hard count confirmation');
  }

  if (signal.data_quality_score < 80) {
    uncertaintyFactors.push(`Reduced data quality score: ${signal.data_quality_score}% completeness/noise issues`);
  }
  if (signal.soft_std > 15) {
    uncertaintyFactors.push(`High signal variance (std dev = ${signal.soft_std.toFixed(1)} counts)`);
  }

  // 2. Feature contribution mapping (normalized to total 100% or absolute importance bars)
  // Let's generate feature importance based on phase
  let softGradImp = 15;
  let hardConfirmImp = 10;
  let detectorAgreeImp = 20;
  let patternSimImp = 12;
  let noisePenaltyImp = -2;

  switch (nowcast.phase) {
    case 'Quiet':
      softGradImp = 10;
      hardConfirmImp = 5;
      detectorAgreeImp = 25;
      patternSimImp = 8;
      noisePenaltyImp = -1;
      break;
    case 'Pre-Flare':
      softGradImp = 35;
      hardConfirmImp = 12;
      detectorAgreeImp = 18;
      patternSimImp = 20;
      noisePenaltyImp = -3;
      break;
    case 'Initiation':
      softGradImp = 40;
      hardConfirmImp = 18;
      detectorAgreeImp = 22;
      patternSimImp = 15;
      noisePenaltyImp = -5;
      break;
    case 'Rise':
      softGradImp = 30;
      hardConfirmImp = 35;
      detectorAgreeImp = 20;
      patternSimImp = 12;
      noisePenaltyImp = -7;
      break;
    case 'Peak':
      softGradImp = 15;
      hardConfirmImp = 30;
      detectorAgreeImp = 25;
      patternSimImp = 25;
      noisePenaltyImp = -5;
      break;
    case 'Decay':
    case 'Recovery':
      softGradImp = 20;
      hardConfirmImp = 15;
      detectorAgreeImp = 30;
      patternSimImp = 10;
      noisePenaltyImp = -2;
      break;
  }

  // If detector disagreement is present, shift importance to agreement/penalties
  if (!signal.detector_agreement) {
    detectorAgreeImp = -35;
  }

  const featureContributions: ExplanationFactor[] = [
    { name: 'Soft X-ray gradient', value: softGradImp, isPositive: softGradImp >= 0 },
    { name: 'Hard X-ray confirmation', value: hardConfirmImp, isPositive: hardConfirmImp >= 0 },
    { name: 'Detector agreement', value: detectorAgreeImp, isPositive: detectorAgreeImp >= 0 },
    { name: 'Pattern similarity', value: patternSimImp, isPositive: patternSimImp >= 0 },
    { name: 'Noise penalty', value: noisePenaltyImp, isPositive: noisePenaltyImp >= 0 },
  ];

  // Recommendations: Page 59 Recommendation Engine
  if (nowcast.phase === 'Quiet') {
    recommendation = 'Maintain nominal monitoring protocols. Continue data package ingestion.';
  } else if (nowcast.phase === 'Pre-Flare') {
    recommendation = 'Increase telemetry frequency. Notify satellite mission operators of elevated risk.';
  } else if (nowcast.phase === 'Initiation') {
    recommendation = 'Verify payload safe modes. Prepare radiation alerts for satellite operators and GPS grids.';
  } else if (nowcast.phase === 'Rise') {
    recommendation = 'Initiate escalation protocol. Instruct spacecraft controllers to enter protective standby.';
  } else if (nowcast.phase === 'Peak') {
    recommendation = 'Maintain alert status. Delay sensitive satellite orbital maneuvers or spacewalk operations.';
  } else {
    recommendation = 'Monitor recovery timeline. Verify instrument calibration once counts stabilize.';
  }

  // Defaults if arrays are empty
  if (triggerEvidence.length === 0) {
    triggerEvidence.push('No anomalous signals detected above background baseline');
  }
  if (supportingEvidence.length === 0) {
    supportingEvidence.push('Baseline checks align with quiet solar activity');
  }

  return {
    triggerEvidence,
    supportingEvidence,
    uncertaintyFactors,
    recommendation,
    featureContributions,
  };
};
