from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.routes import (
    ai_router,
    analysis_router,
    comparison_router,
    evidence_router,
    health_router,
    profiles_router,
    simulation_router,
    triage_router,
)

app = FastAPI(
    title="VULTRA — Personalised Vulnerability Decision Intelligence API",
    description=(
        "Defensive, organisation-aware vulnerability triage API. "
        "Transforms public cyber threat signals into five defensible actions tailored to an "
        "organisation's technology stack, asset exposures, and service criticalities."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for local React / Vite frontend development
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """Ensure HTTP exceptions return structured ErrorResponse JSON."""
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail,
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP_ERROR",
            "message": str(exc.detail),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Ensure request validation errors return structured 422 JSON."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Invalid request parameters or payload structure.",
            "detail": exc.errors(),
        },
    )


# Register API Routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(profiles_router, prefix="/api")
app.include_router(triage_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(comparison_router, prefix="/api")
app.include_router(simulation_router, prefix="/api")
app.include_router(ai_router, prefix="/api")


@app.get("/", tags=["System"], summary="API Root")
def root():
    """Service metadata and quick links."""
    return {
        "service": "VULTRA Personalised Vulnerability Decision Intelligence",
        "status": "online",
        "documentation": "/docs",
        "health": "/api/health",
        "profiles": "/api/profiles",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
