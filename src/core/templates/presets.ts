import type { AirulesConfig } from "../config/schema.js";

export interface Preset {
  id: string;
  name: string;
  description: string;
  config: Partial<AirulesConfig>;
}

export const PRESETS: Preset[] = [
  {
    id: "strict-typescript",
    name: "Strict TypeScript",
    description: "Maximum type safety — no any, strict null checks, explicit types",
    config: {
      rules: {
        style: {
          naming_convention: "camelCase" as const,
          import_style: "named" as const,
          quote_style: "double" as const,
          prefer_functional: true,
          max_file_length: 200,
        },
        security: {
          no_secrets_in_code: true,
          sanitize_inputs: true,
          prefer_parameterized_queries: true,
        },
      },
      custom: [
        "Never use `any` type — use `unknown` with type guards",
        "All function parameters and return types must be explicitly typed",
        "Enable strictNullChecks and strictPropertyInitialization in tsconfig",
        "Prefer interfaces over type aliases for object shapes",
        "Use discriminated unions for error handling instead of throwing",
      ],
    },
  },
  {
    id: "test-first",
    name: "Test-First (TDD)",
    description: "Test-driven development workflow — tests before implementation",
    config: {
      rules: {
        testing: {
          style: "arrange-act-assert",
          min_coverage: 90,
          require_tests_for: ["utils", "hooks", "api", "components", "services"],
        },
      },
      custom: [
        "Write tests BEFORE implementation (red-green-refactor)",
        "All public functions must have at least one test",
        "Test edge cases: empty input, null, undefined, boundary values",
        "Use descriptive test names: should_do_X_when_Y",
        "Mock external dependencies — no real DB/API calls in unit tests",
      ],
    },
  },
  {
    id: "security-first",
    name: "Security First",
    description: "Security-focused rules — sanitize inputs, prevent injection, no secrets",
    config: {
      rules: {
        security: {
          no_secrets_in_code: true,
          sanitize_inputs: true,
          prefer_parameterized_queries: true,
        },
      },
      custom: [
        "Never hardcode secrets, API keys, or tokens — use environment variables",
        "Sanitize and validate ALL user inputs before processing",
        "Use parameterized queries — NEVER concatenate SQL strings",
        "Implement rate limiting on all public endpoints",
        "Use HTTPS everywhere — reject HTTP requests in production",
        "Implement CSRF protection on all state-changing endpoints",
        "Log security events but NEVER log sensitive data",
      ],
    },
  },
  {
    id: "performance-first",
    name: "Performance First",
    description: "Optimized for speed — lazy loading, memoization, bundle optimization",
    config: {
      rules: {
        performance: {
          lazy_load_images: true,
          prefer_server_components: true,
          bundle_size_limit: "150kb",
        },
      },
      custom: [
        "Memoize expensive computations with useMemo/useCallback",
        "Lazy load components and routes — code split by default",
        "Use virtual lists for collections > 100 items",
        "Prefer server-side rendering for initial page load",
        "Optimize images: use WebP/AVIF, implement responsive images",
        "Monitor bundle size — alert if exceeds limit",
      ],
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Minimal rules — only essentials, maximum flexibility",
    config: {
      rules: {
        style: {
          naming_convention: "camelCase" as const,
          import_style: "named" as const,
          quote_style: "double" as const,
        },
        security: {
          no_secrets_in_code: true,
        },
      },
      custom: ["Never commit secrets or API keys", "Use meaningful variable and function names"],
    },
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

export function listPresets(): { id: string; name: string; description: string }[] {
  return PRESETS.map(({ id, name, description }) => ({ id, name, description }));
}
