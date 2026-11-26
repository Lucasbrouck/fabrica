import { NextResponse } from 'next/server';
import { getCaJaAuthorizationUrl, getPublicBaseUrl } from '@/lib/caja-client';

export async function GET(request: Request) {
  const baseUrl = getPublicBaseUrl(request);
  const callbackUrl = new URL('/api/auth/caja-callback', baseUrl).toString();

  const cajaUrl = getCaJaAuthorizationUrl(callbackUrl);
  return NextResponse.redirect(cajaUrl);
}
