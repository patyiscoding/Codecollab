from __future__ import annotations

import time
import uuid
from dataclasses import dataclass

from .schemas import SubmissionRequest, SubmissionResponse, JudgeResult, LeaderboardEntry


@dataclass
class _Submission:
    submission_id: str
    created_at_ms: int
    username: str
    problem_id: str
    language: str
    result: JudgeResult


class InMemoryStore:
    """
    MVP store:
    - submissions kept in memory
    - leaderboard computed from AC counts (best-effort)
    """

    def __init__(self) -> None:
        self._subs: list[_Submission] = []

    def add_submission(self, req: SubmissionRequest, result: JudgeResult) -> SubmissionResponse:
        sid = uuid.uuid4().hex
        timestamp = time.time()
        sub = _Submission(
            submission_id=sid,
            created_at_ms=int(timestamp * 1000),
            username=req.username,
            problem_id=req.problem_id,
            language=req.language,
            result=result,
        )
        self._subs.append(sub)
        return SubmissionResponse(
            submission_id=sid,
            username=req.username,
            problem_id=req.problem_id,
            language=req.language,
            result=result,
            timestamp=timestamp,
        )

    def leaderboard(self) -> list[LeaderboardEntry]:
        scores: dict[str, int] = {}
        latest: dict[str, float] = {}
        total_subs: dict[str, int] = {}
        
        for s in self._subs:
            total_subs[s.username] = total_subs.get(s.username, 0) + 1
            if s.result.status == "AC":
                scores[s.username] = scores.get(s.username, 0) + 1
            latest[s.username] = max(latest.get(s.username, 0.0), s.created_at_ms / 1000.0)

        entries = [
            LeaderboardEntry(
                username=u,
                solved_count=scores.get(u, 0),
                total_submissions=total_subs[u],
                last_submission_time=latest.get(u),
            )
            for u in total_subs.keys()
        ]
        entries.sort(key=lambda e: (-e.solved_count, -e.total_submissions, e.username))
        return entries

    def get_user_submissions(self, username: str) -> list[SubmissionResponse]:
        """Get all submissions by a user, ordered by newest first."""
        user_subs = [
            SubmissionResponse(
                submission_id=s.submission_id,
                username=s.username,
                problem_id=s.problem_id,
                language=s.language,
                result=s.result,
                timestamp=s.created_at_ms / 1000.0,
            )
            for s in self._subs
            if s.username == username
        ]
        user_subs.sort(key=lambda x: -x.timestamp)
        return user_subs


