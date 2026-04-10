import { parse } from "yaml";
import { type AirulesConfig, airulesConfigSchema } from "../config/schema.js";

export async function loadRemoteConfig(source: string): Promise<AirulesConfig> {
  let content: string;

  // GitHub shorthand: user/repo or user/repo/path
  if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+/.test(source)) {
    const parts = source.split("/");
    const owner = parts[0];
    const repo = parts[1];
    const path = parts.slice(2).join("/") || ".airules.yml";
    const branch = "main";
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    content = await fetchFromUrl(url);
  } else if (source.startsWith("http://") || source.startsWith("https://")) {
    content = await fetchFromUrl(source);
  } else {
    throw new Error(`Invalid remote config source: ${source}`);
  }

  try {
    const parsed = parse(content) as Record<string, unknown>;
    return airulesConfigSchema.parse(parsed);
  } catch (err) {
    throw new Error(
      `Failed to parse remote config: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

async function fetchFromUrl(url: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch remote config: ${resp.status} ${resp.statusText}`);
  }
  return resp.text();
}
