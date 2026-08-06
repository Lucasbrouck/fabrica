// lib/caja-client.ts

const CAJA_URL = process.env.CAJA_URL || 'http://localhost:3000';
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
 * Retorna a URL para redirecionar o usuário ao CaJa para login.
 */
export function getCaJaAuthorizationUrl(redirectUri: string, state?: string): string {
  const url = new URL(`${CAJA_URL}/authorize`);
  url.searchParams.append('client_id', CLIENT_ID);
  url.searchParams.append('redirect_uri', redirectUri);
  if (state) url.searchParams.append('state', state);
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
    const errorData = await response.json();
    throw new Error(`CaJa SSO Error: ${errorData.error}`);
  }

  return response.json();
}
