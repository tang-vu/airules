import { z } from "zod";

export const airulesConfigSchema = z.object({
  version: z.number().default(1),
  project: z
    .object({
      name: z.string().default("unknown"),
      description: z.string().optional(),
      stack: z.string().optional(),
      language: z.string().optional(),
      node_version: z.string().optional(),
    })
    .default({}),
  targets: z
    .array(
      z.enum([
        "claude",
        "cursor",
        "copilot",
        "windsurf",
        "cline",
        "codex",
        "aider",
        "qwen",
        "gemini",
        "augment",
        "codebuddy",
        "opencode",
        "roo",
        "kilocode",
        "bolt",
      ]),
    )
    .default(["claude", "cursor", "copilot"]),
  rules: z
    .object({
      style: z
        .object({
          prefer_functional: z.boolean().default(false),
          max_file_length: z.number().optional(),
          naming_convention: z.enum(["camelCase", "snake_case", "PascalCase"]).default("camelCase"),
          import_style: z.enum(["named", "default", "mixed"]).default("named"),
          quote_style: z.enum(["single", "double"]).default("double"),
        })
        .default({}),
      architecture: z
        .object({
          pattern: z
            .enum(["feature-based", "layer-based", "domain-driven"])
            .default("feature-based"),
          state_management: z.string().optional(),
          api_style: z.enum(["rest", "graphql", "trpc", "server-actions", "grpc"]).default("rest"),
        })
        .default({}),
      testing: z
        .object({
          framework: z.string().optional(),
          style: z.string().default("arrange-act-assert"),
          min_coverage: z.number().optional(),
          require_tests_for: z.array(z.string()).default([]),
        })
        .default({}),
      git: z
        .object({
          commit_style: z
            .enum(["conventional", "gitmoji", "angular", "custom"])
            .default("conventional"),
          branch_pattern: z.string().default("feature/*"),
          require_pr: z.boolean().default(true),
        })
        .default({}),
      docs: z
        .object({
          require_jsdoc: z.boolean().default(false),
          language: z.enum(["english", "vietnamese", "other"]).default("english"),
        })
        .default({}),
      security: z
        .object({
          no_secrets_in_code: z.boolean().default(true),
          sanitize_inputs: z.boolean().default(false),
          prefer_parameterized_queries: z.boolean().default(false),
        })
        .default({}),
      performance: z
        .object({
          lazy_load_images: z.boolean().default(false),
          prefer_server_components: z.boolean().default(false),
          bundle_size_limit: z.string().optional(),
        })
        .default({}),
    })
    .default({}),
  custom: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default(["node_modules", "dist", "coverage"]),
});

export type AirulesConfig = z.infer<typeof airulesConfigSchema>;
