/* ===== مسیر پایه برای GitHub Pages ===== */
function getBasePath() {
  // اگر سایت روی https://<user>.github.io/<repo>/ است، باید /<repo> جلو مسیر فایل‌ها باشد
  const parts = location.pathname.split("/").filter(Boolean);
  return parts.length ? `/${parts[0]}` : "";
}
const BASE = getBasePath();

/* ===== لیست ویدیوها را اینجا پر کن =====
   - فایل MP4ها را در:   assets/videos/
   - کاورها (jpg/png) در: assets/thumbs/
   - اگر نام فایل فاصله دارد ("logo M.mp4") مشکلی نیست؛ کد خودش URL را Encode می‌کند.
*/
const RAW_VIDEOS = [
  // نمونه‌ها (اسم‌ها را با فایل‌های واقعی خودت عوض کن)
  { slug: "logo-m", title: "Logo Motion", file: "logo M.mp4", thumb: "logo M.jpg", tags: ["local","motion"] },
  // { slug: "track1", title: "My Track", file: "track1.mp4", thumb: "track1.jpg", tags: ["studio"] },
];

/* ===== از RAW_VIDEOS به ساختار قابل استفاده تبدیل می‌کنیم ===== */
const VIDEOS = RAW_VIDEOS.map(v => {
  const fileEnc  = encodeURIComponent(v.file);            // فضای خالی → %20
  const thumbEnc = v.thumb ? encodeURIComponent(v.thumb) : "";
  return {
    slug: v.slug || (v.file || "").replace(/\.[^/.]+$/, ""),
    title: v.title || v.file,
    url: `${BASE}/assets/videos/${fileEnc}`,
    thumbnail: v.thumb ? `${BASE}/assets/thumbs/${thumbEnc}` : "",
    tags: v.tags || []
  };
});

/* ===== DOM ===== */
const grid    = document.getElementById("grid");
const empty   = document.getElementById("empty");
const search  = document.getElementById("search");
const copyBtn = document.getElementById("copy");
const printBtn= document.getElementById("print");

let filtered = [...VIDEOS];
render();

search.addEventListener("input", (e)=>{
  const q = e.target.value.trim().toLowerCase();
  filtered = VIDEOS.filter(v => [v.title, (v.tags||[]).join(" ")].join(" ").toLowerCase().includes(q));
  render();
});
copyBtn.addEventListener("click", ()=> navigator.clipboard.writeText(location.href));
printBtn.addEventListener("click", ()=> window.print());

/* ===== ساخت QR به صورت <img> قابل دانلود ===== */
function makeQRImage(url, size=148){
  const tmp = document.createElement("div");
  new QRCode(tmp, { text: url, width: size, height: size }); // نیاز به qrcode.min.js
  let imgEl = tmp.querySelector("img");
  if (!imgEl) { // اگر خروجی canvas بود
    const canvas = tmp.querySelector("canvas");
    const dataURL = canvas.toDataURL("image/png");
    imgEl = new Image();
    imgEl.src = dataURL;
  }
  imgEl.width = size; imgEl.height = size;
  imgEl.className = "rounded border";
  return imgEl;
}

function render(){
  grid.innerHTML = "";
  if(!filtered.length){ empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");

  filtered.forEach(v=>{
    const card = document.createElement("div");
    card.className = "overflow-hidden rounded-2xl shadow-sm hover:shadow transition bg-white border flex flex-col";

    // مدیا: اگر MP4 است پلیر داخلی، وگرنه تصویر کاور لینک‌دار
    const mediaWrap = document.createElement("div");
    mediaWrap.className = "relative";
    if (/\.mp4(\?|#|$)/i.test(v.url)) {
      mediaWrap.innerHTML = `
        <video controls preload="metadata" class="w-full h-48 object-cover bg-black">
          <source src="${v.url}" type="video/mp4">
          مرورگر شما از ویدیو پشتیبانی نمی‌کند.
        </video>`;
    } else {
      mediaWrap.innerHTML = `
        <a href="${v.url}" target="_blank" rel="noreferrer">
          <img src="${v.thumbnail || 'https://placehold.co/600x300?text=Video'}" alt="${esc(v.title)}" class="w-full h-48 object-cover">
        </a>`;
    }

    const body = document.createElement("div");
    body.className = "p-4 flex-1 flex flex-col";
    body.innerHTML = `
      <div class="font-semibold text-base leading-tight">${esc(v.title)}</div>
      <div class="mt-1 flex flex-wrap gap-1">
        ${(v.tags||[]).map(t=>`<span class="text-[10px] px-2 py-0.5 rounded bg-black/70 text-white">${esc(t)}</span>`).join("")}
      </div>
    `;

    // QR ثابت + دکمه‌ها
    const qrRow = document.createElement("div");
    qrRow.className = "mt-4 flex items-center gap-3";
    const qrImg = makeQRImage(v.url, 148);

    const actions = document.createElement("div");
    actions.className = "flex flex-col gap-2";

    const open = document.createElement("a");
    open.className = "px-3 py-2 rounded bg-black text-white text-sm hover:opacity-90 inline-block";
    open.href = v.url; open.target = "_blank"; open.rel = "noreferrer"; open.textContent = "Open";

    const copy = document.createElement("button");
    copy.className = "px-3 py-2 rounded border text-sm hover:bg-neutral-100";
    copy.textContent = "Copy Link";
    copy.onclick = ()=> navigator.clipboard.writeText(v.url);

    const download = document.createElement("a");
    download.className = "px-3 py-2 rounded border text-sm hover:bg-neutral-100 inline-block";
    download.textContent = "Download QR";
    download.href = qrImg.src.startsWith("data:") ? qrImg.src : toDataURL(qrImg);
    download.download = `${v.slug}-qr.png`;

    actions.appendChild(open);
    actions.appendChild(copy);
    actions.appendChild(download);

    qrRow.appendChild(qrImg);
    qrRow.appendChild(actions);

    body.appendChild(qrRow);

    card.appendChild(mediaWrap);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function toDataURL(img){
  const canvas = document.createElement("canvas");
  canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

function esc(s){ return (s||"").replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
