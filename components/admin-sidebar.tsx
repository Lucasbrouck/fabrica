"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Users, ShoppingCart, LogOut, MessageCircle, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: ClipboardList, label: "Pedidos", href: "/admin/orders" },
  { icon: Package, label: "Produtos", href: "/admin/products" },
  { icon: Users, label: "Usuários", href: "/admin/users" },
  { icon: MessageCircle, label: "SAC", href: "/admin/sac" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-64 glass rounded-2xl p-6 flex-col gap-8 z-50">
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
          P
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800">Admin PDV</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button 
        onClick={async () => {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch (e) {
            console.error('Logout failed', e);
          } finally {
            window.location.href = "/";
          }
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors"
      >
        <LogOut size={20} />
        Sair
      </button>
    </aside>
  );
}
