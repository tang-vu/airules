import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";

const cliPath = fileURLToPath(new URL("../../dist/index.js", import.meta.url));
const fetchStub = fileURLToPath(new URL("./mock-fetch.mjs", import.meta.url));

export function runCli(cwd: string, ...args: string[]) {
  const fetchLog = join(cwd, ".airules-test-fetch.log");
  writeFileSync(fetchLog, "");
  const result = spawnSync(process.execPath, ["--import", fetchStub, cliPath, ...args], {
    cwd,
    env: { ...process.env, NO_COLOR: "1", AIRULES_TEST_FETCH_LOG: fetchLog },
    encoding: "utf8",
    timeout: 10000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  expect(result.error).toBeUndefined();
  expect(result.signal).toBeNull();
  const fetchRequests = readFileSync(fetchLog, "utf8").split("\n").filter(Boolean);
  if (args.includes("--json")) {
    expect(fetchRequests).toEqual([]);
    expect(result.stderr).toBe("");
  }
  return { ...result, fetchRequests };
}
