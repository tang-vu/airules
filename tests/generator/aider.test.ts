import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { airulesConfigSchema } from "../../src/core/config/schema.js";
import { detectProject } from "../../src/core/detector/index.js";
import { generateAll, getGeneratorInfo, listGenerators } from "../../src/core/generator/index.js";
import { GENERATOR_MAP } from "../../src/core/generator/types.js";
import { importExistingConfigs } from "../../src/core/importer/index.js";
import { scoreProject } from "../../src/core/scorer/index.js";

let cwd: string;

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "airules-aider-generator-"));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

describe("Aider conventions", () => {
  it.each(["directory", "dangling symlink"])(
    "rejects an AIDER.md %s before reading",
    async (kind) => {
      const outputPath = join(cwd, "AIDER.md");
      if (kind === "directory") mkdirSync(outputPath);
      else symlinkSync(join(cwd, "missing-config.yml"), outputPath);
      const profile = await detectProject(cwd);
      const config = airulesConfigSchema.parse({ targets: ["aider"] });
      expect(() => generateAll(profile, config, cwd, true, true)).toThrow(
        "regular file with a single link",
      );
      expect(() => importExistingConfigs(cwd)).toThrow("regular file with a single link");
    },
  );

  it("registers one distinct Markdown output everywhere", () => {
    expect(listGenerators()).toContain("aider");
    expect(getGeneratorInfo("aider")).toMatchObject({ name: "aider", outputPath: "AIDER.md" });
    expect(GENERATOR_MAP.aider).toBe("AIDER.md");
    for (const target of listGenerators().filter((tool) => tool !== "aider")) {
      expect(getGeneratorInfo(target)?.outputPath).not.toBe("AIDER.md");
    }
  });

  it("exports every configured convention category and custom text", async () => {
    const profile = await detectProject(cwd);
    const config = airulesConfigSchema.parse({
      project: {
        name: "demo",
        description: "A sample project",
        language: "typescript",
        stack: "react",
        node_version: "22",
      },
      targets: ["aider"],
      rules: {
        style: {
          prefer_functional: true,
          max_file_length: 240,
          naming_convention: "camelCase",
          import_style: "named",
          quote_style: "single",
        },
        architecture: {
          pattern: "domain-driven",
          state_management: "Zustand",
          api_style: "graphql",
        },
        testing: {
          framework: "vitest",
          style: "given-when-then",
          min_coverage: 83,
          require_tests_for: ["services", "utils"],
        },
        git: { commit_style: "gitmoji", branch_pattern: "feat/*", require_pr: true },
        docs: { require_jsdoc: true, language: "vietnamese" },
        security: {
          no_secrets_in_code: false,
          sanitize_inputs: true,
          prefer_parameterized_queries: true,
        },
        performance: {
          lazy_load_images: true,
          prefer_server_components: true,
          bundle_size_limit: "125kb",
        },
      },
      custom: ["Preserve API compatibility", "Use `Money` for currency values"],
    });
    const files = generateAll(profile, config, cwd, true, true);
    expect(files).toHaveLength(1);
    const content = files[0]?.content ?? "";
    for (const value of [
      "demo",
      "A sample project",
      "typescript",
      "react",
      "22",
      "functional",
      "240",
      "camelCase",
      "named",
      "single",
      "domain-driven",
      "Zustand",
      "graphql",
      "vitest",
      "given-when-then",
      "83",
      "services",
      "utils",
      "gitmoji",
      "feat/*",
      "PR",
      "JSDoc",
      "vietnamese",
      "sanitize",
      "parameterized",
      "images",
      "server components",
      "125kb",
      ...config.custom,
    ]) {
      expect(content).toContain(value);
    }
    expect(content).not.toContain("Never commit secrets");
    expect(content).not.toContain("undefined");
    expect(content.endsWith("\n")).toBe(true);
  });

  it("keeps config-based output stable when detection differs between sync and check", async () => {
    const profile = await detectProject(cwd);
    const config = airulesConfigSchema.parse({ targets: ["aider"] });
    const before = generateAll(profile, config, cwd, true, true);
    const after = generateAll(
      {
        ...profile,
        name: "different",
        language: "typescript",
        framework: "nextjs",
        hasTesting: true,
        testingFramework: "vitest",
      },
      config,
      cwd,
      true,
      true,
    );
    expect(before).toHaveLength(1);
    expect(after).toEqual(before);
    expect(before[0]?.content).not.toContain("undefined");
  });

  it("discovers conventions without importing Aider configuration or following read paths", async () => {
    writeFileSync(
      join(cwd, "AIDER.md"),
      "# Aider Conventions\n- Preserve the team's existing API contracts.\n",
    );
    writeFileSync(
      join(cwd, ".aider.conf.yml"),
      "read: PRIVATE.md\nopenai-api-key: test-sentinel-not-a-real-key\nunknown-option: keep\n",
    );
    writeFileSync(join(cwd, "PRIVATE.md"), "Private rules must not be imported automatically.\n");
    const result = importExistingConfigs(cwd);
    expect(result.sources.map(({ tool, file }) => ({ tool, file }))).toEqual([
      { tool: "aider", file: "AIDER.md" },
    ]);
    expect(result.extractedRules).toEqual(["Preserve the team's existing API contracts."]);
    expect((await detectProject(cwd)).keyFiles).toContain("AIDER.md");
  });

  it("creates only conventions and omits disabled optional instructions", async () => {
    const config = airulesConfigSchema.parse({
      targets: ["aider"],
      rules: { security: { no_secrets_in_code: false }, git: { require_pr: false } },
    });
    const files = generateAll(await detectProject(cwd), config, cwd);
    expect(files.map(({ path }) => path)).toEqual(["AIDER.md"]);
    const content = readFileSync(join(cwd, "AIDER.md"), "utf8");
    expect(content).not.toContain("## Security");
    expect(content).not.toContain("## Performance");
    expect(content).not.toContain("Require a PR");
    expect(content).not.toContain("Require JSDoc");
    expect(content).not.toContain("functional programming");
    expect(existsSync(join(cwd, ".aider.conf.yml"))).toBe(false);
  });

  it("uses conventions in scorer suggestions instead of the user-owned config", async () => {
    const config = airulesConfigSchema.parse({ targets: ["aider"] });
    const otherOutputs = Object.entries(GENERATOR_MAP)
      .filter(([tool]) => tool !== "aider")
      .map(([, file]) => file);
    const { suggestions } = scoreProject(await detectProject(cwd), config, otherOutputs);
    expect(suggestions.some(({ message }) => message.includes("AIDER.md"))).toBe(true);
    expect(suggestions.some(({ message }) => message.includes(".aider.conf.yml"))).toBe(false);
  });

  it("does not treat a config-only setup as importable rule content", () => {
    writeFileSync(join(cwd, ".aider.conf.yml"), "read: [TEAM.md]\n");
    mkdirSync(join(cwd, ".aider"));
    writeFileSync(join(cwd, ".aider", "model.settings.yml"), "model: sentinel\n");
    expect(importExistingConfigs(cwd).sources).toEqual([]);
    expect(readFileSync(join(cwd, ".aider.conf.yml"), "utf8")).toBe("read: [TEAM.md]\n");
  });
});
