// Service Worker - t3c0t4z Sistema de Conexão Segura
// Versão: 1.0 (25/10/2025)
// Cache strategy: Network First com fallback para Cache

const CACHE_NAME = 't3c0t4z-v1';
const CACHE_VERSION = '1.0';

// Arquivos para cache
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './config.js',
  
  // Fontes Google
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
  
  // Logo do sistema
  'https://dildpbhnplvynguniwzs.supabase.co/storage/v1/object/public/produtos/logomarca%20para%20n8n%20wbc5.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('✅ [SW t3c0t4z] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ [SW t3c0t4z] Arquivos em cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ [SW t3c0t4z] Erro ao cachear:', error);
      })
  );
  
  // Força o SW a se ativar imediatamente
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ [SW t3c0t4z] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove caches antigos
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ [SW t3c0t4z] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Toma controle imediatamente
  return self.clients.claim();
});

// Fetch - Network First Strategy (tenta rede primeiro, depois cache)
self.addEventListener('fetch', (event) => {
  // Ignora requisições de API/webhook
  if (event.request.url.includes('/json/webhook/')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, clona e guarda no cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar (offline), busca do cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📦 [SW t3c0t4z] Servindo do cache:', event.request.url);
            return cachedResponse;
          }
          
          // Se não tiver no cache, retorna página offline
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
          
          // Para outros recursos, retorna erro genérico
          return new Response(
            'Offline - Recurso não disponível',
            { 
              status: 503, 
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' })
            }
          );
        });
      })
  );
});

// Background Sync (se suportado)
self.addEventListener('sync', (event) => {
  console.log('🔄 [SW t3c0t4z] Background Sync:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Função para sincronizar dados
function syncData() {
  return fetch('/api/sync')
    .then((response) => response.json())
    .then((data) => {
      console.log('✅ [SW t3c0t4z] Dados sincronizados:', data);
    })
    .catch((error) => {
      console.error('❌ [SW t3c0t4z] Erro ao sincronizar:', error);
    });
}

// Push Notifications (opcional)
self.addEventListener('push', (event) => {
  console.log('🔔 [SW t3c0t4z] Push recebido');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 't3c0t4z';
  const options = {
    body: data.body || 'Nova atualização disponível!',
    icon: 'https://dildpbhnplvynguniwzs.supabase.co/storage/v1/object/public/produtos/logomarca%20para%20n8n%20wbc5.png',
    badge: 'https://dildpbhnplvynguniwzs.supabase.co/storage/v1/object/public/produtos/logomarca%20para%20n8n%20wbc5.png',
    vibrate: [200, 100, 200],
    tag: 't3c0t4z-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW t3c0t4z] Notificação clicada:', event.action);
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('✅ [SW t3c0t4z] Service Worker carregado - v' + CACHE_VERSION);
