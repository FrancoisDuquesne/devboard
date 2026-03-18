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
  ui: {
    theme: {
      colors: ["filter"],
    },
  },
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
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.iconify.design; font-src 'self' data:",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Cross-Origin-Opener-Policy": "same-origin",
      },
    },
    "/api/**": {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  },
});
