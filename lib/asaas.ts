export const ASAAS_API_URL = "https://api.asaas.com/v3";

function getApiKey() {
  let key = process.env.ASAAS_API_KEY;
  if (!key) {
    console.error("[Asaas] ERRO: ASAAS_API_KEY não encontrada no process.env");
    return null;
  }
  
  // Adiciona o $ se não existir (para evitar problemas de interpolação no .env)
  if (!key.startsWith('$')) {
    key = `$${key}`;
  }

  console.log(`[Asaas] Chave carregada! Comprimento: ${key.length}`);
  return key;
}

export async function createAsaasCustomer(user: { 
  name: string, email: string, cnpj: string, phone?: string, 
  postalCode?: string, addressNumber?: string, address?: string, 
  province?: string, city?: string, state?: string 
}) {
  const url = `${ASAAS_API_URL}/customers`;
  const key = getApiKey();
  
  if (!key) throw new Error("ASAAS_API_KEY não configurada");

  // Limpando CNPJ para garantir que vá apenas números
  const cleanCnpj = user.cnpj.replace(/\D/g, '');

  const options = {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'access_token': key
    },
    body: JSON.stringify({
      name: user.name,
      cpfCnpj: cleanCnpj,
      email: user.email,
      phone: user.phone?.replace(/\D/g, ''),
      postalCode: user.postalCode?.replace(/\D/g, ''),
      addressNumber: user.addressNumber,
      address: user.address,
      province: user.province,
      externalReference: user.email,
    })
  };

  console.log(`[Asaas] Fetching: ${url}`);
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error("[Asaas] Erro ao criar cliente:", data);
    throw new Error(data.errors?.[0]?.description || "Erro ao criar cliente no Asaas");
  }

  return data;
}

export async function createAsaasPayment(customerId: string, value: number, description: string, dueDays: number = 28) {
  const url = `${ASAAS_API_URL}/lean/payments`;
  const key = getApiKey();

  if (!key) throw new Error("ASAAS_API_KEY não configurada");
  
  const options = {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'access_token': key
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'BOLETO',
      value: value,
      dueDate: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: description,
    })
  };

  console.log(`[Asaas] Fetching Payment: ${url}`);
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error("[Asaas] Erro ao criar cobrança:", data);
    throw new Error(data.errors?.[0]?.description || "Erro ao criar cobrança no Asaas");
  }

  return data;
}

export async function getAsaasPayment(paymentId: string) {
  const url = `${ASAAS_API_URL}/payments/${paymentId}`;
  const key = getApiKey();

  if (!key) throw new Error("ASAAS_API_KEY não configurada");

  const options = {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'access_token': key
    }
  };

  console.log(`[Asaas] Fetching Single Payment: ${url}`);
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error("[Asaas] Erro ao buscar cobrança:", data);
    throw new Error(data.errors?.[0]?.description || "Erro ao buscar cobrança no Asaas");
  }

  return data;
}
