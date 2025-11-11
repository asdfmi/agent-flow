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
        workflows: path.resolve(
          appDir,
          "src",
          "pages",
          "workflows",
          "index.html",
        ),
        workflowBuilder: path.resolve(
          appDir,
          "src",
          "pages",
          "workflow-builder",
          "index.html",
        ),
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("pixi.js")) return "pixi";
            if (id.includes("@mui")) return "mui";
            if (id.includes("@emotion")) return "emotion";
            if (id.includes("react")) return "react-vendors";
          }
          if (id.includes("workflow-builder")) {
            return "workflow-builder-core";
          }
          return undefined;
        },
      },
    },
  },
  plugins: [react()],
});
