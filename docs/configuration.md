# Configuration Reference

The `.airules.yml` file is the single source of truth for all AI coding rules.

## Full Schema

```yaml
version: 1

project:
  name: "my-app"                        # Project name (auto-detected if omitted)
  description: "A brief description"    # Optional description
  stack: "nextjs"                       # Auto-detected: nextjs | react-vite | python-fastapi | rust | go | etc.
  language: "typescript"                # Auto-detected: typescript | javascript | python | rust | go | etc.
  node_version: "22"                    # Optional

# Which AI tools to generate rules for
targets:
  - claude        # CLAUDE.md
  - cursor        # .cursorrules
  - copilot       # .github/copilot-instructions.md
  - windsurf      # .windsurfrules
  - cline         # .clinerules
  - codex         # AGENTS.md
  - aider         # .aider.conf.yml

rules:
  # Code style
  style:
    prefer_functional: true             # Prefer functional over OOP
    max_file_length: 300                # Max lines per file
    naming_convention: "camelCase"      # camelCase | snake_case | PascalCase
    import_style: "named"               # named | default | mixed
    quote_style: "double"               # single | double

  # Architecture
  architecture:
    pattern: "feature-based"            # feature-based | layer-based | domain-driven
    state_management: "zustand"         # zustand | redux | jotai | context | pinia | etc.
    api_style: "server-actions"         # rest | graphql | trpc | server-actions | grpc

  # Testing
  testing:
    framework: "vitest"                 # vitest | jest | pytest | cargo-test
    style: "arrange-act-assert"         # Test structure style
    min_coverage: 80                    # Minimum test coverage %
    require_tests_for: ["utils", "hooks", "api"]  # Paths requiring tests

  # Git conventions
  git:
    commit_style: "conventional"        # conventional | gitmoji | angular | custom
    branch_pattern: "feature/*"         # Branch naming pattern
    require_pr: true                    # Require PR before merging

  # Documentation
  docs:
    require_jsdoc: false                # Require JSDoc comments
    language: "english"                 # Comment language

  # Security
  security:
    no_secrets_in_code: true            # Never commit secrets
    sanitize_inputs: false              # Validate/sanitize user input
    prefer_parameterized_queries: false # Prevent SQL injection

  # Performance
  performance:
    lazy_load_images: false             # Lazy load images
    prefer_server_components: false     # Prefer server components (Next.js)
    bundle_size_limit: "200kb"          # Max bundle size

# Custom rules (appended to all outputs)
custom:
  - "Always use the `cn()` utility for conditional classNames"
  - "Never use `any` type — use `unknown` with type guards"
  - "All API responses must follow the { data, error, meta } envelope"

# Excluded paths (not analyzed during detect)
exclude:
  - "node_modules"
  - ".next"
  - "dist"
  - "coverage"
```

## Commands

### `airules init`

Scan project and generate AI coding rules for all configured tools.

```bash
npx @tangvu/airules init
npx @tangvu/airules init --dry-run   # Preview without writing
npx @tangvu/airules init --force     # Overwrite existing files
npx @tangvu/airules init --target claude  # Generate for one tool only
```

### `airules sync`

Re-generate all target files from `.airules.yml`.

```bash
npx @tangvu/airules sync
npx @tangvu/airules sync --detect    # Re-detect project first
npx @tangvu/airules sync --dry-run   # Preview changes
npx @tangvu/airules sync --target cursor  # Sync one tool only
```

### `airules score`

Score the quality of your AI coding rules.

```bash
npx @tangvu/airules score
npx @tangvu/airules score --json     # JSON output for CI
```

### `airules detect`

Detect and display project tech stack.

```bash
npx @tangvu/airules detect
```

## Score Criteria

| Criteria | Weight | Description |
|----------|--------|-------------|
| Completeness | 25% | Has all recommended sections |
| Specificity | 25% | Rules specific to detected stack |
| Coverage | 20% | How many AI tools are configured |
| Custom Rules | 15% | Has project-specific custom rules |
| Security | 15% | Has security rules defined |

### Grades

| Grade | Score | Meaning |
|-------|-------|---------|
| S | 95+ | Excellent |
| A | 85+ | Great |
| B | 70+ | Good |
| C | 50+ | Needs improvement |
| D | <50 | Poor |
