/* ====== تنظیمات ====== */
const CHANNEL_HANDLE = "@harsh_beatz5314"; // ← هندل کانال

/* ====== ابزار ====== */
const logEl = document.getElementById("log");
function log(...args){ try{ logEl.textContent += args.join(" ") + "\n"; }catch(_){} }

function getBaseURL() {
  const { protocol, host, pathname } = window.location;
  const parts = pathname.split("/").filter(Boolean);
  // اگر روی GitHub Pages هستی، parts[0] اسم ریپو است
  return parts.length >= 1 ? `${protocol}//${host}/${parts[0]}/` : `${protocol}//${host}/`;
}
const BASE = getBaseURL();

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ====== 1) ریدایرکت بر اساس ?id=... ====== */
(async function redirectIfNeeded() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) return;
  const notice = document.getElementById("notice");
  try {
    const map = await buildLinkMap();
    log("[redirect] map keys:", Object.keys(map).length);
    const target = map[id];
    if (target) {
      notice?.classList.remove("hidden");
      notice && (notice.innerText = "در حال انتقال به لینک مقصد...");
      setTimeout(() => location.replace(target), 200);
    } else {
      notice?.classList.remove("hidden");
      notice && (notice.innerText = "شناسه‌ی لینک پیدا نشد.");
      log("[redirect] id not found:", id);
    }
  } catch (e) {
    log("[redirect] ERROR:", e?.message || e);
    notice?.classList.remove("hidden");
    notice && (notice.innerText = "خطا در ریدایرکت.");
  }
})();

/* ====== 2) لیست QR ====== */
const qrList   = document.getElementById("qrList");
const emptyEl  = document.getElementById("empty");
const searchEl = document.getElementById("searchInput");
const copyBtn  = document.getElementById("copyBtn");
const printBtn = document.getElementById("printBtn");
const metaEl   = document.getElementById("meta");

let ALL = [];   // {slug,title,url}
let filtered = [];

window.addEventListener("error", (e)=> log("[window.error]", e.message));
window.addEventListener("unhandledrejection", (e)=> log("[promise.reject]", e.reason?.message || e.reason));

init();

async function init() {
  try {
    metaEl.textContent = "در حال یافتن Channel ID ...";
    const { channelId, title: channelTitle } = await resolveChannelIdFromHandle(CHANNEL_HANDLE);
    log("[init] resolved channelId:", channelId, "title:", channelTitle);

    if (!channelId) {
      metaEl.innerHTML = `<span class="text-red-600">Channel ID پیدا نشد. هندل را چک کن.</span>`;
      // fallback: حداقل یک لینک نمونه‌ی کاربر
      ALL = [
        { slug: "D5kJ3z4F30g", title: "Sample (fallback)", url: "https://www.youtube.com/watch?v=D5kJ3z4F30g" }
      ];
      filtered = [...ALL];
      render();
      return;
    }

    metaEl.textContent = `Channel: ${channelTitle || CHANNEL_HANDLE} • ID: ${channelId}`;
    const arr = await fetchVideosByChannelId(channelId);
    log("[init] rss items:", arr.length);

    if (!arr.length) {
      metaEl.innerHTML += " • <span class='text-amber-600'>RSS آیتمی نیاورد (ممکنه موقت باشه).</span>";
      // fallback حداقلی
      ALL = [
        { slug: "D5kJ3z4F30g", title: "Sample (fallback)", url: "https://www.youtube.com/watch?v=D5kJ3z4F30g" }
      ];
    } else {
      ALL = arr;
    }
    filtered = [...ALL];
    render();
  } catch (e) {
    log("[init] ERROR:", e?.message || e);
    metaEl.innerHTML = `<span class="text-red-600">خطا در بارگذاری. صفحه را یک بار با Ctrl+F5 رفرش کن.</span>`;
  }
}

searchEl?.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  filtered = ALL.filter(x => [x.slug, x.title, x.url].join(" ").toLowerCase().includes(q));
  render();
});
copyBtn?.addEventListener("click", () => navigator.clipboard.writeText(location.href));
printBtn?.addEventListener("click", () => window.print());

/* ====== گرفتن Channel ID از روی هندل ======
   از r.jina.ai استفاده می‌کنیم تا CORS مزاحم نشه.
*/
async function resolveChannelIdFromHandle(handle) {
  try {
    const url = `https://r.jina.ai/https://www.youtube.com/${encodeURIComponent(handle)}`;
    const res = await fetch(url);
    const text = await res.text();
    // گزینه‌های مختلف برای استخراج:
    // "channelId":"UCxxxx", "externalId":"UCxxxx", یا canonicalChannelId
    let m = text.match(/"channelId"\\s*:\\s*"((?:UC|UC)[\\w-]{20,})"/);
    if (!m) m = text.match(/"externalId"\\s*:\\s*"((?:UC)[\\w-]{20,})"/);
    if (!m) m = text.match(/"canonicalChannelId"\\s*:\\s*"((?:UC)[\\w-]{20,})"/);
    const t = text.match(/"title"\\s*:\\s*"([^"]+)"/);
    return { channelId: m ? m[1] : null, title: t ? t[1] : null };
  } catch (e) {
    log("[resolveChannelIdFromHandle] ERROR:", e?.message || e);
    return { channelId: null, title: null };
  }
}

/* ====== خواندن RSS کانال ====== */
async function fetchVideosByChannelId(channelId) {
  const list = [];
  try {
    const rss = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const via = `https://r.jina.ai/${rss}`;
    const res = await fetch(via);
    const txt = await res.text();
    const xml = new DOMParser().parseFromString(txt, "application/xml");
    const entries = Array.from(xml.getElementsByTagName("entry"));

    entries.forEach(entry => {
      const title = entry.getElementsByTagName("title")[0]?.textContent || "YouTube Video";
      const link  = entry.getElementsByTagName("link")[0]?.getAttribute("href") || "";
      const vid   = entry.getElementsByTagNameNS("http://www.youtube.com/xml/schemas/2015","videoId")[0]?.textContent
                 || (link ? new URL(link).searchParams.get("v") : null);
      if (link && vid) list.push({ slug: vid, title, url: link });
    });
  } catch (e) {
    log("[fetchVideosByChannelId] ERROR:", e?.message || e);
  }
  // حذف تکراری‌ها
  const seen = new Set();
  return list.filter(x => !seen.has(x.slug) && seen.add(x.slug));
}

/* ====== نقشه‌ی slug→url برای ریدایرکت ====== */
async function buildLinkMap() {
  const { channelId } = await resolveChannelIdFromHandle(CHANNEL_HANDLE);
  const arr = channelId ? await fetchVideosByChannelId(channelId) : [];
  const map = {};
  arr.forEach(x => map[x.slug] = x.url);
  log("[buildLinkMap] built:", Object.keys(map).length);
  return map;
}

/* ====== رندر ====== */
function render() {
  qrList.innerHTML = "";
  if (!filtered.length) {
    emptyEl?.classList.remove("hidden");
    return;
  }
  emptyEl?.classList.add("hidden");

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "p-5 bg-white rounded-2xl border shadow-sm flex flex-col items-center justify-center gap-3";

    const qrHolder = document.createElement("div");
    const qrURL = `${BASE}?id=${encodeURIComponent(item.slug)}`;
    new QRCode(qrHolder, { text: qrURL, width: 180, height: 180 });

    const cap = document.createElement("div");
    cap.className = "text-center";
    cap.innerHTML = `
      <div class="font-semibold text-sm leading-tight">${escapeHtml(item.title)}</div>
      <div class="text-xs text-neutral-500 break-all max-w-[280px]">${escapeHtml(qrURL)}</div>
      <div class="mt-2">
        <a class="text-xs underline text-blue-600 hover:text-blue-800" href="${qrURL}" target="_blank" rel="noreferrer">لینک QR</a>
        <span class="mx-1 text-neutral-400">•</span>
        <a class="text-xs underline text-blue-600 hover:text-blue-800" href="${item.url}" target="_blank" rel="noreferrer">لینک اصلی</a>
      </div>
      <div class="mt-2 text-[11px] text-neutral-500">slug: ${escapeHtml(item.slug)}</div>
    `;

    const copyBtn = document.createElement("button");
    copyBtn.className = "px-3 py-1.5 rounded border text-xs hover:bg-neutral-100";
    copyBtn.textContent = "Copy QR Link";
    copyBtn.onclick = () => navigator.clipboard.writeText(qrURL);

    card.appendChild(qrHolder);
    card.appendChild(cap);
    card.appendChild(copyBtn);
    qrList.appendChild(card);
  });
}
