import time
import uuid
import logging
import asyncio
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import algorithms

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TelemetryWorker")

class TelemetryWorker:
    def __init__(self):
        self.active_scenario = "gradual_preflare"
        self.simulation_index = 60
        self.start_time = int(time.time()) - 600
        self.subscribers: List[asyncio.Queue] = []
        self.is_running = True
        self.loop_task = None
        self.history_buffer: List[Dict[str, Any]] = []

    def get_settings(self, db: Session) -> Dict[str, Any]:
        settings = db.query(models.SystemSettings).first()
        if not settings:
            settings = models.SystemSettings(id=1)
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return {
            "threshold_sensitivity": settings.threshold_sensitivity,
            "baseline_window_size": settings.baseline_window_size,
            "alert_sensitivity": settings.alert_sensitivity,
            "chart_window_size": settings.chart_window_size,
            "demo_speed": settings.demo_speed,
            "detector_weight": settings.detector_weight
        }

    def clear_database(self, db: Session):
        logger.info("Clearing database history...")
        db.query(models.TelemetryHistory).delete()
        db.query(models.Alert).delete()
        db.commit()

    def warmup_scenario(self, db: Session):
        self.clear_database(db)
        logger.info(f"Warming up scenario '{self.active_scenario}' (first 60 seconds)...")
        settings = self.get_settings(db)
        
        warmup_points = []
        self.history_buffer = []
        
        for idx in range(60):
            raw_pt = algorithms.generate_scenario_point(self.active_scenario, idx, self.start_time)
            processed = algorithms.process_telemetry_signal(raw_pt, self.history_buffer, settings)
            nowcast = algorithms.run_nowcast_engine(processed, "Quiet")
            forecast = algorithms.run_forecasting_engine(processed, nowcast)
            
            severity = algorithms.determine_severity(nowcast["phase"], forecast["prob_10m"])
            
            new_db_pt = models.TelemetryHistory(
                timestamp=raw_pt["timestamp"],
                soft_xray_counts=processed["soft_clean"],
                hard_xray_counts=processed["hard_clean"],
                soft_baseline=processed["soft_baseline"],
                hard_baseline=processed["hard_baseline"],
                soft_std=processed["soft_std"],
                hard_std=processed["hard_std"],
                soft_gradient=processed["soft_gradient"],
                hard_gradient=processed["hard_gradient"],
                detector_agreement=processed["detector_agreement"],
                data_quality_score=processed["data_quality_score"],
                nowcast_phase=nowcast["phase"],
                forecast_probability=forecast["prob_10m"],
                confidence=nowcast["confidence"],
                alert_level=severity
            )
            
            warmup_points.append(new_db_pt)
            
            # Append to buffer for rolling algorithms calculation
            pt_dict = {
                "timestamp": raw_pt["timestamp"],
                "soft_xray_counts": processed["soft_clean"],
                "hard_xray_counts": processed["hard_clean"],
                "raw_soft_counts": raw_pt["soft_xray_counts"],
                "raw_hard_counts": raw_pt["hard_xray_counts"],
                "soft_baseline": processed["soft_baseline"],
                "hard_baseline": processed["hard_baseline"],
                "soft_std": processed["soft_std"],
                "hard_std": processed["hard_std"],
                "soft_gradient": processed["soft_gradient"],
                "hard_gradient": processed["hard_gradient"],
                "nowcast_phase": nowcast["phase"]
            }
            self.history_buffer.append(pt_dict)
            
        db.add_all(warmup_points)
        db.commit()
        logger.info("Warmup complete. 60 baseline points saved.")

    async def change_scenario(self, scenario: str):
        self.active_scenario = scenario
        self.simulation_index = 60
        self.start_time = int(time.time()) - 600
        
        db = SessionLocal()
        try:
            self.warmup_scenario(db)
        finally:
            db.close()
            
        # Notify subscribers of scenarios reset
        await self.broadcast({"type": "reset", "scenario": scenario})

    async def broadcast(self, message: Dict[str, Any]):
        for queue in list(self.subscribers):
            try:
                await queue.put(message)
            except Exception as e:
                logger.error(f"Error publishing to SSE subscriber: {e}")
                self.subscribers.remove(queue)

    async def run_loop(self):
        logger.info("Starting background ingestion loop...")
        
        # Initial database setup and warmup
        db = SessionLocal()
        try:
            self.warmup_scenario(db)
        finally:
            db.close()

        while self.is_running:
            db = SessionLocal()
            try:
                settings = self.get_settings(db)
                speed = settings.get("demo_speed", 1)

                # Loop simulation index back to 0 if it hits 600
                if self.simulation_index >= 600:
                    logger.info("Looping simulation back to warmup state...")
                    self.simulation_index = 60
                    self.start_time = int(time.time()) - 600
                    self.warmup_scenario(db)
                    db.close()
                    continue

                raw_pt = algorithms.generate_scenario_point(self.active_scenario, self.simulation_index, self.start_time)
                processed = algorithms.process_telemetry_signal(raw_pt, self.history_buffer, settings)
                
                prev_phase = "Quiet"
                if len(self.history_buffer) > 0:
                    prev_phase = self.history_buffer[-1]["nowcast_phase"]
                    
                nowcast = algorithms.run_nowcast_engine(processed, prev_phase)
                forecast = algorithms.run_forecasting_engine(processed, nowcast)
                
                severity = algorithms.determine_severity(nowcast["phase"], forecast["prob_10m"])
                
                # Check for alert phase transition
                if nowcast["phase"] != prev_phase and nowcast["phase"] != "Quiet":
                    alert_msg = f"Phase change detected: {prev_phase} ➔ {nowcast['phase']}. {nowcast['explanation']}"
                    alert_id = str(uuid.uuid4())[:8]
                    new_alert = models.Alert(
                        id=alert_id,
                        timestamp=raw_pt["timestamp"],
                        phase=nowcast["phase"],
                        severity=severity,
                        confidence=nowcast["confidence"],
                        message=alert_msg,
                        status="New"
                    )
                    db.add(new_alert)
                    
                    # Broadcast alert notice immediately
                    await self.broadcast({
                        "type": "alert",
                        "data": {
                            "id": alert_id,
                            "timestamp": raw_pt["timestamp"],
                            "phase": nowcast["phase"],
                            "severity": severity,
                            "confidence": nowcast["confidence"],
                            "message": alert_msg,
                            "status": "New"
                        }
                    })

                # Insert telemetry history point
                new_pt = models.TelemetryHistory(
                    timestamp=raw_pt["timestamp"],
                    soft_xray_counts=processed["soft_clean"],
                    hard_xray_counts=processed["hard_clean"],
                    soft_baseline=processed["soft_baseline"],
                    hard_baseline=processed["hard_baseline"],
                    soft_std=processed["soft_std"],
                    hard_std=processed["hard_std"],
                    soft_gradient=processed["soft_gradient"],
                    hard_gradient=processed["hard_gradient"],
                    detector_agreement=processed["detector_agreement"],
                    data_quality_score=processed["data_quality_score"],
                    nowcast_phase=nowcast["phase"],
                    forecast_probability=forecast["prob_10m"],
                    confidence=nowcast["confidence"],
                    alert_level=severity
                )
                db.add(new_pt)
                db.commit()

                # Append to history buffer for next rolling calculations
                pt_dict = {
                    "timestamp": raw_pt["timestamp"],
                    "soft_xray_counts": processed["soft_clean"],
                    "hard_xray_counts": processed["hard_clean"],
                    "raw_soft_counts": raw_pt["soft_xray_counts"],
                    "raw_hard_counts": raw_pt["hard_xray_counts"],
                    "soft_baseline": processed["soft_baseline"],
                    "hard_baseline": processed["hard_baseline"],
                    "soft_std": processed["soft_std"],
                    "hard_std": processed["hard_std"],
                    "soft_gradient": processed["soft_gradient"],
                    "hard_gradient": processed["hard_gradient"],
                    "nowcast_phase": nowcast["phase"]
                }
                self.history_buffer.append(pt_dict)
                if len(self.history_buffer) > 300:
                    self.history_buffer = self.history_buffer[-300:]

                # Construct stream payload
                payload = {
                    "type": "tick",
                    "data": {
                        "timestamp": raw_pt["timestamp"],
                        "soft_xray_counts": processed["soft_clean"],
                        "hard_xray_counts": processed["hard_clean"],
                        "soft_baseline": processed["soft_baseline"],
                        "hard_baseline": processed["hard_baseline"],
                        "soft_std": processed["soft_std"],
                        "hard_std": processed["hard_std"],
                        "soft_gradient": processed["soft_gradient"],
                        "hard_gradient": processed["hard_gradient"],
                        "detector_agreement": processed["detector_agreement"],
                        "data_quality_score": processed["data_quality_score"],
                        "nowcast_phase": nowcast["phase"],
                        "forecast_probability": forecast["prob_10m"],
                        "confidence": nowcast["confidence"],
                        "alert_level": severity,
                        # Pass raw for health checks
                        "raw_soft_valid": raw_pt["soft_valid"],
                        "raw_hard_valid": raw_pt["hard_valid"],
                        "raw_soft_counts": raw_pt["soft_xray_counts"],
                        "raw_hard_counts": raw_pt["hard_xray_counts"]
                    }
                }
                await self.broadcast(payload)
                
                self.simulation_index += 1

            except Exception as e:
                logger.error(f"Exception in telemetry background loop: {e}")
                db.rollback()
            finally:
                db.close()

            # dynamic interval based on speed setting
            interval = 1.0 / max(1, speed)
            await asyncio.sleep(interval)

    def start(self):
        self.is_running = True
        self.loop_task = asyncio.create_task(self.run_loop())

    def stop(self):
        self.is_running = False
        if self.loop_task:
            self.loop_task.cancel()

worker = TelemetryWorker()
