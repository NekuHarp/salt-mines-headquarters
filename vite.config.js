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
});
