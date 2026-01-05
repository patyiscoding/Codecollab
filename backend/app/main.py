from __future__ import annotations

import os
from datetime import timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .store import InMemoryStore
from .problems import ProblemRepo
from .schemas import SubmissionRequest, SubmissionResponse, LeaderboardEntry
from .judge import judge_submission
from .auth import (
    UserStore, UserCreate, UserLogin, Token, UserPublic,
    create_access_token, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
)


def _env(name: str, default: str) -> str:
    v = os.getenv(name)
    return v if v else default


PROBLEMS_DIR = _env("CODECOLLAB_PROBLEMS_DIR", os.path.join(os.path.dirname(__file__), "..", "problems"))

app = FastAPI(title="CodeCollab MVP API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = InMemoryStore()
repo = ProblemRepo(PROBLEMS_DIR)
user_store = UserStore()
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[UserPublic]:
    """Get current authenticated user from token"""
    if credentials is None:
        return None
    
    token_data = decode_access_token(credentials.credentials)
    if token_data is None or token_data.username is None:
        return None
    
    user = user_store.get_user_by_username(token_data.username)
    if user is None:
        return None
    
    return UserPublic(
        id=user.id,
        username=user.username,
        created_at=user.created_at
    )


def require_auth(current_user: Optional[UserPublic] = Depends(get_current_user)) -> UserPublic:
    """Require authentication for endpoint"""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user


@app.get("/health")
def health() -> dict:
    return {"ok": True}


# Authentication endpoints
@app.post("/auth/register", response_model=Token)
def register(user_data: UserCreate) -> Token:
    """Register a new user"""
    # Basic validation
    if not user_data.username or len(user_data.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if not user_data.password or len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    try:
        user = user_store.create_user(user_data.username, user_data.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Generate token
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=access_token)


@app.post("/auth/login", response_model=Token)
def login(credentials: UserLogin) -> Token:
    """Login with username and password"""
    user = user_store.authenticate_user(credentials.username, credentials.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    # Generate token
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=access_token)


@app.get("/auth/me", response_model=UserPublic)
def get_me(current_user: UserPublic = Depends(require_auth)) -> UserPublic:
    """Get current user info"""
    return current_user


@app.get("/problems")
def list_problems() -> list[dict]:
    return [p.to_public_dict() for p in repo.list()]


@app.get("/problems/{problem_id}")
def get_problem(problem_id: str) -> dict:
    try:
        p = repo.get(problem_id)
        return p.to_public_dict(include_testcases=True)
    except KeyError:
        raise HTTPException(status_code=404, detail="problem_not_found")


@app.post("/submissions", response_model=SubmissionResponse)
def create_submission(
    req: SubmissionRequest,
    current_user: UserPublic = Depends(require_auth)
) -> SubmissionResponse:
    """Submit code for judging (requires authentication)"""
    # Override username with authenticated user
    req.username = current_user.username
    
    try:
        p = repo.get(req.problem_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="problem_not_found")
    result = judge_submission(
        language=req.language,
        source_code=req.source_code,
        testcases=p.testcases,
        time_limit_ms=p.time_limit_ms,
        output_limit_bytes=p.output_limit_bytes,
    )
    submission = store.add_submission(req, result)
    return submission


@app.get("/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard() -> list[LeaderboardEntry]:
    return store.leaderboard()


@app.get("/users/{username}/submissions", response_model=list[SubmissionResponse])
def get_user_submissions(username: str) -> list[SubmissionResponse]:
    return store.get_user_submissions(username)


