/*********************** فقط این بخش را ویرایش کن ************************
 * هر ویدیو یک آیتم در RAW_VIDEOS است.
 * file = نام دقیق فایل در assets/videos/ (می‌تواند فاصله داشته باشد، مثلاً "logo M.mp4")
 * thumb = نام اختیاری کاور در assets/thumbs/
 ***********************************************************************/
const RAW_VIDEOS = [
  { slug: "logo-m", title: "Logo Motion", file: "logo M.mp4", thumb: "logo M.jpg", tags: ["local","motion"] },
  // نمونه‌های بعدی:
  // { slug: "track1", title: "My Track", file: "track1.mp4", thumb: "track1.jpg", tags: ["studio"] },
];
/************************************************************************/

// نام ریپو ثابت: مسیر پایه برای GitHub Pages
const BASE = "/music-qr-portfolio"; // اگر نام ریپو تغییر کرد، این را هم تغییر بده

// کمک: escape HTML
function esc(s){ return (s||"").replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// از RAW_VIDEOS به ساختار نهایی تبدیل می‌کنیم (encode برای نام‌های با فاصله/کاراکتر خاص)
const VIDEOS = RAW_VIDEOS.map(v => {
  const fileEnc  = encodeURIComponent(v.file || "");
  const thumbEnc = v.thumb ? encodeURIComponent(v.thumb) : "";
  return {
    slug: v.slug || (v.file || "").replace(/\.[^/.]+$/, ""),
    title: v.title || v.file,
    url: `${BASE}/assets/videos/${fileEnc}`,
    thumbnail: v.thumb ? `${BASE}/assets/thumbs/${thumbEnc}` : "",
    tags: v.tags || []
  };
});

// DOM
const grid    = document.getElementById("grid");
const empty   = document.getElementById("empty");
const search  = document.getElementById("search");
const copyBtn = document.getElementById("copy");
const printBtn= document.getElementById("print");

// رخدادها
copyBtn?.addEventListener("click", ()=> navigator.clipboard.writeText(location.href));
printBtn?.addEventListener("click", ()=> window.print());
search?.addEventListener("input", (e)=>{
  const q = e.target.value.trim().toLowerCase();
  render(VIDEOS.filter(v => [v.title, (v.tags||[]).join(" ")].join(" ").toLowerCase().includes(q)));
});

// شروع
render(VIDEOS);

// ————— توابع —————

// QR را به صورت <img> برمی‌گرداند (قابل دانلود)
function makeQRImage(url, size=148){
  const tmp = document.createElement("div");
  new QRCode(tmp, { text: url, width: size, height: size }); // qrcode.min.js باید قبل از app.js لود شود
  let imgEl = tmp.querySelector("img");
  if (!imgEl) { // اگر خروجی <canvas> بود
    const canvas = tmp.querySelector("canvas");
    const dataURL = canvas.toDataURL("image/png");
    imgEl = new Image();
    imgEl.src = dataURL;
  }
  imgEl.width = size; imgEl.height = size;
  imgEl.className = "rounded border";
  return imgEl;
}

// اگر QR <img> dataURL نداشت، تبدیلش می‌کنیم
function toDataURL(img){
  const canvas = document.createElement("canvas");
  canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

// رندر کارت‌ها (پلیر داخلی + QR ثابت + دکمه دانلود)
function render(list){
  grid.innerHTML = "";
  if(!list.length){ empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");

  list.forEach(v=>{
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
      // نمایش خطای پخش (کمک به عیب‌یابی)
      const vid = mediaWrap.querySelector("video");
      vid.addEventListener("error", () => {
        const err = vid.error, map = {1:"ABORTED",2:"NETWORK",3:"DECODE",4:"SRC_NOT_SUPPORTED"};
        const code = err?.code || 0;
        const warn = document.createElement("div");
        warn.className = "p-3 text-sm rounded bg-red-50 border text-red-700";
        warn.textContent = `Video error code=${code} (${map[code]||"UNKNOWN"}) — مسیر/نام فایل یا کدک را چک کن.`;
        mediaWrap.appendChild(warn);
      });
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
      <div class="mt-2 text-xs text-neutral-600 break-all">
        لینک فایل: <a class="underline text-blue-600" href="${v.url}" target="_blank" rel="noreferrer">${v.url}</a>
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
    download.download = `${v.slug || "video"}-qr.png`;

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
