# @fortmont/auth-client

Lightweight helpers for signing users into a Next.js app with Fortmont as the OpenID Connect issuer.

## What this package does

- Builds the Fortmont authorization URL.
- Generates PKCE values for public clients.
- Exchanges an authorization code for Fortmont access tokens.
- Fetches Fortmont user info with the access token.
- Reads Fortmont discovery metadata when you want to avoid hardcoding endpoints.

## Install

```bash
pnpm add @fortmont/auth-client
```

## Configuration

Use the Fortmont issuer root, not the API route path:

```env
FORTMONT_ISSUER=https://api.fortmont.me
FORTMONT_CLIENT_ID=your-client-id
FORTMONT_CLIENT_SECRET=your-client-secret # server-only, optional for PKCE/public clients
FORTMONT_REDIRECT_URI=https://your-app.com/auth/callback
```

## Recommended flow in a Next.js app

### 1. Start login

Create a sign-in page or button that generates PKCE and redirects to Fortmont.

```ts
import {
  buildAuthUrl,
  createPkcePair,
  generateState,
} from '@fortmont/auth-client';

const issuer = process.env.NEXT_PUBLIC_FORTMONT_ISSUER!;
const clientId = process.env.NEXT_PUBLIC_FORTMONT_CLIENT_ID!;
const redirectUri = `${window.location.origin}/auth/callback`;

const state = generateState();
const { verifier, challenge } = await createPkcePair();

sessionStorage.setItem('fortmont_state', state);
sessionStorage.setItem('fortmont_verifier', verifier);

window.location.href = buildAuthUrl(
  {
    issuer,
    clientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  },
  state,
  challenge,
);
```

### 2. Exchange the code on the server

In your callback route or server action:

```ts
import { exchangeCode, fetchUserInfo } from '@fortmont/auth-client';

const tokenResponse = await exchangeCode(
  {
    issuer: process.env.FORTMONT_ISSUER!,
    clientId: process.env.FORTMONT_CLIENT_ID!,
    redirectUri: process.env.FORTMONT_REDIRECT_URI!,
  },
  code,
  codeVerifier,
);

const userInfo = await fetchUserInfo(tokenResponse.access_token, process.env.FORTMONT_ISSUER!);
```

If you are using a confidential client, add `clientSecret` to the config and the token exchange will include it automatically.

### 3. Verify the callback

Compare the returned `state` to the saved state before exchanging the code.

## Discovery

If you want Fortmont to tell you the endpoints, use the discovery document:

```ts
import { getDiscoveryDocument } from '@fortmont/auth-client';

const discovery = await getDiscoveryDocument(process.env.FORTMONT_ISSUER!);
console.log(discovery.authorization_endpoint);
```

## API surface

- `buildAuthUrl(config, state?, codeChallenge?)`
- `exchangeCode(config, code, codeVerifier?)`
- `fetchUserInfo(accessToken, userInfoEndpointOrIssuer)`
- `getDiscoveryDocument(issuer)`
- `getAuthorizationUrl(config, state?, codeChallenge?)`
- `getTokenUrl(configOrIssuer)`
- `getUserInfoUrl(configOrIssuer)`
- `generateState()`
- `generateCodeVerifier()`
- `generateCodeChallenge(verifier)`
- `createPkcePair()`

## Notes

- The issuer is `https://api.fortmont.me` in production.
- Authorization endpoint: `/api/oauth/authorize`
- Token endpoint: `/api/oauth/token`
- Userinfo endpoint: `/api/oauth/userinfo`
- Discovery endpoint: `/.well-known/openid-configuration`