export type Language =
  | "typescript"
  | "javascript"
  | "python"
  | "rust"
  | "go"
  | "ruby"
  | "java"
  | "php"
  | "swift"
  | "other";

export type Framework =
  | "nextjs"
  | "react-vite"
  | "react-cra"
  | "vue"
  | "nuxt"
  | "svelte"
  | "sveltekit"
  | "angular"
  | "astro"
  | "remix"
  | "gatsby"
  | "express"
  | "fastify"
  | "nestjs"
  | "hono"
  | "fastapi"
  | "django"
  | "flask"
  | "rails"
  | "sinatra"
  | "gin"
  | "fiber"
  | "echo"
  | "actix"
  | "axum"
  | "rocket"
  | "laravel"
  | "symfony"
  | "spring-boot"
  | null;

export interface ProjectProfile {
  name: string;
  language: Language;
  framework: Framework;
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
  hasTypeScript: boolean;
  hasTesting: boolean;
  testingFramework: string | null;
  hasLinter: boolean;
  linter: string | null;
  hasCSSFramework: boolean;
  cssFramework: string | null;
  stateManagement: string | null;
  isMonorepo: boolean;
  srcDirectory: string;
  keyDirectories: string[];
  keyFiles: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  detectedPatterns: string[];
}
