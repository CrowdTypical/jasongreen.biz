---
description: Git workflow, commits, versioning, CI/CD, and documentation standards
applyTo: "**/*.md,**/.github/**,**/CHANGELOG*,**/README*,**/.gitignore"
---

# Development Standards

Git workflow, commits, versioning, and documentation practices for all projects.

---

## Branching Strategy

### Current State: Committing to `main`

This is fine for now. **Transition to branching when any project hits 1.0 or "stable."**

### Target Strategy (When Ready)

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code, tagged releases |
| `develop` | Integration branch — your working branch |
| `feature/<desc>` | New features |
| `bugfix/<desc>` | Bug fixes |

**Flow:** `feature/add-dark-mode` → merge to `develop` → when stable, merge to `main` + tag

### Branch Naming

- `feature/add-dark-mode` — New functionality
- `bugfix/fix-crash-on-empty-list` — Bug fixes
- `hotfix/patch-auth-bypass` — Urgent production fix

### Transition Plan

When you're ready to start branching:

```bash
# Create develop branch from main
git checkout main
git checkout -b develop
# "checkout -b" creates a new branch from where you currently are (main)
# and switches to it immediately

git push -u origin develop
# "push -u origin develop" pushes the new branch to GitHub
# "-u" sets it as the upstream so future "git push" works without specifying the branch

# From now on, work on develop:
git checkout develop

# For a new feature:
git checkout -b feature/add-dark-mode
# Make changes, commit, then merge back:
git checkout develop
git merge feature/add-dark-mode
# "merge" combines the feature branch changes into develop

git branch -d feature/add-dark-mode
# "-d" deletes the feature branch locally (it's merged, so you don't need it anymore)
```

### Golden Rules (Once Branching)

1. **Never commit directly to `main`** — always go through `develop`
2. **Keep feature branches short-lived** — merge within days, not weeks
3. **One feature per branch** — don't mix unrelated changes
4. **Delete branches after merging** — keeps the repo clean

---

## Commit Messages — Conventional Commits

**Format:** `type(scope): description`

```
feat(auth): add biometric login support
fix(list): prevent crash when debt list is empty
docs(readme): update installation instructions
refactor(network): extract API client from service
style: apply dart format
chore(deps): update firebase_core to 2.25.0
```

### Types

| Type | Purpose | Example |
|------|---------|---------|
| `feat` | New feature | `feat(debt): add shared list editing` |
| `fix` | Bug fix | `fix(nav): resolve back navigation crash` |
| `docs` | Documentation | `docs: add API usage guide` |
| `style` | Formatting only | `style: apply prettier formatting` |
| `refactor` | Code restructure | `refactor(data): extract repository pattern` |
| `test` | Adding/updating tests | `test(auth): add login validation tests` |
| `build` | Build system | `build: update flutter SDK constraint` |
| `ci` | CI/CD changes | `ci: add lint check to workflow` |
| `chore` | Maintenance | `chore(deps): update dependencies` |

### Rules

- **Lowercase** — `feat`, not `Feat`
- **No period at the end**
- **Imperative mood** — "add feature" not "added feature"
- **50-char limit** for summary line — details go in the body
- **Reference issues** when applicable — `feat(auth): add login (#42)`

### Why This Matters

Good commit messages:
- Let you find when a bug was introduced
- Enable automatic changelog generation
- Make your GitHub profile look professional to employers
- Show engineering discipline

---

## Semantic Versioning (SemVer)

**Format:** `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

| Bump | Trigger | Example |
|------|---------|---------|
| **PATCH** | Bug fix | `1.2.3 → 1.2.4` |
| **MINOR** | New feature, backward-compatible | `1.2.3 → 1.3.0` |
| **MAJOR** | Breaking change | `1.2.3 → 2.0.0` |

### Pre-1.0 (Where Your Projects Are Now)

- `0.x.y` signals "still in development, API may change"
- MINOR bumps may include breaking changes during `0.x`
- `1.0.0` = first stable release

### Tagging a Release

```bash
git checkout main
git tag -a v0.5.0 -m "v0.5.0 - Shared list editing, improved UI"
# "tag -a" creates an annotated tag — a named bookmark on a specific commit
# "-m" adds a message describing what's in this release

git push origin --tags
# Pushes the tag to GitHub so it appears in your Releases page
```

---

## CHANGELOG

Every project should have a `CHANGELOG.md`:

```markdown
# Changelog

## [Unreleased]

### Added
- Feature currently being developed

## [0.5.0] - 2026-03-28

### Added
- Shared list editing between two users (#15)
- Push notification for list updates (#22)

### Fixed
- Crash when opening empty debt list (#18)

### Changed
- Minimum Android SDK raised to 26
```

### Categories

| Category | Version Bump |
|----------|--------------|
| **Added** | MINOR |
| **Changed** | MINOR or MAJOR |
| **Deprecated** | MINOR |
| **Removed** | MAJOR |
| **Fixed** | PATCH |
| **Security** | PATCH (urgent) |

---

## Pre-Commit Checks

**Before every commit, your code should pass basic quality checks.**

### Spread The Funds (Flutter)

```bash
# Start with these two (adopt now):
dart analyze
dart format --set-exit-if-changed .

# Add these later:
flutter test
flutter build apk --debug
```

### jasongreen.biz (Astro)

```bash
# Adopt now:
npx prettier --check .

# Add later:
npm run build
```

### What Each Check Does

| Check | Purpose |
|-------|---------|
| `dart analyze` | Catches bugs, enforces Dart best practices |
| `dart format` | Ensures consistent formatting |
| `prettier --check` | Checks web code formatting |
| `flutter test` | Runs unit tests |
| `npm run build` | Confirms the site builds successfully |

**Never commit code that fails analysis/linting.** Fix the issue first.

---

## CI/CD with GitHub Actions

You don't have CI/CD yet. When you're ready, here are starter workflows to drop in:

### Flutter CI (Spread The Funds)

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.x'
          channel: 'stable'
      - run: flutter pub get
      - run: dart analyze
      - run: dart format --set-exit-if-changed .
      - run: flutter test
      - run: flutter build apk --debug
```

### Astro CI (jasongreen.biz)

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prettier --check .
      - run: npm run build
```

---

## Documentation Requirements

### Every Project Must Have

| File | Purpose |
|------|---------|
| `README.md` | What it is, how to set up, how to run |
| `CHANGELOG.md` | What changed between versions |
| `PROGRESS.md` | Session-by-session development journal |
| `.gitignore` | Files to exclude from git |
| `LICENSE` | How others can use your code |

### PROGRESS.md — Your Development Journal

**This is critical for your goals.** It serves as:
- Context for the next AI session (paste the last entry to pick up where you left off)
- A development journal that shows your process to employers
- Proof of iterative, thoughtful engineering

**Format:**

```markdown
# Progress Log

## 2026-03-31 — Session Title

### Accomplished
- Implemented shared list editing
- Fixed crash on empty debt list

### Current State
- App builds and runs
- Shared editing works for 2 users
- Push notifications not yet connected

### Open Questions
- Should we use FCM or local notifications for MVP?

### Next Steps
1. Connect Firebase Cloud Messaging
2. Add notification preferences screen
3. Update README with new features
```

**At the end of every coding session, update PROGRESS.md.** Ask Copilot to help you summarize.

---

## Handling Unrelated Issues

When you spot a problem while working on something else:

| Complexity | Action |
|-----------|--------|
| Quick fix (< 5 min) | Fix in same commit, mention in commit message |
| Medium (5-15 min) | Fix in a separate commit on same branch |
| Complex (> 15 min) | Create a GitHub issue, fix later |
