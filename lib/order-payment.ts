import prisma from '@/lib/prisma';
import { createAsaasCustomer, createAsaasPayment, getAsaasPayment } from '@/lib/asaas';
import { appendRowToSheet } from '@/lib/google-sheets';

export async function createPaymentForOrder(orderId: string) {
  const order = await (prisma.order as any).findUnique({
    where: { id: orderId },
    include: { 
      user: {
        select: {
          id: true, name: true, email: true, cnpj: true, phone: true,
          postalCode: true, addressNumber: true, address: true, 
          province: true, city: true, state: true,
          asaasCustomerId: true, boletoDueDays: true
        }
      }, 
      items: { include: { product: true } } 
    },
  });

  if (!order) throw new Error('Pedido não encontrado');
  if (!order.user.email || !order.user.cnpj) {
    throw new Error('Usuário sem email ou CNPJ cadastrado. Atualize o cadastro para gerar cobrança.');
  }

  let customerAsaasId = order.user.asaasCustomerId;

  if (!customerAsaasId) {
    console.log("[Payment Helper] Creating Asaas Customer on the fly...");
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

    await (prisma.user as any).update({
      where: { id: order.user.id },
      data: { asaasCustomerId: customerAsaasId }
    });
  }

  console.log("[Payment Helper] Creating Asaas Payment...");
  const payment = await createAsaasPayment(
    customerAsaasId!,
    order.totalPrice,
    `Pedido #${(order as any).displayId} - PDV Fábrica`,
    order.user.boletoDueDays || 28,
    orderId
  );

  let fullPayment = payment;
  try {
    fullPayment = await getAsaasPayment(payment.id);
  } catch (fetchErr) {
    console.warn("[Payment Helper] Could not fetch full payment.", fetchErr);
  }

  console.log("[Payment Helper] Updating Order in database...");
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
    console.error("[Payment Helper] Error updating order raw SQL:", dbError);
  }

  console.log("[Payment Helper] Appending to Google Sheets...");
  await appendRowToSheet({
    orderId: (order as any).displayId || orderId,
    customerName: order.user.name,
    totalPrice: order.totalPrice,
    paymentUrl: fullPayment.bankSlipUrl || payment.invoiceUrl || '',
    dueDate: payment.dueDate,
    status: payment.status || 'PENDING'
  });

  return {
    paymentUrl: fullPayment.bankSlipUrl || payment.invoiceUrl,
    bankSlipUrl: fullPayment.bankSlipUrl,
    paymentId: payment.id
  };
}
