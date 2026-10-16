import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En développement, Next refuse les requêtes venant d'une autre adresse que localhost.
  // On autorise les adresses du réseau local pour tester sur téléphone (http://10.x.x.x:3000, http://192.168.x.x:3000).
  // Sans effet en production.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*"],
};

export default nextConfig;
