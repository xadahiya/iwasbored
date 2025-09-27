#!/bin/bash
# Development startup script for IWasBored backend

set -e

echo "🚀 Starting IWasBored backend in development mode..."

# Check if poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry is not installed. Please install Poetry first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    echo "📦 Installing dependencies..."
    poetry install --no-root
fi

# Set environment variables
export ENVIRONMENT=dev
export PORT=8000
export HOST=0.0.0.0

# Start the application
echo "🌟 Starting FastAPI server..."
poetry run python run.py