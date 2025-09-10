/********** فقط این را عوض کن **********/
const FILENAME = "logo M.MP4"; // ← دقیقا اسم ویدیویی که آپلود کردی (مثلا "track1.mp4")
/****************************************/

function getBasePath(){
  const parts = location.pathname.split("/").filter(Boolean);
  return parts.length ? `/${parts[0]}` : "";
}
const BASE = getBasePath();

const VIDEOS = [
  {
    slug: FILENAME.replace(/\.[^/.]+$/, ""),
    title: `Local • ${FILENAME}`,
    url: `${BASE}/assets/videos/logo M.MP4`,
    thumbnail: `${BASE}/assets/thumbs/${FILENAME.replace(/\.[^/.]+$/, ".jpg")}`,
    tags: ["local"]
  }
];

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

/* === تولید QR به صورت <img> قابل دانلود === */
function makeQRImage(url, size=148){
  // یک div موقت می‌سازیم، بعد خروجی canvas/img را به <img> تبدیل می‌کنیم
  const tmp = document.createElement("div");
  new QRCode(tmp, { text: url, width: size, height: size }); // نیاز به qrcode.min.js
  // گاهی خروجی <img> و گاهی <canvas> است:
  let imgEl = tmp.querySelector("img");
  if (!imgEl) {
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

    // پلیر داخلی
    const mediaWrap = document.createElement("div");
    mediaWrap.innerHTML = `
      <video controls preload="metadata" class="w-full h-48 object-cover bg-black">
        <source src="${v.url}" type="video/mp4">
        مرورگر شما از ویدیو پشتیبانی نمی‌کند.
      </video>`;

    // بدنه
    const body = document.createElement("div");
    body.className = "p-4 flex-1 flex flex-col";
    body.innerHTML = `
      <div class="font-semibold text-base leading-tight">${esc(v.title)}</div>
      <div class="mt-1 flex flex-wrap gap-1">${(v.tags||[]).map(t=>`<span class="text-[10px] px-2 py-0.5 rounded bg-black/70 text-white">${esc(t)}</span>`).join("")}</div>
    `;

    // QR ثابت + دکمه دانلود
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
    // اگر qrImg از <canvas> ساخته شده بود، الان <img> با dataURL داریم؛ اگر src مطلق بود، تبدیلش می‌کنیم
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

// اگر به هر دلیلی qrImg.src dataURL نبود، تبدیلش می‌کنیم
function toDataURL(img){
  const canvas = document.createElement("canvas");
  canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

function esc(s){ return (s||"").replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
