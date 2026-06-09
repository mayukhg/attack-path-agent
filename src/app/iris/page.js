"use client";

import { useState, useEffect } from 'react';
import AgentDaeChat from '../../components/AgentDaeChat';

export default function IrisStandalone() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div style={{ width: '100vw', height: '100vh', background: '#07090f' }} />;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-color)',
      backgroundImage: `
        radial-gradient(ellipse at 20% 20%, rgba(59,130,246,0.05) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.05) 0%, transparent 55%)
      `,
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Header */}
      <header style={{
        flexShrink: 0,
        height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(8,11,20,0.97)',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', boxShadow: '0 0 12px rgba(59,130,246,0.4)',
          }}>🤖</div>
          <div>
            <div style={{
              fontSize: '14px', fontWeight: 700,
              background: 'linear-gradient(90deg, #60a5fa, #c084fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Agent Iris</div>
            <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.5px' }}>
              Sentinel Orchestrator · Attack Path Intelligence
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ position: 'relative', display: 'inline-flex', width: '7px', height: '7px' }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#3b82f6', opacity: 0.4, animation: 'pulseGlow 1.5s infinite' }}></span>
            <span style={{ display: 'inline-flex', borderRadius: '50%', width: '7px', height: '7px', background: '#3b82f6' }}></span>
          </span>
          <span style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace' }}>LIVE · TruConfirm connected</span>
        </div>
      </header>

      {/* Chat — centered, constrained width */}
      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'stretch',
      }}>
        <div style={{
          width: '100%', maxWidth: '720px',
          display: 'flex', flexDirection: 'column',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,13,22,0.5)',
        }}>
          <AgentDaeChat
            onAction={() => {}}
            setSharedState={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
