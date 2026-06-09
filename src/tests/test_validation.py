import os
import json
import unittest
from fastapi.testclient import TestClient

# Ensure python path has src directory
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.main import app
from src.core.graph_processor import STATE_FILE_PATH

class TestActiveValidation(unittest.TestCase):
    def setUp(self):
        # Remove any existing activeGraphState file before test
        if os.path.exists(STATE_FILE_PATH):
            try:
                os.remove(STATE_FILE_PATH)
            except OSError:
                pass
        self.client = TestClient(app)

    def tearDown(self):
        # Clean up activeGraphState file after test
        if os.path.exists(STATE_FILE_PATH):
            try:
                os.remove(STATE_FILE_PATH)
            except OSError:
                pass

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "healthy"})

    def test_validation_callback_exploit_validated(self):
        payload = {
            "path_id": "advanced-command-center",
            "execution_duration_ms": 1240,
            "results": [
                {
                    "node_id": "B",
                    "cve_id": "CVE-2023-50164",
                    "status": "EXPLOIT_VALIDATED",
                    "evidence": {
                        "method": "PATTERN_BASED_OUTPUT",
                        "extracted_output": "uid=0(root) gid=0(root) groups=0(root)",
                        "computed_hash": None,
                        "oast_callback_received": False,
                        "technical_details": {
                            "command_run": "whoami; id",
                            "shell": "/bin/sh"
                        }
                    }
                }
            ]
        }
        
        response = self.client.post("/webhooks/validation-callback", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "success", "processed_nodes": 1})

        # Verify activeGraphState.json is written
        self.assertTrue(os.path.exists(STATE_FILE_PATH))
        with open(STATE_FILE_PATH, "r") as f:
            state = json.load(f)
            
        self.assertIn("advanced-command-center", state)
        self.assertIn("B", state["advanced-command-center"])
        node_state = state["advanced-command-center"]["B"]
        self.assertEqual(node_state["state"], "PROVEN_ATTACK_VECTOR")
        self.assertEqual(node_state["evidence"]["extracted_output"], "uid=0(root) gid=0(root) groups=0(root)")

    def test_validation_callback_exploit_mitigated(self):
        payload = {
            "path_id": "advanced-command-center",
            "execution_duration_ms": 850,
            "results": [
                {
                    "node_id": "K",
                    "cve_id": "CVE-2024-XXXX",
                    "status": "EXPLOIT_MITIGATED",
                    "evidence": None
                }
            ]
        }
        
        response = self.client.post("/webhooks/validation-callback", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "success", "processed_nodes": 1})

        # Verify state file content
        with open(STATE_FILE_PATH, "r") as f:
            state = json.load(f)
            
        self.assertIn("advanced-command-center", state)
        self.assertIn("K", state["advanced-command-center"])
        node_state = state["advanced-command-center"]["K"]
        self.assertEqual(node_state["state"], "BLOCKED_PATH_JUNCTION")

if __name__ == "__main__":
    unittest.main()
