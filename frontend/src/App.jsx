import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [payloadInput, setPayloadInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    let eventSource;

    function connect() {
      setConnectionStatus('Connecting...');
      eventSource = new EventSource('http://localhost:5000/api/queue-stream');

      eventSource.onopen = () => setConnectionStatus('Connected');
      
      eventSource.onmessage = (event) => {
        const raw = JSON.parse(event.data);
        if (raw.init) return;

        // Force normalize incoming telemetry properties
        const data = {
          id: raw.id || raw.Id,
          status: raw.status || raw.Status,
          retries: raw.retries !== undefined ? raw.retries : raw.Retries,
          timestamp: raw.timestamp || raw.Timestamp
        };

        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === data.id);
          if (idx > -1) {
            const copy = [...prev];
            copy[idx] = data;
            return copy;
          }
          return [data, ...prev];
        });
      };

      eventSource.onerror = () => {
        setConnectionStatus('Disconnected (Retrying...)');
        eventSource.close();
        setTimeout(connect, 2000);
      };
    }

    connect();
    return () => eventSource?.close();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!payloadInput.trim()) return;
    try {
      await fetch(`http://localhost:5000/api/publish?payload=${encodeURIComponent(payloadInput)}`, { method: 'POST' });
      setPayloadInput('');
    } catch (err) { console.error(err); }
  };

  const getStatusStyle = (status) => {
    const norm = (status || '').toUpperCase();
    if (norm.includes('RETRYING')) return { bg: 'rgba(217, 119, 6, 0.2)', text: '#fbbf24', border: '#d97706' };
    if (norm === 'DLQ') return { bg: 'rgba(220, 38, 38, 0.2)', text: '#f87171', border: '#dc2626' };
    if (norm === 'COMPLETED') return { bg: 'rgba(22, 163, 74, 0.2)', text: '#4ade80', border: '#16a34a' };
    return { bg: 'rgba(37, 99, 235, 0.2)', text: '#60a5fa', border: '#2563eb' };
  };

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '40px', fontFamily: 'system-ui, sans-serif', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ width: '100%' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '24px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>⚡ In-Memory Queue Core Matrix</h1>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '14px' }}>System.Threading.Channels Engine Telemetry Pipeline</p>
          </div>
          <span style={{ padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 'bold', backgroundColor: connectionStatus === 'Connected' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)', color: connectionStatus === 'Connected' ? '#4ade80' : '#f87171', border: `1px solid ${connectionStatus === 'Connected' ? '#16a34a' : '#dc2626'}` }}>
            ● {connectionStatus.toUpperCase()}
          </span>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Total Payloads Routed</div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px', color: '#38bdf8' }}>{messages.length}</div>
          </div>
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Active Backoff Jitter Loops</div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px', color: '#fbbf24' }}>{messages.filter(m => m.status.toUpperCase().includes('RETRYING')).length}</div>
          </div>
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Dead Letter Vault (DLQ)</div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px', color: '#f87171' }}>{messages.filter(m => m.status === 'DLQ').length}</div>
          </div>
        </div>

        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155', marginBottom: '32px' }}>
          <form onSubmit={handlePublish} style={{ display: 'flex', gap: '16px' }}>
            <input type="text" placeholder="Enter task (e.g. Process Invoice #4401)..." value={payloadInput} onChange={(e) => setPayloadInput(e.target.value)} style={{ flexGrow: 1, padding: '14px 18px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#f8fafc', fontSize: '15px', outline: 'none' }} />
            <button type="submit" style={{ padding: '14px 28px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>Publish Node Payload</button>
          </form>
        </div>

        <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '13px' }}>Message Envelope ID</th>
                <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '13px' }}>Timestamp</th>
                <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>Retries</th>
                <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '13px', textAlign: 'right' }}>Active Processing State</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>No operations streaming through the pipeline.</td></tr>
              ) : (
                messages.map((msg) => {
                  const ui = getStatusStyle(msg.status);
                  return (
                    <tr key={msg.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontSize: '13px', color: '#cbd5e1' }}>{msg.id}</td>
                      <td style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '14px' }}>{msg.timestamp}</td>
                      <td style={{ padding: '16px 24px', fontWeight: '700', color: msg.retries > 0 ? '#fbbf24' : '#4ade80', textAlign: 'center' }}>{msg.retries}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}><span style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', backgroundColor: ui.bg, color: ui.text, border: `1px solid ${ui.border}`, display: 'inline-block' }}>{msg.status}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}