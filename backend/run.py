#!/usr/bin/env python3
"""
Simple script to run the Flask application
"""
import os
import sys

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Change to the script directory to ensure relative imports work
os.chdir(script_dir)

# Add the script directory to Python path for imports
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

# Now import app - this should work from the backend directory
try:
    from app import app
except ImportError as e:
    print(f"Error importing app: {e}")
    print(f"Current directory: {os.getcwd()}")
    print(f"Script directory: {script_dir}")
    print(f"Python path: {sys.path}")
    sys.exit(1)

if __name__ == '__main__':
    print("Starting Online Medication Backend API...")
    print("API will be available at http://localhost:5000")
    print("Press Ctrl+C to stop the server")
    print(f"Working directory: {os.getcwd()}")
    app.run(debug=True, host='0.0.0.0', port=5000)

