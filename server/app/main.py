"""FastAPI entry point."""

from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="Company Brain API",
    description="Backend API for Company Brain.",
    version="0.1.0",
    redoc_url=None,
)


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health() -> HealthResponse:
    """Confirm that the API process is responding."""
    return HealthResponse()
