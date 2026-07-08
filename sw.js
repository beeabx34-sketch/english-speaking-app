/* 瞬間英作文トレーナー Service Worker
 * アプリ本体をキャッシュし、オフラインでも起動・履歴閲覧を可能にする。
 * Claude API（api.anthropic.com）へのリクエストは一切キャッシュしない。 */
const CACHE = "ess-v7";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  /* API・外部リクエストは素通し（オフライン時はfetch側でエラー処理） */
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  /* アプリ本体: ネットワーク優先・失敗時キャッシュ（更新を取りつつオフライン対応） */
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((hit) => hit || caches.match("./index.html"))
      )
  );
});
