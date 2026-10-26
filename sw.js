'use strict';
/* オフラインでも開けるようにする(ホーム画面に入れたあと、電波がなくても起動する)。
   アプリは index.html 1枚 で完結しているので、それと アイコン類だけを覚えておく。
   index.html を直しただけなら VERSION は そのままでいい(開くたびに、まずネットで最新を取りにいくので)。
   FILES(覚えるファイル)を変えたときだけ VERSION を 1つ上げる(古い覚えを 一斉に捨てる)。 */
const VERSION = 'rupe-v2';
const FILES = ['./', 'index.html', 'install.js', 'shots/1.jpg', 'shots/2.jpg', 'shots/3.jpg', 'shots/4.jpg', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

/* 開くときは まずネットで最新を取りにいく。3秒つながらなければ 覚えているものを出す(電波が弱い所で 黒い画面のまま 待たせない)。 */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const nav = req.mode === 'navigate';
  const key = nav ? './' : req;   // ページは ?... がついても 1つとして覚える
  const net = fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); e.waitUntil(caches.open(VERSION).then((c) => c.put(key, copy))); }
    return res;
  });
  const late = new Promise((r) => setTimeout(r, 3000));
  const fromCache = () => caches.match(key, { ignoreSearch: nav }).then((hit) => hit || caches.match('index.html'));
  e.respondWith(
    Promise.race([net, late.then(() => fromCache().then((hit) => hit || net))])
      .then((res) => res || net)
      .catch(() => fromCache())
  );
});
