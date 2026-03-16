"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShoppingBag, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function AdminNotifications() {
  const [newOrder, setNewOrder] = useState<any>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();

  // Don't show or poll on login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;

    const checkOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) return;
        const orders = await res.json();
        
        if (orders.length > 0) {
          const latestOrder = orders[0];
          
          // Verify if it's really a new order (based on ID)
          if (lastOrderId && latestOrder.id !== lastOrderId) {
            // New order detected!
            setNewOrder(latestOrder);
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.log("Audio play blocked: interaction required"));
            }
          }
          
          setLastOrderId(latestOrder.id);
        }
      } catch (err) {
        console.error("Failed to poll orders:", err);
      }
    };

    // Initial check to set the baseline
    checkOrders();

    const interval = setInterval(checkOrders, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [lastOrderId, isLoginPage]);

  if (isLoginPage) return null;

  return (
    <>
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      
      <AnimatePresence>
        {newOrder && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
            className="fixed top-6 right-6 z-[100] w-full max-w-sm"
          >
            <div className="bg-white/95 backdrop-blur-xl border border-blue-100 shadow-2xl shadow-blue-400/20 rounded-3xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                    <Bell size={24} className="animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Novo Pedido Recebido!</h3>
                    <p className="text-xs font-bold text-blue-600">Pedido #{newOrder.displayId}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setNewOrder(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</span>
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{newOrder.user?.name || "Usuário"}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                    <span className="text-base font-black text-blue-600">{formatPrice(newOrder.totalPrice)}</span>
                 </div>
              </div>

              <button 
                onClick={() => {
                  window.location.href = "/admin/orders";
                  setNewOrder(null);
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Abrir Monitor
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
