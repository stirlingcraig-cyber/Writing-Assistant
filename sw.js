// Offline cache for the Executive Writing Assistant (GitHub Pages).
const CACHE = "ewa-v1";
const SHELL = ["./", "./index.html", "./assistant.html", "./manifest.webmanifest", "./assistant.webmanifest",
  "./icon-192.png", "./icon-512.png", "./icon-touch.png", "./assist-192.png", "./assist-512.png", "./assist-touch.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;                       // never touch Claude/API calls
  if (url.origin === location.origin){
    // Pages: network first (always get updates), fall back to cache offline.
    if (req.mode === "navigate" || url.pathname.endsWith(".html")){
      e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
      return;
    }
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
    return;
  }
  // Fonts and on-device reading files from CDNs: cache after first use.
  if (/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.hostname)){
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { if (res.ok || res.type === "opaque"){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
  }
});
