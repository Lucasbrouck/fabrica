import { NextResponse } from 'next/server';
import { getCaJaAuthorizationUrl } from '@/lib/caja-client';

export async function GET(request: Request) {
  const callbackUrl = new URL('/api/auth/caja-callback', request.url).toString();
  const cajaUrl = getCaJaAuthorizationUrl(callbackUrl);
  return NextResponse.redirect(cajaUrl);
}
