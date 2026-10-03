import type { MetadataRoute } from "next";

// Le manifest décrit l'app au téléphone : son nom, son icône et son affichage.
// C'est ce qui permet de l'ajouter à l'écran d'accueil comme une vraie app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mijote",
    short_name: "Mijote",
    description: "L'encyclopédie de plats, le planning et la liste de courses du foyer.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF6EC",
    theme_color: "#C2552D",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
