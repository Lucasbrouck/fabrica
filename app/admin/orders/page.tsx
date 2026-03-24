"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui-button";
import { 
  Clock, CheckCircle2, Truck, CheckCircle, XCircle, 
  ShoppingBasket, Plus, Minus, X, Search, FileText, 
  Loader2, LogOut, PlusCircle, User, Tag, ArrowRight,
  Filter, ChevronRight, MoreVertical, Package, ChevronDown, ChevronUp
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
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  
  // Create Order State
  const [isCreating, setIsCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [modalDiscount, setModalDiscount] = useState<number>(0);
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [itemsCollapsed, setItemsCollapsed] = useState(true);

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
    setModalDiscount(order.discount || 0);
    setEditingItems(JSON.parse(JSON.stringify(order.items)));
    setIsEditing(false);
    setItemsCollapsed(true);
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

  const handleSaveDiscount = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discount: modalDiscount }),
      });
      if (res.ok) {
        fetchOrders();
        setSelectedOrder(null);
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar desconto");
      }
    } catch (error) {
       alert("Erro ao salvar desconto");
    }
  };

  const updateCartQuantity = (product: any, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prev.filter(item => item.id !== product.id);
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item);
      }
      if (delta > 0) {
        return [...prev, { ...product, quantity: delta }];
      }
      return prev;
    });
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
    CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle },
  };

  const filters = [
    { label: "Todos", value: "ALL" },
    { label: "Novos", value: "PLACED" },
    { label: "Em Separação", value: "PREPARING" },
    { label: "Em Rota", value: "DISPATCHED" },
    { label: "Concluídos", value: "DELIVERED" },
    { label: "Cancelados", value: "CANCELLED" },
  ];

  const filteredOrders = orders.filter(o => {
    const matchesStatus = activeFilter === "ALL" || 
      (activeFilter === "PREPARING" ? ["PREPARING", "READY_FOR_PICKUP"].includes(o.status) : o.status === activeFilter);
      
    const matchesPayment = paymentFilter === "ALL" || 
      (paymentFilter === "CONFIRMED" ? ["CONFIRMED", "RECEIVED"].includes(o.asaasPaymentStatus) : o.asaasPaymentStatus === paymentFilter);
      
    return matchesStatus && matchesPayment;
  });

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
      <div className="flex flex-col gap-3 pb-2">
        <div className="flex flex-wrap gap-2">
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

        <div className="flex flex-wrap gap-2">
          {[
            { label: "Todas Cobranças", value: "ALL" },
            { label: "Pendentes", value: "PENDING" },
            { label: "Pagas", value: "CONFIRMED" },
            { label: "Vencidas", value: "OVERDUE" }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setPaymentFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border",
                paymentFilter === f.value 
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                  : "bg-white/80 text-slate-500 border-slate-100 hover:border-slate-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List View */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data/Hora</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cobrança</th>
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
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                          order.asaasPaymentStatus === "CONFIRMED" || order.asaasPaymentStatus === "RECEIVED" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          order.asaasPaymentStatus === "OVERDUE" ? "bg-red-50 text-red-600 border border-red-100" :
                          order.asaasPaymentStatus === "CANCELLED" ? "bg-red-50 text-red-600 border border-red-100" : 
                          order.asaasPaymentStatus === "CANCELLED" ? "bg-red-50 text-red-600 border border-red-100" :
                          order.asaasPaymentStatus === "PENDING" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-slate-50 text-slate-500 border border-slate-100"
                        )}>
                          {order.asaasPaymentStatus === "CONFIRMED" || order.asaasPaymentStatus === "RECEIVED" ? "PAGO" :
                           order.asaasPaymentStatus === "OVERDUE" ? "VENCIDO" :
                           order.asaasPaymentStatus === "CANCELLED" ? "CANCELADO" :
                           order.asaasPaymentStatus === "CANCELLED" ? "CANCELADO" :
                           order.asaasPaymentStatus === "PENDING" ? "PENDENTE" : "AGUARDANDO"}
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
                        ) : order.status === "DISPATCHED" ? (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3 rounded-lg text-[10px] font-bold" onClick={() => updateStatus(order.id, "DELIVERED")}>
                            Concluir
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

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 p-4 bg-slate-50/50">
          {filteredOrders.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-30 text-slate-500">
              <ShoppingBasket size={48} />
              <p className="font-black uppercase tracking-widest text-xs">Nenhum pedido encontrado</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const status = statusMap[order.status] || statusMap.PLACED;
              const StatusIcon = status.icon;

              return (
                <div 
                  key={order.id} 
                  onClick={() => handleOpenModal(order)}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 cursor-pointer active:scale-98 transition-transform"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-slate-400 text-xs">#{order.displayId}</span>
                      <span className="font-bold text-slate-900 mt-1 uppercase text-sm tracking-tight">{order.user?.name || "Cliente Final"}</span>
                    </div>
                    <span className="font-black text-blue-600 text-base">{formatPrice(order.totalPrice)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                      status.color
                    )}>
                      <StatusIcon size={12} />
                      {order.status === "READY_FOR_PICKUP" ? "Separado" : status.label}
                    </span>

                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                      order.asaasPaymentStatus === "CONFIRMED" || order.asaasPaymentStatus === "RECEIVED" ? "bg-emerald-50 text-emerald-600" :
                      order.asaasPaymentStatus === "OVERDUE" ? "bg-red-50 text-red-600" :
                      order.asaasPaymentStatus === "PENDING" ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500"
                    )}>
                      {order.asaasPaymentStatus === "CONFIRMED" || order.asaasPaymentStatus === "RECEIVED" ? "PAGO" :
                       order.asaasPaymentStatus === "OVERDUE" ? "VENCIDO" : "PENDENTE"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50 text-slate-400 text-[10px] font-bold">
                     <span>{new Date(order.createdAt).toLocaleDateString('pt-BR')} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     <ChevronRight size={16} className="text-slate-300" />
                  </div>
                </div>
              );
            })
          )}
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredProducts.map(p => {
                      const cartItem = cart.find(item => item.id === p.id);
                      const quantity = cartItem?.quantity || 0;
                      
                      return (
                        <div 
                           key={p.id}
                           className={cn(
                             "bg-white p-3 rounded-2xl border transition-all flex flex-col justify-between min-h-[120px]",
                             quantity > 0 ? "border-blue-600 ring-2 ring-blue-500/10 shadow-md" : "border-slate-200"
                           )}
                        >
                           <div>
                             <h4 className="font-bold text-slate-800 text-[11px] uppercase mb-1 line-clamp-2 leading-tight">{p.name}</h4>
                             <p className="text-blue-600 font-black text-sm">{formatPrice(p.price)}</p>
                           </div>

                           <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                              {quantity === 0 ? (
                                <button 
                                  onClick={() => updateCartQuantity(p, 1)}
                                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase"
                                >
                                  <Plus size={14} /> Adicionar
                                </button>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <button 
                                    onClick={() => updateCartQuantity(p, -1)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="text-sm font-black text-blue-600">{quantity}</span>
                                  <button 
                                    onClick={() => updateCartQuantity(p, 1)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              )}
                           </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>

            {/* Right Column: Order Details & User */}
            <div className="w-[380px] flex flex-col bg-white overflow-hidden">
               <div className="p-6 border-b border-slate-50 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cliente Solicitante</label>
                    {selectedUser ? (
                      <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl shadow-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shrink-0">
                            {selectedUser.name[0].toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-sm leading-tight truncate">{selectedUser.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{selectedUser.email}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedUser(null);
                            setUserSearch("");
                          }} 
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase transition-colors shrink-0"
                        >
                          Alterar
                        </button>
                      </div>
                    ) : (
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <Search size={18} />
                        </div>
                        <input 
                          type="text" 
                          placeholder="Nome ou e-mail do cliente..." 
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-medium"
                        />
                        
                        {userSearch.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="max-h-[240px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                              {filteredUsers.length > 0 ? filteredUsers.slice(0, 10).map(u => (
                                <button 
                                  key={u.id}
                                  onClick={() => setSelectedUser(u)}
                                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 group/item"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors shrink-0">
                                    <User size={14} />
                                  </div>
                                  <div className="overflow-hidden">
                                    <p className="text-xs font-black text-slate-700 truncate">{u.name}</p>
                                    <p className="text-[9px] text-slate-400 truncate uppercase mt-0.5">{u.email}</p>
                                  </div>
                                </button>
                              )) : (
                                <div className="p-4 text-center">
                                  <p className="text-xs text-slate-400 font-bold">Nenhum cliente encontrado</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-slate-50/30">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carrinho ({cart.reduce((acc, i) => acc + i.quantity, 0)} itens)</h3>
                    {cart.length > 0 && (
                      <button 
                        onClick={() => setCart([])}
                        className="text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest"
                      >
                        Limpar Tudo
                      </button>
                    )}
                  </div>
                  
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 text-slate-900 space-y-2">
                       <ShoppingBasket size={32} />
                       <p className="text-[10px] font-black uppercase tracking-widest">Carrinho Vazio</p>
                    </div>
                  ) : cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm animate-in slide-in-from-right-4 duration-200">
                       <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black text-[11px] shrink-0">
                          {item.quantity}x
                       </div>
                       <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-slate-800 text-[10px] uppercase truncate leading-tight">{item.name}</p>
                          <p className="text-[10px] text-blue-600 font-black mt-0.5">{formatPrice(item.price * item.quantity)}</p>
                       </div>
                       <div className="flex gap-0.5 shrink-0">
                         <button 
                           onClick={() => updateCartQuantity(item, -1)}
                           className="p-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                         >
                           <Minus size={12} />
                         </button>
                         <button 
                           onClick={() => updateCartQuantity(item, 1)}
                           className="p-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                         >
                           <Plus size={12} />
                         </button>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="p-4 border-t border-slate-50 space-y-3 shrink-0 bg-white">
                  <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span>SUBTOTAL</span>
                        <span>{formatPrice(cart.reduce((acc, i) => acc + i.price * i.quantity, 0))}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-bold text-red-500">
                        <div className="flex items-center gap-1.5">
                           <Tag size={10} />
                           <span>DESCONTO (R$)</span>
                        </div>
                        <input 
                          type="number" 
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          className="w-16 bg-transparent text-right focus:outline-none font-black"
                          placeholder="0,00"
                        />
                     </div>
                     <div className="flex justify-between items-center text-base font-black text-blue-600 pt-1.5 border-t border-slate-200">
                        <span>TOTAL</span>
                        <span>{formatPrice(Math.max(0, cart.reduce((acc, i) => acc + i.price * i.quantity, 0) - discount))}</span>
                     </div>
                  </div>

                  <Button 
                    onClick={handleCreateOrder}
                    disabled={!selectedUser || cart.length === 0}
                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
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
                  <div className="flex items-center gap-2">
                     <button 
                       onClick={() => window.open(`/api/orders/${selectedOrder.id}/pdf`, "_blank")}
                       className="p-2 text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 rounded-xl flex items-center gap-1 text-xs font-bold border border-slate-100"
                     >
                       <FileText size={16} /> <span>Romaneio</span>
                     </button>
                     <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 custom-scrollbar">
                  <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens do Pedido ({selectedOrder.items?.length || 0})</h3>
                         <button 
                           onClick={() => setItemsCollapsed(!itemsCollapsed)}
                           className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1"
                         >
                           {itemsCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                           {itemsCollapsed ? "Expandir" : "Recolher"}
                         </button>
                      </div>
                      
                      {!itemsCollapsed && (
                         <div className="space-y-1">
                            {selectedOrder.items?.map((item: any, idx: number) => (
                               <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 text-sm">
                                  <span className="font-bold text-slate-700">{item.quantity}x {item.product?.name}</span>
                                  <span className="font-black text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                               </div>
                            ))}
                         </div>
                      )}
                   </div>
 
                  {selectedOrder.notes && (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-2 text-amber-800">
                       <Tag size={16} className="shrink-0 mt-0.5" />
                       <div>
                          <p className="text-xs font-black uppercase tracking-wider mb-0.5">Divergência de Separação</p>
                          <p className="text-xs font-semibold text-amber-900/80">{selectedOrder.notes}</p>
                       </div>
                    </div>
                  )}

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                     {(() => {
                        const subtotalItems = selectedOrder.items?.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0) || 0;
                        const hasExtraCosts = (selectedOrder.shipping || 0) > 0 || (selectedOrder.tax || 0) > 0;
                        
                        return (
                           <>
                             {hasExtraCosts && (
                               <div className="space-y-1 pb-2 border-b border-slate-200/50">
                                  <div className="flex justify-between items-center text-xs text-slate-500">
                                     <span>Subtotal</span>
                                     <span>{formatPrice(subtotalItems)}</span>
                                  </div>
                                  {selectedOrder.shipping > 0 && (
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                       <span>Frete</span>
                                       <span>{formatPrice(selectedOrder.shipping)}</span>
                                    </div>
                                  )}
                                  {selectedOrder.tax > 0 && (
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                       <span>Taxa</span>
                                       <span>{formatPrice(selectedOrder.tax)}</span>
                                    </div>
                                  )}
                               </div>
                             )}

                             {['PLACED', 'PREPARING', 'READY_FOR_PICKUP'].includes(selectedOrder.status) ? (
                                <div className="flex justify-between items-center text-xs font-bold text-red-500">
                                   <div className="flex items-center gap-1.5">
                                      <Tag size={12} />
                                      <span>DESCONTO (R$)</span>
                                   </div>
                                   <input 
                                     type="number" 
                                     value={modalDiscount}
                                     onChange={(e) => setModalDiscount(Number(e.target.value))}
                                     className="w-20 bg-transparent text-right focus:outline-none font-black border-b border-slate-300 px-1"
                                     placeholder="0,00"
                                   />
                                </div>
                             ) : selectedOrder.discount > 0 ? (
                                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                   <span>DESCONTO</span>
                                   <span className="text-red-500">-{formatPrice(selectedOrder.discount)}</span>
                                </div>
                             ) : null}

                             <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Valor Final</span>
                                <span className="text-3xl font-black text-blue-600">
                                   {formatPrice(Math.max(0, subtotalItems + (selectedOrder.shipping || 0) + (selectedOrder.tax || 0) - modalDiscount))}
                                </span>
                             </div>
                           </>
                        )
                     })()}
                  </div>

                  {/* Billing & Receipt Info */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Informações de Pagamento</h3>
                     
                     <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col gap-3">
                        <div className="flex justify-between items-center text-sm">
                           <span className="font-bold text-slate-500">Status Asaas:</span>
                           <span className={cn(
                             "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                             selectedOrder.asaasPaymentStatus === "CONFIRMED" || selectedOrder.asaasPaymentStatus === "RECEIVED" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                             selectedOrder.asaasPaymentStatus === "OVERDUE" ? "bg-red-50 text-red-600 border border-red-100" : 
                             selectedOrder.asaasPaymentStatus === "CANCELLED" ? "bg-red-50 text-red-600 border border-red-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                           )}>
                             {selectedOrder.asaasPaymentStatus || "AGUARDANDO GERAÇÃO"}
                           </span>
                        </div>

                        {selectedOrder.asaasPaymentDueDate && (
                           <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-slate-500">Vencimento:</span>
                              <span className="font-black text-slate-800">{selectedOrder.asaasPaymentDueDate}</span>
                           </div>
                        )}

                        {selectedOrder.asaasPaymentUrl && (
                           <a 
                             href={selectedOrder.asaasPaymentUrl} 
                             target="_blank" 
                             className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-colors"
                           >
                             <FileText size={16} /> Baixar Boleto / Pagar
                           </a>
                        )}
                     </div>

                     {/* Receipt proof / Signature */}
                     <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-3">
                        <p className="text-xs font-bold text-slate-500">Detalhes do Recebimento:</p>
                        {selectedOrder.signature ? (
                           <div className="space-y-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold uppercase">
                                 <CheckCircle2 size={12} /> Recebido por {selectedOrder.receiverName || "Cliente"}
                              </span>
                              <div className="p-3 bg-white rounded-2xl border border-slate-100 flex justify-center max-h-[120px] overflow-hidden">
                                 <img src={selectedOrder.signature} alt="Assinatura Recebimento" className="max-h-full object-contain" />
                              </div>
                           </div>
                        ) : selectedOrder.status === "DELIVERED" && !selectedOrder.signature ? (
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase">
                              <CheckCircle2 size={12} /> Recebido sem assinatura (Administrador)
                           </span>
                        ) : selectedOrder.asaasPaymentStatus === "CONFIRMED" || selectedOrder.asaasPaymentStatus === "RECEIVED" ? (
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-[10px] font-bold uppercase">
                              <CheckCircle2 size={12} /> Recebido via QR Code / Gateway
                           </span>
                        ) : (
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold uppercase">
                              Aguardando Recebimento
                           </span>
                        )}
                     </div>
                  </div>
               </div>

               <div className="p-8 pt-0 flex gap-4">
                  <Button variant="secondary" className="flex-1 py-4 font-bold uppercase tracking-widest text-xs" onClick={() => setSelectedOrder(null)}>Fechar</Button>
                  
                  {modalDiscount !== selectedOrder.discount && ['PLACED', 'PREPARING', 'READY_FOR_PICKUP'].includes(selectedOrder.status) && (
                    <Button className="flex-1 py-4 font-bold uppercase tracking-widest text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveDiscount}>Salvar Desconto</Button>
                  )}

                  {selectedOrder.status === 'PLACED' && modalDiscount === selectedOrder.discount && (
                    <Button variant="primary" className="flex-1 py-4 font-bold uppercase tracking-widest text-xs" onClick={() => updateStatus(selectedOrder.id, 'PREPARING')}>Aceitar Pedido</Button>
                  )}

                  {selectedOrder.status === 'DISPATCHED' && (
                    <Button variant="primary" className="flex-1 py-4 font-bold uppercase tracking-widest text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateStatus(selectedOrder.id, 'DELIVERED')}>Concluir Pedido</Button>
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
