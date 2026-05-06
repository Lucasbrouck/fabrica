import { google } from "googleapis";
import * as path from "path";
import * as fs from "fs";

interface AppendRowParams {
  orderId: string;
  customerName: string;
  totalPrice: number;
  paymentUrl: string;
  dueDate: string;
  status: string;
}

export async function appendRowToSheet(data: AppendRowParams) {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const tabName = process.env.GOOGLE_SHEET_TAB_NAME || 'Página1'; // Nome da aba padrão

  if (!spreadsheetId) {
    console.error("[Google Sheets] ID da planilha não configurado.");
    return;
  }

  try {
    let auth;
    const jsonPath = path.join(process.cwd(), "fabrica-490519-f1e64265dd37.json");
    const logPath = path.join(process.cwd(), "sheets_debug.log");

    const log = (msg: string) => {
      try { fs.appendFileSync(logPath, `${new Date().toISOString()} ${msg}\n`); } catch (e) {}
    };

    log("[Google Sheets] Inciando Append");
    log("[Google Sheets] Procurando credenciais em: " + jsonPath);
    log("[Google Sheets] Arquivo existe? " + fs.existsSync(jsonPath));

    if (fs.existsSync(jsonPath)) {
      log("[Google Sheets] Carregando a partir do arquivo .json");
      // Abre o arquivo e usa o GoogleAuth padrão (Muito mais imune a erros de escape)
      auth = new google.auth.GoogleAuth({
        keyFile: jsonPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    } else {
      log("[Google Sheets] Carregando a partir do .env");
      // Fallback para .env (ideal para ambiente de produção, ex: Vercel)
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      let privateKey = process.env.GOOGLE_PRIVATE_KEY;

      if (!clientEmail || !privateKey) {
        log("[Google Sheets] Variáveis de e-mail ou chave ausentes no .env");
        console.error("[Google Sheets] Variáveis de e-mail ou chave ausentes no .env");
        return;
      }

      log("[Google Sheets] Chave raw len: " + (privateKey?.length || 0));
      console.log("[Google Sheets] Chave raw len: ", (privateKey?.length || 0));

      // Limpeza robusta da chave privada
      if (privateKey) {
        privateKey = privateKey.trim();
        
        // Remove aspas se existirem (comum em .env)
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.substring(1, privateKey.length - 1);
        } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
          privateKey = privateKey.substring(1, privateKey.length - 1);
        }

        // SUPORTE A BASE64: Se não começar com header mas for uma tripa longa, tenta decodificar
        if (!privateKey.startsWith('-----BEGIN') && privateKey.length > 500) {
           log("[Google Sheets] Chave não tem Header. Tentando decodificar como Base64...");
           try {
             const decoded = Buffer.from(privateKey, 'base64').toString('utf8');
             if (decoded.includes('-----BEGIN PRIVATE KEY-----')) {
               privateKey = decoded;
               log("[Google Sheets] ✅ Chave Base64 decodificada com sucesso.");
               console.log("[Google Sheets] ✅ Chave Base64 decodificada com sucesso.");
             }
           } catch (e) {
             log("[Google Sheets] Erro ao tentar decodificar Base64.");
           }
        }

        // Converte \n literais em quebras de linha Reais
        // Também lida com possíveis \r residuais de Windows ou escapes duplicados
        privateKey = privateKey
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\r/g, '')
          .trim();
        
        // Garante que a chave comece e termine com as tags PEM corretas
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') && !privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
            log("[Google Sheets] Alerta: Chave privada não parece ter o cabeçalho PEM esperado.");
            console.warn("[Google Sheets] Alerta: Chave privada não parece ter o cabeçalho PEM esperado.");
        }
      }

      log("[Google Sheets] Chave processed len: " + (privateKey?.length || 0));
      console.log("[Google Sheets] Chave processed len: ", (privateKey?.length || 0));
      log("[Google Sheets] Chave começa com Header? " + privateKey.startsWith("-----BEGIN"));
      console.log("[Google Sheets] Chave começa com Header? ", privateKey.startsWith("-----BEGIN"));

      // Usa GoogleAuth com objeto de credenciais (Normalmente mais resiliente que o construtor JWT manual)
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // Monta a linha com os dados da cobrança conforme ordem:
    // DATA VENC | DATA PAG/REC | Nº NF | CLIENTE/FORNECEDOR | CONTA | VALOR | OBS
    const rowValues = [
      data.dueDate,                        // DATA VENC
      data.dueDate,                        // DATA PAG/REC (Instrução: data de vencimento)
      data.orderId,                        // Nº NF (Número do pedido)
      data.customerName,                  // CLIENTE/FORNECEDOR
      "Clara",                             // CONTA
      data.totalPrice,                     // VALOR
      ""                                   // OBS
    ];

    // Define o range (Ex: 'Aba1!A:G' para inserir no final da aba específica)
    const range = `'${tabName}'!A:G`;

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowValues],
      },
    });

    console.log(`[Google Sheets] Linha adicionada com sucesso para o pedido ${data.orderId}`);

    // Envia notificação via ntfy.sh
    try {
      await fetch('https://ntfy.sh/jalacobrancagerada_r4y7', {
        method: 'POST',
        body: 'uma cobrança foi gerada'
      });
      console.log(`[ntfy] Notificação enviada com sucesso para o pedido ${data.orderId}`);
    } catch (ntfyError) {
      console.error("[ntfy] Erro ao enviar notificação:", ntfyError);
    }
  } catch (error) {
    console.error("[Google Sheets] Erro ao adicionar linha:", error);
    // Não lançamos o erro para não travar o fluxo principal (Pedido/Pagamento)
  }
}
