# 2. Node.js & npm Setup

## Install Node.js

We need **Node.js 18 or higher**.

### macOS
```bash
# Option 1: Using Homebrew (recommended)
brew install node

# Option 2: Download from website
# Go to https://nodejs.org and download the LTS version
```

### Windows
1. Go to https://nodejs.org
2. Download the **LTS** version (the green button)
3. Run the installer, click Next through everything
4. Restart your terminal after installing

### Linux
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Verify Installation

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

## Install Project Dependencies

After cloning the repo, you need to install packages for both frontend and backend:

```bash
# From the project root
cd Hackthaon-Project-2026

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

This will create `node_modules/` folders in both directories. These are NOT committed to Git (they're in `.gitignore`).

## Useful npm Commands

| Command | Where to run | What it does |
|---------|-------------|-------------|
| `npm install` | frontend/ or backend/ | Install all packages |
| `npm run dev` | frontend/ | Start React dev server (port 5173) |
| `npm run dev` | backend/ | Start Express server with auto-reload (port 5000) |
| `npm run build` | frontend/ | Build for production |
| `npm start` | backend/ | Start Express server (production mode) |

## Troubleshooting

**"npm: command not found":**
- Node.js wasn't installed properly. Reinstall from nodejs.org

**"EACCES permission denied":**
```bash
# Fix npm permissions on Mac/Linux
sudo chown -R $(whoami) ~/.npm
```

**Packages not installing (network issues):**
```bash
# Clear npm cache and retry
npm cache clean --force
npm install
```

**Port already in use:**
```bash
# Find what's using port 5000
lsof -i :5000
# Kill it
kill -9 <PID>
```
