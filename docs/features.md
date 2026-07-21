# Features

## Implemented

### Authentication and account access

- Entra ID and credential-based login are both supported.
- Password reset is wired through the app and linked to the public app URL.
- Two-factor authentication is available through the account and auth routes.
- Device registration and session tracking are implemented for connected devices.

### Identity and integrations

- The app exposes a built-in OAuth 2.0 / OpenID Connect server.
- GitHub account linking is supported.
- Azure and Entra helper routes exist for identity and directory-related views.

### Dashboard and operations

- The dashboard includes homelab-facing views for Proxmox, DNS, proxy, Unifi, and Azure-related data.
- Platform API key management is available for internal service access.
- The apps area surfaces quick links and registered services.

### Mail and notifications

- Mailbox provisioning and mailbox UI routes are present.
- In-app notifications and push/device notifications are wired into ticketing and auth flows.

### Storage and files

- The storage flow uses presigned uploads, completion tracking, and delete/download routes.
- File sharing and file activity records are part of the current schema.

### Ticketing

- Tickets, comments, teams, and a knowledge base article model are in place.
- Ticket creation can notify assignees through email and device notifications.
- Ticketing data is exposed through dedicated create, update, assign, and stream routes.

## In progress or evolving

- The ticketing experience still has room to grow around audit trails, automation, and richer workflow states.
- Knowledge base content is present in the schema, but the authoring and search experience can still expand.
- More advanced RBAC and team workflows can be layered on top of the current account and ticketing models.
- Some integrations may still be incomplete depending on the backing homelab services that are available.

## What changed from the old notes

- Server registry and older LXC registry notes are no longer the main focus.
- The current schema is broader than the original app: it now includes storage, OAuth, 2FA, sessions, API keys, notifications, and ticketing relationships.
