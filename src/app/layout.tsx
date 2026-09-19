import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cartContext";

export const metadata: Metadata = {
  title: "Deli Salgados — Cardápio Digital",
  description: "Cardápio digital oficial e encomendas da Deli Salgados.",
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
        </CartProvider>
      </body>
    </html>
  );
}
