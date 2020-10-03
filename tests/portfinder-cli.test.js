'use strict';

/**
 * @file portfinder-cli.test.js
 * @description Tests for portfinder-cli: isPortFree, findFreePort, findFreePorts, getUsedPorts.
 * @author idirdev
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const net = require('net');
const { isPortFree, findFreePort, findFreePorts, getUsedPorts } = require('../src/index');

/** Port we deliberately occupy for testing */
const OCCUPIED_PORT = 47321;

/** @type {net.Server} */
let occupiedServer;

before(async () => {
  await new Promise((resolve, reject) => {
    occupiedServer = net.createServer();
    occupiedServer.once('error', reject);
    occupiedServer.once('listening', resolve);
    occupiedServer.listen(OCCUPIED_PORT, '0.0.0.0');
  });
});

after(async () => {
  await new Promise((resolve) => occupiedServer.close(resolve));
});

describe('portfinder-cli', () => {
  // -- isPortFree -----------------------------------------------------------

  it('isPortFree returns false for an occupied port', async () => {
    const result = await isPortFree(OCCUPIED_PORT);
    assert.equal(result, false);
  });

  it('isPortFree returns true for an unused high port', async () => {
    const result = await isPortFree(47399);
    assert.equal(result, true);
  });

  it('isPortFree returns a boolean', async () => {
    const result = await isPortFree(47400);
    assert.equal(typeof result, 'boolean');
  });

  // -- findFreePort ---------------------------------------------------------

  it('findFreePort resolves to a number', async () => {
    const port = await findFreePort(47100);
    assert.equal(typeof port, 'number');
  });

  it('findFreePort returns a port >= startPort', async () => {
    const port = await findFreePort(47100);
    assert.ok(port >= 47100, 'port should be >= startPort');
  });

  it('findFreePort skips occupied port', async () => {
    // OCCUPIED_PORT is taken; starting just below it should jump past it
    const port = await findFreePort(OCCUPIED_PORT);
    assert.ok(port !== OCCUPIED_PORT, 'should not return the occupied port');
  });

  // -- findFreePorts --------------------------------------------------------

  it('findFreePorts returns the requested number of ports', async () => {
    const ports = await findFreePorts(3, 47200);
    assert.equal(ports.length, 3);
  });

  it('findFreePorts ports are in ascending order', async () => {
    const ports = await findFreePorts(3, 47210);
    assert.ok(ports[0] < ports[1], 'first < second');
    assert.ok(ports[1] < ports[2], 'second < third');
  });

  it('findFreePorts all ports are free (verify each)', async () => {
    const ports = await findFreePorts(2, 47220);
    for (const p of ports) {
      const free = await isPortFree(p);
      assert.equal(free, true, 'port ' + p + ' should be free after findFreePorts');
    }
  });

  // -- getUsedPorts ---------------------------------------------------------

  it('getUsedPorts returns an array', async () => {
    const used = await getUsedPorts(47320, 47325);
    assert.ok(Array.isArray(used));
  });

  it('getUsedPorts detects the occupied port', async () => {
    const used = await getUsedPorts(OCCUPIED_PORT, OCCUPIED_PORT);
    assert.ok(used.includes(OCCUPIED_PORT), 'occupied port should appear in used list');
  });
});
