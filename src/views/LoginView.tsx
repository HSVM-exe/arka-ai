import React, { useState } from 'react';
import { ShieldAlert, Cpu, Eye, AlertOctagon } from 'lucide-react';
import { API_ENDPOINTS } from '../config';

interface LoginViewProps {
  onLoginSuccess: (token: string, username: string, role: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.settings.replace('/api/settings', '')}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess(data.access_token, data.username, data.role);
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Authentication failed. Please verify credentials.');
      }
    } catch (e) {
      console.warn("Backend login unavailable, running offline bypass authentication:", e);
      if (password === 'password' && ['admin1', 'officer1', 'observer1'].includes(username)) {
        const role = username === 'admin1' ? 'SysAdmin' : (username === 'officer1' ? 'Officer' : 'Observer');
        onLoginSuccess('mock-local-token', username, role);
      } else {
        setError('Connection refused and invalid offline bypass credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#050608',
      backgroundImage: 'radial-gradient(circle at center, #0c1018 0%, #050608 100%)',
      fontFamily: 'Share Tech Mono, monospace',
      color: '#cbd5e1',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background grid details */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255, 138, 0, 0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 138, 0, 0.01) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '420px',
        background: 'rgba(13, 16, 24, 0.75)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255, 138, 0, 0.2)',
        boxShadow: '0 0 35px rgba(255, 138, 0, 0.1)',
        borderRadius: '6px',
        padding: '35px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Top glowing line */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--solar-orange), transparent)'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#000',
            border: '2px solid rgba(255, 138, 0, 0.4)',
            marginBottom: '14px',
            overflow: 'hidden',
            boxShadow: '0 0 15px rgba(255, 138, 0, 0.3)'
          }}>
            <img src="/logo.png" alt="ARKA AI Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h2 style={{ 
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '24px', 
            fontWeight: '900', 
            margin: 0, 
            color: '#ffffff', 
            letterSpacing: '3px',
            background: 'linear-gradient(180deg, #ffffff, var(--solar-gold))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ARKA AI
          </h2>
          <p style={{ fontSize: '10.5px', color: 'var(--solar-gold)', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            ISRO Aditya-L1 Solar Intelligence Portal
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 59, 48, 0.08)',
            border: '1px solid rgba(255, 59, 48, 0.25)',
            borderRadius: '4px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#ff3b30',
            lineHeight: '1.5',
            marginBottom: '20px'
          }}>
            SYSTEM ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mission Control Operator ID
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. officer1" 
              required
              style={{
                background: '#050608',
                border: '1px solid rgba(255, 138, 0, 0.15)',
                borderRadius: '4px',
                padding: '12px 14px',
                color: '#ffffff',
                fontSize: '13px',
                fontFamily: 'Share Tech Mono, monospace',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--solar-orange)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 138, 0, 0.15)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Security Clearance Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
              style={{
                background: '#050608',
                border: '1px solid rgba(255, 138, 0, 0.15)',
                borderRadius: '4px',
                padding: '12px 14px',
                color: '#ffffff',
                fontSize: '13px',
                fontFamily: 'Share Tech Mono, monospace',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--solar-orange)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 138, 0, 0.15)'}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              marginTop: '10px',
              backgroundColor: 'rgba(255, 138, 0, 0.04)',
              border: '1px solid var(--solar-orange)',
              color: 'var(--solar-gold)',
              borderRadius: '4px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 'bold',
              fontFamily: 'Share Tech Mono, monospace',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--solar-orange)';
              e.currentTarget.style.color = '#000000';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 138, 0, 0.04)';
              e.currentTarget.style.color = 'var(--solar-gold)';
            }}
          >
            {loading ? 'CALIBRATING SECURITY PATHWAY...' : 'ESTABLISH MISSION LINK'}
          </button>
        </form>

        {/* Demo credentials guide */}
        <div style={{
          marginTop: '25px',
          borderTop: '1px dashed rgba(255, 138, 0, 0.1)',
          paddingTop: '15px',
          fontSize: '11px',
          lineHeight: '1.6',
          color: '#64748b'
        }}>
          <div style={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Default Operator Codes:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><ShieldAlert size={11} style={{ display: 'inline', marginRight: '4px', color: 'var(--solar-orange)', verticalAlign: 'middle' }} /> Systems Administrator:</span>
              <strong style={{ color: 'var(--solar-gold)' }}>admin1 / password</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><Cpu size={11} style={{ display: 'inline', marginRight: '4px', color: 'var(--solar-gold)', verticalAlign: 'middle' }} /> Space Weather Officer:</span>
              <strong style={{ color: 'var(--solar-gold)' }}>officer1 / password</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><Eye size={11} style={{ display: 'inline', marginRight: '4px', color: 'var(--cyan-telemetry)', verticalAlign: 'middle' }} /> Scientific Observer:</span>
              <strong style={{ color: 'var(--solar-gold)' }}>observer1 / password</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
