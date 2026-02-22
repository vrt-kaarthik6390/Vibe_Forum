import sys
import os
from pathlib import Path

# Ensure the backend directory is in the path
# Path(__file__).parent is 'api'
# Path(__file__).parent.parent is 'backend'
# Path(__file__).parent.parent.parent is root (if vercel.json is at root)
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Also add the root directory just in case
root_dir = str(Path(__file__).resolve().parent.parent.parent)
if root_dir not in sys.path:
    sys.path.append(root_dir)

try:
    from main import app
except ImportError:
    # Fallback for different Vercel structure
    from backend.main import app

# Vercel serverless entry point
