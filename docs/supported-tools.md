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
| [Aider](https://aider.chat/) | `.aider.conf.yml` | 🔜 |

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

## Adding New Tools

To add support for a new AI tool:

1. Create a new generator in `src/core/generator/` extending `BaseGenerator`
2. Add the tool to `generatorMap` in `src/core/generator/index.ts`
3. Add to `GENERATOR_MAP` in `src/core/generator/types.ts`
4. Add to the `targets` enum in `src/core/config/schema.ts`
5. Update this docs file
