export interface RawTelemetryPoint {
  timestamp: number;
  soft_xray_counts: number;
  hard_xray_counts: number;
  soft_valid: boolean;
  hard_valid: boolean;
}

export type ScenarioType = 'quiet_day' | 'gradual_preflare' | 'impulsive_event' | 'noisy_false_spike' | 'detector_disagreement';

export const generateScenarioData = (
  scenario: ScenarioType,
  lengthSeconds: number = 600
): RawTelemetryPoint[] => {
  const points: RawTelemetryPoint[] = [];
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - lengthSeconds;

  let softBase = 120;
  let hardBase = 15;

  for (let i = 0; i < lengthSeconds; i++) {
    const timestamp = startTime + i;
    let soft = softBase + (Math.random() - 0.5) * 8; // default noise
    let hard = hardBase + (Math.random() - 0.5) * 3;
    let soft_valid = true;
    let hard_valid = true;

    // Apply scenario profiles
    switch (scenario) {
      case 'quiet_day':
        // Standard baseline with minor fluctuations
        break;

      case 'gradual_preflare':
        // Slowly rise soft X-rays starting around t=100s, peaking around t=350s, then decaying
        if (i >= 100 && i < 350) {
          const progress = (i - 100) / 250;
          soft += progress * 350 + Math.sin(progress * Math.PI * 4) * 15;
          // Hard X-rays rise slightly later (t=180s) representing gradual heating
          if (i >= 180) {
            const hardProgress = (i - 180) / 170;
            hard += hardProgress * 60 + Math.sin(hardProgress * Math.PI * 3) * 5;
          }
        } else if (i >= 350) {
          // Slow decay back to baseline
          const decayProgress = (i - 350) / (lengthSeconds - 350);
          soft += 350 * Math.exp(-decayProgress * 2.5);
          hard += 60 * Math.exp(-decayProgress * 3.5);
        }
        break;

      case 'impulsive_event':
        // Sudden spike at t=150s, peak at t=200s, sharp decay
        if (i >= 120 && i < 180) {
          // Pre-flare build up
          const progress = (i - 120) / 60;
          soft += progress * 150;
          hard += progress * 10;
        } else if (i >= 180 && i < 220) {
          // Impulsive rise phase
          const riseProgress = (i - 180) / 40;
          soft += 150 + riseProgress * 1800; // spikes up to ~2000
          hard += 10 + Math.pow(riseProgress, 2) * 500; // spikes up to ~500
        } else if (i >= 220) {
          // Decay phase
          const decayProgress = (i - 220) / (lengthSeconds - 220);
          soft += 1950 * Math.exp(-decayProgress * 4.0);
          hard += 510 * Math.exp(-decayProgress * 6.0);
        }
        break;

      case 'noisy_false_spike':
        // Very high background noise.
        // A single-sample massive spike at t=150s, and t=350s
        soft = softBase + (Math.random() - 0.5) * 50;
        hard = hardBase + (Math.random() - 0.5) * 20;

        // Occasional missing/invalid packets (simulate telemetry issues)
        if (i % 40 === 0) {
          soft_valid = false;
        }
        if (i % 60 === 0) {
          hard_valid = false;
        }

        // Single-sample spikes
        if (i === 150) {
          soft = 1600;
          hard = 200;
        }
        if (i === 350) {
          soft = 120;
          hard = 800;
        }
        break;

      case 'detector_disagreement':
        // Soft X-rays rise starting t=150s, peaking t=250s, but Hard X-rays remain flat
        if (i >= 150 && i < 250) {
          const progress = (i - 150) / 100;
          soft += progress * 800;
        } else if (i >= 250) {
          const decayProgress = (i - 250) / (lengthSeconds - 250);
          soft += 800 * Math.exp(-decayProgress * 3.0);
        }
        // Hard X-ray stays flat at baseline, no rise.
        break;
    }

    points.push({
      timestamp,
      soft_xray_counts: Math.max(0, soft),
      hard_xray_counts: Math.max(0, hard),
      soft_valid,
      hard_valid,
    });
  }

  return points;
};
