import chalk from "chalk";

export const ok = chalk.green("✓");
export const warn = chalk.yellow("⚠");
export const fail = chalk.red("✗");
export const info = chalk.blue("ℹ");

export function heading(text: string): string {
  return chalk.bold.underline(text);
}

export function dim(text: string): string {
  return chalk.dim(text);
}

export function errorBox(message: string, suggestion?: string): void {
  console.error("");
  console.error(`  ${fail} ${chalk.red.bold("Error:")} ${message}`);
  if (suggestion) {
    console.error(`  ${info} ${chalk.dim(suggestion)}`);
  }
  console.error("");
}

export function successBox(message: string): void {
  console.log(`  ${ok} ${message}`);
}

export function warnBox(message: string): void {
  console.log(`  ${warn} ${message}`);
}
