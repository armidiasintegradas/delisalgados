import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const metadata: Metadata = {
  title: "Deli Salgados — Admin",
  applicationName: "Deli Salgados Admin",
  manifest: "/delisalgados/admin/manifest.webmanifest?v=20260920-3",
  icons: {
    icon: [
      {
        url: "/delisalgados/admin/icon?v=20260920-3",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: "/delisalgados/admin/icon?v=20260920-3",
    apple: [
      {
        url: "/delisalgados/admin/apple-icon?v=20260920-3",
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
