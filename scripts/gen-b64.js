const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/GOOGLE_PRIVATE_KEY="(.*?)"/);
if (keyMatch) {
  const key = keyMatch[1].replace(/\\n/g, '\n');
  console.log(Buffer.from(key).toString('base64'));
} else {
  console.log("Chave não encontrada no .env");
}
