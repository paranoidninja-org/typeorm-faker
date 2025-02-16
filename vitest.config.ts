/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import swc from "unplugin-swc";

export default defineConfig({
    test: {
        globals: true,
    },
    plugins: [swc.vite()],
});
