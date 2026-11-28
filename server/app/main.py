"""FastAPI entry point."""

from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.database import DatabaseUnavailable, check_database

app = FastAPI(
    title="Company Brain API",
    description="Backend API for Company Brain.",
    version="0.1.0",
    redoc_url=None,
)


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


class DatabaseHealthResponse(HealthResponse):
    database: Literal["ok"] = "ok"


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health() -> HealthResponse:
    """Confirm that the API process is responding."""
    return HealthResponse()


@app.get(
    "/health/db",
    response_model=DatabaseHealthResponse,
    responses={503: {"description": "Database unavailable"}},
    tags=["Health"],
)
def database_health() -> DatabaseHealthResponse:
    """Query MariaDB using the application account; return 503 on failure."""
    try:
        check_database()
    except DatabaseUnavailable:
        # Keep connection details and credentials out of the HTTP response.
        raise HTTPException(status_code=503, detail="Database unavailable") from None
    return DatabaseHealthResponse()
