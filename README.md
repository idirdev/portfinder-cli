# portfinder-cli

> **[EN]** A fast CLI tool to find free ports on your machine, check port availability, and list currently used ports in a given range.
> **[FR]** Un outil CLI rapide pour trouver des ports libres sur votre machine, vérifier la disponibilité d'un port et lister les ports utilisés dans une plage donnée.

---

## Features / Fonctionnalités

**[EN]**
- Find the next available (free) port starting from a given number
- Find multiple free ports at once with a single command
- Check whether a specific port is free or in use
- Scan a range to list all currently used ports
- Configurable host binding (default: 0.0.0.0)
- Lightweight, zero external dependencies

**[FR]**
- Trouver le prochain port disponible à partir d'un numéro donné
- Trouver plusieurs ports libres en une seule commande
- Vérifier si un port spécifique est libre ou occupé
- Scanner une plage pour lister tous les ports actuellement utilisés
- Liaison d'hôte configurable (défaut : 0.0.0.0)
- Léger, aucune dépendance externe

---

## Installation

```bash
npm install -g @idirdev/portfinder-cli
```

---

## CLI Usage / Utilisation CLI

```bash
# Find next free port starting at 3000 (default)
# Trouver le prochain port libre à partir de 3000 (défaut)
portfinder

# Find a free port starting at 8000
# Trouver un port libre à partir de 8000
portfinder --start 8000

# Find 3 consecutive free ports starting at 4000
# Trouver 3 ports libres consécutifs à partir de 4000
portfinder --start 4000 --count 3

# Scan ports 1–1024 and list which ones are in use
# Scanner les ports 1–1024 et lister ceux qui sont utilisés
portfinder --scan 1-1024

# Show help / Afficher l'aide
portfinder --help
```

### Example Output / Exemple de sortie

```
$ portfinder --start 3000 --count 3
3001
3004
3007

$ portfinder --scan 1-1024
Used ports (1-1024): 6
  22
  80
  443
  631
  8080
  9090
```

---

## API (Programmatic) / API (Programmation)

**[EN]** Use portfinder-cli as a library in your Node.js project.
**[FR]** Utilisez portfinder-cli comme bibliothèque dans votre projet Node.js.

```javascript
const { isPortFree, findFreePort, findFreePorts, getUsedPorts } = require('@idirdev/portfinder-cli');

// Check if port 3000 is available
// Vérifier si le port 3000 est disponible
const free = await isPortFree(3000);
console.log(free); // true or false

// Find first free port at or after 3000
// Trouver le premier port libre à partir de 3000
const port = await findFreePort(3000);
console.log(port); // 3001

// Find 4 free ports starting at 5000
// Trouver 4 ports libres à partir de 5000
const ports = await findFreePorts(4, 5000);
console.log(ports); // [5000, 5001, 5002, 5003]

// Get all used ports between 1 and 1024
// Obtenir tous les ports utilisés entre 1 et 1024
const used = await getUsedPorts(1, 1024);
console.log(used); // [22, 80, 443, ...]
```

### API Reference

| Function | Parameters | Returns |
|----------|-----------|---------|
| `isPortFree(port, host?)` | port number, optional host | `Promise<boolean>` |
| `findFreePort(start?, end?, host?)` | start (def: 3000), end (def: 65535), host | `Promise<number>` |
| `findFreePorts(count, start?, end?, host?)` | count, start, end, host | `Promise<number[]>` |
| `getUsedPorts(start?, end?, host?)` | start (def: 1), end (def: 1024), host | `Promise<number[]>` |

---

## License

MIT - idirdev
