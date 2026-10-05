import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { airulesConfigSchema } from "../../src/core/config/schema.js";
import { detectProject } from "../../src/core/detector/index.js";
import { generateAll } from "../../src/core/generator/index.js";

let cwd: string;
beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "airules-generator-order-"));
});
afterEach(() => rmSync(cwd, { recursive: true, force: true }));

describe.each([{ targets: ["codex", "opencode"] }, { targets: ["opencode", "codex"] }])(
  "shared output ordering $targets",
  ({ targets }) => {
    it.each([0, 1])(
      "preserves the final target when existing content matches target %i",
      async (index) => {
        const profile = await detectProject(cwd);
        const config = airulesConfigSchema.parse({
          targets,
          custom: ["Keep public API contracts stable"],
        });
        const expected = generateAll(profile, config, cwd, true, true);
        expect(expected).toHaveLength(2);
        expect(expected[0]?.path).toBe("AGENTS.md");
        expect(expected[1]?.path).toBe("AGENTS.md");
        const initial = expected[index]?.content ?? "";
        const final = expected[1]?.content ?? "";
        expect(expected[0]?.content).not.toBe(final);
        writeFileSync(join(cwd, "AGENTS.md"), initial);
        const preview = generateAll(profile, config, cwd, true);
        expect(readFileSync(join(cwd, "AGENTS.md"), "utf8")).toBe(initial);
        const result = generateAll(profile, config, cwd);
        expect(result).toEqual(preview);
        expect(result).toHaveLength(index === 0 ? 1 : 2);
        expect(readFileSync(join(cwd, "AGENTS.md"), "utf8")).toBe(final);
      },
    );
  },
);
