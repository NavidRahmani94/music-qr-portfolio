/* ====== تنظیمات ====== */

/** اگر روی GitHub Pages هستی، مسیر پایه ریپو مثل /music-qr-portfolio/ است.
 *  این تابع اگر یک URL با / شروع شود (نسبیِ ریشه)، خودکار base را اضافه می‌کند.
 */
function withBase(u) {
  if (!u || !u.startsWith('/')) return u;
  // مثال: /music-qr-portfolio/ از مسیر فعلی می‌گیریم
  const parts = window.location.pathname.split('/');
  // ['', 'username.github.io'?, 'repo', '...'] → معمولا ['', 'music-qr-portfolio', '...']
  // امن‌تر: اگر بخش دوم اسم ریپو است، همان را برگردان
  const repo = parts.length > 1 ? parts[1] : '';
  const base = repo ? `/${repo}` : '';
  return `${base}${u}`;
}

/** نمونه‌ها: با لینک‌های خودت عوض کن. */
const VIDEOS = [
  {
    title: "Sample Track – Live Session",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    tags: ["live", "pop", "2025"],
  },
  {
    title: "Music Video – Night Drive",
    platform: "Vimeo",
    url: "https://vimeo.com/76979871",
    thumbnail:
      "https://images.unsplash.com/photo-1504203700686-7f7b76df0570?q=80&w=1480&auto=format&fit=crop",
    tags: ["mv", "cinematic", "2024"],
  },
  {
    title: "Local MP4 (hosted on GitHub)",
    platform: "Local",
    url: withBase("/assets/videos/track1.mp4"),          // اگر فایل ویدیویی داری اینجا بذار
    thumbnail: withBase("/assets/thumbs/track1.jpg"),    // کاور اختیاری
    tags: ["mp4", "studio"],
  },
];

/* ====== DOM ====== */

const cardsView = document.getElementById("cardsView");
const qrView = document.getElementById("qrView");
const toggleBtn = document.getElementById("toggleBtn");
const searchInput = document.getElementById("searchInput");
const copyBtn = document.getElementById("copyBtn");
const shareBtn = document.getElementById("shareBtn");

let qrOnly = false;
let filtered = [...VIDEOS];

function render() {
  // Cards
  cardsView.innerHTML = "";
  filtered.forEach((v) => cardsView.appendChild(makeCard(v)));

  // QR sheet
  qrView.innerHTML = "";
  filtered.forEach((v) => qrView.appendChild(makeQRCard(v)));

  // Toggle visibility
  cardsView.classList.toggle("hidden", qrOnly);
  qrView.classList.toggle("hidden", !qrOnly);
  toggleBtn.textContent = qrOnly ? "Show Cards" : "Print QR Sheet";
}

function makeCard(v) {
  const card = document.createElement("div");
  card.className = "overflow-hidden rounded-2xl shadow-sm hover:shadow transition bg-white border";

  const image = document.createElement("a");
  image.href = v.url;
  image.target = "_blank";
  image.rel = "noreferrer";
  image.innerHTML = `<img src="${v.thumbnail || 'https://placehold.co/600x300'}"
                        alt="${escapeHtml(v.title)}"
                        class="w-full h-44 object-cover" />`;

  const tags = document.createElement("div");
  tags.className = "absolute bottom-2 left-2 flex flex-wrap gap-1";
  (v.tags || []).forEach(t => {
    const b = document.createElement("span");
    b.className = "text-[10px] px-2 py-0.5 rounded bg-black/70 text-white";
    b.textContent = t;
    tags.appendChild(b);
  });

  const wrapper = document.createElement("div");
  wrapper.className = "relative";
  wrapper.appendChild(image);
  wrapper.appendChild(tags);

  const body = document.createElement("div");
  body.className = "p-4";

  const title = document.createElement("div");
  title.className = "font-semibold text-base leading-tight line-clamp-2";
  title.textContent = v.title;

  const platform = document.createElement("div");
  platform.className = "text-xs text-neutral-500 mt-1";
  platform.textContent = v.platform;

  const btns = document.createElement("div");
  btns.className = "mt-3 flex items-center gap-2";

  const open = document.createElement("a");
  open.className = "px-3 py-2 rounded bg-black text-white text-sm hover:opacity-90";
  open.href = v.url;
  open.target = "_blank";
  open.rel = "noreferrer";
  open.textContent = "Open";

  const copy = document.createElement("button");
  copy.className = "px-3 py-2 rounded border text-sm hover:bg-neutral-100";
  copy.textContent = "Copy Link";
  copy.onclick = () => navigator.clipboard.writeText(v.url);

  const qrBtn = document.createElement("button");
  qrBtn.className = "px-3 py-2 rounded text-sm hover:bg-neutral-100";
  qrBtn.textContent = "Show QR";
  const qrBox = document.createElement("div");
  qrBox.className = "mt-4 p-3 bg-neutral-50 border rounded-xl hidden items-center justify-center";
  qrBtn.onclick = () => {
    const vis = qrBox.classList.toggle("hidden");
    qrBtn.textContent = vis ? "Show QR" : "Hide QR";
    if (!vis && !qrBox.dataset.ready) {
      new QRCode(qrBox, { text: v.url, width: 148, height: 148 });
      qrBox.dataset.ready = "1";
    }
  };

  btns.appendChild(open);
  btns.appendChild(copy);
  btns.appendChild(qrBtn);

  body.appendChild(title);
  body.appendChild(platform);
  body.appendChild(btns);
  body.appendChild(qrBox);

  card.appendChild(wrapper);
  card.appendChild(body);
  return card;
}

function makeQRCard(v) {
  const box = document.createElement("div");
  box.className = "p-5 bg-white rounded-2xl border shadow-sm flex flex-col items-center justify-center gap-3";
  const holder = document.createElement("div");
  holder.className = "flex items-center justify-center";
  new QRCode(holder, { text: v.url, width: 180, height: 180 });
  const cap = document.createElement("div");
  cap.className = "text-center";
  cap.innerHTML = `
    <div class="font-semibold text-sm leading-tight">${escapeHtml(v.title)}</div>
    <div class="text-xs text-neutral-500 break-all max-w-[280px]">${escapeHtml(v.url)}</div>
  `;
  box.appendChild(holder);
  box.appendChild(cap);
  return box;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ====== تعامل ====== */
toggleBtn.onclick = () => { qrOnly = !qrOnly; render(); };

searchInput.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  filtered = VIDEOS.filter(v =>
    [v.title, v.platform, (v.tags || []).join(" ")].join(" ").toLowerCase().includes(q)
  );
  render();
});

copyBtn.onclick = () => navigator.clipboard.writeText(window.location.href);
shareBtn.onclick = () => navigator.share?.({ title: "My Music Portfolio", url: window.location.href });

/* شروع */
render();
