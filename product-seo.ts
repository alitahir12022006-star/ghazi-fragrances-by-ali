const SUPABASE_URL = "https://kmawnzsiuthbtqfzoaol.supabase.co";
const SUPABASE_KEY = "sb_publishable_QOiBH7Uoa0Mv-QskXAvjTg_73ipzBnX";
const SITE_NAME = "Ghazi Fragrances by Ali";

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

const cleanText = (value, fallback) => {
  const text = String(value || fallback || "").replace(/\s+/g, " ").trim();
  return text.slice(0, 155);
};

export default async (request, context) => {
  const match = new URL(request.url).pathname.match(/^\/product\/([^/]+)\/?$/);
  if (!match) return context.next();

  const id = decodeURIComponent(match[1]);
  const page = await context.next();
  if (!page || !page.ok || !page.headers.get("content-type")?.includes("text/html")) return page;

  try {
    const apiUrl = new URL(`${SUPABASE_URL}/rest/v1/products`);
    apiUrl.searchParams.set("select", "*");
    apiUrl.searchParams.set("id", `eq.${id}`);
    apiUrl.searchParams.set("is_available", "eq.true");

    const productResponse = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json"
      }
    });
    if (!productResponse.ok) return page;

    const rows = await productResponse.json();
    const product = Array.isArray(rows) ? rows[0] : null;
    if (!product) return page;

    const name = String(product.name || "Fragrance");
    const category = String(product.category || "Fragrance");
    const title = `${name} 50ML | ${SITE_NAME}`;
    const description = cleanText(
      product.long_description || product.description,
      `Discover ${name} 50ML ${category.toLowerCase()} at ${SITE_NAME}. Cash on Delivery across Pakistan.`
    );
    const canonical = `${new URL(request.url).origin}/product/${encodeURIComponent(id)}/`;
    const gallery = Array.isArray(product.gallery_urls) ? product.gallery_urls : [];
    const image = product.image_url || gallery[0] || "";
    const price = Number(product.price);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      description,
      category,
      brand: { "@type": "Brand", name: "Ghazi Fragrances" },
      image: image ? [image] : undefined,
      sku: String(product.id),
      offers: Number.isFinite(price) ? {
        "@type": "Offer",
        priceCurrency: "PKR",
        price: price.toString(),
        availability: "https://schema.org/InStock",
        url: canonical
      } : undefined
    };

    let html = await page.text();
    const meta = [
      `<title>${escapeHtml(title)}</title>`,
      `<meta name="description" content="${escapeHtml(description)}">`,
      `<meta name="robots" content="index, follow">`,
      `<link rel="canonical" href="${escapeHtml(canonical)}">`,
      `<meta property="og:type" content="product">`,
      `<meta property="og:site_name" content="${SITE_NAME}">`,
      `<meta property="og:title" content="${escapeHtml(title)}">`,
      `<meta property="og:description" content="${escapeHtml(description)}">`,
      `<meta property="og:url" content="${escapeHtml(canonical)}">`,
      image ? `<meta property="og:image" content="${escapeHtml(image)}">` : "",
      `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`,
      `<meta name="twitter:title" content="${escapeHtml(title)}">`,
      `<meta name="twitter:description" content="${escapeHtml(description)}">`,
      image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : "",
      `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`
    ].filter(Boolean).join("\n");

    html = html
      .replace(/<title>[\s\S]*?<\/title>/i, "")
      .replace(/<meta\s+name=["']description["'][^>]*>/i, "")
      .replace(/<meta\s+name=["']robots["'][^>]*>/i, "")
      .replace(/<link\s+rel=["']canonical["'][^>]*>/i, "")
      .replace(/<meta\s+property=["']og:[^>]*>/gi, "")
      .replace(/<meta\s+name=["']twitter:[^>]*>/gi, "")
      .replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "")
      .replace("</head>", `${meta}\n</head>`);

    const headers = new Headers(page.headers);
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("cache-control", "public, max-age=0, s-maxage=300, stale-while-revalidate=3600");
    return new Response(html, { status: page.status, statusText: page.statusText, headers });
  } catch (error) {
    console.error("Product SEO rendering failed:", error);
    return page;
  }
};
