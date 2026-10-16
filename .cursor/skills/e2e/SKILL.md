---
name: e2e
description: Playwright E2E para Rocchia (Next.js + Fastify). Usar al agregar o modificar pruebas end-to-end del frontend.
---

# E2E — Playwright (Rocchia)

## Stack

- **Runner:** `@playwright/test` en `frontend/e2e/`
- **App:** Next.js (`:3001`) con proxy `/backend` → API Fastify (`:3000`)
- **Auth:** `localStorage` clave `rocchia_auth_token` tras login en `/login`
- **Datos demo:** `npm run db:seed-cobrar-demo` en backend (contratos `ALQ-*`, `ALQ-MIX-01`, `ALQ-EST-*`)

## Comandos

```bash
cd frontend && npm run test:e2e
cd frontend && npm run test:e2e:ui
```

| Variable | Default |
|----------|---------|
| `PLAYWRIGHT_BASE_URL` | `http://127.0.0.1:3001` |
| `E2E_USERNAME` | `admin` |
| `E2E_PASSWORD` | `admin` |

## Reglas

1. Preferir `getByRole`, `getByLabel`, `getByText`; `data-testid` solo si el texto no es estable.
2. Un spec por flujo de usuario; sin `waitForTimeout` fijos.
3. Datos fijos del seed (`ALQ-MIX-01`, `ALQ-EST-02`).
4. Fixture de login reutilizable en `e2e/fixtures/auth.ts`.
