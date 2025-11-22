import * as net from "net";

export interface PortCheckResult {
  port: number;
  host: string;
  available: boolean;
  responseTime: number;
  error?: string;
}

/**
 * Check if a port is available by attempting to create a server on it.
 * If the server binds successfully, the port is free.
 * If it fails with EADDRINUSE, the port is occupied.
 */
export function isPortAvailable(
  port: number,
  host: string = "127.0.0.1"
): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" || err.code === "EACCES") {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, host);
  });
}

/**
 * Check a port by attempting a TCP connection to it.
 * If the connection succeeds, the port has a service listening.
 * Returns detailed information about the port status.
 */
export function checkPort(
  port: number,
  host: string = "127.0.0.1",
  timeout: number = 2000
): Promise<PortCheckResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const socket = new net.Socket();

    const onError = (err: Error) => {
      socket.destroy();
      resolve({
        port,
        host,
        available: true,
        responseTime: Date.now() - startTime,
        error: err.message,
      });
    };

    socket.setTimeout(timeout);

    socket.once("connect", () => {
      socket.destroy();
      resolve({
        port,
        host,
        available: false,
        responseTime: Date.now() - startTime,
      });
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve({
        port,
        host,
        available: true,
        responseTime: Date.now() - startTime,
        error: "Connection timed out",
      });
    });

    socket.once("error", onError);

    socket.connect(port, host);
  });
}

/**
 * Scan a range of ports with controlled concurrency.
 * Returns an array of results for each port in the range.
 */
export async function scanPorts(
  startPort: number,
  endPort: number,
  host: string = "127.0.0.1",
  timeout: number = 1000,
  concurrency: number = 50
): Promise<PortCheckResult[]> {
  const results: PortCheckResult[] = [];
  const ports: number[] = [];

  for (let p = startPort; p <= endPort; p++) {
    ports.push(p);
  }

  // Process ports in batches for controlled concurrency
  for (let i = 0; i < ports.length; i += concurrency) {
    const batch = ports.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((port) => checkPort(port, host, timeout))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Find N available ports starting from a given port number.
 * Sequentially checks ports until enough free ones are found.
 */
export async function findAvailablePorts(
  count: number,
  startPort: number = 3000,
  endPort: number = 65535,
  host: string = "127.0.0.1"
): Promise<number[]> {
  const available: number[] = [];

  for (let port = startPort; port <= endPort && available.length < count; port++) {
    const isFree = await isPortAvailable(port, host);
    if (isFree) {
      available.push(port);
    }
  }

  return available;
}

/**
 * Find the PID of the process using a given port.
 * Uses platform-specific commands (netstat/lsof).
 */
export async function findProcessOnPort(
  port: number
): Promise<{ pid: number; command?: string } | null> {
  const { execSync } = require("child_process");
  const platform = process.platform;

  try {
    let output: string;

    if (platform === "win32") {
      output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
        encoding: "utf-8",
      }).trim();
      const lines = output.split("\n");
      if (lines.length > 0) {
        const parts = lines[0].trim().split(/\s+/);
        const pid = parseInt(parts[parts.length - 1], 10);
        // Try to get the process name
        try {
          const taskInfo = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
            encoding: "utf-8",
          }).trim();
          const match = taskInfo.match(/"([^"]+)"/);
          return { pid, command: match ? match[1] : undefined };
        } catch {
          return { pid };
        }
      }
    } else {
      // macOS / Linux
      try {
        output = execSync(`lsof -i :${port} -t -sTCP:LISTEN`, {
          encoding: "utf-8",
        }).trim();
        const pid = parseInt(output.split("\n")[0], 10);
        try {
          const cmdOutput = execSync(`ps -p ${pid} -o comm=`, {
            encoding: "utf-8",
          }).trim();
          return { pid, command: cmdOutput };
        } catch {
          return { pid };
        }
      } catch {
        // Fallback to ss on Linux
        output = execSync(
          `ss -tlnp | grep :${port} | grep -oP 'pid=\\K[0-9]+'`,
          { encoding: "utf-8" }
        ).trim();
        if (output) {
          const pid = parseInt(output.split("\n")[0], 10);
          return { pid };
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}
