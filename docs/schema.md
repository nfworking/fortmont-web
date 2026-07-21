# Database Schema

The Prisma schema in `prisma/schema.prisma` is the source of truth. This summary focuses on the current models that power the app today.

## Core user model

### `AppUsers`

The central account record used across auth, profile data, storage, ticketing, OAuth, and notifications.

Key fields include `username`, `displayName`, `email`, `role`, `avatarUrl`, `phone`, `isEntraUser`, `passwordHash`, `isActive`, `onboarded`, `lastLoggedIn`, and the two-factor columns.

Relationships from this model include mailboxes, device tokens, password reset tokens, sessions, API keys, GitHub links, notifications, files, storage, OAuth records, pending uploads, teams, tickets, comments, and one-time passwords.

## Authentication and identity

### `PasswordResetToken`

Stores reset tokens with an expiration timestamp.

### `DeviceToken`

Stores push notification registrations for mobile or desktop devices.

### `UserSession`

Tracks active sessions with session token, user agent, IP address, cookie version, and expiry.

### `OneTimePassword`

Stores a single active 2FA code hash per user.

### `GitHubLink`

Stores a linked GitHub identity, access token, and profile metadata for the user.

### `OAuthClient`

Represents a first-party or third-party OAuth client, including allowed redirect URIs and default scopes.

### `OAuthCode`

Stores authorization codes, PKCE verifier state, redirect URI, and expiration.

### `OAuthToken`

Stores access or refresh tokens issued by the built-in OAuth server.

### `PlatformApiKey`

Stores hashed platform API keys with name, prefix, scopes, usage counts, and revocation timestamps.

## Mail and messaging

### `UserMailbox`

Stores mailbox credentials and provider metadata for user-linked mail accounts.

### `Notifications`

Stores in-app notifications with a type, title, description, read state, and optional user link.

## Ticketing

### `KbArticle`

Stores knowledge base articles with slug, content, and published state.

### `Tickets`

Stores ticket metadata including type, department, subject, description, priority, status, creator, assignee, and team.

### `Comment`

Stores ticket comments with ticket and author references.

### `Team`

Stores a named ticketing team with many-to-many membership and ticket assignment.

## Files and storage

### `UserStorage`

Tracks per-user quota and usage.

### `File`

Stores file metadata, ownership, storage object key, and optional ticket or asset links.

### `FileShare`

Stores share tokens, optional expiry, and optional share passwords.

### `FileActivity`

Stores upload, download, delete, rename, or move activity for a file.

### `PendingUpload`

Stores a file upload that has been initiated but not yet completed.

## Application registry and quick links

### `Apps`

Stores application cards used by the apps dashboard.

## Relationships worth knowing

- `AppUsers` is the hub for nearly every user-facing feature.
- Ticketing uses `Tickets`, `Comment`, and `Team`, with `AppUsers` as creator, assignee, author, and member.
- Storage uses `UserStorage`, `File`, `FileShare`, `FileActivity`, and `PendingUpload` to support quota checks and share links.
- OAuth uses `OAuthClient`, `OAuthCode`, and `OAuthToken` together with the auth session and signing helpers.

## Enums

- `TicketPriority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- `TokenType`: `ACCESS`, `REFRESH`

For exact column definitions and indexes, check `prisma/schema.prisma` directly.
