from .health import router as health_router
from .profiles import router as profiles_router
from .assets import router as assets_router
from .triage import router as triage_router
from .evidence import router as evidence_router
from .analysis import router as analysis_router
from .comparison import router as comparison_router
from .simulation import router as simulation_router
from .ai import router as ai_router

__all__ = [
    "health_router",
    "profiles_router",
    "assets_router",
    "triage_router",
    "evidence_router",
    "analysis_router",
    "comparison_router",
    "simulation_router",
    "ai_router",
]

