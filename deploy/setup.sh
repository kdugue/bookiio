#!/bin/bash
set -e

echo "=== Bookio VM Setup ==="

# Install git and Node.js 22
echo "Installing system dependencies..."
sudo apt-get update -y
sudo apt-get install -y git

if ! command -v node &> /dev/null || [[ $(node -v) != v22* ]]; then
  echo "Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "Node: $(node -v)"

# Clone or pull repo
REPO_DIR="$HOME/bookio"
if [ -d "$REPO_DIR" ]; then
  echo "Updating repo..."
  cd "$REPO_DIR" && git pull
else
  echo "Cloning repo..."
  git clone https://github.com/kdugue/bookiio.git "$REPO_DIR"
  cd "$REPO_DIR"
fi

# Install dependencies
echo "Installing dependencies..."
cd "$REPO_DIR/server" && npm install --production
cd "$REPO_DIR/client" && npm install && npm run build

# Prompt for API key if .env doesn't exist
if [ ! -f "$REPO_DIR/server/.env" ]; then
  echo ""
  read -p "Enter your GEMINI_API_KEY: " API_KEY
  cat > "$REPO_DIR/server/.env" << EOF
GEMINI_API_KEY=$API_KEY
PORT=80
CHROMA_HOST=localhost
CHROMA_PORT=8000
EOF
  echo "Created server/.env"
fi

# Start ChromaDB
echo "Starting ChromaDB..."
cd "$REPO_DIR/server"
npx chroma run --path ./chroma-data &
sleep 3

# Ingest the seed book if needed
echo "Starting Bookio on port 80..."
sudo -E $(which node) index.js
