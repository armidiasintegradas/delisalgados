import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cartContext";
import { PWAInstallPrompt } from "@/components/public/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "Deli Salgados — Cardápio Digital",
  applicationName: "Deli Salgados",
  description: "Cardápio digital oficial e encomendas da Deli Salgados.",
  manifest: "/manifest.webmanifest",
  themeColor: "#E05A36",
  appleWebApp: {
    capable: true,
    title: "Deli Salgados",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/logo-square.png",
    apple: "/logo-square.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#F5F2EB] text-[#3C1F15] antialiased min-h-screen flex flex-col">
        <CartProvider>
          {children}
          <PWAInstallPrompt />
        </CartProvider>
      </body>
    </html>
  );
}
