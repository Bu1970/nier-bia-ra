import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Il base path deve corrispondere esattamente al nome del repository GitHub.
// Es.: se il repo è https://github.com/tuouser/nier-bia-ra
//      il base path è "/nier-bia-ra/"
// Se usi un dominio personalizzato (es. nier-bia-ra.fareva.it) imposta base: "/"

export default defineConfig({
  plugins: [react()],
  base: "/nier-bia-ra/",
  build: {
    outDir:    "dist",
    sourcemap: true,
  },
});
