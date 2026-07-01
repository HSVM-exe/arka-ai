import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  Activity, 
  TrendingUp, 
  RotateCcw, 
  BarChart2, 
  Cpu, 
  AlertOctagon, 
  Settings as SettingsIcon,
  Download,
  FileText,
  Play,
  Pause,
  Server,
  ServerCrash,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import './App.css';
import type { 
  LightCurvePoint, 
  DetectorHealth, 
  AlertEvent, 
  SystemSettings, 
  ImpactRisk 
} from './types';
import { generateScenarioData } from './services/dataSimulationService';
import type { RawTelemetryPoint, ScenarioType } from './services/dataSimulationService';
import { processTelemetrySignal } from './services/signalProcessingService';
import type { ProcessedSignal } from './services/signalProcessingService';
import { runNowcastEngine } from './services/nowcastingService';
import { runForecastingEngine } from './services/forecastingService';
import { generateExplanation } from './services/explainabilityService';
import type { ExplainabilityData } from './services/explainabilityService';
import { assessSpaceWeatherImpact } from './services/impactAssessmentService';
import { createNewAlert, updateAlertStatus, determineSeverity } from './services/alertService';
import { getModelEvaluationMetrics } from './services/metricsService';
import { 
  MissionOverview,
  LiveDataView,
  NowcastingView,
  ForecastingView,
  HistoricalReplayView,
  ModelAnalyticsView,
  DetectorHealthView,
  AlertsView,
  SettingsView,
  AuditLogView
} from './views/DashboardViews';
import type { AuditLogItem } from './views/DashboardViews';
import { ReplayControls } from './components/DashboardComponents';
import { LoginView } from './views/LoginView';
import { API_ENDPOINTS, API_BASE_URL } from './config';

const DEFAULT_SETTINGS: SystemSettings = {
  thresholdSensitivity: 3.0,
  baselineWindowSize: 60,
  alertSensitivity: 'Normal',
  chartWindowSize: 300,
  demoSpeed: 1,
  detectorWeight: 0.5
};

const App: React.FC = () => {
  // Cinematic Initialization Loader state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [loadStep, setLoadStep] = useState<number>(0);

  // Session & Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userToken, setUserToken] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');

  // Navigation & UI tab state
  const [currentTab, setCurrentTab] = useState<string>('overview');
  
  // Settings state
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  // Connection mode state
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');

  // Simulation & Stream state
  const [activeScenario, setActiveScenario] = useState<string>('gradual_preflare');
  const [chartData, setChartData] = useState<LightCurvePoint[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<1 | 5 | 20>(5); // local simulation speed
  const [currentIndex, setCurrentIndex] = useState<number>(60);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Client-side simulator fallback state
  const [localScenarioPoints, setLocalScenarioPoints] = useState<RawTelemetryPoint[]>([]);
  
  // Ingested status state
  const [detectorHealth, setDetectorHealth] = useState<DetectorHealth>({
    completeness: 100,
    noise_level: 5,
    gti_valid: true,
    availability: 100,
    agreement_score: 100,
    overall_score: 100
  });

  // Alert tracking state
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Explainability & Impact states
  const [explainability, setExplainability] = useState<ExplainabilityData>({
    triggerEvidence: [],
    supportingEvidence: [],
    uncertaintyFactors: [],
    recommendation: '',
    featureContributions: []
  });
  const [impactRisks, setImpactRisks] = useState<ImpactRisk[]>([]);

  // Clocks & Elapsed times states
  const [missionTime, setMissionTime] = useState<number>(0);
  const [l1Distance, setL1Distance] = useState<number>(1496512);

  // -------------------------------------------------------------
  // Clocks and distance tracking increment loop
  // -------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setMissionTime(prev => prev + 1);
      setL1Distance(prev => prev + (Math.random() > 0.5 ? 2 : -2)); // small space drift variance
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMissionTime = (totalSecs: number) => {
    const days = Math.floor(totalSecs / 86400);
    const hrs = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `MET: ${days.toString().padStart(3, '0')}:${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // 3-Second Cinematic Loading Bootstrap Loader
  // -------------------------------------------------------------
  useEffect(() => {
    const totalDuration = 3000;
    const intervalTime = 50;
    const totalSteps = totalDuration / intervalTime;
    let currentStep = 0;

    const loader = setInterval(() => {
      currentStep++;
      const progress = Math.min(100, (currentStep / totalSteps) * 100);
      setLoadProgress(progress);

      if (progress >= 66) {
        setLoadStep(2);
      } else if (progress >= 33) {
        setLoadStep(1);
      } else {
        setLoadStep(0);
      }

      if (currentStep >= totalSteps) {
        clearInterval(loader);
        setIsLoading(false);
      }
    }, intervalTime);

    return () => clearInterval(loader);
  }, []);

  // -------------------------------------------------------------
  // Backend API calls
  // -------------------------------------------------------------
  const fetchSettings = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.settings);
      if (response.ok) {
        const data = await response.json();
        const mappedSettings: SystemSettings = {
          thresholdSensitivity: data.threshold_sensitivity,
          baselineWindowSize: data.baseline_window_size,
          alertSensitivity: data.alert_sensitivity,
          chartWindowSize: data.chart_window_size,
          demoSpeed: data.demo_speed,
          detectorWeight: data.detector_weight
        };
        setSettings(mappedSettings);
        setSpeed(data.demo_speed as 1 | 5 | 20);
        setBackendStatus('online');
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Backend settings unavailable, falling back to local simulation:", e);
      setBackendStatus('offline');
      return false;
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.getAlerts);
      if (response.ok) {
        const data = await response.json();
        const mappedAlerts: AlertEvent[] = data.map((a: any) => ({
          id: a.id,
          timestamp: a.timestamp,
          phase: a.phase,
          severity: a.severity,
          confidence: a.confidence,
          message: a.message,
          status: a.status
        }));
        setAlerts(mappedAlerts);
      }
    } catch (e) {
      console.error("Error fetching alerts:", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.telemetryHistory}?limit=${settings.chartWindowSize}`);
      if (response.ok) {
        const history = await response.json();
        const mappedPoints: LightCurvePoint[] = history.map((p: any) => ({
          timestamp: p.timestamp,
          soft_xray_counts: p.soft_xray_counts,
          hard_xray_counts: p.hard_xray_counts,
          soft_baseline: p.soft_baseline,
          hard_baseline: p.hard_baseline,
          soft_std: p.soft_std,
          hard_std: p.hard_std,
          soft_gradient: p.soft_gradient,
          hard_gradient: p.hard_gradient,
          detector_agreement: p.detector_agreement,
          nowcast_phase: p.nowcast_phase,
          forecast_probability: p.forecast_probability,
          confidence: p.confidence,
          alert_level: p.alert_level
        }));
        setChartData(mappedPoints);
        setCurrentIndex(mappedPoints.length);

        if (mappedPoints.length > 0) {
          const latest = mappedPoints[mappedPoints.length - 1];
          updateInferenceOutputs(latest);
        }
      }
    } catch (e) {
      console.error("Error loading history:", e);
    }
  };

  const fetchAuditLogs = async () => {
    if (backendStatus === 'offline') return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit-logs`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error("Error fetching audit logs:", e);
    }
  };

  const updateInferenceOutputs = (point: LightCurvePoint) => {
    const processed: ProcessedSignal = {
      soft_clean: point.soft_xray_counts,
      hard_clean: point.hard_xray_counts,
      raw_soft_counts: point.soft_xray_counts,
      raw_hard_counts: point.hard_xray_counts,
      soft_baseline: point.soft_baseline,
      hard_baseline: point.hard_baseline,
      soft_std: point.soft_std,
      hard_std: point.hard_std,
      soft_gradient: point.soft_gradient,
      hard_gradient: point.hard_gradient,
      soft_acceleration: 0,
      hard_acceleration: 0,
      detector_agreement: point.detector_agreement,
      data_quality_score: 95,
      soft_consecutive_triggers: 0,
      hard_consecutive_triggers: 0,
      soft_consecutive_positive_gradients: 0,
      hard_consecutive_positive_gradients: 0
    };

    const nowcast = {
      phase: point.nowcast_phase,
      is_flare_active: point.nowcast_phase !== 'Quiet' && point.nowcast_phase !== 'Pre-Flare',
      confidence: point.confidence,
      explanation: ''
    };

    const forecast = {
      prob_10m: point.forecast_probability,
      prob_20m: Math.round(point.forecast_probability * 0.9),
      prob_30m: Math.round(point.forecast_probability * 0.8),
      prob_60m: Math.round(point.forecast_probability * 0.6),
      lead_time_est_min: point.nowcast_phase === 'Pre-Flare' ? 15 : (point.nowcast_phase === 'Initiation' ? 5 : 0),
      confidence: point.confidence,
      explanation: ''
    };

    setExplainability(generateExplanation(processed, nowcast));
    setImpactRisks(assessSpaceWeatherImpact(nowcast, forecast));
  };

  const handleScenarioChange = async (scenario: string) => {
    setActiveScenario(scenario);
    setChartData([]);
    setAlerts([]);

    if (backendStatus === 'online') {
      try {
        const response = await fetch(API_ENDPOINTS.changeScenario, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ scenario })
        });
        if (response.ok) {
          setTimeout(() => {
            fetchHistory();
            fetchAlerts();
            fetchAuditLogs();
          }, 300);
        }
      } catch (e) {
        console.error("Error setting scenario on backend:", e);
      }
    } else {
      // Offline fallback
      initializeLocalSimulation(scenario);
      // Write mock audit log
      const newLog: AuditLogItem = {
        id: Date.now(),
        timestamp: Math.floor(Date.now() / 1000),
        username: username,
        role: userRole,
        action: "Change Demo Scenario (Offline)",
        details: `Switched simulator to feed: ${scenario}`
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    if (backendStatus === 'online') {
      try {
        const response = await fetch(API_ENDPOINTS.updateAlertStatus(id), {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ status: 'Acknowledged' })
        });
        if (response.ok) {
          fetchAlerts();
          fetchAuditLogs();
        } else if (response.status === 403) {
          alert("PERMISSION DENIED: Only certified Space Weather Officers can manage alert feeds.");
        }
      } catch (e) {
        console.error("Error acknowledging alert:", e);
      }
    } else {
      if (userRole !== 'Officer' && userRole !== 'SysAdmin') {
        alert("PERMISSION DENIED: Only certified Space Weather Officers can manage alert feeds.");
        return;
      }
      setAlerts(prev => updateAlertStatus(prev, id, 'Acknowledged'));
      const newLog: AuditLogItem = {
        id: Date.now(),
        timestamp: Math.floor(Date.now() / 1000),
        username: username,
        role: userRole,
        action: "Acknowledge Alert (Offline)",
        details: `Operator acknowledged alert ID: ${id}`
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const handleEscalateAlert = async (id: string) => {
    if (backendStatus === 'online') {
      try {
        const response = await fetch(API_ENDPOINTS.updateAlertStatus(id), {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ status: 'Escalated' })
        });
        if (response.ok) {
          fetchAlerts();
          fetchAuditLogs();
        } else if (response.status === 403) {
          alert("PERMISSION DENIED: Only certified Space Weather Officers can manage alert feeds.");
        }
      } catch (e) {
        console.error("Error escalating alert:", e);
      }
    } else {
      if (userRole !== 'Officer' && userRole !== 'SysAdmin') {
        alert("PERMISSION DENIED: Only certified Space Weather Officers can manage alert feeds.");
        return;
      }
      setAlerts(prev => updateAlertStatus(prev, id, 'Escalated'));
      const newLog: AuditLogItem = {
        id: Date.now(),
        timestamp: Math.floor(Date.now() / 1000),
        username: username,
        role: userRole,
        action: "Escalate Alert (Offline)",
        details: `Operator escalated alert ID: ${id} to HQ Command.`
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const handleSuppressAlert = async (id: string) => {
    if (backendStatus === 'online') {
      try {
        const response = await fetch(API_ENDPOINTS.updateAlertStatus(id), {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ status: 'Suppressed' })
        });
        if (response.ok) {
          fetchAlerts();
          fetchAuditLogs();
        } else if (response.status === 403) {
          alert("PERMISSION DENIED: Only certified Space Weather Officers can manage alert feeds.");
        }
      } catch (e) {
        console.error("Error suppressing alert:", e);
      }
    } else {
      if (userRole !== 'Officer' && userRole !== 'SysAdmin') {
        alert("PERMISSION DENIED: Only certified Space Weather Officers can manage alert feeds.");
        return;
      }
      setAlerts(prev => updateAlertStatus(prev, id, 'Suppressed'));
      const newLog: AuditLogItem = {
        id: Date.now(),
        timestamp: Math.floor(Date.now() / 1000),
        username: username,
        role: userRole,
        action: "Suppress Alert (Offline)",
        details: `Operator suppressed alert ID: ${id}.`
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const handleSettingsChange = async (newSettings: SystemSettings) => {
    if (userRole !== 'SysAdmin') {
      alert("PERMISSION DENIED: Only Systems Administrators are authorized to update baseline configs.");
      return;
    }

    setSettings(newSettings);
    setSpeed(newSettings.demoSpeed as 1 | 5 | 20);

    if (backendStatus === 'online') {
      try {
        const payload = {
          threshold_sensitivity: newSettings.thresholdSensitivity,
          baseline_window_size: newSettings.baselineWindowSize,
          alert_sensitivity: newSettings.alertSensitivity,
          chart_window_size: newSettings.chartWindowSize,
          demo_speed: newSettings.demoSpeed,
          detector_weight: newSettings.detectorWeight
        };
        const response = await fetch(API_ENDPOINTS.settings, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          fetchAuditLogs();
        }
      } catch (e) {
        console.error("Error saving settings:", e);
      }
    } else {
      const newLog: AuditLogItem = {
        id: Date.now(),
        timestamp: Math.floor(Date.now() / 1000),
        username: username,
        role: userRole,
        action: "Modify settings (Offline)",
        details: `Admin updated baseline window to ${newSettings.baselineWindowSize}s, k-factor to ${newSettings.thresholdSensitivity}σ.`
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const handleSpeedChange = (newSpeed: 1 | 5 | 20) => {
    const updatedSettings = {
      ...settings,
      demoSpeed: newSpeed
    };
    handleSettingsChange(updatedSettings);
  };

  // -------------------------------------------------------------
  // Offline Local Simulation Ingestion Engine
  // -------------------------------------------------------------
  const initializeLocalSimulation = (scenario: string) => {
    const rawData = generateScenarioData(scenario as ScenarioType, 600);
    setLocalScenarioPoints(rawData);
    
    // Warm up buffer
    const warmupSize = settings.baselineWindowSize;
    const initialBuffer: LightCurvePoint[] = [];
    let tempHistory: any[] = [];
    
    for (let i = 0; i < warmupSize; i++) {
      const rawPt = rawData[i];
      const processed = processTelemetrySignal(rawPt, tempHistory, settings);
      const nowcast = runNowcastEngine(processed, 'Quiet');
      const forecast = runForecastingEngine(processed, nowcast);
      
      const newPt: LightCurvePoint = {
        timestamp: rawPt.timestamp,
        soft_xray_counts: processed.soft_clean,
        hard_xray_counts: processed.hard_clean,
        soft_baseline: processed.soft_baseline,
        hard_baseline: processed.hard_baseline,
        soft_std: processed.soft_std,
        hard_std: processed.hard_std,
        soft_gradient: processed.soft_gradient,
        hard_gradient: processed.hard_gradient,
        detector_agreement: processed.detector_agreement,
        nowcast_phase: nowcast.phase,
        forecast_probability: forecast.prob_10m,
        confidence: nowcast.confidence,
        alert_level: determineSeverity(nowcast.phase, forecast.prob_10m)
      };

      initialBuffer.push(newPt);
      tempHistory.push(newPt);
    }

    setChartData(initialBuffer);
    setCurrentIndex(warmupSize);
    setIsPlaying(true);
    
    if (initialBuffer.length > 0) {
      updateInferenceOutputs(initialBuffer[initialBuffer.length - 1]);
    }
  };

  // Main client-side tick loop (only runs in offline mode)
  useEffect(() => {
    if (backendStatus !== 'offline' || !isPlaying || !isAuthenticated) return;
    if (localScenarioPoints.length === 0) return;
    if (currentIndex >= localScenarioPoints.length) {
      setIsPlaying(false);
      return;
    }

    const intervalTime = 1000 / speed;
    const timer = setTimeout(() => {
      const rawPt = localScenarioPoints[currentIndex];
      const processed = processTelemetrySignal(rawPt, chartData, settings);
      
      const prevPt = chartData[chartData.length - 1];
      const prevPhase = prevPt ? prevPt.nowcast_phase : 'Quiet';
      const nowcast = runNowcastEngine(processed, prevPhase);
      const forecast = runForecastingEngine(processed, nowcast);
      
      const severity = determineSeverity(nowcast.phase, forecast.prob_10m);
      const newPt: LightCurvePoint = {
        timestamp: rawPt.timestamp,
        soft_xray_counts: processed.soft_clean,
        hard_xray_counts: processed.hard_clean,
        soft_baseline: processed.soft_baseline,
        hard_baseline: processed.hard_baseline,
        soft_std: processed.soft_std,
        hard_std: processed.hard_std,
        soft_gradient: processed.soft_gradient,
        hard_gradient: processed.hard_gradient,
        detector_agreement: processed.detector_agreement,
        nowcast_phase: nowcast.phase,
        forecast_probability: forecast.prob_10m,
        confidence: nowcast.confidence,
        alert_level: severity
      };

      // Ingested detector health update
      setDetectorHealth({
        completeness: rawPt.soft_valid && rawPt.hard_valid ? 100 : (rawPt.soft_valid || rawPt.hard_valid ? 50 : 0),
        noise_level: Math.round(processed.soft_std),
        gti_valid: rawPt.soft_valid && rawPt.hard_valid,
        availability: 100,
        agreement_score: processed.detector_agreement ? 100 : 35,
        overall_score: processed.data_quality_score
      });

      // Update charts data
      setChartData(prev => {
        const next = [...prev, newPt];
        if (next.length > settings.chartWindowSize) {
          return next.slice(-settings.chartWindowSize);
        }
        return next;
      });

      // Trigger alert on phase changes
      if (nowcast.phase !== prevPhase && nowcast.phase !== 'Quiet') {
        const alertMsg = `Phase change detected: ${prevPhase} ➔ ${nowcast.phase}. ${nowcast.explanation}`;
        const newAlert = createNewAlert(nowcast.phase, severity, nowcast.confidence, alertMsg);
        setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
      }

      setCurrentIndex(prev => prev + 1);
      updateInferenceOutputs(newPt);
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [backendStatus, isPlaying, currentIndex, localScenarioPoints, speed, chartData, settings, isAuthenticated]);

  // -------------------------------------------------------------
  // Initial loading and connection setup
  // -------------------------------------------------------------
  useEffect(() => {
    // Try to locate settings to see if backend is online
    fetchSettings().then((isOnline) => {
      if (isOnline) {
        fetchAlerts();
        fetchHistory();
      }
    });
    
    // Timeout connecting status after 1.5 seconds to avoid UI freeze
    const connTimer = setTimeout(() => {
      setBackendStatus(current => {
        if (current === 'connecting') {
          console.warn("Backend connection timed out, running simulator fallback.");
          return 'offline';
        }
        return current;
      });
    }, 1500);

    return () => clearTimeout(connTimer);
  }, []);

  // SSE Stream setup for online mode
  useEffect(() => {
    if (backendStatus !== 'online' || !isAuthenticated) return;

    console.log("[SolarShield Client] Connecting to SSE Telemetry stream...");
    const source = new EventSource(API_ENDPOINTS.telemetryStream);
    eventSourceRef.current = source;

    source.onmessage = (event) => {
      if (!isPlaying) return;
      
      const payload = JSON.parse(event.data);
      if (payload.type === 'tick') {
        const tick = payload.data;
        const newPt: LightCurvePoint = {
          timestamp: tick.timestamp,
          soft_xray_counts: tick.soft_xray_counts,
          hard_xray_counts: tick.hard_xray_counts,
          soft_baseline: tick.soft_baseline,
          hard_baseline: tick.hard_baseline,
          soft_std: tick.soft_std,
          hard_std: tick.hard_std,
          soft_gradient: tick.soft_gradient,
          hard_gradient: tick.hard_gradient,
          detector_agreement: tick.detector_agreement,
          nowcast_phase: tick.nowcast_phase,
          forecast_probability: tick.forecast_probability,
          confidence: tick.confidence,
          alert_level: tick.alert_level
        };

        setDetectorHealth({
          completeness: tick.raw_soft_valid && tick.raw_hard_valid ? 100 : (tick.raw_soft_valid || tick.raw_hard_valid ? 50 : 0),
          noise_level: Math.round(tick.soft_std),
          gti_valid: tick.raw_soft_valid && tick.raw_hard_valid,
          availability: 100,
          agreement_score: tick.detector_agreement ? 100 : 35,
          overall_score: tick.data_quality_score
        });

        setChartData(prev => {
          const next = [...prev, newPt];
          if (next.length > settings.chartWindowSize) {
            return next.slice(-settings.chartWindowSize);
          }
          return next;
        });

        setCurrentIndex(prev => prev + 1);
        updateInferenceOutputs(newPt);

      } else if (payload.type === 'alert') {
        fetchAlerts();
      } else if (payload.type === 'reset') {
        setChartData([]);
        setAlerts([]);
      }
    };

    source.onerror = () => {
      console.warn("SSE connection interrupted. Awaiting auto-reconnection...");
    };

    return () => {
      source.close();
    };
  }, [backendStatus, isPlaying, settings.chartWindowSize, isAuthenticated]);

  // Trigger local simulation initialization if we transition to offline status
  useEffect(() => {
    if (backendStatus === 'offline' && isAuthenticated) {
      initializeLocalSimulation(activeScenario);
    }
  }, [backendStatus, isAuthenticated]);

  // Handle successful login from portal
  const handleLoginSuccess = (token: string, username: string, role: string) => {
    setUserToken(token);
    setUsername(username);
    setUserRole(role);
    setIsAuthenticated(true);
    
    // Fetch logs immediately if authorised
    if (role === 'Officer' || role === 'SysAdmin') {
      setTimeout(() => {
        fetchAuditLogs();
      }, 100);
    }
  };

  const handleLogout = () => {
    setUserToken('');
    setUsername('');
    setUserRole('');
    setIsAuthenticated(false);
    setChartData([]);
    setAlerts([]);
    setAuditLogs([]);
  };

  // Replay Reset Handler
  const handleResetReplay = async () => {
    setIsPlaying(false);
    handleScenarioChange(activeScenario);
  };

  // Exportable Reports Handlers
  const handleExportJSON = () => {
    const latestPoint = chartData[chartData.length - 1];
    const reportData = {
      timestamp: new Date().toISOString(),
      scenario: activeScenario,
      current_solar_phase: latestPoint?.nowcast_phase || 'Quiet',
      alert_severity: latestPoint?.alert_level || 'Low',
      telemetry: {
        soft_counts: latestPoint?.soft_xray_counts,
        hard_counts: latestPoint?.hard_xray_counts,
        detector_agreement: latestPoint?.detector_agreement,
        data_quality_score: detectorHealth.overall_score
      },
      forecast: {
        prob_10m: latestPoint?.forecast_probability,
        confidence: latestPoint?.confidence
      },
      explainability: explainability,
      operational_impacts: impactRisks,
      logged_alerts: alerts
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SolarShield_StatusReport_${Date.now()}.json`;
    link.click();
  };

  const handleExportMarkdown = () => {
    const latestPoint = chartData[chartData.length - 1];
    const mdContent = `# SolarShield AI - Space Weather Report
**Generated UTC**: ${new Date().toUTCString()}
**Selected Event Scenario**: ${activeScenario.toUpperCase()}

## 1. Solar Status Indicator
- **Current Lifecycle Phase**: ${latestPoint?.nowcast_phase || 'Quiet'}
- **Nowcast Severity Rating**: ${latestPoint?.alert_level || 'Low'}
- **Confidence Level**: ${latestPoint?.confidence || 0}%

## 2. Telemetry Reading
- **SoLEXS Soft X-ray**: ${latestPoint ? Math.round(latestPoint.soft_xray_counts) : '---'} c/s
- **HEL1OS Hard X-ray**: ${latestPoint ? Math.round(latestPoint.hard_xray_counts) : '---'} c/s
- **Data Quality score**: ${detectorHealth.overall_score}%

## 3. Explainable AI Insights
### Trigger Evidence:
${explainability.triggerEvidence.map(e => `- ${e}`).join('\n')}

### Supporting Evidence:
${explainability.supportingEvidence.map(e => `- ${e}`).join('\n')}

### Recommended Operational Direction:
**${explainability.recommendation}**

## 4. Space Weather Impact Grid
${impactRisks.map(r => `### ${r.domain} (Risk: ${r.risk_level})
- *Status*: ${r.explanation}
- *Action Command*: ${r.recommendation}`).join('\n\n')}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SolarShield_StatusReport_${Date.now()}.md`;
    link.click();
  };

  // Nav Item List
  const navItems = [
    { id: 'overview', label: 'Mission Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'live', label: 'Live Data Feed', icon: <LineChart size={16} /> },
    { id: 'nowcasting', label: 'Nowcasting AI', icon: <Activity size={16} /> },
    { id: 'forecasting', label: 'Forecast Engine', icon: <TrendingUp size={16} /> },
    { id: 'replay', label: 'Historical Replay', icon: <RotateCcw size={16} /> },
    { id: 'analytics', label: 'Mission Analytics', icon: <BarChart2 size={16} /> },
    { id: 'health', label: 'Detector Health', icon: <Cpu size={16} /> },
    { id: 'alerts', label: 'Solar Alerts', icon: <AlertOctagon size={16} />, badge: alerts.filter(a => a.status === 'New').length },
    { id: 'audit', label: 'Mission Logs', icon: <FileText size={16} />, visible: userRole === 'Officer' || userRole === 'SysAdmin' },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={16} /> }
  ];

  // Render correct tab view content
  const renderTabView = () => {
    const latestPoint = chartData[chartData.length - 1] || null;
    const modelMetrics = getModelEvaluationMetrics();

    switch (currentTab) {
      case 'overview':
        return (
          <MissionOverview 
            latestPoint={latestPoint}
            explainability={explainability}
            impactRisks={impactRisks}
            alerts={alerts}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            chartData={chartData}
          />
        );
      case 'live':
        return (
          <LiveDataView 
            chartData={chartData} 
            detectorHealth={detectorHealth}
          />
        );
      case 'nowcasting':
        return (
          <NowcastingView 
            latestPoint={latestPoint}
          />
        );
      case 'forecasting':
        return (
          <ForecastingView 
            forecast={{
              prob_10m: latestPoint?.forecast_probability || 0,
              prob_20m: Math.round((latestPoint?.forecast_probability || 0) * 0.9),
              prob_30m: Math.round((latestPoint?.forecast_probability || 0) * 0.8),
              prob_60m: Math.round((latestPoint?.forecast_probability || 0) * 0.6),
              lead_time_est_min: latestPoint?.nowcast_phase === 'Pre-Flare' ? 15 : (latestPoint?.nowcast_phase === 'Initiation' ? 5 : 0),
              confidence: latestPoint?.confidence || 0,
              explanation: latestPoint ? `Forecast probability is elevated based on nowcast state: ${latestPoint.nowcast_phase}.` : 'No telemetry data available.'
            }}
            explainability={explainability}
          />
        );
      case 'replay':
        return (
          <HistoricalReplayView 
            currentScenario={activeScenario}
            onScenarioChange={handleScenarioChange}
            chartData={chartData}
          />
        );
      case 'analytics':
        return <ModelAnalyticsView metrics={modelMetrics} />;
      case 'health':
        return <DetectorHealthView detectorHealth={detectorHealth} />;
      case 'alerts':
        return (
          <AlertsView 
            alerts={alerts}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onEscalateAlert={handleEscalateAlert}
            onSuppressAlert={handleSuppressAlert}
          />
        );
      case 'audit':
        return <AuditLogView auditLogs={auditLogs} />;
      case 'settings':
        return (
          <SettingsView 
            settings={settings}
            onSettingsChange={handleSettingsChange}
            userRole={userRole}
          />
        );
      default:
        return <div>View not found.</div>;
    }
  };

  const latestPoint = chartData[chartData.length - 1];
  const severityClass = latestPoint ? `sev-${latestPoint.alert_level.toLowerCase()}` : 'sev-quiet';
  const statusLabel = latestPoint ? latestPoint.alert_level : 'Quiet';

  // -------------------------------------------------------------
  // Custom Render - 3-Second Bootstrap Loader
  // -------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="arka-loader-overlay">
        <div className="loader-card">
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2.5px',
            background: 'linear-gradient(90deg, transparent, var(--solar-orange), transparent)'
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '18px', fontWeight: 'bold', fontFamily: 'Orbitron, sans-serif' }}>
            <AlertOctagon size={24} style={{ color: 'var(--solar-orange)', animation: 'pulse-glow 1.5s infinite' }} />
            <span>ARKA AI OBSERVATORY BOOT SEQUENCE</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--solar-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {loadStep === 0 && '>> CONNECTING TO ADITYA-L1 TELEMETRY FEED...'}
            {loadStep === 1 && '>> CALIBRATING SoLEXS & HEL1OS DETECTORS...'}
            {loadStep === 2 && '>> INGESTING ARKA AI INFERENCE CORRIDORS...'}
          </div>
          <div className="loader-bar-track">
            <div className="loader-bar-fill" style={{ width: `${loadProgress}%` }} />
          </div>
          <div className="loader-checklist">
            <div className={`loader-check-item ${loadStep >= 0 ? 'active' : ''} ${loadStep > 0 ? 'done' : ''}`}>
              [ {loadStep > 0 ? '✔' : '■'} ] SECURE SPACE DATA COMM LINK ACTIVE
            </div>
            <div className={`loader-check-item ${loadStep >= 1 ? 'active' : ''} ${loadStep > 1 ? 'done' : ''}`}>
              [ {loadStep > 1 ? '✔' : '■'} ] PAYLOAD INSTRUMENTS ALIGNED & CALIBRATED
            </div>
            <div className={`loader-check-item ${loadStep >= 2 ? 'active' : ''} ${loadStep > 2 ? 'done' : ''}`}>
              [ {loadStep > 2 ? '✔' : '■'} ] NEURAL ENSEMBLE CLASSIFIERS INSTANTIATED
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in, render the login page gate
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div>
          <div className="brand-section">
            <span className="brand-logo"><AlertOctagon /></span>
            <span className="brand-title">ARKA AI</span>
          </div>

          {/* Active Operator Banner */}
          <div style={{
            padding: '10px 14px',
            margin: '0 14px 15px 14px',
            backgroundColor: '#050608',
            border: '1px solid rgba(255, 138, 0, 0.1)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'Share Tech Mono, monospace'
          }}>
            <UserIcon size={14} style={{ color: 'var(--solar-orange)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f8fafc', textTransform: 'uppercase' }}>
                {username}
              </span>
              <span style={{ fontSize: '9.5px', color: 'var(--solar-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Clearance: {userRole}
              </span>
            </div>
          </div>

          <div className="navigation-links">
            {navItems
              .filter(item => item.visible === undefined || item.visible)
              .map(item => (
                <div 
                  key={item.id} 
                  className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
                  onClick={() => setCurrentTab(item.id)}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span className="nav-item-text">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Spacecraft outline visual and metadata */}
        <div style={{
          padding: '14px',
          margin: '14px',
          background: 'rgba(5, 6, 8, 0.4)',
          border: '1px solid rgba(255, 138, 0, 0.05)',
          borderRadius: '4px',
          fontSize: '10px',
          lineHeight: '1.5',
          color: '#64748b',
          fontFamily: 'Share Tech Mono, monospace'
        }}>
          {/* Spacecraft details wireframe */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <svg style={{ width: '80px', height: '60px', stroke: 'rgba(255,138,0,0.2)', fill: 'none', strokeWidth: 1 }} viewBox="0 0 100 80">
              <path d="M30 40 L70 40 L50 15 Z" />
              <rect x="25" y="38" width="50" height="15" />
              <line x1="10" y1="45" x2="25" y2="45" />
              <line x1="75" y1="45" x2="90" y2="45" />
              <circle cx="50" cy="15" r="4" />
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,138,0,0.03)', paddingBottom: '4px' }}>
            <span>L1 Distance:</span>
            <span style={{ color: 'var(--cyan-telemetry)' }}>{l1Distance.toLocaleString()} km</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,138,0,0.03)', paddingBottom: '4px', marginTop: '4px' }}>
            <span>Telemetry Link:</span>
            <span style={{ color: backendStatus === 'online' ? 'var(--health-green)' : 'var(--solar-orange)', fontWeight: 'bold' }}>
              {backendStatus === 'online' ? 'LIVE' : 'SIMULATOR'}
            </span>
          </div>
        </div>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn-control" onClick={handleLogout} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            borderColor: 'var(--alert-red)',
            color: 'var(--alert-red)',
            padding: '6px'
          }}>
            <LogOut size={12} />
            <span style={{ fontSize: '10px' }}>TERMINATE SESSION</span>
          </button>
          <div style={{ textAlign: 'center' }}>
            <div>ISRO ADITYA-L1 MISSION</div>
            <div style={{ fontSize: '9px', marginTop: '4px', opacity: 0.5 }}>ARKA PORTAL V1.0</div>
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="main-content">
        {/* Top Status Header */}
        <div className="status-bar">
          <div className="system-status-indicator">
            <div className={`status-indicator-dot pulse ${severityClass}`} />
            <span className="status-label" style={{ color: 'var(--solar-gold)' }}>SYSTEM STATE: {statusLabel}</span>
            {latestPoint && latestPoint.nowcast_phase !== 'Quiet' && (
              <div className="active-flare-info">
                <span>ACTIVE SOLAR EVENT:</span>
                <span className={`active-flare-tag`} style={{
                  color: 'var(--alert-red)',
                  background: 'rgba(255, 59, 48, 0.1)',
                  border: '1px solid rgba(255, 59, 48, 0.2)'
                }}>
                  {latestPoint.nowcast_phase.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="controls-section">
            {/* Clocks readouts */}
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#64748b' }}>
              <span style={{ color: 'var(--solar-gold)' }}>{formatMissionTime(missionTime)}</span>
            </div>

            {/* Backend connection status badge */}
            <div className="backend-status-badge-wrapper">
              {backendStatus === 'connecting' && (
                <span className="backend-badge-custom connecting">
                  <Server size={11} className="spin" />
                  <span>CALIBRATING CORRIDOR...</span>
                </span>
              )}
              {backendStatus === 'online' && (
                <span className="backend-badge-custom online">
                  <Server size={11} />
                  <span>L1 STREAM SECURE</span>
                </span>
              )}
              {backendStatus === 'offline' && (
                <span className="backend-badge-custom offline" title="Backend is offline. Running in local simulation backup mode.">
                  <ServerCrash size={11} />
                  <span>SIMULATION FAILSAFE</span>
                </span>
              )}
            </div>

            {/* Scenario Selector */}
            <div className="scenario-select-wrapper">
              <span>DEMO TRANSIT:</span>
              <select 
                className="scenario-select" 
                value={activeScenario}
                onChange={(e) => handleScenarioChange(e.target.value)}
              >
                <option value="quiet_day">Quiet Day (Baseline)</option>
                <option value="gradual_preflare">Gradual Pre-Flare</option>
                <option value="impulsive_event">Impulsive Solar Flare</option>
                <option value="noisy_false_spike">Noisy False Spike</option>
                <option value="detector_disagreement">Detector Disagreement</option>
              </select>
            </div>

            {/* In-view replay status bar if playing */}
            {currentTab !== 'replay' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  className="btn-control" 
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Pause simulation stream' : 'Resume simulation stream'}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                  <span>{isPlaying ? 'PAUSE' : 'RESUME'}</span>
                </button>
              </div>
            )}

            {/* Time display */}
            <div className="time-display">
              <span>LOCAL: {new Date().toLocaleTimeString()}</span>
              <span>UTC: {new Date().toISOString().substring(11, 19)}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Tab Replay Controls at the top of Replay screen */}
        {currentTab === 'replay' && (
          <div style={{ padding: '0 24px', marginTop: '16px' }}>
            <ReplayControls
              isPlaying={isPlaying}
              onPlayToggle={() => setIsPlaying(!isPlaying)}
              onReset={handleResetReplay}
              speed={speed}
              onSpeedChange={handleSpeedChange}
              progressPercent={(currentIndex / 600) * 100}
              currentPointIndex={currentIndex}
              totalPoints={600}
            />
          </div>
        )}

        {/* Dynamic Tab Body */}
        <div className="view-container">
          <div className="view-header">
            <div className="view-title-section">
              <h1>{navItems.find(n => n.id === currentTab)?.label}</h1>
              <p>Aditya-L1 Space Weather Intelligence Control Center</p>
            </div>

            {/* Export buttons row */}
            <div className="btn-group">
              <button className="btn-control" onClick={handleExportJSON} title="Export current telemetry snapshot in JSON format">
                <Download size={14} />
                <span>EXPORT JSON</span>
              </button>
              <button className="btn-control" onClick={handleExportMarkdown} title="Export markdown summary report">
                <FileText size={14} />
                <span>EXPORT MARKDOWN</span>
              </button>
            </div>
          </div>

          {renderTabView()}
        </div>
      </div>
    </div>
  );
};

export default App;
