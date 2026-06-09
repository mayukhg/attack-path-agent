"use client";

import { useState, useEffect, useMemo } from 'react';
import AgentAttackPathAgentChat from '../components/AgentAttackPathAgentChat';
import SentinelConsole from '../components/SentinelConsole';

export default function Dashboard() {
  const [eventLog, setEventLog] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState('advanced-command-center');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayIndex, setReplayIndex] = useState(-1);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSE Stream Listener
  useEffect(() => {
    const eventSource = new EventSource('/api/sentinel/events');

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        setEventLog(prev => {
          // Prevent duplicates
          if (prev.some(evt => evt.header.event_id === event.header.event_id)) return prev;
          return [...prev, event];
        });
      } catch (err) {
        console.error("Failed to parse SSE event data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE stream connection lost. Reconnecting...", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Fetch scenario graph details dynamically
  useEffect(() => {
    let activeId = activeScenarioId;
    const latestEvent = eventLog[eventLog.length - 1];
    if (latestEvent) {
      if (latestEvent.context.resource_id === 'workload-finance-ai') {
        activeId = 'ai-agent-posture';
      }
    }

    const fetchGraph = async () => {
      try {
        const response = await fetch(`/api/attack-path?scenarioId=${activeId}`);
        if (response.ok) {
          const data = await response.json();
          setNodes(data.scenario.nodes);
          setEdges(data.scenario.edges);
        }
      } catch (err) {
        console.error("Failed to fetch graph details:", err);
      }
    };

    fetchGraph();
  }, [activeScenarioId, eventLog]);

  // Compute sidecars state dynamically based on event ledger
  const sidecars = useMemo(() => {
    const baseline = [
      { id: 'workload-dev-discovery', label: 'Discovery Asset VM', status: 'ONLINE', vulnerabilityScore: 0 },
      { id: 'workload-finance-ai', label: 'Finance Auto-Billing Agent', status: 'ONLINE', vulnerabilityScore: 0 },
      { id: 'workload-vpn', label: 'VPN Access Gateway', status: 'ONLINE', vulnerabilityScore: 0 },
      { id: 'workload-database-core', label: 'Customer Root Database', status: 'ONLINE', vulnerabilityScore: 0 }
    ];

    const scanLimit = isReplayMode && replayIndex !== -1 ? replayIndex + 1 : eventLog.length;
    const activeEvents = eventLog.slice(0, scanLimit);

    activeEvents.forEach(event => {
      const target = baseline.find(s => s.id === event.context.resource_id);
      if (target) {
        if (event.header.event_type === 'config_drift' || event.header.event_type === 'vulnerability_discovery') {
          target.status = 'DRIFT';
          target.vulnerabilityScore = event.path_metadata?.exploitability_score || 9.2;
        } else if (event.header.event_type === 'simulation_injected') {
          target.status = 'DRIFT';
          target.vulnerabilityScore = Math.max(target.vulnerabilityScore, event.path_metadata?.exploitability_score || 9.2);
        } else if (event.header.event_type === 'mitigation_applied') {
          target.status = 'SECURED';
          target.vulnerabilityScore = 0;
        }
      }
    });

    return baseline;
  }, [eventLog, isReplayMode, replayIndex]);

  // Trigger simulated events by calling backend publish route
  const handleTriggerTelemetry = async (triggerType, extra = {}) => {
    try {
      await fetch('/api/sentinel/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: triggerType, ...extra })
      });
    } catch (err) {
      console.error(`Failed to trigger simulator telemetry: ${triggerType}`, err);
    }
  };

  const handleResetStore = async () => {
    try {
      const response = await fetch('/api/sentinel/store', { method: 'DELETE' });
      if (response.ok) {
        const data = await response.json();
        setEventLog(data.history);
        setIsReplayMode(false);
        setReplayIndex(-1);
      }
    } catch (err) {
      console.error("Failed to clear event store:", err);
    }
  };

  if (!mounted) {
    return (
      <div style={{ 
        display: 'flex', 
        width: '100vw', 
        height: '100vh', 
        background: '#0b0f19' 
      }} />
    );
  }

  return (
    <div 
      suppressHydrationWarning
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden', 
        background: 'var(--bg-color)',
        padding: '24px' 
      }}
    >
      <div 
        suppressHydrationWarning
        style={{ 
          maxWidth: '650px', 
          width: '100%', 
          height: '90vh', 
          background: 'var(--panel-bg)', 
          backdropFilter: 'var(--glass-blur)', 
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--border-color)', 
          borderRadius: '16px', 
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <AgentAttackPathAgentChat 
          onTriggerTelemetry={handleTriggerTelemetry}
          eventLog={eventLog}
          onScenarioChange={setActiveScenarioId}
        />
      </div>
    </div>
  );
}
