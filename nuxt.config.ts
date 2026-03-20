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
  nitro: {
    ...(isGitHubPages && {
      prerender: {
        // Keep in sync with server/fixtures/ — update when adding/removing demo MRs or issues.
        routes: [
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
          // MR detail routes (projectId/iid from server/fixtures/mrs.ts + mention-mrs.ts)
          ...[
            [103, 14],
            [101, 42],
            [102, 87],
            [101, 43],
            [101, 38],
            [102, 91],
            [101, 39],
            [103, 9],
            [103, 12],
          ].flatMap(([p, i]) => [
            `/api/gitlab/mrs/${p}/${i}`,
            `/api/github/mrs/${p}/${i}`,
          ]),
          // Issue detail routes (projectId/iid from server/fixtures/issues.ts)
          ...[
            [101, 21],
            [102, 55],
            [103, 8],
          ].flatMap(([p, i]) => [
            `/api/gitlab/issues/${p}/${i}`,
            `/api/github/issues/${p}/${i}`,
          ]),
        ],
      },
    }),
  },
});
