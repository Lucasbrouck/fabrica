"use client";

import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Clock, CheckCircle2, Package, XCircle, ArrowRight, Truck } from "lucide-react";
import { Button } from "./ui-button";

interface Order {
  id: string;
  displayId?: string;
  totalPrice: number;
  status: string;
  createdAt: string | Date;
  user: {
    name: string;
  };
  items?: any[];
}

export function AdminMobileOrders({ orders }: { orders: Order[] }) {
  const router = useRouter();

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Pendente", color: "text-slate-600 bg-slate-100 border-slate-200", icon: Clock };
      case "PREPARING":
        return { label: "Em separação", color: "text-amber-700 bg-amber-50 border-amber-200", icon: Package };
      case "READY":
        return { label: "Pronto", color: "text-blue-700 bg-blue-50 border-blue-200", icon: CheckCircle2 };
      case "OUT_FOR_DELIVERY":
        return { label: "Em rota", color: "text-indigo-700 bg-indigo-50 border-indigo-200", icon: Truck };
      case "DELIVERED":
        return { label: "Concluído", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 };
      case "CANCELLED":
        return { label: "Cancelado", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle };
      default:
        return { label: status, color: "text-slate-600 bg-slate-100 border-slate-200", icon: Clock };
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Clock size={32} />
        </div>
        <p className="font-bold text-slate-800">Nenhum pedido no momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {orders.map((order) => {
        const statusInfo = getStatusInfo(order.status);
        const StatusIcon = statusInfo.icon;
        const displayId = order.displayId || order.id.slice(-6).toUpperCase();
        
        return (
          <div
            key={order.id}
            className="w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                    #{displayId}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-lg uppercase leading-tight">
                  {order.user?.name || "Cliente Excluído"}
                </h3>
                <p className="text-sm text-slate-500 font-bold tracking-tight">
                  {formatPrice(order.totalPrice)} {order.items ? `• ${order.items.length} itens` : ""}
                </p>
              </div>

              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${statusInfo.color}`}>
                <StatusIcon size={14} />
                <span>{statusInfo.label}</span>
              </div>
            </div>

            {order.status === "PREPARING" && (
              <div className="pt-2 border-t border-slate-100">
                <Button 
                  onClick={() => router.push(`/separador/order/${order.id}`)}
                  variant="primary" 
                  className="w-full bg-amber-600 hover:bg-amber-700 shadow-amber-200 justify-center h-12 rounded-xl text-sm"
                >
                  <Package className="mr-2" size={18} />
                  Separar Pedido
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
