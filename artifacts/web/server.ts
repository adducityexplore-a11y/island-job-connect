import express, { type Request } from "express";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db, employersTable, jobsTable } from "@workspace/db";

const port = Number(process.env.PORT ?? "22333");
if (!Number.isInteger(port) || port <= 0) throw new Error("PORT must be a positive integer");

function normalizeBasePath(value: string | undefined): string {
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function normalizeOrigin(value: string | undefined): string {
  if (!value) throw new Error("PUBLIC_SITE_URL is required in production");
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("PUBLIC_SITE_URL must be an HTTP(S) URL");
  return url.origin;
}

const basePath = normalizeBasePath(process.env.BASE_PATH);
const siteOrigin = normalizeOrigin(process.env.PUBLIC_SITE_URL);
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const indexTemplate = await readFile(path.join(publicDir, "index.html"), "utf8");

const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  if (req.method === "GET" && req.accepts("html")) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }
  next();
});

const liveCondition = (now: Date) => and(
  eq(jobsTable.status, "active"),
  or(isNull(jobsTable.expiresAt), gt(jobsTable.expiresAt, now)),
  or(isNull(jobsTable.applicationDeadline), gt(jobsTable.applicationDeadline, now)),
);

function publicUrl(route = "/"): string {
  const suffix = route === "/" ? "/" : route;
  return `${siteOrigin}${basePath}${suffix}`;
}

function xmlEscape(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  })[character] ?? character);
}

function htmlEscape(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

function jsonForHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function routePath(req: Request): string {
  const requestPath = req.path;
  return basePath && requestPath.startsWith(`${basePath}/`)
    ? requestPath.slice(basePath.length)
    : requestPath;
}

app.get(["/sitemap.xml", `${basePath}/sitemap.xml`], async (_req, res): Promise<void> => {
  const jobs = await db.select({ id: jobsTable.id, updatedAt: jobsTable.updatedAt })
    .from(jobsTable)
    .where(liveCondition(new Date()));
  const pages = [
    { route: "/", frequency: "daily", priority: "1.0" },
    { route: "/jobs", frequency: "daily", priority: "0.9" },
    { route: "/employers", frequency: "weekly", priority: "0.8" },
    { route: "/companies", frequency: "weekly", priority: "0.8" },
    { route: "/about", frequency: "monthly", priority: "0.7" },
  ];
  const entries = pages.map(({ route, frequency, priority }) =>
    `<url><loc>${xmlEscape(publicUrl(route))}</loc><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`,
  );
  entries.push(...jobs.map((job) =>
    `<url><loc>${xmlEscape(publicUrl(`/jobs/${job.id}`))}</loc><lastmod>${job.updatedAt.toISOString()}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`,
  ));
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`);
});

app.get(["/robots.txt", `${basePath}/robots.txt`], (_req, res) => {
  res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${publicUrl("/sitemap.xml")}\n`);
});

app.get(["/jobs/:id", `${basePath}/jobs/:id`], async (req, res): Promise<void> => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(404).send(indexTemplate);
    return;
  }
  const [job] = await db.select({
    id: jobsTable.id,
    title: jobsTable.title,
    description: jobsTable.description,
    location: jobsTable.location,
    type: jobsTable.type,
    salaryMin: jobsTable.salaryMin,
    salaryMax: jobsTable.salaryMax,
    salaryCurrency: jobsTable.salaryCurrency,
    publishedAt: jobsTable.publishedAt,
    createdAt: jobsTable.createdAt,
    applicationDeadline: jobsTable.applicationDeadline,
    expiresAt: jobsTable.expiresAt,
    imageUrl: jobsTable.imageUrl,
    companyName: employersTable.companyName,
    companyLogo: employersTable.logoUrl,
  }).from(jobsTable)
    .innerJoin(employersTable, eq(jobsTable.employerId, employersTable.id))
    .where(and(eq(jobsTable.id, id), liveCondition(new Date())))
    .limit(1);
  if (!job) {
    res.status(404).send(indexTemplate);
    return;
  }

  const canonical = publicUrl(`/jobs/${job.id}`);
  const description = `Apply for the ${job.title} role at ${job.companyName} in ${job.location || "Maldives"}. View requirements and apply via The Jobs MV.`;
  const image = job.imageUrl || publicUrl("/images/maldives_hero.jpg");
  const posting: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: (job.publishedAt ?? job.createdAt).toISOString(),
    hiringOrganization: {
      "@type": "Organization",
      name: job.companyName,
      ...(job.companyLogo ? { logo: job.companyLogo } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "MV" },
    },
    employmentType: job.type,
    url: canonical,
    ...(job.applicationDeadline || job.expiresAt
      ? { validThrough: (job.applicationDeadline ?? job.expiresAt)!.toISOString() }
      : {}),
    ...(job.salaryCurrency && (job.salaryMin !== null || job.salaryMax !== null)
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.salaryCurrency,
            value: {
              "@type": "QuantitativeValue",
              ...(job.salaryMin !== null ? { minValue: job.salaryMin } : {}),
              ...(job.salaryMax !== null ? { maxValue: job.salaryMax } : {}),
              unitText: "MONTH",
            },
          },
        }
      : {}),
  };
  const title = `${job.title} at ${job.companyName} | The Jobs MV`;
  const metadata = [
    `<title>${htmlEscape(title)}</title>`,
    `<meta name="description" content="${htmlEscape(description)}" />`,
    `<link rel="canonical" href="${htmlEscape(canonical)}" />`,
    `<meta property="og:title" content="${htmlEscape(title)}" />`,
    `<meta property="og:description" content="${htmlEscape(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${htmlEscape(canonical)}" />`,
    `<meta property="og:image" content="${htmlEscape(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${htmlEscape(title)}" />`,
    `<meta name="twitter:description" content="${htmlEscape(description)}" />`,
    `<meta name="twitter:image" content="${htmlEscape(image)}" />`,
    `<script type="application/ld+json">${jsonForHtml(posting)}</script>`,
  ].join("\n    ");
  const html = indexTemplate
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*>/, "")
    .replace(/<meta property="og:[^>]*>/g, "")
    .replace(/<meta name="twitter:[^>]*>/g, "")
    .replace("</head>", `    ${metadata}\n  </head>`);
  res.type("html").send(html);
});

app.use(basePath || "/", express.static(publicDir, { index: false }));
app.get("/{*splat}", (req, res): void => {
  const route = routePath(req);
  const canonical = publicUrl(route);
  res.type("html").send(indexTemplate.replace("</head>", `    <link rel="canonical" href="${htmlEscape(canonical)}" />\n  </head>`));
});

app.listen(port, "0.0.0.0");