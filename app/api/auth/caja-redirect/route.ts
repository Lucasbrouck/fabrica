import { NextResponse } from 'next/server';
import { getCaJaAuthorizationUrl } from '@/lib/caja-client';
import { getRequestBaseUrl } from '@/lib/utils';

export async function GET(request: Request) {
  const baseUrl = getRequestBaseUrl(request);
  const callbackUrl = new URL('/api/auth/caja-callback', baseUrl).toString();
  const cajaUrl = getCaJaAuthorizationUrl(callbackUrl);
  return NextResponse.redirect(cajaUrl);
}
