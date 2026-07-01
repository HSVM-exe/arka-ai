import json
import logging
import asyncio
import hashlib
import hmac
import base64
import time
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db, engine, Base
import models
import schemas
from worker import worker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SolarShieldAPI")

app = FastAPI(title="SolarShield AI Platform API", version="1.0.0")

# Enable CORS for React frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to React host
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Lightweight Cryptographic Token Manager (No PyJWT required!)
# -------------------------------------------------------------
SECRET_KEY = b"solarshield-mission-control-security-secret-key-2026"

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(username: str, role: str) -> str:
    # Expire in 24 hours
    expires = int(time.time()) + 86400
    payload = f"{username}:{role}:{expires}"
    signature = hmac.new(SECRET_KEY, payload.encode(), hashlib.sha256).hexdigest()
    token = f"{payload}:{signature}"
    return base64.b64encode(token.encode()).decode()

def verify_access_token(token_str: str) -> Optional[dict]:
    try:
        decoded = base64.b64decode(token_str.encode()).decode()
        parts = decoded.split(":")
        if len(parts) != 4:
            return None
        username, role, expires, signature = parts[0], parts[1], int(parts[2]), parts[3]
        
        # Check expiration
        if time.time() > expires:
            return None
            
        # Verify signature
        payload = f"{username}:{role}:{expires}"
        expected_sig = hmac.new(SECRET_KEY, payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
            
        return {"username": username, "role": role}
    except Exception:
        return None

# Dependency to retrieve the current user from headers
def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    token = authorization.split(" ")[1]
    user_data = verify_access_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or authorization signature invalid"
        )
    return user_data

# -------------------------------------------------------------
# App Lifecycle & Pre-population
# -------------------------------------------------------------
@app.on_event("startup")
def startup_event():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Pre-populate default users
    db = next(get_db())
    try:
        if db.query(models.User).count() == 0:
            logger.info("Pre-populating default system users...")
            default_users = [
                models.User(username="admin1", password_hash=hash_password("password"), role="SysAdmin"),
                models.User(username="officer1", password_hash=hash_password("password"), role="Officer"),
                models.User(username="observer1", password_hash=hash_password("password"), role="Observer"),
            ]
            db.add_all(default_users)
            db.commit()
            logger.info("Default users registered successfully.")
    except Exception as e:
        logger.error(f"Error during default user setup: {e}")
    finally:
        db.close()

    logger.info("Starting background telemetry simulator loop...")
    worker.start()

@app.on_event("shutdown")
def shutdown_event():
    logger.info("Stopping background telemetry simulator loop...")
    worker.stop()

# -------------------------------------------------------------
# Auth API Routing
# -------------------------------------------------------------
@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login_operator(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password credentials")
    
    hashed = hash_password(payload.password)
    if user.password_hash != hashed:
        raise HTTPException(status_code=401, detail="Invalid username or password credentials")
    
    token = create_access_token(user.username, user.role)
    logger.info(f"Operator '{user.username}' ({user.role}) authenticated successfully.")
    return {
        "access_token": token,
        "token_type": "Bearer",
        "role": user.role,
        "username": user.username
    }

# -------------------------------------------------------------
# Audit Logs API
# -------------------------------------------------------------
@app.get("/api/audit-logs", response_model=list[schemas.AuditLogSchema])
def get_audit_logs(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # SysAdmin and Officers are allowed to view audit logs
    if current_user["role"] not in ["SysAdmin", "Officer"]:
        raise HTTPException(status_code=403, detail="Permission denied. Requires elevated authorization.")
    
    logs = db.query(models.AuditLog).order_by(models.models.AuditLog.id.desc()).all() if hasattr(models.models, 'AuditLog') else db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).all()
    return logs

# -------------------------------------------------------------
# Telemetry Ingestion API (Publicly readable)
# -------------------------------------------------------------
@app.get("/api/telemetry/history", response_model=list[schemas.TelemetryPoint])
def get_telemetry_history(limit: int = 300, db: Session = Depends(get_db)):
    points = db.query(models.TelemetryHistory).order_by(models.TelemetryHistory.timestamp.desc()).limit(limit).all()
    return list(reversed(points))

@app.get("/api/telemetry/stream")
async def get_telemetry_stream():
    async def event_generator():
        queue = asyncio.Queue()
        worker.subscribers.append(queue)
        logger.info(f"New client connected to SSE. Total clients: {len(worker.subscribers)}")
        try:
            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            logger.info("SSE client connection cancelled.")
        finally:
            if queue in worker.subscribers:
                worker.subscribers.remove(queue)
            logger.info(f"Client disconnected from SSE. Remaining clients: {len(worker.subscribers)}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/telemetry/scenario")
async def change_scenario(req: schemas.ScenarioChangeRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Any logged in user (Admin/Officer/Observer) can reset the demo scenario
    valid_scenarios = ["quiet_day", "gradual_preflare", "impulsive_event", "noisy_false_spike", "detector_disagreement"]
    if req.scenario not in valid_scenarios:
        raise HTTPException(status_code=400, detail="Invalid scenario name")
    
    logger.info(f"Operator {current_user['username']} changing scenario to: {req.scenario}")
    await worker.change_scenario(req.scenario)
    
    # Write Audit Log
    log_entry = models.AuditLog(
        timestamp=int(time.time()),
        username=current_user["username"],
        role=current_user["role"],
        action="Change Demo Scenario",
        details=f"Switched scenario feed to: {req.scenario}"
    )
    db.add(log_entry)
    db.commit()

    return {"status": "success", "scenario": req.scenario}

# -------------------------------------------------------------
# Alerts API (Secured)
# -------------------------------------------------------------
@app.get("/api/alerts", response_model=list[schemas.AlertSchema])
def get_alerts(db: Session = Depends(get_db)):
    # Publicly readable alerts
    alerts = db.query(models.Alert).order_by(models.Alert.timestamp.desc()).all()
    return alerts

@app.patch("/api/alerts/{alert_id}/status", response_model=schemas.AlertSchema)
def update_alert_status(
    alert_id: str, 
    payload: schemas.AlertStatusUpdate, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Only Officer or SysAdmin can modify alert status
    if current_user["role"] not in ["Officer", "SysAdmin"]:
        raise HTTPException(status_code=403, detail="Permission denied. Requires elevated operations role.")
    
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    valid_statuses = ["New", "Acknowledged", "Escalated", "Suppressed"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid alert status")
    
    old_status = alert.status
    alert.status = payload.status
    
    # Write Audit Log
    log_entry = models.AuditLog(
        timestamp=int(time.time()),
        username=current_user["username"],
        role=current_user["role"],
        action=f"Update Alert Status ({payload.status})",
        details=f"Alert '{alert.message}' (ID: {alert_id}) changed status from {old_status} to {payload.status}"
    )
    db.add(log_entry)
    db.commit()
    db.refresh(alert)
    return alert

# -------------------------------------------------------------
# System Settings API (Secured)
# -------------------------------------------------------------
@app.get("/api/settings", response_model=schemas.SystemSettingsSchema)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SystemSettings).first()
    if not settings:
        settings = models.SystemSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@app.post("/api/settings", response_model=schemas.SystemSettingsSchema)
def update_settings(
    payload: schemas.SystemSettingsSchema, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Only SysAdmin can modify baseline calculation parameters
    if current_user["role"] != "SysAdmin":
        raise HTTPException(status_code=403, detail="Permission denied. Requires Administrator privileges.")
    
    settings = db.query(models.SystemSettings).first()
    if not settings:
        settings = models.SystemSettings(id=1)
        db.add(settings)
    
    old_threshold = settings.threshold_sensitivity
    old_window = settings.baseline_window_size
    
    settings.threshold_sensitivity = payload.threshold_sensitivity
    settings.baseline_window_size = payload.baseline_window_size
    settings.alert_sensitivity = payload.alert_sensitivity
    settings.chart_window_size = payload.chart_window_size
    settings.demo_speed = payload.demo_speed
    settings.detector_weight = payload.detector_weight
    
    # Write Audit Log
    log_entry = models.AuditLog(
        timestamp=int(time.time()),
        username=current_user["username"],
        role=current_user["role"],
        action="Modify Baseline Settings",
        details=f"Updated thresholds: Sensitivity from {old_threshold}σ to {payload.threshold_sensitivity}σ, Baseline size from {old_window}s to {payload.baseline_window_size}s"
    )
    db.add(log_entry)
    db.commit()
    db.refresh(settings)
    
    logger.info(f"System settings updated in database by {current_user['username']}")
    return settings
