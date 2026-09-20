import type { Metadata } from "next";
import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const metadata: Metadata = {
  title: "Deli Salgados — Admin",
  icons: {
    icon: "/admin-favicon.svg",
    shortcut: "/admin-favicon.svg",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
