## Fortmont

## Recent Changes to Development
Due to the growing project, the project is undergoing some changes, primarly on how its being developed. features will be implemented in dev branch, before it is pushed into production. Github actions will also be used to enforce the quality of the code. I am also investigating a new development process, where this repo will become a mono repo for the entire Fortmont products and future projects

## Update on migration process
The project a few commits ago was going under a migration process, however several issues were encountered, so the plan was scraped. However after implementing oauth authentication, it can be determined that a new safe path to the migration process can be seen. This will slowly be implemented in a new branch under migration, please head over to that branch for migration updates. The main branch will be paused to recieve updates during this time. 

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

## Copyright and brand names
This project is named Fortmont as i own the domain fortmont.me. I am a student, so I am not very familar with copyright laws and brand names, if for a reason you have a copyright complaint for this name, please let me know immediatly, and this repo will become private and then public once the rebranding is complete


## AI
This project is not vibe coded in anyway, every commit is done by the developer and the developer understands the code properly. No mistakes are made, broken code will never be published to the production main branch. 
