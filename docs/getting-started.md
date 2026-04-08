# Getting Started

## Prerequisites

- Node.js 18 or higher
- A project with source code (any tech stack)

## Quick Start

### 1. Scan and generate

```bash
npx @tangvu/airules init
```

This will:
- Detect your project's tech stack (language, framework, dependencies)
- Create a `.airules.yml` configuration file
- Generate AI coding rules for all configured tools

### 2. Review detected stack

```bash
npx @tangvu/airules detect
```

Example output:
```
┌─────────────────────────────────────────────────┐
│            airules — Project Scan                │
├─────────────────┬───────────────────────────────┤
│ Project         │ my-app                        │
│ Language        │ TypeScript                    │
│ Framework       │ Next.js 15 (App Router)       │
│ Package Manager │ pnpm                          │
│ Testing         │ Vitest                        │
│ CSS             │ Tailwind CSS 4                │
│ Linter          │ Biome                         │
└─────────────────┴───────────────────────────────┘
```

### 3. Customize rules

Edit `.airules.yml` to customize rules for your project:

```yaml
project:
  name: "my-app"
  stack: "nextjs"

rules:
  style:
    naming_convention: "camelCase"
  testing:
    framework: "vitest"
    min_coverage: 80
  git:
    commit_style: "conventional"

custom:
  - "Always use server components by default"
  - "Database queries must go through repositories"
```

### 4. Sync after editing

```bash
npx @tangvu/airules sync
```

This regenerates all output files from `.airules.yml`.

### 5. Check your score

```bash
npx @tangvu/airules score
```

Get a visual grade (S/A/B/C/D) with suggestions for improvement.

## Global Install

For frequent use, install globally:

```bash
npm install -g @tangvu/airules
```

Then use without `npx`:

```bash
airules init
airules detect
airules sync
airules score
```

## CI Integration

Use `--json` flag for CI pipelines:

```bash
airules score --json | jq '.scores.overall'
```

Fail CI if score is below threshold:

```bash
SCORE=$(airules score --json | jq '.scores.overall')
if [ "$SCORE" -lt 70 ]; then
  echo "Score too low: $SCORE"
  exit 1
fi
```

## Next Steps

- [Configuration Reference](configuration.md) — Full `.airules.yml` schema
- [Supported Tools](supported-tools.md) — All supported AI tools
- [Contributing](../CONTRIBUTING.md) — How to contribute
