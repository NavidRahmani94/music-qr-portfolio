/******** آدرس ویدیو با نام دقیق فایل تو ********/
const FILE_NAME = "logo M.mp4"; // داخل assets/videos/
/************************************************/

// آدرس مطلق روی GitHub Pages (بدون وابستگی به کشته‌ها)
const REPO_BASE = "/music-qr-portfolio"; // اگر اسم ریپو عوض شد، اینو عوض کن
const ABS_URL = `${location.protocol}//${location.host}${REPO_BASE}/assets/videos/${encodeURIComponent(FILE_NAME)}`;

const printBtn = document.getElementById("print");
const copyBtn  = document.getElementById("copy");
const grid     = document.getElementById("grid");
const empty    = document.getElementById("empty");

// لاگ ساده روی صفحه برای عیب‌یابی
const logEl = document.createElement("pre");
logEl.style.cssText = "font:12px/1.4 ui-monospace,monospace;background:#fff;border:1px solid #eee;padding:8px;margin:8px 0;white-space:pre-wrap;";
logEl.textContent = `PAGE_URL = ${location.href}\nVIDEO_URL = ${ABS_URL}\n`;
document.querySelector("main").prepend(logEl);

renderOne(ABS_URL);

printBtn.onclick = () => window.print();
copyBtn.onclick  = () => navigator.clipboard.writeText(location.href);

// ——— helpers ———
function makeQRImage(url, size=148){
  const tmp = document.createElement("div");
  new QRCode(tmp, { text: url, width: size, height: size }); // qrcode.min.js باید قبل از app.js لود شود
  let img = tmp.querySelector("img");
  if(!img){
    const canvas = tmp.querySelector("canvas");
    img = new Image();
    img.src = canvas.toDataURL("image/png");
  }
  img.width = size; img.height = size;
  img.className = "rounded border";
  return img;
}

function renderOne(url){
  grid.innerHTML = "";
  if(!url){ empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");

  const card = document.createElement("div");
  card.className = "overflow-hidden rounded-2xl shadow-sm bg-white border flex flex-col";

  // ویدیو
  const media = document.createElement("div");
  const vid = document.createElement("video");
  vid.controls = true;
  vid.preload = "metadata";
  vid.className = "w-full h-60 object-contain bg-black"; // object-contain تا حتماً دیده شود
  const src = document.createElement("source");
  src.src = url; src.type = "video/mp4";
  vid.appendChild(src);
  media.appendChild(vid);

  // خطای پخش را روی صفحه نشان بده
  vid.addEventListener("error", ()=>{
    const err = vid.error;
    const map = {1:"ABORTED",2:"NETWORK",3:"DECODE",4:"SRC_NOT_SUPPORTED"};
    const code = err?.code || 0;
    const warn = document.createElement("div");
    warn.className = "p-3 mt-2 text-sm rounded bg-red-50 border text-red-700";
    warn.textContent = `پخش ویدیو خطا داد: code=${code} (${map[code]||"UNKNOWN"}) — اگر 404 است مسیر/نام فایل را چک کن؛ اگر DECODE است فایل را به H.264/AAC تبدیل کن.`;
    media.appendChild(warn);
  });

  // بدنه + QR ثابت
  const body = document.createElement("div");
  body.className = "p-4";
  body.innerHTML = `
    <div class="font-semibold text-base">ویدیو</div>
    <div class="mt-2 text-xs text-neutral-600 break-all">
      لینک مستقیم: <a class="underline text-blue-600" href="${url}" target="_blank" rel="noreferrer">${url}</a>
    </div>
  `;

  const row = document.createElement("div");
  row.className = "mt-4 flex items-center gap-3";
  const qr = makeQRImage(url, 148);
  const actions = document.createElement("div");
  actions.className = "flex flex-col gap-2";

  const open = document.createElement("a");
  open.className = "px-3 py-2 rounded bg-black text-white text-sm hover:opacity-90 inline-block";
  open.href = url; open.target="_blank"; open.rel="noreferrer"; open.textContent="Open";

  const copy = document.createElement("button");
  copy.className="px-3 py-2 rounded border text-sm hover:bg-neutral-100";
  copy.textContent="Copy Link";
  copy.onclick=()=> navigator.clipboard.writeText(url);

  const dl = document.createElement("a");
  dl.className="px-3 py-2 rounded border text-sm hover:bg-neutral-100 inline-block";
  dl.textContent="Download QR";
  dl.href = qr.src; dl.download = "video-qr.png";

  actions.append(open, copy, dl);
  row.append(qr, actions);
  body.appendChild(row);

  card.append(media, body);
  grid.appendChild(card);
}
