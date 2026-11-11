(() => {
  const cfg = window.GHAZI_CONFIG || {};
  const ready = window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("PASTE_");
  const db = ready ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  let products=[], filter="All", cart=[], activeDetailId=null;
  try { cart=JSON.parse(localStorage.getItem("ghazi_cart")||"[]"); if(!Array.isArray(cart))cart=[]; } catch { cart=[]; }
  const $=id=>document.getElementById(id);
  const money=n=>"Rs. "+Number(n||0).toLocaleString("en-PK");
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const images=p=>{let a=Array.isArray(p.gallery_urls)?p.gallery_urls:[];if(p.image_url&&!a.includes(p.image_url))a.unshift(p.image_url);return [...new Set(a)].slice(0,5)};
  function toast(message){const t=$("toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
  async function loadProducts(){
    if(!db){
      products=[];render();
      $("productGrid").innerHTML='<div class="empty-state">Our fragrance collection is temporarily unavailable. Please contact us on WhatsApp.</div>';
      return;
    }
    const {data,error}=await db.from("products").select("*").eq("is_available",true).order("created_at",{ascending:true});
    if(error){
      console.warn("Product database could not be loaded:",error.message);
      products=[];render();
      $("productGrid").innerHTML='<div class="empty-state">We could not load the collection right now. Please try again shortly or contact us on WhatsApp.</div>';
      return;
    }
    products=Array.isArray(data)?data:[];render();
    const pathMatch=location.pathname.match(/^\/product\/([^/]+)\/?$/);
    const initialId=pathMatch?decodeURIComponent(pathMatch[1]):new URLSearchParams(location.search).get("product");
    if(initialId)showDetail(initialId);
  }
  function render(){
    let list=products.filter(p=>filter==="All"||p.category===filter);
    const sort=$("sortProducts")?.value;
    if(sort==="low")list.sort((a,b)=>a.price-b.price);
    if(sort==="high")list.sort((a,b)=>b.price-a.price);
    if(sort==="az")list.sort((a,b)=>a.name.localeCompare(b.name));
    $("productCount").textContent=`${list.length} fragrances`;
    $("productGrid").innerHTML=list.length?list.map(p=>{
      const gallery=images(p),cover=gallery[0]||"";
      return `<article class="product-card">
        <a class="product-open" href="/product/${encodeURIComponent(p.id)}/" data-product="${esc(p.id)}" aria-label="View ${esc(p.name)} details">
          <div class="product-image">${cover?`<img src="${esc(cover)}" alt="${esc(p.name)}" loading="lazy">`:`<div class="product-placeholder"><div class="placeholder-bottle"><b>G</b><small>GHAZI</small></div></div>`}<span class="product-tag">${esc(p.category||"Fragrance")} · 50ML</span><span class="view-product">VIEW DETAILS ↗</span></div>
          <div class="product-info"><span class="product-category">${esc(p.category||"Fragrance")}</span><h3>${esc(p.name)}</h3><div class="product-buy"><b class="product-price">${money(p.price)}</b><span class="detail-hint">View fragrance</span></div></div>
        </a>
        <button class="add-button card-add" data-add="${esc(p.id)}">ADD TO BAG +</button>
      </article>`;
    }).join(""):`<div class="empty-state">No fragrances are available right now.</div>`;
  }
  function showDetail(id){
    const p=products.find(x=>String(x.id)===String(id));if(!p)return;activeDetailId=p.id;
// Dynamic SEO for product detail pages
const seoTitle = `${p.name} 50ML | Ghazi Fragrances by Ali`;
const seoDescription = (p.description ||
  `Discover ${p.name} 50ML ${p.category || "fragrance"} at Ghazi Fragrances by Ali. Cash on Delivery across Pakistan.`
).slice(0, 155);

document.title = seoTitle;

let metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) {
  metaDescription.setAttribute("content", seoDescription);
}
    const gallery=images(p),fallback=p.image_url||"";
    const mainImage=gallery[0]||fallback;
    const detail=$("productDetail"),host=$("detailMain");
    const imageMarkup=mainImage?`<img id="detailHeroImage" src="${esc(mainImage)}" alt="${esc(p.name)}">`:`<div class="detail-placeholder"><div class="placeholder-bottle"><b>G</b><small>GHAZI</small></div></div>`;
    const thumbs=gallery.length>1?`<div class="detail-thumbnails">${gallery.map((url,i)=>`<button class="detail-thumb ${i===0?"active":""}" data-gallery-image="${i}" type="button" aria-label="Show image ${i+1}"><img src="${esc(url)}" alt=""></button>`).join("")}</div>`:"";
    const notes=p.fragrance_notes||"Explore the character of this fragrance and find the moment that suits it best.";
    const inspired=p.inspired_by||"A distinctive fragrance selected for your collection.";
    const longevity=p.longevity||"Varies with skin type, weather and application.";
    const best=p.best_for||"Everyday wear and special occasions.";
    const how=p.how_to_use||"Apply to pulse points such as the wrists and neck. Avoid rubbing the fragrance after application.";
    host.innerHTML=`<div class="detail-gallery"><div class="detail-image-stage">${imageMarkup}</div>${thumbs}</div>
      <div class="detail-copy"><p class="eyebrow">${esc(p.category||"FRAGRANCE")} · 50ML</p><h1>${esc(p.name)}</h1><div class="detail-price">${money(p.price)}</div><p class="detail-short">${esc(p.description||"Discover a fragrance made to accompany your moments.")}</p>
      <div class="detail-benefits"><span>✓ Cash on Delivery</span><span>✓ Delivery across Pakistan</span></div>
      <div class="detail-order"><div class="detail-qty"><button type="button" data-detail-qty="-1">−</button><span id="detailQty">1</span><button type="button" data-detail-qty="1">+</button></div><button class="button button-dark detail-add" data-add="${esc(p.id)}">ADD TO BAG</button></div>
      <button class="buy-now" type="button" data-buy-now="${esc(p.id)}">BUY NOW ↗</button>
      <p class="detail-note">Your order is confirmed personally through WhatsApp. Payment is collected on delivery.</p></div>
      <div class="detail-information"><div class="detail-tabs"><a href="#detail-description">Description</a><a href="#detail-notes">Fragrance details</a><a href="#detail-how">How to use</a></div>
      <section id="detail-description"><p class="eyebrow">THE STORY</p><h2>About this fragrance</h2><p>${esc(p.long_description||p.description||"A thoughtfully selected fragrance for your personal collection. Discover its character and make it part of your everyday style.")}</p><h3>Inspired by</h3><p>${esc(inspired)}</p></section>
      <section id="detail-notes"><p class="eyebrow">THE FRAGRANCE</p><h2>Fragrance details</h2><div class="detail-facts"><div><b>Fragrance notes</b><p>${esc(notes)}</p></div><div><b>Longevity</b><p>${esc(longevity)}</p></div><div><b>Best for</b><p>${esc(best)}</p></div><div><b>Size</b><p>50ML</p></div></div></section>
      <section id="detail-how"><p class="eyebrow">MAKE IT LAST</p><h2>How to use</h2><p>${esc(how)}</p></section></div>`;
    detail.classList.add("open");detail.setAttribute("aria-hidden","false");document.body.classList.add("detail-open");history.replaceState(null,"",`/product/${encodeURIComponent(p.id)}/`);window.scrollTo({top:0,behavior:"smooth"});
  }
  function closeDetail(){const d=$("productDetail");d.classList.remove("open");d.setAttribute("aria-hidden","true");document.body.classList.remove("detail-open");history.replaceState(null,"","/"+location.hash)}
  function saveCart(){localStorage.setItem("ghazi_cart",JSON.stringify(cart));renderCart()}
  function add(id,qty=1){const p=products.find(x=>String(x.id)===String(id));if(!p)return;activeDetailId=p.id;const row=cart.find(x=>String(x.id)===String(id));if(row)row.qty+=qty;else cart.push({id:p.id,name:p.name,price:Number(p.price),qty});saveCart();toast("Added to your bag")}
  function renderCart(){
    const count=cart.reduce((s,x)=>s+(Number(x.qty)||0),0),total=cart.reduce((s,x)=>s+(Number(x.price)||0)*(Number(x.qty)||0),0);
    $("bagCount").textContent=count;$("drawerCount").textContent=`(${count})`;$("subtotal").textContent=money(total);
    $("cartItems").innerHTML=cart.length?cart.map(x=>`<div class="cart-line"><div><h4>${esc(x.name)}</h4><small>${money(x.price)} each</small><div class="quantity"><button data-qty="${esc(x.id)}" data-delta="-1">−</button><span>${x.qty}</span><button data-qty="${esc(x.id)}" data-delta="1">+</button><button data-remove="${esc(x.id)}" aria-label="Remove item">×</button></div></div><b class="cart-line-price">${money(x.price*x.qty)}</b></div>`).join(""):`<p class="empty-cart">Your bag is waiting for a fragrance.</p>`;
    $("checkoutSummary").innerHTML=cart.map(x=>`${esc(x.name)} × ${x.qty} — ${money(x.price*x.qty)}`).join("<br>")+`<hr><b>Total: ${money(total)}</b>`;
  }
  function openCart(){$("cartDrawer").classList.add("open");$("cartBackdrop").classList.add("show")}
  function closeCart(){$("cartDrawer").classList.remove("open");$("cartBackdrop").classList.remove("show")}
  document.addEventListener("click",e=>{
    const addBtn=e.target.closest("[data-add]");if(addBtn){const qty=addBtn.classList.contains("detail-add")?Number($("detailQty")?.textContent||1):1;add(addBtn.dataset.add,qty)}
    const product=e.target.closest("[data-product]");if(product){e.preventDefault();showDetail(product.dataset.product);}
    const qty=e.target.closest("[data-qty]");if(qty){const row=cart.find(x=>String(x.id)===qty.dataset.qty);if(row){row.qty+=Number(qty.dataset.delta);if(row.qty<1)cart=cart.filter(x=>x!==row);saveCart()}}
    const rem=e.target.closest("[data-remove]");if(rem){cart=cart.filter(x=>String(x.id)!==rem.dataset.remove);saveCart()}
    const thumb=e.target.closest("[data-gallery-image]");if(thumb){const p=products.find(x=>String(x.id)===String(activeDetailId));const url=p&&images(p)[Number(thumb.dataset.galleryImage)];if(url){$("detailHeroImage").src=url;document.querySelectorAll(".detail-thumb").forEach(x=>x.classList.toggle("active",x===thumb))}}
    const dqty=e.target.closest("[data-detail-qty]");if(dqty){const q=$("detailQty");q.textContent=Math.max(1,Math.min(10,Number(q.textContent)+Number(dqty.dataset.detailQty)))}
    const buy=e.target.closest("[data-buy-now]");if(buy){add(buy.dataset.buyNow,Number($("detailQty")?.textContent||1));openCart()}
  });
  $("openCart").addEventListener("click",openCart);$("closeCart").addEventListener("click",closeCart);$("cartBackdrop").addEventListener("click",closeCart);
  $("backToShop").addEventListener("click",closeDetail);
  $("checkoutButton").addEventListener("click",()=>{if(!cart.length){toast("Your bag is empty");return}closeCart();$("checkoutModal").classList.add("show")});
  $("closeCheckout").addEventListener("click",()=>$("checkoutModal").classList.remove("show"));
  $("checkoutModal").addEventListener("click",e=>{if(e.target.id==="checkoutModal")$("checkoutModal").classList.remove("show")});
  $("checkoutForm").addEventListener("submit",e=>{
    e.preventDefault();if(!cart.length)return;
    const f=new FormData(e.currentTarget),total=cart.reduce((s,x)=>s+x.price*x.qty,0);
    const lines=cart.map(x=>`• ${x.name} x ${x.qty} — ${money(x.price*x.qty)}`).join("\n");
    const msg=`NEW ORDER — GHAZI FRAGRANCES BY ALI\n\nName: ${f.get("name")}\nPhone: ${f.get("phone")}\nCity: ${f.get("city")}\nAddress: ${f.get("address")}\n\n${lines}\n\nTotal: ${money(total)}\nPayment: Cash on Delivery`;
    const number=cfg.WHATSAPP_PRIMARY||"923281653513";
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`,"_blank","noopener");
    cart=[];saveCart();$("checkoutModal").classList.remove("show");e.currentTarget.reset();
  });
  document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));render()}));
  document.querySelectorAll("[data-nav-filter]").forEach(a=>a.addEventListener("click",()=>{filter=a.dataset.navFilter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x.dataset.filter===filter));render()}));
  $("sortProducts").addEventListener("change",render);$("year").textContent=new Date().getFullYear();renderCart();loadProducts();
})();
