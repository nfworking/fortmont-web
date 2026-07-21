# Environment Variables

This file reflects the variables currently used by the app, API routes, and supporting libraries. Keep `.example.env` and your deployed environment in sync with this list.

## Core application

- `DATABASE_URL`: MySQL connection string for Prisma.
- `BASE_PATH`: Optional dashboard base path such as `/dashboard`.
- `NEXTAUTH_URL`: Public app URL used by Auth.js callbacks and redirects.
- `AUTH_URL`: Internal auth endpoint URL when auth is mounted behind a path.
- `AUTH_TRUST_HOST`: Set to `true` behind a proxy or load balancer.
- `AUTH_SECRET`: Shared secret for Auth.js and related session signing.
- `COOKIE_VERSION`: Session cookie version gate used by the auth helpers.
- `NEXT_PUBLIC_APP_URL`: Public web app URL used for password reset links.
- `NEXT_PUBLIC_BASE_URL`: Base URL used by the OAuth helpers.
- `NEXT_PUBLIC_APP_NAME`: Display name used in 2FA and auth messaging.

## Auth and identity

- `AUTH_MICROSOFT_ENTRA_ID_ID`: Auth.js Microsoft Entra client ID.
- `AUTH_MICROSOFT_ENTRA_ID_SECRET`: Auth.js Microsoft Entra client secret.
- `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`: Auth.js Microsoft Entra tenant ID.
- `MICROSOFT_ENTRA_TENANT_ID`: Tenant ID used by the mobile login flow.
- `MICROSOFT_ENTRA_CLIENT_ID`: Client ID used by the mobile login flow.
- `OAUTH_SIGNING_KEY`: Private key used to sign OAuth access and ID tokens.
- `OAUTH_SIGNING_KID`: Key ID published in the JWKS endpoint.
- `NEXT_PUBLIC_FORTMONT_CLIENT_ID`: Public OAuth client ID used by the token proxy.
- `OAUTH_CORS_ORIGINS`: Comma-separated allowlist for OAuth token requests.
- `CORS_ALLOW_ORIGIN`: Legacy fallback allowlist for OAuth token requests.

Generate a signing key with:

```bash
pnpm exec tsx scripts/generate-oauth-key.ts
```

## Database and cache

- `REDIS_URL`: Redis endpoint used for session streaming and ticket updates.

## Mail

- `MAILBOX_ENCRYPTION_KEY`: Encryption key for stored mailbox credentials.
- `IMAP_HOST`: IMAP host for mailbox reads.
- `SMTP_HOST`: SMTP host for outgoing mail.
- `SMTP_PORT`: SMTP port used by `lib/email.ts`.
- `SMTP_USER`: SMTP username for outgoing mail.
- `SMTP_PASS`: SMTP password for outgoing mail.
- `SMTP_FROM`: Default From header for application mail.
- `SYSTEM_SMTP_USER`: Shared SMTP account used by mailbox provisioning.
- `SYSTEM_SMTP_PASS`: Password for the shared SMTP account.
- `MAILBOX_API`: Mailbox backend endpoint used during mailbox creation.
- `MAILCOW_API_TOKEN`: API token used when provisioning mailboxes through Mailcow.

## Storage and files

- `S3_ENDPOINT`: S3-compatible object storage endpoint.
- `S3_ACCESS_KEY`: Access key for object storage.
- `S3_SECRET_KEY`: Secret key for object storage.
- `S3_REGION`: Object storage region name.
- `S3_BUCKET`: Bucket used for file uploads and downloads.
- `AWS_REQUEST_CHECKSUM_CALCULATION`: AWS SDK request checksum setting.
- `AWS_RESPONSE_CHECKSUM_VALIDATION`: AWS SDK response checksum setting.

## Networking and infrastructure

- `PROXMOX_API_TOKEN`: Token used to query Proxmox.
- `PROXMOX_BASE_URL`: Proxmox base URL used by the helper library.
- `PROXMOX_API_KEY`: API key used by the Proxmox helper library.
- `DNS_API_TOKEN`: Token used by the DNS route.
- `DNS_SERVER_RECORDS_ENDPOINT`: DNS read endpoint.
- `DNS_SERVER_RECORDS_POST_ENDPOINT`: DNS write endpoint.
- `PROXY_API_TOKEN`: Token used by proxy management routes.
- `PROXY_SERVER_HOST`: Reverse proxy records endpoint.
- `PROXY_SERVER_HOST_CREATE_ROUTE`: Reverse proxy create-route endpoint.
- `SSL_CERTS_ENDPOINT`: Endpoint that returns proxy or certificate data.
- `AZURE_CLIENT_ID`: Azure Graph or portal client ID used by Azure helpers.
- `AZURE_TENANT_ID`: Azure tenant ID used by Azure helpers.
- `AZURE_CLIENT_SECRET`: Azure client secret used by Azure helpers.
- `AZURE_SUBSCRIPTION_ID`: Azure subscription used by the dashboard route.
- `UNIFI_BASE_URL`: Unifi controller base URL.
- `UNIFI_API_KEY`: Unifi API key.
- `UNIFI_SITE_ID`: Default Unifi site identifier.
- `UNIFI_ALLOW_SELF_SIGNED`: Set to `true` if the controller uses a self-signed cert.
- `UNIFI_LEGACY_SITE_NAME`: Optional fallback site name.

## GitHub integration

- `GITHUB_CLIENT_ID`: GitHub OAuth client ID.
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret.
- `GITHUB_REDIRECT_URI`: GitHub callback URL.

## Firebase and notifications

- `FIREBASE_PROJECT_ID`: Firebase project ID.
- `FIREBASE_CLIENT_EMAIL`: Firebase service account email.
- `FIREBASE_PRIVATE_KEY`: Firebase service account private key.

## Legacy or compatibility variables

- `API_KEY`: General-purpose API key value kept for compatibility with existing clients.
- `NEXT_PUBLIC_API_KEY`: Public API key value kept for compatibility with existing clients.

## Example file

The repository ships with `.example.env` as a starter template. The current default values are representative, not production-safe, so replace them before running the app against live services.

---