## Fortmont

Fortmont is a Next.js-based internal platform for identity, homelab operations, storage, ticketing, and service administration. The app currently includes:

- Auth.js sign-in with Entra ID and credentials login
- Two-factor authentication and password reset flows
- A built-in OAuth 2.0 / OpenID Connect server
- Platform API keys for service-to-service access
- Ticketing, comments, teams, and knowledge base content
- File storage with presigned uploads and share/activity tracking
- Mailbox, GitHub, Proxmox, DNS, proxy, Azure, and Unifi integrations
- Notifications, device registration, and session tracking

## Requirements

To run the full stack locally or in a homelab environment, you will need:

- A MySQL-compatible database
- A Microsoft Entra ID application for login and directory flows
- A GitHub OAuth application if you want account linking
- An S3-compatible object store for file uploads
- IMAP and SMTP access for mailbox features
- Redis for session streaming and ticketing updates
- The external APIs used by your DNS, proxy, Proxmox, Azure, and Unifi integrations

## Setup

1. Install dependencies with your package manager.
2. Copy `.example.env` to `.env` and fill in the values described in [docs/env.md](docs/env.md).
3. Generate the Prisma client and apply the database schema.

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

If you already have the database schema applied, skip the migration step and only run `pnpm exec prisma generate`.

## Development

Run the app locally with:

```bash
pnpm run dev
```

The main API surface is documented in [docs/api_usage.md](docs/api_usage.md), and the current data model is summarized in [docs/schema.md](docs/schema.md).

## Scripts

- `pnpm run dev` starts the development server.
- `pnpm run build` builds the production app.
- `pnpm run start` runs the production server.
- `pnpm run lint` runs ESLint.

## Notes

The docs in `docs/` are the best starting point for the current runtime behavior, environment variables, and feature coverage. If you are wiring a new integration, start with the relevant route group in the API docs and the matching section in the Prisma schema.
