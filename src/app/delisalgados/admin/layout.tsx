import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const metadata: Metadata = {
  title: "Deli Salgados — Admin",
  applicationName: "Deli Salgados Admin",
  manifest: "/delisalgados/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Deli Salgados Admin",
    statusBarStyle: "default",
  },
};

export default function DeliSalgadosAdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
