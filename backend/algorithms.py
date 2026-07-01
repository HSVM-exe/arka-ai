import math
import random
import time
from typing import List, Dict, Any, Tuple

# Type definitions matching the TS equivalents
RawTelemetryPoint = Dict[str, Any]
ProcessedSignal = Dict[str, Any]
NowcastResult = Dict[str, Any]
ForecastResult = Dict[str, Any]

def generate_scenario_point(
    scenario: str,
    index: int,
    start_time: int
) -> RawTelemetryPoint:
    timestamp = start_time + index
    soft_base = 120
    hard_base = 15
    
    # Default noise
    soft = soft_base + (random.random() - 0.5) * 8
    hard = hard_base + (random.random() - 0.5) * 3
    soft_valid = True
    hard_valid = True

    if scenario == 'quiet_day':
        pass
    elif scenario == 'gradual_preflare':
        if 100 <= index < 350:
            progress = (index - 100) / 250.0
            soft += progress * 350 + math.sin(progress * math.pi * 4) * 15
            if index >= 180:
                hard_progress = (index - 180) / 170.0
                hard += hard_progress * 60 + math.sin(hard_progress * math.pi * 3) * 5
        elif index >= 350:
            decay_progress = (index - 350) / 250.0 # 600 - 350 = 250
            soft += 350 * math.exp(-decay_progress * 2.5)
            hard += 60 * math.exp(-decay_progress * 3.5)
            
    elif scenario == 'impulsive_event':
        if 120 <= index < 180:
            progress = (index - 120) / 60.0
            soft += progress * 150
            hard += progress * 10
        elif 180 <= index < 220:
            rise_progress = (index - 180) / 40.0
            soft += 150 + rise_progress * 1800
            hard += 10 + (rise_progress ** 2) * 500
        elif index >= 220:
            decay_progress = (index - 220) / 380.0 # 600 - 220 = 380
            soft += 1950 * math.exp(-decay_progress * 4.0)
            hard += 510 * math.exp(-decay_progress * 6.0)
            
    elif scenario == 'noisy_false_spike':
        soft = soft_base + (random.random() - 0.5) * 50
        hard = hard_base + (random.random() - 0.5) * 20
        if index % 40 == 0:
            soft_valid = False
        if index % 60 == 0:
            hard_valid = False
            
        if index == 150:
            soft = 1600
            hard = 200
        elif index == 350:
            soft = 120
            hard = 800
            
    elif scenario == 'detector_disagreement':
        if 150 <= index < 250:
            progress = (index - 150) / 100.0
            soft += progress * 800
        elif index >= 250:
            decay_progress = (index - 250) / 350.0
            soft += 800 * math.exp(-decay_progress * 3.0)
            
    return {
        "timestamp": timestamp,
        "soft_xray_counts": max(0.0, soft),
        "hard_xray_counts": max(0.0, hard),
        "soft_valid": soft_valid,
        "hard_valid": hard_valid
    }

def process_telemetry_signal(
    raw_point: RawTelemetryPoint,
    history: List[Dict[str, Any]],
    settings: Dict[str, Any]
) -> ProcessedSignal:
    window_size = settings.get("baseline_window_size", 60)
    sensitivity = settings.get("threshold_sensitivity", 3.0)
    history_len = len(history)

    current_raw_soft = raw_point["soft_xray_counts"]
    current_raw_hard = raw_point["hard_xray_counts"]

    # 1. Median Clean filter of size 5
    soft_clean = current_raw_soft
    hard_clean = current_raw_hard

    if history_len >= 4:
        last4 = history[-4:]
        soft_vals = sorted([p.get("raw_soft_counts", p.get("soft_xray_counts")) for p in last4] + [current_raw_soft])
        hard_vals = sorted([p.get("raw_hard_counts", p.get("hard_xray_counts")) for p in last4] + [current_raw_hard])
        soft_clean = soft_vals[2]
        hard_clean = hard_vals[2]

    # 2. Baseline & Deviation
    soft_baseline = soft_clean
    hard_baseline = hard_clean
    soft_std = 1.0
    hard_std = 1.0

    if history_len >= 5:
        active_window_size = min(window_size, history_len)
        baseline_window = history[-active_window_size:]
        
        soft_mean = sum(p["soft_xray_counts"] for p in baseline_window) / active_window_size
        hard_mean = sum(p["hard_xray_counts"] for p in baseline_window) / active_window_size
        soft_baseline = soft_mean
        hard_baseline = hard_mean

        soft_var = sum((p["soft_xray_counts"] - soft_mean) ** 2 for p in baseline_window) / active_window_size
        hard_var = sum((p["hard_xray_counts"] - hard_mean) ** 2 for p in baseline_window) / active_window_size
        
        soft_std = max(1.5, math.sqrt(soft_var))
        hard_std = max(0.5, math.sqrt(hardVar) if 'hardVar' in locals() else math.sqrt(hard_var))
    elif history_len > 1:
        soft_mean = sum(p["soft_xray_counts"] for p in history) / history_len
        hard_mean = sum(p["hard_xray_counts"] for p in history) / history_len
        soft_baseline = soft_mean
        hard_baseline = hard_mean
        soft_std = 5.0
        hard_std = 2.0

    # 3. Gradient over last 3 seconds
    soft_gradient = 0.0
    hard_gradient = 0.0
    if history_len >= 3:
        prev_point = history[-3]
        soft_gradient = (soft_clean - prev_point["soft_xray_counts"]) / 3.0
        hard_gradient = (hard_clean - prev_point["hard_xray_counts"]) / 3.0

    # 4. Acceleration
    soft_acceleration = 0.0
    hard_acceleration = 0.0
    if history_len >= 6:
        prev_point = history[-1]
        soft_acceleration = soft_gradient - prev_point.get("soft_gradient", 0.0)
        hard_acceleration = hard_gradient - prev_point.get("hard_gradient", 0.0)

    # 5. Detector agreement
    detector_agreement = True
    is_soft_rising = soft_gradient > 2.0
    is_hard_rising = hard_gradient > 0.6
    soft_ratio = soft_clean / max(1.0, soft_baseline)
    hard_ratio = hard_clean / max(1.0, hard_baseline)

    if ((soft_ratio > 1.4 and hard_ratio < 1.1 and is_soft_rising and not is_hard_rising) or
        (hard_ratio > 1.8 and soft_ratio < 1.1 and is_hard_rising and not is_soft_rising)):
        detector_agreement = False

    # 6. Data quality score
    completeness = (50 if raw_point["soft_valid"] else 0) + (50 if raw_point["hard_valid"] else 0)
    soft_noise_ratio = soft_std / max(1.0, soft_clean)
    noise_score = max(0.0, min(100.0, 100.0 - (soft_noise_ratio * 200.0)))
    agreement_score = 100 if detector_agreement else 30
    
    time_continuity = 100
    if history_len > 0:
        last_time = history[-1]["timestamp"]
        diff = raw_point["timestamp"] - last_time
        if diff != 1:
            time_continuity = max(0, 100 - (abs(diff - 1) * 10))

    gti_valid = raw_point["soft_valid"] and raw_point["hard_valid"]
    gti_score = 100 if gti_valid else 0

    data_quality_score = round(
        0.30 * completeness +
        0.25 * noise_score +
        0.20 * agreement_score +
        0.15 * time_continuity +
        0.10 * gti_score
    )

    # 7. Consecutive triggers
    soft_consecutive_triggers = 0
    hard_consecutive_triggers = 0

    soft_threshold = soft_baseline + sensitivity * soft_std
    hard_threshold = hard_baseline + sensitivity * hard_std

    if soft_clean > soft_threshold:
        count = 1
        for p in reversed(history):
            pt_threshold = p.get("soft_baseline", 0.0) + sensitivity * p.get("soft_std", 1.0)
            if p["soft_xray_counts"] > pt_threshold:
                count += 1
            else:
                break
        soft_consecutive_triggers = count

    if hard_clean > hard_threshold:
        count = 1
        for p in reversed(history):
            pt_threshold = p.get("hard_baseline", 0.0) + sensitivity * p.get("hard_std", 1.0)
            if p["hard_xray_counts"] > pt_threshold:
                count += 1
            else:
                break
        hard_consecutive_triggers = count

    # 8. Consecutive positive gradients
    soft_consecutive_positive_gradients = 0
    hard_consecutive_positive_gradients = 0

    if soft_gradient > 2.0:
        count = 1
        for p in reversed(history):
            if p.get("soft_gradient", 0.0) > 2.0:
                count += 1
            else:
                break
        soft_consecutive_positive_gradients = count

    if hard_gradient > 0.6:
        count = 1
        for p in reversed(history):
            if p.get("hard_gradient", 0.0) > 0.6:
                count += 1
            else:
                break
        hard_consecutive_positive_gradients = count

    return {
        "soft_clean": soft_clean,
        "hard_clean": hard_clean,
        "raw_soft_counts": current_raw_soft,
        "raw_hard_counts": current_raw_hard,
        "soft_baseline": soft_baseline,
        "hard_baseline": hard_baseline,
        "soft_std": soft_std,
        "hard_std": hard_std,
        "soft_gradient": soft_gradient,
        "hard_gradient": hard_gradient,
        "soft_acceleration": soft_acceleration,
        "hard_acceleration": hard_acceleration,
        "detector_agreement": detector_agreement,
        "data_quality_score": data_quality_score,
        "soft_consecutive_triggers": soft_consecutive_triggers,
        "hard_consecutive_triggers": hard_consecutive_triggers,
        "soft_consecutive_positive_gradients": soft_consecutive_positive_gradients,
        "hard_consecutive_positive_gradients": hard_consecutive_positive_gradients
    }

def run_nowcast_engine(
    current_signal: ProcessedSignal,
    prev_phase: str = "Quiet"
) -> NowcastResult:
    soft = current_signal["soft_clean"]
    soft_base = current_signal["soft_baseline"]
    soft_std = current_signal["soft_std"]
    soft_grad = current_signal["soft_gradient"]

    is_soft_triggered = current_signal["soft_consecutive_triggers"] >= 3
    is_hard_triggered = current_signal["hard_consecutive_triggers"] >= 3

    is_soft_rising = current_signal["soft_consecutive_positive_gradients"] >= 2
    is_hard_rising = current_signal["hard_consecutive_positive_gradients"] >= 2
    is_soft_falling = soft_grad < -soft_std * 0.5

    phase = "Quiet"
    is_flare_active = False
    explanation = ""

    if not is_soft_triggered and not is_hard_triggered:
        if is_soft_rising and soft > soft_base + soft_std:
            phase = "Pre-Flare"
            is_flare_active = False
            explanation = "Gradual rising trend detected in soft X-ray channel (SoLEXS). Early thermal buildup."
        elif prev_phase in ["Peak", "Decay"]:
            phase = "Recovery"
            is_flare_active = True
            explanation = "Solar activity returning towards baseline. Recovery phase."
        elif prev_phase == "Recovery" and soft > soft_base + soft_std * 0.5:
            phase = "Recovery"
            is_flare_active = True
            explanation = "Recovering back to nominal solar baseline levels."
        else:
            phase = "Quiet"
            is_flare_active = False
            explanation = "Solar activity within normal baseline fluctuations. Quiet Sun state."
            
    elif is_soft_triggered and not is_hard_triggered:
        if prev_phase in ["Pre-Flare", "Quiet"]:
            phase = "Initiation"
            is_flare_active = True
            explanation = "Soft X-ray crossed adaptive threshold (+kσ). Flare initiation candidate."
        elif prev_phase in ["Peak", "Decay"]:
            phase = "Recovery"
            is_flare_active = True
            explanation = "Solar activity returning towards baseline. Recovery phase."
        else:
            phase = "Initiation" if prev_phase == "Initiation" else "Recovery"
            is_flare_active = True
            explanation = "Elevated soft X-ray flux detected, awaiting hard X-ray confirmation."
            
    elif is_soft_triggered and is_hard_triggered:
        if is_soft_rising and is_hard_rising:
            phase = "Rise"
            is_flare_active = True
            explanation = "Rapid rising trend in both soft and hard channels. High-energy impulsive heating."
        elif soft > soft_base * 1.5:
            phase = "Peak"
            is_flare_active = True
            explanation = "Solar flux stabilized at elevated levels. Solar flare peak reached."
        elif is_soft_falling:
            phase = "Decay"
            is_flare_active = True
            explanation = "Thermal emission decaying. Hard X-ray impulse has subsided."
        else:
            phase = "Peak" if prev_phase == "Rise" else prev_phase
            is_flare_active = True
            explanation = "Elevated counts across detectors. High activity ongoing."
            
    elif not is_soft_triggered and is_hard_triggered:
        phase = "Initiation"
        is_flare_active = True
        explanation = "Hard X-ray triggered without soft X-ray confirmation. Check for detector anomalies."

    # Confidence calculation
    confidence_points = 100
    if not current_signal["detector_agreement"]:
        confidence_points -= 40
    if current_signal["data_quality_score"] < 70:
        confidence_points -= (70 - current_signal["data_quality_score"])
    if phase == "Rise" and not is_hard_triggered:
        confidence_points -= 20
    if current_signal["soft_std"] > 25:
        confidence_points -= 15

    confidence = max(10, min(100, round(confidence_points)))

    return {
        "phase": phase,
        "is_flare_active": is_flare_active,
        "confidence": confidence,
        "explanation": explanation
    }

def run_forecasting_engine(
    current_signal: ProcessedSignal,
    nowcast: NowcastResult
) -> ForecastResult:
    phase = nowcast["phase"]
    soft_grad = current_signal["soft_gradient"]
    hard_grad = current_signal["hard_gradient"]
    
    # Calculate base probability score
    score = 5.0
    reasoning = "Background solar activity remains at nominal quiet levels."

    if phase == "Pre-Flare":
        score = 25.0
        reasoning = "Thermal buildup detected. Slopes indicate gradual pre-heating."
    elif phase == "Initiation":
        score = 65.0
        reasoning = "Soft X-ray trigger confirmed. Immediate flare onset suspected."
    elif phase == "Rise":
        score = 95.0
        reasoning = "Coincident rise across soft and hard X-ray channels. Impulsive heating confirmed."
    elif phase == "Peak":
        score = 80.0
        reasoning = "Flare flux stabilized at peak. Ongoing high-energy ionization."
    elif phase == "Decay":
        score = 30.0
        reasoning = "Thermal emission decaying back to baseline."
    elif phase == "Recovery":
        score = 15.0
        reasoning = "Post-flare recovery window. Conditions stabilizing."

    # Weight adjustments based on gradients
    if soft_grad > 5.0:
        score += 10.0
    if hard_grad > 1.5:
        score += 15.0

    # Safety limits
    prob_10m = min(99.0, max(1.0, score))
    prob_20m = min(99.0, max(1.0, prob_10m * 0.9))
    prob_30m = min(99.0, max(1.0, prob_10m * 0.8))
    prob_60m = min(99.0, max(1.0, prob_10m * 0.6))

    return {
        "prob_10m": round(prob_10m),
        "prob_20m": round(prob_20m),
        "prob_30m": round(prob_30m),
        "prob_60m": round(prob_60m),
        "lead_time_est_min": 15 if phase == "Pre-Flare" else (5 if phase == "Initiation" else 0),
        "confidence": nowcast["confidence"],
        "explanation": reasoning
    }

def determine_severity(phase: str, prob_10m: float) -> str:
    if phase in ["Rise", "Peak"]:
        return "Critical" if prob_10m >= 80 else "High"
    if phase in ["Initiation", "Decay"]:
        return "Moderate"
    if phase == "Pre-Flare" or prob_10m > 30:
        return "Elevated"
    return "Low"
