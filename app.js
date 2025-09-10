/********** فقط این را عوض کن **********/
const FILENAME = logo M.mp4"; // ← دقیقا اسم ویدیویی که آپلود کردی (مثلا "track1.mp4")
/****************************************/

/* base برای GitHub Pages */
function getBasePath(){
  const parts = location.pathname.split("/").filter(Boolean);
  return parts.length ? `/${parts[0]}` : "";
}
const BASE = getBasePath();

/* یک آیتم ویدیو با پلیر داخلی + QR */
const VIDEOS = [
  {
    slug: FILENAME.replace(/\.[^/.]+$/, ""),      // مثلا "track1"
    title: `Local • ${FILENAME}`,
    url: `${BASE}/assets/videos/logo M.mp4`,
    thumbnail: `${BASE}/assets/thumbs/${FILENAME.replace(/\.[^/.]+$/, ".jpg")}`, // اختیاری
    tags: ["local"]
  }
];

/* DOM */
const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const search = document.getElementById("search");
const copyBtn = document.getElementById("copy");
const printBtn = document.getElementById("print");

/* دیباگ روی صفحه */
const dbg = document.createElement("pre");
dbg.style.cssText = "font:12px/1.4 ui-monospace,monospace; background:#fff; border:1px solid #eee; padding:8px; margin:8px 0; white-space:pre-wrap;";
dbg.textContent = `BASE=${BASE}\nVideo URL=${VIDEOS[0].url}\nPage URL=${location.href}`;
document.querySelector("main").prepend(dbg);

/* رندر */
let filtered = [...VIDEOS];
render();

search.addEventListener("input", (e)=>{
  const q = e.target.value.trim().toLowerCase();
  filtered = VIDEOS.filter(v => [v.title, (v.tags||[]).join(" ")].join(" ").toLowerCase().includes(q));
  render();
});
copyBtn.addEventListener("click", ()=> navigator.clipboard.writeText(location.href));
printBtn.addEventListener("click", ()=> window.print());

function render(){
  grid.innerHTML = "";
  if(!filtered.length){ empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");

  filtered.forEach(v=>{
    const card = document.createElement("div");
    card.className = "overflow-hidden rounded-2xl shadow-sm hover:shadow transition bg-white border flex flex-col";

    // پلیر داخلی
    const mediaWrap = document.createElement("div");
    mediaWrap.innerHTML = `
      <video controls preload="metadata" class="w-full h-48 object-cover bg-black">
        <source src="${v.url}" type="video/mp4">
        مرورگر شما از ویدیو پشتیبانی نمی‌کند.
      </video>`;

    const body = document.createElement("div");
    body.className = "p-4";
    body.innerHTML = `
      <div class="font-semibold text-base leading-tight">${esc(v.title)}</div>
      <div class="mt-1 flex flex-wrap gap-1">${(v.tags||[]).map(t=>`<span class="text-[10px] px-2 py-0.5 rounded bg-black/70 text-white">${esc(t)}</span>`).join("")}</div>
      <div class="mt-3 flex items-center gap-2">
        <a class="px-3 py-2 rounded bg-black text-white text-sm hover:opacity-90" href="${v.url}" target="_blank" rel="noreferrer">Open</a>
        <button class="px-3 py-2 rounded border text-sm hover:bg-neutral-100" data-copy="${v.url}">Copy Link</button>
        <button class="px-3 py-2 rounded text-sm hover:bg-neutral-100" data-toggle-qr>Show QR</button>
      </div>
      <div class="mt-4 p-3 bg-neutral-50 border rounded-xl hidden items-center justify-center" id="qrbox"></div>
    `;

    const qrBtn = body.querySelector("[data-toggle-qr]");
    const copyBtn = body.querySelector("[data-copy]");
    const qrBox  = body.querySelector("#qrbox");

    copyBtn.onclick = ()=> navigator.clipboard.writeText(v.url);
    qrBtn.onclick = ()=>{
      const hidden = qrBox.classList.toggle("hidden");
      qrBtn.textContent = hidden ? "Show QR" : "Hide QR";
      if (!hidden && !qrBox.dataset.ready) {
        new QRCode(qrBox, { text: v.url, width: 148, height: 148 });
        qrBox.dataset.ready = "1";
      }
    };

    card.appendChild(mediaWrap);
    card.appendChild(body);
    grid.appendChild(card);
  });

  // یک QR تستی برای خود صفحه (برای اطمینان از لود شدن کتابخانه QR)
  const test = document.createElement("div");
  test.className = "p-4 bg-white border rounded-xl mt-4";
  test.innerHTML = `<div class="text-sm mb-2">Test QR (Home URL):</div><div id="qrtest"></div>`;
  document.querySelector("main").appendChild(test);
  new QRCode(document.getElementById("qrtest"), { text: location.href, width: 96, height: 96 });
}

function esc(s){ return (s||"").replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
