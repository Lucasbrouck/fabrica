import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
     const token = request.headers.get("asaas-access-token");
     const configToken = process.env.ASAAS_WEBHOOK_TOKEN;

     if (!configToken || token !== configToken) {
        console.warn("[Asaas Webhook] Erro de autenticação. Token recebido:", token);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

     const body = await request.json();
     const { event, payment } = body;

     console.log(`[Asaas Webhook] Evento recebido: ${event} para Pagamento: ${payment?.id}`);

     if (!payment || !payment.externalReference) {
        console.log("[Asaas Webhook] Pagamento sem externalReference. Ignorando.");
        return NextResponse.json({ received: true });
     }

     // O externalReference contém o orderId
     const orderId = payment.externalReference;

     // 1. Mapear status com base no evento
     let statusToUpdate = "";
     if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
        statusToUpdate = "RECEIVED";
     } else if (event === "PAYMENT_OVERDUE") {
        statusToUpdate = "OVERDUE";
     } else if (event === "PAYMENT_DELETED") {
        statusToUpdate = "DELETED";
     } else if (event === "PAYMENT_UPDATED") {
        statusToUpdate = payment.status; // Ex: PENDING, OVERDUE, RECEIVED
     }

     if (statusToUpdate) {
        // Verificar se o pedido existe antes de atualizar
        const orderExists = await prisma.order.findUnique({ where: { id: orderId } });
        if (!orderExists) {
           console.warn(`[Asaas Webhook] Pedido ${orderId} não encontrado no banco.`);
           return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
        }

        await prisma.order.update({
           where: { id: orderId },
           data: { asaasPaymentStatus: statusToUpdate }
        });
        console.log(`[Asaas Webhook] Pedido ${orderId} atualizado para status de cobrança: ${statusToUpdate}`);
     }

     return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
     console.error("[Asaas Webhook] Erro de processamento:", error);
     return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
