"use client";

import { useState, useEffect } from 'react';
import AgentAttackPathAgentChat from '../components/AgentAttackPathAgentChat';

export default function Dashboard() {
  const [eventLog, setEventLog] = useState([]);
  const [mounted, setMounted] = useState(false);

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
        />
      </div>
    </div>
  );
}
