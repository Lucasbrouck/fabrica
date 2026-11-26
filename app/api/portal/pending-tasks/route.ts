import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

const STATUS_LABELS: Record<string, string> = {
  PLACED: "Novo pedido",
  CONFIRMED: "Confirmado",
  PREPARING: "Em separação",
  READY_FOR_PICKUP: "Pronto p/ retirada",
  DISPATCHED: "Despachado",
};

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export async function GET(request: NextRequest) {
  const clientId = request.headers.get("x-caja-client-id")?.trim();
  const clientSecret = request.headers.get("x-caja-client-secret")?.trim();

  if (
    !process.env.CAJA_CLIENT_ID ||
    !process.env.CAJA_CLIENT_SECRET ||
    clientId !== process.env.CAJA_CLIENT_ID ||
    clientSecret !== process.env.CAJA_CLIENT_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [openOrders, openTickets] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: {
            in: [
              "PLACED",
              "CONFIRMED",
              "PREPARING",
              "READY_FOR_PICKUP",
              "DISPATCHED",
            ],
          },
        },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { updatedAt: "asc" },
      }),
      prisma.ticket.findMany({
        where: {
          status: { not: "RESOLVED" },
        },
        include: {
          user: { select: { name: true } },
          order: { select: { displayId: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const nowMs = Date.now();
    const tasks: {
      externalId: string;
      category: string;
      categoryLabel: string;
      title: string;
      subtitle: string | null;
      priority: "normal" | "high";
      dueDate: string;
      deepLink: string;
    }[] = [];

    for (const order of openOrders) {
      const elapsedMs = nowMs - order.updatedAt.getTime();
      const isStalled = elapsedMs >= FIVE_HOURS_MS;
      const statusLabel = STATUS_LABELS[order.status] || order.status;
      const totalFormatted = formatBRL(order.totalPrice);
      const customerName = order.user?.name || "Cliente";

      if (isStalled) {
        const hoursStalled = Math.floor(elapsedMs / (60 * 60 * 1000));
        tasks.push({
          externalId: `order-stalled-${order.id}`,
          category: "PEDIDO_ATRASADO",
          categoryLabel: "Pedido parado +5h",
          title: `Pedido #${order.displayId} parado há ${hoursStalled}h (${statusLabel})`,
          subtitle: `${customerName} · R$ ${totalFormatted}`,
          priority: "high",
          dueDate: order.createdAt.toISOString().slice(0, 10),
          deepLink: "/admin/orders",
        });
      } else if (order.status === "PLACED") {
        tasks.push({
          externalId: `order-new-${order.id}`,
          category: "NOVO_PEDIDO",
          categoryLabel: "Novo pedido",
          title: `Novo pedido #${order.displayId} — ${customerName}`,
          subtitle: `Aguardando confirmação · R$ ${totalFormatted}`,
          priority: "normal",
          dueDate: order.createdAt.toISOString().slice(0, 10),
          deepLink: "/admin/orders",
        });
      }
    }

    for (const ticket of openTickets) {
      const customerName = ticket.user?.name || "Cliente";
      const subtitle = ticket.order
        ? `Pedido #${ticket.order.displayId}`
        : ticket.description.slice(0, 80);

      tasks.push({
        externalId: `ticket-${ticket.id}`,
        category: "TICKET_SAC",
        categoryLabel:
          ticket.status === "IN_PROGRESS" ? "SAC · Em análise" : "SAC · Aberto",
        title: `SAC: ${ticket.reason} — ${customerName}`,
        subtitle,
        priority: "high",
        dueDate: ticket.createdAt.toISOString().slice(0, 10),
        deepLink: "/admin/sac",
      });
    }

    return NextResponse.json({
      appSlug: "pdv-fabrica",
      tasks,
    });
  } catch (error) {
    console.error("[PDV Fabrica Pending Tasks] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
