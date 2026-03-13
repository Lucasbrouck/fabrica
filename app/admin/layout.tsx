import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminNotifications } from "@/components/admin-notifications";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 lg:pl-72 lg:pr-8 lg:py-8">
      <AdminNotifications />
      <AdminSidebar />
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
