import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const config = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,
    userinfo_endpoint: `${baseUrl}/api/oauth/userinfo`,
    jwks_uri: `${baseUrl}/api/jwks`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
    scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
    claims_supported: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'nonce',
      'auth_time',
      'acr',
      'amr',
      'email',
      'email_verified',
      'name',
      'picture',
    ],
  };
  return NextResponse.json(config);
}
