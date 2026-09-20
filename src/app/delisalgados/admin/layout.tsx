import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const metadata: Metadata = {
  title: "Deli Salgados — Admin",
  applicationName: "Deli Salgados Admin",
  manifest: "/delisalgados/admin/manifest.webmanifest?v=20260920-4",
  icons: {
    icon: [
      {
        url: "/deli-admin-icon-512.png?v=20260920-4",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: "/deli-admin-icon-512.png?v=20260920-4",
    apple: [
      {
        url: "/deli-admin-apple-touch-icon.png?v=20260920-4",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Deli Salgados Admin",
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function DeliSalgadosAdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
