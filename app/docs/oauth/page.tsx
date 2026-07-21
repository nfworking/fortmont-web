import React from 'react';

export default function OAuthDocs() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const exampleRedirect = `${baseUrl}/callback`;
  const exampleClientId = 'your-client-id';
  const exampleScope = 'openid profile email offline_access';

  const authUrl = `${baseUrl}/api/oauth/authorize?response_type=code&client_id=${exampleClientId}&redirect_uri=${encodeURIComponent(exampleRedirect)}&scope=${encodeURIComponent(exampleScope)}&state=xyz&code_challenge=CHALLENGE&code_challenge_method=S256`;

  return (
    <main className="prose max-w-3xl mx-auto py-8">
      <h1>OAuth 2.0 / OpenID Connect Integration</h1>
      <p>
        Fortmont acts as the <strong>authorization server</strong>. Third‑party applications can obtain an
        access token (and optionally a refresh token) to call protected APIs on behalf of a user.
      </p>

      <h2>User experience</h2>
      <ul>
        <li>
          Users signing into <strong>Fortmont itself</strong> use <code>/login</code> (dashboard splash,
          webmail links, signup).
        </li>
        <li>
          Users authorizing a <strong>third-party app</strong> use <code>/oauth/login</code> (“Sign in with
          Fortmont”), then <code>/oauth/consent</code>, then return to the app with an authorization code.
        </li>
      </ul>

      <h2>Endpoints</h2>
      <ul>
        <li>
          <code>GET /api/oauth/authorize</code> – Authorization endpoint. Redirects to OAuth login and
          consent, then the app receives a <code>code</code> after consent is approved via POST.
        </li>
        <li>
          <code>POST /api/oauth/consent</code> – Issues the authorization code after the user allows access
          (session required).
        </li>
        <li>
          <code>POST /api/oauth/token</code> – Token endpoint. Exchanges a code for tokens, or refreshes.
          Requires <code>client_secret</code> and/or PKCE (<code>code_verifier</code>).
        </li>
        <li>
          <code>GET /api/oauth/userinfo</code> – OpenID userinfo (Bearer access token).
        </li>
        <li>
          <code>GET /.well-known/openid-configuration</code> – OpenID Connect discovery document.
        </li>
        <li>
          <code>GET /api/jwks</code> – JSON Web Key Set for verifying JWTs.
        </li>
        <li>
          <code>GET /api/admin/oauth-client</code> – Admin API to create and manage OAuth clients.
        </li>
      </ul>

      <h2>Authorization Code Flow</h2>
      <ol>
        <li>
          <strong>Build the authorization URL</strong> (example with PKCE):
          <pre>{authUrl}</pre>
        </li>
        <li>
          User is redirected to <code>/oauth/login</code> (if needed), signs in, and sees consent for your app.
        </li>
        <li>
          After Allow, the server redirects to <code>{exampleRedirect}</code> with <code>code</code> and{' '}
          <code>state</code>.
        </li>
        <li>
          <strong>Exchange the code for tokens</strong> (server-side recommended):
          <pre>
{`POST ${baseUrl}/api/oauth/token
Content-Type: application/x-www-form-urlencoded

client_id=${exampleClientId}&client_secret=YOUR_CLIENT_SECRET&grant_type=authorization_code&code=CODE&redirect_uri=${encodeURIComponent(exampleRedirect)}&code_verifier=OPTIONAL_IF_PKCE`}
          </pre>
        </li>
        <li>
          Response includes <code>access_token</code> (JWT), optional <code>id_token</code> (if{' '}
          <code>openid</code>), and optional <code>refresh_token</code> (if <code>offline_access</code>).
        </li>
      </ol>

      <h2>Client authentication</h2>
      <ul>
        <li>
          <strong>Confidential clients:</strong> send <code>client_secret</code> on the token request.
        </li>
        <li>
          <strong>Public clients (SPA/native):</strong> use PKCE (<code>code_challenge</code> /{' '}
          <code>code_verifier</code>, method <code>S256</code>). Token exchange may omit the secret when
          PKCE was used at authorize time.
        </li>
        <li>
          Refresh tokens currently require <code>client_secret</code>.
        </li>
      </ul>

      <h2>Refresh Token Flow</h2>
      <pre>
{`POST ${baseUrl}/api/oauth/token
Content-Type: application/x-www-form-urlencoded

client_id=${exampleClientId}&client_secret=YOUR_CLIENT_SECRET&grant_type=refresh_token&refresh_token=YOUR_REFRESH_TOKEN`}
      </pre>

      <h2>SDK</h2>
      <p>
        The <code>@fortmont/auth-client</code> package provides helpers to build URLs, exchange tokens, and
        fetch userinfo. Pass <code>clientSecret</code> and/or a PKCE <code>codeVerifier</code> to{' '}
        <code>exchangeCode</code>.
      </p>

      <h2>Environment</h2>
      <ul>
        <li>
          <code>NEXT_PUBLIC_BASE_URL</code> – public issuer base (must match how clients reach Fortmont).
        </li>
        <li>
          <code>OAUTH_SIGNING_KEY</code> / <code>OAUTH_SIGNING_KID</code> – RS256 signing material.
        </li>
        <li>
          <code>OAUTH_CORS_ORIGINS</code> – comma-separated browser origins allowed for token CORS.
        </li>
      </ul>
    </main>
  );
}
