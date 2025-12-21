# 🔌 PortFinder CLI

A powerful command-line tool for port discovery and management. Check port availability, scan ranges, find free ports, and kill processes occupying them.

## Installation

```bash
npm install -g @idirdev/portfinder-cli
```

## Usage

### Check a port

```bash
portfinder check 3000
portfinder check 8080 --host 0.0.0.0 --timeout 5000
portfinder check 443 --json
```

### Scan a port range

```bash
portfinder scan 3000-3100
portfinder scan 8000-9000 --concurrency 100 --open
portfinder scan 1-1024 --json
```

### Find available ports

```bash
portfinder find 5
portfinder find 3 --start 8000 --end 9000
portfinder find --json
```

### Kill a process on a port

```bash
portfinder kill 3000
portfinder kill 8080 --force
portfinder kill 4000 --yes
```

## Options

| Command | Flag | Description |
|---------|------|-------------|
| `check` | `--host` | Host address (default: 127.0.0.1) |
| `check` | `--timeout` | Timeout in ms (default: 2000) |
| `scan` | `--concurrency` | Parallel checks (default: 50) |
| `scan` | `--open` | Show only available ports |
| `scan` | `--closed` | Show only in-use ports |
| `kill` | `--force` | Send SIGKILL instead of SIGTERM |
| `kill` | `--yes` | Skip confirmation prompt |
| all | `--json` | JSON output |

## License

MIT
