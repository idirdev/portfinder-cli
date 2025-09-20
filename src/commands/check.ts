import chalk from "chalk";
import { checkPort, isPortAvailable } from "../utils/net";
import { formatPortStatus, toJson } from "../utils/format";

interface CheckOptions {
  host: string;
  timeout: number;
  json: boolean;
}

/**
 * Check if a specific port is available or in use.
 * Performs both a server-bind test and a TCP connection test
 * to give the most accurate result possible.
 */
export async function checkCommand(
  port: number,
  options: CheckOptions
): Promise<void> {
  const { host, timeout, json } = options;

  if (json) {
    // For JSON output, run both checks silently
    const bindAvailable = await isPortAvailable(port, host);
    const connectResult = await checkPort(port, host, timeout);

    const result = {
      port,
      host,
      available: bindAvailable,
      connectTest: {
        available: connectResult.available,
        responseTime: connectResult.responseTime,
        error: connectResult.error || null,
      },
      checkedAt: new Date().toISOString(),
    };

    console.log(toJson(result));
    return;
  }

  console.log("");
  console.log(chalk.bold.cyan("  Port Check"));
  console.log(chalk.gray("  " + "-".repeat(40)));
  console.log(chalk.gray(`  Target: ${host}:${port}`));
  console.log(chalk.gray(`  Timeout: ${timeout}ms`));
  console.log("");

  // Test 1: Bind test (can we create a server on this port?)
  process.stdout.write(chalk.gray("  Bind test...       "));
  const bindAvailable = await isPortAvailable(port, host);
  if (bindAvailable) {
    console.log(chalk.green("AVAILABLE"));
  } else {
    console.log(chalk.red("IN USE"));
  }

  // Test 2: Connect test (is something listening on this port?)
  process.stdout.write(chalk.gray("  Connect test...    "));
  const connectResult = await checkPort(port, host, timeout);
  if (connectResult.available) {
    console.log(chalk.green("NO SERVICE") + chalk.gray(` (${connectResult.responseTime}ms)`));
  } else {
    console.log(chalk.red("SERVICE FOUND") + chalk.gray(` (${connectResult.responseTime}ms)`));
  }

  console.log("");

  // Summary
  if (bindAvailable && connectResult.available) {
    console.log(
      chalk.green.bold(`  Port ${port} is AVAILABLE`) +
        chalk.gray(" - Nothing is using this port.")
    );
  } else if (!bindAvailable && !connectResult.available) {
    console.log(
      chalk.red.bold(`  Port ${port} is IN USE`) +
        chalk.gray(" - A service is actively listening.")
    );
  } else if (!bindAvailable && connectResult.available) {
    console.log(
      chalk.yellow.bold(`  Port ${port} is RESERVED`) +
        chalk.gray(" - Bound but not accepting connections.")
    );
  } else {
    console.log(
      chalk.yellow.bold(`  Port ${port} has MIXED status`) +
        chalk.gray(" - Connect succeeded but bind also succeeded (race condition).")
    );
  }

  console.log("");
}
