from fastapi import APIRouter, HTTPException, Request

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token, verify_login
from app.schemas import AuthLoginRequest, AuthMeResponse, AuthTokenResponse, AuthUserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _bearer_token_from_request(request: Request) -> str:
    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        return ""
    return token.strip()


@router.post("/login", response_model=AuthTokenResponse)
def login(data: AuthLoginRequest):
    if not settings.AUTH_ENABLED:
        user = AuthUserResponse(username="local")
        return AuthTokenResponse(access_token=create_access_token(user.username), user=user)

    if not verify_login(data.username.strip(), data.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    username = settings.AUTH_USERNAME
    user = AuthUserResponse(username=username)
    return AuthTokenResponse(access_token=create_access_token(username), user=user)


@router.get("/me", response_model=AuthMeResponse)
def me(request: Request):
    if not settings.AUTH_ENABLED:
        return AuthMeResponse(authenticated=True, user=AuthUserResponse(username="local"))

    token = _bearer_token_from_request(request)
    username = decode_access_token(token) if token else None
    if not username:
        return AuthMeResponse(authenticated=False)

    return AuthMeResponse(authenticated=True, user=AuthUserResponse(username=username))

