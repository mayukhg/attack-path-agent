from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.webhooks import router as webhooks_router

app = FastAPI(title="Sentinel Active Validation Webhook Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhooks_router)

@app.get("/health")
def health_check():
    return {"status": "healthy"}
