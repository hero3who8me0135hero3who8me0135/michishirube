// アプリ本体を直したときは、下の版番号の数字を1つ上げてからアップロードしてください。
// stories.json（人物）は版番号を変えなくても、ネットにつながっていれば最新が読み込まれます。
const CACHE = "michishirube-v2";
const FILES = ["./","./index.html","./stories.json","./manifest.webmanifest",
  "./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./icons/apple-touch-icon.png",
  "./fonts/BIZUDPGothic-Regular.woff2","./fonts/BIZUDPGothic-Bold.woff2","./fonts/ZenMaruGothic-Medium.woff2",
  "./fonts/ZenMaruGothic-Bold.woff2","./fonts/YuseiMagic-Regular.woff2"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const url = new URL(req.url);
  // 人物ファイル：まずネットから最新を取り、だめなら保存してある版
  if (url.pathname.endsWith("/stories.json")) {
    e.respondWith(fetch(req).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put("./stories.json", res.clone())); return res; })
      .catch(() => caches.match("./stories.json")));
    return;
  }
  // それ以外：保存してある版をすぐ表示し、裏で新しい版を取りに行く
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = req.mode === "navigate" ? "./index.html" : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const fresh = fetch(req).then(res => { if (res && res.ok) cache.put(key, res.clone()); return res; }).catch(() => cached);
    return cached || fresh;
  }));
});
