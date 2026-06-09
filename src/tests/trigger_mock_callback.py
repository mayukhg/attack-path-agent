import httpx
import json

webhook_url = "http://localhost:8000/webhooks/validation-callback"

payload = {
    "path_id": "advanced-command-center",
    "execution_duration_ms": 1500,
    "results": [
        {
            "node_id": "B",
            "cve_id": "CVE-2023-50164",
            "status": "EXPLOIT_VALIDATED",
            "evidence": {
                "method": "PATTERN_BASED_OUTPUT",
                "extracted_output": "uid=0(root) gid=0(root) groups=0(root) context=system_u:system_r:container_t:s0:c12,c34",
                "computed_hash": None,
                "oast_callback_received": False,
                "technical_details": {
                    "command_run": "whoami; id",
                    "path": "/usr/local/bin/shadow-service",
                    "cve": "CVE-2023-50164"
                }
            }
        },
        {
            "node_id": "K",
            "cve_id": "CVE-2024-XXXX",
            "status": "EXPLOIT_MITIGATED",
            "evidence": None
        }
    ]
}

try:
    print(f"Sending mock validation callback to {webhook_url}...")
    response = httpx.post(webhook_url, json=payload, timeout=10.0)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Failed to connect: {e}")
