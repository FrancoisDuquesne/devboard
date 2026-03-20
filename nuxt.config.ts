import tailwindcss from "@tailwindcss/vite";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

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
      colors: [
        "primary",
        "secondary",
        "success",
        "info",
        "warning",
        "error",
        "neutral",
        "filter",
      ],
    },
  },
  runtimeConfig: {
    public: {
      demoMode: process.env.DEMO_MODE === "true",
      githubPages: isGitHubPages,
    },
  },
  app: {
    baseURL: isGitHubPages ? "/devboard/" : "/",
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
  ...(isGitHubPages && {
    nitro: {
      prerender: {
        routes: [
          // List endpoints
          "/api/gitlab/status",
          "/api/github/status",
          "/api/gitlab/mrs",
          "/api/github/mrs",
          "/api/gitlab/issues",
          "/api/github/issues",
          "/api/gitlab/todos",
          "/api/github/todos",
          "/api/gitlab/mention-mrs",
          "/api/github/mention-mrs",
          "/api/worktrees",
          // MR detail routes (projectId/iid from demo fixtures)
          "/api/gitlab/mrs/103/14",
          "/api/github/mrs/103/14",
          "/api/gitlab/mrs/101/42",
          "/api/github/mrs/101/42",
          "/api/gitlab/mrs/102/87",
          "/api/github/mrs/102/87",
          "/api/gitlab/mrs/101/43",
          "/api/github/mrs/101/43",
          "/api/gitlab/mrs/101/38",
          "/api/github/mrs/101/38",
          "/api/gitlab/mrs/102/91",
          "/api/github/mrs/102/91",
          "/api/gitlab/mrs/101/39",
          "/api/github/mrs/101/39",
          "/api/gitlab/mrs/103/9",
          "/api/github/mrs/103/9",
          "/api/gitlab/mrs/103/12",
          "/api/github/mrs/103/12",
          // Issue detail routes
          "/api/gitlab/issues/101/21",
          "/api/github/issues/101/21",
          "/api/gitlab/issues/102/55",
          "/api/github/issues/102/55",
          "/api/gitlab/issues/103/8",
          "/api/github/issues/103/8",
        ],
      },
    },
  }),
});
