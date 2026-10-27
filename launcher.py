import os
import sys
import time
import subprocess
import webbrowser
import signal

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    print("=" * 60)
    print("      CIVICHELP -- UNIFIED 1-CLICK LAUNCHER")
    print("=" * 60)
    print(f"Project root: {root_dir}\n")

    # 1. Start Backend
    print("[1/3] Starting Backend (FastAPI on http://127.0.0.1:8000)...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=backend_dir
    )

    # 2. Start Frontend
    print("[2/3] Starting Frontend (Vite on http://localhost:5173)...")
    frontend_proc = subprocess.Popen(
        ["npm.cmd" if sys.platform == "win32" else "npm", "run", "dev"],
        cwd=frontend_dir
    )

    # 3. Wait and open browser
    print("[3/3] Waiting for servers to initialize...")
    time.sleep(3)

    target_url = "http://localhost:5173"
    print(f"\nOpening {target_url} in your default browser...")
    webbrowser.open(target_url)

    print("\n" + "=" * 60)
    print("CivicHelp is LIVE!")
    print("  - Public Citizen Hub:  http://localhost:5173/public")
    print("  - Emergency 112 Hub:   http://localhost:5173/emergency")
    print("  - Civic Intelligence:  http://localhost:5173/public/intelligence")
    print("  - Government Portal:   http://localhost:5173/government/login")
    print("  - Operations Console:  http://localhost:5173/app")
    print("  - Backend API:         http://127.0.0.1:8000/api")
    print("  - OpenAPI Docs:        http://127.0.0.1:8000/docs")
    print("=" * 60)
    print("\nPress Ctrl+C at any time to terminate all services.\n")

    def signal_handler(sig, frame):
        print("\nShutting down CivicHelp services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        try:
            backend_proc.wait(timeout=3)
            frontend_proc.wait(timeout=3)
        except Exception:
            backend_proc.kill()
            frontend_proc.kill()
        print("All servers stopped successfully.")
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
