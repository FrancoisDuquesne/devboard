import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  devtools: { enabled: process.env.NODE_ENV !== "production" },
  ssr: false,
  vite: {
    plugins: [tailwindcss()],
  },
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: "2025-05-23",
  css: ["~/assets/css/main.css"],
  modules: ["@nuxt/ui"],
  app: {
    baseURL: "/",
    head: {
      title: "DevBoard",
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },
  routeRules: {
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
      },
    },
  },
});
