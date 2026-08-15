# AGENTS.md — vpn_node_v2_admin

Admin panel (React + TypeScript + Vite + Tailwind) for the `vpn_node_v2` single-node
manager. Talks to the node's management API (`/api/v1/...`).

## Commands

| Task        | Command          | Notes                                                       |
| ----------- | ---------------- | ----------------------------------------------------------- |
| Dev server  | `npm run dev`    | Proxies `/api`, `/health`, `/swagger` to `VITE_API_ORIGIN`. |
| Build       | `npm run build`  | Runs `tsc` then `vite build` → `dist/`.                     |
| Typecheck   | `npx tsc --noEmit -p tsconfig.app.json` | Type-only check.                       |
| Lint        | `npm run lint`   | ESLint (flat config).                                       |
| Format      | `npm run format` | Prettier.                                                   |

The backend (`vpn_node_v2`) must be running. See `../vpn_node_v2/.env.example` for the
admin credentials (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

## Routing

- `/login` — login page (stores JWT in localStorage).
- `/dashboard` — node heartbeat / system metrics.
- `/configs` — list, create (VLESS / VLESS-XHTTP), enable, disable, delete.
- `/configs/:uuid` — detail view + quota increase / connection-limit / delete.
- `/subscriptions` — list, create (with optional initial config attach).
- `/subscriptions/:uuid` — detail view + attach/detach configs, edit, delete.

All management routes are behind JWT auth (see `src/components/auth/RequireAuth.tsx`).
