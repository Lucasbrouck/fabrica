"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui-button";
import { Clock, CheckCircle2, Truck, CheckCircle, XCircle, ShoppingBasket, Plus, Minus, X, Search, FileText, Loader2, LogOut } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

export default function OrderMonitor() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [editingItems, setEditingItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDispatch, setConfirmDispatch] = useState<any | null>(null);
  const [asaasLoading, setAsaasLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    const interval = setInterval(fetchOrders, 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleOpenModal = (order: any) => {
    setSelectedOrder(order);
    setEditingItems(JSON.parse(JSON.stringify(order.items)));
    setIsEditing(false);
  };

  const updateOrderItems = async () => {
    if (!selectedOrder) return;
    
    await fetch(`/api/orders/${selectedOrder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: editingItems }),
    });
    
    setIsEditing(false);
    fetchOrders();
    setSelectedOrder(null);
  };

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  };

  const generateAsaasPayment = async (orderId: string) => {
    setAsaasLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payment`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        window.open(data.paymentUrl, "_blank");
        alert("Cobrança gerada com sucesso!");
      } else {
        alert(data.error || "Erro ao gerar cobrança");
      }
    } catch (error) {
       alert("Erro de conexão ao gerar cobrança");
    } finally {
      setAsaasLoading(false);
    }
  };

  const finishDispatch = async (order: any, shouldGenerateAsaas: boolean) => {
    if (shouldGenerateAsaas) {
      await generateAsaasPayment(order.id);
    }
    await updateStatus(order.id, "DISPATCHED");
    setConfirmDispatch(null);
  };

  const columns = [
    { title: "Novos", status: ["PLACED"], icon: Clock, color: "text-blue-600" },
    { title: "Em separação", status: ["PREPARING", "READY_FOR_PICKUP"], icon: CheckCircle2, color: "text-amber-600" },
    { title: "Em Rota", status: ["DISPATCHED"], icon: Truck, color: "text-indigo-600" },
    { title: "Concluidos", status: ["DELIVERED"], icon: CheckCircle, color: "text-emerald-600" },
  ];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !editingItems.some(item => item.productId === p.id)
  );

  return (
    <div className="space-y-8 h-full">
      <div className="flex justify-between items-center text-sans">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-base">G</div>
              Monitor de Pedidos
            </h1>
            <p className="text-slate-500 font-medium">Fluxo em tempo real seguindo Open Delivery.</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 font-bold transition-all ml-auto self-start mt-1"
          >
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
        <div className="flex gap-2">
           <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
           <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-250px)] overflow-hidden">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-4 h-full">
            <div className="flex items-center gap-2 px-2">
              <col.icon size={20} className={col.color} />
              <h2 className="font-bold text-slate-700 uppercase text-sm tracking-wider">{col.title}</h2>
              <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {orders.filter(o => col.status.includes(o.status)).length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {orders.filter(o => col.status.includes(o.status)).map((order) => (
                <div 
                  key={order.id} 
                  onClick={() => handleOpenModal(order)}
                  className="glass-card p-4 space-y-3 border-white/60 cursor-pointer group"
                >
                  <div className="flex justify-between text-xs font-mono text-slate-500/80">
                    <span className="font-bold">#{order.displayId}</span>
                    <span className="font-bold">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{order.user.name}</h3>
                    <p className="text-xs text-slate-600 font-medium">{order.items.length} itens • {formatPrice(order.totalPrice)}</p>
                    {order.status === "READY_FOR_PICKUP" && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                        <CheckCircle size={10} /> Separado
                      </span>
                    )}
                  </div>

                  <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                    {order.status === "PLACED" && (
                      <Button variant="primary" size="sm" className="w-full text-xs" onClick={() => updateStatus(order.id, "PREPARING")}>
                        Aceitar Pedido
                      </Button>
                    )}
                    {(order.status === "PREPARING" || order.status === "READY_FOR_PICKUP") && (
                       <div className="flex gap-2">
                         <Button variant="ghost" size="sm" className="w-1/3 text-xs" onClick={() => updateStatus(order.id, "PLACED")}>
                           Voltar
                         </Button>
                         <Button 
                          size="sm" 
                          className={`w-2/3 text-xs ${order.status === "READY_FOR_PICKUP" ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 animate-pulse" : "bg-indigo-500 hover:bg-indigo-600"}`} 
                          onClick={() => setConfirmDispatch(order)}
                         >
                           {order.status === "READY_FOR_PICKUP" ? "Despachar" : "Enviar"}
                         </Button>
                       </div>
                    )}
                    {order.status === "DISPATCHED" && (
                       <div className="flex gap-2">
                         <Button variant="ghost" size="sm" className="w-1/3 text-xs" onClick={() => updateStatus(order.id, "PREPARING")}>
                           Voltar
                         </Button>
                         <Button size="sm" className="w-2/3 text-xs bg-emerald-500 hover:bg-emerald-600" onClick={() => updateStatus(order.id, "DELIVERED")}>
                           Finalizar
                         </Button>
                       </div>
                    )}
                    {order.status === "DELIVERED" && (
                       <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => updateStatus(order.id, "DISPATCHED")}>
                         Voltar para Rota
                       </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal De Pedido / PDV */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`bg-white rounded-3xl border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col ${isEditing ? 'max-w-6xl w-full h-[90vh]' : 'max-w-2xl w-full max-h-[90vh]'}`}>
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <ShoppingBasket size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none mb-1">Pedido #{selectedOrder.displayId}</p>
                  <h2 className="text-xl font-bold text-slate-900">{selectedOrder.user.name}</h2>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                   selectedOrder.status === 'PLACED' ? 'bg-blue-100 text-blue-700' :
                   selectedOrder.status === 'PREPARING' ? 'bg-amber-100 text-amber-700' :
                   selectedOrder.status === 'DISPATCHED' ? 'bg-indigo-100 text-indigo-700' :
                   'bg-emerald-100 text-emerald-700'
                 }`}>
                    {selectedOrder.status}
                 </span>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-xl"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            {isEditing ? (
              <div className="flex-1 flex overflow-hidden bg-slate-50">
                {/* Left Side: Product Picker */}
                <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 p-6 space-y-6">
                  <div className="shrink-0 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text"
                        placeholder="Pesquisar produtos pelo nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => {
                            setEditingItems([...editingItems, { 
                              productId: product.id, 
                              product: product, 
                              quantity: 1, 
                              price: product.price 
                            }]);
                            setSearchQuery("");
                          }}
                          className="bg-white p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-400 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group"
                        >
                          <h4 className="font-bold text-slate-800 text-sm mb-2 group-hover:text-blue-600 transition-colors uppercase">{product.name}</h4>
                          <span className="text-blue-600 font-bold text-base">{formatPrice(product.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Order Summary */}
                <div className="w-[400px] flex flex-col bg-white border-l border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resumo do Pedido</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-2">
                    {editingItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-3">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-800 text-sm uppercase">{item.product.name}</span>
                          <button 
                            onClick={() => setEditingItems(editingItems.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                            <button 
                              onClick={() => {
                                const newItems = [...editingItems];
                                if (newItems[idx].quantity > 1) {
                                  newItems[idx].quantity--;
                                  setEditingItems(newItems);
                                } else {
                                  setEditingItems(editingItems.filter((_, i) => i !== idx));
                                }
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => {
                                const newItems = [...editingItems];
                                newItems[idx].quantity++;
                                setEditingItems(newItems);
                              }}
                              className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                    {editingItems.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-400 space-y-2">
                        <ShoppingBasket size={32} />
                        <p className="text-xs font-medium uppercase tracking-wider">Pedido Vazio</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-slate-100 space-y-4">
                    <div className="flex justify-between items-center bg-blue-600 text-white p-5 rounded-2xl shadow-xl shadow-blue-200">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-80">Total</span>
                      <span className="text-2xl font-bold">
                        {formatPrice(editingItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0))}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1 py-4 uppercase font-bold text-xs" onClick={() => { setIsEditing(false); setEditingItems(JSON.parse(JSON.stringify(selectedOrder.items))); }}>
                        Cancelar
                      </Button>
                      <Button variant="primary" className="flex-1 py-4 uppercase font-bold text-xs" onClick={updateOrderItems} disabled={editingItems.length === 0}>
                        Salvar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Simple Detail View
              <>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Itens do Pedido ({selectedOrder.items.length})</h3>
                      {selectedOrder.status === 'PREPARING' && (
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Plus size={14} /> Adicionar/Remover
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{item.quantity}x</span>
                            <span className="font-medium text-slate-800">{item.product.name}</span>
                          </div>
                          <span className="text-slate-500 font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 p-8 pt-0">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                     {selectedOrder.discount > 0 && (
                       <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                          <span>DESCONTO</span>
                          <span className="text-red-500">-{formatPrice(selectedOrder.discount)}</span>
                       </div>
                     )}
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Valor Final</span>
                        <span className="text-3xl font-black text-blue-600">{formatPrice(selectedOrder.totalPrice)}</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="secondary" className="w-full py-4 text-xs font-bold uppercase tracking-widest" onClick={() => setSelectedOrder(null)}>
                      Fechar
                    </Button>
                    <div className="flex">
                      {selectedOrder.status === "PLACED" && (
                        <Button variant="primary" className="w-full py-4 text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-100" onClick={() => { updateStatus(selectedOrder.id, "PREPARING"); setSelectedOrder(null); }}>
                          Aceitar Pedido
                        </Button>
                      )}
                      {selectedOrder.status === "PREPARING" && (
                        <Button className="w-full py-4 text-xs font-bold uppercase tracking-widest bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-100" onClick={() => { setConfirmDispatch(selectedOrder); setSelectedOrder(null); }}>
                          Enviar Pedido
                        </Button>
                      )}
                      {selectedOrder.status === "DISPATCHED" && (
                        <Button className="w-full py-4 text-xs font-bold uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-100" onClick={() => { updateStatus(selectedOrder.id, "DELIVERED"); setSelectedOrder(null); }}>
                          Finalizar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Envio (Billing/PDF) */}
      {confirmDispatch && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto">
                  <Truck size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Despachar Pedido</h2>
                <p className="text-slate-500 font-medium">Pedido #{confirmDispatch.displayId} - {confirmDispatch.user.name}</p>
              </div>

              <div className="space-y-4">
                <Button 
                   variant="secondary" 
                   className="w-full flex items-center justify-center gap-3 py-6 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                   onClick={() => window.open(`/api/orders/${confirmDispatch.id}/pdf`, "_blank")}
                >
                   <FileText size={20} /> Baixar Romaneio (PDF)
                </Button>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Ações de Cobrança</p>
                  <Button 
                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
                    disabled={asaasLoading}
                    onClick={() => finishDispatch(confirmDispatch, true)}
                  >
                    {asaasLoading ? <Loader2 className="animate-spin" /> : "Gerar Cobrança Asaas & Enviar"}
                  </Button>
                  <Button 
                    variant="ghost"
                    className="w-full py-4 text-slate-500 hover:text-slate-700 text-sm font-bold"
                    onClick={() => finishDispatch(confirmDispatch, false)}
                  >
                    Enviar sem cobrança
                  </Button>
                </div>
              </div>

              <button 
                onClick={() => setConfirmDispatch(null)}
                className="mt-6 w-full text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
              >
                Cancelar
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
