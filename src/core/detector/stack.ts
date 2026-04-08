import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Framework, Language } from "./types.js";

interface StackDetection {
  language: Language;
  framework: Framework | null;
}

const frameworkMarkers: Record<string, { framework: Framework; language: Language }> = {
  "next.config.js": { framework: "nextjs", language: "typescript" },
  "next.config.ts": { framework: "nextjs", language: "typescript" },
  "next.config.mjs": { framework: "nextjs", language: "typescript" },
  "nuxt.config.js": { framework: "nuxt", language: "typescript" },
  "nuxt.config.ts": { framework: "nuxt", language: "typescript" },
  "vite.config.js": { framework: null, language: "typescript" },
  "vite.config.ts": { framework: null, language: "typescript" },
  "svelte.config.js": { framework: "sveltekit", language: "typescript" },
  "angular.json": { framework: "angular", language: "typescript" },
  "astro.config.mjs": { framework: "astro", language: "typescript" },
  "remix.config.js": { framework: "remix", language: "typescript" },
  "gatsby-config.js": { framework: "gatsby", language: "typescript" },
  "gatsby-config.ts": { framework: "gatsby", language: "typescript" },
  "Cargo.toml": { framework: null, language: "rust" },
  "go.mod": { framework: null, language: "go" },
  "pyproject.toml": { framework: null, language: "python" },
  "requirements.txt": { framework: null, language: "python" },
  Gemfile: { framework: null, language: "ruby" },
  "composer.json": { framework: null, language: "php" },
  "pom.xml": { framework: null, language: "java" },
  "build.gradle": { framework: null, language: "java" },
  "Package.swift": { framework: null, language: "swift" },
};

const pythonFrameworkMarkers: Record<string, { framework: Framework }> = {
  fastapi: { framework: "fastapi" },
  django: { framework: "django" },
  flask: { framework: "flask" },
};

const rubyFrameworkMarkers: Record<string, { framework: Framework }> = {
  rails: { framework: "rails" },
  sinatra: { framework: "sinatra" },
};

const rustFrameworkMarkers: Record<string, { framework: Framework }> = {
  actix: { framework: "actix" },
  axum: { framework: "axum" },
  rocket: { framework: "rocket" },
};

const goFrameworkMarkers: Record<string, { framework: Framework }> = {
  "gin-gonic": { framework: "gin" },
  gofiber: { framework: "fiber" },
  "labstack/echo": { framework: "echo" },
};

const phpFrameworkMarkers: Record<string, { framework: Framework }> = {
  laravel: { framework: "laravel" },
  symfony: { framework: "symfony" },
};

const nodeFrameworkMarkers: Record<string, { framework: Framework }> = {
  express: { framework: "express" },
  fastify: { framework: "fastify" },
  "@nestjs/core": { framework: "nestjs" },
  hono: { framework: "hono" },
};

export function detectStack(cwd: string, dependencies: Record<string, string>): StackDetection {
  const allDeps = { ...dependencies };

  // Check file-based markers first
  for (const [file, detection] of Object.entries(frameworkMarkers)) {
    if (existsSync(join(cwd, file))) {
      // Special case: vite.config.* needs react dependency for react-vite
      if (file.startsWith("vite.config.") && dependencies.react) {
        return { language: detection.language, framework: "react-vite" };
      }
      // For language-only markers, check dependency-based frameworks first
      if (detection.framework === null) {
        const langFramework = detectFrameworkForLanguage(detection.language, allDeps);
        if (langFramework) {
          return { language: detection.language, framework: langFramework };
        }
        return { language: detection.language, framework: null };
      }
      return { language: detection.language, framework: detection.framework };
    }
  }

  // Check dependency-based markers
  for (const [dep, { framework }] of Object.entries(nodeFrameworkMarkers)) {
    if (allDeps[dep]) {
      return { language: "typescript", framework };
    }
  }

  for (const [dep, { framework }] of Object.entries(pythonFrameworkMarkers)) {
    if (allDeps[dep]) {
      return { language: "python", framework };
    }
  }

  for (const [dep, { framework }] of Object.entries(rubyFrameworkMarkers)) {
    if (allDeps[dep]) {
      return { language: "ruby", framework };
    }
  }

  for (const [dep, { framework }] of Object.entries(rustFrameworkMarkers)) {
    if (allDeps[dep]) {
      return { language: "rust", framework };
    }
  }

  for (const [dep, { framework }] of Object.entries(goFrameworkMarkers)) {
    if (allDeps[dep]) {
      return { language: "go", framework };
    }
  }

  for (const [dep, { framework }] of Object.entries(phpFrameworkMarkers)) {
    if (allDeps[dep]) {
      return { language: "php", framework };
    }
  }

  // Fallback: detect language from config files
  if (existsSync(join(cwd, "tsconfig.json"))) {
    return { language: "typescript", framework: null };
  }
  if (existsSync(join(cwd, "package.json"))) {
    return { language: "javascript", framework: null };
  }

  return { language: "other", framework: null };
}

function detectFrameworkForLanguage(
  language: Language,
  dependencies: Record<string, string>,
): Framework | null {
  const markersMap: Record<string, Record<string, { framework: Framework }>> = {
    python: pythonFrameworkMarkers,
    ruby: rubyFrameworkMarkers,
    rust: rustFrameworkMarkers,
    go: goFrameworkMarkers,
    php: phpFrameworkMarkers,
    typescript: nodeFrameworkMarkers,
    javascript: nodeFrameworkMarkers,
  };

  const markers = markersMap[language];
  if (!markers) return null;

  for (const [, { framework }] of Object.entries(markers)) {
    if (dependencies[framework as string]) {
      return framework;
    }
  }

  return null;
}
