import os
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

from backend.routes import (
    ai_router,
    alerts_router,
    analysis_router,
    assets_router,
    comparison_router,
    evidence_router,
    health_router,
    profiles_router,
    remediations_router,
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

# CORS configuration: Allow local development and cloud deployments (Vercel, Render, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
app.include_router(assets_router, prefix="/api")
app.include_router(remediations_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(triage_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(comparison_router, prefix="/api")
app.include_router(simulation_router, prefix="/api")
app.include_router(ai_router, prefix="/api")


# SPA / Static frontend integration for monolithic Docker & Render deployment
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir) and os.path.isdir(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/", tags=["Frontend", "System"], summary="Root Endpoint / SPA Landing")
async def root():
    index_html = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_html):
        return FileResponse(index_html)
    return {
        "service": "VULTRA Personalised Vulnerability Decision Intelligence",
        "status": "online",
        "documentation": "/docs",
        "health": "/api/health",
        "profiles": "/api/profiles",
    }


@app.get("/{full_path:path}", tags=["Frontend"], summary="Serve SPA Frontend Routes")
async def serve_spa(full_path: str):
    if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
        raise HTTPException(status_code=404, detail="Not Found")
    file_path = os.path.join(frontend_dist, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    index_html = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_html):
        return FileResponse(index_html)
    raise HTTPException(status_code=404, detail="Not Found")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
