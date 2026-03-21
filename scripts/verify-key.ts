import * as dotenv from "dotenv";
import * as path from "path";
import { createPrivateKey } from "crypto";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function verifyWithCrypto() {
  console.log("=== Verificando Chave com Node Crypto ===");
  let key = process.env.GOOGLE_PRIVATE_KEY;

  if (!key) {
    console.error("Chave não encontrada no .env!");
    return;
  }

  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
  }
  key = key.replace(/\\n/g, '\n').trim();

  // Garante que termina com newline
  if (!key.endsWith('\n')) key += '\n';

  try {
    createPrivateKey(key);
    console.log("✓ Chave RSA Válida para o Node!");
    console.log("Comprimento:", key.length);
  } catch (err: any) {
    console.error("❌ Erro ao validar chave com Crypto:");
    console.error(err.message || err);
  }
}

verifyWithCrypto();
