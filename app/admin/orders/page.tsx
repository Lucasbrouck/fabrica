"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui-button";
import { 
  Clock, CheckCircle2, Truck, CheckCircle, XCircle, 
  ShoppingBasket, Plus, Minus, X, Search, FileText, 
  Loader2, LogOut, PlusCircle, User, Tag, ArrowRight,
  Filter, ChevronRight, MoreVertical, Package
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [editingItems, setEditingItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDispatch, setConfirmDispatch] = useState<any | null>(null);
  const [asaasLoading, setAsaasLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  
  // Create Order State
  const [isCreating, setIsCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const router = useRouter();

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    if (Array.isArray(data)) setOrders(data);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (Array.isArray(data)) setUsers(data.filter(u => u.role === 'CUSTOMER'));
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchUsers();
    const interval = setInterval(fetchOrders, 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleOpenModal = (order: any) => {
    setSelectedOrder(order);
    setEditingItems(JSON.parse(JSON.stringify(order.items)));
    setIsEditing(false);
  };

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
    setSelectedOrder(null);
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

  const handleCreateOrder = async () => {
    if (!selectedUser || cart.length === 0) return;

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const finalTotal = Math.max(0, subtotal - discount);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          totalPrice: finalTotal,
          discount: discount
        }),
      });

      if (res.ok) {
        setIsCreating(false);
        setCart([]);
        setSelectedUser(null);
        setDiscount(0);
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao criar pedido");
      }
    } catch (error) {
      alert("Erro ao criar pedido");
    }
  };

  const statusMap: any = {
    PLACED: { label: "Novo", color: "bg-blue-100 text-blue-700", icon: Clock },
    PREPARING: { label: "Em Separação", color: "bg-amber-100 text-amber-700", icon: Package },
    READY_FOR_PICKUP: { label: "Separado", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    DISPATCHED: { label: "Em Rota", color: "bg-indigo-100 text-indigo-700", icon: Truck },
    DELIVERED: { label: "Concluído", color: "bg-slate-100 text-slate-700", icon: CheckCircle },
  };

  const filters = [
    { label: "Todos", value: "ALL" },
    { label: "Novos", value: "PLACED" },
    { label: "Em Separação", value: "PREPARING" },
    { label: "Em Rota", value: "DISPATCHED" },
    { label: "Concluídos", value: "DELIVERED" },
  ];

  const filteredOrders = orders.filter(o => 
    activeFilter === "ALL" || 
    (activeFilter === "PREPARING" ? ["PREPARING", "READY_FOR_PICKUP"].includes(o.status) : o.status === activeFilter)
  );

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Gerenciamento de Pedidos
          </h1>
          <p className="text-slate-500 font-medium">Visualize e gerencie todos os pedidos da fábrica.</p>
        </div>
        
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <PlusCircle size={20} />
          Novo Pedido
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 pb-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
              activeFilter === f.value 
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100" 
                : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List View */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data/Hora</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                const status = statusMap[order.status] || statusMap.PLACED;
                const StatusIcon = status.icon;

                return (
                  <tr 
                    key={order.id} 
                    onClick={() => handleOpenModal(order)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <span className="font-mono font-bold text-slate-400 text-sm">#{order.displayId}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">
                          {order.user?.name || "Cliente Final"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{order.items?.length || 0} itens</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-600">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                         <span className="text-[10px] text-slate-400 font-medium">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                          status.color
                        )}>
                          <StatusIcon size={12} />
                          {order.status === "READY_FOR_PICKUP" ? "Separado" : status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="font-black text-blue-600">{formatPrice(order.totalPrice)}</span>
                    </td>
                    <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                       <div className="flex justify-end gap-2">
                        {order.status === "PLACED" ? (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 px-3 rounded-lg text-[10px] font-bold" onClick={() => updateStatus(order.id, "PREPARING")}>
                            Aceitar
                          </Button>
                        ) : order.status === "PREPARING" || order.status === "READY_FOR_PICKUP" ? (
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8 px-3 rounded-lg text-[10px] font-bold" onClick={() => setConfirmDispatch(order)}>
                            Enviar
                          </Button>
                        ) : (
                          <button onClick={() => handleOpenModal(order)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                            <ChevronRight size={18} />
                          </button>
                        )}
                       </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                   <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-20">
                         <ShoppingBasket size={48} />
                         <p className="font-black uppercase tracking-widest text-sm">Nenhum pedido encontrado</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Order Modal (Creating) */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Left Column: Product Selection */}
            <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-100 overflow-hidden">
               <div className="p-6 space-y-4 shrink-0">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Seleção de Produtos</h2>
                    <button onClick={() => setIsCreating(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar produtos..." 
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500/20 text-sm"
                    />
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-4 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredProducts.map(p => (
                      <button 
                         key={p.id}
                         onClick={() => {
                           const existing = cart.find(item => item.id === p.id);
                           if (existing) {
                             setCart(cart.map(item => item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item));
                           } else {
                             setCart([...cart, { ...p, quantity: 1 }]);
                           }
                         }}
                         className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 text-left transition-all hover:shadow-md group"
                      >
                         <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 uppercase mb-1">{p.name}</h4>
                         <p className="text-blue-600 font-black">{formatPrice(p.price)}</p>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            {/* Right Column: Order Details & User */}
            <div className="w-[400px] flex flex-col bg-white overflow-hidden">
               <div className="p-6 border-b border-slate-50 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cliente</label>
                    {selectedUser ? (
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
                            {selectedUser.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{selectedUser.name}</p>
                            <p className="text-[10px] text-blue-600 font-bold uppercase">{selectedUser.email}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-red-500"><X size={18} /></button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          placeholder="Pesquisar cliente..." 
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                           {filteredUsers.slice(0, 5).map(u => (
                             <button 
                               key={u.id}
                               onClick={() => setSelectedUser(u)}
                               className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-2"
                             >
                               <User size={14} /> {u.name}
                             </button>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Carrinho ({cart.length})</h3>
                  {cart.map((item, idx) => (
                    <div key={item.id} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="flex justify-between items-start">
                         <span className="font-bold text-slate-800 text-xs uppercase">{item.name}</span>
                         <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-slate-300 hover:text-red-500"><X size={16} /></button>
                       </div>
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-xl shadow-sm border border-slate-100">
                             <button onClick={() => {
                               if (item.quantity > 1) {
                                  setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c));
                               } else {
                                  setCart(cart.filter(c => c.id !== item.id));
                               }
                             }} className="p-1 text-slate-400 hover:text-blue-600"><Minus size={14} /></button>
                             <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                             <button onClick={() => setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))} className="p-1 text-slate-400 hover:text-blue-600"><Plus size={14} /></button>
                          </div>
                          <span className="font-black text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="p-6 border-t border-slate-50 space-y-4">
                  <div className="space-y-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                     <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>SUBTOTAL</span>
                        <span>{formatPrice(cart.reduce((acc, i) => acc + i.price * i.quantity, 0))}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs font-bold text-red-500">
                        <div className="flex items-center gap-2">
                           <Tag size={12} />
                           <span>DESCONTO (R$)</span>
                        </div>
                        <input 
                          type="number" 
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          className="w-20 bg-transparent text-right focus:outline-none font-black"
                          placeholder="0,00"
                        />
                     </div>
                     <div className="flex justify-between items-center text-lg font-black text-blue-600 pt-2 border-t border-slate-200">
                        <span>TOTAL</span>
                        <span>{formatPrice(Math.max(0, cart.reduce((acc, i) => acc + i.price * i.quantity, 0) - discount))}</span>
                     </div>
                  </div>

                  <Button 
                    onClick={handleCreateOrder}
                    disabled={!selectedUser || cart.length === 0}
                    className="w-full py-7 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-100"
                  >
                    Finalizar e Criar
                  </Button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {selectedOrder && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl h-auto max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="p-8 border-b border-slate-50 shrink-0 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                        <ShoppingBasket size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pedido #{selectedOrder.displayId}</p>
                        <h2 className="text-xl font-bold text-slate-900">{selectedOrder.user?.name}</h2>
                     </div>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 custom-scrollbar">
                  <div className="space-y-3">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Itens do Pedido</h3>
                     <div className="space-y-1">
                        {selectedOrder.items?.map((item: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 text-sm">
                              <span className="font-bold text-slate-700">{item.quantity}x {item.product?.name}</span>
                              <span className="font-black text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                           </div>
                        ))}
                     </div>
                  </div>

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
               </div>

               <div className="p-8 pt-0 flex gap-4">
                  <Button variant="secondary" className="flex-1 py-4 font-bold uppercase tracking-widest text-xs" onClick={() => setSelectedOrder(null)}>Fechar</Button>
                  {selectedOrder.status === 'PLACED' && (
                    <Button variant="primary" className="flex-1 py-4 font-bold uppercase tracking-widest text-xs" onClick={() => updateStatus(selectedOrder.id, 'PREPARING')}>Aceitar Pedido</Button>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* Confirmation Modal (Asaas/PDF) */}
      {confirmDispatch && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto">
                  <Truck size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Despachar Pedido</h2>
                <p className="text-slate-500 font-medium">Pedido #{confirmDispatch.displayId} - {confirmDispatch.user?.name}</p>
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
