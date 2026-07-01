export const API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
  telemetryHistory: `${API_BASE_URL}/api/telemetry/history`,
  telemetryStream: `${API_BASE_URL}/api/telemetry/stream`,
  changeScenario: `${API_BASE_URL}/api/telemetry/scenario`,
  getAlerts: `${API_BASE_URL}/api/alerts`,
  updateAlertStatus: (id: string) => `${API_BASE_URL}/api/alerts/${id}/status`,
  settings: `${API_BASE_URL}/api/settings`,
};
