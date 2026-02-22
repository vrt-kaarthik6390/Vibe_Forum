import sys
import os
from pathlib import Path

# Add the parent directory to sys.path so we can import main
sys.path.append(str(Path(__file__).parent.parent))

from main import app

# Vercel serverless entry point
