import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"
import { execSync } from "child_process"

const commitCount = execSync("git rev-list --count HEAD").toString().trim()

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(`2.0.${commitCount}`)
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "What Todo",
        short_name: "What Todo",
        description: "A simple todo app for managing your tasks",
        theme_color: "#151925",
        background_color: "#151925",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon-48.png",
            sizes: "48x48",
            type: "image/png"
          },
          {
            src: "/icon-128.png",
            sizes: "128x128",
            type: "image/png"
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff,woff2}"]
      }
    })
  ],
  test: {
    environment: "happy-dom",
    globals: true,
    exclude: ["e2e/**", "node_modules/**"]
  }
})
