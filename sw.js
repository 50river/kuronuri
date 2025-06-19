self.addEventListener('install', event => {
  event.waitUntil(caches.open('kuronuri-cache').then(cache => {
    return cache.addAll([
      './',
      './index.html',
      './style.css',
      './app.js',
      'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.5.0/dist/tf.min.js'
    ]);
  }));
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
