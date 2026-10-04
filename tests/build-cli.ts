import { build } from "tsup";

export default async function setup(): Promise<void> {
  // Use the shipping build and real package layout, including updater metadata.
  await build({ config: "tsup.config.ts", silent: true });
}
