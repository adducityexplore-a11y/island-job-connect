const { execSync } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

console.log("Building Expo web app...");

const clerkProxyUrl = process.env.CLERK_PROXY_URL
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN || process.env.REPLIT_DEV_DOMAIN}${process.env.CLERK_PROXY_URL}`
  : "";

execSync("pnpm exec expo export --platform web", {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "production",
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || "",
    EXPO_PUBLIC_CLERK_PROXY_URL: clerkProxyUrl,
  },
});

console.log("Web build complete!");
