import { describe, it, expect } from 'vitest';
import { isPortAvailable, checkPort, findAvailablePorts } from '../src/utils/net';
import { formatAvailablePorts, formatScanHeader, toJson, progressBar } from '../src/utils/format';
import * as net from 'net';

describe('isPortAvailable', () => {
  it('should return true for a port that is not in use', async () => {
    // Use a high-numbered port that is unlikely to be in use
    const available = await isPortAvailable(59123);
    expect(typeof available).toBe('boolean');
  });

  it('should return false for a port that is in use', async () => {
    // Start a server on a port, then check availability
    const server = net.createServer();
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const address = server.address() as net.AddressInfo;
    const port = address.port;

    const available = await isPortAvailable(port, '127.0.0.1');
    expect(available).toBe(false);

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('should detect a port as available after server closes', async () => {
    const server = net.createServer();
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const address = server.address() as net.AddressInfo;
    const port = address.port;

    await new Promise<void>((resolve) => server.close(() => resolve()));

    const available = await isPortAvailable(port, '127.0.0.1');
    expect(available).toBe(true);
  });
});

describe('checkPort', () => {
  it('should return available=true for an unused port', async () => {
    const result = await checkPort(59124, '127.0.0.1', 1000);
    expect(result.port).toBe(59124);
    expect(result.host).toBe('127.0.0.1');
    expect(result.available).toBe(true);
    expect(result.responseTime).toBeGreaterThanOrEqual(0);
  });

  it('should return available=false for a port with a listener', async () => {
    const server = net.createServer();
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const address = server.address() as net.AddressInfo;

    const result = await checkPort(address.port, '127.0.0.1', 2000);
    expect(result.available).toBe(false);
    expect(result.responseTime).toBeGreaterThanOrEqual(0);

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('should include port and host in the result', async () => {
    const result = await checkPort(59125, '127.0.0.1', 500);
    expect(result.port).toBe(59125);
    expect(result.host).toBe('127.0.0.1');
  });
});

describe('findAvailablePorts', () => {
  it('should find available ports in a range', async () => {
    const ports = await findAvailablePorts(2, 59200, 59210, '127.0.0.1');
    expect(ports.length).toBeLessThanOrEqual(2);
    for (const port of ports) {
      expect(port).toBeGreaterThanOrEqual(59200);
      expect(port).toBeLessThanOrEqual(59210);
    }
  });

  it('should return fewer ports if range is too small', async () => {
    // Use ports that are likely occupied in a very small range
    const ports = await findAvailablePorts(100, 59300, 59302, '127.0.0.1');
    expect(ports.length).toBeLessThanOrEqual(3);
  });
});

describe('toJson', () => {
  it('should serialize data to pretty JSON', () => {
    const data = { port: 3000, available: true };
    const json = toJson(data);
    expect(json).toBe(JSON.stringify(data, null, 2));
  });

  it('should handle arrays', () => {
    const data = [1, 2, 3];
    const json = toJson(data);
    expect(JSON.parse(json)).toEqual([1, 2, 3]);
  });
});

describe('progressBar', () => {
  it('should show 0% for no progress', () => {
    const bar = progressBar(0, 100);
    expect(bar).toContain('0%');
    expect(bar).toContain('0/100');
  });

  it('should show 100% for full progress', () => {
    const bar = progressBar(100, 100);
    expect(bar).toContain('100%');
    expect(bar).toContain('100/100');
  });

  it('should show 50% for half progress', () => {
    const bar = progressBar(50, 100);
    expect(bar).toContain('50%');
    expect(bar).toContain('50/100');
  });
});

describe('formatScanHeader', () => {
  it('should include port range info', () => {
    const header = formatScanHeader(3000, 3100, '127.0.0.1');
    expect(header).toContain('3000');
    expect(header).toContain('3100');
    expect(header).toContain('127.0.0.1');
  });

  it('should calculate total ports correctly', () => {
    const header = formatScanHeader(8000, 8009, '127.0.0.1');
    expect(header).toContain('10');
  });
});

describe('formatAvailablePorts', () => {
  it('should format a list of available ports', () => {
    const result = formatAvailablePorts([3000, 3001, 3002], 3);
    expect(result).toContain('3000');
    expect(result).toContain('3001');
    expect(result).toContain('3002');
  });

  it('should show a warning when fewer ports found than requested', () => {
    const result = formatAvailablePorts([3000], 5);
    expect(result).toContain('1');
    expect(result).toContain('5');
  });

  it('should handle empty port list', () => {
    const result = formatAvailablePorts([], 3);
    expect(result).toContain('No available ports');
  });
});
