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

      log("[Google Sheets] Chave raw len: " + privateKey.length);

      if (privateKey) {
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        // Corrige os \o e \  (barra + espaço) que costumam vir de erros de digitação/cópia
        privateKey = privateKey.replace(/\\o/g, '\\n').replace(/\\ /g, '\\n').replace(/\\n/g, '\n');
        
        // Correção Crucial para Windows: Remove Retornos de Carro (\r) que quebram o Decoder no Next.js
        privateKey = privateKey.replace(/\r/g, '').trim();
      }

      log("[Google Sheets] Chave processed len: " + privateKey.length);
      log("[Google Sheets] Chave começa com Header? " + privateKey.startsWith("-----BEGIN PRIVATE KEY-----"));

      auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
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
  } catch (error) {
    console.error("[Google Sheets] Erro ao adicionar linha:", error);
    // Não lançamos o erro para não travar o fluxo principal (Pedido/Pagamento)
  }
}
