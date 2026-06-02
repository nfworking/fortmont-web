# Environment Variables

The following environment variables are required for Fortmont to function correctly. Some variables are only required if you intend to use specific integrations or features.

---

## Database

### `DATABASE_URL`
Connection string used to connect Fortmont to your MySQL database.

Example:

```env
DATABASE_URL=mysql://username:password@host:3306/database_name
```

---

## Authentication (Auth.js)

### `AUTH_MICROSOFT_ENTRA_ID_ID`
Microsoft Entra ID (Azure AD) Application Client ID used for web authentication.

Example:

```env
AUTH_MICROSOFT_ENTRA_ID_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### `AUTH_MICROSOFT_ENTRA_ID_SECRET`
Client Secret generated for your Microsoft Entra ID application.

### `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`
Microsoft Entra ID Tenant ID associated with your organization.

### `AUTH_SECRET`
Secret used by Auth.js to encrypt session data, authentication tokens, and cookies.

Generate a secure secret with:

```bash
npx auth secret
```

---

## Authentication URLs

### `AUTH_URL`
Base URL for the Auth.js authentication endpoint.

Example:

```env
AUTH_URL=https://api.fortmont.me/auth
```

### `AUTH_TRUST_HOST`
Allows Auth.js to trust headers forwarded by reverse proxies such as Nginx, Traefik, or Cloudflare.

Recommended value:

```env
AUTH_TRUST_HOST=true
```

### `NEXTAUTH_URL`
Public URL used by Auth.js for callbacks, redirects, and session management.

Example:

```env
NEXTAUTH_URL=https://api.fortmont.me
```

---

## Application Configuration

### `BASE_PATH`
Base path where the Fortmont dashboard is hosted.

Example:

```env
BASE_PATH=/dashboard
```

If Fortmont is hosted at the root of a domain, this can be left empty or removed.

---

## Fortmont Mobile

### `MICROSOFT_ENTRA_TENANT_ID`
Microsoft Entra ID Tenant ID used by the Fortmont Mobile application for Microsoft authentication and directory integrations.

Example:

```env
MICROSOFT_ENTRA_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### `MICROSOFT_ENTRA_CLIENT_ID`
Microsoft Entra ID Application Client ID used by the Fortmont Mobile application.

Example:

```env
MICROSOFT_ENTRA_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

> These variables are only required when using Fortmont Mobile features that integrate with Microsoft Entra ID.

---

## Proxmox Integration

### `PROXMOX_API_TOKEN`
API token used to access Proxmox VE resources.

Currently used by Fortmont Mobile to display real-time information about nodes, virtual machines, containers, storage, and cluster resources.

Example:

```env
PROXMOX_API_TOKEN=user@pam!fortmont=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## DNS Management

### `DNS_API_TOKEN`
API token used to authenticate with your DNS management API.

Used by Fortmont Mobile and future dashboard DNS management features.

### `DNS_SERVER_RECORDS_ENDPOINT`
API endpoint used to retrieve DNS records.

Example:

```env
DNS_SERVER_RECORDS_ENDPOINT=https://dns.example.com/api/records
```

### `DNS_SERVER_RECORDS_POST_ENDPOINT`
API endpoint used to create or modify DNS records.

Example:

```env
DNS_SERVER_RECORDS_POST_ENDPOINT=https://dns.example.com/api/records/create
```

---

## Reverse Proxy Configuration

### `PROXY_SERVER_HOST`
Hostname or IP address of the reverse proxy server used by Fortmont.

Example:

```env
PROXY_SERVER_HOST=proxy.example.com
```

---

## Mail Integration

### `MAILBOX_ENCRYPTION_KEY`
Encryption key used to securely store mailbox credentials and other mail-related secrets.

Generate a secure key with:

```bash
openssl rand -base64 64
```

### `IMAP_HOST`
Hostname of the IMAP server used for mailbox access.

Example:

```env
IMAP_HOST=imap.example.com
```

Common providers:

| Provider | IMAP Host |
|-----------|-----------|
| Mailcow | `mail.yourdomain.com` |
| Microsoft 365 | `outlook.office365.com` |
| Gmail | `imap.gmail.com` |

---