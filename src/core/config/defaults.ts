import type { ProjectProfile } from "../detector/types.js";
import type { AirulesConfig } from "./schema.js";

export function getDefaultConfig(profile: ProjectProfile): AirulesConfig {
  return {
    version: 1,
    project: {
      name: profile.name,
      stack: profile.framework ?? undefined,
      language: profile.language,
    },
    targets: ["claude", "cursor", "copilot"],
    rules: {
      style: {
        prefer_functional: true,
        naming_convention: profile.hasTypeScript ? "camelCase" : "camelCase",
        import_style: "named",
        quote_style: "double",
      },
      architecture: {
        pattern: "feature-based",
        state_management: profile.stateManagement ?? undefined,
        api_style: "rest",
      },
      testing: {
        framework: profile.testingFramework ?? undefined,
        style: "arrange-act-assert",
        require_tests_for: [],
      },
      git: {
        commit_style: "conventional",
        branch_pattern: "feature/*",
        require_pr: true,
      },
      docs: {
        require_jsdoc: false,
        language: "english",
      },
      security: {
        no_secrets_in_code: true,
        sanitize_inputs: false,
        prefer_parameterized_queries: false,
      },
      performance: {
        lazy_load_images: false,
        prefer_server_components: false,
      },
    },
    custom: [],
    exclude: ["node_modules", "dist", "coverage"],
  };
}
