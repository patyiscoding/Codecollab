from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import time
from typing import Iterable

from .problems import TestCase
from .schemas import CaseResult, JudgeResult


def _truncate_bytes(s: str, limit: int) -> str:
    b = s.encode("utf-8", errors="replace")
    if len(b) <= limit:
        return s
    return b[:limit].decode("utf-8", errors="replace")


def _normalize_out(s: str) -> str:
    # OJ-style: ignore trailing spaces and final newline differences
    return "\n".join([line.rstrip() for line in s.replace("\r\n", "\n").replace("\r", "\n").split("\n")]).strip()

def _python_cmd() -> list[str]:
    # Prefer python3 when available (common on developer machines), fallback to python (in python:3.x images).
    return ["python3"] if shutil.which("python3") else ["python"]


def _precheck(
    *,
    language: str,
    cwd: str,
    output_limit_bytes: int,
    timeout_s: float,
) -> tuple[bool, str]:
    """
    Returns (ok, stderr) for a fast "compile/syntax" check.
    """
    env = {
        "PATH": os.environ.get("PATH", ""),
        "LANG": "C",
        "LC_ALL": "C",
        "PYTHONNOUSERSITE": "1",
    }
    try:
        if language == "python":
            cmd = _python_cmd() + ["-I", "-m", "py_compile", "main.py"]
        elif language == "javascript":
            cmd = ["node", "--check", "main.js"]
        else:
            return False, "unsupported language"

        p = subprocess.run(
            cmd,
            text=True,
            capture_output=True,
            timeout=max(0.05, timeout_s),
            cwd=cwd,
            env=env,
        )
        stderr = _truncate_bytes(p.stderr or "", output_limit_bytes)
        return (p.returncode == 0), stderr
    except Exception as e:
        return False, _truncate_bytes(str(e), output_limit_bytes)


def _run_one(
    *,
    cmd: list[str],
    stdin_text: str,
    timeout_s: float,
    output_limit_bytes: int,
    cwd: str,
) -> tuple[str, str, int, str]:
    """
    Returns (stdout, stderr, time_ms, status) where status is OK/TLE/RE.
    """
    start = time.monotonic()
    try:
        # Keep the environment minimal but workable (PATH is required to locate python/node).
        # This is NOT a secure sandbox; it's a minimal MVP runner for demo flow.
        env = {
            "PATH": os.environ.get("PATH", ""),
            "LANG": "C",
            "LC_ALL": "C",
            "PYTHONNOUSERSITE": "1",
        }
        p = subprocess.run(
            cmd,
            input=stdin_text,
            text=True,
            capture_output=True,
            timeout=timeout_s,
            cwd=cwd,
            env=env,
        )
        elapsed_ms = int((time.monotonic() - start) * 1000)
        out = _truncate_bytes(p.stdout or "", output_limit_bytes)
        err = _truncate_bytes(p.stderr or "", output_limit_bytes)
        if p.returncode != 0:
            return out, err, elapsed_ms, "RE"
        return out, err, elapsed_ms, "OK"
    except subprocess.TimeoutExpired as e:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        out = _truncate_bytes((e.stdout or "") if isinstance(e.stdout, str) else "", output_limit_bytes)
        err = _truncate_bytes((e.stderr or "") if isinstance(e.stderr, str) else "", output_limit_bytes)
        return out, err, elapsed_ms, "TLE"


def judge_submission(
    *,
    language: str,
    source_code: str,
    testcases: Iterable[TestCase],
    time_limit_ms: int,
    output_limit_bytes: int,
) -> JudgeResult:
    timeout_s = max(0.05, time_limit_ms / 1000.0)

    testcases_list = list(testcases)

    with tempfile.TemporaryDirectory(prefix="codecollab-run-") as td:
        if language == "python":
            path = os.path.join(td, "main.py")
            with open(path, "w", encoding="utf-8") as f:
                f.write(source_code)
            run_cmd = _python_cmd() + ["-I", "main.py"]
        elif language == "javascript":
            path = os.path.join(td, "main.js")
            with open(path, "w", encoding="utf-8") as f:
                f.write(source_code)
            run_cmd = ["node", "main.js"]
        else:
            return JudgeResult(status="CE", passed=0, total=0, time_ms=0, cases=[])

        ok, pre_err = _precheck(language=language, cwd=td, output_limit_bytes=output_limit_bytes, timeout_s=timeout_s)
        if not ok:
            return JudgeResult(
                status="CE",
                passed=0,
                total=len(testcases_list),
                time_ms=0,
                cases=[
                    CaseResult(
                        index=0,
                        status="CE",
                        time_ms=0,
                        stdout="",
                        stderr=pre_err,
                        expected=testcases_list[0].expected_stdout if testcases_list else None,
                    )
                ],
            )

        cases: list[CaseResult] = []
        passed = 0
        total_time = 0

        for idx, tc in enumerate(testcases_list):
            out, err, t_ms, run_status = _run_one(
                cmd=run_cmd,
                stdin_text=tc.stdin,
                timeout_s=timeout_s,
                output_limit_bytes=output_limit_bytes,
                cwd=td,
            )
            total_time += t_ms

            if run_status == "TLE":
                cases.append(CaseResult(index=idx, status="TLE", time_ms=t_ms, stdout=out, stderr=err, input=tc.stdin, expected=tc.expected_stdout))
                continue
            if run_status == "RE":
                cases.append(CaseResult(index=idx, status="RE", time_ms=t_ms, stdout=out, stderr=err, input=tc.stdin, expected=tc.expected_stdout))
                continue

            ok = _normalize_out(out) == _normalize_out(tc.expected_stdout)
            if ok:
                passed += 1
                cases.append(CaseResult(index=idx, status="AC", time_ms=t_ms, stdout=out, stderr=err, input=tc.stdin))
            else:
                cases.append(CaseResult(index=idx, status="WA", time_ms=t_ms, stdout=out, stderr=err, input=tc.stdin, expected=tc.expected_stdout))

        # Overall status priority: CE (if any) > TLE > RE > AC/WA
        if any(c.status == "TLE" for c in cases):
            status = "TLE"
        elif any(c.status == "RE" for c in cases):
            status = "RE"
        else:
            status = "AC" if passed == len(testcases_list) and len(testcases_list) > 0 else "WA"
        total = len(cases)
        if total == 0:
            status = "CE"
        return JudgeResult(status=status, passed=passed, total=total, time_ms=total_time, cases=cases)


