#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { checkCommand } from "./commands/check";
import { scanCommand } from "./commands/scan";
import { findCommand } from "./commands/find";
import { killCommand } from "./commands/kill";

const program = new Command();

program
  .name("portfinder")
  .description(
    chalk.bold("A powerful CLI tool for port discovery and management")
  )
  .version("1.0.0", "-v, --version", "Display the current version");

program
  .command("check")
  .description("Check if a specific port is available or in use")
  .argument("<port>", "Port number to check (1-65535)")
  .option("-h, --host <host>", "Host address to check", "127.0.0.1")
  .option("-t, --timeout <ms>", "Connection timeout in milliseconds", "2000")
  .option("--json", "Output result as JSON")
  .action(async (port: string, options) => {
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      console.error(chalk.red("Error: Port must be a number between 1 and 65535"));
      process.exit(1);
    }
    await checkCommand(portNum, {
      host: options.host,
      timeout: parseInt(options.timeout, 10),
      json: options.json ?? false,
    });
  });

program
  .command("scan")
  .description("Scan a range of ports to find which are open or closed")
  .argument("<range>", "Port range to scan (e.g. 3000-3100)")
  .option("-h, --host <host>", "Host address to scan", "127.0.0.1")
  .option("-t, --timeout <ms>", "Connection timeout per port in ms", "1000")
  .option("-c, --concurrency <n>", "Number of concurrent checks", "50")
  .option("--open", "Show only open ports")
  .option("--closed", "Show only closed ports")
  .option("--json", "Output results as JSON")
  .action(async (range: string, options) => {
    const match = range.match(/^(\d+)-(\d+)$/);
    if (!match) {
      console.error(chalk.red("Error: Range must be in format START-END (e.g. 3000-3100)"));
      process.exit(1);
    }
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    if (start < 1 || end > 65535 || start > end) {
      console.error(chalk.red("Error: Invalid port range. Must be 1-65535 with start <= end"));
      process.exit(1);
    }
    await scanCommand(start, end, {
      host: options.host,
      timeout: parseInt(options.timeout, 10),
      concurrency: parseInt(options.concurrency, 10),
      showOpen: options.open ?? false,
      showClosed: options.closed ?? false,
      json: options.json ?? false,
    });
  });

program
  .command("find")
  .description("Find N available (free) ports starting from a base port")
  .argument("[count]", "Number of available ports to find", "1")
  .option("-s, --start <port>", "Starting port number", "3000")
  .option("-e, --end <port>", "Ending port number", "65535")
  .option("-h, --host <host>", "Host address to check", "127.0.0.1")
  .option("--json", "Output results as JSON")
  .action(async (count: string, options) => {
    const n = parseInt(count, 10);
    const start = parseInt(options.start, 10);
    const end = parseInt(options.end, 10);
    if (isNaN(n) || n < 1) {
      console.error(chalk.red("Error: Count must be a positive number"));
      process.exit(1);
    }
    await findCommand(n, {
      start,
      end,
      host: options.host,
      json: options.json ?? false,
    });
  });

program
  .command("kill")
  .description("Kill the process listening on a specific port")
  .argument("<port>", "Port number whose process to kill")
  .option("-f, --force", "Force kill (SIGKILL instead of SIGTERM)", false)
  .option("-y, --yes", "Skip confirmation prompt", false)
  .action(async (port: string, options) => {
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      console.error(chalk.red("Error: Port must be a number between 1 and 65535"));
      process.exit(1);
    }
    await killCommand(portNum, {
      force: options.force,
      skipConfirm: options.yes,
    });
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
