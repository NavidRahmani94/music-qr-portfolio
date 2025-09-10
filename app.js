/* ===== کمک: base برای GitHub Pages ===== */
function getBasePath() {
  // اگر سایت روی https://<user>.github.io/<repo>/ است، باید /<repo> را جلو مسیر فایل‌ها اضافه کنیم
  const parts = location.pathname.split("/").filter(Boolean);
  return parts.length ? `/${parts[0]}` : "";
}
const BASE = getBasePath();

/* ===== ویدیوهای لوکال: این آرایه را با فایل‌های خودت پر کن =====
   - فایل MP4 را در: assets/videos/
   - کاور (اختیاری) را در: assets/thumbs/
   - اگر thumbnail نداشتی، خودش عکس پیش‌فرض می‌گذارد.
*/
const VIDEOS = [
  {
    slug: "my-track",
    title: "My Track (Local MP4)",
    url: `${BASE}/assets/videos/my-track.mp4`,          // ← نام فایل خودت
    thumbnail: `${BASE}/assets/thumbs/my-track.jpg`,    // ← اختیاری
    tags: ["studio","2025"]
  },
  // نمونه‌های بعدی:
  // { slug: "beat-01", title: "Beat 01", url: `${BASE}/assets/videos/beat-01.mp4`, thumbnail: `${BASE}/assets/thumbs/beat-01.jpg`, tags:["beat"] },
];

/* ===== DOM ===== */
const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const search = document.getElementById("search");
const copyBtn = document.getElementById("copy");
const printBtn = document.getElementById("print");

let filtered = [...VIDEOS];
render();

search.addEventListener("input", (e)=>{
  const q = e.target.value.trim().toLowerCase();
  filtered = VIDEOS.filter(v => [v.title, (v.tags||[]).join(" ")].join(" ").toLowerCase().includes(q));
  render();
});
copyBtn.addEventListener("click", ()=> navigator.clipboard.writeText(location.href));
printBtn.addEventListener("click", ()=> window.print());

/* ===== رندر کارت با پلیر داخلی + QR ===== */
function render(){
  grid.innerHTML = "";
  if(!filtered.length){ empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");

  filtered.forEach(v=>{
    const card = document.createElement("div");
    card.className = "overflow-hidden rounded-2xl shadow-sm hover:shadow transition bg-white border flex flex-col";

    // کاور یا پلیر
    const mediaWrap = document.createElement("div");
    mediaWrap.className = "relative";
    if (isMp4(v.url)) {
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

    // بدنه
    const body = document.createElement("div");
    body.className = "p-4 flex-1 flex flex-col";
    body.innerHTML = `
      <div class="font-semibold text-base leading-tight line-clamp-2">${esc(v.title)}</div>
      <div class="mt-1 flex flex-wrap gap-1">${(v.tags||[]).map(t=>`<span class="text-[10px] px-2 py-0.5 rounded bg-black/70 text-white">${esc(t)}</span>`).join("")}</div>
    `;

    // دکمه‌ها
    const actions = document.createElement("div");
    actions.className = "mt-3 flex items-center gap-2";
    actions.innerHTML = `
      <a class="px-3 py-2 rounded bg-black text-white text-sm hover:opacity-90" href="${v.url}" target="_blank" rel="noreferrer">Open</a>
      <button class="px-3 py-2 rounded border text-sm hover:bg-neutral-100" data-copy="${v.url}">Copy Link</button>
      <button class="px-3 py-2 rounded text-sm hover:bg-neutral-100" data-toggle-qr>Show QR</button>
    `;

    // QR box
    const qrBox = document.createElement("div");
    qrBox.className = "mt-4 p-3 bg-neutral-50 border rounded-xl hidden items-center justify-center";

    // رویدادها
    actions.querySelector(`[data-copy]`).onclick = (e)=> {
      navigator.clipboard.writeText(e.currentTarget.getAttribute("data-copy"));
    };
    actions.querySelector(`[data-toggle-qr]`).onclick = (e)=> {
      const btn = e.currentTarget;
      const isHidden = qrBox.classList.toggle("hidden");
      btn.textContent = isHidden ? "Show QR" : "Hide QR";
      if (!isHidden && !qrBox.dataset.ready) {
        new QRCode(qrBox, { text: v.url, width: 148, height: 148 });
        qrBox.dataset.ready = "1";
      }
    };

    body.appendChild(actions);
    body.appendChild(qrBox);

    card.appendChild(mediaWrap);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function isMp4(u){ return /\.mp4(\?|#|$)/i.test(u); }
function esc(s){ return (s||"").replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
