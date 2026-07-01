import type { ImpactRisk } from '../types';
import type { NowcastResult } from './nowcastingService';
import type { ForecastResult } from './forecastingService';

export const assessSpaceWeatherImpact = (
  nowcast: NowcastResult,
  forecast: ForecastResult
): ImpactRisk[] => {
  const phase = nowcast.phase;
  const confidence = nowcast.confidence;
  
  // Approximate flare classification from forecasting
  let flareClass: 'Quiet' | 'C' | 'M' | 'X' = 'Quiet';
  if (phase === 'Rise' || phase === 'Peak') {
    if (forecast.prob_10m > 95) flareClass = 'X';
    else if (forecast.prob_10m > 80) flareClass = 'M';
    else flareClass = 'C';
  } else if (phase === 'Initiation') {
    flareClass = 'C';
  } else if (phase === 'Pre-Flare') {
    flareClass = 'C'; // precursor equivalent
  }

  // Core risk domains
  const domains = [
    'Satellite Electronics',
    'GPS Navigation',
    'HF Radio Communication',
    'Aviation Communication',
    'Power Grid Vulnerability',
    'Astronaut Radiation Exposure',
    'Mission Operations'
  ];

  return domains.map(domain => {
    let level: 'Low' | 'Elevated' | 'Moderate' | 'High' | 'Critical' = 'Low';
    let explanation = '';
    let recommendation = '';

    // Impact mapping matrix based on flare classification and domain
    if (flareClass === 'Quiet') {
      level = 'Low';
      explanation = 'Quiet solar baseline. No radiation or geomagnetic storm conditions.';
      recommendation = 'Maintain routine checks.';
    } else if (flareClass === 'C') {
      level = 'Elevated';
      explanation = 'Minor C-class activity. Slight X-ray flux increase.';
      recommendation = 'Monitor signal stability.';
      
      if (domain === 'HF Radio Communication' || domain === 'GPS Navigation') {
        level = 'Moderate';
        explanation = 'Minor D-region ionospheric absorption. GPS signals might show minor delay.';
        recommendation = 'Flag potential GPS jitter.';
      }
    } else if (flareClass === 'M') {
      level = 'Moderate';
      explanation = 'Medium M-class solar event. Broad X-ray flare detected.';
      recommendation = 'Prepare mitigation procedures.';

      if (domain === 'Satellite Electronics' || domain === 'Astronaut Radiation Exposure') {
        level = 'High';
        explanation = 'Increased solar proton flux. Single-event upsets (SEU) possible in orbit.';
        recommendation = 'Verify satellite telemetry frequency.';
      } else if (domain === 'HF Radio Communication' || domain === 'Aviation Communication') {
        level = 'High';
        explanation = 'Significant radio blackout (R1-R2 level) on sunlit side of Earth.';
        recommendation = 'Alert communication channels.';
      }
    } else if (flareClass === 'X') {
      level = 'High';
      explanation = 'Severe X-class solar flare. Intense energetic particle release.';
      recommendation = 'Execute critical alerts.';

      if (domain === 'Satellite Electronics' || domain === 'Astronaut Radiation Exposure') {
        level = 'Critical';
        explanation = 'Massive solar particle event (SPE). High risk of terminal satellite chip failure.';
        recommendation = 'Command payload standby; alert ISS crew.';
      } else if (domain === 'HF Radio Communication' || domain === 'Aviation Communication' || domain === 'GPS Navigation') {
        level = 'Critical';
        explanation = 'Wide-scale radio blackout (R3+ level). Total loss of HF comms on sunlit side.';
        recommendation = 'Initiate backup communications.';
      } else if (domain === 'Power Grid Vulnerability') {
        level = 'High';
        explanation = 'Risk of geomagnetically induced currents (GIC) in high-latitude transformers.';
        recommendation = 'Coordinate grid load balance.';
      }
    }

    // Demote risk level if confidence is low (< 60%) to prevent false-alarm panic (Operational Trust)
    if (confidence < 60 && level !== 'Low') {
      const levels: ('Low' | 'Elevated' | 'Moderate' | 'High' | 'Critical')[] = ['Low', 'Elevated', 'Moderate', 'High', 'Critical'];
      const index = levels.indexOf(level);
      level = levels[Math.max(1, index - 1)]; // demote by 1, but keep at least Elevated
      explanation = `[Low Confidence] ${explanation}`;
      recommendation = `[Verify telemetry first] ${recommendation}`;
    }

    return {
      domain,
      risk_level: level,
      explanation,
      recommendation
    };
  });
};
