from fastapi import APIRouter, Depends, HTTPException, status
from src.integration.schemas import PathValidationCallback, ValidationStatus
from src.core.graph_processor import AttackPathGraphProcessor

router = APIRouter(prefix="/webhooks", tags=["integrations"])

@router.post("/validation-callback", status_code=status.HTTP_200_OK)
async def handle_validation_callback(
    payload: PathValidationCallback,
    processor: AttackPathGraphProcessor = Depends()
):
    """
    Asynchronous receiver for validation results. Processes evidence 
    and drives structural state changes on the attack graph UI.
    """
    # 1. Retrieve current graph state
    graph = await processor.get_active_graph(payload.path_id)
    if not graph:
        raise HTTPException(status_code=404, detail="Target path graph tracking instance not found.")

    # 2. Iterate and transform graph edge visibility based on empirical validation context
    for node_result in payload.results:
        if node_result.status == ValidationStatus.EXPLOIT_VALIDATED:
            # Transition edge to a red, verified status
            await processor.promote_edge_state(
                path_id=payload.path_id,
                node_id=node_result.node_id,
                state="PROVEN_ATTACK_VECTOR",
                evidence=node_result.evidence.model_dump() if node_result.evidence else {}
            )
        elif node_result.status == ValidationStatus.EXPLOIT_MITIGATED:
            # Green, blocked indicator
            await processor.demote_edge_state(
                path_id=payload.path_id,
                node_id=node_result.node_id,
                state="BLOCKED_PATH_JUNCTION"
            )
        else:
            # Retain baseline visibility for unverified nodes
            await processor.maintain_edge_state(
                path_id=payload.path_id,
                node_id=node_result.node_id,
                state="UNVERIFIED"
            )

    return {"status": "success", "processed_nodes": len(payload.results)}
