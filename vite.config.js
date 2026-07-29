import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        // Pinned because the salt-mines backend allowlists this exact origin
        // for CORS by default; `strictPort` makes a clash fail loudly instead
        // of silently moving to a port the API will reject.
        port: 5173,
        strictPort: true,
    },
    // Read by Vitest; Vite itself ignores the key.
    test: {
        // Every suite covers pure functions, so there is no DOM to stand up.
        environment: "node",
        include: ["src/**/*.test.js"],
        // `format.js` builds its Intl formatters at module scope, so the
        // rendered dates depend on the machine's zone unless it is pinned.
        env: { TZ: "UTC" },
    },
});
