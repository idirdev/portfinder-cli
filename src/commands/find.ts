import chalk from "chalk";
import { findAvailablePorts } from "../utils/net";
import { formatAvailablePorts, toJson } from "../utils/format";

interface FindOptions {
  start: number;
  end: number;
  host: string;
  json: boolean;
}

/**
 * Find N available (free) ports within a given range.
 * Sequentially tests ports starting from the base port
 * until enough available ports are found.
 */
export async function findCommand(
  count: number,
  options: FindOptions
): Promise<void> {
  const { start, end, host, json } = options;

  if (!json) {
    console.log("");
    console.log(chalk.bold.cyan("  Finding Available Ports"));
    console.log(chalk.gray("  " + "-".repeat(40)));
    console.log(chalk.gray(`  Looking for ${count} available port(s)...`));
    console.log(chalk.gray(`  Range: ${start}-${end} on ${host}`));
    console.log("");
  }

  const startTime = Date.now();
  const ports = await findAvailablePorts(count, start, end, host);
  const elapsed = Date.now() - startTime;

  if (json) {
    const output = {
      requested: count,
      found: ports.length,
      ports,
      range: { start, end },
      host,
      elapsedMs: elapsed,
      foundAt: new Date().toISOString(),
    };
    console.log(toJson(output));
    return;
  }

  console.log(formatAvailablePorts(ports, count));

  if (ports.length > 0) {
    // Show quick-copy format
    console.log(chalk.gray("  Quick copy:"));
    if (ports.length === 1) {
      console.log(chalk.white(`  PORT=${ports[0]}`));
    } else {
      console.log(chalk.white(`  PORTS=${ports.join(",")}`));
    }
    console.log("");

    // Show usage suggestion
    console.log(chalk.gray("  Usage example:"));
    console.log(
      chalk.gray(`  $ your-server --port ${ports[0]}`)
    );
    console.log("");
  }

  console.log(chalk.gray(`  Completed in ${elapsed}ms`));
  console.log("");
}
