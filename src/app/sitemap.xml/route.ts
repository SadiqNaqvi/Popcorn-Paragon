import { app_production_url } from "@lib/constants";
import { connectDatabase } from "@lib/database";
import { Post, Shelf, Taleon, Thread, User } from "@model";
import { StrictModel } from "@type/mongoose";
import { NextResponse } from "next/server";

// Cache it for a week;
// export const revalidate = 604800;
export const dynamic = "force-dynamic";

const getUrlsForSitemap = async (collection: "users" | "posts" | "shelves" | "threads" | "taleons"): Promise<string[]> => {

  let Model: StrictModel<any>;
  if (collection === "posts")
    Model = Post;
  else if (collection === "shelves")
    Model = Shelf;
  else if (collection === "taleons")
    Model = Taleon;
  else if (collection === "threads")
    Model = Thread;
  else if (collection === "users")
    Model = User;
  else throw new Error(`Invalid Collection, got: ${collection}`);

  const count = await Model.countDocuments();

  return Array.from(
    { length: Math.ceil(count / 50000) },
    (_, id) => `${app_production_url}/sitemaps/${collection}/sitemap/${id}.xml`
  );
}

const buildSitemapIndex = (sitemaps: string[]) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

  for (const sitemapURL of sitemaps) {
    xml += "<sitemap>";
    xml += `<loc>${sitemapURL}</loc>`;
    xml += "</sitemap>";
  }

  xml += "</sitemapindex>";
  return xml;
}

export const GET = async () => {

  await connectDatabase();

  const userUrls = await getUrlsForSitemap("users");
  const postUrls = await getUrlsForSitemap("posts");
  const shelveUrls = await getUrlsForSitemap("shelves");
  const threadUrls = await getUrlsForSitemap("threads");
  const taleonUrls = await getUrlsForSitemap("taleons");

  const sitemapIndexXML = buildSitemapIndex([
    `${app_production_url}/sitemaps/static/sitemap.xml`,
    ...userUrls,
    ...postUrls,
    ...shelveUrls,
    ...threadUrls,
    ...taleonUrls,
  ]);

  return new NextResponse(sitemapIndexXML, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}