import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function debugExactAuth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;

  if (key) {
    key = key.trim();
    if ((key.startsWith('"') && key.endsWith('"')) || 
        (key.startsWith("'") && key.endsWith("'"))) {
      key = key.substring(1, key.length - 1);
    }
    key = key.replace(/\\n/g, '\n')
             .replace(/\\r/g, '')
             .replace(/\r/g, '')
             .trim();
  }

  try {
    const { google } = await import("googleapis");
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

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
