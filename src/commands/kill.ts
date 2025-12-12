import chalk from "chalk";
import * as readline from "readline";
import { findProcessOnPort } from "../utils/net";
import { formatProcessInfo } from "../utils/format";

interface KillOptions {
  force: boolean;
  skipConfirm: boolean;
}

/**
 * Prompt the user for yes/no confirmation.
 */
function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

/**
 * Kill the process that is listening on a specific port.
 * Supports both SIGTERM (graceful) and SIGKILL (force) modes.
 * On Windows, uses taskkill; on Unix, uses kill command.
 */
export async function killCommand(
  port: number,
  options: KillOptions
): Promise<void> {
  const { force, skipConfirm } = options;

  console.log("");
  console.log(chalk.bold.cyan("  Kill Process on Port"));
  console.log(chalk.gray("  " + "-".repeat(40)));

  // Find the process using this port
  const processInfo = await findProcessOnPort(port);

  if (!processInfo) {
    console.log(
      chalk.yellow(`\n  No process found listening on port ${port}.`)
    );
    console.log(chalk.gray("  The port appears to be available.\n"));
    return;
  }

  const { pid, command } = processInfo;

  console.log(formatProcessInfo(port, pid, command));

  // Confirm unless --yes flag is set
  if (!skipConfirm) {
    const signal = force ? "SIGKILL (force)" : "SIGTERM (graceful)";
    const shouldProceed = await confirm(
      chalk.yellow(
        `  Kill PID ${pid} with ${signal}? [y/N] `
      )
    );

    if (!shouldProceed) {
      console.log(chalk.gray("\n  Aborted. No process was killed.\n"));
      return;
    }
  }

  // Kill the process
  try {
    const { execSync } = require("child_process");
    const platform = process.platform;

    if (platform === "win32") {
      const forceFlag = force ? "/F" : "";
      execSync(`taskkill /PID ${pid} ${forceFlag}`.trim(), {
        stdio: "pipe",
      });
    } else {
      const signal = force ? "SIGKILL" : "SIGTERM";
      process.kill(pid, signal);
    }

    console.log("");
    console.log(
      chalk.green.bold(`  Successfully killed process ${pid} on port ${port}.`)
    );

    if (!force) {
      console.log(
        chalk.gray(
          "  Sent SIGTERM. Use --force for immediate termination."
        )
      );
    }
    console.log("");
  } catch (err: any) {
    console.log("");
    if (err.code === "EPERM") {
      console.log(
        chalk.red.bold("  Permission denied.") +
          chalk.gray(" Try running with elevated privileges (sudo / admin).")
      );
    } else if (err.code === "ESRCH") {
      console.log(
        chalk.yellow(
          `  Process ${pid} has already exited.`
        )
      );
    } else {
      console.log(
        chalk.red(`  Failed to kill process: ${err.message}`)
      );
    }
    console.log("");
    process.exit(1);
  }
}
