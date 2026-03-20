import tailwindcss from "@tailwindcss/vite";
import { demoIssues } from "./server/fixtures/issues";
import { demoMentionMrs } from "./server/fixtures/mention-mrs";
import { demoMrs } from "./server/fixtures/mrs";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const baseURL = isGitHubPages ? "/devboard/" : "/";

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
    },
  },
  app: {
    baseURL,
    head: {
      title: "DevBoard",
      link: [{ rel: "icon", type: "image/x-icon", href: `${baseURL}favicon.ico` }],
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
          // MR detail routes — derived from fixtures
          ...[...demoMrs, ...demoMentionMrs].flatMap((mr) => [
            `/api/gitlab/mrs/${mr.projectId}/${mr.iid}`,
            `/api/github/mrs/${mr.projectId}/${mr.iid}`,
          ]),
          // Issue detail routes — derived from fixtures
          ...demoIssues.flatMap((issue) => [
            `/api/gitlab/issues/${issue.projectId}/${issue.iid}`,
            `/api/github/issues/${issue.projectId}/${issue.iid}`,
          ]),
        ],
      },
    }),
  },
});
