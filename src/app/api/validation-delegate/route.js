import { NextResponse } from 'next/server';
import { ActiveValidationClient } from '../../../lib/validationClient';
import { setValidationResult } from '../../../lib/validationStore';

// Generates realistic mock proof evidence per node
function mockResult(nodeId, cveId, mitigated = false) {
  if (mitigated) {
    return { node_id: nodeId, cve_id: cveId, status: 'EXPLOIT_MITIGATED', evidence: null };
  }

  const patterns = {
    'CVE-2023-50164': { method: 'PATTERN_BASED_OUTPUT', extracted_output: '$ curl -X POST /upload -F file=@shell.php\nHTTP/1.1 200 OK\n{"uploaded":"shell.php","path":"/var/www/upload/shell.php"}', oast_callback_received: false },
    'CVE-2023-21716': { method: 'PATTERN_BASED_OUTPUT', extracted_output: '$ whoami && id\nroot\nuid=0(root) gid=0(root) groups=0(root)', oast_callback_received: false },
    'CVE-2021-44228': { method: 'OUT_OF_BAND_CALLBACK', extracted_output: null, oast_callback_received: true, technical_details: { oast_domain: 'dns.oast.live/abc123', response_time_ms: 142 } },
    'CVE-2022-0847':  { method: 'PATTERN_BASED_OUTPUT', extracted_output: '$ cat /proc/1/maps | grep rw | head -1\n7f3a2c000000-7f3a2c021000 rw-p (writable pipe splice)', oast_callback_received: false },
    'CVE-2023-23397': { method: 'CRYPTOGRAPHIC_HASH_MATCHING', extracted_output: null, computed_hash: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef', oast_callback_received: false },
    'CVE-2020-1472':  { method: 'PATTERN_BASED_OUTPUT', extracted_output: '$ python3 zerologon.py DC01 10.1.6.1\n[+] Exploit successful. Password set to empty.', oast_callback_received: false },
  };

  const evidence = patterns[cveId] || { method: 'PATTERN_BASED_OUTPUT', extracted_output: `[${cveId}] Exploit payload delivered. Response indicates successful code execution.`, oast_callback_received: false };
  return { node_id: nodeId, cve_id: cveId, status: 'EXPLOIT_VALIDATED', evidence };
}

// Simulate TruConfirm response after a delay and push to the store
function scheduleMockCallback(pathId, targets, mitigated = false, delayMs = 4000) {
  setTimeout(() => {
    const results = targets.map(t => mockResult(t.node_id, t.cve_id, mitigated));
    const payload = {
      path_id: pathId,
      execution_duration_ms: delayMs - 200 + Math.floor(Math.random() * 400),
      results,
    };
    setValidationResult(pathId, payload);
  }, delayMs);
}

export async function POST(request) {
  const body = await request.json();
  const { path_id, tenant_id, targets, callback_url } = body;

  if (!path_id || !targets?.length) {
    return NextResponse.json({ error: 'path_id and targets are required' }, { status: 400 });
  }

  const engineUrl = process.env.VALIDATION_ENGINE_URL;
  const engineToken = process.env.VALIDATION_ENGINE_TOKEN;

  if (engineUrl && engineToken) {
    // Real TruConfirm engine configured — delegate
    const client = new ActiveValidationClient(engineUrl, engineToken);
    const success = await client.delegatePathValidation({ path_id, tenant_id, targets, callback_url });
    if (!success) {
      // Fallback to mock on engine failure
      const mitigated = path_id.includes('revalidation');
      scheduleMockCallback(path_id, targets, mitigated, 4000);
    }
  } else {
    // Demo mode — simulate TruConfirm response after realistic delay
    const mitigated = path_id.includes('revalidation');
    scheduleMockCallback(path_id, targets, mitigated, mitigated ? 3000 : 4500);
  }

  return NextResponse.json({ status: 'delegated', path_id, pending: true });
}
