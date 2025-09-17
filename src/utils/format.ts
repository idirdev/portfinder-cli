import chalk from "chalk";
import { PortCheckResult } from "./net";

/**
 * Format a single port check result for terminal output.
 */
export function formatPortStatus(result: PortCheckResult): string {
  const statusIcon = result.available
    ? chalk.green("  OPEN")
    : chalk.red("  IN USE");

  const portDisplay = chalk.bold.white(`:${result.port}`);
  const hostDisplay = chalk.gray(`(${result.host})`);
  const timeDisplay = chalk.gray(`${result.responseTime}ms`);

  let line = `${statusIcon} ${portDisplay} ${hostDisplay} ${timeDisplay}`;

  if (result.error && result.available) {
    line += chalk.dim(` - ${result.error}`);
  }

  return line;
}

/**
 * Format a table header for scan results.
 */
export function formatScanHeader(
  startPort: number,
  endPort: number,
  host: string
): string {
  const total = endPort - startPort + 1;
  const lines = [
    "",
    chalk.bold.cyan("  Port Scan Results"),
    chalk.gray(`  Host: ${host} | Range: ${startPort}-${endPort} | Total: ${total} ports`),
    chalk.gray("  " + "-".repeat(56)),
    "",
  ];
  return lines.join("\n");
}

/**
 * Format scan results as a compact table.
 */
export function formatScanResults(
  results: PortCheckResult[],
  options: { showOpen?: boolean; showClosed?: boolean } = {}
): string {
  let filtered = results;

  if (options.showOpen && !options.showClosed) {
    filtered = results.filter((r) => r.available);
  } else if (options.showClosed && !options.showOpen) {
    filtered = results.filter((r) => !r.available);
  }

  if (filtered.length === 0) {
    return chalk.yellow("  No ports match the filter criteria.\n");
  }

  const lines: string[] = [];
  const openCount = results.filter((r) => r.available).length;
  const closedCount = results.filter((r) => !r.available).length;

  // Column header
  lines.push(
    chalk.gray(
      `  ${"PORT".padEnd(10)} ${"STATUS".padEnd(12)} ${"RESPONSE".padEnd(12)}`
    )
  );
  lines.push(chalk.gray("  " + "-".repeat(34)));

  for (const result of filtered) {
    const port = String(result.port).padEnd(10);
    const status = result.available
      ? chalk.green("AVAILABLE".padEnd(12))
      : chalk.red("IN USE".padEnd(12));
    const time = chalk.gray(`${result.responseTime}ms`.padEnd(12));
    lines.push(`  ${port} ${status} ${time}`);
  }

  lines.push("");
  lines.push(chalk.gray("  " + "-".repeat(34)));
  lines.push(
    `  ${chalk.green(`${openCount} available`)} | ${chalk.red(`${closedCount} in use`)} | ${chalk.gray(`${results.length} total`)}`
  );
  lines.push("");

  return lines.join("\n");
}

/**
 * Format the result of finding available ports.
 */
export function formatAvailablePorts(ports: number[], requested: number): string {
  if (ports.length === 0) {
    return chalk.red("\n  No available ports found in the specified range.\n");
  }

  const lines: string[] = [
    "",
    chalk.bold.cyan("  Available Ports"),
    chalk.gray("  " + "-".repeat(30)),
  ];

  for (let i = 0; i < ports.length; i++) {
    lines.push(`  ${chalk.green(`${i + 1}.`)} ${chalk.bold.white(`:${ports[i]}`)}`);
  }

  if (ports.length < requested) {
    lines.push("");
    lines.push(
      chalk.yellow(
        `  Warning: Only found ${ports.length} of ${requested} requested ports.`
      )
    );
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Format process info for the kill command.
 */
export function formatProcessInfo(
  port: number,
  pid: number,
  command?: string
): string {
  const lines = [
    "",
    chalk.bold.cyan("  Process on Port"),
    chalk.gray("  " + "-".repeat(30)),
    `  ${chalk.gray("Port:")}    ${chalk.bold.white(`:${port}`)}`,
    `  ${chalk.gray("PID:")}     ${chalk.bold.yellow(String(pid))}`,
  ];

  if (command) {
    lines.push(`  ${chalk.gray("Command:")} ${chalk.white(command)}`);
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Convert any result to JSON string output.
 */
export function toJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Display a progress indicator for long-running scans.
 */
export function progressBar(
  current: number,
  total: number,
  width: number = 30
): string {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  const bar =
    chalk.green("=".repeat(filled)) + chalk.gray("-".repeat(empty));
  return `  [${bar}] ${percentage}% (${current}/${total})`;
}
