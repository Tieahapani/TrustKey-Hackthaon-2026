# 1. Git & GitHub Setup

## Prerequisites
- Install Git: https://git-scm.com/downloads
- Create a GitHub account if you don't have one

## Clone the Repository

```bash
git clone https://github.com/Tieahapani/Hackthaon-Project-2026.git
cd Hackthaon-Project-2026
```

## Branching Strategy (for teamwork)

We use a simple branching model so we don't step on each other's code:

```
main              ← production-ready code (don't push directly here)
  └── dev         ← integration branch (merge your features here)
       ├── feature/listings-ui      ← Person A
       ├── feature/backend-api      ← Person B
       ├── feature/auth-dashboard   ← Person C
       └── feature/ai-chatbot       ← Person D
```

### Create your feature branch

```bash
# Make sure you're on the latest dev branch
git checkout dev
git pull origin dev

# Create your feature branch
git checkout -b feature/your-feature-name

# Example:
git checkout -b feature/listings-ui
```

### Push your work

```bash
git add .
git commit -m "describe what you did"
git push origin feature/your-feature-name
```

### Merge into dev

1. Go to GitHub
2. Click "Pull requests" > "New pull request"
3. Set base = `dev`, compare = `feature/your-feature-name`
4. Create the PR
5. Ask a teammate to review (or merge yourself if it's the hackathon and time is tight)

### Pull latest changes

```bash
git checkout dev
git pull origin dev
git checkout feature/your-feature-name
git merge dev
```

## Common Git Commands

| Command | What it does |
|---------|-------------|
| `git status` | See what files changed |
| `git add .` | Stage all changes |
| `git commit -m "message"` | Save your changes |
| `git push` | Upload to GitHub |
| `git pull` | Download latest from GitHub |
| `git log --oneline -10` | See last 10 commits |
| `git stash` | Temporarily save uncommitted changes |
| `git stash pop` | Bring back stashed changes |

## Troubleshooting

**"Permission denied" when pushing:**
- Make sure you're added as a collaborator on the repo
- Settings > Collaborators > Add your GitHub username

**Merge conflicts:**
1. Open the conflicting file
2. Look for `<<<<<<< HEAD` markers
3. Choose which code to keep, delete the markers
4. `git add .` then `git commit`
