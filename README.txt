GHAZI FRAGRANCES BY ALI — FINAL WEBSITE PACKAGE

FILES
- index.html / styles.css / app.js: customer storefront, product detail page, image gallery, cart and WhatsApp checkout.
- admin.html / admin.css / admin.js: secure Supabase sign-in and product management.
- config.js: public Supabase project URL, publishable key and WhatsApp contact numbers.
- upgrade.sql: safe database-column upgrade. Existing products and image_url values are preserved.

BEFORE DEPLOYING
1. Open Supabase Dashboard > SQL Editor.
2. Open upgrade.sql from this package, copy all its contents, and run it once.
   It adds the optional product detail fields and gallery_urls if they do not already exist.
3. Confirm the product-images Storage bucket exists and is public, as in the current setup.
4. Extract this ZIP. In Netlify, open the ghazifragnancebyali site and deploy the extracted folder using the manual deploy / drag-and-drop area.
5. Test the storefront, product detail, bag and WhatsApp checkout.
6. Open https://ghazifragnancebyali.netlify.app/admin.html and sign in with the existing Supabase admin account.

ADMIN IMAGE MANAGEMENT
- Up to 5 JPG, PNG or WEBP images per product; maximum 5 MB each.
- Edit a product to keep its existing images, add more, remove individual images, or choose a new main image.
- The first image is the storefront cover and the first thumbnail on the product detail page.
- Existing image files are not deleted from Storage when removed from a product record, to avoid accidentally breaking other references.

IMPORTANT
- config.js contains only the Supabase publishable key. Never put a Supabase secret/service_role key in website files.
- Products are loaded from Supabase. If the database is unavailable, the website will show an availability message rather than displaying fake sample inventory.
- Product claims such as fragrance notes, inspiration and longevity should only be entered if confirmed by the supplier.
- This package has passed local JavaScript syntax and file-structure checks, but it has not been deployed to or tested against the live Supabase project from this environment. Please verify after deployment.


GOOGLE SEARCH CONSOLE
- The Google site-verification meta tag is already included in index.html.
- After deploying this complete folder to Netlify, open the live homepage source and confirm the tag is present, then click Verify in Google Search Console.


PRODUCT SEO UPDATE (AUTOMATIC)
- Product detail URLs now use /product/PRODUCT-ID/ while keeping the same storefront design and detail layout.
- Product cards are real crawlable links. Existing ?product=PRODUCT-ID links continue to open the product detail view.
- Netlify Edge Function `netlify/edge-functions/product-seo.ts` adds product-specific title, meta description, canonical URL, Open Graph/Twitter tags and Product structured data to direct product-page responses.
- Netlify Function `netlify/functions/sitemap.js` builds sitemap.xml from currently available Supabase products.
- `netlify.toml` configures the product-page fallback, SEO edge function and dynamic sitemap route. `robots.txt` points search engines to the sitemap.
- The functions use the same public Supabase publishable key already present in config.js. Do not replace it with a service_role or secret key.
- Product pages are only included in the sitemap when their Supabase `is_available` value is true.
- Netlify Edge Functions and Functions must be enabled for the site. Deploy the COMPLETE extracted folder, including the `netlify` folder and `netlify.toml`, not just the HTML files.
- After deployment, test one direct URL such as https://ghazifragnancebyali.netlify.app/product/PRODUCT-ID/ and open View Page Source. The source should contain that product's title, description, canonical URL and Product JSON-LD. Also open /sitemap.xml and confirm product URLs appear.
- The existing visual design, product data, cart, admin panel and WhatsApp checkout UI have not been redesigned.
