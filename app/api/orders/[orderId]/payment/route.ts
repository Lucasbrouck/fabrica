import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createAsaasCustomer, createAsaasPayment, getAsaasPayment } from '@/lib/asaas';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const order = await (prisma.order as any).findUnique({
      where: { id: orderId },
      include: { 
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            cnpj: true,
            phone: true,
            postalCode: true,
            addressNumber: true,
            address: true,
            province: true,
            city: true,
            state: true,
            asaasCustomerId: true,
            boletoDueDays: true
          }
        }, 
        items: { include: { product: true } } 
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (!order.user.email || !order.user.cnpj) {
      return NextResponse.json({ error: 'Usuário sem email ou CNPJ cadastrado. Atualize o cadastro para gerar cobrança.' }, { status: 400 });
    }

    // 1. Get or Create Asaas customer ID
    let customerAsaasId = order.user.asaasCustomerId;

    if (!customerAsaasId) {
      console.log("User missing asaasCustomerId, creating on the fly...");
      try {
        const asaasCustomer = await createAsaasCustomer({
          name: order.user.name,
          email: order.user.email,
          cnpj: order.user.cnpj,
          phone: order.user.phone || undefined,
          postalCode: order.user.postalCode || undefined,
          addressNumber: order.user.addressNumber || undefined,
          address: order.user.address || undefined,
          province: order.user.province || undefined,
          city: order.user.city || undefined,
          state: order.user.state || undefined,
        });
        customerAsaasId = asaasCustomer.id;

        // Save it for next time
        await (prisma.user as any).update({
          where: { id: order.user.id },
          data: { asaasCustomerId: customerAsaasId }
        });
      } catch (err: any) {
        console.error("Asaas Create Customer Fallback Error:", err);
        throw new Error("Não foi possível identificar ou criar o cliente no Asaas.");
      }
    }

    // 2. Create payment
    const payment = await createAsaasPayment(
      customerAsaasId!,
      order.totalPrice,
      `Pedido #${(order as any).displayId} - PDV Fábrica`,
      order.user.boletoDueDays || 28,
      orderId
    );

    // 2.5 Fetch full payment to extract bankSlipUrl
    let fullPayment = payment;
    try {
      fullPayment = await getAsaasPayment(payment.id);
    } catch (fetchErr) {
      console.warn("[Asaas] Could not fetch full payment, falling back.", fetchErr);
    }

    // 3. Save payment info to order (using raw SQL to bypass outdated Prisma Client)
    try {
      await prisma.$executeRaw`
        UPDATE "Order" 
        SET 
          "asaasPaymentId" = ${payment.id}, 
          "asaasPaymentStatus" = ${payment.status || 'PENDING'}, 
          "asaasPaymentUrl" = ${fullPayment.bankSlipUrl || payment.invoiceUrl}, 
          "asaasPaymentDueDate" = ${payment.dueDate}
        WHERE id = ${orderId}
      `;
    } catch (dbError) {
      console.error("[Asaas] Error updating order with raw SQL:", dbError);
      // Fallback: Continue without saving back to DB to not block the user receipt
    }

    return NextResponse.json({ 
      paymentUrl: fullPayment.bankSlipUrl || payment.invoiceUrl, 
      bankSlipUrl: fullPayment.bankSlipUrl,
      paymentId: payment.id 
    });

  } catch (error: any) {
    console.error("Asaas Payment Route Error:", error);
    return NextResponse.json({ error: 'Erro ao gerar cobrança no Asaas', details: error.message }, { status: 500 });
  }
}
