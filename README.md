<div align="center">

# airules

**One config to rule them all.**

Generate & sync AI coding rules across Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, and Codex — from a single source of truth.

[![npm version](https://img.shields.io/npm/v/@tangvu/airules?color=%23007acc)](https://www.npmjs.com/package/@tangvu/airules)
[![CI](https://github.com/tang-vu/airules/actions/workflows/ci.yml/badge.svg)](https://github.com/tang-vu/airules/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@tangvu/airules)](https://www.npmjs.com/package/@tangvu/airules)

[Getting Started](#-getting-started) · [Configuration](#%EF%B8%8F-configuration) · [Supported Tools](#-supported-tools) · [Score Card](#-score-card)

</div>

---

## The Problem

You use Claude Code, Cursor, and GitHub Copilot. Each needs its own config file. You write `CLAUDE.md`, then copy-paste-adapt for `.cursorrules`, then again for `copilot-instructions.md`. They drift apart. You update one, forget the others. Your AI tools give inconsistent results.

## The Solution

```bash
npx airules init
```

One command. One config file (`.airules.yml`). All your AI tools get consistent, optimized rules — automatically.

## ✨ Features

- **🔍 Smart Detection** — Auto-detects your tech stack, framework, dependencies, and project patterns
- **⚡ Multi-Tool Sync** — Generates rules for 7 AI tools from a single `.airules.yml`
- **🏆 Score Card** — Grades your rules setup (S/A/B/C/D) with actionable suggestions
- **📦 Zero Config** — Works out of the box. Run `npx airules init` and you're done
- **🎯 Stack-Aware** — 30+ framework templates with stack-specific best practices
- **🔄 Stay in Sync** — `airules sync` keeps all files up to date when you change `.airules.yml`

## 🚀 Getting Started

```bash
# Scan your project and generate rules for all tools
npx airules init

# See what was detected
npx airules detect

# Check your rules quality
npx airules score

# Re-sync after editing .airules.yml
npx airules sync
```

Or install globally:

```bash
npm install -g @tangvu/airules
```

## 🛠️ Supported Tools

| Tool | Output File | Status |
|------|------------|--------|
| Claude Code | `CLAUDE.md` | ✅ |
| Cursor | `.cursorrules` | ✅ |
| GitHub Copilot | `.github/copilot-instructions.md` | ✅ |
| Windsurf | `.windsurfrules` | ✅ |
| Cline | `.clinerules` | ✅ |
| OpenAI Codex | `AGENTS.md` | ✅ |
| Aider | `.aider.conf.yml` | ✅ |

## ⚙️ Configuration

After running `airules init`, edit `.airules.yml` to customize:

```yaml
version: 1
project:
  name: "my-app"
  stack: "nextjs"

targets:
  - claude
  - cursor
  - copilot

rules:
  style:
    prefer_functional: true
    naming_convention: "camelCase"
  testing:
    framework: "vitest"
    min_coverage: 80
  git:
    commit_style: "conventional"

custom:
  - "Use server components by default"
  - "All database queries go through src/repositories/"
```

Then run `airules sync` to regenerate all files.

## 📚 Documentation

- [Getting Started](docs/getting-started.md)
- [Configuration Reference](docs/configuration.md)
- [Supported Tools](docs/supported-tools.md)
- [Contributing Guide](CONTRIBUTING.md)

## 🏆 Score Card

```bash
npx airules score
```

Get a visual grade of your AI rules setup with suggestions for improvement. Use `--json` for CI integration.

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Especially welcome:
- **New stack templates** — Add support for more frameworks
- **Generator improvements** — Better output for specific AI tools
- **Community templates** — Share your `.airules.yml` setups

## 📄 License

MIT © Tang Vu
