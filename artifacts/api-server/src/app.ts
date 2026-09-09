import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./middlewares/clerkProxyMiddleware";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db, employersTable, jobsTable } from "@workspace/db";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        const url = req.url?.split("?")[0];
        return {
          id: req.id,
          method: req.method,
          url: url?.startsWith("/api/storage/objects/") ? "/api/storage/objects/[redacted]" : url,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware((req) => ({
  publishableKey: publishableKeyFromHost(getClerkProxyHost(req) ?? "", process.env.CLERK_PUBLISHABLE_KEY),
})));

const sitemapOrigin = "https://thejobsmv.com";
const sitemapStaticUrls = [
  `${sitemapOrigin}/web/`,
  `${sitemapOrigin}/web/jobs`,
  `${sitemapOrigin}/web/companies`,
  `${sitemapOrigin}/web/employers`,
  `${sitemapOrigin}/web/about`,
];

function xmlEscape(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character]!);
}

app.get("/web/sitemap.xml", async (_req, res): Promise<void> => {
  const now = new Date();
  const [jobs, companies] = await Promise.all([
    db.select({ id: jobsTable.id }).from(jobsTable).where(and(
      eq(jobsTable.status, "active"),
      or(isNull(jobsTable.expiresAt), gt(jobsTable.expiresAt, now)),
      or(isNull(jobsTable.applicationDeadline), gt(jobsTable.applicationDeadline, now)),
    )),
    db.select({ id: employersTable.id }).from(employersTable),
  ]);
  const urls = [
    ...sitemapStaticUrls,
    ...jobs.map(({ id }) => `${sitemapOrigin}/web/jobs/${id}`),
    ...companies.map(({ id }) => `${sitemapOrigin}/web/companies/${id}`),
  ];
  const entries = urls.map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`).join("\n");

  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`,
  );
});

app.use("/api", router);

export default app;
