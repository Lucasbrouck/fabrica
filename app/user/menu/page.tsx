"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui-button";
import { ShoppingBasket, Search, Plus, Minus, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function UserMenu() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(res => res.json()),
      fetch("/api/categories").then(res => res.json()),
      fetch("/api/auth/me").then(res => res.ok ? res.json() : null)
    ]).then(([productsData, categoriesData, userData]) => {
      setProducts(productsData);
      setCategories(categoriesData);
      setUser(userData);
      setLoading(false);
    });
  }, []);

  const addToCart = (product: any) => {
    setCart(curr => {
      const existing = curr.find(item => item.id === product.id);
      if (existing) {
        return curr.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...curr, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(curr => curr.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(curr => curr.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const placeOrder = async () => {
    if (!user) {
      alert("Por favor, faça login para realizar o pedido.");
      window.location.href = "/user/login";
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          totalPrice: total
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Pedido realizado com sucesso!");
        setCart([]);
        setShowCart(false);
      } else {
        alert(data.error || "Erro ao realizar pedido");
      }
    } catch (err) {
      console.error("Order error:", err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-6 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Produtos</h1>
        <button onClick={() => setShowCart(true)} className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 rounded-xl">
          <ShoppingBasket size={24} />
          {cart.length > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-8">
        {/* Categories & Products */}
        {loading ? (
          <div className="space-y-4">
             <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
             <div className="grid grid-cols-1 gap-4">
               {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 glass rounded-2xl animate-pulse" />)}
             </div>
          </div>
        ) : categories.map(cat => (
          <section key={cat.id} className="space-y-3">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">{cat.name}</h2>
            <div className="grid grid-cols-1 gap-4">
              {products.filter(p => p.categoryId === cat.id).map(product => {
                const cartItem = cart.find(item => item.id === product.id);
                return (
                  <div key={product.id} className="bg-white border border-slate-200 shadow-sm flex items-center justify-between p-4 rounded-[1.25rem] hover:border-blue-300 transition-all duration-300 active:scale-[0.98]">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-slate-800 text-sm">{product.name}</h3>
                      <p className="text-base font-black text-blue-600">{formatPrice(product.price)}</p>
                    </div>
                    
                    {cartItem ? (
                      <div className="flex items-center gap-3 bg-slate-50 rounded-full p-1 border border-slate-200 shadow-inner">
                        <button 
                          onClick={() => updateQuantity(product.id, -1)} 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:text-blue-600 transition-colors shadow-sm"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold w-4 text-center text-slate-800">{cartItem.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(product.id, 1)} 
                          className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-md"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(product)} 
                        className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-lg glass-card p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Seu Carrinho</h2>
              <button onClick={() => setShowCart(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-6 pr-2 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-medium">Seu carrinho está vazio.</div>
              ) : cart.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/20">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                    <p className="text-blue-600 font-bold">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/40 rounded-xl p-1 border border-white/60">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-blue-600 transition-colors"><Minus size={16} /></button>
                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-blue-600 transition-colors"><Plus size={16} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="ml-4 p-2 text-red-400 hover:text-red-600"><X size={20} /></button>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-slate-600 text-lg uppercase tracking-wider">Subtotal</span>
                <span className="text-slate-900">{formatPrice(total)}</span>
              </div>
              <Button className="w-full py-6 text-lg" disabled={cart.length === 0} onClick={placeOrder}>
                Finalizar Pedido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
