from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field


Language = Literal["python", "javascript"]


class SubmissionRequest(BaseModel):
    problem_id: str = Field(..., min_length=1)
    language: Language
    source_code: str = Field(..., min_length=1)
    username: str = Field(default="anonymous", min_length=1, max_length=32)


class CaseResult(BaseModel):
    index: int
    status: str  # AC/WA/TLE/RE/CE
    time_ms: int
    stdout: str = ""
    stderr: str = ""
    input: Optional[str] = None
    expected: Optional[str] = None


class JudgeResult(BaseModel):
    status: str
    passed: int
    total: int
    time_ms: int
    cases: list[CaseResult]


class SubmissionResponse(BaseModel):
    submission_id: str
    username: str
    problem_id: str
    language: Language
    result: JudgeResult
    timestamp: float


class LeaderboardEntry(BaseModel):
    username: str
    solved_count: int
    total_submissions: int
    last_submission_time: Optional[float] = None


