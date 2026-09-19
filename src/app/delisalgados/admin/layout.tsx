import { AdminLayout } from "@/components/admin/AdminLayout";

export default function DeliSalgadosAdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
