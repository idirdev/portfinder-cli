#!/usr/bin/env node
'use strict';

/**
 * @file cli.js
 * @description CLI for portfinder-cli — find free TCP ports on the system.
 * @author idirdev
 * @usage portfinder [--start 3000] [--count 5] [--range 8000-9000] [--json]
 */

const { findFreePorts, getUsedPorts } = require('../src/index');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log([
    'Usage: portfinder [options]',
    '',
    'Options:',
    '  --start <port>        Starting port for search (default: 3000)',
    '  --count <n>           Number of free ports to find (default: 1)',
    '  --range <start-end>   Scan range for used ports (e.g. 8000-9000)',
    '  --json                Output results as JSON',
    '  -h, --help            Show this help message',
  ].join('\n'));
  process.exit(0);
}

/** @param {string} flag @returns {string|undefined} */
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const json = args.includes('--json');
const startArg = getArg('--start');
const countArg = getArg('--count');
const rangeArg = getArg('--range');

const start = startArg ? parseInt(startArg, 10) : 3000;
const count = countArg ? parseInt(countArg, 10) : 1;

if (rangeArg) {
  const parts = rangeArg.split('-').map(Number);
  const rangeStart = parts[0];
  const rangeEnd = parts[1];

  if (isNaN(rangeStart) || isNaN(rangeEnd) || rangeStart > rangeEnd) {
    console.error('Error: invalid --range value, expected format start-end (e.g. 8000-9000)');
    process.exit(1);
  }

  getUsedPorts(rangeStart, rangeEnd)
    .then((used) => {
      if (json) {
        console.log(JSON.stringify({ range: rangeArg, usedPorts: used, count: used.length }));
      } else {
        console.log('Used ports in range ' + rangeStart + '-' + rangeEnd + ': ' + used.length);
        used.forEach((p) => console.log('  ' + p));
      }
    })
    .catch((err) => {
      console.error('Error: ' + err.message);
      process.exit(1);
    });
} else {
  if (isNaN(start) || start < 1 || start > 65535) {
    console.error('Error: --start must be a valid port number (1-65535)');
    process.exit(1);
  }

  findFreePorts(count, start)
    .then((ports) => {
      if (json) {
        console.log(JSON.stringify({ freePorts: ports }));
      } else {
        ports.forEach((p) => console.log(p));
      }
    })
    .catch((err) => {
      console.error('Error: ' + err.message);
      process.exit(1);
    });
}
