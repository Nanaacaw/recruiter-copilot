from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.job_descriptions import router as jd_router
from app.api.v1.candidates import router as candidates_router
from app.api.v1.screening import router as screening_router
from app.api.v1.export import router as export_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(jd_router)
api_router.include_router(candidates_router)
api_router.include_router(screening_router)
api_router.include_router(export_router)
