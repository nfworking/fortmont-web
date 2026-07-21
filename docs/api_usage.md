
# API Usage

This is a route-level reference for the current application surface. The source of truth is still the route implementation under `app/api/`, but the sections below mirror the main behavior in the running app.

## Auth and sessions

- `/api/auth/*`: Auth.js endpoints for sign-in, callbacks, session handling, and provider flows.
- `/api/auth/login`: Credential login for the main app.
- `/api/auth/entra-login`: Entra-backed login flow used by the mobile and web auth entry points.
- `/api/auth/request-reset`: Starts the password reset flow and sends a reset link.
- `/api/auth/reset-password`: Completes the password reset flow.
- `/api/auth/verify-session`: Verifies an existing session token.
- `/api/auth/sessions`: Lists or deletes active sessions for the signed-in user.
- `/api/auth/session-stream`: Streams session events over Redis-backed updates.
- `/api/auth/2fa/start`: Starts two-factor setup.
- `/api/account/2fa`: Gets, enables, disables, or updates 2FA settings.
- `/api/account/update-password`: Updates the current account password.
- `/api/users/onboarded`: Marks the current user as onboarded.
- `/api/devices/register`: Registers a mobile or desktop device token.

## OAuth and identity provider endpoints

- `/api/oauth/authorize`: Authorization endpoint for the built-in OAuth server.
- `/api/oauth/token`: Token exchange endpoint for authorization code and refresh token grants.
- `/api/oauth/token-proxy`: Proxy token exchange for the public client flow.
- `/api/oauth/userinfo`: Standard OIDC userinfo endpoint.
- `/api/oauth/consent`: Consent UI and consent submission endpoint.
- `/api/oauth/client-info`: Returns metadata for a client ID.
- `/api/.well-known/openid-configuration`: OIDC discovery document.
- `/api/jwks`: JSON Web Key Set for public token verification.

## External identity integrations

- `/api/entra`: Directory and identity helper route for Microsoft Entra-related data.
- `/api/azure`: Azure subscription and resource data route.
- `/api/github/connect`: Starts GitHub account linking.
- `/api/github/callback`: Completes GitHub OAuth linking.
- `/api/github/status`: Returns the current GitHub link status.
- `/api/github/disconnect`: Removes the linked GitHub account.
- `/api/github/proxy/[...path]`: Proxies selected GitHub API requests for linked accounts.

## Platform and admin APIs

Platform routes are used for internal administration and should be protected by API keys or authenticated sessions depending on the route.

- `/api/platform`: Returns high-level platform counts.
- `/api/platform/users`: Returns a user summary list.
- `/api/platform/apps`: Returns registered app records.
- `/api/platform/storage`: Returns storage usage and quotas.
- `/api/platform/sessions`: Returns active sessions.
- `/api/platform/account/keys`: Lists or creates platform API keys.
- `/api/platform/account/keys/:keyId`: Revokes a single API key.
- `/api/admin/oauth-client`: Creates, lists, or deletes OAuth clients.

## Storage and file handling

- `/api/storage/upload-url`: Creates a presigned upload URL and a pending upload record.
- `/api/storage/complete-upload`: Finalizes a pending upload after the object is stored.
- `/api/storage/download`: Returns a download response for a stored object.
- `/api/storage/delete/file/:id`: Deletes a stored file record and object.
- `/api/storage/provision`: Creates or prepares storage records for a user.

## Ticketing

- `/api/ticketing/post/ticket`: Lists or creates tickets.
- `/api/ticketing/get/ticket`: Retrieves ticket details.
- `/api/ticketing/post/ticket/form`: Returns form metadata and accepts new form submissions.
- `/api/ticketing/patch/ticket/:id`: Updates ticket fields.
- `/api/ticketing/patch/assign/team`: Assigns a ticket to a team.
- `/api/ticketing/post/ticket/:ticketId/comments`: Adds comments to a ticket.
- `/api/ticketing/get/users`: Returns ticketing users for selectors and assignment UI.
- `/api/ticketing/stream/tickets/:ticketId/stream`: Streams ticket updates and comments.

Ticket creation can trigger email and push notifications when an assignee is present.

## Mailbox

- `/api/mailbox/create`: Provisions a mailbox and links it to the current user.
- `/api/mailbox/inbox`: Fetches inbox data.
- `/api/mailbox/send`: Sends mail.
- `/api/mailbox/send/get`: Retrieves sent-mail details used by the mail UI.

## Networking and infrastructure

- `/api/proxmox/hosts`: Returns Proxmox node summaries.
- `/api/proxmox/lxc`: Returns LXC data.
- `/api/proxmox/resources`: Returns cluster resource usage.
- `/api/proxmox/summary`: Returns a condensed Proxmox summary.
- `/api/dns`: Reads or writes DNS records through the configured DNS API.
- `/api/proxy/routes`: Lists reverse proxy routes.
- `/api/proxy/routes/create`: Creates a reverse proxy route.
- `/api/proxy/certs`: Returns certificate or SSL metadata.
- `/api/unifi`: Reads or updates Unifi controller data.
- `/api/realtime`: Returns live operational data for the dashboard.

## Notifications and testing helpers

- `/api/notifications/get`: Lists notifications for the current user.
- `/api/notifications/post`: Creates a notification.
- `/api/notifications/patch/:notificationId`: Marks a notification as read or updates it.
- `/api/test/subscribe` and `/api/test/publish`: Local development helpers for the Redis event pipeline.

## Common request patterns

- Platform API keys are accepted in `x-api-key` or `Authorization: Bearer ...` depending on the route.
- OAuth token requests use form-encoded bodies.
- Storage uploads are a two-step flow: request a presigned URL, upload to object storage, then call the completion route.
- Ticketing routes expect authenticated user context, and some updates also emit Redis, email, and notification side effects.
