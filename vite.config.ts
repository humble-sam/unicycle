import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: mode === "development",
    minify: mode === "production" ? "esbuild" : false,
    rollupOptions: {
      input: path.resolve(__dirname, "index.dev.html"),
    },
  },
  plugins: [
    react(),
    // Rename index.dev.html to index.html in build output
    {
      name: "rename-index",
      closeBundle() {
        const oldPath = path.resolve(__dirname, "dist/index.dev.html");
        const newPath = path.resolve(__dirname, "dist/index.html");
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          console.log("Renamed index.dev.html to index.html");
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
