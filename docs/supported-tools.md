# Supported Tools

airules generates AI coding rules for the following tools:

| Tool | Output File | Status |
|------|------------|--------|
| [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) | `CLAUDE.md` | ✅ |
| [Cursor](https://www.cursor.com/) | `.cursorrules` | ✅ |
| [GitHub Copilot](https://github.com/features/copilot) | `.github/copilot-instructions.md` | ✅ |
| [Windsurf](https://www.windsurf.com/) | `.windsurfrules` | ✅ |
| [Cline](https://cline.bot/) | `.clinerules` | ✅ |
| [OpenAI Codex](https://platform.openai.com/docs/guides/codex) | `AGENTS.md` | ✅ |
| [Aider](https://aider.chat/) | `.aider.conf.yml` | 🔜 |

## Tool-Specific Formats

### Claude Code (`CLAUDE.md`)

Markdown format with structured sections. Claude Code understands Markdown best and leverages headings, lists, and code blocks for context.

**Sections generated:**
- Project Overview
- Tech Stack
- Code Style
- Architecture
- Testing
- Git Conventions
- Security
- Custom Rules

### Cursor (`.cursorrules`)

Plain text rules optimized for Cursor's context window. Each rule on its own line or paragraph.

### GitHub Copilot (`.github/copilot-instructions.md`)

Markdown instructions focused on code completion context. Includes project overview, style guidelines, and architecture patterns.

### Windsurf (`.windsurfrules`)

Concise rules format optimized for Windsurf's processing.

### Cline (`.clinerules`)

Simple rules format for Cline agent.

### OpenAI Codex (`AGENTS.md`)

Agent instructions format for OpenAI's Codex CLI.

## Adding New Tools

To add support for a new AI tool:

1. Create a new generator in `src/core/generator/` extending `BaseGenerator`
2. Add the tool to `generatorMap` in `src/core/generator/index.ts`
3. Add to `GENERATOR_MAP` in `src/core/generator/types.ts`
4. Add to the `targets` enum in `src/core/config/schema.ts`
5. Update this docs file
