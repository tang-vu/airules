# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-08

### Added
- **ASCII banner** displayed on first run
- **Update notifier** — checks npm registry for new versions
- **SECURITY.md** with vulnerability reporting process
- **Full docs** — getting-started.md, configuration.md, supported-tools.md
- `--dry-run`, `--force`, `--target` flags fully wired and tested
- Support for both `.airules.yml` and `.airules.yaml`

[Unreleased]: https://github.com/tang-vu/airules/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/tang-vu/airules/releases/tag/v1.0.0

## [0.4.0] - 2026-04-08

### Added
- **Score Card** — `airules score` grades AI rules setup (S/A/B/C/D)
- 5 weighted scoring criteria: Completeness, Specificity, Coverage, Custom Rules, Security
- Beautiful terminal score card with boxen, chalk, and Unicode progress bars
- Suggestion engine with context-aware improvement recommendations
- `--json` flag for CI integration
- Scorer tests

## [0.3.0] - 2026-04-08

### Added
- **Generation Engine** — `airules init` scans project, creates `.airules.yml`, generates rules for 6 AI tools
- Zod schema for `.airules.yml` validation
- Config loader with smart defaults from detected ProjectProfile
- 6 generators: Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, Codex
- `airules sync` — re-generates all target files from `.airules.yml`
- Dogfooded: airules has its own `.airules.yml` and rule files
- Generator tests

## [0.2.0] - 2026-04-08

### Added
- **Detection Engine** — `airules detect` scans project tech stack
- Stack detector with 30+ framework markers across 10 languages
- Dependency analyzer (package.json parsing, pattern detection)
- Structure analyzer (directories, monorepo detection)
- Git analyzer (commit pattern detection)
- Beautiful terminal table output with cli-table3
- Test fixtures for Next.js, Python, and Rust projects
- Detector tests

## [0.1.0] - 2026-04-08

### Added
- 🏗️ Project foundation
- CLI skeleton with placeholder commands (init, sync, score, detect)
- Build pipeline with tsup, Biome, Vitest
- GitHub Actions CI workflow (Node 18/20/22 matrix)
- Terminal UI utilities (chalk logger, ora spinner)
- README, LICENSE, CONTRIBUTING, CHANGELOG
- GitHub issue templates

[Unreleased]: https://github.com/tang-vu/airules/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/tang-vu/airules/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/tang-vu/airules/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tang-vu/airules/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tang-vu/airules/releases/tag/v0.1.0
