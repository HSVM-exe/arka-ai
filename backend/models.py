from sqlalchemy import Column, String, Integer, Float, Boolean, BigInteger
from database import Base

class TelemetryHistory(Base):
    __tablename__ = "telemetry_history"

    timestamp = Column(BigInteger, primary_key=True, index=True)
    soft_xray_counts = Column(Float, nullable=False)
    hard_xray_counts = Column(Float, nullable=False)
    soft_baseline = Column(Float, nullable=False)
    hard_baseline = Column(Float, nullable=False)
    soft_std = Column(Float, nullable=False)
    hard_std = Column(Float, nullable=False)
    soft_gradient = Column(Float, nullable=False)
    hard_gradient = Column(Float, nullable=False)
    detector_agreement = Column(Boolean, nullable=False)
    data_quality_score = Column(Integer, nullable=False)
    nowcast_phase = Column(String, nullable=False)
    forecast_probability = Column(Float, nullable=False)
    confidence = Column(Integer, nullable=False)
    alert_level = Column(String, nullable=False)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(BigInteger, nullable=False)
    phase = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    confidence = Column(Integer, nullable=False)
    message = Column(String, nullable=False)
    status = Column(String, default="New") # New, Acknowledged, Escalated, Suppressed

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, default=1)
    threshold_sensitivity = Column(Float, default=3.0)
    baseline_window_size = Column(Integer, default=60)
    alert_sensitivity = Column(String, default="Normal")
    chart_window_size = Column(Integer, default=300)
    demo_speed = Column(Integer, default=1)
    detector_weight = Column(Float, default=0.5)

class User(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False) # Officer, SysAdmin, Observer

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(BigInteger, nullable=False)
    username = Column(String, nullable=False)
    role = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(String, nullable=False)
