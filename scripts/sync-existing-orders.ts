import { PrismaClient } from "@prisma/client";
import { appendRowToSheet } from "../lib/google-sheets";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function run() {
  console.log("=== Buscando Pedidos no Banco de Dados ===");
  try {
    const orders = await prisma.order.findMany({
      include: { user: true }
    });

    console.log(`Encontrados ${orders.length} pedidos.`);

    for (const order of orders) {
      console.log(`\nProcessando Pedido #${(order as any).displayId || order.id}`);
      console.log(`Cliente: ${order.user.name}`);
      console.log(`Valor: R$ ${order.totalPrice.toFixed(2)}`);
      console.log(`Vencimento Asaas: ${(order as any).asaasPaymentDueDate || 'N/A'}`);

      // Se não tiver vencimento (pedido antigo sem cobrança), usamos uma data padrão para o teste
      const dueDate = (order as any).asaasPaymentDueDate || new Date(Date.now() + 28*24*60*60*1000).toLocaleDateString('pt-BR');

      console.log(`Enviando para planilha com Vencimento: ${dueDate}...`);
      
      await appendRowToSheet({
        orderId: (order as any).displayId ? `#${(order as any).displayId}` : order.id,
        customerName: order.user.name,
        totalPrice: order.totalPrice,
        paymentUrl: (order as any).asaasPaymentUrl || 'https://exemplo.com/sem-link',
        dueDate: dueDate,
        status: (order as any).asaasPaymentStatus || 'PENDING'
      });
    }

    console.log("\n=== Sincronização Concluída! ===");
  } catch (err) {
    console.error("Erro no processo:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
