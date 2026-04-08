import ora, { type Ora } from "ora";

// biome-ignore lint/complexity/useLiteralKeys: TypeScript strict mode requires bracket notation for index signatures
const noColor = Boolean(process.env["NO_COLOR"]);

export function createSpinner(text: string): Ora {
  const spinner = ora({
    text,
    color: "cyan",
  });

  if (noColor) {
    spinner.color = "white" as never;
  }

  return spinner;
}
