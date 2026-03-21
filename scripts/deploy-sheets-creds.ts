import * as fs from "fs";
import * as path from "path";

async function deployCreds() {
  console.log("=== Configurando .env a partir do arquivo JSON ===");
  const jsonPath = path.join(__dirname, "../fabrica-490519-f1e64265dd37.json");
  const envPath = path.join(__dirname, "../.env");

  if (!fs.existsSync(jsonPath)) {
    console.error("Arquivo JSON não encontrado em:", jsonPath);
    return;
  }

  const creds = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const clientEmail = creds.client_email;
  // Mantemos o valor da private_key exatamente como está no JSON (tem \n embutido)
  const privateKey = creds.private_key; 

  if (!clientEmail || !privateKey) {
    console.error("Campos client_email ou private_key ausentes no JSON!");
    return;
  }

  let envContent = fs.readFileSync(envPath, 'utf-8');

  // Atualiza CLIENT_EMAIL
  if (envContent.includes("GOOGLE_CLIENT_EMAIL=")) {
    envContent = envContent.replace(/GOOGLE_CLIENT_EMAIL=.*(\r?\n|$)/, `GOOGLE_CLIENT_EMAIL="${clientEmail}"\n`);
  } else {
    envContent += `\nGOOGLE_CLIENT_EMAIL="${clientEmail}"`;
  }

  // Atualiza PRIVATE_KEY
  // Como a chave tem aspas e \n, vamos escapar corretamente no .env se necessário, 
  // mas o melhor é salvar exatamente com aspas duplas em volta para que o dotenv leia como uma linha.
  // No JSON ele vem como string literal com \n. 
  // Ao salvar em .env com "", o dotenv lê como string e preserva os \n literais.
  const escapedKey = privateKey.replace(/\n/g, '\\n'); // Garante que fica em uma única linha no .env se houver quebras reais
  
  if (envContent.includes("GOOGLE_PRIVATE_KEY=")) {
    // Regex para substituir a linha toda da chave privada (pode ser longa)
    envContent = envContent.replace(/GOOGLE_PRIVATE_KEY=.*(\r?\n|$)/, `GOOGLE_PRIVATE_KEY="${escapedKey}"\n`);
  } else {
    envContent += `\nGOOGLE_PRIVATE_KEY="${escapedKey}"`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("✓ Arquivo .env atualizado com sucesso com os dados do JSON!");
  console.log("Email configurado:", clientEmail);
}

deployCreds();
