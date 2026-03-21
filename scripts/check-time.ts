async function checkTime() {
  console.log("=== Verificando Sincronização de Horário ===");
  console.log("Horário do Sistema:", new Date().toISOString());

  try {
    const res = await fetch("https://worldtimeapi.org/api/timezone/America/Sao_Paulo");
    const data = await res.json();
    console.log("Horário Real (NTP):", data.datetime);

    const apiDate = new Date(data.datetime);
    const sysDate = new Date();
    const diff = Math.abs(apiDate.getTime() - sysDate.getTime()) / 1000 / 60; // Dif em minutos

    console.log(`\nDiferença: ${diff.toFixed(2)} minutos`);
    
    if (diff > 5) {
      console.error("\n[DANGER] O relógio do servidor local está desgovernado!");
      console.error("Isso causa Erro 401 no Google Sheets pq o token JWT expira no passado/futuro.");
    } else {
      console.log("\nRelógio sincronizado!");
    }
  } catch (err) {
    console.error("Erro ao consultar API de tempo:", err);
  }
}

checkTime();
