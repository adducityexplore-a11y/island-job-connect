import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  ogImage?: string;
  canonicalPath?: string;
}

const SITE_ORIGIN = "https://thejobsmv.com";
const SITE_BASE_PATH = "/web";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}${SITE_BASE_PATH}/images/maldives_hero.jpg`;

export function SEO({ title, description, ogImage, canonicalPath }: SEOProps) {
  useEffect(() => {
    const fullTitle = title.endsWith(" | The Jobs MV")
      ? title
      : `${title} | The Jobs MV`;
    document.title = fullTitle;

    const currentPath = window.location.pathname.replace(/^\/web(?=\/|$)/, "") || "/";
    const pagePath = canonicalPath || currentPath;
    const normalizedPath = pagePath === "/" ? "" : `/${pagePath.replace(/^\/+|\/+$/g, "")}`;
    const canonicalUrl = `${SITE_ORIGIN}${SITE_BASE_PATH}${normalizedPath}`;
    const imageUrl = ogImage?.startsWith("http")
      ? ogImage
      : ogImage
        ? `${SITE_ORIGIN}${SITE_BASE_PATH}/${ogImage.replace(/^\/+/, "").replace(/^web\//, "")}`
        : DEFAULT_OG_IMAGE;
    const upsert = (selector: string, tag: "meta" | "link", attributes: Record<string, string>) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement(tag);
        document.head.appendChild(element);
      }
      Object.entries(attributes).forEach(([name, value]) => element!.setAttribute(name, value));
    };
    upsert('link[rel="canonical"]', "link", { rel: "canonical", href: canonicalUrl });
    upsert('meta[property="og:title"]', "meta", { property: "og:title", content: fullTitle });
    upsert('meta[property="og:url"]', "meta", { property: "og:url", content: canonicalUrl });
    upsert('meta[name="twitter:title"]', "meta", { name: "twitter:title", content: fullTitle });
    
    // Update meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
      
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', description);
      upsert('meta[name="twitter:description"]', "meta", { name: "twitter:description", content: description });
    }
    
    upsert('meta[property="og:image"]', "meta", { property: "og:image", content: imageUrl });
    upsert('meta[name="twitter:image"]', "meta", { name: "twitter:image", content: imageUrl });
  }, [title, description, ogImage, canonicalPath]);

  return null;
}
