# VPN Node v2 Admin

A React + TypeScript admin panel for the `vpn_node_v2` single-node manager.

Manages **configs**, **subscriptions**, and the **assignment of configs to
subscriptions** through the node's management API.

## Requirements

- Node.js >= 20
- npm

## Development

1. Start the `vpn_node_v2` backend (exposes `http://localhost:8080`).
2. Copy the example env and adjust if needed:

   ```bash
   cp .env.example .env
   ```

3. Install and run:

   ```bash
   npm install --legacy-peer-deps
   npm run dev
   ```

Open http://localhost:5173. Log in with the `ADMIN_USERNAME` / `ADMIN_PASSWORD`
configured in the node's `.env`.

## Build

```bash
npm run build     # production bundle in dist/
npm run preview   # serve the dist locally
```

## Linting & Formatting

```bash
npm run lint      # eslint + type checks via tsconfig
npm run lint:fix  # auto-fix
npm run format    # prettier
```

## Deployment (Vercel)

1. Ensure `npm run build` works locally (it does).
2. Add a `vercel.json` (already included) for SPA fallback routing.
3. In the Vercel project settings, set the build command to `npm run build` and the
   output directory to `dist`.
4. **Set the environment variable `VITE_API_ORIGIN`** to the node's public API origin
   (e.g. `https://second.vpnapk.org`). In production the admin app makes absolute
   requests to `${VITE_API_ORIGIN}/api/v1/...`, so this must be the real node URL
   (not `localhost`). The Vite dev proxy is only used for local development.

## API

The panel talks to these endpoints on the node (all under `/api/v1`):

| Resource       | Method   | Path                                   | Auth       |
| -------------- | -------- | -------------------------------------- | ---------- |
| Admin login    | POST     | `/admin/login`                         | none (creds) |
| Config list    | GET      | `/config/list`                         | Bearer JWT |
| Config get     | GET      | `/config/:uuid`                        | Bearer JWT |
| Config create  | POST     | `/config/create`                       | Bearer JWT |
| Config XHTTP   | POST     | `/config/create-xhttp`               | Bearer JWT |
| Config disable | PATCH    | `/config/disable`                      | Bearer JWT |
| Config enable  | PATCH    | `/config/enable`                       | Bearer JWT |
| Config quota+  | PATCH    | `/config/increase`                     | Bearer JWT |
| Conn limit     | PATCH    | `/config/connection-allowed`           | Bearer JWT |
| Config delete  | DELETE   | `/config/delete`                       | Bearer JWT |
| Sub list       | GET      | `/subscription/list`                   | Bearer JWT |
| Sub get        | GET      | `/subscription/:uuid`                  | Bearer JWT |
| Sub create     | POST     | `/subscription/create`                 | Bearer JWT |
| Sub update     | PATCH    | `/subscription/update`                 | Bearer JWT |
| Sub delete     | DELETE   | `/subscription/delete`                 | Bearer JWT |

See the node's `internal/swagger/swagger.yaml` for full schemas.
