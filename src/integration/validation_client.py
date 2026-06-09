import httpx
import logging
from src.integration.schemas import PathValidationRequest

logger = logging.getLogger(__name__)

class ActiveValidationClient:
    def __init__(self, endpoint_url: str, auth_token: str):
        self.endpoint_url = endpoint_url
        self.headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

    async def delegate_path_validation(self, request_payload: PathValidationRequest) -> bool:
        """
        Pushes the designated path components to the validation framework.
        The Attack Path Agent does not execute testing directly.
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.endpoint_url}/v1/validations/submit",
                    json=request_payload.model_dump(),
                    headers=self.headers,
                    timeout=15.0
                )
                if response.status_code == 202:
                    logger.info(f"Path validation context {request_payload.path_id} successfully delegated.")
                    return True
                logger.error(f"Validation engine rejected handoff: {response.text}")
                return False
            except Exception as e:
                logger.error(f"Failed to hand off validation tracking path: {str(e)}")
                return False
