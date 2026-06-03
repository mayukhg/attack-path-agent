import React, { useState, useEffect, useRef } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { BaseNode, CrownJewelNode, AiAgentNode } from './CustomNodes';

const nodeTypes = {
  base: BaseNode,
  crown: CrownJewelNode,
  ai: AiAgentNode
};

export default function SentinelConsole({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  eventLog, 
  sidecars, 
  isReplayMode, 
  replayIndex, 
  setReplayIndex, 
  setIsReplayMode, 
  onResetStore 
}) {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const logContainerRef = useRef(null);

  // Auto-scroll logs to bottom when a new event arrives (unless in replay mode)
  useEffect(() => {
    if (!isReplayMode && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [eventLog, isReplayMode]);

  const toggleReplay = (mode) => {
    setIsReplayMode(mode);
    if (mode && replayIndex === -1) {
      setReplayIndex(eventLog.length - 1);
    }
  };

  const handleSliderChange = (e) => {
    setReplayIndex(parseInt(e.target.value, 10));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#0b0f19', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
      
      {/* Top Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: '8px', height: '8px' }}>
              <span className={`pulsing-red`} style={{ position: 'absolute', display: 'inline-flex', borderRadius: '50%', width: '100%', height: '100%', background: '#3b82f6', opacity: isReplayMode ? 0.3 : 1 }}></span>
              <span style={{ display: 'inline-flex', borderRadius: '50%', width: '8px', height: '8px', background: isReplayMode ? '#fb923c' : '#3b82f6' }}></span>
            </span>
            Project Sentinel: Agentic Attack Path Console
          </h2>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            {isReplayMode ? `AUDIT REPLAY: Event ${replayIndex + 1} of ${eventLog.length}` : 'LIVE Telemetry Ingestion (SSE Stream: ACTIVE)'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-outline" 
            style={{ padding: '6px 12px', fontSize: '11px', borderColor: '#475569', color: '#cbd5e1' }}
            onClick={() => onResetStore()}
          >
            Clear Event Store
          </button>
        </div>
      </div>

      {/* Graph Visualizer Canvas (React Flow) */}
      <div style={{ height: '55%', width: '100%', position: 'relative', background: '#0a0d16' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="rgba(255,255,255,0.05)" gap={16} size={1} />
          <Controls style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
        </ReactFlow>
        
        {/* Graph Legend Overlay */}
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.85)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '2px' }}>GRAPH LEGEND</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></span> Workload Normal</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 8px #ef4444' }}></span> Telemetry Drift (CRITICAL)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10b981', borderRadius: '2px' }}></span> Secure Egress applied</div>
        </div>
      </div>

      {/* Replay Timeline scrub-bar */}
      <div style={{ padding: '12px 20px', background: 'rgba(15, 23, 42, 0.9)', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          className="btn-primary" 
          style={{ 
            background: isReplayMode ? '#ef4444' : '#fb923c', 
            color: 'white', 
            fontSize: '11px', 
            padding: '6px 12px',
            whiteSpace: 'nowrap'
          }}
          onClick={() => toggleReplay(!isReplayMode)}
        >
          {isReplayMode ? '▶ Resume Live' : '⏸ Pause & Audit Replay'}
        </button>
        
        <input 
          type="range" 
          min="0" 
          max={Math.max(0, eventLog.length - 1)} 
          value={replayIndex === -1 ? eventLog.length - 1 : replayIndex} 
          onChange={handleSliderChange} 
          disabled={!isReplayMode}
          style={{ flex: 1, accentColor: '#fb923c', cursor: isReplayMode ? 'pointer' : 'not-allowed', opacity: isReplayMode ? 1 : 0.4 }} 
        />
        
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', whiteSpace: 'nowrap' }}>
          Step: {replayIndex === -1 ? eventLog.length : replayIndex + 1} / {eventLog.length}
        </span>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.4)' }}>
        <button 
          style={{ flex: 1, padding: '12px', background: activeTab === 'telemetry' ? 'rgba(30, 41, 59, 0.5)' : 'transparent', color: activeTab === 'telemetry' ? '#60a5fa' : '#94a3b8', border: 'none', borderBottom: activeTab === 'telemetry' ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
          onClick={() => setActiveTab('telemetry')}
        >
          🔍 Monitored Workloads ({sidecars.length})
        </button>
        <button 
          style={{ flex: 1, padding: '12px', background: activeTab === 'logs' ? 'rgba(30, 41, 59, 0.5)' : 'transparent', color: activeTab === 'logs' ? '#60a5fa' : '#94a3b8', border: 'none', borderBottom: activeTab === 'logs' ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
          onClick={() => setActiveTab('logs')}
        >
          📄 Standardized JSON-LD Event Log ({eventLog.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        
        {/* Tab 1: Monitored Workloads */}
        {activeTab === 'telemetry' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {sidecars.map((sidecar) => {
              const statusColors = {
                ONLINE: { bg: 'rgba(59, 130, 246, 0.1)', text: '#93c5fd', border: 'rgba(59, 130, 246, 0.3)' },
                DRIFT: { bg: 'rgba(239, 68, 68, 0.1)', text: '#fca5a5', border: 'rgba(239, 68, 68, 0.3)' },
                SECURED: { bg: 'rgba(16, 185, 129, 0.1)', text: '#a7f3d0', border: 'rgba(16, 185, 129, 0.3)' }
              };
              const style = statusColors[sidecar.status] || statusColors.ONLINE;

              return (
                <div key={sidecar.id} style={{ padding: '16px', background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{sidecar.id}</span>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                      {sidecar.status}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{sidecar.label}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#cbd5e1', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                    <span>Vulnerability Score:</span>
                    <strong style={{ color: sidecar.vulnerabilityScore > 8 ? '#ef4444' : '#10b981' }}>
                      {sidecar.vulnerabilityScore > 0 ? sidecar.vulnerabilityScore.toFixed(1) : 'None'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                    <span>Telemetry Output:</span>
                    <span>{sidecar.status === 'DRIFT' ? 'Drift Injected' : 'Healthy Telemetry'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Standardized Event Log */}
        {activeTab === 'logs' && (
          <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
            
            {/* Scrollable Events List */}
            <div ref={logContainerRef} style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
              {eventLog.map((event, index) => {
                const eventTypeColors = {
                  agent_registration: '#3b82f6',
                  config_drift: '#ef4444',
                  simulation_injected: '#a855f7',
                  vulnerability_discovery: '#fb923c',
                  mitigation_applied: '#10b981'
                };
                const isSelected = selectedEvent?.header?.event_id === event.header.event_id;
                
                return (
                  <div 
                    key={event.header.event_id || index} 
                    className="log-item"
                    style={{ 
                      cursor: 'pointer', 
                      margin: 0,
                      borderColor: isSelected ? '#fb923c' : 'rgba(255, 255, 255, 0.05)',
                      background: isSelected ? 'rgba(251, 146, 60, 0.05)' : 'rgba(15, 23, 42, 0.6)'
                    }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="log-item-header">
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: eventTypeColors[event.header.event_type] || '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {event.header.event_type}
                      </span>
                      <span className="log-time">
                        {new Date(event.header.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="log-message" style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <strong>{event.context.resource_id}</strong>: {event.payload.finding}
                    </div>
                  </div>
                );
              })}
              {eventLog.length === 0 && (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '20px' }}>No events recorded.</div>
              )}
            </div>

            {/* Selected JSON-LD Schema Inspector */}
            <div style={{ flex: 1, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                JSON-LD CONTRACT VALIDATOR
              </div>
              {selectedEvent ? (
                <pre style={{ margin: 0, padding: '4px', fontSize: '9px', fontFamily: 'monospace', color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '11px' }}>
                  Click an event to validate JSON-LD schema
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
