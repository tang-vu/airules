import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import type { ProjectProfile } from "../detector/types.js";
import { getDefaultConfig } from "./defaults.js";
import { type AirulesConfig, airulesConfigSchema } from "./schema.js";

export function findConfigPath(cwd: string): string | null {
  const ymlPath = join(cwd, ".airules.yml");
  const yamlPath = join(cwd, ".airules.yaml");
  return existsSync(ymlPath) ? ymlPath : existsSync(yamlPath) ? yamlPath : null;
}

export function loadConfig(cwd: string): AirulesConfig | null {
  const configPath = findConfigPath(cwd);

  if (!configPath) {
    return null;
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    const raw = parse(content) as Record<string, unknown>;
    const validated = airulesConfigSchema.parse(raw);
    return validated;
  } catch {
    return null;
  }
}

export function generateConfigFromProfile(profile: ProjectProfile): AirulesConfig {
  return getDefaultConfig(profile);
}

export function saveConfig(
  cwd: string,
  config: AirulesConfig,
  configPath = join(cwd, ".airules.yml"),
): void {
  const content = stringify(config, { indent: 2 });
  writeFileSync(configPath, content);
}
