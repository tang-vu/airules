# Supported Tools

airules generates AI coding rules for the following tools:

## Core Tools

| Tool | Output File | Status |
|------|------------|--------|
| [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) | `CLAUDE.md` | ✅ |
| [Cursor](https://www.cursor.com/) | `.cursorrules` | ✅ |
| [GitHub Copilot](https://github.com/features/copilot) | `.github/copilot-instructions.md` | ✅ |
| [Windsurf](https://www.windsurf.com/) | `.windsurfrules` | ✅ |
| [Cline](https://cline.bot/) | `.clinerules` | ✅ |
| [OpenAI Codex](https://platform.openai.com/docs/guides/codex) | `AGENTS.md` | ✅ |
| [Aider](https://aider.chat/) | `AIDER.md` | ✅ Conventions export; explicit loading required |

## New Tools

| Tool | Output File | Status |
|------|------------|--------|
| [Qwen Code](https://qwenlm.github.io/) | `.qwenrules` | ✅ |
| [Gemini CLI](https://ai.google.dev/gemini-api) | `.gemini/rules.md` | ✅ |
| [Augment Code](https://augment.dev/) | `.augment/rules.md` | ✅ |
| [CodeBuddy](https://www.codebuddy.ai/) | `.codebuddy/rules.md` | ✅ |
| [OpenCode](https://github.com/opencode-ai/opencode) | `AGENTS.md` | ✅ |
| [Roo Code](https://roocode.com/) | `.roo/rules.md` | ✅ |
| [KiloCode](https://kilocode.ai/) | `.kilocode/rules.md` | ✅ |
| [Bolt.new](https://bolt.new/) | `.bolt/rules.md` | ✅ |

## Usage

```bash
# Generate for all tools
npx @tangvu/airules init

# Generate for specific tool
npx @tangvu/airules init --target qwen
npx @tangvu/airules sync --target gemini
```

```yaml
# .airules.yml
targets:
  - claude
  - cursor
  - qwen
  - gemini
  - augment
```

## Aider

Add `aider` to `targets` in `.airules.yml`, then run:

```bash
npx @tangvu/airules sync --target aider
aider --read AIDER.md
```

`AIDER.md` contains the project details and conventions from `.airules.yml`.
The generated file is not automatically loaded by Aider. Load it as a read-only
file with `--read`, or use `/read AIDER.md` in an existing Aider session, as described
in [Aider's conventions guide](https://aider.chat/docs/usage/conventions.html).

For automatic loading, manually add `AIDER.md` to the `read` setting in your
existing `.aider.conf.yml`, preserving any files already listed. For example,
`read: [TEAM.md, AIDER.md]` loads both files. Aider loads configuration from your
home directory, Git repository root, and current directory in that order, with
later settings taking precedence. See [Aider's config documentation](https://aider.chat/docs/config/aider_conf.html)
when choosing where to add the setting.

airules owns only the selected generated `AIDER.md`. It never creates, reads,
imports, or rewrites `.aider.conf.yml`, model settings, or credentials. Existing
`CONVENTIONS.md` and other files referenced by Aider remain yours. The `check`
command checks generated file drift, not whether an Aider session loaded it.

Use a standalone regular file for `AIDER.md`. Generation, drift checks, and import
reject symlinks, hardlinks, and non-file paths so they cannot access user settings
through an alias. `--force` does not bypass this protection.

Unforced `init` preserves an existing `AIDER.md`. `init --force --target aider`
replaces it and the active airules config. Ordinary `sync --target aider`
regenerates `AIDER.md`, including any manual edits; keep lasting rules in
`.airules.yml`. `import` can extract rules from `AIDER.md` without changing it;
review the resulting config before syncing. `import --force` replaces the active
airules config rather than merging with it. Every `--dry-run` leaves files unchanged.

`--target aider` selects one command's output; it does not change the saved
targets. Default targets remain Claude, Cursor, and Copilot. Add Aider to
`.airules.yml` to include it in future unscoped `sync`, `status`, and `check` runs.

## Adding New Tools

To add support for a new AI tool:

1. Create a new generator in `src/core/generator/` extending `BaseGenerator`
2. Add the tool to `generatorMap` in `src/core/generator/index.ts`
3. Add to `GENERATOR_MAP` in `src/core/generator/types.ts`
4. Add to the `targets` enum in `src/core/config/schema.ts`
5. Update this docs file
