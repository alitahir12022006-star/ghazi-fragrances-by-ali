(() => {
  const cfg=window.GHAZI_CONFIG||{},ready=window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.includes("PASTE_");
  const db=ready?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
  const $=id=>document.getElementById(id),form=$("productForm");
  let busy=false, imageItems=[];
  const money=n=>"Rs. "+Number(n||0).toLocaleString("en-PK");
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function msg(t){$("formMessage").textContent=t}
  function getImages(p){let a=Array.isArray(p.gallery_urls)?p.gallery_urls:[];if(p.image_url&&!a.includes(p.image_url))a.unshift(p.image_url);return [...new Set(a)].slice(0,5)}
  function previewImages(){
    const box=$("imagePreview");
    box.innerHTML=imageItems.map((item,i)=>{
      const src=item.kind==="existing"?item.url:item.preview;
      const label=i===0?"MAIN IMAGE":`IMAGE ${i+1}`;
      return `<div class="preview-tile"><img src="${esc(src)}" alt=""><span>${label}</span><div class="preview-actions">${i?`<button type="button" data-main-image="${i}" title="Make main image">Make main</button>`:""}<button type="button" class="remove-image" data-remove-image="${i}" title="Remove image">Remove</button></div></div>`;
    }).join("");
  }
  function configCheck(){if(!db){$("loginPanel").hidden=false;$("loginPanel").innerHTML="<h2>Database connection required</h2><p>Check the public Supabase settings in config.js. Never place a service-role or secret key in this file.</p>";return false}return true}
  async function load(){
    if(!db)return;
    const {data,error}=await db.from("products").select("*").order("created_at",{ascending:true});
    if(error){$("productList").textContent="Could not load products: "+error.message;return}
    $("productList").innerHTML=data.length?data.map(p=>{const imgs=getImages(p);return `<div class="product-row">${imgs[0]?`<img src="${esc(imgs[0])}" alt="">`:`<div class="product-placeholder">G</div>`}<div><b>${esc(p.name)}</b><small>${esc(p.category)} · ${money(p.price)} · ${p.is_available?"Visible":"Hidden"} · ${imgs.length} image(s)</small></div><div class="row-actions"><button class="secondary" data-edit="${esc(p.id)}">Edit</button><button class="delete" data-delete="${esc(p.id)}">Delete</button></div></div>`}).join(""):"No products yet. Add your first perfume above.";
  }
  async function showAdmin(){$("loginPanel").hidden=true;$("adminArea").hidden=false;const {data}=await db.auth.getUser();$("sessionEmail").textContent=data.user?.email||"Admin";await load()}
  function resetForm(){form.reset();form.elements.id.value="";imageItems=[];$("formTitle").textContent="Add a new perfume";$("imagePreview").innerHTML="";msg("")}
  if(configCheck()){
    db.auth.getSession().then(({data})=>data.session?showAdmin():null);
    $("loginForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await db.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});if(error){$("loginPanel").querySelector("p").textContent=error.message;return}showAdmin()});
    $("logout").addEventListener("click",async()=>{await db.auth.signOut();location.reload()});
    $("refresh").addEventListener("click",load);$("clearForm").addEventListener("click",resetForm);
    form.elements.images.addEventListener("change",()=>{
      const chosen=[...form.elements.images.files];
      for(const file of chosen){
        if(imageItems.length>=5)break;
        imageItems.push({kind:"new",file,preview:URL.createObjectURL(file)});
      }
      form.elements.images.value="";
      previewImages();
      if(imageItems.length>=5)msg("Maximum 5 images selected.");
    });
    $("imagePreview").addEventListener("click",e=>{
      const remove=e.target.closest("[data-remove-image]"),main=e.target.closest("[data-main-image]");
      if(remove){const item=imageItems.splice(Number(remove.dataset.removeImage),1)[0];if(item?.kind==="new")URL.revokeObjectURL(item.preview);previewImages()}
      if(main){const index=Number(main.dataset.mainImage);imageItems.unshift(imageItems.splice(index,1)[0]);previewImages()}
    });
    form.addEventListener("submit",async e=>{
      e.preventDefault();if(busy)return;busy=true;$("saveButton").disabled=true;msg("Saving product and images…");
      try{
        const f=new FormData(form),id=f.get("id"),name=String(f.get("name")).trim(),price=Number(f.get("price"));
        if(!name||!Number.isFinite(price)||price<=0)throw new Error("Enter a product name and valid price.");
        if(imageItems.length>5)throw new Error("Maximum 5 images per product.");
        const gallery=[];
        for(const item of imageItems){
          if(item.kind==="existing"){gallery.push(item.url);continue}
          const file=item.file;
          if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Please choose JPG, PNG or WEBP images only.");
          if(file.size>5*1024*1024)throw new Error("Each image must be smaller than 5MB.");
          const path=`${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"-")}`;
          const up=await db.storage.from("product-images").upload(path,file,{upsert:false,contentType:file.type});
          if(up.error)throw up.error;
          gallery.push(db.storage.from("product-images").getPublicUrl(path).data.publicUrl);
        }
        const row={name,category:f.get("category"),price,description:f.get("description")||"",long_description:f.get("long_description")||"",fragrance_notes:f.get("fragrance_notes")||"",inspired_by:f.get("inspired_by")||"",longevity:f.get("longevity")||"",best_for:f.get("best_for")||"",how_to_use:f.get("how_to_use")||"",gallery_urls:gallery,image_url:gallery[0]||null,is_available:form.elements.available.checked};
        const result=id?await db.from("products").update(row).eq("id",id):await db.from("products").insert(row);
        if(result.error)throw result.error;
        msg("Product saved successfully.");resetForm();await load();
      }catch(err){msg(err.message||"Something went wrong.")}
      finally{busy=false;$("saveButton").disabled=false}
    });
    $("productList").addEventListener("click",async e=>{
      const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
      if(edit){const {data,error}=await db.from("products").select("*").eq("id",edit.dataset.edit).single();if(error){msg(error.message);return}
        resetForm();form.elements.id.value=data.id;form.elements.name.value=data.name;form.elements.category.value=data.category;form.elements.price.value=data.price;form.elements.description.value=data.description||"";form.elements.long_description.value=data.long_description||"";form.elements.fragrance_notes.value=data.fragrance_notes||"";form.elements.inspired_by.value=data.inspired_by||"";form.elements.longevity.value=data.longevity||"";form.elements.best_for.value=data.best_for||"";form.elements.how_to_use.value=data.how_to_use||"";form.elements.available.checked=!!data.is_available;imageItems=getImages(data).map(url=>({kind:"existing",url}));$("formTitle").textContent="Edit perfume";previewImages();window.scrollTo({top:0,behavior:"smooth"});
      }
      if(del&&confirm("Delete this perfume from your store?")){const {error}=await db.from("products").delete().eq("id",del.dataset.delete);if(error)msg(error.message);else{msg("Product deleted.");await load()}}
    });
  }
})();
