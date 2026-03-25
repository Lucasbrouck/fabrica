const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../.env');
console.log("Lendo .env de:", envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("Erro ao carregar .env:", result.error);
}

const key = process.env.GOOGLE_PRIVATE_KEY;

if (!key) {
  console.log("GOOGLE_PRIVATE_KEY não encontrada!");
} else {
  console.log("GOOGLE_PRIVATE_KEY encontrada.");
  console.log("Comprimento total:", key.length);
  console.log("Número de linhas:", key.split('\n').length);
  console.log("Primeira linha:", key.split('\n')[0]);
  console.log("Última linha:", key.split('\n').pop());
  
  // Verifica se tem \r
  console.log("Contém \\r?", key.includes('\r'));
  
  // Teste de criação de chave
  const crypto = require('crypto');
  try {
    // Aplica a mesma limpeza do google-sheets.ts
    let processedKey = key.trim();
    if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
      processedKey = processedKey.substring(1, processedKey.length - 1);
    }
    processedKey = processedKey.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
    
    crypto.createPrivateKey(processedKey);
    console.log("✓ Chave VÁLIDA para o crypto!");
  } catch (err) {
    console.log("❌ Chave INVÁLIDA para o crypto:");
    console.log(err.message);
  }
}
