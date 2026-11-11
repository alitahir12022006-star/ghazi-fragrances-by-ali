const SUPABASE_URL = "https://kmawnzsiuthbtqfzoaol.supabase.co";
const SUPABASE_KEY = "sb_publishable_QOiBH7Uoa0Mv-QskXAvjTg_73ipzBnX";

const xmlEscape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
}[char]));

exports.handler = async (event) => {
  const origin = new URL(event.rawUrl || `https://${event.headers.host}`).origin;
  const urls = [{ loc: `${origin}/`, priority: "1.0" }];

  try {
    const apiUrl = new URL(`${SUPABASE_URL}/rest/v1/products`);
    apiUrl.searchParams.set("select", "id,updated_at");
    apiUrl.searchParams.set("is_available", "eq.true");
    apiUrl.searchParams.set("order", "created_at.asc");
    const response = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json"
      }
    });
    if (response.ok) {
      const products = await response.json();
      for (const product of products) {
        if (!product.id) continue;
        urls.push({
          loc: `${origin}/product/${encodeURIComponent(product.id)}/`,
          lastmod: product.updated_at || undefined,
          priority: "0.8"
        });
      }
    }
  } catch (error) {
    console.error("Sitemap product lookup failed:", error);
  }

  const entries = urls.map((item) => `
  <url>
    <loc>${xmlEscape(item.loc)}</loc>
    ${item.lastmod ? `<lastmod>${xmlEscape(item.lastmod)}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join("");

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600"
    },
    body: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}\n</urlset>`
  };
};
