import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const callAttackPathApi = async (options = {}) => {
  let url = '/api/attack-path';
  if (options.method === 'GET' && options.scenarioId) {
    url += `?scenarioId=${options.scenarioId}`;
  }
  const response = await fetch(url, {
    method: options.method || 'POST',
    headers: options.method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
    body: options.method === 'GET' ? undefined : JSON.stringify(options.body || {}),
  });

  if (!response.ok) {
    throw new Error('Attack path API request failed');
  }

  return response.json();
};

export default function AgentAttackPathAgentChat({ onTriggerTelemetry, eventLog, onScenarioChange }) {
  const [messages, setMessages] = useState([]);
  const [chatPhase, setChatPhase] = useState('intro');
  const [selectedPath, setSelectedPath] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [phase3Analysis, setPhase3Analysis] = useState(null);
  const [phase3Simulation, setPhase3Simulation] = useState(null);
  const [phase3Remediation, setPhase3Remediation] = useState(null);
  const [phase3Policy, setPhase3Policy] = useState(null);
  const [phase3Report, setPhase3Report] = useState(null);
  const [whatIfAnswer, setWhatIfAnswer] = useState('');
  const [hoveredPhase, setHoveredPhase] = useState(null);
  const [completedPhases, setCompletedPhases] = useState({ phase1: false, phase2: false, phase3: false });
  const endOfChatRef = useRef(null);
  const initRef = useRef(false);

  const pushMessage = useCallback((msg, delay) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, msg]);
    }, delay);
  }, []);

  useEffect(() => {
    if (chatPhase === 'intro' && messages.length === 0 && !initRef.current) {
      initRef.current = true;
      pushMessage({ sender: 'agent', identity: 'Sentinel Orchestrator', color: '#3b82f6', type: 'intro_prompt' }, 1000);
    }
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatPhase, messages.length, pushMessage]);

  // Derived audit logs mapped directly to backend eventStore stream
  const activeAuditLogs = useMemo(() => {
    return eventLog.map(evt => {
      const typeLabel = evt.header.event_type.replace('_', ' ').toUpperCase();
      return {
        time: new Date(evt.header.timestamp).toLocaleTimeString(),
        text: `[${typeLabel}] ${evt.context.resource_id}: ${evt.payload.finding} (${evt.payload.severity})`
      };
    });
  }, [eventLog]);

  // Use Case 1: Continuous validation (drift)
  const handleStartScoping = async () => {
    if (onScenarioChange) onScenarioChange('critical-attack-path-discovery');
    setChatPhase('discovery');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Begin continuous validation. Trigger workload config drift." }]);
    
    // Call telemetry on event bus
    onTriggerTelemetry('config_drift');

    setTimeout(() => {
        pushMessage({ sender: 'agent', identity: 'Telemetry Observer', color: '#ef4444', type: 'text', content: "Drift event published to the Event Bus! The sidecar detected an open port drift on workload-dev-discovery." }, 800);
    }, 1000);

    try {
      const result = await callAttackPathApi({ method: 'GET', scenarioId: 'critical-attack-path-discovery' });
      const apiPaths = result.analysis.paths.map(p => ({
        id: p.id + ': ' + p.title,
        nexus: p.techniques.join(', '),
        nodes: p.nodeIds.length,
        score: p.pcs
      }));

      setTimeout(() => {
          pushMessage({ sender: 'agent', identity: 'Sentinel Engine', color: '#3b82f6', type: 'text', content: `The Path Engine completed real-time calculations: ${result.analysis.activePaths} paths are now active. Select a compromised path to proceed.` }, 2500);
      }, 1500);

      setTimeout(() => {
          setMessages(prev => [...prev, { sender: 'agent', type: 'path_selection', data: apiPaths }]);
          setChatPhase('selection');
      }, 4500);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `Path discovery failed: ${error.message}` }]);
      setChatPhase('intro');
    }
  };

  const handlePathSelect = (pathId) => {
    setSelectedPath(pathId);
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: `Analyze path: ${pathId}` }]);
    
    setTimeout(() => {
       pushMessage({ sender: 'agent', identity: 'Simulation Daemon', color: '#a855f7', type: 'text', content: `Simulation Daemon engaged. I will execute a validation query simulating a lateral movement chain along this path.` }, 800);
    }, 500);

    setTimeout(() => {
       setMessages(prev => [...prev, { sender: 'agent', type: 'assessment_action', pathId: pathId }]);
    }, 1800);
  };

  const handleRunAssessment = async () => {
    setChatPhase('scanning');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Simulate Attack Path Exploitation" }]);
    setIsTyping(true);
    
    try {
      const pathCode = selectedPath.split(':')[0];
      const result = await callAttackPathApi({ 
        body: { 
          intent: 'simulate', 
          scenarioId: 'critical-attack-path-discovery',
          pathId: pathCode 
        } 
      });
      
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { sender: 'agent', type: 'scanning_results', pathId: selectedPath }]);
        setChatPhase('remediation_options');
      }, 2000);
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `Simulation failed: ${error.message}` }]);
    }
  };

  const handleViewRemediation = () => {
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Fetch Mitigation Strategy" }]);
    setTimeout(() => {
       pushMessage({ sender: 'agent', identity: 'Remediation Engine', color: '#fb923c', type: 'mitigation_options' }, 1200);
    }, 500);
  };

  const handleMitigate = async () => {
    setChatPhase('fixing');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Deploy AWS WAF Policy Rule" }]);
    
    // Call telemetry on event bus
    onTriggerTelemetry('mitigation', { 
      workloadId: 'workload-dev-discovery', 
      label: 'AWS WAF Containment Rule', 
      scoreReduction: 1.5 
    });

    try {
      const result = await callAttackPathApi({ 
        body: { 
          intent: 'mitigate', 
          scenarioId: 'critical-attack-path-discovery',
          mitigationId: 'waf-rule'
        } 
      });
      
      setTimeout(() => {
         pushMessage({ sender: 'agent', identity: 'Remediation Engine', color: '#fb923c', type: 'text', content: `AWS WAF mitigation applied. The sidecar reports traffic to the Shadow API has been successfully blocked.` }, 800);
      }, 500);
      
      setTimeout(() => {
         setMessages(prev => [...prev, { sender: 'agent', type: 'mitigation_success' }]);
      }, 1500);

      setTimeout(() => {
         setIsTyping(true);
      }, 2200);

      setTimeout(() => {
         setIsTyping(false);
         setMessages(prev => [...prev, { sender: 'agent', type: 'revalidation_results' }]);
         setChatPhase('complete');
         setCompletedPhases(prev => ({ ...prev, phase1: true }));
      }, 3500);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `Mitigation failed: ${error.message}` }]);
    }
  };

  // Use Case 2: AI Agent Posture Validation
  const handleStartPhase2 = async () => {
    if (onScenarioChange) onScenarioChange('ai-agent-posture');
    setChatPhase('phase2_discovery');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Begin Case 2: AI Posture & Supply Chain Validation" }]);
    
    onTriggerTelemetry('multiple_vulns'); // Push vulnerability events including AI Agent

    setTimeout(() => {
        pushMessage({ sender: 'agent', identity: 'Telemetry Observer', color: '#3b82f6', type: 'text', content: "Analyzing AI supply chain telemetry. The sidecar on workload-finance-ai has flagged a critical exposure." }, 800);
    }, 500);

    try {
      const result = await callAttackPathApi({ method: 'GET', scenarioId: 'ai-agent-posture' });

      setTimeout(() => {
          pushMessage({ sender: 'agent', identity: 'Sentinel Engine', color: '#3b82f6', type: 'text', content: "Finance AI Agent is Internet-Exposed and possesses active read permissions to the Customer Root Database." }, 2000);
      }, 1000);

      setTimeout(() => {
          setMessages(prev => [...prev, { sender: 'agent', type: 'phase2_review_prompt' }]);
          setChatPhase('phase2_review');
      }, 3500);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `AI inventory mapping failed: ${error.message}` }]);
      setChatPhase('intro');
    }
  };

  const handlePhase2Simulate = async () => {
     setChatPhase('phase2_simulating');
     setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Simulate Prompt Injection exploit chain" }]);
     
     setTimeout(() => {
        pushMessage({ sender: 'agent', identity: 'Simulation Daemon', color: '#a855f7', type: 'text', content: "Simulating external Prompt Injection against the Finance AI Agent to exfiltrate database records." }, 800);
     }, 500);

     try {
       const result = await callAttackPathApi({ 
         body: { 
           intent: 'simulate', 
           scenarioId: 'ai-agent-posture',
           pathId: 'PATH-001'
         } 
       });

       setTimeout(() => {
          setMessages(prev => [...prev, { sender: 'agent', type: 'phase2_reremediation_prompt' }]);
          setChatPhase('phase2_remediation');
       }, 3000);
     } catch (error) {
       setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `Simulation failed: ${error.message}` }]);
     }
  };

  const handlePhase2Mitigate = async () => {
     setChatPhase('phase2_complete');
     setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Deploy AI Egress AuthorizationPolicy" }]);
     
     onTriggerTelemetry('mitigation', { 
       workloadId: 'workload-finance-ai', 
       label: 'Istio AI Egress AuthorizationPolicy', 
       scoreReduction: 2.3 
     });

     try {
       const result = await callAttackPathApi({ 
         body: { 
           intent: 'mitigate', 
           scenarioId: 'ai-agent-posture',
           mitigationId: 'secure-ai-egress' 
         } 
       });

       setTimeout(() => {
          setMessages(prev => [...prev, { sender: 'agent', type: 'mitigation_success' }]);
       }, 1000);
       
       setTimeout(() => {
          setIsTyping(true);
       }, 1800);

       setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, { sender: 'agent', type: 'phase2_revalidation_results' }]);
          setCompletedPhases(prev => ({ ...prev, phase2: true }));
       }, 3000);
     } catch (error) {
       setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `Mitigation failed: ${error.message}` }]);
     }
  };

  // Use Case 3: Prioritized Autonomous Remediation
  const handleStartPhase3 = async () => {
    if (onScenarioChange) onScenarioChange('advanced-command-center');
    setChatPhase('phase3_discovery');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Begin Case 3: Prioritized Mitigation & Auditing" }]);
    
    // Call telemetry on event bus
    onTriggerTelemetry('config_drift');

    setTimeout(() => {
        pushMessage({ sender: 'agent', identity: 'Sentinel Engine', color: '#3b82f6', type: 'text', content: "Conducting multi-vector reachability scan..." }, 800);
    }, 500);

    try {
      const result = await callAttackPathApi({ method: 'GET' });
      setPhase3Analysis(result.analysis);

      setTimeout(() => {
          const choke = result.analysis.chokePoints[0];
          pushMessage({ sender: 'agent', identity: 'Sentinel Engine', color: '#3b82f6', type: 'text', content: `Found ${result.analysis.activePaths} paths. VPN and Shadow API vulnerabilities are competing. The top choke point is ${choke?.label || 'the Shadow API'}.` }, 2500);
      }, 1000);

      setTimeout(() => {
          setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_selection' }]);
          setChatPhase('phase3_selection');
      }, 4500);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `Backend analysis failed: ${error.message}` }]);
      setChatPhase('intro');
    }
  };

  const handlePhase3Simulate = async () => {
    setChatPhase('phase3_simulating');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Analyze hypothetical CVE-2024-XXXX impact" }]);
    
    onTriggerTelemetry('cve_injection'); // Trigger CVE simulation event

    try {
      const result = await callAttackPathApi({ body: { intent: 'simulate', pathId: phase3Analysis?.topPath?.id } });
      setPhase3Simulation(result);

      setTimeout(() => {
         pushMessage({ sender: 'agent', identity: 'Simulation Daemon', color: '#a855f7', type: 'text', content: `CVE-2024-XXXX Injection event published. Evaluating reachability from VPN Gateway to AD Core...` }, 800);
      }, 500);

      setTimeout(() => {
         setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_blast_radius' }]);
         setChatPhase('phase3_remediation_options');
      }, 3000);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `Simulation failed: ${error.message}` }]);
    }
  };

  const handlePhase3Mitigate = async (option) => {
    setChatPhase('phase3_fixing');
    const mitigationId = option?.id || option;
    const mitigationLabel = option?.label || option;
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: `Deploy prioritized fix: ${mitigationLabel}` }]);
    
    onTriggerTelemetry('mitigation', { 
      workloadId: 'workload-vpn', 
      label: mitigationLabel, 
      scoreReduction: 1.3 
    });

    try {
      const result = await callAttackPathApi({ body: { intent: 'mitigate', mitigationId } });
      setPhase3Remediation(result);
      const [policy, report] = await Promise.all([
        callAttackPathApi({ body: { intent: 'policy', mitigationId } }),
        callAttackPathApi({ body: { intent: 'report', mitigationId } }),
      ]);
      setPhase3Policy(policy);
      setPhase3Report(report);

      setTimeout(() => {
         pushMessage({ sender: 'agent', identity: 'Remediation Engine', color: '#fb923c', type: 'text', content: `Applied ${result.mitigation.label}. The VPN access gateway route is now blocked.` }, 800);
      }, 500);
    
      setTimeout(() => {
         setMessages(prev => [...prev, { sender: 'agent', type: 'mitigation_success' }]);
      }, 1500);

      setTimeout(() => {
         setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_bypass_prompt' }]);
         setChatPhase('phase3_bypass');
      }, 3500);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `Mitigation failed: ${error.message}` }]);
    }
  };

  const handlePhase3Bypass = () => {
    setChatPhase('phase3_bypassing');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Simulate attacker bypass attempts" }]);
    
    setTimeout(() => {
       pushMessage({ sender: 'agent', identity: 'Simulation Daemon', color: '#a855f7', type: 'text', content: "Attempting traversal bypass via local commands (T1059)..." }, 800);
    }, 500);

    setTimeout(() => {
       setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_complete' }]);
       setChatPhase('phase3_complete');
       setCompletedPhases(prev => ({ ...prev, phase3: true }));
    }, 2500);
  };

  const handlePhase3PolicyPreview = () => {
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Show Policy-as-Code definitions" }]);
    setTimeout(() => {
       setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_policy_preview' }]);
    }, 500);
  };

  const handlePhase3Report = () => {
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Show compliance audit reports" }]);
    setTimeout(() => {
       setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_report' }]);
    }, 500);
  };

  const handlePhase3NLQ = async (e) => {
    e.preventDefault();
    const q = e.target.elements.q.value;
    if (!q) return;
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: q }]);
    e.target.reset();
    
    try {
      const result = await callAttackPathApi({ body: { intent: 'what-if', question: q } });
      setWhatIfAnswer(result.answer);
      setTimeout(() => {
         pushMessage({ sender: 'agent', identity: 'Predictive Analytics', color: '#6366f1', type: 'text', content: result.answer }, 800);
      }, 500);
    } catch (error) {
      setWhatIfAnswer('');
      setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `What-if query failed: ${error.message}` }]);
    }
  };

  const handleAgentReset = () => {
    if (onScenarioChange) onScenarioChange('advanced-command-center');
    initRef.current = false;
    setMessages([]);
    setSelectedPath('');
    setChatPhase('intro');
    setPhase3Analysis(null);
    setPhase3Simulation(null);
    setPhase3Remediation(null);
    setPhase3Policy(null);
    setPhase3Report(null);
    setWhatIfAnswer('');
    setCompletedPhases({ phase1: false, phase2: false, phase3: false });
  };

  const renderMessageContent = (msg, i) => {
    switch (msg.type) {
      case 'text':
        return <div className="chat-bubble">{msg.content}</div>;

      case 'intro_prompt':
         return (
           <div className="card-container text-left" style={{marginTop:'4px', marginBottom:'12px'}}>
              <p style={{marginBottom: '12px', fontSize: '13px', lineHeight: '1.4'}}>
                 Welcome to the **Project Sentinel** event-driven attack path validation demo.
              </p>
              <p style={{marginBottom: '4px', fontSize: '12px', color: '#94a3b8'}}>Active use-case validations:</p>
              <ul style={{fontSize: '12px', paddingLeft: '24px', marginBottom: '12px', color: '#cbd5e1', listStyleType: 'disc'}}>
                 <li className={`capability-bullet ${hoveredPhase === 'phase1' ? 'glow' : ''} ${completedPhases.phase1 ? 'completed' : ''}`}>
                    {completedPhases.phase1 ? '✔ ' : '○ '}Case 1: Continuous telemetry drift validation
                 </li>
                 <li className={`capability-bullet ${hoveredPhase === 'phase2' ? 'glow' : ''} ${completedPhases.phase2 ? 'completed' : ''}`}>
                    {completedPhases.phase2 ? '✔ ' : '○ '}Case 2: Real-time Prompt Injection &amp; AI posture checks
                 </li>
                 <li className={`capability-bullet ${hoveredPhase === 'phase3' ? 'glow' : ''} ${completedPhases.phase3 ? 'completed' : ''}`}>
                    {completedPhases.phase3 ? '✔ ' : '○ '}Case 3: Automated multi-remediation prioritization
                 </li>
              </ul>
              
              <div style={{marginBottom: '16px', fontSize: '11px', color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                 <strong style={{color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '2px'}}>🛡️ Active Validation Engine Enabled:</strong>
                 <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}><span style={{color: '#FF0033'}}>🔴</span> <strong>Proven Vectors</strong> (Exploit confirmed via Webhook proofs)</div>
                 <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}><span style={{color: '#00CC66'}}>🟢</span> <strong>Blocked Junctions</strong> (Environmental mitigation confirmed)</div>
                 <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}><span style={{color: '#A0A0A0'}}>⚪</span> <strong>Unverified Paths</strong> (Theoretical CVSS risk baselines)</div>
              </div>

              <p style={{marginBottom: '16px', fontSize: '12px', fontWeight: 'bold', color: '#facc15'}}>
                 Select a scenario to trigger telemetry:
              </p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                 <button 
                   className="btn-primary" 
                   style={{width:'100%'}} 
                   onClick={handleStartScoping} 
                   disabled={chatPhase !== 'intro'}
                   onMouseEnter={() => setHoveredPhase('phase1')}
                   onMouseLeave={() => setHoveredPhase(null)}
                 >
                   Trigger Case 1: Workload Config Drift
                 </button>
                 <button 
                   className="btn-primary" 
                   style={{width:'100%', background: '#10b981'}} 
                   onClick={handleStartPhase2} 
                   disabled={chatPhase !== 'intro'}
                   onMouseEnter={() => setHoveredPhase('phase2')}
                   onMouseLeave={() => setHoveredPhase(null)}
                 >
                   Trigger Case 2: AI Posture Telemetry
                 </button>
                 <button 
                   className="btn-primary" 
                   style={{width:'100%', background: '#eab308'}} 
                   onClick={handleStartPhase3} 
                   disabled={chatPhase !== 'intro'}
                   onMouseEnter={() => setHoveredPhase('phase3')}
                   onMouseLeave={() => setHoveredPhase(null)}
                 >
                   Trigger Case 3: Prioritized Remediation
                 </button>
              </div>
           </div>
         );
      
      case 'path_selection':
        return (
          <div className="card-container">
            <h4><span style={{color:'#facc15'}}>★</span> Critical Path Target</h4>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Select path to deploy simulation observer tests:</p>
            <div className="cve-list mt-2">
              {msg.data.map(p => (
                <div key={p.id} className={`cve-card ${selectedPath === p.id ? 'selected' : ''}`} onClick={() => handlePathSelect(p.id)}>
                   <div style={{fontWeight:600}}>{p.id}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'assessment_action':
         return (
           <div className="card-container text-right">
             <button className="btn-primary" onClick={handleRunAssessment} disabled={chatPhase !== 'selection'}>
               Simulate Attack Path
             </button>
           </div>
         );

      case 'scanning_results':
         return (
            <div className="card-container">
               <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
                  <span style={{fontSize:'10px', background:'#a855f7', padding:'2px 6px', borderRadius:'4px', color:'white', fontWeight:'bold'}}>SIMULATION DAEMON</span>
                  <h4>Lateral Movement Traversed</h4>
               </div>
               
               <div style={{ background: '#090d16', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 0, 51, 0.2)', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#FF0033', borderRadius: '50%', boxShadow: '0 0 8px #FF0033' }}></span>
                    <strong style={{ color: '#FF3366', fontSize: '10px' }}>Proven Attack Vector: Exploit Validated</strong>
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '4px' }}>
                     Validation Status: Callback Confirmed (CVE-2023-50164)
                  </div>
                  <strong style={{ color: '#cbd5e1', fontSize: '9px', display: 'block', marginBottom: '4px' }}>Auditable Proof Evidence:</strong>
                  <div style={{ fontSize: '9px', color: '#38bdf8', fontFamily: 'monospace', background: 'rgba(0,0,0,0.5)', padding: '6px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                     uid=0(root) gid=0(root) groups=0(root) context=system_u:system_r:container_t:s0:c12,c34
                  </div>
               </div>

               <p style={{fontSize:'12px', marginBottom:'12px'}}>
                 Active validation complete. Port 8080 allows BOLA pivot. Environment PCS rose to 9.2.
               </p>
               <button className="btn-outline" style={{width:'100%'}} onClick={handleViewRemediation} disabled={chatPhase !== 'remediation_options'}>
                 View Remediation Options
               </button>
            </div>
         );

      case 'mitigation_options':
         return (
           <div className="card-container">
              <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
                  <span style={{fontSize:'10px', background:'#fb923c', padding:'2px 6px', borderRadius:'4px', color:'white', fontWeight:'bold'}}>REMEDIATION DAEMON</span>
              </div>
              <p style={{fontSize:'12px', marginBottom:'12px'}}>The Path Engine recommends WAF blocking rules to isolate workload-dev-discovery.</p>
              <div className="mitigation-card mt-2">
                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                   <span style={{fontWeight:600, color:'#10b981'}}>Recommended Mitigation</span>
                 </div>
                 <div style={{marginTop:'8px', fontSize:'12px'}}>
                   Deploy AWS WAF Container Rule <br/>
                   Target: Node B (Shadow API)
                 </div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px'}}>
                  <button className="btn-primary" style={{width:'100%'}} onClick={handleMitigate} disabled={chatPhase !== 'remediation_options'}>
                    Deploy AWS WAF Rule
                  </button>
              </div>
           </div>
         );

      case 'mitigation_success':
         return (
           <div className="card-container border-green">
              <div style={{color:'#10b981', fontWeight:600, marginBottom:'8px'}}>✔ Deploying Mitigation Policy</div>
              <p style={{fontSize:'12px'}}>Event published. Evaluating telemetry feedback from sidecar observers...</p>
           </div>
         );

      case 'revalidation_results':
         return (
           <div className="card-container">
              <h4 style={{color:'#10b981'}}>Posture Revalidated: SECURED</h4>
              <p style={{fontSize:'12px', marginTop:'12px'}}>⭐ Continuous check complete. The visual attack path has been neutralized. Residual PCS score: 7.7.</p>
              {chatPhase === 'complete' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                   <button className="btn-outline" style={{width:'100%'}} onClick={handleAgentReset}>
                     ↻ Reset Agent Telemetry
                   </button>
                 </div>
              )}
           </div>
         );

      case 'phase2_review_prompt':
         return (
           <div className="card-container text-right">
             <button className="btn-primary" onClick={handlePhase2Simulate} disabled={chatPhase !== 'phase2_review'}>
               Simulate Prompt Injection
             </button>
           </div>
         );

      case 'phase2_reremediation_prompt':
         return (
           <div className="card-container">
              <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
                  <span style={{fontSize:'10px', background:'#fb923c', padding:'2px 6px', borderRadius:'4px', color:'white', fontWeight:'bold'}}>REMEDIATION DAEMON</span>
              </div>
              <p style={{fontSize:'12px', marginBottom:'8px'}}>Simulation confirmed. Prompt injection can breach root DB. The engine has generated an egress container policy.</p>
              <button className="btn-primary" style={{width:'100%'}} onClick={handlePhase2Mitigate} disabled={chatPhase !== 'phase2_remediation'}>
                Deploy Egress AuthorizationPolicy
              </button>
           </div>
         );

      case 'phase2_revalidation_results':
         return (
           <div className="card-container">
              <h4 style={{color:'#10b981'}}>AI Posture Secured</h4>
              <p style={{fontSize:'12px', marginTop:'12px'}}>⭐ AuthorizationPolicy applied. Internet egress restricted on billing pod. Posture neutralized.</p>
              {chatPhase === 'phase2_complete' && (
                 <button className="btn-outline" style={{marginTop:'12px', width:'100%'}} onClick={handleAgentReset}>
                   ↻ Reset Agent Telemetry
                 </button>
              )}
           </div>
         );

      case 'phase3_selection':
         return (
           <div className="card-container">
             <h4><span style={{color:'#facc15'}}>★</span> Multi-Vulnerability Prioritization</h4>
             <p style={{fontSize:'12px', marginTop:'8px'}}>
               Multiple observers reporting active drifts. Shadow API (9.6) and VPN (8.1) vulnerabilities detected.
             </p>
             <button className="btn-primary" style={{marginTop:'12px', width:'100%'}} onClick={handlePhase3Simulate} disabled={chatPhase !== 'phase3_selection'}>
               Simulate CVE-2024-XXXX Reachability
             </button>
           </div>
         );

      case 'phase3_blast_radius':
         return (
            <div className="card-container" style={{borderColor: '#ef4444'}}>
               <h4 style={{color:'#ef4444'}}>Exploit Traversal &amp; Remediation Options</h4>
               
               <div style={{ marginTop: '10px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h5 style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>🛡️ Active Validation Results</h5>
                  <div style={{ background: '#090d16', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#FF0033' }}>🔴</span>
                          <strong style={{ color: '#FF3366', fontSize: '10px' }}>Node B (Shadow API) - Proven Attack Vector</strong>
                        </div>
                        <div style={{ fontSize: '9px', color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>Exploit Validated: Callback Confirmed (CVE-2023-50164)</div>
                        <div style={{ fontSize: '9px', color: '#38bdf8', fontFamily: 'monospace', background: 'rgba(0,0,0,0.5)', padding: '6px', borderRadius: '4px', marginTop: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          uid=0(root) gid=0(root) groups=0(root) context=system_u:system_r:container_t:s0:c12,c34
                        </div>
                     </div>
                     <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#00CC66' }}>🟢</span>
                          <strong style={{ color: '#00FF88', fontSize: '10px' }}>Node K (VPN Gateway) - Blocked Path Junction</strong>
                        </div>
                        <div style={{ fontSize: '9px', color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>🔒 Exploit Mitigated. Traversal neutralized by active environmental controls.</div>
                     </div>
                     <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#A0A0A0' }}>⚪</span>
                          <strong style={{ color: '#cbd5e1', fontSize: '10px' }}>Node F (Identity Provider) - Unverified Link</strong>
                        </div>
                        <div style={{ fontSize: '9px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>⚠️ Pending / Inconclusive. Absence of proof does not mean absence of risk. CVSS 8.5 baseline preserved.</div>
                     </div>
                  </div>
               </div>

               <p style={{fontSize:'12px', marginTop:'8px'}}>
                 Hypothetical exploit path validated. Attacker reaches Crown Jewel: AD Core via VPN Gateway.
               </p>
               <div style={{marginTop:'12px'}}>
                  <h5 style={{color:'#94a3b8', fontSize:'10px', marginBottom:'8px'}}>PRIORITIZED REMEDIATIONS</h5>
                  {(phase3Simulation?.mitigationOptions || []).map((option, index) => (
                    <div key={option.id} className="mitigation-card mt-2" style={{cursor:'pointer', borderColor: index === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}} onClick={() => chatPhase === 'phase3_remediation_options' && handlePhase3Mitigate(option)}>
                      <div style={{fontWeight:600, color:index === 0 ? '#10b981' : '#93c5fd', fontSize:'11px'}}>Option {index + 1}: {option.label}</div>
                      <div style={{fontSize:'10px', color:'#cbd5e1', marginTop:'4px'}}>
                        Closes {option.pathsClosed} path(s). PCS -{option.scoreReduction}. Approval: {option.approvalGate}.
                      </div>
                    </div>
                  ))}
               </div>
            </div>
         );

      case 'phase3_bypass_prompt':
         return (
           <div className="card-container border-green">
              <p style={{fontSize:'12px'}}>
                Primary exploit blocked. Observe if secondary bypass routes exist around the VPN gateway segment.
              </p>
              <button className="btn-outline" style={{marginTop:'12px', width:'100%'}} onClick={handlePhase3PolicyPreview} disabled={!phase3Policy}>
                Show Policy-as-Code Rules
              </button>
              <button className="btn-primary" style={{marginTop:'12px', width:'100%'}} onClick={handlePhase3Bypass} disabled={chatPhase !== 'phase3_bypass'}>
                Simulate Attacker Bypass
              </button>
           </div>
         );

      case 'phase3_complete':
         return (
           <div className="card-container">
              <h4 style={{color:'#10b981'}}>Posture Validated: SECURED</h4>
              <p style={{fontSize:'12px', marginTop:'8px'}}>Audit replay complete. VPN bypass blocked. Security verified across monitored k8s hosts.</p>
              <button className="btn-outline" style={{marginTop:'12px', width:'100%'}} onClick={handlePhase3Report} disabled={!phase3Report}>
                Show Compliance Audit Report
              </button>
              {chatPhase === 'phase3_complete' && (
                 <button className="btn-outline" style={{marginTop:'12px', width:'100%'}} onClick={handleAgentReset}>
                   ↻ Reset Agent Telemetry
                 </button>
              )}
           </div>
         );

      case 'phase3_policy_preview':
         return (
           <div className="card-container" style={{borderColor:'#38bdf8'}}>
              <h4 style={{color:'#38bdf8'}}>Policy Preview</h4>
              <pre style={{background:'#0f172a', padding:'10px', borderRadius:'6px', marginTop:'10px', fontSize:'9px', color:'#e2e8f0', overflowX:'auto'}}>
                {phase3Policy?.content || 'Policy preview unavailable.'}
              </pre>
           </div>
         );

      case 'phase3_report':
         return (
           <div className="card-container" style={{borderColor:'#14b8a6', background:'rgba(20,184,166,0.05)'}}>
              <h4 style={{color:'#14b8a6'}}>Audit Ledger Details</h4>
              <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'8px', marginTop:'10px', fontSize:'11px'}}>
                <div><strong>Compliance Status:</strong> Secured</div>
                <div><strong>Headline:</strong> {phase3Report?.headline || '-'}</div>
                <div><strong>Business impact:</strong> {phase3Report?.businessImpact || '-'}</div>
                <div><strong>Recommended action:</strong> {phase3Report?.recommendedAction || '-'}</div>
              </div>
           </div>
         );

      default: return null;
    }
  };

  return (
    <div className="agent-chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: 'transparent', border: 'none' }}>
      <div className="chat-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="agent-avatar" style={{ background: '#3b82f6' }}>🤖</div>
        <div style={{fontWeight:600, color:'white', fontSize:'15px'}}>Agent Iris</div>
      </div>
      
      <div className="chat-messages" style={{ padding: '20px' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.sender}`} style={{ marginBottom: '16px' }}>
            {msg.sender === 'agent' && (
              <div style={{display:'flex', flexDirection:'column', gap:'4px', width: '100%'}}>
                 {msg.identity && <div style={{fontSize:'9px', fontWeight:'bold', color: msg.color||'#3b82f6', marginLeft:'32px', textTransform:'uppercase', letterSpacing:'1px'}}>{msg.identity}</div>}
                 <div style={{display:'flex', gap:'8px', alignItems:'flex-end'}}>
                   <div className="mini-avatar" style={{background: msg.color||'#3b82f6'}}>🤖</div>
                   <div className="message-content">{renderMessageContent(msg, i)}</div>
                 </div>
              </div>
            )}
            {msg.sender === 'user' && (
               <>
                 <div className="message-content" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                   <div className="chat-bubble" style={{ background: '#1e293b', border: 'none' }}>{msg.content}</div>
                 </div>
                 <div className="mini-avatar user" style={{ background: '#475569', marginLeft: '8px' }}>👤</div>
               </>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="message-row agent" style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="mini-avatar" style={{background: '#475569'}}>🤖</div>
            <div className="typing-indicator" style={{ display: 'flex', gap: '4px', padding: '12px 16px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px' }}>
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={endOfChatRef} style={{height:'10px'}} />
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.95)', zIndex: 10, marginTop: 'auto' }}>
         <div 
           style={{ padding: '8px 16px', fontSize: '11px', color: '#94a3b8', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
           onClick={() => setShowAudit(!showAudit)}
         >
           <span style={{fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px'}}>Audit Trail &amp; Compliance Log</span>
           <span>{showAudit ? '▼' : '▲'}</span>
         </div>
         
         {showAudit && (
           <div style={{ padding: '0 16px 16px 16px', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeAuditLogs.length === 0 ? <div style={{fontSize:'11px', color:'#64748b'}}>No Sentinel events logged yet.</div> : 
               activeAuditLogs.map((log, i) => (
                 <div key={i} style={{fontSize: '11px', color: '#cbd5e1', display: 'flex', gap: '12px', borderLeft: '2px solid #3b82f6', paddingLeft: '8px'}}>
                   <span style={{color: '#64748b', minWidth: '60px'}}>{log.time}</span>
                   <span>{log.text}</span>
                 </div>
               ))
              }
           </div>
         )}

         {chatPhase === 'phase3_complete' && (
           <form onSubmit={handlePhase3NLQ} style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <input name="q" placeholder="Ask a hypothetical scenario..." style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', fontSize: '12px' }} autoComplete="off" />
           </form>
         )}
      </div>
    </div>
  );
}
