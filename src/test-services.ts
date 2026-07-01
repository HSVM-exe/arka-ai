import { generateScenarioData } from './services/dataSimulationService';
import { processTelemetrySignal } from './services/signalProcessingService';
import { runNowcastEngine } from './services/nowcastingService';
import { runForecastingEngine } from './services/forecastingService';

// Mock settings
const settings = {
  thresholdSensitivity: 3.0,
  baselineWindowSize: 60,
  alertSensitivity: 'Normal' as const,
  chartWindowSize: 300,
  demoSpeed: 1 as const,
  detectorWeight: 0.5
};

const runTests = () => {
  console.log('--------------------------------------------------');
  console.log('SolarShield AI - Core Service Verification Tests');
  console.log('--------------------------------------------------\n');

  // Test 1: Quiet Day produces Quiet phase
  console.log('Test 1: Running Quiet Day Scenario...');
  const quietData = generateScenarioData('quiet_day', 100);
  let quietHistory: any[] = [];
  let finalQuietPhase = 'Quiet';

  for (const pt of quietData) {
    const processed = processTelemetrySignal(pt, quietHistory, settings);
    const nowcast = runNowcastEngine(processed, quietHistory[quietHistory.length - 1]?.nowcast_phase || 'Quiet');
    const forecast = runForecastingEngine(processed, nowcast);
    
    const newPt = { 
      ...processed, 
      timestamp: pt.timestamp,
      soft_xray_counts: processed.soft_clean, 
      hard_xray_counts: processed.hard_clean, 
      raw_soft_counts: processed.raw_soft_counts,
      raw_hard_counts: processed.raw_hard_counts,
      nowcast_phase: nowcast.phase, 
      forecast_probability: forecast.prob_10m 
    };
    quietHistory.push(newPt);
    finalQuietPhase = nowcast.phase;
  }
  
  if (finalQuietPhase === 'Quiet') {
    console.log('✅ Test 1 Passed: Quiet data remains in Quiet phase.\n');
  } else {
    console.log(`❌ Test 1 Failed: Quiet data ended in ${finalQuietPhase} phase.\n`);
  }

  // Test 2: Impulsive Event triggers Rise / Peak phase
  console.log('Test 2: Running Impulsive Event Scenario...');
  const impulsiveData = generateScenarioData('impulsive_event', 230);
  let impulsiveHistory: any[] = [];
  let phasesVisited = new Set<string>();

  for (const pt of impulsiveData) {
    const processed = processTelemetrySignal(pt, impulsiveHistory, settings);
    const nowcast = runNowcastEngine(processed, impulsiveHistory[impulsiveHistory.length - 1]?.nowcast_phase || 'Quiet');
    const forecast = runForecastingEngine(processed, nowcast);
    
    const newPt = { 
      ...processed, 
      timestamp: pt.timestamp,
      soft_xray_counts: processed.soft_clean, 
      hard_xray_counts: processed.hard_clean, 
      raw_soft_counts: processed.raw_soft_counts,
      raw_hard_counts: processed.raw_hard_counts,
      nowcast_phase: nowcast.phase, 
      forecast_probability: forecast.prob_10m 
    };
    impulsiveHistory.push(newPt);
    phasesVisited.add(nowcast.phase);
  }

  if (phasesVisited.has('Rise') || phasesVisited.has('Peak') || phasesVisited.has('Initiation')) {
    console.log(`✅ Test 2 Passed: Impulsive event successfully triggered phases: ${Array.from(phasesVisited).join(', ')}.\n`);
  } else {
    console.log(`❌ Test 2 Failed: Impulsive event did not trigger alert phases. Visited: ${Array.from(phasesVisited).join(', ')}.\n`);
  }

  // Test 3: Noisy False Spike does not create high confidence alert
  console.log('Test 3: Running Noisy False Spike Scenario (with warm-up buffer)...');
  const noisyData = generateScenarioData('noisy_false_spike', 600);
  let noisyHistory: any[] = [];
  let maxConfidenceDuringSpike = 0;
  let phasesVisitedNoisy = new Set<string>();

  for (let i = 0; i < noisyData.length; i++) {
    const pt = noisyData[i];
    const processed = processTelemetrySignal(pt, noisyHistory, settings);
    const nowcast = runNowcastEngine(processed, noisyHistory[noisyHistory.length - 1]?.nowcast_phase || 'Quiet');
    const forecast = runForecastingEngine(processed, nowcast);
    
    const newPt = { 
      ...processed, 
      timestamp: pt.timestamp,
      soft_xray_counts: processed.soft_clean, 
      hard_xray_counts: processed.hard_clean, 
      raw_soft_counts: processed.raw_soft_counts,
      raw_hard_counts: processed.raw_hard_counts,
      nowcast_phase: nowcast.phase, 
      forecast_probability: forecast.prob_10m 
    };
    noisyHistory.push(newPt);
    
    if (i >= settings.baselineWindowSize) {
      phasesVisitedNoisy.add(nowcast.phase);
      // We only measure confidence of active flare warning alerts (Initiation/Rise/Peak/Decay/Recovery)
      if (nowcast.is_flare_active) {
        maxConfidenceDuringSpike = Math.max(maxConfidenceDuringSpike, nowcast.confidence);
      }
    }
  }

  // Spikes should not trigger high-confidence active flare alarms
  if (maxConfidenceDuringSpike < 75) {
    console.log(`✅ Test 3 Passed: Spikes filtered or flagged with low/moderate confidence (Max Confidence: ${maxConfidenceDuringSpike}%). Visited: ${Array.from(phasesVisitedNoisy).join(', ')}\n`);
  } else {
    console.log(`❌ Test 3 Failed: Spike triggered high-confidence alert (Max Confidence: ${maxConfidenceDuringSpike}%). Visited: ${Array.from(phasesVisitedNoisy).join(', ')}\n`);
  }

  // Test 4: Detector Disagreement lowers confidence
  console.log('Test 4: Running Detector Disagreement Scenario...');
  const disagreeData = generateScenarioData('detector_disagreement', 200);
  let disagreeHistory: any[] = [];
  let minConfidenceDuringRise = 100;
  let phasesVisitedDisagree = new Set<string>();

  for (const pt of disagreeData) {
    const processed = processTelemetrySignal(pt, disagreeHistory, settings);
    const nowcast = runNowcastEngine(processed, disagreeHistory[disagreeHistory.length - 1]?.nowcast_phase || 'Quiet');
    const forecast = runForecastingEngine(processed, nowcast);
    
    const newPt = { 
      ...processed, 
      timestamp: pt.timestamp,
      soft_xray_counts: processed.soft_clean, 
      hard_xray_counts: processed.hard_clean, 
      raw_soft_counts: processed.raw_soft_counts,
      raw_hard_counts: processed.raw_hard_counts,
      nowcast_phase: nowcast.phase, 
      forecast_probability: forecast.prob_10m 
    };
    disagreeHistory.push(newPt);
    phasesVisitedDisagree.add(nowcast.phase);

    if (nowcast.phase !== 'Quiet') {
      minConfidenceDuringRise = Math.min(minConfidenceDuringRise, nowcast.confidence);
    }
  }

  if (minConfidenceDuringRise < 70) {
    console.log(`✅ Test 4 Passed: Disagreement successfully penalized confidence level (Min Confidence during event: ${minConfidenceDuringRise}%).\n`);
  } else {
    console.log(`❌ Test 4 Failed: Disagreement did not lower confidence (Min Confidence during event: ${minConfidenceDuringRise}%). Visited: ${Array.from(phasesVisitedDisagree).join(', ')}\n`);
  }

  console.log('--------------------------------------------------');
  console.log('All core service tests executed.');
  console.log('--------------------------------------------------');
};

runTests();
