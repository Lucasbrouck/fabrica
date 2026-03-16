"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui-button";
import { Clock, CheckCircle2, Package, Search, Filter, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

export default function UserOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [helpOrder, setHelpOrder] = useState<any | null>(null);
  const [helpReason, setHelpReason] = useState("Item a menos");
  const [helpSubmitting, setHelpSubmitting] = useState(false);

  const [user, setUser] = useState<any>(null);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  const submitHelpTicket = async () => {
    if (!helpOrder || (!user && !helpOrder.userId)) return;
    setHelpSubmitting(true);
    try {
      await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || helpOrder.userId,
          orderId: helpOrder.id,
          type: "ORDER_ISSUE",
          reason: helpReason,
          description: `Problema relatado pelo botão de ajuda do pedido: ${helpReason}`
        }),
      });
      alert("Ticket de ajuda enviado com sucesso! Nossa equipe entrará em contato.");
      setHelpOrder(null);
    } catch (err) {
      console.error(err);
    } finally {
      setHelpSubmitting(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me").then(res => res.ok ? res.json() : null).then(data => setUser(data));
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusDisplay = (status: string) => {
    const map: any = {
      PLACED: { label: "Pendente", color: "bg-blue-100 text-blue-700" },
      CONFIRMED: { label: "Confirmado", color: "bg-indigo-100 text-indigo-700" },
      PREPARING: { label: "Em Preparo", color: "bg-amber-100 text-amber-700" },
      READY_FOR_PICKUP: { label: "Pronto para Coleta", color: "bg-purple-100 text-purple-700" },
      DISPATCHED: { label: "Em Entrega", color: "bg-emerald-100 text-emerald-700" },
      DELIVERED: { label: "Finalizado", color: "bg-slate-100 text-slate-700" },
      CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
    };
    return map[status] || map.PLACED;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Meus Pedidos</h1>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-8">
        <div className="space-y-4">
          {loading ? (
             Array(3).fill(0).map((_, i) => <div key={i} className="h-40 glass rounded-2xl animate-pulse" />)
          ) : orders.length === 0 ? (
            <div className="glass-card py-20 text-center space-y-4">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag size={32} />
              </div>
              <p className="text-slate-500 font-medium">Você ainda não fez nenhum pedido.</p>
            </div>
          ) : orders.map(order => {
            const status = getStatusDisplay(order.status);
            return (
              <div key={order.id} className="glass-card flex flex-col gap-4 border-white/40">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Pedido #{order.displayId}</span>
                    <h3 className="text-lg font-bold text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="border-y border-slate-100 py-3">
                  <button 
                    onClick={() => toggleExpand(order.id)} 
                    className="flex justify-between items-center w-full text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">{order.items.length} {order.items.length === 1 ? 'Item' : 'Itens'}</span>
                    <ChevronDown size={16} className={`transform transition-transform ${expandedOrders[order.id] ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {expandedOrders[order.id] && (
                    <div className="space-y-2 pt-3">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-slate-600 font-medium">{item.quantity}x {item.product.name}</span>
                          <span className="text-slate-900 font-bold">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total</span>
                  <span className="text-2xl font-bold text-blue-600">{formatPrice(order.totalPrice)}</span>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  {order.status === 'DELIVERED' && order.asaasPaymentId && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobrança</span>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            order.asaasPaymentStatus === 'RECEIVED' || order.asaasPaymentStatus === 'RECEIVED_IN_CASH' || order.asaasPaymentStatus === 'CONFIRMED' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : order.asaasPaymentStatus === 'OVERDUE' 
                                ? 'bg-amber-100 text-amber-700' 
                                : order.asaasPaymentStatus === 'CANCELLED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                          }`}>
                            {order.asaasPaymentStatus === 'RECEIVED' || order.asaasPaymentStatus === 'RECEIVED_IN_CASH' || order.asaasPaymentStatus === 'CONFIRMED' ? 'Pago' :
                             order.asaasPaymentStatus === 'OVERDUE' ? 'Vencido' :
                             order.asaasPaymentStatus === 'CANCELLED' ? 'Cancelado' :
                             order.asaasPaymentStatus === 'PENDING' ? 'Pendente' : 'Gerada'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                          Vencimento: {order.asaasPaymentDueDate ? new Date(order.asaasPaymentDueDate).toLocaleDateString() : 'Não informado'}
                        </span>
                      </div>

                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 font-bold px-4 py-0 h-8 rounded-lg flex items-center"
                        onClick={() => window.open(order.asaasPaymentUrl, '_blank')}
                      >
                        Ver
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {(order.status === 'PLACED' || order.status === 'CONFIRMED') && (
                      <Button variant="secondary" size="sm" className="flex-1 text-xs font-bold">Editar Pedido</Button>
                    )}
                    {(order.status !== 'DELIVERED' || (() => {
                      if (!order.deliveredAt) return true;
                      const deliveryDate = new Date(order.deliveredAt);
                      const now = new Date();
                      return now.getTime() - deliveryDate.getTime() <= 24 * 60 * 60 * 1000;
                    })()) && (
                      <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => router.push(`/user/sac?orderId=${order.id}`)}>Ajuda</Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Ajuda Modal */}
      {helpOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-slate-900 uppercase">Precisa de Ajuda?</h2>
              <p className="text-xs text-slate-500 font-medium">Pedido #{helpOrder.displayId}</p>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Qual o problema?</p>
              <div className="space-y-2">
                {["Item a menos", "Item a mais", "Item incorreto", "Outros problemas"].map(reason => (
                  <button 
                    key={reason}
                    onClick={() => setHelpReason(reason)}
                    className={`w-full p-4 rounded-2xl text-left font-bold text-sm transition-all border-2 ${helpReason === reason ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-50 text-slate-600 hover:border-slate-200'}`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setHelpOrder(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={submitHelpTicket} disabled={helpSubmitting}>
                {helpSubmitting ? "Enviando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { ShoppingBag } from "lucide-react";
