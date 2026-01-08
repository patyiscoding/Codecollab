## Directory

- `backend/`: FastAPI backend (problem list, submission grading, multiple test cases, memory leaderboard, submission history)
- `frontend/`: Vite + TypeScript frontend (problem selection, code editing, submission, detailed results & leaderboard display, submission history viewing)

## Features

### Backend (Python/FastAPI)
- Problem management 
- Multi-test case grading (AC/WA/TLE/RE/CE, 33 test cases)
- Compilation/syntax pre-checking (Python `py_compile` / JavaScript `node --check`)
- Output size limit (prevents malicious output/infinite loop printing)
- User authentication system (JWT token, registration/login/authentication)
- Memory leaderboard (sorted by number of ACs)
- Submission history query (complete submission records for each user)
- CORS support (allows cross-domain frontend access)

### Frontend (Vite + TypeScript)
- Problem list and detail display
- **Monaco Editor code editor**
  - Syntax highlighting (Python + JavaScript)
  - Code completion (intelligent sensing)
  - Bracket matching and color display
  - Line numbers, code mini-map, code folding
- User authentication interface (login/registration pop-up, token management)
- One-click template loading (supports Python/JavaScript, includes 7 problems)
- Submit code and display results in real-time
- **Detailed test case display** (input/output/expected results for each case)
- Real-time leaderboard refresh
- **Submission history viewing**
- **Modern UI design**
  - Gradient themes and animation effects
  - Card hover effects, button ripple animations
  - Input field focus glow
  - Status badges (success/error/warning/info)
- TypeScript type safety (complete type definitions)

## Local Setup

### Backend

```bash
cd codecollab/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

To run as a Docker container:
```bash
docker build --tag 'backend' .
docker run -p 8080:8080 backend
```

### Frontend

```bash
cd codecollab/frontend
npm install
npm run dev     # Development mode (http://localhost:3000)
# Or
npm run build   # Build to dist/
npm run preview # Preview build results
```

The default API Base is `http://localhost:8000` (can be modified in the page).
