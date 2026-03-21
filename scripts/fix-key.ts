import * as dotenv from "dotenv";
import * as path from "path";
import { createPrivateKey } from "crypto";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function fixBoth() {
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!key) return;

  console.log("=== Corrigindo Chave com Múltiplas Substituições ===");
  
  let fixedKey = key;
  if (fixedKey.startsWith('"') && fixedKey.endsWith('"')) {
    fixedKey = fixedKey.substring(1, fixedKey.length - 1);
  }

  // Correções
  fixedKey = fixedKey.replace(/\\o/g, '\\n'); // Corrige \o -> \n
  fixedKey = fixedKey.replace(/\\ /g, '\\n'); // Corrige \  -> \n (barra + espaço)

  // Converte os \n literais para quebras de linha reais
  fixedKey = fixedKey.replace(/\\n/g, '\n').trim();

  try {
    createPrivateKey(fixedKey);
    console.log("✓ SUCESSO! A chave agora é VÁLIDA!");
  } catch (err: any) {
    console.error("❌ Ainda inválida:", err.message);
  }
}

fixBoth();
