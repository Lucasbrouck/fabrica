"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronRight, Package, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function SeparadorDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    // Only show orders in PREPARING status
    const preparingOrders = data.filter((o: any) => o.status === "PREPARING");
    setOrders(preparingOrders);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-slate-500 font-medium animate-pulse text-xs uppercase tracking-widest">Carregando Pedidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-800">Pedidos para Separação</h2>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{orders.length} pedidos pendentes</p>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Clock size={32} />
            </div>
            <p className="font-bold text-slate-800">Nenhum pedido no momento</p>
            <p className="text-sm text-slate-500">Aguarde novos pedidos serem aceitos.</p>
          </div>
        ) : (
          orders.map((order) => (
            <button
              key={order.id}
              onClick={() => router.push(`/separador/order/${order.id}`)}
              className="w-full bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase">
                    #{order.displayId}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg uppercase leading-tight">{order.user.name}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    {order.items.length} ITENS • {formatPrice(order.totalPrice)}
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <ChevronRight size={24} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
