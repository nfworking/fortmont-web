'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type ClientInfo = {
  name: string;
  scopes: string[];
};

export default function OAuthConsentPage() {
  const searchParams = useSearchParams();
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope') || '';
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');

  useEffect(() => {
    if (!clientId) {
      setError('Missing client_id');
      return;
    }

    fetch(`/api/oauth/client-info?client_id=${encodeURIComponent(clientId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Unknown client');
        return res.json();
      })
      .then(setClientInfo)
      .catch(() => setError('Unable to load application details'));
  }, [clientId]);

  const buildAuthorizeUrl = (consent: 'approved') => {
    const url = new URL('/api/oauth/authorize', window.location.origin);
    if (clientId) url.searchParams.set('client_id', clientId);
    if (redirectUri) url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    if (scope) url.searchParams.set('scope', scope);
    if (state) url.searchParams.set('state', state);
    if (codeChallenge) url.searchParams.set('code_challenge', codeChallenge);
    if (codeChallengeMethod) url.searchParams.set('code_challenge_method', codeChallengeMethod);
    url.searchParams.set('consent', consent);
    return url.toString();
  };

  const handleDeny = () => {
    if (!redirectUri) {
      setError('Missing redirect URI');
      return;
    }

    const params = new URLSearchParams({
      error: 'access_denied',
      error_description: 'The user denied the request',
      ...(state ? { state } : {}),
    });
    window.location.href = `${redirectUri}?${params.toString()}`;
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Authorization Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!clientInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p>Loading authorization request...</p>
      </div>
    );
  }

  const requestedScopes = scope.split(/\s+/).filter(Boolean);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Authorize {clientInfo.name}</CardTitle>
          <CardDescription>
            This application is requesting access to your Fortmont account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Requested permissions</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              {(requestedScopes.length > 0 ? requestedScopes : clientInfo.scopes).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          {redirectUri && (
            <p className="text-xs text-muted-foreground break-all">Redirect URI: {redirectUri}</p>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button variant="outline" onClick={handleDeny}>
            Deny
          </Button>
          <Button onClick={() => { window.location.href = buildAuthorizeUrl('approved'); }}>
            Allow
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
