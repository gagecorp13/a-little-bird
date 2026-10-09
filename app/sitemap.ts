import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/privacy"].map((path) => ({ url: "https://alittlebird.com" + path }));
}
