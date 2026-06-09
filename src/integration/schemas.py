from pydantic import BaseModel, Field
from enum import Enum
from typing import List, Optional, Dict, Any

class ValidationTarget(BaseModel):
    node_id: str = Field(..., description="Unique identifier of the target asset node.")
    ip_address: str = Field(..., description="Target network address to validate.")
    cve_id: str = Field(..., description="The specific CVE identifier to validate (e.g., CVE-2024-4577).")
    ingress_port: int = Field(..., description="The port context exposed to the preceding node in the path.")

class PathValidationRequest(BaseModel):
    path_id: str = Field(..., description="Unique tracking UUID for the overall attack path graph.")
    tenant_id: str = Field(..., description="Organization identifier.")
    targets: List[ValidationTarget] = Field(..., description="Ordered list of nodes selected for active validation.")
    callback_url: str = Field(..., description="The webhook URI where the validation engine will push the completed result.")

class ValidationStatus(str, Enum):
    EXPLOIT_VALIDATED = "EXPLOIT_VALIDATED"
    EXPLOIT_MITIGATED = "EXPLOIT_MITIGATED"
    INCONCLUSIVE = "INCONCLUSIVE"

class ValidationMethodUsed(str, Enum):
    PATTERN_MATCH = "PATTERN_BASED_OUTPUT"
    CRYPTO_HASH = "CRYPTOGRAPHIC_HASH_MATCHING"
    OAST_CALLBACK = "OUT_OF_BAND_CALLBACK"

class ProofEvidence(BaseModel):
    method: ValidationMethodUsed
    extracted_output: Optional[str] = Field(None, description="Regex captured value (e.g., uid=0(root)).")
    computed_hash: Optional[str] = Field(None, description="The validated cryptographic hash string confirming execution.")
    oast_callback_received: bool = Field(False, description="True if a blind vulnerability initiated an outbound callback.")
    technical_details: Dict[str, Any] = Field(default_factory=dict, description="Diagnostic payload information for compliance reporting.")

class NodeValidationResult(BaseModel):
    node_id: str
    cve_id: str
    status: ValidationStatus
    evidence: Optional[ProofEvidence] = None

class PathValidationCallback(BaseModel):
    path_id: str
    execution_duration_ms: int
    results: List[NodeValidationResult]
