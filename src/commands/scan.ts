import chalk from "chalk";
import { scanPorts, PortCheckResult } from "../utils/net";
import {
  formatScanHeader,
  formatScanResults,
  progressBar,
  toJson,
} from "../utils/format";

interface ScanOptions {
  host: string;
  timeout: number;
  concurrency: number;
  showOpen: boolean;
  showClosed: boolean;
  json: boolean;
}

/**
 * Scan a range of ports to discover which are open and which are in use.
 * Uses concurrent checking with configurable batch size for speed.
 */
export async function scanCommand(
  startPort: number,
  endPort: number,
  options: ScanOptions
): Promise<void> {
  const { host, timeout, concurrency, showOpen, showClosed, json } = options;
  const totalPorts = endPort - startPort + 1;

  if (!json) {
    console.log(formatScanHeader(startPort, endPort, host));
    console.log(
      chalk.gray(
        `  Scanning ${totalPorts} ports with concurrency ${concurrency}...`
      )
    );
    console.log("");
  }

  const startTime = Date.now();
  const allResults: PortCheckResult[] = [];
  const ports: number[] = [];

  for (let p = startPort; p <= endPort; p++) {
    ports.push(p);
  }

  // Process in batches with progress reporting
  for (let i = 0; i < ports.length; i += concurrency) {
    const batch = ports.slice(i, i + concurrency);
    const batchPromises = batch.map((port) => {
      const net = require("../utils/net");
      return net.checkPort(port, host, timeout);
    });

    const batchResults: PortCheckResult[] = await Promise.all(batchPromises);
    allResults.push(...batchResults);

    // Update progress (only in non-JSON mode)
    if (!json && totalPorts > concurrency) {
      const completed = Math.min(i + concurrency, totalPorts);
      process.stdout.write(`\r${progressBar(completed, totalPorts)}`);
    }
  }

  const elapsed = Date.now() - startTime;

  if (!json && totalPorts > concurrency) {
    process.stdout.write("\r" + " ".repeat(60) + "\r");
  }

  // Sort results by port number
  allResults.sort((a, b) => a.port - b.port);

  if (json) {
    const openPorts = allResults.filter((r) => !r.available);
    const output = {
      host,
      range: { start: startPort, end: endPort },
      totalScanned: totalPorts,
      openPorts: openPorts.map((r) => ({
        port: r.port,
        responseTime: r.responseTime,
      })),
      availablePorts: allResults.filter((r) => r.available).length,
      inUsePorts: openPorts.length,
      elapsedMs: elapsed,
      scannedAt: new Date().toISOString(),
    };
    console.log(toJson(output));
    return;
  }

  console.log(formatScanResults(allResults, { showOpen, showClosed }));

  // Performance summary
  const portsPerSec = Math.round((totalPorts / elapsed) * 1000);
  console.log(
    chalk.gray(
      `  Completed in ${elapsed}ms (${portsPerSec} ports/sec)`
    )
  );
  console.log("");
}
