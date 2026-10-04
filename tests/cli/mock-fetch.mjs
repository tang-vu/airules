import { appendFileSync } from "node:fs";

// No registry access: record attempted requests and simulate a newer release.
globalThis.fetch = async (url) => {
  appendFileSync(process.env.AIRULES_TEST_FETCH_LOG, `${url}\n`);
  await new Promise((resolve) => setTimeout(resolve, 20));
  return { ok: true, json: async () => ({ version: "9.9.9" }) };
};
