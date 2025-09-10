/******** فقط این دو مقدار را با اسم فایل‌های واقعی خودت عوض کن ********/
const RAW_FILE  = "logo M.mp4";   // مثلا "logo M.mp4"
const RAW_THUMB = "";             // اگر کاور داری مثل "logo M.jpg" (اختیاری)
/************************************************************************/

// *** مهم: چون ریپوی شما اسمش music-qr-portfolio است، BASE را ثابت می‌گذاریم.
const BASE = "/music-qr-portfolio";

function enc(s){ return s ? encodeURIComponent(s) : ""; }
const FILE  = enc(RAW_FILE);
const THUMB = enc(RAW_THUMB);

const VIDEO_URL = `${BASE}/assets/videos/${FILE}`;
const THUMB_URL = THUMB ? `${BASE}/assets/thumbs/${THUMB}` : "";

// ===== DOM =====
const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const search = document.getElementById("search");
const copyBtn = document.getElementById("copy");
const printBtn = document.getElementById("print");

// دیباگ روی صفحه: آدرس‌ها را نشان می‌دهد
const dbg = document.createElement("pre");
dbg.style.cssText = "font:12px/1.4 ui-monospace,monospace;background:#fff;border:1px solid #eee;padding:8px;margin:8px 0;white-space:pre-wrap;";
dbg.textContent = `BASE=${BASE}
VIDEO_URL=${VIDEO_URL}
PAGE_URL=${location.href}
(اگر روی لینکِ زیر کلیک کردی و 404 دیدی یعنی فایل در آن مسیر وجود ندارد)
`;
document.querySelector("main").prepend(dbg);

render();
copyBtn.addEventListener("click", ()=> navigator.clipboard.writeText(location.href));
printBtn.addEventListener("click", ()=> window.print());
search.addEventListener("input", ()=> {
  const q = search.value.trim().toLowerCase();
  const card = document.getElementById("card");
  card.style.display = /local|logo|mp4|video/.test(q) ? "" : (q ? "none" : "");
});

function render(){
  grid.innerHTML = "";

  const card = document.createElement("div");
  card.id = "card";
  card.className = "overflow-hidden rounded-2xl shadow-sm hover:shadow transition bg-white border flex flex-col";

  // پلیر ویدیو
  const media = document.createElement("div");
  media.innerHTML = `
    <video controls preload="metadata" class="w-full h-48 object-cover bg-black">
      <source src="${VIDEO_URL}" type="video/mp4">
      مرورگر شما از ویدیو پشتیبانی نمی‌کند.
    </video>`;

  // بدنه + QR ثابت + لینک‌ها
  const body = document.createElement("div");
  body.className = "p-4";
  body.innerHTML = `
    <div class="font-semibold text-base">Local • ${RAW_FILE}</div>
    <div class="mt-2 text-xs text-neutral-600 break-all">
      لینک مستقیم فایل: <a class="underline text-blue-600" href="${VIDEO_URL}" target="_blank" rel="noreferrer">${VIDEO_URL}</a>
    </div>
    <div class="mt-4 flex items-center gap-3">
      <div id="qrbox"></div>
      <div class="flex flex-col gap-2">
        <a class="px-3 py-2 rounded bg-black text-white text-sm hover:opacity-90 inline-block" href="${VIDEO_URL}" target="_blank" rel="noreferrer">Open</a>
        <button id="copyLink" class="px-3 py-2 rounded border text-sm hover:bg-neutral-100">Copy Link</button>
        <a id="dlQR" class="px-3 py-2 rounded border text-sm hover:bg-neutral-100 inline-block" download="video-qr
