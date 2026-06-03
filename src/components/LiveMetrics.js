import React, { useState, useEffect } from 'react';

export default function LiveMetrics({ pcsScore, activePaths, isSimulating }) {
  const [seconds, setSeconds] = useState(0);

  // Stopwatch Logic
  useEffect(() => {
    let interval = null;
    if (isSimulating) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isSimulating && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isSimulating, seconds]);

  // Rest timer when PCS resets
  useEffect(() => {
    if (pcsScore !== 0) return undefined;
    const reset = setTimeout(() => setSeconds(0), 0);
    return () => clearTimeout(reset);
  }, [pcsScore]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // SVG Arc logic for Gauge (0-10)
  const radius = 40;
  const circumference = Math.PI * radius; // Semi-circle
  const strokeDashoffset = circumference - ((pcsScore / 10) * circumference);

  return (
    <div style={{ height: '40%', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.8)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
       <h3 style={{ fontSize: '14px', color: '#cbd5e1', letterSpacing: '1px', textTransform: 'uppercase' }}>Live Environment Metrics</h3>
       
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', flex: 1 }}>
         
         {/* PCS Gauge */}
         <div className="metric-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100px', height: '55px', overflow: 'hidden' }}>
               {/* Background Arc */}
               <svg style={{ position: 'absolute', top: 0, left: 0 }} width="100" height="100">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" strokeLinecap="round" />
               </svg>
               {/* Foreground Arc */}
               <svg style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(0deg)' }} width="100" height="100">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={pcsScore > 8 ? '#ef4444' : (pcsScore > 0 ? '#10b981' : '#3b82f6')} strokeWidth="12" strokeLinecap="round" style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out, stroke 1s ease' }} />
               </svg>
               <div style={{ position: 'absolute', bottom: '0px', width: '100%', textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                 {pcsScore > 0 ? pcsScore.toFixed(1) : '-'}
               </div>
            </div>
            <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px' }}>PATH CRITICALITY</span>
         </div>

         {/* Active Paths */}
         <div className="metric-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: activePaths > 0 ? '#facc15' : '#10b981', transition: 'color 0.5s' }}>
              {activePaths}
            </div>
            <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px' }}>ACTIVE EXPOSURES</span>
         </div>

         {/* Stopwatch */}
         <div className="metric-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', color: isSimulating ? '#ef4444' : '#e2e8f0' }}>
              {formatTime(seconds)}
            </div>
            <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px' }}>TIME TO REMEDIATE</span>
         </div>

       </div>
    </div>
  );
}
