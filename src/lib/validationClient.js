export class ActiveValidationClient {
  constructor(endpointUrl, authToken) {
    this.endpointUrl = endpointUrl;
    this.headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };
  }

  async delegatePathValidation(requestPayload) {
    try {
      const response = await fetch(`${this.endpointUrl}/v1/validations/submit`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(15000),
      });
      if (response.status === 202) return true;
      console.error('Validation engine rejected handoff:', await response.text());
      return false;
    } catch (err) {
      console.error('Failed to delegate path validation:', err.message);
      return false;
    }
  }
}
