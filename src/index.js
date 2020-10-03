'use strict';

/**
 * @module portfinder-cli
 * @description Find free TCP ports on the local system using net.Server probes.
 * @author idirdev
 */

const net = require('net');

/**
 * Test whether a given TCP port is free by attempting to bind a net.Server.
 *
 * @param {number} port - The port number to test (1–65535).
 * @param {string} [host='0.0.0.0'] - The host address to bind on.
 * @returns {Promise<boolean>} Resolves to true if the port is free, false otherwise.
 */
function isPortFree(port, host) {
  host = host || '0.0.0.0';
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

/**
 * Find the first free TCP port starting from `startPort`.
 *
 * @param {number} [startPort=3000] - Port to begin scanning from.
 * @param {number} [endPort=65535]  - Port to stop scanning at (inclusive).
 * @param {string} [host='0.0.0.0'] - Host address to test against.
 * @returns {Promise<number>} Resolves with the first free port found.
 * @throws {Error} If no free port is found within the range.
 */
async function findFreePort(startPort, endPort, host) {
  startPort = startPort || 3000;
  endPort = endPort || 65535;
  host = host || '0.0.0.0';

  for (let port = startPort; port <= endPort; port++) {
    if (await isPortFree(port, host)) {
      return port;
    }
  }

  throw new Error(
    'No free port found in range ' + startPort + '-' + endPort
  );
}

/**
 * Find N consecutive-or-scattered free TCP ports.
 *
 * @param {number} count           - Number of free ports to locate.
 * @param {number} [startPort=3000] - Port to begin scanning from.
 * @param {number} [endPort=65535]  - Maximum port to scan.
 * @param {string} [host='0.0.0.0'] - Host address to test against.
 * @returns {Promise<number[]>} Resolves with an array of `count` free port numbers.
 * @throws {Error} If not enough free ports can be found.
 */
async function findFreePorts(count, startPort, endPort, host) {
  if (!count || count < 1) {
    throw new Error('count must be a positive integer');
  }

  startPort = startPort || 3000;
  endPort = endPort || 65535;
  host = host || '0.0.0.0';

  const ports = [];
  let cursor = startPort;

  for (let i = 0; i < count; i++) {
    const port = await findFreePort(cursor, endPort, host);
    ports.push(port);
    cursor = port + 1;
  }

  return ports;
}

/**
 * Scan a port range and return all ports that are currently in use.
 *
 * @param {number} [rangeStart=1]    - First port to check.
 * @param {number} [rangeEnd=1024]   - Last port to check (inclusive).
 * @param {string} [host='0.0.0.0']  - Host address to test against.
 * @returns {Promise<number[]>} Resolves with an array of occupied port numbers.
 */
async function getUsedPorts(rangeStart, rangeEnd, host) {
  rangeStart = rangeStart || 1;
  rangeEnd = rangeEnd || 1024;
  host = host || '0.0.0.0';

  const used = [];

  for (let port = rangeStart; port <= rangeEnd; port++) {
    const free = await isPortFree(port, host);
    if (!free) {
      used.push(port);
    }
  }

  return used;
}

module.exports = {
  isPortFree,
  findFreePort,
  findFreePorts,
  getUsedPorts,
};
