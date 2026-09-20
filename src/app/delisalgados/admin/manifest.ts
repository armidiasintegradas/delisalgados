import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/delisalgados/admin/",
    name: "Deli Salgados Admin",
    short_name: "Deli Admin",
    description: "Painel administrativo Deli Salgados.",
    start_url: "/delisalgados/admin/",
    scope: "/delisalgados/admin/",
    display: "standalone",
    background_color: "#FFFDF9",
    theme_color: "#3C1F15",
    icons: [
      {
        src: "/delisalgados/admin/icon?v=20260920-3",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/delisalgados/admin/apple-icon?v=20260920-3",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
