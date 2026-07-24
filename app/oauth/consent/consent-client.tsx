'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSession } from 'next-auth/react';

type ClientInfo = {
  name: string;
  scopes: string[];
};

export default function OAuthConsentPage() {
  const searchParams = useSearchParams();
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope') || '';
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');

  const buildAuthorizeUrl = () => {
    const authorize = new URL('/api/oauth/authorize', window.location.origin);
    searchParams.forEach((value, key) => {
      if (key !== 'consent') authorize.searchParams.set(key, value);
    });
    return authorize;
  };

  const buildLoginUrl = (switchAccount = false) => {
    const login = new URL('/oauth/login', window.location.origin);
    login.searchParams.set('callbackUrl', buildAuthorizeUrl().toString());
    if (clientId) login.searchParams.set('client_id', clientId);
    if (switchAccount) login.searchParams.set('switch_account', '1');
    return login;
  };

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

  const postConsent = async (action: 'approve' | 'deny') => {
    if (!clientId || !redirectUri) {
      setError('Missing client_id or redirect_uri');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/oauth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          client_id: clientId,
          redirect_uri: redirectUri,
          scope,
          state: state || undefined,
          code_challenge: codeChallenge || undefined,
          code_challenge_method: codeChallengeMethod || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        // Session expired mid-flow — send back through OAuth login
        window.location.href = buildLoginUrl().toString();
        return;
      }

      if (!res.ok || !data.redirect_to) {
        setError(data.error_description || data.error || 'Authorization failed');
        setSubmitting(false);
        return;
      }

      window.location.href = data.redirect_to;
    } catch {
      setError('Authorization failed. Please try again.');
      setSubmitting(false);
    }
  };

  const requestedScopes = scope.split(/\s+/).filter(Boolean);
  const session = useSession();

  const handleSwitchAccount = () => {
    window.location.href = buildLoginUrl(true).toString();
  };

  if (error && !clientInfo) {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-zinc-50 to-zinc-100 p-6 dark:from-zinc-950 dark:to-zinc-900">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Authorize {clientInfo.name}</CardTitle>
          <CardDescription>
            Welcome back <strong>{session.data?.user?.name || 'user'}</strong>. {clientInfo.name} is requesting access to your account.
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
            <p className="text-xs text-muted-foreground break-all">
              Redirect URI: {redirectUri}
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => postConsent('deny')}
            disabled={submitting}
          >
            Deny
          </Button>
          <Button variant="ghost" onClick={handleSwitchAccount} disabled={submitting}>
            Use a different account
          </Button>
          <Button onClick={() => postConsent('approve')} disabled={submitting}>
            {submitting ? 'Continuing...' : 'Allow'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
