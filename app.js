/* ====== تنظیمات اولیه ====== */
let CHANNEL_HANDLE = "@harsh_beatz5314"; // اگر هندل تغییر کرد اینجا عوض کن

/* ====== ابزار ====== */
const logEl = document.getElementById("log");
function log(...args){ try{ logEl.textContent += args.join(" ") + "\n"; }catch(_){} }

function getBaseURL() {
  const { protocol, host, pathname } = window.location;
  const parts = pathname.split("/").filter(Boolean);
  return parts.length >= 1 ? `${protocol}//${host}/${parts[0]}/` : `${protocol}//${host}/`;
}
const BASE = getBaseURL();

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

const qrList   = document.getElementById("qrList");
const emptyEl  = document.getElementById("empty");
const searchEl = document.getElementById("searchInput");
const copyBtn  = document.getElementById("copyBtn");
const printBtn = document.getElementById("printBtn");
const metaEl   = document.getElementById("meta");
const notice   = document.getElementById("notice");

/* ====== 1) ریدایرکت براساس ?id=... ====== */
(async function redirectIfNeeded() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) return;
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
let ALL = [];   // {slug,title,url}
let filtered = [];

window.addEventListener("error", (e)=> log("[window.error]", e.message));
window.addEventListener("unhandledrejection", (e)=> log("[promise.reject]", e.reason?.message || e.reason));

init();

async function init() {
  try {
    metaEl.innerHTML = `در حال یافتن Channel ID از هندل <b>${escapeHtml(CHANNEL_HANDLE)}</b> ...`;

    let { channelId, title: channelTitle } = await resolveChannelIdFromHandle(CHANNEL_HANDLE);
    log("[init] resolved channelId:", channelId, "title:", channelTitle);

    // اگر پیدا نشد، UI دستی نشان بده
    if (!channelId) {
      showManualInput();
      metaEl.innerHTML = `<span class="text-red-600">Channel ID پیدا نشد. هندل را چک کن یا از ورودی دستی پایین استفاده کن.</span>`;
      // یک fallback حداقلی تا صفحه خالی نباشه
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
      metaEl.innerHTML += " • <span class='text-amber-600'>RSS آیتمی نیاورد (احتمالاً محدودیت موقتی).</span>";
      // fallback
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
    metaEl.innerHTML = `<span class="text-red-600">خطا در بارگذاری. یک‌بار با Ctrl+F5 رفرش کن.</span>`;
  }
}

/* ====== جست‌وجو/کپی/پرینت ====== */
searchEl?.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  filtered = ALL.filter(x => [x.slug, x.title, x.url].join(" ").toLowerCase().includes(q));
  render();
});
copyBtn?.addEventListener("click", () => navigator.clipboard.writeText(location.href));
printBtn?.addEventListener("click", () => window.print());

/* ====== ورودی دستی درصورت خطا ====== */
function showManualInput() {
  const wrap = document.createElement("div");
  wrap.className = "mb-4 p-3 bg-white border rounded-xl";
  wrap.innerHTML = `
    <div class="text-sm mb-2">نشد خودکار پیدا کنم. یکی از اینها را وارد کن و Enter بزن:</div>
    <ul class="list-disc ml-6 text-xs mb-2">
      <li>Channel ID (با UC شروع می‌شود)، مثلا: <code class="bg-neutral-100 px-1 rounded">UCxxxxxxxxxxxxxxxx</code></li>
      <li>یا لینک کانال (مثل <code class="bg-neutral-100 px-1 rounded">https://www.youtube.com/@your_handle</code> یا <code class="bg-neutral-100 px-1 rounded">https://www.youtube.com/channel/UC...</code>)</li>
    </ul>
    <input id="manualInput" class="w-full border rounded px-3 py-2 text-sm" placeholder="Channel ID یا لینک کانال">
  `;
  metaEl.after(wrap);
  const input = wrap.querySelector("#manualInput");
  input.addEventListener("keydown", async (e)=>{
    if (e.key !== "Enter") return;
    const v = String(input.value || "").trim();
    if (!v) return;
    let channelId = null;

    // اگر مستقیم UC... بود
    if (/^UC[\w-]{20,}$/.test(v)) {
      channelId = v;
    }
    // اگر لینک /channel/UC... بود
    const m1 = v.match(/\/channel\/(UC[\w-]{20,})/i);
    if (!channelId && m1) channelId = m1[1];

    // اگر لینک @handle بود، دوباره تلاش کن
    const m2 = v.match(/youtube\.com\/(@[A-Za-z0-9._-]+)/);
    if (!channelId && m2) {
      const r = await resolveChannelIdFromHandle(m2[1]);
      channelId = r.channelId;
    }

    if (!channelId) {
      alert("نتوانستم Channel ID را از ورودی تشخیص دهم.");
      return;
    }

    metaEl.textContent = `Channel ID: ${channelId}`;
    const arr = await fetchVideosByChannelId(channelId);
    ALL = arr.length ? arr : [
      { slug: "D5kJ3z4F30g", title: "Sample (fallback)", url: "https://www.youtube.com/watch?v=D5kJ3z4F30g" }
    ];
    filtered = [...ALL];
    render();
  });
}

/* ====== پیدا کردن Channel ID از هندل — نسخه مقاوم ====== */
async function resolveChannelIdFromHandle(handle) {
  // چند URL مختلف برای افزایش شانس
  const paths = ["", "/about", "/videos"];
  const schemes = ["https://", "http://"];
  const tries = [];
  for (const sch of schemes) {
    for (const p of paths) {
      tries.push(`https://r.jina.ai/${sch}www.youtube.com/${encodeURIComponent(handle)}${p}`);
    }
  }

  for (const url of tries) {
    try {
      log("[resolve] try:", url);
      const res = await fetch(url);
      if (!res.ok) { log("[resolve] bad status:", res.status); continue; }
      const text = await res.text();

      // چند الگوی احتمالی
      const patterns = [
        /"channelId"\s*:\s*"(UC[\w-]{20,})"/,
        /"externalId"\s*:\s*"(UC[\w-]{20,})"/,
        /"canonicalChannelId"\s*:\s*"(UC[\w-]{20,})"/,
        /"browseId"\s*:\s*"(UC[\w-]{20,})"/,
        /href="\/channel\/(UC[\w-]{20,})"/
      ];

      for (const re of patterns) {
        const m = text.match(re);
        if (m && m[1]) {
          const t = text.match(/"title"\s*:\s*"([^"]+)"/);
          log("[resolve] FOUND id:", m[1]);
          return { channelId: m[1], title: t ? t[1] : null };
        }
      }
    } catch (e) {
      log("[resolve] error:", e?.message || e);
    }
  }
  return { channelId: null, title: null };
}

/* ====== خواندن RSS کانال ====== */
async function fetchVideosByChannelId(channelId) {
  const list = [];
  try {
    const rss = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const via = `https://r.jina.ai/${rss}`;
    log("[rss] GET", via);
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
    log("[rss] ERROR:", e?.message || e);
  }
  // حذف تکراری‌ها
  const seen = new Set();
  return list.filter(x => !seen.has(x.slug) && seen.add(x.slug));
}

/* ====== نقشه slug→url (برای ریدایرکت) ====== */
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
