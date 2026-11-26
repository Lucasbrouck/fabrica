// lib/caja-client.ts

const CAJA_URL = process.env.CAJA_URL || 'https://caja-production-991b.up.railway.app';
const CLIENT_ID = process.env.CAJA_CLIENT_ID!;
const CLIENT_SECRET = process.env.CAJA_CLIENT_SECRET!;

export interface CaJaUser {
  id: string;      // UUID do usuário no CaJa — use este para vincular contas!
  email: string;
  name: string;
  role: string;    // Ex: 'ADMIN', 'GESTOR', 'SEPARADOR', 'CUSTOMER'.
}

export interface CaJaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: CaJaUser;
}

/**
 * Reconstrói a URL pública base considerando proxies reversos (Railway, Vercel, etc.).
 */
export function getPublicBaseUrl(request: Request): string {
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'http';

  const cleanProto = proto.split(',')[0].trim();
  const cleanHost = host.split(',')[0].trim();

  return `${cleanProto}://${cleanHost}`;
}

/**
 * Retorna a URL para redirecionar o usuário ao CaJa para login.
 */
export function getCaJaAuthorizationUrl(redirectUri: string, state?: string): string {
  const url = new URL(`${CAJA_URL}/authorize`);
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  if (state) url.searchParams.set('state', state);
  return url.toString();
}

/**
 * Troca o código recebido na URL de retorno pelo Token de Acesso e os dados do usuário.
 */
export async function exchangeCaJaToken(code: string): Promise<CaJaTokenResponse> {
  const response = await fetch(`${CAJA_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`CaJa SSO Error: ${errorData.error || response.statusText}`);
  }

  return response.json();
}
