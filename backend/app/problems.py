from __future__ import annotations

import json
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class TestCase:
    stdin: str
    expected_stdout: str


@dataclass(frozen=True)
class Problem:
    problem_id: str
    title: str
    statement: str
    time_limit_ms: int
    output_limit_bytes: int
    testcases: list[TestCase]

    def to_public_dict(self, include_testcases: bool = False) -> dict:
        d = {
            "id": self.problem_id,
            "title": self.title,
            "statement": self.statement,
            "time_limit_ms": self.time_limit_ms,
            "output_limit_bytes": self.output_limit_bytes,
        }
        if include_testcases:
            d["testcases"] = [{"stdin": tc.stdin, "expected_stdout": tc.expected_stdout} for tc in self.testcases]
        return d


class ProblemRepo:
    def __init__(self, problems_dir: str) -> None:
        self._dir = os.path.abspath(problems_dir)
        self._cache: dict[str, Problem] = {}

    def _load_problem_file(self, path: str) -> Problem:
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)

        pid = str(raw["id"])
        # Support both "input"/"expected_output" and "stdin"/"stdout" field names
        test_cases_raw = raw.get("test_cases", raw.get("testcases", []))
        tcs = []
        for tc in test_cases_raw:
            stdin = str(tc.get("input", tc.get("stdin", "")))
            expected = str(tc.get("expected_output", tc.get("stdout", tc.get("expected_stdout", ""))))
            tcs.append(TestCase(stdin=stdin, expected_stdout=expected))
        
        return Problem(
            problem_id=pid,
            title=str(raw["title"]),
            statement=str(raw.get("description", raw.get("statement", ""))),
            time_limit_ms=int(raw.get("time_limit_seconds", 1)) * 1000,
            output_limit_bytes=int(raw.get("output_limit_bytes", 65536)),
            testcases=tcs,
        )

    def list(self) -> list[Problem]:
        problems: list[Problem] = []
        if not os.path.isdir(self._dir):
            return problems

        for name in sorted(os.listdir(self._dir)):
            if not name.endswith(".json"):
                continue
            path = os.path.join(self._dir, name)
            try:
                p = self._load_problem_file(path)
                self._cache[p.problem_id] = p
                problems.append(p)
            except Exception:
                # MVP: ignore bad problem files
                continue
        return problems

    def get(self, problem_id: str) -> Problem:
        if problem_id in self._cache:
            return self._cache[problem_id]

        # try refresh cache
        for p in self.list():
            if p.problem_id == problem_id:
                return p
        raise KeyError(f"Problem not found: {problem_id}")


