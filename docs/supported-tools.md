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
| [Qwen Code](https://qwenlm.github.io/qwen-code-docs/en/users/features/memory/) | `QWEN.md` | ✅ |
| [Gemini CLI](https://geminicli.com/docs/cli/gemini-md/) | `GEMINI.md` | ✅ |
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

## Gemini CLI and Qwen Code

Gemini CLI loads project context from `GEMINI.md` by default. Qwen Code loads
`QWEN.md` in the project root. See the official [Gemini context guide](https://geminicli.com/docs/cli/gemini-md/)
and [Qwen memory guide](https://qwenlm.github.io/qwen-code-docs/en/users/features/memory/).

Add `gemini` and/or `qwen` to `.airules.yml` targets, then run `airules sync`.
`init --target gemini` or `init --target qwen` selects only that command's output;
it does not change the saved targets (Claude, Cursor, and Copilot by default).
These generators use the saved project stack/language and target-specific rules
from `.airules.yml`, including with `sync --detect`, so `status` and `check`
compare the same content that `sync` writes. Edit the config to change these values.

### Migrating older airules exports safely

Earlier versions wrote `.gemini/rules.md` and `.qwenrules`. Those legacy files are
never updated or deleted by generation. Missing new destinations appear as
`added` in `status`/`check`; syncing creates the new files from `.airules.yml`.
Review any hand-edited legacy rules and copy them into your config before syncing.
`import` reads both current and legacy paths without changing their contents.
`import --force` replaces the active airules config rather than merging with it:
back it up first, review the imported config, and restore the desired targets.

Unforced `init` preserves an existing `GEMINI.md` or `QWEN.md`. Ordinary `sync`
refuses to replace either file unless it begins with airules' generated-file
comment; it checks selected destinations before writing any generated files.
For a pre-existing human-maintained file, review/back up or import its rules first.
Then `sync --target gemini --force` (or `--target qwen`) explicitly replaces that
selected context file and marks it as managed. `init --force --target <tool>`
replaces both the active airules config and the selected context file. Subsequent
syncs replace managed files, including manual edits: keep lasting rules in the
config. Removing the generated-file comment protects the file from normal sync.

Every `--dry-run` leaves files unchanged, including with `--force`. Sync dry-run
previews the generated changes for an unowned file and warns that real sync needs
`--force`; `status`/`check` can report its drift without adopting or overwriting it.
Generation, checks, and import reject symlinks, hardlinks, and non-file context
paths, even with `--force`. Use standalone regular files for these destinations.

These exports target the tools' documented default filenames. Gemini allows
custom names with `context.fileName` in its settings; airules does not read or
rewrite either tool's settings or follow filename overrides. If you customized
context loading, ensure your tool includes the generated default filename or
integrate the generated file into your setup manually. Check the tool's memory
view to verify loading. airules `check` validates file drift, not a running AI
session. Legacy files remain yours to review, archive, or remove, especially if a
custom loader still includes them.

## Adding New Tools

To add support for a new AI tool:

1. Create a new generator in `src/core/generator/` extending `BaseGenerator`
2. Add the tool to `generatorMap` in `src/core/generator/index.ts`
3. Add to `GENERATOR_MAP` in `src/core/generator/types.ts`
4. Add to the `targets` enum in `src/core/config/schema.ts`
5. Update this docs file
