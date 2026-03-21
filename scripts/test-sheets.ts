import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function debugExactAuth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;

  if (key) {
    if (key.startsWith('"') && key.endsWith('"')) {
      key = key.substring(1, key.length - 1);
    }
    key = key.replace(/\\o/g, '\\n');
    key = key.replace(/\\ /g, '\\n');
    key = key.replace(/\\n/g, '\n').trim();
  }

  try {
    const { google } = await import("googleapis");
    const auth = new google.auth.JWT(
      email,
      undefined,
      key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    console.log("Solicitando token...");
    await auth.getAccessToken();
    console.log("✓ Autenticação OK!");

  } catch (err: any) {
    console.error("\n=== Erro de Autenticação Detalhado ===");
    
    if (err.response && err.response.data) {
      console.log("Response Data:");
      // Usando util.inspect ou console.dir para forçar expansão completa
      console.dir(err.response.data, { depth: null, colors: false });
    } else {
      console.error(err.message || err);
    }
  }
}

debugExactAuth();
