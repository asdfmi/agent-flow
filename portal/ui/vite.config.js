import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const appDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: appDir,
  build: {
    outDir: path.resolve(appDir, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        workflows: path.resolve(appDir, "src", "pages", "workflows", "index.html"),
        workflowBuilder: path.resolve(appDir, "src", "pages", "workflow-builder", "index.html"),
      },
    },
  },
  plugins: [react()],
});
