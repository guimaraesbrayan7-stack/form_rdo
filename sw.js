// ─── SERVICE WORKER — RDO FORMULÁRIO ────────────────────────────────────────
// Versão do cache: atualize este número sempre que fizer uma nova versão
// do formulário, para forçar os colaboradores a baixar a versão mais nova.
var CACHE_VERSION = 'rdo-v14';
var ARQUIVOS = [
  './',
  './index.html',
];

// Instalação: armazena os arquivos em cache
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      console.log('[SW] Arquivos em cache para uso offline');
      return cache.addAll(ARQUIVOS);
    })
  );
  // Ativa imediatamente sem esperar a aba ser fechada
  self.skipWaiting();
});

// Ativação: remove caches antigos de versões anteriores
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_VERSION; })
            .map(function(key) {
              console.log('[SW] Removendo cache antigo:', key);
              return caches.delete(key);
            })
      );
    })
  );
  self.clients.claim();
});

// Intercepta requisições:
// - Tenta buscar na rede primeiro (versão mais nova)
// - Se falhar (sem internet), serve do cache
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Atualiza o cache com a versão mais nova da rede
        var responseClone = response.clone();
        caches.open(CACHE_VERSION).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(function() {
        // Sem internet: serve do cache
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          // Fallback para o index se não tiver no cache
          return caches.match('./index.html');
        });
      })
  );
});
