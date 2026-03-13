import { Button } from "@/components/ui-button";
import { LayoutDashboard, Clock, CheckCircle2, Package } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatPrice, cn } from "@/lib/utils";
import { AdminMobileOrders } from "@/components/admin-mobile-orders";

export default async function AdminDashboard() {
  let orders: any[] = [];
  try {
    orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  } catch (error) {
    console.error("Dashboard DB Error:", error);
  }

  const stats = [
    { label: "Pedidos Hoje", value: "24", icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Em Preparo", value: "5", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Concluídos", value: "18", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Total Vendas", value: formatPrice(1240.50), icon: Package, color: "text-indigo-600", bg: "bg-indigo-100" },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-3xl lg:text-3xl font-bold text-slate-900 tracking-tight">Monitor de Pedidos</h1>
        <p className="text-slate-500">Acompanhe as vendas em tempo real.</p>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Pedidos Recentes</h2>
            <Button variant="secondary" size="sm">Ver todos</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-sm font-semibold">
                  <th className="pb-4 px-2">PEDIDO</th>
                  <th className="pb-4 px-2">CLIENTE</th>
                  <th className="pb-4 px-2">TOTAL</th>
                  <th className="pb-4 px-2">STATUS</th>
                  <th className="pb-4 px-2">AÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                ) : (orders as any[]).map((order) => (
                  <tr key={order.id} className="text-slate-700 hover:bg-white/40 transition-colors">
                    <td className="py-4 px-2 font-mono text-xs text-slate-400">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="py-4 px-2 font-bold">{order.user?.name || "Cliente Excluído"}</td>
                    <td className="py-4 px-2">{formatPrice(order.totalPrice)}</td>
                    <td className="py-4 px-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <Button variant="ghost" size="sm">Detalhes</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block lg:hidden mt-4">
        <AdminMobileOrders orders={orders as any[]} />
      </div>
    </div>
  );
}
