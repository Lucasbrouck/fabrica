"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Plus, Minus, CheckCircle, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui-button";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";

export default function OrderPickingPage() {
  const router = useRouter();
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const fetchOrder = async () => {
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    
    // Initialize pickedQuantity with 0 if it hasn't been picked yet
    const initializedItems = data.items.map((item: any) => ({
      ...item,
      pickedQuantity: item.pickedQuantity || 0
    }));
    
    setOrder({ ...data, items: initializedItems });
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const updateItemPickedQuantity = async (itemId: string, newQuantity: number) => {
    try {
      // Local update for responsiveness
      setOrder((prev: any) => ({
        ...prev,
        items: prev.items.map((item: any) => 
          item.id === itemId ? { ...item, pickedQuantity: newQuantity } : item
        )
      }));

      // Persistent update for progress
      await fetch(`/api/orders/${id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickedQuantity: newQuantity }),
      });
    } catch (err) {
      console.error("Update picker error:", err);
    }
  };

  const handleFinishSeparation = async () => {
    setUpdating(true);
    try {
      // 1. Calcular divergências
      const differences = order.items
        .filter((item: any) => item.pickedQuantity !== item.quantity)
        .map((item: any) => {
           const diff = item.pickedQuantity - item.quantity;
           const name = item.product?.name || "Item";
           // Ex: -2 carnes, +1 frango
           return `${diff > 0 ? '+' : ''}${diff} ${name}`;
        });

      const autoNote = differences.length > 0 
        ? `Pedido separado com divergência: ${differences.join(', ')}`
        : null;

      console.log("[Separador] Divergência calculada:", autoNote);

      // 2. Preparar os itens para atualização
      const updatedItems = order.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.pickedQuantity, 
        price: item.price
      }));

      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "READY_FOR_PICKUP",
          items: updatedItems,
          notes: autoNote
        }),
      });
      
      if (res.ok) {
        router.push("/separador");
      }
    } catch (err) {
      console.error("Finish separation error:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-slate-500 font-medium">Carregando Itens...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push("/separador")}
          className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500 hover:text-slate-900 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Pedido #{order.displayId}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Separando: {order.user.name}</p>
        </div>
      </div>

      <div className="space-y-4">
        {order.items.map((item: any) => {
          return (
            <div 
              key={item.id}
              className={`p-5 rounded-[2rem] border-2 shadow-sm transition-all ${
                checkedItems[item.id] 
                  ? "bg-emerald-50/50 border-emerald-200/80 shadow-emerald-100/10" 
                  : "bg-white border-slate-100"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <h3 className="font-black text-slate-900 text-lg uppercase leading-tight mb-1">{item.product.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No pedido: {item.quantity} unidades</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button 
                    disabled={checkedItems[item.id]}
                    onClick={() => item.pickedQuantity > 0 && updateItemPickedQuantity(item.id, item.pickedQuantity - 1)}
                    className={`w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition-all shadow-sm ${checkedItems[item.id] ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50"}`}
                  >
                    <Minus size={20} />
                  </button>
                  <span className="w-12 text-center text-xl font-black text-slate-900">
                    {item.pickedQuantity}
                  </span>
                  <button 
                    disabled={checkedItems[item.id]}
                    onClick={() => updateItemPickedQuantity(item.id, item.pickedQuantity + 1)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white active:scale-95 transition-all shadow-lg ${checkedItems[item.id] ? "bg-indigo-300 opacity-50 cursor-not-allowed shadow-none" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"}`}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                   <button 
                    type="button"
                    onClick={() => setCheckedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    className={`px-4 py-3 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition-all ${
                      checkedItems[item.id] 
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                        : "bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <CheckCircle size={14} className={checkedItems[item.id] ? "text-emerald-600" : "text-slate-400"} /> OK
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-50">
        <Button 
          variant="primary" 
          className="w-full py-6 text-sm font-black uppercase tracking-widest shadow-xl"
          disabled={updating}
          onClick={handleFinishSeparation}
        >
          {updating ? <Loader2 className="animate-spin" /> : "Finalizar & Atualizar Pedido"}
        </Button>
      </div>
    </div>
  );
}
