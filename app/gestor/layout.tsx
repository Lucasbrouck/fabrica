import { AdminNotifications } from "@/components/admin-notifications";

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <div className="px-8 pt-6 flex-shrink-0">
        <AdminNotifications />
      </div>
      <main className="w-full flex-1 min-h-0 overflow-hidden px-8 py-8 pt-4">
        {children}
      </main>
    </div>
  );
}
