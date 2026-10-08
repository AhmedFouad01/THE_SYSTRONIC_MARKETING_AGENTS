import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Client is served by src/api.ts under /app/ (old web/ pages keep / until parity).
// Output: <CRM_APP>/dist/app. api.ts finds it as ../dist/app (tsx from src/) or ../app (built dist/src/).
export default defineConfig({
	base: "/app/",
	plugins: [react(), tailwindcss()],
	build: { outDir: "../dist/app", emptyOutDir: true },
	server: { proxy: { "/v1": "http://127.0.0.1:4317" } },
});
