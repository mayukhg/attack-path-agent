import { useState, useEffect, useRef, useCallback } from 'react';
import { advancedScenario } from '../data/attackScenarios';

const mockPaths = [
  { id: 'Path 1: UAT Dev -> Shadow API', nexus: 'API BOLA Abuse', nodes: 5, score: 9.6 },
  { id: 'Path 2: DMZ -> Kubelet', nexus: 'Container Escape', nodes: 3, score: 10.0 },
  { id: 'Path 3: Phishing -> VPN', nexus: 'Credential Theft', nodes: 4, score: 10.0 }
];

const ValidationProgressCard = ({ targets, pathId, isRevalidation }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return (
    <div style={{ width: '100%', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '13px', height: '13px', border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isRevalidation ? 'Re-Validating After Mitigation' : 'Active Validation Running'}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{mm}:{ss} elapsed</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        {targets.map((t, idx) => {
          const node = advancedScenario.nodes.find(n => n.id === t.node_id);
          return (
            <div key={t.node_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: '7px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block', boxShadow: '0 0 5px #3b82f6', animation: 'pulse 1s infinite' }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>Node {t.node_id} — {node?.data?.label || t.node_id}</div>
                  <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#64748b' }}>{t.cve_id} · {t.ip_address}:{t.ingress_port}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[0,1,2].map(d => <span key={d} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block', animation: `wave 0.8s ease ${d * 0.15}s infinite` }} />)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
        Testing {targets.length} node(s) on path {pathId} · awaiting TruConfirm callback
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="typing-indicator" style={{ display: 'flex', gap: '4px', padding: '12px 16px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', width: 'fit-content' }}>
    <span className="dot"></span><span className="dot"></span><span className="dot"></span>
  </div>
);

const callAttackPathApi = async (options = {}) => {
  const response = await fetch('/api/attack-path', {
    method: options.method || 'POST',
    headers: options.method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
    body: options.method === 'GET' ? undefined : JSON.stringify(options.body || {}),
  });

  if (!response.ok) {
    throw new Error('Attack path API request failed');
  }

  return response.json();
};

export default function AgentDaeChat({ onAction, setSharedState }) {
  const [messages, setMessages] = useState([]);
  const [chatPhase, setChatPhase] = useState('intro');
  const [selectedPath, setSelectedPath] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [phase3Analysis, setPhase3Analysis] = useState(null);
  const [phase3Simulation, setPhase3Simulation] = useState(null);
  const [phase3Remediation, setPhase3Remediation] = useState(null);
  const [phase3Policy, setPhase3Policy] = useState(null);
  const [phase3Report, setPhase3Report] = useState(null);
  const [whatIfAnswer, setWhatIfAnswer] = useState('');
  // TruConfirm validation state
  const [validationTargets, setValidationTargets] = useState([]);
  const [validationPathId, setValidationPathId] = useState(null);
  const endOfChatRef = useRef(null);
  const initRef = useRef(false);

  const pushMessage = useCallback((msg, delay) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, msg]);
      if (chatPhase.startsWith('phase3')) {
         setAuditLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `${msg.identity || 'System'}: ${msg.content || 'Action executed'}` }]);
      }
    }, delay);
  }, [chatPhase]);

  useEffect(() => {
    if (chatPhase === 'intro' && messages.length === 0 && !initRef.current) {
      initRef.current = true;
      pushMessage({ sender: 'agent', identity: 'Mapping Agent', color: '#3b82f6', type: 'intro_prompt' }, 1500);
    }
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatPhase, messages.length, pushMessage]);

  // SSE subscription: listen for TruConfirm callback results
  useEffect(() => {
    if (!validationPathId) return;
    if (chatPhase !== 'phase3_validating' && chatPhase !== 'phase3_revalidating') return;

    const isRevalidation = chatPhase === 'phase3_revalidating';
    const es = new EventSource(`/api/validation-events?path_id=${encodeURIComponent(validationPathId)}`);

    es.onmessage = (e) => {
      es.close();
      try {
        const payload = JSON.parse(e.data);
        if (payload.error) {
          setMessages(prev => [...prev, { sender: 'agent', identity: 'Agent Iris', color: '#3b82f6', type: 'text', content: 'TruConfirm validation timed out. Proceeding with theoretical risk posture.' }]);
          setChatPhase(isRevalidation ? 'phase3_bypass' : 'phase3_remediation_options');
          return;
        }
        setAuditLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `TruConfirm: Validation callback received for ${payload.path_id} — ${payload.results.length} node(s) assessed in ${payload.execution_duration_ms}ms` }]);
        setMessages(prev => [...prev, {
          sender: 'agent',
          identity: isRevalidation ? 'Agent Iris · TruConfirm Re-Validation' : 'Agent Iris · TruConfirm Results',
          color: isRevalidation ? '#10b981' : '#ef4444',
          type: 'validation_results',
          data: { ...payload, isRevalidation },
        }]);
        if (isRevalidation) {
          setChatPhase('phase3_bypass');
        } else {
          setChatPhase('phase3_remediation_options');
        }
      } catch (err) {
        console.error('Failed to parse validation event:', err);
        setChatPhase(isRevalidation ? 'phase3_bypass' : 'phase3_remediation_options');
      }
    };

    es.onerror = () => {
      es.close();
      setChatPhase(isRevalidation ? 'phase3_bypass' : 'phase3_remediation_options');
    };

    return () => es.close();
  }, [validationPathId, chatPhase]);

  const handleStartScoping = () => {
    setChatPhase('discovery');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Yes, start critical attack path discovery" }]);
    
    setTimeout(() => {
        pushMessage({ sender: 'agent', identity: 'Mapping Agent', color: '#3b82f6', type: 'text', content: "Validating your topology, hold tight..." }, 1000);
        onAction('init_map');
    }, 1500);

    setTimeout(() => {
        pushMessage({ sender: 'agent', identity: 'Mapping Agent', color: '#3b82f6', type: 'text', content: "You're off to a great start! I've analyzed 3 critical attack paths converging on your core assets. Please select an attack path to proceed further with the flow" }, 1500);
    }, 6000);

    setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'agent', type: 'path_selection', data: mockPaths }]);
        setChatPhase('selection');
        setSharedState({ activePaths: 3, pcsScore: 0 }); // Update global metrics
    }, 8500);
  };

  const handlePathSelect = (pathId) => {
    setSelectedPath(pathId);
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: `Validate ${pathId}` }]);
    
    // Pass off to Simulation Agent
    setTimeout(() => {
       pushMessage({ sender: 'agent', identity: 'Simulation Agent', color: '#a855f7', type: 'text', content: `Simulation Agent engaging. I will execute a safe exploit validation simulating a lateral movement chain along this path.` }, 1500);
    }, 500);

    setTimeout(() => {
       setMessages(prev => [...prev, { sender: 'agent', type: 'assessment_action', pathId: pathId }]);
    }, 2500);
  };

  const handleRunAssessment = () => {
    setChatPhase('scanning');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Simulate Attack Path" }]);
    onAction('simulate_path'); 
    setSharedState({ isSimulating: true });
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'agent', type: 'scanning_results', pathId: selectedPath }]);
      setChatPhase('remediation_options');
      setSharedState({ isSimulating: false, pcsScore: 9.9 });
    }, 4500);
  };

  const handleViewRemediation = () => {
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "View Remediation Options" }]);
    
    // Hand off to Remediation Agent
    setTimeout(() => {
       pushMessage({ sender: 'agent', identity: 'Remediation Agent', color: '#fb923c', type: 'mitigation_options' }, 2000);
    }, 500);
  };

  const handleMitigate = () => {
    setChatPhase('fixing');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Deploy Mitigation + Revalidate" }]);
    
    setTimeout(() => {
       pushMessage({ sender: 'agent', identity: 'Remediation Agent', color: '#fb923c', type: 'text', content: `Mitigation deployment initiated for ${selectedPath}. Target: Node B (Shadow API). Circuit breaker applied.` }, 1500);
    }, 500);
    
    setTimeout(() => {
       setMessages(prev => [...prev, { sender: 'agent', type: 'mitigation_success' }]);
       onAction('secure_path'); 
    }, 3500);

    setTimeout(() => {
       setIsTyping(true);
    }, 4500);

    setTimeout(() => {
       setIsTyping(false);
       setMessages(prev => [...prev, { sender: 'agent', type: 'revalidation_results' }]);
       setChatPhase('complete');
       setSharedState({ pcsScore: 7.7, activePaths: 2 }); // Path drops
    }, 6500);
  };

  const handleWhyRecommendation = () => {
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Why did you recommend this?" }]);
    
    setTimeout(() => {
       pushMessage({ 
         sender: 'agent', 
         identity: 'Remediation Agent', 
         color: '#fb923c', 
         type: 'text', 
         content: "I recommended a Hardware MFA because the simulation showed the attacker successfully bypasses traditional password-based sessions via NTLM extraction at Node F. Deploying MFA acts as an immediate circuit breaker." 
       }, 1500);
    }, 500);
  };

  const handleExportPaC = () => {
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Export Policy-as-Code (Terraform)" }]);
    
    setTimeout(() => {
       pushMessage({ 
         sender: 'agent', 
         identity: 'Remediation Agent', 
         color: '#fb923c', 
         type: 'pac_export' 
       }, 1500);
    }, 500);
  };

  const handleWhatIf = () => {
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "What if we move this database to a different VPC?" }]);
    
    setTimeout(() => {
       pushMessage({ 
         sender: 'agent', 
         identity: 'Simulation Agent', 
         color: '#a855f7', 
         type: 'what_if_result' 
       }, 1500);
    }, 500);
  };

  const handleGenerateReport = () => {
    setChatPhase('generating_report');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Generate Executive Report" }]);
    
    setTimeout(() => {
       pushMessage({ 
         sender: 'agent', 
         identity: 'Reporting Agent', 
         color: '#14b8a6', 
         type: 'text',
         content: "Compiling executive summary of the simulated attack path, mitigations applied, and business impact..."
       }, 500);
    }, 500);

    setTimeout(() => {
       setMessages(prev => [...prev, { sender: 'agent', type: 'executive_report' }]);
       setChatPhase('report_generated');
    }, 2500);
  };

  const handleAgentReset = () => {
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
    setSharedState({ activePaths: 0, pcsScore: 0, isSimulating: false });
    onAction('init_map'); 
  };

  const handleStartPhase2 = () => {
    setChatPhase('phase2_discovery');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Begin Phase 2: AI Agent Posture Validation" }]);
    
    setTimeout(() => {
        pushMessage({ sender: 'agent', identity: 'Mapping Agent', color: '#3b82f6', type: 'text', content: "I am now shifting focus to your AI supply chain. I am now building a dynamic inventory of your AI based applications to understand what AI related implementations your teams are doing" }, 1500);
        onAction('init_ai_map'); 
        setSharedState({ activePaths: 1, pcsScore: 0 }); 
    }, 500);

    setTimeout(() => {
        pushMessage({ sender: 'agent', identity: 'Mapping Agent', color: '#3b82f6', type: 'text', content: "I have successfully mapped the new Finance AI architecture. I am natively flagging that this AI agent is currently 🌐 Internet Exposed and possesses active bindings to 🔒 Sensitive Customer Data." }, 5500);
    }, 1500);

    setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'agent', type: 'phase2_review_prompt' }]);
        setChatPhase('phase2_review');
    }, 9000);
  };

  const handlePhase2Simulate = () => {
     setChatPhase('phase2_simulating');
     setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Authorize Security Review Simulation" }]);
     onAction('simulate_ai_path');
     
     setTimeout(() => {
        pushMessage({ sender: 'agent', identity: 'Simulation Agent', color: '#a855f7', type: 'text', content: "I am now taking over to conduct an automated security review at AI-speed without requiring manual DevOps reviews. I am simulating an external Prompt Injection attack against the Finance AI Agent to see if it can be manipulated into leaking the Customer Root Database." }, 1000);
     }, 500);

     setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'agent', type: 'phase2_remediation_prompt' }]);
        setChatPhase('phase2_remediation');
        setSharedState({ pcsScore: 10.0 });
     }, 6000);
  };

  const handlePhase2Mitigate = () => {
     setChatPhase('phase2_complete');
     setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Authorize Dev Handoff & Secure" }]);
     
     setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'agent', type: 'mitigation_success' }]);
        onAction('secure_ai_path'); 
     }, 1500);
     
     setTimeout(() => {
        setIsTyping(true);
     }, 2500);

     setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { sender: 'agent', type: 'phase2_revalidation_results' }]);
        setSharedState({ pcsScore: 0.0, activePaths: 0 });
     }, 4500);
  };

  // --- Phase 3 Flows ---
  const handleStartPhase3 = async () => {
    setChatPhase('phase3_discovery');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Begin Phase 3: Advanced Command Center" }]);
    
    setTimeout(() => {
        pushMessage({ sender: 'agent', identity: 'Mapping Agent', color: '#3b82f6', type: 'text', content: "Executing advanced parallel topography scan..." }, 1000);
        onAction('init_phase3_map');
        setSharedState({ activePaths: 0, pcsScore: 0 }); 
    }, 500);

    try {
      const result = await callAttackPathApi({ method: 'GET' });
      setPhase3Analysis(result.analysis);
      setSharedState({ activePaths: result.analysis.activePaths, pcsScore: result.analysis.pcsScore });

      setTimeout(() => {
          const choke = result.analysis.chokePoints[0];
          pushMessage({ sender: 'agent', identity: 'Mapping Agent', color: '#3b82f6', type: 'text', content: `I discovered ${result.analysis.activePaths} viable attack paths. ${result.analysis.topPath.title} is currently highest risk at PCS ${result.analysis.pcsScore.toFixed(1)}. The strongest convergence point is ${choke?.label || 'the Shadow API'}.` }, 4500);
      }, 500);

      setTimeout(() => {
          setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_selection' }]);
          setChatPhase('phase3_selection');
      }, 7500);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `Backend analysis failed: ${error.message}` }]);
      setChatPhase('intro');
    }
  };

  const handlePhase3Simulate = async () => {
    setChatPhase('phase3_simulating');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Simulate Prioritized Path & Enumerate Blast Radius" }]);
    setSharedState({ isSimulating: true });
    setAuditLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `System: Backend path traversal requested` }]);
    
    try {
      const result = await callAttackPathApi({ body: { intent: 'simulate', pathId: phase3Analysis?.topPath?.id } });
      setPhase3Simulation(result);
      onAction('simulate_phase3_path', {
        edgeIds: result.selectedPath.edgeIds,
        nodeIds: result.selectedPath.nodeIds,
      });

      setTimeout(() => {
         pushMessage({ sender: 'agent', identity: 'Simulation Agent', color: '#a855f7', type: 'text', content: `Traversing ${result.selectedPath.id} with ${result.selectedPath.techniques.join(', ')} and confidence scoring...` }, 500);
      }, 500);

      setTimeout(async () => {
         onAction('simulate_blast_radius', {
           blastNodeIds: result.blastRadius.map((asset) => asset.id),
         });
         setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_blast_radius' }]);
         setAuditLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Simulation Agent: PCS ${result.selectedPath.pcs.toFixed(1)}. ${result.blastRadius.length} blast-radius assets exposed.` }]);
         setSharedState({ isSimulating: false, pcsScore: result.selectedPath.pcs });

         // Delegate to TruConfirm active validation
         const targets = result.validationTargets || [];
         if (targets.length > 0) {
           const pathId = result.selectedPath.id;
           setValidationTargets(targets);
           setValidationPathId(pathId);
           setChatPhase('phase3_validating');
           setMessages(prev => [...prev, {
             sender: 'agent',
             identity: 'Agent Iris · TruConfirm',
             color: '#3b82f6',
             type: 'validation_in_progress',
             data: { targets, pathId },
           }]);
           setAuditLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Agent Iris: Delegated ${targets.length} node(s) to TruConfirm for empirical validation. Path: ${pathId}` }]);
           try {
             await fetch('/api/validation-delegate', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ path_id: pathId, tenant_id: 'default', targets, callback_url: `${window.location.origin}/api/validation-callback` }),
             });
           } catch (err) {
             console.error('Validation delegate failed:', err);
             setChatPhase('phase3_remediation_options');
           }
         } else {
           setChatPhase('phase3_remediation_options');
         }
      }, 5500);
    } catch (error) {
      setSharedState({ isSimulating: false });
      setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `Simulation failed: ${error.message}` }]);
    }
  };

  const handlePhase3Mitigate = async (option) => {
    setChatPhase('phase3_fixing');
    const mitigationId = option?.id || option;
    const mitigationLabel = option?.label || option;
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: `Deploy ${mitigationLabel}` }]);
    
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
         pushMessage({ sender: 'agent', identity: 'Remediation Agent', color: '#fb923c', type: 'text', content: `Applying ${result.mitigation.label}. Target: ${result.mitigation.targetNode}. Expected PCS reduction: ${result.mitigation.scoreReduction.toFixed(1)}.` }, 1000);
      }, 500);
    
      setTimeout(() => {
         setMessages(prev => [...prev, { sender: 'agent', type: 'mitigation_success' }]);
         onAction('secure_phase3_path', {
           blockedEdgeIds: result.mitigation.blockedEdges,
           targetNode: result.mitigation.targetNode,
         }); 
      }, 3000);

      setTimeout(async () => {
         setSharedState({ pcsScore: result.pcsScore, activePaths: result.activePaths });

         // Re-validate after mitigation if we have targets
         if (validationTargets.length > 0) {
           const revalPathId = `${result.mitigation?.id || mitigationId}-revalidation`;
           setValidationPathId(revalPathId);
           setChatPhase('phase3_revalidating');
           setMessages(prev => [...prev, {
             sender: 'agent',
             identity: 'Agent Iris · TruConfirm',
             color: '#3b82f6',
             type: 'validation_in_progress',
             data: { targets: validationTargets, pathId: revalPathId, isRevalidation: true },
           }]);
           setAuditLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Agent Iris: Re-delegating ${validationTargets.length} node(s) to TruConfirm to confirm EXPLOIT_MITIGATED state.` }]);
           try {
             await fetch('/api/validation-delegate', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ path_id: revalPathId, tenant_id: 'default', targets: validationTargets, callback_url: `${window.location.origin}/api/validation-callback` }),
             });
           } catch (err) {
             console.error('Re-validation delegate failed:', err);
             setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_bypass_prompt' }]);
             setChatPhase('phase3_bypass');
           }
         } else {
           setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_bypass_prompt' }]);
           setChatPhase('phase3_bypass');
         }
      }, 6000);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `Mitigation failed: ${error.message}` }]);
    }
  };

  const handlePhase3Bypass = () => {
    setChatPhase('phase3_bypassing');
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Yes, simulate bypass" }]);
    onAction('simulate_bypass');
    
    setTimeout(() => {
       pushMessage({ sender: 'agent', identity: 'Simulation Agent', color: '#a855f7', type: 'text', content: "Attempting alternate traversal via T1059 (Command and Scripting Interpreter)..." }, 1000);
    }, 500);

    setTimeout(() => {
       setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_complete' }]);
       setChatPhase('phase3_complete');
    }, 4500);
  };

  const handlePhase3PolicyPreview = () => {
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Show policy preview and approval package" }]);
    setTimeout(() => {
       setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_policy_preview' }]);
    }, 700);
  };

  const handlePhase3Report = () => {
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: "Generate executive and technical report" }]);
    setTimeout(() => {
       setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_report' }]);
    }, 700);
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
         pushMessage({ sender: 'agent', identity: 'Analytics Agent', color: '#6366f1', type: 'text', content: result.answer }, 1000);
      }, 500);
    } catch (error) {
      setWhatIfAnswer('');
      setMessages(prev => [...prev, { sender: 'agent', type: 'text', content: `What-if analysis failed: ${error.message}` }]);
    }
  };

  // --- Render Helpers ---
  const renderMessageContent = (msg, i) => {
    switch (msg.type) {
      case 'text':
        return <div className="chat-bubble">{msg.content}</div>;

      case 'intro_prompt':
         return (
           <div className="card-container text-left" style={{marginTop:'4px', marginBottom:'12px'}}>
              <p style={{marginBottom: '12px', fontSize: '13px', lineHeight: '1.4'}}>
                 Hello! I am <strong>Agent Iris</strong>.
              </p>
              <p style={{marginBottom: '4px', fontSize: '12px', color: '#94a3b8'}}>I perform the following actions:</p>
              <ul style={{fontSize: '12px', paddingLeft: '24px', marginBottom: '12px', color: '#cbd5e1', listStyleType: 'disc'}}>
                 <li>Autonomous critical attack path discovery</li>
                 <li>Real-time Lateral Movement Simulation</li>
                 <li>Target-specific Threat Remediation</li>
              </ul>
              <p style={{marginBottom: '4px', fontSize: '12px', color: '#94a3b8'}}>Which give you the following benefits:</p>
              <ul style={{fontSize: '12px', paddingLeft: '24px', marginBottom: '16px', color: '#cbd5e1', listStyleType: 'disc'}}>
                 <li>Drastically Reduced MTTR</li>
                 <li>Preemptive Choke-point Identification</li>
                 <li>Elimination of Legacy Manual Friction</li>
              </ul>
              <p style={{marginBottom: '16px', fontSize: '12px', fontWeight: 'bold', color: '#facc15'}}>
                 Which demonstration phase would you like to execute?
              </p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                 <button className="btn-primary" style={{width:'100%'}} onClick={handleStartScoping} disabled={chatPhase !== 'intro'}>
                   Phase 1: Critical Attack Path Discovery
                 </button>
                 <button className="btn-primary" style={{width:'100%', background: '#10b981'}} onClick={handleStartPhase2} disabled={chatPhase !== 'intro'}>
                   Phase 2: AI Agent Posture Validation
                 </button>
                 <button className="btn-primary" style={{width:'100%', background: '#eab308'}} onClick={handleStartPhase3} disabled={chatPhase !== 'intro'}>
                   Phase 3: Advanced Command Center
                 </button>
              </div>
           </div>
         );
      
      case 'path_selection':
        return (
          <div className="card-container">
            <h4><span style={{color:'#facc15'}}>★</span> Recommendation</h4>
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
                 <span style={{fontSize:'10px', background:'#a855f7', padding:'2px 6px', borderRadius:'4px', color:'white', fontWeight:'bold'}}>SIMULATION AGENT</span>
                 <h4>Lateral Movement Achieved</h4>
              </div>
              <p style={{fontSize:'12px', marginBottom:'12px'}}>
                Simulation traversed successfully. Shadow API breached. Path Criticality Score (PCS) skyrocketed from 9.6 to 9.9.
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
                 <span style={{fontSize:'10px', background:'#fb923c', padding:'2px 6px', borderRadius:'4px', color:'white', fontWeight:'bold'}}>REMEDIATION AGENT</span>
             </div>
             <p style={{fontSize:'12px', marginBottom:'12px'}}>I recommend severing the choke point immediately.</p>
             <p style={{fontSize:'12px', marginBottom:'12px', color: '#10b981'}}><strong>Business Impact Projection:</strong> Severing this path protects an estimated $2.4M in daily transaction volume facilitated by this API.</p>
             <div className="mitigation-card mt-2">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{fontWeight:600, color:'#10b981'}}>1 Mitigation Option</span>
                  <span style={{fontSize: '9px', background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap'}}>Closes 2 additional paths</span>
                </div>
                <div style={{marginTop:'8px', fontSize:'12px'}}>
                  Deploy Virtual WAF & Enforce Hardware MFA Circuit Breaker <br/>
                  Target: Node B (Shadow API)
                </div>
                <button className="btn-outline" style={{marginTop:'12px', fontSize: '10px', padding: '4px 8px'}} onClick={handleWhyRecommendation} disabled={chatPhase !== 'remediation_options'}>
                   Why this recommendation?
                </button>
             </div>
             <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px'}}>
                 <button className="btn-primary" style={{width:'100%'}} onClick={handleMitigate} disabled={chatPhase !== 'remediation_options'}>
                   Deploy Mitigation + Revalidate
                 </button>
                 <button className="btn-outline" style={{width:'100%'}} onClick={handleExportPaC} disabled={chatPhase !== 'remediation_options'}>
                   Export Policy-as-Code (Terraform)
                 </button>
                 <button className="btn-outline" style={{width:'100%'}} onClick={handleWhatIf} disabled={chatPhase !== 'remediation_options'}>
                   What-If Sandbox: Move DB to isolated VPC
                 </button>
             </div>
           </div>
         );

      case 'mitigation_success':
         return (
           <div className="card-container border-green">
              <div style={{color:'#10b981', fontWeight:600, marginBottom:'8px'}}>✔ Mitigation Deployment</div>
              <p style={{fontSize:'12px'}}>Re-launching Agent Iris simulation across the topography to verify remediation effectiveness...</p>
           </div>
         );

      case 'revalidation_results':
         return (
           <div className="card-container">
              <h4 style={{color:'#10b981'}}>Path Completely Severed</h4>
              <p style={{fontSize:'12px', marginTop:'12px'}}>⭐ Done! Your path validation summary has been sent. The PCS score dropped safely to 7.7.</p>
              {chatPhase === 'complete' && (
                 <button className="btn-primary" style={{marginTop:'12px', width:'100%', background: '#14b8a6'}} onClick={handleGenerateReport}>
                   Generate Executive Report
                 </button>
              )}
           </div>
         );

      case 'pac_export':
         return (
           <div className="card-container border-green">
              <div style={{color:'#10b981', fontWeight:600, marginBottom:'8px'}}>Terraform Exported</div>
              <pre style={{background:'#1e293b', padding:'8px', borderRadius:'4px', fontSize:'10px', color:'#cbd5e1', overflowX:'auto'}}>
{`resource "aws_wafv2_web_acl" "shadow_api_waf" {
  name  = "shadow-api-protection"
  scope = "REGIONAL"

  rule {
    name     = "mfa-circuit-breaker"
    priority = 1
    action { block {} }
    statement {
      # Custom logic mapped
    }
  }
}`}
              </pre>
              <p style={{fontSize:'12px', marginTop:'8px'}}>The Terraform snippet is ready. You can merge this directly into your GitOps pipeline.</p>
           </div>
         );

      case 'what_if_result':
         return (
           <div className="card-container" style={{borderColor: '#a855f7'}}>
              <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>
                 <span style={{fontSize:'10px', background:'#a855f7', padding:'2px 6px', borderRadius:'4px', color:'white', fontWeight:'bold'}}>SIMULATION AGENT</span>
                 <h4 style={{color:'#a855f7'}}>Sandbox Result</h4>
              </div>
              <p style={{fontSize:'12px', marginBottom:'8px'}}>If we move the Customer Root Database to a different, isolated VPC:</p>
              <ul style={{fontSize:'11px', paddingLeft:'20px', color:'#cbd5e1', listStyleType:'circle'}}>
                 <li style={{marginBottom:'4px'}}>The PCS score of our Domain Admin path drops from 9.9 to <strong>3.2</strong>.</li>
                 <li><span style={{color: '#facc15', fontWeight:'bold'}}>Warning:</span> It introduces an estimated 45ms latency for the Finance Application.</li>
              </ul>
           </div>
         );

      case 'executive_report':
         return (
           <div className="card-container" style={{borderColor: '#14b8a6', background: 'rgba(20, 184, 166, 0.05)'}}>
              <h4 style={{color:'#14b8a6', marginBottom:'12px', borderBottom:'1px solid rgba(20,184,166,0.2)', paddingBottom:'8px'}}>EXECUTIVE SUMMARY</h4>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', fontSize:'11px'}}>
                 <div style={{color:'#94a3b8'}}>Paths Discovered:</div>
                 <div style={{fontWeight:'bold', color:'white'}}>Critical Attack Paths</div>
                 <div style={{color:'#94a3b8'}}>PCS Resolution:</div>
                 <div style={{fontWeight:'bold', color:'#10b981'}}>Neutralized Safely</div>
                 <div style={{color:'#94a3b8'}}>Remediation:</div>
                 <div style={{fontWeight:'bold', color:'white'}}>Choke Points Secured</div>
                 <div style={{color:'#94a3b8'}}>Time Elapsed:</div>
                 <div style={{fontWeight:'bold', color:'white'}}>Autonomous / Sub-Minute</div>
              </div>
              <div style={{marginTop: '16px'}}>
                 <button className="btn-primary" style={{width:'100%'}} onClick={handleStartPhase2}>
                   Begin Phase 2: AI Agent Posture Validation
                 </button>
                 <button className="btn-primary" style={{marginTop:'8px', width:'100%', background: '#eab308'}} onClick={handleStartPhase3}>
                   Begin Phase 3: Advanced Command Center
                 </button>
                 <button className="btn-outline" style={{marginTop:'8px', width:'100%', borderColor: '#64748b', color: '#cbd5e1'}} onClick={handleAgentReset}>
                   ↻ Restart Agent Workflow // End Part 1
                 </button>
              </div>
           </div>
         );

      case 'phase2_review_prompt':
         return (
           <div className="card-container text-right">
             <button className="btn-primary" onClick={handlePhase2Simulate} disabled={chatPhase !== 'phase2_review'}>
               Authorize Security Review Simulation
             </button>
           </div>
         );

      case 'phase2_remediation_prompt':
         return (
           <div className="card-container">
              <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
                  <span style={{fontSize:'10px', background:'#fb923c', padding:'2px 6px', borderRadius:'4px', color:'white', fontWeight:'bold'}}>REMEDIATION AGENT</span>
              </div>
              <p style={{fontSize:'12px', marginBottom:'8px'}}>Simulation validated. The AI Agent is vulnerable. I have automatically drafted the exact architectural fix required to secure the egress perimeter.</p>
              <p style={{fontSize:'12px', marginBottom:'12px'}}>Rather than creating a manual ticket, I have automatically compiled this fix into code and sent it as a Pull Request (PR) directly to the Finance Dev Team&apos;s native GitHub repository to completely eliminate friction. Do you authorize this commit?</p>
              <button className="btn-primary" style={{width:'100%'}} onClick={handlePhase2Mitigate} disabled={chatPhase !== 'phase2_remediation'}>
                Authorize Dev Handoff & Secure
              </button>
           </div>
         );

      case 'phase2_revalidation_results':
         return (
           <div className="card-container">
              <h4 style={{color:'#10b981'}}>AI Supply Chain Secured</h4>
              <p style={{fontSize:'12px', marginTop:'12px'}}>⭐ PR successfully merged. Finance Dev Team notified organically. The PCS score neutralized completely.</p>
              {chatPhase === 'phase2_complete' && (
                 <button className="btn-primary" style={{marginTop:'12px', width:'100%', background: '#14b8a6'}} onClick={handleGenerateReport}>
                   Generate Executive Report
                 </button>
              )}
           </div>
         );

      // --- Phase 3 Cards ---
      case 'phase3_selection':
         return (
           <div className="card-container">
             <h4><span style={{color:'#facc15'}}>★</span> Multi-Path Prioritization</h4>
             <p style={{fontSize:'12px', marginTop:'8px'}}>
               Backend analysis ranked {phase3Analysis?.activePaths || 0} viable paths. Top path: <strong>{phase3Analysis?.topPath?.title || 'Calculating...'}</strong>.
             </p>
             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginTop:'12px', fontSize:'11px'}}>
               <div style={{color:'#94a3b8'}}>Top PCS</div>
               <div style={{fontWeight:'bold', color:'#ef4444'}}>{phase3Analysis?.pcsScore?.toFixed(1) || '-'}</div>
               <div style={{color:'#94a3b8'}}>Choke Point</div>
               <div style={{fontWeight:'bold'}}>{phase3Analysis?.chokePoints?.[0]?.label || '-'}</div>
               <div style={{color:'#94a3b8'}}>Owners</div>
               <div style={{fontWeight:'bold'}}>{phase3Analysis?.topPath?.owners?.join(', ') || '-'}</div>
             </div>
             <button className="btn-primary" style={{marginTop:'12px', width:'100%'}} onClick={handlePhase3Simulate} disabled={chatPhase !== 'phase3_selection'}>
               Simulate Prioritized Path & Blast Radius
             </button>
           </div>
         );

      case 'phase3_blast_radius':
         return (
           <div className="card-container" style={{borderColor: '#ef4444'}}>
              <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
                 <span style={{fontSize:'10px', background:'#a855f7', padding:'2px 6px', borderRadius:'4px', color:'white', fontWeight:'bold'}}>SIMULATION AGENT</span>
              </div>
              <h4 style={{color:'#ef4444'}}>Lateral Movement & Blast Radius</h4>
              <p style={{fontSize:'12px', marginTop:'8px'}}>
                Simulation traversed successfully ({phase3Simulation?.selectedPath?.techniques?.join(' -> ') || 'techniques calculated by backend'}).
              </p>
              <p style={{fontSize:'12px', marginTop:'8px', fontWeight:'bold', color:'#fca5a5'}}>
                If exploited, the attacker reaches {phase3Simulation?.blastRadius?.length || 0} directly modeled blast-radius asset(s): {(phase3Simulation?.blastRadius || []).map((asset) => asset.label).join(', ') || 'none'}.
              </p>
              <div style={{marginTop:'12px', fontSize:'11px', color:'#cbd5e1'}}>
                <strong>Evidence:</strong> {phase3Simulation?.selectedPath?.evidence?.[0] || 'Evidence chain loading...'}
              </div>
              <div style={{marginTop:'12px'}}>
                <h5 style={{color:'#94a3b8', fontSize:'10px', marginBottom:'8px'}}>PCS EXPLANATION</h5>
                {(phase3Simulation?.selectedPath?.pcsBreakdown || []).map((item) => (
                  <div key={item.label} style={{display:'grid', gridTemplateColumns:'1fr auto', gap:'8px', fontSize:'10px', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'5px 0'}}>
                    <span title={item.weight}>{item.label}</span>
                    <strong style={{color:item.label === 'Final PCS' ? '#ef4444' : '#cbd5e1'}}>{item.value}</strong>
                  </div>
                ))}
              </div>
              <div style={{marginTop:'12px'}}>
                 <h5 style={{color:'#94a3b8', fontSize:'10px', marginBottom:'8px'}}>MULTI-REMEDIATION TRADE-OFFS</h5>
                 {(phase3Simulation?.mitigationOptions || phase3Analysis?.mitigationOptions || []).map((option, index) => (
                   <div key={option.id} className="mitigation-card mt-2" style={{cursor:'pointer', borderColor: index === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}} onClick={() => chatPhase === 'phase3_remediation_options' && handlePhase3Mitigate(option)}>
                     <div style={{fontWeight:600, color:index === 0 ? '#10b981' : '#93c5fd', fontSize:'11px'}}>Option {index + 1}: {option.label}</div>
                     <div style={{fontSize:'10px', color:'#94a3b8', marginTop:'4px'}}>
                       Closes {option.pathsClosed} path(s). PCS -{option.scoreReduction.toFixed(1)}. Deploy: {option.deployTime}. Downtime: {option.downtime}.
                     </div>
                     <div style={{fontSize:'10px', color:'#cbd5e1', marginTop:'4px'}}>
                       Owner: {option.owner}. Approval: {option.approvalGate}.
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
                Mitigation holds. Residual active paths: {phase3Remediation?.activePaths ?? '-'}. Residual PCS: {phase3Remediation?.pcsScore?.toFixed(1) ?? '-'}.
                Would you like me to simulate what happens if the attacker attempts a bypass?
              </p>
              <div style={{fontSize:'11px', color:'#cbd5e1', marginTop:'8px'}}>
                Approval gate: {phase3Remediation?.mitigation?.approvalGate || '-'}<br/>
                Rollback: {phase3Remediation?.mitigation?.rollback || '-'}
              </div>
              <button className="btn-outline" style={{marginTop:'12px', width:'100%'}} onClick={handlePhase3PolicyPreview} disabled={!phase3Policy}>
                Show Policy Preview
              </button>
              <button className="btn-primary" style={{marginTop:'12px', width:'100%'}} onClick={handlePhase3Bypass} disabled={chatPhase !== 'phase3_bypass'}>
                Yes, simulate bypass
              </button>
           </div>
         );

      case 'phase3_complete':
         return (
           <div className="card-container">
              <h4 style={{color:'#10b981'}}>No Viable Bypass Found</h4>
              <p style={{fontSize:'12px', marginTop:'8px'}}>Secondary traversal blocked. Remediation holds. Total environment PCS stabilized at {phase3Remediation?.pcsScore?.toFixed(1) ?? 'the backend-computed residual score'}.</p>
              {whatIfAnswer && <p style={{fontSize:'11px', color:'#94a3b8', marginTop:'8px'}}>Latest what-if: {whatIfAnswer}</p>}
              <button className="btn-outline" style={{marginTop:'12px', width:'100%'}} onClick={handlePhase3Report} disabled={!phase3Report}>
                Generate Agent Iris Report
              </button>
              {chatPhase === 'phase3_complete' && (
                 <button className="btn-primary" style={{marginTop:'12px', width:'100%', background: '#14b8a6'}} onClick={handleGenerateReport}>
                   Generate Executive Report
                 </button>
              )}
           </div>
         );

      case 'phase3_policy_preview':
         return (
           <div className="card-container" style={{borderColor:'#38bdf8'}}>
              <h4 style={{color:'#38bdf8'}}>Policy-as-Code Preview</h4>
              <p style={{fontSize:'11px', marginTop:'8px', color:'#cbd5e1'}}>Type: {phase3Policy?.type || '-'}</p>
              <pre style={{background:'#0f172a', padding:'10px', borderRadius:'6px', marginTop:'10px', fontSize:'10px', color:'#e2e8f0', overflowX:'auto'}}>
                {phase3Policy?.content || 'Policy preview unavailable.'}
              </pre>
              <p style={{fontSize:'11px', color:'#94a3b8', marginTop:'8px'}}>Approval: {phase3Remediation?.mitigation?.approvalGate || '-'}</p>
           </div>
         );

      case 'phase3_report':
         return (
           <div className="card-container" style={{borderColor:'#14b8a6', background:'rgba(20,184,166,0.05)'}}>
              <h4 style={{color:'#14b8a6'}}>Agent Iris Report Package</h4>
              <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'8px', marginTop:'10px', fontSize:'11px'}}>
                <div><strong>Headline:</strong> {phase3Report?.headline || '-'}</div>
                <div><strong>Business impact:</strong> {phase3Report?.businessImpact || '-'}</div>
                <div><strong>Technical summary:</strong> {phase3Report?.technicalSummary || '-'}</div>
                <div><strong>Recommended action:</strong> {phase3Report?.recommendedAction || '-'}</div>
                <div><strong>Rollback:</strong> {phase3Report?.rollback || '-'}</div>
              </div>
           </div>
         );

      // ── TruConfirm: Validation In Progress ──
      case 'validation_in_progress': {
        const { targets: vTargets = [], pathId: vPathId, isRevalidation: vIsReval } = msg.data || {};
        return <ValidationProgressCard targets={vTargets} pathId={vPathId} isRevalidation={vIsReval} />;
      }

      // ── TruConfirm: Validation Results ──
      case 'validation_results': {
        const { results: vResults = [], execution_duration_ms, isRevalidation: rIsReval } = msg.data || {};
        const allValidated = vResults.every(r => r.status === 'EXPLOIT_VALIDATED');
        const allMitigated = vResults.every(r => r.status === 'EXPLOIT_MITIGATED');
        const borderCol = allMitigated ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)';
        const bgCol = allMitigated ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)';
        const headCol = allMitigated ? '#10b981' : '#ef4444';
        const dotStyle = { width: '6px', height: '6px', borderRadius: '50%', background: headCol, boxShadow: `0 0 5px ${headCol}`, display: 'inline-block', flexShrink: 0 };
        const headline = allMitigated
          ? `Mitigation Confirmed — ${vResults.length} / ${vResults.length} Nodes Blocked`
          : allValidated
          ? `Exploit Validated — ${vResults.length} / ${vResults.length} Nodes Confirmed`
          : 'Validation Inconclusive — Mixed Results';

        return (
          <div style={{ width: '100%', background: bgCol, border: `1px solid ${borderCol}`, borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={dotStyle} />
                <strong style={{ fontSize: '11px', fontWeight: 700, color: headCol, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{headline}</strong>
              </div>
              <span style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace' }}>{execution_duration_ms ? `${execution_duration_ms.toLocaleString()}ms` : ''}</span>
            </div>
            {vResults.map(r => {
              const node = advancedScenario.nodes.find(n => n.id === r.node_id);
              const isProven = r.status === 'EXPLOIT_VALIDATED';
              const isMitigated = r.status === 'EXPLOIT_MITIGATED';
              const isInconclusive = r.status === 'INCONCLUSIVE';
              const badgeBg = isProven ? 'rgba(239,68,68,0.15)' : isMitigated ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)';
              const badgeColor = isProven ? '#fca5a5' : isMitigated ? '#6ee7b7' : '#94a3b8';
              const badgeBorder = isProven ? 'rgba(239,68,68,0.3)' : isMitigated ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)';
              const badgeLabel = isProven ? 'Exploit Validated' : isMitigated ? 'Exploit Mitigated' : 'Inconclusive';
              const ev = r.evidence;
              return (
                <div key={r.node_id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'monospace', color: '#e2e8f0' }}>{r.node_id}</span>
                      <span style={{ fontSize: '9px', color: '#64748b', marginLeft: '6px' }}>{r.cve_id}</span>
                      {node?.data?.label && <span style={{ fontSize: '9px', color: '#475569', marginLeft: '6px' }}>— {node.data.label}</span>}
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{badgeLabel}</span>
                  </div>
                  {isProven && ev && (
                    <div>
                      <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                        {ev.method === 'OUT_OF_BAND_CALLBACK' ? 'Out-of-Band Callback (OAST)' : ev.method === 'CRYPTOGRAPHIC_HASH_MATCHING' ? 'Cryptographic Hash' : 'Pattern-Based Output'}
                      </div>
                      {ev.method === 'OUT_OF_BAND_CALLBACK' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '4px', fontSize: '9px', color: '#d8b4fe' }}>
                          📡 Blind callback confirmed · {ev.technical_details?.oast_domain || 'dns.oast.live'}
                        </span>
                      ) : ev.computed_hash ? (
                        <div style={{ background: '#040609', borderRadius: '5px', padding: '7px 9px', fontFamily: 'monospace', fontSize: '9px', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.12)', wordBreak: 'break-all' }}>
                          SHA-256: {ev.computed_hash}
                        </div>
                      ) : ev.extracted_output ? (
                        <div style={{ background: '#040609', borderRadius: '5px', padding: '7px 9px', fontFamily: 'monospace', fontSize: '9px', color: '#38bdf8', whiteSpace: 'pre-wrap', border: '1px solid rgba(56,189,248,0.12)' }}>
                          {ev.extracted_output}
                        </div>
                      ) : null}
                    </div>
                  )}
                  {(isMitigated || isInconclusive) && (
                    <div style={{ background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.15)', padding: '6px 8px', borderRadius: '5px', fontSize: '10px', color: '#64748b', fontStyle: 'italic', lineHeight: 1.4 }}>
                      {isMitigated
                        ? `Environmental defenses confirmed blocking node ${r.node_id}. Exploit payload was rejected — mitigation verified.`
                        : 'No definitive proof of exploitation or mitigation. Absence of proof ≠ absence of risk.'}
                    </div>
                  )}
                </div>
              );
            })}
            {rIsReval && allMitigated && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button className="btn-primary" style={{ flex: 1, fontSize: '11px', padding: '8px 0' }} onClick={handlePhase3PolicyPreview} disabled={!phase3Policy}>Show Policy Preview</button>
                <button className="btn-primary" style={{ flex: 1, fontSize: '11px', padding: '8px 0', background: '#14b8a6' }} onClick={() => {
                  setMessages(prev => [...prev, { sender: 'agent', type: 'phase3_bypass_prompt' }]);
                  setChatPhase('phase3_bypass');
                }}>Continue →</button>
              </div>
            )}
            {!rIsReval && !allMitigated && (
              <div style={{ marginTop: '12px' }}>
                <button className="btn-primary" style={{ width: '100%', fontSize: '11px', padding: '8px 0' }} onClick={() => {
                  const el = document.querySelector('.phase3-remediation-scroll');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }} disabled={chatPhase !== 'phase3_remediation_options'}>
                  View Ranked Mitigations ↓
                </button>
              </div>
            )}
          </div>
        );
      }

      default: return null;
    }
  };

  return (
    <div className="agent-chat-container" style={{ flex: 1, minHeight: 0 }}>
      <div className="chat-header">
        <div className="agent-avatar">🤖</div>
        <div style={{fontWeight:600}}>Agent Iris</div>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.sender}`}>
            {msg.sender === 'agent' && (
              <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                 {msg.identity && <div style={{fontSize:'9px', fontWeight:'bold', color: msg.color||'#3b82f6', marginLeft:'40px', textTransform:'uppercase'}}>{msg.identity}</div>}
                 <div style={{display:'flex', gap:'8px', alignItems:'flex-end'}}>
                   <div className="mini-avatar" style={{background: msg.color||'#3b82f6'}}>🤖</div>
                   <div className="message-content">{renderMessageContent(msg, i)}</div>
                 </div>
              </div>
            )}
            {msg.sender === 'user' && (
               <>
                 <div className="message-content">{renderMessageContent(msg, i)}</div>
                 <div className="mini-avatar user">👤</div>
               </>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="message-row agent">
            <div className="mini-avatar" style={{background: '#475569'}}>🤖</div>
            <TypingIndicator />
          </div>
        )}
        <div ref={endOfChatRef} style={{height:'10px'}} />
      </div>

      {chatPhase.startsWith('phase3') && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.95)', zIndex: 10 }}>
           <div 
             style={{ padding: '8px 16px', fontSize: '11px', color: '#94a3b8', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
             onClick={() => setShowAudit(!showAudit)}
           >
             <span style={{fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px'}}>Audit Trail &amp; Compliance Log</span>
             <span>{showAudit ? '▼' : '▲'}</span>
           </div>
           
           {showAudit && (
             <div style={{ padding: '0 16px 16px 16px', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {auditLogs.length === 0 ? <div style={{fontSize:'11px', color:'#64748b'}}>No actions logged yet.</div> : 
                 auditLogs.map((log, i) => (
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
      )}
    </div>
  );
}
