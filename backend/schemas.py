from pydantic import BaseModel
from typing import Optional

class TelemetryPoint(BaseModel):
    timestamp: int
    soft_xray_counts: float
    hard_xray_counts: float
    soft_baseline: float
    hard_baseline: float
    soft_std: float
    hard_std: float
    soft_gradient: float
    hard_gradient: float
    detector_agreement: bool
    data_quality_score: int
    nowcast_phase: str
    forecast_probability: float
    confidence: int
    alert_level: str

    class Config:
        from_attributes = True

class AlertSchema(BaseModel):
    id: str
    timestamp: int
    phase: str
    severity: str
    confidence: int
    message: str
    status: str

    class Config:
        from_attributes = True

class AlertStatusUpdate(BaseModel):
    status: str

class SystemSettingsSchema(BaseModel):
    threshold_sensitivity: float
    baseline_window_size: int
    alert_sensitivity: str
    chart_window_size: int
    demo_speed: int
    detector_weight: float

    class Config:
        from_attributes = True

class ScenarioChangeRequest(BaseModel):
    scenario: str

# New schemas for Auth & Auditing
class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class AuditLogSchema(BaseModel):
    id: int
    timestamp: int
    username: str
    role: str
    action: str
    details: str

    class Config:
        from_attributes = True
