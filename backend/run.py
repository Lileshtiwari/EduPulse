"""
EduPulse AI — Robust Backend Server Runner
Ensures permanent process uptime, excludes SQLite database files and OneDrive sync artifacts from triggering unwanted server reloads.
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=[str(backend_dir / "app")],
        reload_excludes=[
            "*.db*",
            "*.sqlite*",
            "*.wal*",
            "*.shm*",
            "*.tmp",
            "edupulse.db*",
            "*.log",
        ],
        access_log=False,
    )
