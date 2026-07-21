import { Suspense } from 'react';
import OAuthConsentPage from './consent-client';

export default function OAuthConsentRoute() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center p-6">Loading...</div>}>
      <OAuthConsentPage />
    </Suspense>
  );
}
